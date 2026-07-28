import { fireEvent, render, screen } from '@testing-library/svelte';
import { beforeEach, describe, expect, it } from 'vitest';
import LessonPlayer from './LessonPlayer.svelte';

beforeEach(() => localStorage.clear());

describe('LessonPlayer writing self-check', () => {
  const screens = [{
    phase: 'practice',
    kind: 'writing',
    data: {
      prompt: '오늘 한 일을 써 보세요.',
      checkItems: [
        { id: 'past', label: 'Did you use 『-았/었어요』?' },
        { id: 'but', label: 'Did you use 『-지만』?' },
      ],
    },
  }];

  it('locks Finish until every self-check item is checked', async () => {
    render(LessonPlayer, { props: { screens } });

    const finish = screen.getByRole('button', { name: /Finish/ });
    expect(finish).toBeDisabled();

    await fireEvent.click(screen.getByLabelText('Did you use 『-았/었어요』?'));
    expect(finish).toBeDisabled();

    await fireEvent.click(screen.getByLabelText('Did you use 『-지만』?'));
    expect(finish).not.toBeDisabled();
  });

  it('allows the learner to skip the self-check without blocking the lesson', async () => {
    render(LessonPlayer, { props: { screens } });

    const finish = screen.getByRole('button', { name: /Finish/ });
    await fireEvent.click(screen.getByRole('button', { name: /Skip self-check/ }));

    expect(finish).not.toBeDisabled();
  });

  it('adds a say-it screen and records the spoken day after all lines are checked', async () => {
    const chapter = {
      id: 'chapter-say',
      number: 99,
      title: 'Speaking check',
      extendedDialogue: {
        lines: [
          { speaker: '튜터', ko: '오늘 어디에 갈 거예요?' },
          { speaker: '학습자', ko: '저는 학교에 갈 거예요.' },
          { speaker: '튜터', ko: '몇 시에 갈 거예요?' },
          { speaker: '학습자', ko: '아침 아홉 시에 학교에 가요.' },
          { speaker: '학습자', ko: '내일 같이 갈 수 있어요?' },
        ],
      },
    };
    render(LessonPlayer, { props: { chapter } });

    await fireEvent.click(screen.getByRole('button', { name: /Next/ }));
    expect(screen.getByRole('heading', { name: 'Say it out loud' })).toBeInTheDocument();

    const saidButtons = screen.getAllByRole('button', { name: 'I said it' });
    for (const button of saidButtons) await fireEvent.click(button);

    expect(JSON.parse(localStorage.getItem('kcs.spoken-v1'))['chapter-say']).toHaveLength(1);
    expect(screen.getAllByRole('button', { name: 'Said out loud' })).toHaveLength(3);
  });

  it('resumes a chapter from the last screen the learner reached', async () => {
    const chapter = {
      id: 'chapter-resume',
      number: 98,
      title: 'Resume check',
      extendedDialogue: {
        lines: [
          { speaker: 'A', ko: '오늘 시간 있어요?' },
          { speaker: 'B', ko: '네, 저녁에는 시간 있어요.' },
          { speaker: 'A', ko: '그럼 같이 저녁 먹어요.' },
        ],
      },
    };
    const firstVisit = render(LessonPlayer, { props: { chapter } });

    await fireEvent.click(screen.getByRole('button', { name: /Next/ }));
    expect(screen.getByRole('heading', { name: 'Say it out loud' })).toBeInTheDocument();
    firstVisit.unmount();

    render(LessonPlayer, { props: { chapter } });
    expect(screen.getByRole('heading', { name: 'Say it out loud' })).toBeInTheDocument();
  });

  // Four words per screen — a single word per tap meant far too many clicks
  // to get through a chapter's vocabulary.
  it('shows up to four vocabulary entries on one lesson screen', () => {
    const chapter = {
      id: 'chapter-word-chunks',
      number: 97,
      title: 'Small word groups',
      extendedVocabulary: Array.from({ length: 7 }, (_, index) => ({
        hangul: `단어${index + 1}`,
        romanization: `daneo ${index + 1}`,
        english: `word ${index + 1}`,
        partOfSpeech: 'noun',
      })),
    };

    render(LessonPlayer, { props: { chapter } });

    expect(screen.getAllByRole('button', { name: 'Play pronunciation' })).toHaveLength(4);
    expect(screen.getByText('word 1')).toBeInTheDocument();
    expect(screen.getByText('word 4')).toBeInTheDocument();
    expect(screen.queryByText('word 5')).not.toBeInTheDocument();
  });
});
