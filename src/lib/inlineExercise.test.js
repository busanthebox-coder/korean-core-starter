import { describe, expect, it } from 'vitest';
import { answerVariants, exerciseAnswerMatches, orderAnswer, scrambledOptions, scrambledOrderTokens } from './inlineExercise.js';

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

  it('scrambles options without losing or duplicating any option', () => {
    const options = ['강아지 한 마리', '강아지 한 명', '강아지 한 권'];
    const scrambled = scrambledOptions(options, 'seed-a');
    expect(scrambled.slice().sort()).toEqual(options.slice().sort());
    expect(scrambled).toHaveLength(options.length);
  });

  it('gives the same exercise the same order every time (no flicker)', () => {
    const options = ['네', '아니요', '아마도'];
    const a = scrambledOptions(options, 'chapter-02|네');
    const b = scrambledOptions(options, 'chapter-02|네');
    expect(a).toEqual(b);
  });

  it('does not systematically favor any one slot across many exercises', () => {
    // Regression for the reported "정답이 항상 1번" bug: stored content skews
    // ~84% correct-in-slot-1. A first fix (chained seeded RNG) only moved the
    // bias, and a second fix (hash-sort + an "avoid identity order" nudge)
    // deterministically relocated the stored-first option to the LAST slot
    // instead — still 0% chance of landing first. Assert all three slots land
    // within a generous band of the 1/3 each we'd expect from a fair shuffle,
    // not just "not always first".
    const slotCount = [0, 0, 0];
    const trials = 900;
    for (let i = 0; i < trials; i++) {
      const options = ['정답', '오답A', '오답B'];
      const scrambled = scrambledOptions(options, `question prompt number ${i}`);
      slotCount[scrambled.indexOf('정답')]++;
    }
    for (const count of slotCount) {
      expect(count).toBeGreaterThan(trials * 0.2);
      expect(count).toBeLessThan(trials * 0.47);
    }
  });

  it('leaves a 2-option pair correctly gradeable regardless of display order', () => {
    const options = ['맞아요', '틀려요'];
    const scrambled = scrambledOptions(options, 'binary-seed');
    expect(scrambled.slice().sort()).toEqual(options.slice().sort());
  });
});
