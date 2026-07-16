import { describe, expect, it } from 'vitest';
import { buildReactionQuiz, reactionItems, reactionOptionsFor } from './reactions.js';

describe('reaction drills', () => {
  it('ships a bank of well-formed items', () => {
    expect(reactionItems.length).toBeGreaterThanOrEqual(20);
    for (const item of reactionItems) {
      expect(item.id, `${item.id}: id`).toMatch(/^react-\d{3}$/);
      expect(item.partnerKo.trim(), `${item.id}: partnerKo`).toBeTruthy();
      expect(item.partnerEn.trim(), `${item.id}: partnerEn`).toBeTruthy();
      expect(item.options, `${item.id}: options`).toHaveLength(3);
      const natural = item.options.filter((o) => o.natural === true);
      expect(natural, `${item.id}: exactly one natural option`).toHaveLength(1);
      for (const option of item.options) {
        expect(option.ko.trim(), `${item.id}: option ko`).toBeTruthy();
        expect(option.why.trim(), `${item.id}: option why`).toBeTruthy();
      }
      const kos = item.options.map((o) => o.ko.trim());
      expect(new Set(kos).size, `${item.id}: duplicate options`).toBe(kos.length);
    }
  });

  it('uses unique ids', () => {
    const ids = reactionItems.map((i) => i.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('builds a quiz of the requested size without repeating items', () => {
    const quiz = buildReactionQuiz({ count: 10, rng: () => 0.42 });
    expect(quiz).toHaveLength(10);
    expect(new Set(quiz.map((q) => q.id)).size).toBe(10);
  });

  it('caps the quiz at the bank size', () => {
    const quiz = buildReactionQuiz({ count: 9999 });
    expect(quiz).toHaveLength(reactionItems.length);
  });

  // The correct reaction must not be guessable from its slot: this app already
  // had a bug where the stored first option was the answer ~84% of the time.
  it('scrambles the on-screen option order per item', () => {
    const slots = [0, 0, 0];
    for (const item of reactionItems) {
      const shown = reactionOptionsFor(item);
      expect(shown.map((o) => o.ko).sort()).toEqual(item.options.map((o) => o.ko).sort());
      slots[shown.findIndex((o) => o.natural)] += 1;
    }
    const total = reactionItems.length;
    for (const count of slots) {
      expect(count).toBeGreaterThan(total * 0.15);
      expect(count).toBeLessThan(total * 0.55);
    }
  });

  it('is stable: the same item always renders in the same order', () => {
    const item = reactionItems[0];
    expect(reactionOptionsFor(item)).toEqual(reactionOptionsFor(item));
  });

  // Missing a reaction should push that expression into the review deck, so any
  // entryIds we do attach must resolve — a stale id would silently review nothing.
  it('only carries entryIds that resolve to real dictionary entries', async () => {
    const { findEntry } = await import('./data.js');
    let tagged = 0;
    for (const item of reactionItems) {
      for (const id of item.entryIds || []) {
        expect(findEntry(id), `${item.id}: ${id}`).toBeTruthy();
        tagged += 1;
      }
    }
    expect(tagged).toBeGreaterThan(0);
  });
});
