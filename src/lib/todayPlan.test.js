import { describe, expect, it } from 'vitest';
import { buildTodayPlan, dayKey, spokeToday } from './todayPlan.js';

const chapter = { id: 'chapter-07', number: 7 };

describe('buildTodayPlan', () => {
  it('puts due review before the current lesson and Say-it', () => {
    expect(buildTodayPlan({ dueCount: 2, currentChapter: chapter, today: '2026-07-11' }).map((step) => step.kind))
      .toEqual(['review', 'lesson', 'sayit']);
  });

  it('leaves out Say-it when the learner already spoke this chapter today', () => {
    expect(buildTodayPlan({
      currentChapter: chapter,
      spoken: { 'chapter-07': ['2026-07-11'] },
      today: '2026-07-11',
    }).map((step) => step.kind)).toEqual(['lesson']);
  });

  it('recognizes only dates recorded for the requested chapter', () => {
    expect(spokeToday({ 'chapter-07': ['2026-07-11'] }, 'chapter-07', '2026-07-11')).toBe(true);
    expect(spokeToday({ 'chapter-08': ['2026-07-11'] }, 'chapter-07', '2026-07-11')).toBe(false);
  });

  it('uses a local calendar key, matching spoken-progress storage', () => {
    const date = new Date(2026, 0, 2, 0, 30);
    expect(dayKey(date)).toBe('2026-01-02');
  });
});
