import { describe, expect, it, vi } from 'vitest';
import { canUseKoreanSpeech, getKoreanVoice, speak } from './audio.js';

describe('audio helpers', () => {
  it('detects Korean voices and rejects non-Korean voice lists', () => {
    const koWindow = { speechSynthesis: { getVoices: () => [{ lang: 'en-US' }, { lang: 'ko-KR', name: 'Korean' }] } };
    const enWindow = { speechSynthesis: { getVoices: () => [{ lang: 'en-US' }] } };

    expect(getKoreanVoice(koWindow)?.lang).toBe('ko-KR');
    expect(canUseKoreanSpeech(koWindow)).toBe(true);
    expect(canUseKoreanSpeech(enWindow)).toBe(false);
  });

  it('speaks with the requested rate when browser speech is available', () => {
    const spoken = [];
    const cancel = vi.fn();
    const OriginalWindow = globalThis.window;
    const OriginalUtterance = globalThis.SpeechSynthesisUtterance;
    class FakeUtterance {
      constructor(text) {
        this.text = text;
      }
    }
    Object.defineProperty(globalThis, 'window', {
      value: {
        speechSynthesis: {
          cancel,
          getVoices: () => [{ lang: 'ko-KR', name: 'Korean' }],
          speak: (utterance) => spoken.push(utterance),
        },
        SpeechSynthesisUtterance: FakeUtterance,
      },
      configurable: true,
    });
    globalThis.SpeechSynthesisUtterance = FakeUtterance;

    try {
      expect(speak('천천히 말해 주세요.', { rate: 0.8 })).toBe(true);
      expect(cancel).toHaveBeenCalledTimes(1);
      expect(spoken[0]).toMatchObject({ text: '천천히 말해 주세요.', lang: 'ko-KR', rate: 0.8 });
    } finally {
      Object.defineProperty(globalThis, 'window', { value: OriginalWindow, configurable: true });
      globalThis.SpeechSynthesisUtterance = OriginalUtterance;
    }
  });
});
