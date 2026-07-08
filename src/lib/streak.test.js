import { describe, expect, it } from 'vitest';
import { localDay, touchStreak } from './streak.js';

describe('streak', () => {
  it('records only one streak day when touched twice today', () => {
    const today = new Date(2026, 6, 8, 12);
    const first = touchStreak({ current: 0, best: 0, lastDay: '' }, today);
    const second = touchStreak(first, new Date(2026, 6, 8, 20));

    expect(second).toEqual({ current: 1, best: 1, lastDay: '2026-07-08' });
  });

  it('continues from yesterday into today', () => {
    const today = new Date(2026, 6, 8, 12);

    expect(touchStreak({ current: 3, best: 3, lastDay: '2026-07-07' }, today)).toEqual({
      current: 4,
      best: 4,
      lastDay: '2026-07-08',
    });
  });

  it('resets current after a gap while preserving best', () => {
    const today = new Date(2026, 6, 8, 12);

    expect(touchStreak({ current: 3, best: 5, lastDay: '2026-07-05' }, today)).toEqual({
      current: 1,
      best: 5,
      lastDay: '2026-07-08',
    });
  });

  it('handles local month and year boundaries with day strings', () => {
    expect(localDay(new Date(2027, 0, 1, 8))).toBe('2027-01-01');
    expect(touchStreak({ current: 6, best: 6, lastDay: '2026-12-31' }, new Date(2027, 0, 1, 8))).toEqual({
      current: 7,
      best: 7,
      lastDay: '2027-01-01',
    });
  });
});
