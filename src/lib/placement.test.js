import { describe, expect, it } from 'vitest';
import {
  continueChapter,
  nextRound,
  placementResult,
  shouldShowOnboarding,
} from './placement.js';
import { firstChapterOfLevel } from './curriculumStructure.js';

const chapters = [
  { id: 'chapter-01', number: 1, level: 'A1', title: 'Hangul' },
  { id: 'chapter-09', number: 14, level: 'B1', curriculumTrack: { cefr: 'A2' }, title: 'Stale legacy tag' },
  { id: 'chapter-12', number: 12, level: 'A2', title: 'Past' },
  { id: 'chapter-35', number: 35, curriculumTrack: { cefr: 'B1' }, title: 'Reports' },
];

function answers(level, correct) {
  return Array.from({ length: 5 }, (_, index) => ({ level, correct: index < correct }));
}

describe('placement', () => {
  it('finds the first chapter of a CEFR level without hard-coded chapter ids', () => {
    expect(firstChapterOfLevel(chapters, 'A2')?.id).toBe('chapter-12');
    expect(firstChapterOfLevel(chapters, 'B1')?.id).toBe('chapter-35');
    expect(firstChapterOfLevel(chapters, 'B2')).toBeNull();
  });

  it('moves to the next round only at the 4 out of 5 boundary', () => {
    expect(nextRound({ currentLevel: 'A1', answers: answers('A1', 4) })).toEqual({ status: 'round', level: 'A2' });
    expect(nextRound({ currentLevel: 'A1', answers: answers('A1', 3) })).toEqual({ status: 'done' });
  });

  it('recommends A1, A2, or B1 start and never places into B2', () => {
    expect(placementResult(answers('A1', 3)).recommendedLevel).toBe('A1');
    expect(placementResult([...answers('A1', 4), ...answers('A2', 3)]).recommendedLevel).toBe('A2');
    expect(placementResult([...answers('A1', 5), ...answers('A2', 5), ...answers('B1', 5)]).recommendedLevel).toBe('B1');
  });

  it('keeps placement optional and shows it only when requested from Guide', () => {
    expect(shouldShowOnboarding({ onboarded: false, completedIds: new Set() })).toBe(false);
    expect(shouldShowOnboarding({ onboarded: true, completedIds: new Set() })).toBe(false);
    expect(shouldShowOnboarding({ onboarded: false, completedIds: new Set(['chapter-01']) })).toBe(false);
    expect(shouldShowOnboarding({ onboarded: true, completedIds: new Set(['chapter-01']), force: true })).toBe(true);
  });

  it('continues from the saved start chapter until it is complete, then falls back to first incomplete', () => {
    expect(continueChapter(chapters, new Set(), 'chapter-12')?.id).toBe('chapter-12');
    expect(continueChapter(chapters, new Set(['chapter-12']), 'chapter-12')?.id).toBe('chapter-01');
    expect(continueChapter(chapters, new Set(['chapter-01']), '')?.id).toBe('chapter-12');
  });
});
