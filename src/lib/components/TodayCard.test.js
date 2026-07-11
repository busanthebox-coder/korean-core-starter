import { fireEvent, render, screen } from '@testing-library/svelte';
import { describe, expect, it, vi } from 'vitest';
import TodayCard from './TodayCard.svelte';

describe('TodayCard', () => {
  it('shows one primary start action and starts the first planned step', async () => {
    const onStart = vi.fn();
    render(TodayCard, {
      plan: [{ kind: 'review', label: 'Review 2 due' }, { kind: 'lesson', label: 'Continue Chapter 4' }],
      totalChapters: 65,
      onStart,
    });

    expect(screen.getByText('Review 2 due')).toBeInTheDocument();
    expect(screen.queryByText('Continue Chapter 4')).not.toBeInTheDocument();

    await fireEvent.click(screen.getByRole('button', { name: 'Start now' }));
    expect(onStart).toHaveBeenCalledOnce();
  });

  it('renders course mastery from the mastery summary object', () => {
    const { container } = render(TodayCard, {
      plan: [],
      totalChapters: 65,
      courseMastery: { pct: 32 },
    });

    expect(container.querySelector('.mastery span')?.style.width).toBe('32%');
  });
});
