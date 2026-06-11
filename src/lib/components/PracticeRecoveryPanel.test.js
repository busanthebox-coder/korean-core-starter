import { render, fireEvent, screen } from '@testing-library/svelte';
import { describe, expect, it, vi } from 'vitest';
import PracticeRecoveryPanel from './PracticeRecoveryPanel.svelte';

describe('PracticeRecoveryPanel', () => {
  it('points missed sessions toward weak-item recovery first', async () => {
    const onPracticeWeak = vi.fn();
    const onStudyItem = vi.fn();

    render(PracticeRecoveryPanel, {
      result: { correct: 6, total: 10 },
      weakItems: [
        { id: 'word-001', hangul: '가다', english: 'to go' },
        { id: 'word-002', hangul: '오다', english: 'to come' },
      ],
      dueCount: 3,
      onPracticeWeak,
      onStudyItem,
    });

    expect(screen.getByText('Fix the missed items first')).toBeInTheDocument();
    expect(screen.getByText('가다')).toBeInTheDocument();

    await fireEvent.click(screen.getByRole('button', { name: /Practice weak items/ }));

    expect(onPracticeWeak).toHaveBeenCalledOnce();

    await fireEvent.click(screen.getByRole('button', { name: 'Study 가다' }));

    expect(onStudyItem).toHaveBeenCalledWith(expect.objectContaining({ id: 'word-001' }));
  });

  it('sends a perfect session to due review when review cards exist', async () => {
    const onReviewDue = vi.fn();

    render(PracticeRecoveryPanel, {
      result: { correct: 8, total: 8 },
      weakItems: [],
      dueCount: 4,
      onReviewDue,
    });

    expect(screen.getByText('Lock it in with review')).toBeInTheDocument();

    await fireEvent.click(screen.getByRole('button', { name: /Review 4 due/ }));

    expect(onReviewDue).toHaveBeenCalledOnce();
  });
});
