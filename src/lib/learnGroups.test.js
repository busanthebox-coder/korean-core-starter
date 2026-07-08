import { describe, expect, it } from 'vitest';
import {
  activeGroupKey,
  groupsForLearnHome,
  groupChaptersByLevel,
} from './learnGroups.js';

const chapters = [
  {
    id: 'chapter-01',
    number: 1,
    curriculumOrder: 1,
    title: 'Hangul',
    goal: 'Read Korean blocks.',
    curriculumTrack: { cefr: 'A1', label: 'A1 Foundation', description: 'Start here.' },
  },
  {
    id: 'chapter-02',
    number: 2,
    curriculumOrder: 2,
    title: 'Greetings',
    goal: 'Introduce yourself.',
    curriculumTrack: { cefr: 'A1', label: 'A1 Foundation', description: 'Start here.' },
  },
  {
    id: 'chapter-41',
    number: 12,
    curriculumOrder: 12,
    title: 'Irregular Verb Conjugation',
    goal: 'Handle irregular forms.',
    curriculumTrack: { cefr: 'A2', label: 'A2 Builder', description: 'Build grammar range.' },
  },
  {
    id: 'chapter-28',
    number: 35,
    curriculumOrder: 35,
    title: 'Sequence and Completion',
    goal: 'Talk about sequences.',
    curriculumTrack: { cefr: 'B1', label: 'B1 Independent Korean', description: 'Longer explanations.' },
  },
];

describe('learnGroups', () => {
  it('groups chapters by curriculum track without mixing progress counts with side cards', () => {
    const groups = groupChaptersByLevel(chapters, new Set(['chapter-01']));

    expect(groups.map((group) => group.key)).toEqual(['A1', 'A2', 'B1']);
    expect(groups[0]).toMatchObject({
      label: 'A1 Foundation',
      description: 'Start here.',
      doneCount: 1,
      totalCount: 2,
    });
  });

  it('opens the first incomplete chapter group by default', () => {
    expect(activeGroupKey(chapters, new Set())).toBe('A1');
    expect(activeGroupKey(chapters, new Set(['chapter-01', 'chapter-02']))).toBe('A2');
    expect(activeGroupKey(chapters, new Set(chapters.map((chapter) => chapter.id)))).toBe('B1');
  });

  it('keeps user-opened groups and auto-expands matching filter groups', () => {
    const groups = groupsForLearnHome({
      chapters,
      completedIds: new Set(['chapter-01', 'chapter-02']),
      openKeys: new Set(['B1']),
      filterText: 'irregular',
    });

    expect(groups.map((group) => group.key)).toEqual(['A2']);
    expect(groups[0].open).toBe(true);
    expect(groups[0].chapters.map((chapter) => chapter.id)).toEqual(['chapter-41']);
  });
});
