import { render, screen } from '@testing-library/svelte';
import { describe, expect, it } from 'vitest';
import PracticeSetupPanel from './PracticeSetupPanel.svelte';

describe('PracticeSetupPanel', () => {
  it('shows a focused item set when opened from guide or dictionary links', () => {
    render(PracticeSetupPanel, {
      entries: [],
      chapters: [],
      kindOptions: [['all', 'All']],
      kindCounts: { all: 2 },
      focusCount: 2,
      poolLength: 2,
      goal: 5,
      canBuild: true,
      canRecognize: false,
    });

    expect(screen.getByRole('option', { name: 'Focused items (2)' })).toBeInTheDocument();
  });

  it('shows the next review time when due review is empty', () => {
    render(PracticeSetupPanel, {
      entries: [],
      chapters: [],
      kindOptions: [['all', 'All']],
      kindCounts: { all: 0 },
      deckSize: 4,
      poolLength: 0,
      goal: 5,
      nextDueLabel: 'in about 2 hours',
    });

    expect(screen.getByText(/next review in about 2 hours/i)).toBeInTheDocument();
  });

  it('shows listening mode only when Korean speech is available', async () => {
    const baseProps = {
      entries: [],
      chapters: [],
      kindOptions: [['all', 'All']],
      kindCounts: { all: 4 },
      poolLength: 4,
      goal: 5,
      canRecognize: true,
      canListen: false,
      listeningCount: 12,
    };

    const { rerender } = render(PracticeSetupPanel, baseProps);
    expect(screen.queryByRole('button', { name: /Listening/ })).not.toBeInTheDocument();

    await rerender({ ...baseProps, canListen: true });
    expect(screen.getByRole('button', { name: /Listening/ })).toBeInTheDocument();
    expect(screen.getByText('12 sentences ready')).toBeInTheDocument();
  });
});
