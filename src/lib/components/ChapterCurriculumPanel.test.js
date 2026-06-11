import { render, screen } from '@testing-library/svelte';
import { describe, expect, it } from 'vitest';
import ChapterCurriculumPanel from './ChapterCurriculumPanel.svelte';

describe('ChapterCurriculumPanel', () => {
  it('shows track, layers, prerequisites, and the chapter exit task', () => {
    render(ChapterCurriculumPanel, {
      chapter: {
        curriculumTrack: { label: 'A2 Builder', cefr: 'A2', description: 'Tense and connectors.' },
        learningLayers: [
          { id: 'core', label: 'Core', purpose: 'Master first.', itemIds: ['w1', 'w2'] },
          { id: 'expand', label: 'Expand', purpose: 'Add range.', itemIds: ['e1'] },
          { id: 'reference', label: 'Reference', purpose: 'Check grammar.', grammarIds: ['g1'] },
        ],
        prerequisiteChapterIds: ['chapter-11'],
        exitTask: {
          canDo: 'Tell a friend what happened yesterday.',
          prompt: "Answer '어제 뭐 했어요?'",
          sampleAnswer: { ko: '친구랑 영화를 봤어요.', en: 'I watched a movie with a friend.' },
          checklist: ['Use past tense.', 'Check particles.', 'Say it aloud.'],
        },
        naturalWhy: {
          title: 'Why past tense sounds natural here',
          todayScene: 'Someone asks 어제 뭐 했어요?',
          lessNatural: { ko: '어제 영화를 봐요.', en: 'Yesterday I watch a movie.' },
          natural: { ko: '어제 영화를 봤어요.', en: 'Yesterday I watched a movie.' },
          why: '어제 points to a finished time, so the verb ending should match.',
          koreanSense: ['어제 봤어요 feels finished.'],
          nativeCorrections: [{ from: '어제 카페에 가요.', to: '어제 카페에 갔어요.' }],
          practiceFrame: '어제 ___을/를 ___었어요.',
          practiceExamples: ['어제 커피를 마셨어요.'],
          askNative: ['이 문장 자연스러워요?'],
        },
      },
      prerequisites: [{ id: 'chapter-11', number: 11, title: 'Connecting Ideas' }],
    });

    expect(screen.getByText('A2 Builder')).toBeInTheDocument();
    expect(screen.getByText('Core')).toBeInTheDocument();
    expect(screen.getByText('Expand')).toBeInTheDocument();
    expect(screen.getByText('Reference')).toBeInTheDocument();
    expect(screen.getByText('Ch 11 · Connecting Ideas')).toBeInTheDocument();
    expect(screen.getByText('Can-do task')).toBeInTheDocument();
    expect(screen.getByText('친구랑 영화를 봤어요.')).toBeInTheDocument();
    expect(screen.getByText('Natural why')).toBeInTheDocument();
    expect(screen.getByText('어제 영화를 봐요.')).toBeInTheDocument();
    expect(screen.getByText('어제 영화를 봤어요.')).toBeInTheDocument();
    expect(screen.getByText('어제 ___을/를 ___었어요.')).toBeInTheDocument();
  });
});
