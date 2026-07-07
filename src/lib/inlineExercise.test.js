import { describe, expect, it } from 'vitest';
import { answerVariants, exerciseAnswerMatches, orderAnswer, scrambledOrderTokens } from './inlineExercise.js';

describe('inline exercise grading', () => {
  it('accepts correct and accepted answer variants', () => {
    const exercise = { correct: '먹었어요/먹었습니다', accepted: ['먹었어요.'] };
    expect(answerVariants(exercise)).toEqual(['먹었어요', '먹었습니다', '먹었어요.']);
    expect(exerciseAnswerMatches(exercise, ' 먹었어요! ')).toBe(true);
    expect(exerciseAnswerMatches(exercise, '먹습니다')).toBe(false);
  });

  it('grades word-order answers after token assembly', () => {
    const tokens = ['오늘 아침에', '카페에서', '커피를', '마셨어요'];
    expect(orderAnswer(tokens)).toBe('오늘 아침에 카페에서 커피를 마셨어요');
    expect(exerciseAnswerMatches({ correct: orderAnswer(tokens) }, '오늘아침에 카페에서 커피를 마셨어요.')).toBe(true);
  });

  it('scrambles order tokens without losing any token', () => {
    const tokens = ['주말에', '친구를', '만났어요'];
    const scrambled = scrambledOrderTokens(tokens);
    expect(scrambled).not.toEqual(tokens);
    expect(scrambled.slice().sort()).toEqual(tokens.slice().sort());
  });
});
