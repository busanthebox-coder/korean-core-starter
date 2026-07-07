import { fireEvent, render, screen } from '@testing-library/svelte';
import { describe, expect, it, vi } from 'vitest';
import ReadingRoom from './ReadingRoom.svelte';

const sampleReader = {
  id: 'reader-a1-01',
  level: 'A1',
  title: '제 하루',
  titleEn: 'My Day',
  genre: 'diary',
  body: ['저는 민수예요. 학교에 가요.'],
  bodyTranslation: ['I am Minsu. I go to school.'],
  comprehensionQuestions: [
    {
      type: 'multipleChoice',
      prompt: '어디에 가요?',
      options: ['학교', '시장', '병원'],
      correct: '학교',
      explanation: '본문에 학교에 가요라고 나와요.',
    },
    {
      type: 'multipleChoice',
      prompt: '누가 나와요?',
      options: ['민수', '수진', '지민'],
      correct: '민수',
      explanation: '첫 문장에 민수가 나와요.',
    },
    {
      type: 'multipleChoice',
      prompt: '문체는 어떤 느낌이에요?',
      options: ['쉬운 일기', '뉴스', '공지'],
      correct: '쉬운 일기',
      explanation: '짧고 쉬운 하루 이야기예요.',
    },
    {
      type: 'multipleChoice',
      prompt: '가장 알맞은 요약은?',
      options: ['학교에 가요', '장을 봐요', '운전해요'],
      correct: '학교에 가요',
      explanation: '본문의 중심 행동은 학교에 가는 거예요.',
    },
  ],
  summaryPrompt: '두 문장으로 요약해 보세요.',
  newWords: ['민수'],
};

describe('ReadingRoom', () => {
  it('renders the level list and opens a reader card', async () => {
    const onOpenReader = vi.fn();
    render(ReadingRoom, {
      readers: [sampleReader],
      progress: {},
      onOpenReader,
    });

    await fireEvent.click(screen.getByRole('button', { name: /제 하루/ }));

    expect(screen.getByText('Reading Room')).toBeTruthy();
    expect(onOpenReader).toHaveBeenCalledWith(sampleReader);
  });

  it('shows a safe fallback for an unknown reader id', () => {
    render(ReadingRoom, { reader: null, readerId: 'reader-missing' });

    expect(screen.getByText('That reading piece is not in this build.')).toBeTruthy();
  });

  it('emits score and summary after all four questions are answered', async () => {
    const onComplete = vi.fn();
    render(ReadingRoom, {
      reader: sampleReader,
      readers: [sampleReader],
      progress: {},
      onComplete,
    });

    await fireEvent.click(screen.getByRole('button', { name: '학교' }));
    await fireEvent.click(screen.getByRole('button', { name: '민수' }));
    await fireEvent.click(screen.getByRole('button', { name: '쉬운 일기' }));
    await fireEvent.click(screen.getByRole('button', { name: '학교에 가요' }));
    await fireEvent.input(screen.getByLabelText('Summary'), { target: { value: '민수는 학교에 가요.' } });
    await fireEvent.click(screen.getByRole('button', { name: 'Mark complete' }));

    expect(onComplete).toHaveBeenCalledWith({
      id: 'reader-a1-01',
      score: 4,
      total: 4,
      summary: '민수는 학교에 가요.',
    });
  });
});
