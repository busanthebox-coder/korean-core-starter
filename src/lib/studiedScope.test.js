import { describe, expect, it } from 'vitest';
import { entryIdsUpToChapter, studiedChapterIds, studiedEntryIds, studiedLabel } from './studiedScope.js';

const chapters = [
  { id: 'c1', number: 1, title: 'One', coreVocabularyIds: ['w1'], linkedEntryIds: ['w2'], patternIds: ['p1'] },
  { id: 'c2', number: 2, title: 'Two', coreVocabularyIds: ['w3'], linkedEntryIds: ['w2'] },
  { id: 'c3', number: 3, title: 'Three', coreVocabularyIds: ['w4'] },
  { id: 'c4', number: 4, title: 'Four', coreVocabularyIds: ['w5'] },
];

describe('studiedChapterIds', () => {
  // A learner with nothing done is still studying chapter 1 — practising an empty
  // set would be worse than practising the chapter they are about to open.
  it('gives the first chapter to someone who has not started', () => {
    expect(studiedChapterIds(chapters, new Set())).toEqual(['c1']);
  });

  it('includes what is finished plus the one now in progress', () => {
    expect(studiedChapterIds(chapters, new Set(['c1']))).toEqual(['c1', 'c2']);
    expect(studiedChapterIds(chapters, new Set(['c1', 'c2']))).toEqual(['c1', 'c2', 'c3']);
  });

  // Chapters can be completed out of order (the path never locks), so "current" is
  // the first unfinished one, not the one after the highest finished.
  it('treats the first unfinished chapter as current even when work was done ahead', () => {
    expect(studiedChapterIds(chapters, new Set(['c1', 'c3']))).toEqual(['c1', 'c3', 'c2']);
  });

  it('returns every chapter once the course is finished', () => {
    expect(studiedChapterIds(chapters, new Set(['c1', 'c2', 'c3', 'c4']))).toEqual(['c1', 'c2', 'c3', 'c4']);
  });

  it('survives missing chapters and a missing progress set', () => {
    expect(studiedChapterIds([], new Set())).toEqual([]);
    expect(studiedChapterIds(chapters)).toEqual(['c1']);
  });
});

describe('studiedEntryIds', () => {
  it('collects core, linked and pattern items without duplicates', () => {
    expect(studiedEntryIds(chapters, new Set(['c1']))).toEqual(['w1', 'w2', 'p1', 'w3']);
  });

  it('grows as chapters are completed', () => {
    const early = studiedEntryIds(chapters, new Set());
    const later = studiedEntryIds(chapters, new Set(['c1', 'c2']));
    expect(later.length).toBeGreaterThan(early.length);
    expect(early.every((id) => later.includes(id))).toBe(true);
  });
});

describe('entryIdsUpToChapter', () => {
  it('gathers everything taught up to and including that chapter', () => {
    expect(entryIdsUpToChapter(chapters, 'c1')).toEqual(['w1', 'w2']);
    expect(entryIdsUpToChapter(chapters, 'c3')).toEqual(['w1', 'w2', 'w3', 'w4']);
  });

  it('never reaches forward into chapters the learner has not seen', () => {
    expect(entryIdsUpToChapter(chapters, 'c2')).not.toContain('w5');
  });

  it('is empty for a chapter that is not in the path', () => {
    expect(entryIdsUpToChapter(chapters, 'nope')).toEqual([]);
  });
});

describe('studiedLabel', () => {
  it('names the range so the learner knows what they are drilling', () => {
    expect(studiedLabel(chapters, new Set())).toBe('Chapter 1');
    expect(studiedLabel(chapters, new Set(['c1', 'c2']))).toBe('Chapters 1–3');
    expect(studiedLabel([], new Set())).toBe('Your chapters');
  });
});
