import { describe, expect, it } from 'vitest';
import bank from './placementBank.json';

describe('placementBank', () => {
  it('contains 5 to 8 grammar-discriminating choice items per A1/A2/B1 level', () => {
    const byLevel = bank.reduce((out, item) => {
      out[item.level] ||= [];
      out[item.level].push(item);
      return out;
    }, {});

    expect(Object.keys(byLevel).sort()).toEqual(['A1', 'A2', 'B1']);
    for (const level of ['A1', 'A2', 'B1']) {
      expect(byLevel[level].length).toBeGreaterThanOrEqual(5);
      expect(byLevel[level].length).toBeLessThanOrEqual(8);
    }
  });

  it('has one correct choice per item and preserves source chapter references', () => {
    for (const item of bank) {
      expect(item.type).toBe('choice');
      expect(item.prompt).toEqual(expect.any(String));
      expect(item.sourceChapterId).toMatch(/^chapter-/);
      expect([3, 4]).toContain(item.choices.length);
      expect(item.choices.filter((choice) => choice.correct)).toHaveLength(1);
      expect(item.choices.every((choice) => choice.ko || choice.en)).toBe(true);
    }
  });
});
