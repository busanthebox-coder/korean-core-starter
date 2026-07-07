import { describe, expect, it } from 'vitest';
import { bankAnswerValue, buildFallbackTiles, tokenizeAnswer } from './inputFallback.js';

describe('input fallback word bank', () => {
  it('tokenizes Korean answers by word spacing', () => {
    expect(tokenizeAnswer('천천히 말해 주세요')).toEqual(['천천히', '말해', '주세요']);
  });

  it('builds answer tiles plus plausible distractors without duplicates', () => {
    const tiles = buildFallbackTiles('천천히 말해 주세요', ['다시', '영어', '주세요', '말해']);
    expect(tiles.map((tile) => tile.t).sort()).toEqual(['다시', '말해', '영어', '주세요', '천천히'].sort());
  });

  it('reconstructs the value used by normalizeKo grading', () => {
    const value = bankAnswerValue([{ t: '천천히' }, { t: '말해' }, { t: '주세요' }]);
    expect(value).toBe('천천히 말해 주세요');
  });
});

