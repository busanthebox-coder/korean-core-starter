import { describe, it, expect } from 'vitest';
import { addCard, gradeCard, dueIds, summarize, masteryOf } from './srs.js';

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

  it('masteryOf reports mastered/total/pct over a given id set', () => {
    let s = {};
    s = addCard(s, 'a', T0);
    s = addCard(s, 'b', T0);
    s = gradeCard(s, 'a', 'easy', T0); // box 2
    s = gradeCard(s, 'a', 'good', T0); // box 3 → mastered
    // chapter has 4 items: a (mastered), b (started, not mastered), c & d (never added)
    const m = masteryOf(s, ['a', 'b', 'c', 'd']);
    expect(m.total).toBe(4);
    expect(m.started).toBe(2);
    expect(m.mastered).toBe(1);
    expect(m.pct).toBe(25); // 1 of 4
  });
  it('masteryOf is 0% for an empty/unknown set', () => {
    expect(masteryOf({}, []).pct).toBe(0);
    expect(masteryOf({}, ['x']).mastered).toBe(0);
  });
});
