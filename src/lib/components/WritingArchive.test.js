import { fireEvent, render, screen } from '@testing-library/svelte';
import { describe, expect, it, vi } from 'vitest';
import WritingArchive from './WritingArchive.svelte';

describe('WritingArchive', () => {
  it('shows an empty state when there are no saved writings', () => {
    render(WritingArchive, { props: { archive: {}, chapters: [] } });

    expect(screen.getByText(/아직 저장된 글이 없어요/)).toBeInTheDocument();
  });

  it('groups writing by chapter, newest first, and opens the selected chapter', async () => {
    const onOpenChapter = vi.fn();
    const chapters = [
      { id: 'chapter-01', number: 1, title: 'Hangul' },
      { id: 'chapter-02', number: 2, title: 'Introductions' },
    ];
    const archive = {
      'chapter-01': [
        { text: '첫 글', date: 10, checked: true },
        { text: '최근 글', date: 30, checked: false },
      ],
      'chapter-02': [{ text: '둘째 챕터', date: 20, checked: true }],
    };

    render(WritingArchive, { props: { archive, chapters, onOpenChapter } });

    expect(screen.getByText('내가 쓴 글')).toBeInTheDocument();
    expect(screen.getByText('최근 글')).toBeInTheDocument();
    expect(screen.getByText('첫 글')).toBeInTheDocument();
    expect(screen.getByText('점검 건너뜀')).toBeInTheDocument();

    const buttons = screen.getAllByRole('button', { name: '이 챕터 다시 쓰기' });
    await fireEvent.click(buttons[0]);

    expect(onOpenChapter).toHaveBeenCalledWith(chapters[0]);
  });
});
