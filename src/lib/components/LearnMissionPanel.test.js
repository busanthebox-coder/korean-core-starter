import { fireEvent, render, screen } from '@testing-library/svelte';
import { describe, expect, it, vi } from 'vitest';
import LearnMissionPanel from './LearnMissionPanel.svelte';

describe('LearnMissionPanel', () => {
  it('renders today review as the first actionable mission step', async () => {
    const mission = {
      dueCount: 3,
      weakCount: 0,
      steps: [
        { kind: 'review', label: '복습 3개 비우기', detail: 'Clear cards scheduled for today.', path: '/practice?review=1' },
      ],
    };
    const onOpenChapter = vi.fn();

    render(LearnMissionPanel, { mission, onOpenChapter });
    await fireEvent.click(screen.getByRole('button', { name: /복습 3개 비우기/ }));

    expect(screen.getByText('복습 3개 비우기')).toBeInTheDocument();
    expect(onOpenChapter).not.toHaveBeenCalled();
  });
});
