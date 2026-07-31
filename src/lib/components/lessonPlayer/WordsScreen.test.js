import { fireEvent, render, screen } from '@testing-library/svelte';
import { describe, expect, it } from 'vitest';
import WordsScreen from './WordsScreen.svelte';

describe('WordsScreen', () => {
  it('shows the word and its example sentence up front, with the why behind a disclosure', async () => {
    render(WordsScreen, {
      items: [{
        ko: '약속',
        romanization: 'yaksok',
        en: 'appointment / promise',
        pos: 'noun',
        ex: {
          ko: '오늘 약속이 있어요.',
          en: 'I have plans today.',
          note: '약속이 있어요 is the usual way to say you have plans.',
        },
      }],
    });

    expect(screen.getByText('약속')).toBeInTheDocument();
    expect(screen.getByText('appointment / promise')).toBeInTheDocument();
    // The example sentence teaches on first read — no tap required.
    expect(screen.getByText('오늘 약속이 있어요.')).toBeVisible();
    expect(screen.getByText('I have plans today.')).toBeVisible();

    const disclosure = screen.getByText('왜 · Why').closest('details');
    expect(disclosure).not.toHaveAttribute('open');

    await fireEvent.click(screen.getByText('왜 · Why'));

    expect(disclosure).toHaveAttribute('open');
    expect(screen.getByText(/usual way to say you have plans/)).toBeVisible();
  });
});
