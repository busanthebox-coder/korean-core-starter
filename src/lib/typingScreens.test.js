import { describe, expect, it } from 'vitest';
import { isTypingScreen, withoutTyping } from './typingScreens.js';

describe('isTypingScreen', () => {
  it('flags the screens that make you type Korean', () => {
    expect(isTypingScreen({ kind: 'writing' })).toBe(true);
    expect(isTypingScreen({ kind: 'conjugation' })).toBe(true);
    expect(isTypingScreen({ kind: 'listening' })).toBe(true);
  });

  it('flags a free-text exercise (no options, no tiles)', () => {
    expect(isTypingScreen({ kind: 'exercise', data: { prompt: '___를 채우세요', type: 'conjugate' } })).toBe(true);
    expect(isTypingScreen({ kind: 'exercise', data: {} })).toBe(true);
  });

  it('keeps tap-based practice', () => {
    expect(isTypingScreen({ kind: 'exercise', data: { options: ['이에요', '예요'] } })).toBe(false);
    expect(isTypingScreen({ kind: 'exercise', data: { type: 'orderWords', tokens: ['저는', '학생이에요'] } })).toBe(false);
    expect(isTypingScreen({ kind: 'match' })).toBe(false);
    expect(isTypingScreen({ kind: 'sayit' })).toBe(false);
  });

  it('keeps teaching screens', () => {
    for (const kind of ['words', 'grammar', 'dialogue', 'reading', 'culture', 'sessionBreak']) {
      expect(isTypingScreen({ kind })).toBe(false);
    }
    expect(isTypingScreen(null)).toBe(false);
  });
});

describe('withoutTyping', () => {
  const screens = [
    { kind: 'words' },
    { kind: 'grammar' },
    { kind: 'exercise', data: { options: ['a', 'b'] } },
    { kind: 'exercise', data: { type: 'orderWords' } },
    { kind: 'exercise', data: { prompt: 'type this' } },
    { kind: 'listening' },
    { kind: 'conjugation' },
    { kind: 'writing' },
    { kind: 'sayit' },
  ];

  it('drops every typing screen and keeps the order of the rest', () => {
    expect(withoutTyping(screens).map((s) => s.kind)).toEqual([
      'words', 'grammar', 'exercise', 'exercise', 'sayit',
    ]);
  });

  it('leaves a typing-free lesson untouched', () => {
    const clean = [{ kind: 'words' }, { kind: 'exercise', data: { options: ['a'] } }, { kind: 'sayit' }];
    expect(withoutTyping(clean)).toEqual(clean);
  });
});
