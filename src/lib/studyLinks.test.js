import { describe, expect, it } from 'vitest';
import {
  FOCUS_DECK,
  buildTodayMission,
  chapterForEntry,
  chapterItemIds,
  entryIdsForUnit,
  focusPracticePath,
  learnChapterPath,
  parseFocusParam,
} from './studyLinks.js';

const chapters = [
  { id: 'chapter-01', number: 1, coreVocabularyIds: ['a'], linkedEntryIds: ['b'], patternIds: ['p1'] },
  { id: 'chapter-02', number: 2, coreVocabularyIds: ['c'], linkedEntryIds: [], patternIds: [] },
];

describe('studyLinks', () => {
  it('dedupes chapter and guide-unit entry ids', () => {
    expect(chapterItemIds({ coreVocabularyIds: ['a', 'b'], linkedEntryIds: ['b'], patternIds: ['p'] })).toEqual(['a', 'b', 'p']);
    expect(entryIdsForUnit({ coreVocabularyIds: ['a'], linkedEntryIds: ['a', 'c'] })).toEqual(['a', 'c']);
  });

  it('finds the first chapter that teaches an entry', () => {
    expect(chapterForEntry(chapters, 'p1')?.id).toBe('chapter-01');
    expect(chapterForEntry(chapters, 'missing')).toBeNull();
  });

  it('builds and parses focus practice links', () => {
    expect(focusPracticePath(['a', 'a', 'b'])).toBe('/practice?focus=a%2Cb');
    expect(parseFocusParam('#/practice?focus=a%2Cb')).toEqual({ deck: FOCUS_DECK, ids: ['a', 'b'] });
    expect(parseFocusParam('#/practice')).toEqual({ deck: null, ids: [] });
  });

  it('builds chapter deep links', () => {
    expect(learnChapterPath('chapter-02')).toBe('/learn?chapter=chapter-02');
  });

  it('prioritizes due, weak, next chapter, and speaking in today mission', () => {
    const mission = buildTodayMission({
      chapters,
      completedIds: new Set(['chapter-01']),
      reviews: { a: { due: 0 }, c: { due: Date.now() + 100000 } },
      mistakeIds: ['b', 'p1'],
      now: 10,
    });

    expect(mission.dueCount).toBe(1);
    expect(mission.weakCount).toBe(2);
    expect(mission.nextChapter.id).toBe('chapter-02');
    expect(mission.steps.map((step) => step.kind)).toEqual(['review', 'weak', 'chapter', 'speak']);
    expect(mission.steps[0]).toMatchObject({
      label: '복습 1개 비우기',
      path: '/practice?review=1',
    });
    expect(mission.steps[3].path).toBe('/speak?mode=shadow');
  });
});
