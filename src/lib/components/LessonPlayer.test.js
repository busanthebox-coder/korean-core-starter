import { fireEvent, render, screen } from '@testing-library/svelte';
import { beforeEach, describe, expect, it } from 'vitest';
import LessonPlayer from './LessonPlayer.svelte';

beforeEach(() => localStorage.clear());

describe('LessonPlayer writing self-check', () => {
  const screens = [{
    phase: 'practice',
    kind: 'writing',
    data: {
      prompt: '오늘 한 일을 써 보세요.',
      checkItems: [
        { id: 'past', label: '『-았/었어요』를 썼나요?' },
        { id: 'but', label: '『-지만』를 썼나요?' },
      ],
    },
  }];

  it('locks Finish until every self-check item is checked', async () => {
    render(LessonPlayer, { props: { screens } });

    const finish = screen.getByRole('button', { name: /Finish/ });
    expect(finish).toBeDisabled();

    await fireEvent.click(screen.getByLabelText('『-았/었어요』를 썼나요?'));
    expect(finish).toBeDisabled();

    await fireEvent.click(screen.getByLabelText('『-지만』를 썼나요?'));
    expect(finish).not.toBeDisabled();
  });

  it('allows the learner to skip the self-check without blocking the lesson', async () => {
    render(LessonPlayer, { props: { screens } });

    const finish = screen.getByRole('button', { name: /Finish/ });
    await fireEvent.click(screen.getByRole('button', { name: /Skip self-check/ }));

    expect(finish).not.toBeDisabled();
  });
});
