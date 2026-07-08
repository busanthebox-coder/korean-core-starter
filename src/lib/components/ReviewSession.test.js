import { fireEvent, render, screen } from '@testing-library/svelte';
import { beforeEach, describe, expect, it } from 'vitest';
import ReviewSession from './ReviewSession.svelte';

beforeEach(() => {
  localStorage.clear();
});

describe('ReviewSession', () => {
  it('records streak activity when a review card is graded', async () => {
    render(ReviewSession, {
      cards: [{ id: 'word-a', hangul: '학교', romanization: 'hakgyo', english: 'school' }],
      onDone: () => {},
    });

    await fireEvent.click(screen.getByRole('button', { name: /Show answer/ }));
    await fireEvent.click(screen.getByRole('button', { name: /Good/ }));

    expect(JSON.parse(localStorage.getItem('kcs.streak-v1'))).toMatchObject({ current: 1, best: 1 });
  });
});
