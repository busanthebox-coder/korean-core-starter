import { describe, it, expect } from 'vitest';
import {
  grammarFormLabel,
  grammarSelfCheckItems,
  hasPracticeReps,
  lessonPlanState,
} from './lessonPlan.js';

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

describe('writing self-check helpers', () => {
  it('extracts the Korean form before an em dash', () => {
    expect(grammarFormLabel('V아/어서 — because / so')).toBe('V아/어서');
    expect(grammarFormLabel('  -았/었어요 — Past Tense  ')).toBe('-았/었어요');
  });

  it('keeps the whole title when there is no em dash or only English text', () => {
    expect(grammarFormLabel('Past Tense')).toBe('Past Tense');
    expect(grammarFormLabel('')).toBe('');
  });

  it('prefers Korean material inside parentheses and drops English glosses', () => {
    expect(grammarFormLabel('Question words (누구, 뭐, 어디, 언제, 왜, 어떻게, 몇, 얼마)')).toBe('누구, 뭐, 어디, 언제, 왜, 어떻게, 몇, 얼마');
    expect(grammarFormLabel('자음 (Consonants) — Ten Core Shapes')).toBe('자음');
  });

  it('builds self-check prompts from grammar notes', () => {
    expect(grammarSelfCheckItems([
      { title: 'V아/어서 — because / so' },
      { title: '-고 — and then' },
      { title: '' },
    ])).toEqual([
      { id: 'grammar-0', form: 'V아/어서', label: 'Did you use 『V아/어서』?' },
      { id: 'grammar-1', form: '-고', label: 'Did you use 『-고』?' },
    ]);
  });
});
