import { describe, expect, it } from 'vitest';
import {
  checkpointSlots,
  maybeInsertSpiralReview,
  sampleCheckpointExercises,
  seededRng,
  weakChapterSummary,
} from './checkpoints.js';

function exercise(type, correct = '정답') {
  return { type, prompt: `${type}?`, correct, explanation: 'Because this is the target pattern.' };
}

function chapter(number, trackId, label, types = ['multipleChoice', 'fillBlank', 'errorCorrect']) {
  return {
    id: `chapter-${String(number).padStart(2, '0')}`,
    number,
    title: `Chapter ${number}`,
    curriculumTrack: { id: trackId, label },
    inlineExercises: types.map((type) => exercise(type)),
  };
}

describe('checkpoint slots', () => {
  it('places checkpoints after the first three curriculum tracks', () => {
    const chapters = [
      chapter(1, 'a1-foundation', 'A1 Foundation'),
      chapter(2, 'a1-foundation', 'A1 Foundation'),
      chapter(3, 'a2-builder', 'A2 Builder'),
      chapter(4, 'a2-builder', 'A2 Builder'),
      chapter(5, 'b1-independent', 'B1 Independent Korean'),
      chapter(6, 'b2-advanced-control', 'B2 Advanced Control'),
    ];

    expect(checkpointSlots(chapters)).toEqual([
      expect.objectContaining({ id: 'checkpoint-a1-foundation', track: 'A1', afterChapterId: 'chapter-02' }),
      expect.objectContaining({ id: 'checkpoint-a2-builder', track: 'A2', afterChapterId: 'chapter-04' }),
      expect.objectContaining({ id: 'checkpoint-b1-independent', track: 'B1', afterChapterId: 'chapter-05' }),
    ]);
  });
});

describe('checkpoint sampling', () => {
  it('samples at most two questions per chapter and avoids consecutive types when possible', () => {
    const chapters = [
      chapter(1, 'a1-foundation', 'A1 Foundation', ['multipleChoice', 'fillBlank', 'errorCorrect']),
      chapter(2, 'a1-foundation', 'A1 Foundation', ['multipleChoice', 'fillBlank', 'orderWords']),
      chapter(3, 'a1-foundation', 'A1 Foundation', ['particleChoice', 'conjugate', 'errorCorrect']),
    ];
    const [slot] = checkpointSlots(chapters);
    const questions = sampleCheckpointExercises(chapters, slot, {
      count: 5,
      maxPerChapter: 2,
      rng: seededRng('sample'),
    });
    const perChapter = questions.reduce((acc, question) => {
      acc[question.sourceChapterId] = (acc[question.sourceChapterId] || 0) + 1;
      return acc;
    }, {});

    expect(questions).toHaveLength(5);
    expect(Math.max(...Object.values(perChapter))).toBeLessThanOrEqual(2);
    for (let index = 1; index < questions.length; index += 1) {
      expect(questions[index].type).not.toBe(questions[index - 1].type);
    }
  });
});

describe('weak chapter summary', () => {
  it('sorts weak chapters by wrong answers and accuracy', () => {
    const summary = weakChapterSummary([
      { sourceChapterId: 'chapter-01', sourceChapterNumber: 1, sourceChapterTitle: 'One', correct: false },
      { sourceChapterId: 'chapter-01', sourceChapterNumber: 1, sourceChapterTitle: 'One', correct: false },
      { sourceChapterId: 'chapter-02', sourceChapterNumber: 2, sourceChapterTitle: 'Two', correct: false },
      { sourceChapterId: 'chapter-02', sourceChapterNumber: 2, sourceChapterTitle: 'Two', correct: true },
    ]);

    expect(summary.map((item) => item.chapterId)).toEqual(['chapter-01', 'chapter-02']);
    expect(summary[0]).toEqual(expect.objectContaining({ wrong: 2, accuracy: 0 }));
  });
});

describe('spiral review insertion', () => {
  it('inserts one review exercise from the previous three chapters when the rate hits', () => {
    const chapters = [
      chapter(1, 'a1-foundation', 'A1 Foundation'),
      chapter(2, 'a1-foundation', 'A1 Foundation'),
      chapter(3, 'a1-foundation', 'A1 Foundation'),
      chapter(4, 'a1-foundation', 'A1 Foundation'),
    ];
    const screens = [{ phase: 'practice', kind: 'exercise', data: exercise('fillBlank') }];
    const withReview = maybeInsertSpiralReview(screens, chapters, chapters[3], {
      rate: 1,
      rng: seededRng('spiral'),
    });

    expect(withReview).toHaveLength(2);
    expect(withReview[1].data.isSpiralReview).toBe(true);
    expect(['chapter-01', 'chapter-02', 'chapter-03']).toContain(withReview[1].data.sourceChapterId);
  });
});
