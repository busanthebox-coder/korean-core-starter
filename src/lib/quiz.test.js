import { describe, it, expect } from 'vitest';
import { shuffle, makeMCQuestion, makeMatch, buildQuiz } from './quiz.js';

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
