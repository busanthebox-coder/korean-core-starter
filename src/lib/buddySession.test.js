import { describe, it, expect } from 'vitest';
import { isoWeekKey, pickBuddyMissions } from './buddySession.js';

const scenarios = Array.from({ length: 12 }, (_, i) => ({
  id: `convo-${i + 1}`,
  title: `Scenario ${i + 1}`,
  situation: 'situation',
  register: 'haeyo',
}));

describe('buddy session missions', () => {
  it('keys weeks so a whole week shares one key', () => {
    // Mon 2026-07-13 → Sun 2026-07-19 is one ISO week; the next Monday rolls over.
    expect(isoWeekKey(new Date('2026-07-13T09:00:00'))).toBe(isoWeekKey(new Date('2026-07-19T23:00:00')));
    expect(isoWeekKey(new Date('2026-07-13T09:00:00'))).not.toBe(isoWeekKey(new Date('2026-07-20T09:00:00')));
  });

  it('gives the same three scenarios all week, so a planned session still matches', () => {
    const mon = pickBuddyMissions(scenarios, { now: new Date('2026-07-13T09:00:00') });
    const fri = pickBuddyMissions(scenarios, { now: new Date('2026-07-17T20:00:00') });
    expect(mon).toHaveLength(3);
    expect(fri.map((s) => s.id)).toEqual(mon.map((s) => s.id));
  });

  it('rotates to a different set next week', () => {
    const thisWeek = pickBuddyMissions(scenarios, { now: new Date('2026-07-13T09:00:00') });
    const nextWeek = pickBuddyMissions(scenarios, { now: new Date('2026-07-20T09:00:00') });
    expect(nextWeek.map((s) => s.id)).not.toEqual(thisWeek.map((s) => s.id));
  });

  it('prefers scenarios you have not spoken yet', () => {
    const spoken = Object.fromEntries(scenarios.slice(0, 9).map((s) => [s.id, ['2026-07-01']]));
    const picked = pickBuddyMissions(scenarios, { now: new Date('2026-07-13T09:00:00'), spoken });
    expect(picked.map((s) => s.id).sort()).toEqual(['convo-10', 'convo-11', 'convo-12']);
  });

  it('falls back to the full list once everything has been spoken', () => {
    const spoken = Object.fromEntries(scenarios.map((s) => [s.id, ['2026-07-01']]));
    const picked = pickBuddyMissions(scenarios, { now: new Date('2026-07-13T09:00:00'), spoken });
    expect(picked).toHaveLength(3);
  });

  it('never returns more than exist', () => {
    expect(pickBuddyMissions(scenarios.slice(0, 2), { now: new Date('2026-07-13T09:00:00') })).toHaveLength(2);
    expect(pickBuddyMissions([], { now: new Date('2026-07-13T09:00:00') })).toEqual([]);
  });
});
