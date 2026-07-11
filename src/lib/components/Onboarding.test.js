import { fireEvent, render, screen, within } from '@testing-library/svelte';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import Onboarding from './Onboarding.svelte';
import bank from '../placementBank.json';

const chapters = [
  { id: 'chapter-01', number: 1, level: 'A1', title: 'Hangul' },
  { id: 'chapter-17', number: 17, level: 'A2', title: 'Past Tense' },
  { id: 'chapter-37', number: 37, level: 'B1', title: 'Reported Speech' },
];

beforeEach(() => localStorage.clear());

describe('Onboarding', () => {
  it('opens the placement questions directly when the learner requests the optional test', async () => {
    render(Onboarding, { props: { chapters, startWithPlacement: true } });

    expect(await screen.findByRole('progressbar')).toHaveAttribute('aria-valuenow', '0');
    expect(screen.queryByRole('button', { name: /Start with Hangul/ })).not.toBeInTheDocument();
  });

  it('gives a true beginner clear English start choices and a non-interactive study sequence', async () => {
    render(Onboarding, { props: { chapters } });

    expect(await screen.findByRole('heading', { name: /Choose where to start/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Start with Hangul/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Take the 3-minute placement test/ })).toBeInTheDocument();
    expect(screen.getByRole('list', { name: /A short lesson has four steps/ })).toBeInTheDocument();
    expect(screen.getAllByRole('listitem')).toHaveLength(4);
    const startChoices = screen.getByRole('group', { name: /Choose your starting point/ });
    expect(within(startChoices).getAllByRole('button')).toHaveLength(2);
    expect(within(screen.getByRole('list')).queryByRole('button')).not.toBeInTheDocument();
    expect(screen.getByRole('dialog')).toHaveAttribute('open');
  });

  it('marks onboarding complete when the learner starts from chapter 1', async () => {
    const onClose = vi.fn();
    render(Onboarding, { props: { chapters, onClose } });

    await fireEvent.click(await screen.findByRole('button', { name: /Start with Hangul/ }));

    expect(localStorage.getItem('kcs.onboarded-v1')).toBe('1');
    expect(onClose).toHaveBeenCalled();
  });

  it('recommends the first B1 chapter after passing A1, A2, and B1 rounds', async () => {
    const onStartChapter = vi.fn();
    render(Onboarding, { props: { chapters, onStartChapter } });

    await fireEvent.click(await screen.findByRole('button', { name: /Take the 3-minute placement test/ }));
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '0');
    expect(screen.getByRole('heading', { name: bank[0].prompt })).toHaveFocus();
    for (const question of bank) {
      const correct = question.choices.find((choice) => choice.correct);
      await fireEvent.click(screen.getByRole('button', { name: correct.ko }));
    }
    await fireEvent.click(screen.getByRole('button', { name: /여기서 시작/ }));

    expect(localStorage.getItem('kcs.onboarded-v1')).toBe('1');
    expect(localStorage.getItem('kcs.start-chapter-v1')).toBe('chapter-37');
    expect(onStartChapter).toHaveBeenCalledWith(chapters[2]);
  });
});
