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
});
