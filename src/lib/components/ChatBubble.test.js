import { cleanup, render } from '@testing-library/svelte';
import { afterEach, describe, expect, it } from 'vitest';
import ChatBubble from './ChatBubble.svelte';

afterEach(cleanup);

describe('ChatBubble', () => {
  it('renders Korean text separately from the audio control', () => {
    const { container } = render(ChatBubble, {
      props: {
        ko: '감사합니다. 이 신청서를 작성해 주세요.',
        romanization: 'gamsahamnida. i sincheongseoreul jakseonghae juseyo.',
        en: 'Thank you. Please fill out this application form.',
      },
    });

    const koreanText = container.querySelector('.ko > span');
    expect(koreanText?.textContent).toBe('감사합니다. 이 신청서를 작성해 주세요.');
    expect(container.querySelector('.ko > button')).not.toBeNull();
  });
});
