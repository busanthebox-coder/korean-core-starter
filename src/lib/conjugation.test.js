import { describe, it, expect } from 'vitest';
import { explainForm } from './conjugation.js';

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
