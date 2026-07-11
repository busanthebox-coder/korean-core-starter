import { beforeEach, describe, expect, it } from 'vitest';
import {
  BACKUP_KEYS,
  BACKUP_META,
  backupReminderState,
  exportProgress,
  importProgress,
  mergeStrategies,
} from './backup.js';

const NOW = new Date('2026-07-08T12:00:00+09:00').getTime();
const DAY = 24 * 60 * 60 * 1000;

function seedProgress() {
  localStorage.setItem('kcs.roman', '0');
  localStorage.setItem('kcs.progress', JSON.stringify(['chapter-01', 'chapter-02']));
  localStorage.setItem('kcs.lesson-activity-v1', JSON.stringify({
    'chapter-01': { dialogueSeen: true, updatedAt: 10 },
  }));
  localStorage.setItem('kcs.lesson-position-v1', JSON.stringify({
    'chapter-01': { index: 4, updatedAt: 10 },
  }));
  localStorage.setItem('kcs.guide-ready-v1', JSON.stringify(['guide-a']));
  localStorage.setItem('kcs.shadow-done-v1', JSON.stringify(['dialogue-a']));
  localStorage.setItem('kcs.spoken-v1', JSON.stringify({
    'chapter-01': ['2026-07-08'],
  }));
  localStorage.setItem('kcs.packs-v1', JSON.stringify(['pack-a']));
  localStorage.setItem('kcs.orientation-v1', '1');
  localStorage.setItem('kcs.ime-fallback-v1', '1');
  localStorage.setItem('kcs.roman-nudge-v1', '1');
  localStorage.setItem('kcs.onboarded-v1', '1');
  localStorage.setItem('kcs.start-chapter-v1', 'chapter-17');
  localStorage.setItem('kcs.learn-open-v1', JSON.stringify(['A1', 'B1']));
  localStorage.setItem('kcs.checkpoint-v1', JSON.stringify({
    a1: { best: 8, last: 7, total: 10, lastAt: 100, weakChapterIds: ['chapter-02'] },
  }));
  localStorage.setItem('kcs.readers-v1', JSON.stringify({
    'reader-a': { readAt: 100, score: 3, total: 4, summary: '좋아요' },
  }));
  localStorage.setItem('ksrs-v1', JSON.stringify({
    wordA: { box: 3, due: 500, reps: 7, lapses: 1 },
  }));
  localStorage.setItem('kcs.mistakes-v1', JSON.stringify({
    wordB: { misses: 2, lastMissed: 900 },
  }));
  localStorage.setItem('kcs.study-v1', JSON.stringify({
    goal: 20,
    log: { '2026-07-07': 5 },
  }));
  localStorage.setItem('kcs.streak-v1', JSON.stringify({
    current: 3,
    best: 5,
    lastDay: '2026-07-08',
  }));
  localStorage.setItem('kcs.writings-v1', JSON.stringify({
    'chapter-01': [{ text: '오늘은 공부했어요.', date: 100, checked: true }],
  }));
}

beforeEach(() => {
  localStorage.clear();
});

describe('progress backup', () => {
  it('exports only present backup keys as raw strings', () => {
    seedProgress();

    const backup = exportProgress(NOW);

    expect(backup).toMatchObject({
      version: 1,
      app: 'korean-core-starter',
      exportedAt: NOW,
    });
    expect(backup.data['kcs.progress']).toBe(JSON.stringify(['chapter-01', 'chapter-02']));
    expect(backup.data[BACKUP_META.lastBackupAt]).toBeUndefined();
    expect(Object.keys(backup.data).sort()).toEqual(BACKUP_KEYS.slice().sort());
  });

  it('round-trips exported progress after localStorage is cleared', () => {
    seedProgress();
    const backup = exportProgress(NOW);
    localStorage.clear();

    const result = importProgress(backup);

    expect(result.ok).toBe(true);
    expect(result.imported.sort()).toEqual(Object.keys(backup.data).sort());
    for (const key of Object.keys(backup.data)) {
      expect(localStorage.getItem(key), key).toBe(backup.data[key]);
    }
  });

  it('merges two device backups instead of overwriting local progress', () => {
    localStorage.setItem('kcs.progress', JSON.stringify(['chapter-01', 'chapter-local']));
    localStorage.setItem('kcs.guide-ready-v1', JSON.stringify(['guide-local']));
    localStorage.setItem('kcs.learn-open-v1', JSON.stringify(['A1']));
    localStorage.setItem('kcs.lesson-activity-v1', JSON.stringify({
      'chapter-01': { dialogueSeen: true, updatedAt: 20 },
      'chapter-local': { practiceDone: true, updatedAt: 30 },
    }));
    localStorage.setItem('kcs.lesson-position-v1', JSON.stringify({
      'chapter-01': { index: 2, updatedAt: 20 },
      'chapter-local': { index: 3, updatedAt: 30 },
    }));
    localStorage.setItem('kcs.spoken-v1', JSON.stringify({
      'chapter-01': ['2026-07-08'],
      'chapter-local': ['2026-07-09'],
    }));
    localStorage.setItem('ksrs-v1', JSON.stringify({
      wordA: { box: 1, due: 400, reps: 2, lapses: 0 },
      wordLocal: { box: 2, due: 600, reps: 4, lapses: 0 },
    }));
    localStorage.setItem('kcs.mistakes-v1', JSON.stringify({
      wordB: { misses: 1, lastMissed: 100 },
    }));
    localStorage.setItem('kcs.study-v1', JSON.stringify({
      goal: 10,
      log: { '2026-07-07': 2, '2026-07-08': 1 },
    }));
    localStorage.setItem('kcs.streak-v1', JSON.stringify({
      current: 4,
      best: 8,
      lastDay: '2026-07-08',
    }));
    localStorage.setItem('kcs.writings-v1', JSON.stringify({
      'chapter-01': [
        { text: '로컬 글', date: 10, checked: true },
        { text: '같은 글', date: 20, checked: false },
      ],
    }));
    localStorage.setItem('kcs.start-chapter-v1', 'chapter-local');

    const incoming = {
      version: 1,
      app: 'korean-core-starter',
      exportedAt: NOW,
      data: {
        'kcs.progress': JSON.stringify(['chapter-remote', 'chapter-01']),
        'kcs.guide-ready-v1': JSON.stringify(['guide-remote']),
        'kcs.learn-open-v1': JSON.stringify(['B1']),
        'kcs.lesson-activity-v1': JSON.stringify({
          'chapter-01': { dialogueSeen: false, practiceDone: true, updatedAt: 50 },
          'chapter-remote': { dialogueSeen: true, updatedAt: 40 },
        }),
        'kcs.lesson-position-v1': JSON.stringify({
          'chapter-01': { index: 8, updatedAt: 50 },
          'chapter-remote': { index: 1, updatedAt: 40 },
        }),
        'kcs.spoken-v1': JSON.stringify({
          'chapter-01': ['2026-07-08', '2026-07-10'],
          'chapter-remote': ['2026-07-09'],
        }),
        'ksrs-v1': JSON.stringify({
          wordA: { box: 5, due: 900, reps: 5, lapses: 1 },
          wordRemote: { box: 1, due: 100, reps: 1, lapses: 0 },
        }),
        'kcs.mistakes-v1': JSON.stringify({
          wordB: { misses: 3, lastMissed: 200 },
        }),
        'kcs.study-v1': JSON.stringify({
          goal: 30,
          log: { '2026-07-07': 8, '2026-07-09': 4 },
        }),
        'kcs.streak-v1': JSON.stringify({
          current: 2,
          best: 10,
          lastDay: '2026-07-09',
        }),
        'kcs.writings-v1': JSON.stringify({
          'chapter-01': [
            { text: '같은 글', date: 20, checked: true },
            { text: '원격 글', date: 30, checked: false },
          ],
          'chapter-02': [{ text: '다른 챕터', date: 40, checked: true }],
        }),
        'kcs.start-chapter-v1': 'chapter-remote',
      },
    };

    const result = importProgress(incoming);

    expect(result.ok).toBe(true);
    expect(JSON.parse(localStorage.getItem('kcs.progress')).sort()).toEqual([
      'chapter-01',
      'chapter-local',
      'chapter-remote',
    ]);
    expect(JSON.parse(localStorage.getItem('kcs.guide-ready-v1')).sort()).toEqual(['guide-local', 'guide-remote']);
    expect(JSON.parse(localStorage.getItem('kcs.learn-open-v1')).sort()).toEqual(['A1', 'B1']);
    expect(JSON.parse(localStorage.getItem('kcs.lesson-activity-v1'))['chapter-01']).toEqual({
      dialogueSeen: false,
      practiceDone: true,
      updatedAt: 50,
    });
    expect(JSON.parse(localStorage.getItem('kcs.lesson-position-v1'))).toEqual({
      'chapter-01': { index: 8, updatedAt: 50 },
      'chapter-local': { index: 3, updatedAt: 30 },
      'chapter-remote': { index: 1, updatedAt: 40 },
    });
    expect(JSON.parse(localStorage.getItem('kcs.spoken-v1'))).toEqual({
      'chapter-01': ['2026-07-08', '2026-07-10'],
      'chapter-local': ['2026-07-09'],
      'chapter-remote': ['2026-07-09'],
    });
    expect(JSON.parse(localStorage.getItem('ksrs-v1')).wordA.reps).toBe(5);
    expect(JSON.parse(localStorage.getItem('ksrs-v1')).wordLocal.reps).toBe(4);
    expect(JSON.parse(localStorage.getItem('kcs.mistakes-v1')).wordB.misses).toBe(3);
    expect(JSON.parse(localStorage.getItem('kcs.study-v1'))).toEqual({
      goal: 30,
      log: { '2026-07-07': 8, '2026-07-08': 1, '2026-07-09': 4 },
    });
    expect(JSON.parse(localStorage.getItem('kcs.streak-v1'))).toEqual({
      current: 2,
      best: 10,
      lastDay: '2026-07-09',
    });
    expect(JSON.parse(localStorage.getItem('kcs.writings-v1'))).toEqual({
      'chapter-01': [
        { text: '로컬 글', date: 10, checked: true },
        { text: '같은 글', date: 20, checked: false },
        { text: '원격 글', date: 30, checked: false },
      ],
      'chapter-02': [{ text: '다른 챕터', date: 40, checked: true }],
    });
    expect(localStorage.getItem('kcs.start-chapter-v1')).toBe('chapter-remote');
  });

  it('keeps localStorage unchanged when the file version is unsupported', () => {
    seedProgress();
    const before = exportProgress(NOW).data;

    const result = importProgress({ version: 2, app: 'korean-core-starter', data: { 'kcs.progress': '[]' } });

    expect(result.ok).toBe(false);
    for (const [key, value] of Object.entries(before)) expect(localStorage.getItem(key)).toBe(value);
  });

  it('skips unknown keys and corrupt per-key values without failing the whole import', () => {
    localStorage.setItem('kcs.progress', JSON.stringify(['chapter-local']));

    const result = importProgress({
      version: 1,
      app: 'korean-core-starter',
      data: {
        'kcs.progress': JSON.stringify(['chapter-remote']),
        'future-key': JSON.stringify({ ok: true }),
        'ksrs-v1': '{not json',
      },
    });

    expect(result.ok).toBe(true);
    expect(result.imported).toEqual(['kcs.progress']);
    expect(result.skipped.sort()).toEqual(['future-key', 'ksrs-v1']);
    expect(JSON.parse(localStorage.getItem('kcs.progress')).sort()).toEqual(['chapter-local', 'chapter-remote']);
    expect(localStorage.getItem('ksrs-v1')).toBeNull();
  });

  it('exports a valid empty backup structure', () => {
    expect(exportProgress(NOW)).toEqual({
      version: 1,
      app: 'korean-core-starter',
      exportedAt: NOW,
      data: {},
    });
  });

  it('reports when the learner has progress but no recent backup', () => {
    localStorage.setItem('kcs.progress', JSON.stringify(['chapter-01']));

    expect(backupReminderState(NOW).shouldRemind).toBe(true);

    localStorage.setItem(BACKUP_META.lastBackupAt, String(NOW - 29 * DAY));
    expect(backupReminderState(NOW).shouldRemind).toBe(false);
  });

  it('uses SRS tie-breaker due date when reps are equal', () => {
    const mine = JSON.stringify({ wordA: { box: 2, due: 700, reps: 4, lapses: 1 } });
    const theirs = JSON.stringify({ wordA: { box: 1, due: 300, reps: 4, lapses: 0 } });

    expect(JSON.parse(mergeStrategies('ksrs-v1', mine, theirs)).wordA.due).toBe(300);
  });

  it('merges streak by latest day while keeping the best record', () => {
    const mine = JSON.stringify({ current: 7, best: 12, lastDay: '2026-07-08' });
    const theirs = JSON.stringify({ current: 2, best: 9, lastDay: '2026-07-09' });

    expect(JSON.parse(mergeStrategies('kcs.streak-v1', mine, theirs))).toEqual({
      current: 2,
      best: 12,
      lastDay: '2026-07-09',
    });
  });

  it('merges spoken lesson days by chapter', () => {
    const mine = JSON.stringify({
      'chapter-01': ['2026-07-08'],
      'chapter-02': ['2026-07-09'],
    });
    const theirs = JSON.stringify({
      'chapter-01': ['2026-07-08', '2026-07-10'],
    });

    expect(JSON.parse(mergeStrategies('kcs.spoken-v1', mine, theirs))).toEqual({
      'chapter-01': ['2026-07-08', '2026-07-10'],
      'chapter-02': ['2026-07-09'],
    });
  });
});
