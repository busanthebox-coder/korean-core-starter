import { fireEvent, render, screen } from '@testing-library/svelte';
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
  it('marks onboarding complete when the learner starts from chapter 1', async () => {
    const onClose = vi.fn();
    render(Onboarding, { props: { chapters, onClose } });

    await fireEvent.click(screen.getByRole('button', { name: /처음부터 시작/ }));

    expect(localStorage.getItem('kcs.onboarded-v1')).toBe('1');
    expect(onClose).toHaveBeenCalled();
  });

  it('recommends the first B1 chapter after passing A1, A2, and B1 rounds', async () => {
    const onStartChapter = vi.fn();
    render(Onboarding, { props: { chapters, onStartChapter } });

    await fireEvent.click(screen.getByRole('button', { name: /3분 배치 테스트/ }));
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
