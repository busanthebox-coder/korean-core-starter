import { describe, it, expect, beforeEach } from 'vitest';
import { get } from 'svelte/store';
import {
  romanizationVisible,
  toggleRomanization,
  imeFallbackEnabled,
  learnOpenGroups,
  checkpointProgress,
  lessonActivity,
  lessonProgress,
  readerProgress,
  spokenProgress,
  markOrientationDone,
  markRomanNudgeSeen,
  markDialogueSeen,
  markLessonDone,
  markLessonPracticed,
  orientationDone,
  romanNudgeSeen,
  guideProgress,
  resetOrientationDone,
  resetRomanNudgeSeen,
  resetLessonActivity,
  resetCheckpointProgress,
  resetLessonProgress,
  resetReaderProgress,
  recordSpokenChapter,
  recordReaderResult,
  resetSpokenProgress,
  spokenDayCount,
  recordCheckpointResult,
  setImeFallback,
  resetLearnOpenGroups,
  toggleLearnOpenGroup,
  toggleGuideReady,
  toggleImeFallback,
  toggleLessonDone,
  unmarkLessonDone,
  roleplayRegister,
  setRoleplayRegister,
  filterByRegister,
} from './stores.js';

beforeEach(() => {
  localStorage.clear();
  resetLessonActivity();
  resetCheckpointProgress();
  resetLessonProgress();
  resetReaderProgress();
  resetSpokenProgress();
  resetLearnOpenGroups();
  resetOrientationDone();
  resetRomanNudgeSeen();
  setImeFallback(false);
});

describe('stores', () => {
  it('romanization toggles', () => {
    romanizationVisible.set(true);
    expect(get(romanizationVisible)).toBe(true);
    toggleRomanization();
    expect(get(romanizationVisible)).toBe(false);
  });
  it('marks a lesson done and persists', () => {
    markLessonDone('chapter-01');
    expect(get(lessonProgress).has('chapter-01')).toBe(true);
    expect(JSON.parse(localStorage.getItem('kcs.progress'))).toContain('chapter-01');
  });

  it('unmarks and toggles lesson completion', () => {
    markLessonDone('chapter-01');
    unmarkLessonDone('chapter-01');
    expect(get(lessonProgress).has('chapter-01')).toBe(false);

    toggleLessonDone('chapter-01');
    expect(get(lessonProgress).has('chapter-01')).toBe(true);
    toggleLessonDone('chapter-01');
    expect(get(lessonProgress).has('chapter-01')).toBe(false);
  });

  it('resets lesson progress', () => {
    markLessonDone('chapter-01');
    markLessonDone('chapter-02');
    resetLessonProgress();
    expect([...get(lessonProgress)]).toEqual([]);
    expect(JSON.parse(localStorage.getItem('kcs.progress'))).toEqual([]);
  });

  it('tracks per-chapter lesson activity', () => {
    markDialogueSeen('chapter-01');
    markLessonPracticed('chapter-01');
    const state = get(lessonActivity);
    expect(state['chapter-01'].dialogueSeen).toBe(true);
    expect(state['chapter-01'].practiceDone).toBe(true);
    expect(JSON.parse(localStorage.getItem('kcs.lesson-activity-v1'))['chapter-01'].practiceDone).toBe(true);

    resetLessonActivity();
    expect(get(lessonActivity)).toEqual({});
  });

  it('toggles guide unit readiness', () => {
    toggleGuideReady('unit-a');
    expect(get(guideProgress).has('unit-a')).toBe(true);
    toggleGuideReady('unit-a');
    expect(get(guideProgress).has('unit-a')).toBe(false);
  });

  it('tracks opened Learn accordion groups', () => {
    toggleLearnOpenGroup('B1');
    expect(get(learnOpenGroups).has('B1')).toBe(true);
    expect(JSON.parse(localStorage.getItem('kcs.learn-open-v1'))).toEqual(['B1']);

    toggleLearnOpenGroup('B1');
    expect(get(learnOpenGroups).has('B1')).toBe(false);
  });

  it('records checkpoint best, last, and weak chapters', () => {
    recordCheckpointResult('a1-foundation', {
      score: 14,
      total: 20,
      weakChapterIds: ['chapter-03', 'chapter-07'],
    }, 10);
    recordCheckpointResult('a1-foundation', {
      score: 12,
      total: 20,
      weakChapterIds: ['chapter-05'],
    }, 20);

    expect(get(checkpointProgress)['a1-foundation']).toEqual({
      best: 14,
      last: 12,
      total: 20,
      lastAt: 20,
      weakChapterIds: ['chapter-05'],
    });
    expect(JSON.parse(localStorage.getItem('kcs.checkpoint-v1'))['a1-foundation'].best).toBe(14);
  });

  it('records Reading Room progress with score and read time', () => {
    recordReaderResult('reader-a1-01', { score: 3, total: 4, summary: '짧은 요약' }, 1234);

    expect(get(readerProgress)['reader-a1-01']).toEqual({
      readAt: 1234,
      score: 3,
      total: 4,
      summary: '짧은 요약',
    });
    expect(JSON.parse(localStorage.getItem('kcs.readers-v1'))['reader-a1-01'].score).toBe(3);

    resetReaderProgress();
    expect(get(readerProgress)).toEqual({});
  });

  it('records spoken lesson days without duplicating the same day', () => {
    recordSpokenChapter('chapter-01', new Date('2026-07-10T10:00:00+09:00').getTime());
    recordSpokenChapter('chapter-01', new Date('2026-07-10T20:00:00+09:00').getTime());
    recordSpokenChapter('chapter-02', new Date('2026-07-11T10:00:00+09:00').getTime());

    expect(get(spokenProgress)).toEqual({
      'chapter-01': ['2026-07-10'],
      'chapter-02': ['2026-07-11'],
    });
    expect(spokenDayCount(get(spokenProgress))).toBe(2);
    expect(JSON.parse(localStorage.getItem('kcs.spoken-v1'))['chapter-01']).toEqual(['2026-07-10']);
  });

  it('tracks C9 onboarding state keys', () => {
    markOrientationDone();
    expect(get(orientationDone)).toBe(true);
    expect(localStorage.getItem('kcs.orientation-v1')).toBe('1');

    toggleImeFallback();
    expect(get(imeFallbackEnabled)).toBe(true);
    expect(localStorage.getItem('kcs.ime-fallback-v1')).toBe('1');

    markRomanNudgeSeen();
    expect(get(romanNudgeSeen)).toBe(true);
    expect(localStorage.getItem('kcs.roman-nudge-v1')).toBe('1');
  });

  it('defaults the roleplay register to 해요체 and persists changes', () => {
    expect(get(roleplayRegister)).toBe('haeyo');
    setRoleplayRegister('banmal');
    expect(get(roleplayRegister)).toBe('banmal');
    expect(localStorage.getItem('kcs.roleplay-register-v1')).toBe('banmal');
  });

  it('falls back to 해요체 when given an unknown register', () => {
    setRoleplayRegister('nonsense');
    expect(get(roleplayRegister)).toBe('haeyo');
  });

  it('filters scenarios by register, treating untagged items as 반말', () => {
    const items = [
      { id: 'a', register: 'haeyo' },
      { id: 'b', register: 'banmal' },
      { id: 'c' }, // untagged legacy scenario
    ];
    expect(filterByRegister(items, 'haeyo').map((i) => i.id)).toEqual(['a']);
    expect(filterByRegister(items, 'banmal').map((i) => i.id)).toEqual(['b', 'c']);
    expect(filterByRegister(items, 'all')).toHaveLength(3);
  });
});
