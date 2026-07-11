import { describe, expect, it } from 'vitest';
import { recommendDrill } from './recommendDrill.js';

describe('recommendDrill', () => {
  it('prioritizes due review over every other drill', () => {
    expect(recommendDrill({ dueCount: 3, weakCount: 2, chapterHasConjugation: true }).kind).toBe('review');
  });

  it('repairs weak items before introducing a new drill', () => {
    expect(recommendDrill({ weakCount: 2, chapterHasConjugation: true }).kind).toBe('weak');
  });

  it('uses conjugation for a chapter with targeted forms and quiz otherwise', () => {
    expect(recommendDrill({ chapterHasConjugation: true }).kind).toBe('conjugation');
    expect(recommendDrill({ chapterHasConjugation: false }).kind).toBe('quiz');
  });
});
