import { describe, it, expect } from 'vitest';
import { buildContrastQuiz, contrastItems, contrastStats } from './patternContrast.js';
import { validateContrastItems } from '../../scripts/validate-contrast-items.mjs';

function seeded() {
  let s = 11;
  return () => { s = (s * 1103515245 + 12345) & 0x7fffffff; return s / 0x7fffffff; };
}

describe('pattern contrast items', () => {
  it('are all answerable and optionally linked to a pattern entry', () => {
    for (const item of contrastItems) {
      if (item.entryId) expect(item.entryId).toMatch(/^pattern-/);
      expect(item.level).toMatch(/^(A1|A2|B1|B2)$/);
      expect(item.options).toContain(item.answer);
      expect(item.answerKey).toBeTruthy();
      expect(item.explanation.length).toBeGreaterThan(45);
    }
  });

  it('builds a bounded shuffled contrast quiz', () => {
    const quiz = buildContrastQuiz({ count: 4, rng: seeded() });
    expect(quiz).toHaveLength(4);
    expect(new Set(quiz.map((q) => q.id)).size).toBe(4);
  });

  it('filters contrast quizzes by level', () => {
    const quiz = buildContrastQuiz({ count: 8, rng: seeded(), level: 'B2' });
    expect(quiz).toHaveLength(8);
    expect(quiz.every((item) => item.level === 'B2')).toBe(true);
  });

  it('tracks the expanded contrast bank by level and pair', () => {
    const stats = contrastStats();
    expect(Object.keys(stats.byContrast)).toHaveLength(30);
    expect(stats.total).toBe(180);
    expect(stats.byLevel.A1).toBeGreaterThan(0);
    expect(stats.byLevel.B2).toBeGreaterThan(0);
  });

  it('rejects extra contrast groups beyond the C4 bank contract', () => {
    const seedGroup = contrastItems.filter((item) => item.contrast === contrastItems[0].contrast);
    const extraGroup = seedGroup.map((item, index) => ({
      ...item,
      id: `validator-extra-${index + 1}`,
      contrast: 'validator extra group',
    }));

    const result = validateContrastItems([...contrastItems, ...extraGroup]);

    expect(result.ok).toBe(false);
    expect(result.errors).toContain('needs exactly 180 contrast items; found 186');
    expect(result.errors).toContain('needs exactly 30 contrast groups; found 31');
  });
});
