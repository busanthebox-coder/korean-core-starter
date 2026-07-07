import { describe, expect, it } from 'vitest';
import { buildGlossIndex, matchGlossToken, stripParticle, tokenizeKoreanText } from './gloss.js';

const entries = [
  { id: 'word-i', hangul: '저', english: 'I', partOfSpeech: 'pronoun' },
  { id: 'word-school', hangul: '학교', english: 'school', partOfSpeech: 'noun' },
  { id: 'word-house', hangul: '집', english: 'home', partOfSpeech: 'noun' },
  { id: 'word-room', hangul: '방', english: 'room', partOfSpeech: 'noun' },
  { id: 'word-building', hangul: '건물', english: 'building', partOfSpeech: 'noun' },
  { id: 'word-friend', hangul: '친구', english: 'friend', partOfSpeech: 'noun' },
  { id: 'word-student', hangul: '학생', english: 'student', partOfSpeech: 'noun' },
  {
    id: 'word-go',
    hangul: '가다',
    english: 'to go',
    partOfSpeech: 'verb',
    forms: { politePresent: '가요', past: '갔어요' },
  },
  { id: 'word-eat', hangul: '먹다', english: 'to eat', partOfSpeech: 'verb' },
  { id: 'word-see', hangul: '보다', english: 'to see', partOfSpeech: 'verb' },
  { id: 'word-cold', hangul: '춥다', english: 'to be cold', partOfSpeech: 'adjective' },
  { id: 'word-small', hangul: '작다', english: 'to be small', partOfSpeech: 'adjective' },
  { id: 'word-many', hangul: '많다', english: 'to be many', partOfSpeech: 'adjective' },
  { id: 'word-delicious', hangul: '맛있다', english: 'to be delicious', partOfSpeech: 'adjective' },
];

describe('gloss matching', () => {
  const index = buildGlossIndex(entries);

  it('matches a headword exactly', () => {
    const match = matchGlossToken('학교', index);

    expect(match?.entry.id).toBe('word-school');
    expect(match?.strategy).toBe('exact');
  });

  it('strips common particles before matching', () => {
    expect(stripParticle('친구랑')).toBe('친구');
    expect(stripParticle('저는')).toBe('저');
    expect(stripParticle('집에서는')).toBe('집');
    expect(stripParticle('어른들의')).toBe('어른');

    const match = matchGlossToken('친구랑', index);
    expect(match?.entry.id).toBe('word-friend');
    expect(match?.strategy).toBe('particle');
  });

  it('matches noun plus common copula endings', () => {
    const match = matchGlossToken('학생이에요', index);

    expect(match?.entry.id).toBe('word-student');
    expect(match?.strategy).toBe('copula');
    expect(matchGlossToken('방이다', index)?.entry.id).toBe('word-room');
    expect(matchGlossToken('건물이었지만', index)?.entry.id).toBe('word-building');
  });

  it('falls back to reader helper entries for common function words', () => {
    const match = matchGlossToken('그', buildGlossIndex([]));

    expect(match?.entry.id).toBe('reader-helper-geu');
  });

  it('matches shipped and generated verb or adjective forms', () => {
    expect(matchGlossToken('갔어요', index)?.entry.id).toBe('word-go');
    expect(matchGlossToken('추워요', index)?.entry.id).toBe('word-cold');
  });

  it('matches conservative connector and modifier derivatives', () => {
    expect(matchGlossToken('작은', index)?.entry.id).toBe('word-small');
    expect(matchGlossToken('많아서', index)?.entry.id).toBe('word-many');
    expect(matchGlossToken('먹으면', index)?.entry.id).toBe('word-eat');
    expect(matchGlossToken('보러', index)?.entry.id).toBe('word-see');
    expect(matchGlossToken('간다고', index)?.entry.id).toBe('word-go');
    expect(matchGlossToken('볼까', index)?.entry.id).toBe('word-see');
    expect(matchGlossToken('본다', index)?.entry.id).toBe('word-see');
    expect(matchGlossToken('본', index)?.entry.id).toBe('word-see');
    expect(matchGlossToken('보는데도', index)?.entry.id).toBe('word-see');
    expect(matchGlossToken('보시고', index)?.entry.id).toBe('word-see');
    expect(matchGlossToken('먹을수록', index)?.entry.id).toBe('word-eat');
    expect(matchGlossToken('작게', index)?.entry.id).toBe('word-small');
    expect(matchGlossToken('작더라고요', index)?.entry.id).toBe('word-small');
    expect(matchGlossToken('맛있다고', index)?.entry.id).toBe('word-delicious');
  });

  it('returns null for unmatched tokens instead of guessing', () => {
    expect(matchGlossToken('없는말이에요', index)).toBeNull();
  });

  it('tokenizes Korean body text without punctuation edges', () => {
    expect(tokenizeKoreanText('민수는 학교에 가요. 수진도 가요!')).toEqual(['민수는', '학교에', '가요', '수진도', '가요']);
  });
});
