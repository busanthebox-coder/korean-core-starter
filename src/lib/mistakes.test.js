import { describe, it, expect, beforeEach } from 'vitest';
import { get } from 'svelte/store';
import { mistakes, recordMistakesInState, resolveMistakesInState, sortedMistakeIds } from './mistakes.js';

beforeEach(() => {
  localStorage.clear();
  mistakes.clearAll();
});

describe('mistakes', () => {
  it('records unique missed ids and increments miss counts', () => {
    const state = recordMistakesInState({}, ['a', 'a', 'b'], 1000);
    expect(state.a).toEqual({ misses: 1, lastMissed: 1000 });
    expect(state.b).toEqual({ misses: 1, lastMissed: 1000 });

    const next = recordMistakesInState(state, ['a'], 2000);
    expect(next.a).toEqual({ misses: 2, lastMissed: 2000 });
  });

  it('sorts by miss count, then recency', () => {
    const state = {
      a: { misses: 1, lastMissed: 3000 },
      b: { misses: 3, lastMissed: 1000 },
      c: { misses: 1, lastMissed: 4000 },
    };
    expect(sortedMistakeIds(state)).toEqual(['b', 'c', 'a']);
  });

  it('resolves selected mistakes', () => {
    const state = resolveMistakesInState({ a: { misses: 1 }, b: { misses: 2 } }, ['a']);
    expect(state).toEqual({ b: { misses: 2 } });
  });

  it('persists the live mistake store', () => {
    mistakes.record(['a', 'b'], 1000);
    expect(sortedMistakeIds(get(mistakes))).toEqual(['a', 'b']);
    expect(JSON.parse(localStorage.getItem('kcs.mistakes-v1')).a.misses).toBe(1);

    mistakes.resolve(['a']);
    expect(get(mistakes).a).toBeUndefined();
  });
});
