import { describe, it, expect } from 'vitest';
import {
  CHAPTER_FORM_MAP,
  CONJUGATION_FORM_KEYS,
  FORM_LABELS,
  buildConjugationQuiz,
  explainConjugationItem,
  getChapterConjugationForms,
  gradeConjugation,
} from './conjugationDrill.js';

function seeded(seed = 42) {
  let s = seed;
  return () => { s = (s * 1103515245 + 12345) & 0x7fffffff; return s / 0x7fffffff; };
}

const POOL = [
  {
    id: 'eat',
    hangul: '먹다',
    english: 'to eat',
    irregular: '',
    forms: { politePresent: '먹어요', past: '먹었어요', future: '먹을 거예요' },
  },
  {
    id: 'go',
    hangul: '가다',
    english: 'to go',
    irregular: '',
    forms: { politePresent: '가요', past: '갔어요', future: '갈 거예요' },
  },
  {
    id: 'listen',
    hangul: '듣다',
    english: 'to listen',
    irregular: 'ㄷ irregular',
    forms: { politePresent: '들어요', past: '들었어요', future: '들을 거예요' },
  },
  {
    id: 'help',
    hangul: '돕다',
    english: 'to help',
    irregular: 'ㅂ irregular',
    forms: { politePresent: '도와요', past: '도왔어요' },
  },
];

describe('FORM_LABELS', () => {
  it('covers every generated forms key exactly once', () => {
    expect(Object.keys(FORM_LABELS).sort()).toEqual(CONJUGATION_FORM_KEYS.slice().sort());
    for (const key of CONJUGATION_FORM_KEYS) {
      expect(FORM_LABELS[key].en).toBeTruthy();
      expect(FORM_LABELS[key].pattern).toBeTruthy();
    }
  });
});

describe('buildConjugationQuiz', () => {
  it('builds solvable questions without consecutive duplicate verbs', () => {
    const quiz = buildConjugationQuiz(POOL, {
      forms: ['politePresent', 'past'],
      count: 10,
      rng: seeded(7),
    });

    expect(quiz).toHaveLength(10);
    for (const item of quiz) {
      expect(item.type).toBe('conjugation');
      expect(['politePresent', 'past']).toContain(item.form);
      expect(item.answer).toBeTruthy();
      expect(POOL.map((entry) => entry.id)).toContain(item.entryId);
    }
    for (let i = 1; i < quiz.length; i += 1) {
      expect(quiz[i].entryId).not.toBe(quiz[i - 1].entryId);
    }
  });

  it('skips requested forms that have no answer', () => {
    const quiz = buildConjugationQuiz([POOL[3]], {
      forms: ['future'],
      count: 5,
      rng: seeded(3),
    });

    expect(quiz).toEqual([]);
  });

  it('weights irregular verbs above regular verbs with a fixed rng', () => {
    const quiz = buildConjugationQuiz(POOL, {
      forms: ['politePresent'],
      count: 40,
      rng: seeded(11),
      irregularWeight: 3,
    });
    const irregularCount = quiz.filter((item) => item.irregular !== 'regular').length;
    const regularCount = quiz.length - irregularCount;

    expect(irregularCount).toBeGreaterThan(regularCount);
  });
});

describe('gradeConjugation', () => {
  it('grades Korean typing with forgiving normalization', () => {
    const item = buildConjugationQuiz(POOL, {
      forms: ['past'],
      count: 1,
      rng: () => 0,
    })[0];

    expect(gradeConjugation(` ${item.answer}. `, item).ok).toBe(true);
    expect(gradeConjugation('먹어요', item).ok).toBe(false);
  });
});

describe('chapter mapping', () => {
  it('maps known grammar chapters to supported form keys', () => {
    expect(getChapterConjugationForms('chapter-17')).toEqual(['past']);
    expect(getChapterConjugationForms('chapter-41')).toEqual(['politePresent', 'past']);

    for (const forms of Object.values(CHAPTER_FORM_MAP)) {
      for (const form of forms) expect(CONJUGATION_FORM_KEYS).toContain(form);
    }
  });
});

describe('explainConjugationItem', () => {
  it('explains irregular answers without exposing unrelated forms', () => {
    const item = buildConjugationQuiz([POOL[2]], {
      forms: ['past'],
      count: 1,
      rng: seeded(2),
    })[0];

    expect(explainConjugationItem(item)).toContain('ㄷ');
    expect(explainConjugationItem(item)).toContain(item.answer);
  });
});
