import { describe, expect, it } from 'vitest';
import { gradeReply } from './replyGrader.js';

describe('gradeReply', () => {
  const model = '주말에 친구를 만났어요.';

  it('accepts exact replies without depending on punctuation', () => {
    expect(gradeReply('주말에 친구를 만났어요', model).verdict).toBe('correct');
  });

  it('accepts omitted particles', () => {
    expect(gradeReply('주말에 친구 만났어요', model).verdict).toBe('correct');
  });

  it('accepts changed word order when core tokens are present', () => {
    expect(gradeReply('친구를 주말에 만났어요', model).verdict).toBe('correct');
  });

  it('accepts close verb tense when the same stem is used', () => {
    expect(gradeReply('주말에 친구를 만나요', model).verdict).toBe('correct');
  });

  it('treats short banmal replies as close instead of wrong', () => {
    const graded = gradeReply('친구 만났어', model);
    expect(graded.verdict).toBe('close');
    expect(graded.missing).toContain('주말');
  });

  it('returns missing core tokens for hinting', () => {
    const graded = gradeReply('주말에 만났어요', model);
    expect(graded.verdict).toBe('close');
    expect(graded.missing).toContain('친구');
  });

  it('rejects blank or unrelated replies', () => {
    expect(gradeReply('', model).verdict).toBe('wrong');
    expect(gradeReply('   ', model).verdict).toBe('wrong');
    expect(gradeReply('네', model).verdict).toBe('wrong');
  });

  it('accepts extra clauses when the core reply is present', () => {
    expect(gradeReply('주말에 친구를 만났어요 진짜 재미있었어요', model).verdict).toBe('correct');
  });

  it.each([
    '주말에 학교에 갔어요',
    '친구가 학교에 있어요',
    '만났어요',
    '어제 영화 봤어요',
    '주말 주말 네',
  ])('keeps false-positive reply wrong: %s', (typed) => {
    expect(gradeReply(typed, model).verdict).toBe('wrong');
  });

  it('ignores casual laughter and crying markers in real roleplay replies', () => {
    const graded = gradeReply('안 자 요즘 잠 안 와', '아니 안 자 ㅋㅋ 요즘 잠이 안 와');
    expect(graded.verdict).toBe('correct');
  });

  it('keeps common adverbs intact when reporting missing tokens', () => {
    const graded = gradeReply('많이 바빠요', '아니 많이 바빠요');
    expect(graded.verdict).toBe('close');
    expect(graded.missing).toContain('아니');
  });
});
