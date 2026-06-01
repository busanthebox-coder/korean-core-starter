import { describe, it, expect } from 'vitest';
import { romanizeKorean } from './romanize.js';

describe('romanizeKorean', () => {
  it('basic + liaison', () => {
    expect(romanizeKorean('먹어요')).toBe('meogeoyo');
    expect(romanizeKorean('읽어요')).toBe('ilgeoyo');
  });
  it('받침 nasalization', () => {
    expect(romanizeKorean('감사합니다')).toBe('gamsahamnida');
    expect(romanizeKorean('먹습니다')).toBe('meokseumnida');
  });
  it('ㄹ-assimilation', () => {
    expect(romanizeKorean('정류장')).toBe('jeongnyujang');
    expect(romanizeKorean('신라')).toBe('silla');
  });
  it('palatalization (구개음화): ㄷ/ㅌ + 이 → 지/치', () => {
    expect(romanizeKorean('같이')).toBe('gachi');
    expect(romanizeKorean('굳이')).toBe('guji');
    expect(romanizeKorean('맏이')).toBe('maji');
  });
  it('ㅀ liaison + intervocalic ㄹ → r', () => {
    expect(romanizeKorean('싫어요')).toBe('sireoyo');
    expect(romanizeKorean('다리')).toBe('dari');
  });
  it('nasalization across a word boundary (space)', () => {
    expect(romanizeKorean('몇 명')).toBe('myeon myeong');
  });
  it('aspiration (격음화): ㅎ + ㄱ/ㄷ/ㅂ/ㅈ → ㅋ/ㅌ/ㅍ/ㅊ', () => {
    expect(romanizeKorean('좋다')).toBe('jota');
    expect(romanizeKorean('많다')).toBe('manta');
    expect(romanizeKorean('축하')).toBe('chuka');
    expect(romanizeKorean('못해요')).toBe('motaeyo');
    expect(romanizeKorean('입학')).toBe('ipak');
  });
  it('does not over-apply: ㅇ-batchim or liaison stays plain', () => {
    expect(romanizeKorean('좋아요')).toBe('joayo');        // ㅎ + vowel = liaison, not aspiration
    expect(romanizeKorean('안녕하세요')).toBe('annyeonghaseyo'); // ㅇ-batchim does not aspirate
  });
});
