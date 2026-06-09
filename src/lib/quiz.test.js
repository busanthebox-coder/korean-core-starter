import { describe, it, expect } from 'vitest';
import { shuffle, makeMCQuestion, makeMatch, buildQuiz, normalizeKo, buildWriteQuiz, buildSentenceQuiz } from './quiz.js';

// deterministic rng for stable tests
function seeded(seed = 42) {
  let s = seed;
  return () => { s = (s * 1103515245 + 12345) & 0x7fffffff; return s / 0x7fffffff; };
}

const POOL = [
  { id: 'a', hangul: '먹다', romanization: 'meokda', english: 'to eat', shortExplanation: 'eat' },
  { id: 'b', hangul: '가다', romanization: 'gada', english: 'to go' },
  { id: 'c', hangul: '물', romanization: 'mul', english: 'water' },
  { id: 'd', hangul: '책', romanization: 'chaek', english: 'book' },
  { id: 'e', hangul: '집', romanization: 'jip', english: 'home' },
];

describe('shuffle', () => {
  it('keeps the same elements', () => {
    const r = shuffle(POOL, seeded());
    expect(r.length).toBe(POOL.length);
    expect(new Set(r.map((x) => x.id))).toEqual(new Set(POOL.map((x) => x.id)));
  });
});

describe('makeMCQuestion', () => {
  it('koToEn: 4 options, answer present and is an english gloss', () => {
    const q = makeMCQuestion(POOL, { direction: 'koToEn' }, seeded());
    expect(q.options.length).toBe(4);
    expect(q.options).toContain(q.answer);
    expect(POOL.map((e) => e.english)).toContain(q.answer);
    expect(POOL.map((e) => e.hangul)).toContain(q.prompt);
  });
  it('enToKo: options are hangul', () => {
    const q = makeMCQuestion(POOL, { direction: 'enToKo' }, seeded(7));
    expect(q.options).toContain(q.answer);
    expect(POOL.map((e) => e.hangul)).toContain(q.answer);
  });
  it('listen: type listen with audio', () => {
    const q = makeMCQuestion(POOL, { direction: 'listen' }, seeded(9));
    expect(q.type).toBe('listen');
    expect(q.audio).toBeTruthy();
  });
});

describe('buildQuiz', () => {
  it('produces the requested count, each solvable', () => {
    const qs = buildQuiz(POOL, { count: 6, rng: seeded(3) });
    expect(qs.length).toBe(6);
    for (const q of qs) expect(q.options).toContain(q.answer);
  });
  it('returns empty for too-small pools', () => {
    expect(buildQuiz(POOL.slice(0, 2), { count: 5 })).toEqual([]);
  });
});

describe('makeMatch', () => {
  it('returns up to N pairs with ko + en', () => {
    const m = makeMatch(POOL, seeded(5), 4);
    expect(m.pairs.length).toBe(4);
    expect(m.pairs.every((p) => p.ko && p.en)).toBe(true);
  });
});

describe('normalizeKo', () => {
  it('ignores spaces, punctuation and case', () => {
    expect(normalizeKo(' 먹어요. ')).toBe('먹어요');
    expect(normalizeKo('밥을  먹어요!')).toBe(normalizeKo('밥을먹어요'));
    expect(normalizeKo('An-nyeong')).toBe('annyeong');
  });
  it('grades a typed answer regardless of trailing punctuation', () => {
    expect(normalizeKo('가다') === normalizeKo('가다.')).toBe(true);
  });
});

describe('buildWriteQuiz', () => {
  it('produces type questions whose answer is the hangul', () => {
    const qs = buildWriteQuiz(POOL, { count: 3, rng: seeded(3) });
    expect(qs.length).toBe(3);
    for (const q of qs) {
      expect(q.type).toBe('type');
      expect(POOL.map((e) => e.hangul)).toContain(q.answer);
      expect(POOL.map((e) => e.english)).toContain(q.prompt);
    }
  });
  it('uses distinct targets (no repeats within a round)', () => {
    const qs = buildWriteQuiz(POOL, { count: 5, rng: seeded(11) });
    expect(new Set(qs.map((q) => q.answer)).size).toBe(qs.length);
  });
});

describe('buildSentenceQuiz', () => {
  const EX_POOL = [
    { id: 'x', hangul: '먹다', english: 'to eat', examples: [{ ko: '밥을 먹어요', en: 'I eat rice', romanization: 'babeul meogeoyo' }] },
    { id: 'y', hangul: '가다', english: 'to go', examples: [{ ko: '학교에 가요', en: 'I go to school' }] },
  ];
  it('makes build questions with scrambled tokens that reorder to the answer', () => {
    const qs = buildSentenceQuiz(EX_POOL, { count: 2, rng: seeded(5) });
    expect(qs.length).toBeGreaterThan(0);
    for (const q of qs) {
      expect(q.type).toBe('build');
      expect([...q.scrambled].sort()).toEqual([...q.tokens].sort());
      expect(q.tokens.join(' ')).toBe(q.answer);
    }
  });
  it('returns empty when no entry has a multi-word example', () => {
    expect(buildSentenceQuiz([{ id: 'z', hangul: '책', english: 'book', examples: [] }], {})).toEqual([]);
  });
});
