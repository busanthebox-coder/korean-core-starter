import { describe, expect, it } from 'vitest';
import { sessionBreakAt, sessionSummary, withSessionBreak } from './lessonSessions.js';

// A realistic chapter: four taught screens, then a run of drills. Chapter 1 ships
// six word screens, two grammar notes, a dialogue and eleven practice screens.
const taught = [
  { phase: 'words', kind: 'words' },
  { phase: 'words', kind: 'words' },
  { phase: 'grammar', kind: 'grammar' },
  { phase: 'dialogue', kind: 'dialogue' },
];
const drills = (n) => Array.from({ length: n }, () => ({ phase: 'practice', kind: 'exercise' }));
const screens = [...taught, ...drills(8), { phase: 'speak', kind: 'sayit' }];

describe('sessionBreakAt', () => {
  it('breaks where teaching ends and drilling starts', () => {
    expect(sessionBreakAt(screens)).toBe(4);
  });

  // A lesson that is already short is one sitting; interrupting it would be noise.
  it('does not break a lesson that is already short', () => {
    expect(sessionBreakAt([...taught, ...drills(1)])).toBe(-1);
    expect(sessionBreakAt([])).toBe(-1);
  });

  it('does not break when there is nothing taught before the practice', () => {
    expect(sessionBreakAt(drills(12))).toBe(-1);
  });

  it('does not break when the first sitting would be one screen', () => {
    expect(sessionBreakAt([{ phase: 'words', kind: 'words' }, ...drills(12)])).toBe(-1);
  });
});

describe('withSessionBreak', () => {
  it('inserts one break screen at the seam and changes nothing else', () => {
    const out = withSessionBreak(screens);
    expect(out).toHaveLength(screens.length + 1);
    expect(out[4].kind).toBe('sessionBreak');
    expect(out.filter((s) => s.kind === 'sessionBreak')).toHaveLength(1);
    expect(out.filter((s) => s.kind !== 'sessionBreak')).toEqual(screens);
  });

  it('tells the break screen what is done and what is left', () => {
    const out = withSessionBreak(screens);
    expect(out[4].data.doneCount).toBe(4);
    expect(out[4].data.remainingCount).toBe(9);
  });

  it('leaves a short lesson untouched', () => {
    const short = [...taught, ...drills(1)];
    expect(withSessionBreak(short)).toEqual(short);
  });
});

describe('sessionSummary', () => {
  it('names what the first half covered', () => {
    expect(sessionSummary(taught)).toBe('words, grammar and the dialogue');
    expect(sessionSummary([{ phase: 'words', kind: 'words' }])).toBe('words');
    expect(sessionSummary([{ phase: 'words' }, { phase: 'grammar' }])).toBe('words and grammar');
  });

  it('says something sensible when there is nothing to name', () => {
    expect(sessionSummary([])).toBe('the first part');
  });
});
