import { describe, it, expect } from 'vitest';
import { compose, decompose, LEADS, VOWELS, TAILS } from './hangul.js';

describe('hangul', () => {
  it('composes a syllable from jamo indices', () => {
    // 한 = ㅎ(18) + ㅏ(0) + ㄴ(4)
    expect(compose(18, 0, 4)).toBe('한');
    // 가 = ㄱ(0) + ㅏ(0) + (no tail)
    expect(compose(0, 0, 0)).toBe('가');
  });
  it('decomposes a syllable into jamo', () => {
    expect(decompose('한')).toEqual({ lead: 'ㅎ', vowel: 'ㅏ', tail: 'ㄴ' });
    expect(decompose('가')).toEqual({ lead: 'ㄱ', vowel: 'ㅏ', tail: '' });
  });
  it('exposes jamo tables', () => {
    expect(LEADS.length).toBe(19);
    expect(VOWELS.length).toBe(21);
    expect(TAILS.length).toBe(28);
  });
});
