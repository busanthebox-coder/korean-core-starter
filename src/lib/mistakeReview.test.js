import { beforeEach, describe, expect, it } from 'vitest';
import { get } from 'svelte/store';
import { mistakes } from './mistakes.js';
import { reviews } from './srs.js';
import { recordMissedItems } from './mistakeReview.js';

beforeEach(() => {
  localStorage.clear();
  mistakes.clearAll();
  reviews.reset();
});

describe('mistake review intake', () => {
  it('records missed ids into both the mistake bank and SRS review deck', () => {
    recordMissedItems(['word-a', 'word-a', 'word-b'], 1000);

    expect(Object.keys(get(mistakes)).sort()).toEqual(['word-a', 'word-b']);
    expect(Object.keys(get(reviews)).sort()).toEqual(['word-a', 'word-b']);
    expect(get(reviews)['word-a'].due).toBeLessThanOrEqual(Date.now());
  });

  it('does not add review cards when there are no missed ids', () => {
    recordMissedItems([]);

    expect(get(mistakes)).toEqual({});
    expect(get(reviews)).toEqual({});
  });
});
