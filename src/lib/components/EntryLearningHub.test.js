import { render, fireEvent, screen } from '@testing-library/svelte';
import { describe, expect, it, vi } from 'vitest';
import EntryLearningHub from './EntryLearningHub.svelte';

describe('EntryLearningHub', () => {
  it('offers review, focused practice, and chapter return actions for an entry', async () => {
    const onAddReview = vi.fn();
    const onPractice = vi.fn();
    const onOpenChapter = vi.fn();

    render(EntryLearningHub, {
      entry: { id: 'word-001', hangul: '가다' },
      chapter: { number: 6, title: 'Places And Time' },
      inDeck: false,
      onAddReview,
      onPractice,
      onOpenChapter,
    });

    await fireEvent.click(screen.getByRole('button', { name: /Add to review/ }));
    await fireEvent.click(screen.getByRole('button', { name: /Practice this item/ }));
    await fireEvent.click(screen.getByRole('button', { name: /Open Ch 6/ }));

    expect(onAddReview).toHaveBeenCalledOnce();
    expect(onPractice).toHaveBeenCalledOnce();
    expect(onOpenChapter).toHaveBeenCalledOnce();
  });
});
