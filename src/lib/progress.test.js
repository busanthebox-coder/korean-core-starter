import { describe, it, expect } from 'vitest';
import { dayKey, todayCount, streak, bestStreak, goalOf, goalMet } from './progress.js';

const DAY = 24 * 60 * 60 * 1000;
// A fixed local noon so day math never lands on a midnight boundary.
const T = new Date(2026, 5, 9, 12, 0, 0).getTime(); // 2026-06-09 12:00 local

const back = (n) => dayKey(T - n * DAY);

describe('progress', () => {
  it('dayKey is a local YYYY-MM-DD', () => {
    expect(dayKey(T)).toBe('2026-06-09');
  });

  it('todayCount reads the current day bucket', () => {
    const s = { log: { [dayKey(T)]: 7 } };
    expect(todayCount(s, T)).toBe(7);
    expect(todayCount({ log: {} }, T)).toBe(0);
  });

  it('streak counts consecutive active days ending today', () => {
    const s = { log: { [back(0)]: 3, [back(1)]: 1, [back(2)]: 5 } };
    expect(streak(s, T)).toBe(3);
  });

  it('streak keeps a one-day grace when today is not yet studied', () => {
    const s = { log: { [back(1)]: 2, [back(2)]: 2 } }; // studied yesterday + before, not today
    expect(streak(s, T)).toBe(2);
  });

  it('streak breaks on a gap', () => {
    const s = { log: { [back(0)]: 1, [back(2)]: 1, [back(3)]: 1 } }; // missing yesterday
    expect(streak(s, T)).toBe(1);
  });

  it('bestStreak finds the longest historical run', () => {
    const s = { log: { [back(10)]: 1, [back(9)]: 1, [back(8)]: 1, [back(8 - 2)]: 1, [back(0)]: 1 } };
    expect(bestStreak(s)).toBe(3);
  });

  it('goal helpers', () => {
    expect(goalOf({})).toBe(20);
    expect(goalMet({ goal: 5, log: { [dayKey(T)]: 5 } }, T)).toBe(true);
    expect(goalMet({ goal: 5, log: { [dayKey(T)]: 4 } }, T)).toBe(false);
  });
});
