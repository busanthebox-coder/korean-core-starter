import { describe, it, expect } from 'vitest';
import { addCard, gradeCard, dueIds, summarize } from './srs.js';

const DAY = 24 * 60 * 60 * 1000;
const T0 = 1_000_000_000_000;

describe('srs', () => {
  it('adds a card due immediately', () => {
    const s = addCard({}, 'a', T0);
    expect(s.a.box).toBe(0);
    expect(dueIds(s, T0)).toEqual(['a']);
  });

  it('does not duplicate an existing card', () => {
    const s1 = addCard({}, 'a', T0);
    const s2 = addCard(s1, 'a', T0 + DAY);
    expect(s2).toBe(s1); // unchanged reference
  });

  it('"good" advances the box and pushes the due date out', () => {
    let s = addCard({}, 'a', T0);
    s = gradeCard(s, 'a', 'good', T0);
    expect(s.a.box).toBe(1);
    expect(s.a.due).toBe(T0 + 1 * DAY);
    expect(dueIds(s, T0)).toEqual([]);          // not due now
    expect(dueIds(s, T0 + 1 * DAY)).toEqual(['a']); // due in a day
  });

  it('"again" resets the box and counts a lapse', () => {
    let s = addCard({}, 'a', T0);
    s = gradeCard(s, 'a', 'good', T0);
    s = gradeCard(s, 'a', 'good', T0 + DAY);
    s = gradeCard(s, 'a', 'again', T0 + DAY);
    expect(s.a.box).toBe(0);
    expect(s.a.lapses).toBe(1);
    expect(s.a.due).toBe(T0 + DAY + 10 * 60 * 1000); // ~10 min later
  });

  it('summarize counts total, due, and learned (box>=3)', () => {
    let s = {};
    s = addCard(s, 'a', T0);
    s = addCard(s, 'b', T0);
    s = gradeCard(s, 'a', 'easy', T0); // box 2
    s = gradeCard(s, 'a', 'good', T0); // box 3 → learned
    const sum = summarize(s, T0);
    expect(sum.total).toBe(2);
    expect(sum.learned).toBe(1);
  });
});
