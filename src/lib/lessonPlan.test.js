import { describe, it, expect } from 'vitest';
import { hasPracticeReps, lessonPlanState } from './lessonPlan.js';

const chapter = { id: 'chapter-01', dialogue: [{ ko: '안녕하세요.' }] };
const itemIds = ['word-001', 'pattern-001'];

describe('lesson plan state', () => {
  it('starts with dialogue as the next step', () => {
    const plan = lessonPlanState({ chapter, itemIds });
    expect(plan.active).toBe('dialogue');
    expect(plan.doneCount).toBe(0);
  });

  it('moves from dialogue to deck to practice to complete', () => {
    expect(lessonPlanState({ chapter, itemIds, activity: { 'chapter-01': { dialogueSeen: true } } }).active).toBe('deck');
    expect(lessonPlanState({
      chapter,
      itemIds,
      deckReady: true,
      activity: { 'chapter-01': { dialogueSeen: true } },
    }).active).toBe('practice');
    expect(lessonPlanState({
      chapter,
      itemIds,
      deckReady: true,
      activity: { 'chapter-01': { dialogueSeen: true, practiceDone: true } },
    }).active).toBe('complete');
    expect(lessonPlanState({
      chapter,
      itemIds,
      deckReady: true,
      lessonDone: true,
      activity: { 'chapter-01': { dialogueSeen: true, practiceDone: true } },
    }).active).toBeNull();
  });

  it('treats review reps as practice evidence', () => {
    expect(hasPracticeReps({ 'word-001': { reps: 1 } }, itemIds)).toBe(true);
    expect(lessonPlanState({
      chapter,
      itemIds,
      deckReady: true,
      reviews: { 'word-001': { reps: 1 } },
      activity: { 'chapter-01': { dialogueSeen: true } },
    }).practiceDone).toBe(true);
  });
});
