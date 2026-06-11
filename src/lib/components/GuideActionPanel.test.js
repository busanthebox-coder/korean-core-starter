import { render, fireEvent, screen } from '@testing-library/svelte';
import { describe, expect, it, vi } from 'vitest';
import GuideActionPanel from './GuideActionPanel.svelte';

describe('GuideActionPanel', () => {
  it('connects a situation guide to review, focused practice, and readiness', async () => {
    const onAddReview = vi.fn();
    const onPractice = vi.fn();
    const onToggleReady = vi.fn();

    render(GuideActionPanel, {
      unit: { title: 'Open a bank account' },
      vocab: [{ id: 'expr-001' }, { id: 'word-001' }],
      ready: false,
      onAddReview,
      onPractice,
      onToggleReady,
    });

    await fireEvent.click(screen.getByRole('button', { name: /Add 2 guide items/ }));
    await fireEvent.click(screen.getByRole('button', { name: /Practice this situation/ }));
    await fireEvent.click(screen.getByRole('button', { name: /Mark ready/ }));

    expect(onAddReview).toHaveBeenCalledOnce();
    expect(onPractice).toHaveBeenCalledOnce();
    expect(onToggleReady).toHaveBeenCalledOnce();
  });
});
