import { describe, it, expect } from 'vitest';
import { explainForm, conjugate } from './conjugation.js';

describe('explainForm (past tense rules)', () => {
  it('consonant-stem verb (먹다)', () => {
    const r = explainForm({ hangul: '먹다', forms: { past: '먹었어요' } }, 'past');
    expect(r).toContain('먹었어요');
    expect(r).toMatch(/consonant/);
  });
  it('하다-verb (공부하다)', () => {
    const r = explainForm({ hangul: '공부하다', forms: { past: '공부했어요' } }, 'past');
    expect(r).toMatch(/하다-verb/);
    expect(r).toContain('공부했어요');
  });
  it('vowel-contraction verb (자다)', () => {
    const r = explainForm({ hangul: '자다', forms: { past: '잤어요' } }, 'past');
    expect(r).toMatch(/contract|merges/);
    expect(r).toContain('잤어요');
  });
  it('ㄷ-irregular (듣다)', () => {
    const r = explainForm({ hangul: '듣다', irregular: 'ㄷ irregular', forms: { past: '들었어요' } }, 'past');
    expect(r).toMatch(/ㄷ-irregular/);
  });
  it('returns null for non-아/어 forms (want)', () => {
    expect(explainForm({ hangul: '먹다', forms: { want: '먹고 싶어요' } }, 'want')).toBeNull();
  });
});

describe('conjugate (on-demand form generation)', () => {
  // hangul, pos → [politePresent, past, formalPresent, future]
  const CASES = {
    '먹다': ['verb', '먹어요', '먹었어요', '먹습니다', '먹을 거예요'],
    '가다': ['verb', '가요', '갔어요', '갑니다', '갈 거예요'],
    '오다': ['verb', '와요', '왔어요', '옵니다', '올 거예요'],
    '주다': ['verb', '줘요', '줬어요', '줍니다', '줄 거예요'],
    '마시다': ['verb', '마셔요', '마셨어요', '마십니다', '마실 거예요'],
    '하다': ['verb', '해요', '했어요', '합니다', '할 거예요'],
    '공부하다': ['verb', '공부해요', '공부했어요', '공부합니다', '공부할 거예요'],
    '크다': ['adjective', '커요', '컸어요', '큽니다', '클 거예요'],
    '바쁘다': ['adjective', '바빠요', '바빴어요', '바쁩니다', '바쁠 거예요'],
    '예쁘다': ['adjective', '예뻐요', '예뻤어요', '예쁩니다', '예쁠 거예요'],
    '모르다': ['verb', '몰라요', '몰랐어요', '모릅니다', '모를 거예요'],
    '부르다': ['verb', '불러요', '불렀어요', '부릅니다', '부를 거예요'],
    '덥다': ['adjective', '더워요', '더웠어요', '덥습니다', '더울 거예요'],
    '무겁다': ['adjective', '무거워요', '무거웠어요', '무겁습니다', '무거울 거예요'],
    '귀엽다': ['adjective', '귀여워요', '귀여웠어요', '귀엽습니다', '귀여울 거예요'],
    '돕다': ['verb', '도와요', '도왔어요', '돕습니다', '도울 거예요'],
    '듣다': ['verb', '들어요', '들었어요', '듣습니다', '들을 거예요'],
    '걷다': ['verb', '걸어요', '걸었어요', '걷습니다', '걸을 거예요'],
    '짓다': ['verb', '지어요', '지었어요', '짓습니다', '지을 거예요'],
    '낫다': ['adjective', '나아요', '나았어요', '낫습니다', '나을 거예요'],
    '빨갛다': ['adjective', '빨개요', '빨갰어요', '빨갛습니다', '빨갈 거예요'],
    '그렇다': ['adjective', '그래요', '그랬어요', '그렇습니다', '그럴 거예요'],
    '좋다': ['adjective', '좋아요', '좋았어요', '좋습니다', '좋을 거예요'], // ㅎ but regular
    '좁다': ['adjective', '좁아요', '좁았어요', '좁습니다', '좁을 거예요'], // ㅂ but regular
    '입다': ['verb', '입어요', '입었어요', '입습니다', '입을 거예요'],     // ㅂ but regular
    '살다': ['verb', '살아요', '살았어요', '삽니다', '살 거예요'],        // ㄹ stem
    '있다': ['verb', '있어요', '있었어요', '있습니다', '있을 거예요'],
  };

  for (const [hangul, [pos, polite, past, formal, future]] of Object.entries(CASES)) {
    it(`${hangul} → ${polite}`, () => {
      const f = conjugate(hangul, { partOfSpeech: pos });
      expect(f).not.toBeNull();
      expect(f.politePresent).toBe(polite);
      expect(f.past).toBe(past);
      expect(f.formalPresent).toBe(formal);
      expect(f.future).toBe(future);
    });
  }

  it('adjectives omit verb-only modal forms', () => {
    const f = conjugate('춥다', { partOfSpeech: 'adjective' });
    expect(f.want).toBeUndefined();
    expect(f.cannot).toBeUndefined();
    expect(f.negative).toBe('안 추워요');
  });

  it('하다 verbs get natural split negatives', () => {
    const f = conjugate('공부하다', { partOfSpeech: 'verb' });
    expect(f.negative).toBe('공부 안 해요');
    expect(f.cannot).toBe('공부 못 해요');
    expect(f.want).toBe('공부하고 싶어요');
  });

  it('returns null for non-다 input', () => {
    expect(conjugate('사과', { partOfSpeech: 'noun' })).toBeNull();
    expect(conjugate('', {})).toBeNull();
  });
});
