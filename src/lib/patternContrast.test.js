import { describe, it, expect } from 'vitest';
import { buildContrastQuiz, contrastItems } from './patternContrast.js';

function seeded() {
  let s = 11;
  return () => { s = (s * 1103515245 + 12345) & 0x7fffffff; return s / 0x7fffffff; };
}

describe('pattern contrast items', () => {
  it('are all answerable and linked to a pattern entry', () => {
    for (const item of contrastItems) {
      expect(item.entryId).toMatch(/^pattern-/);
      expect(item.options).toContain(item.answer);
      expect(item.explanation.length).toBeGreaterThan(20);
    }
  });

  it('builds a bounded shuffled contrast quiz', () => {
    const quiz = buildContrastQuiz({ count: 4, rng: seeded() });
    expect(quiz).toHaveLength(4);
    expect(new Set(quiz.map((q) => q.id)).size).toBe(4);
  });
});
