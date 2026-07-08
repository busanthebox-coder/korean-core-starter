import { decompose } from './hangul.js';
import { normalizeKo } from './quiz.js';

const PARTICLE_SUFFIXES = [
  '에서부터',
  '으로부터',
  '한테서',
  '에게서',
  '이에요',
  '예요',
  '으로',
  '에서',
  '부터',
  '까지',
  '에게',
  '한테',
  '께서',
  '은요',
  '는요',
  '이요',
  '하고',
  '이랑',
  '처럼',
  '보다',
  '밖에',
  '로',
  '은',
  '는',
  '이',
  '가',
  '을',
  '를',
  '에',
  '도',
  '만',
  '와',
  '과',
  '랑',
  '요',
];

const PARTICLE_EXCEPTIONS = new Set(['아니', '많이', '빨리', '같이', '다시', '이미', '혹시', '역시', '괜히']);

const PREDICATE_ENDINGS = [
  '습니다',
  'ㅂ니다',
  '었어요',
  '았어요',
  '했어요',
  '였어요',
  '예요',
  '이에요',
  '어요',
  '아요',
  '여요',
  '거예요',
  '거야',
  '같아요',
  '같아',
  '잖아요',
  '잖아',
  '거든요',
  '거든',
  '는데',
  '니까',
  '게',
  '래',
  '지',
  '죠',
  '요',
  '어',
  '아',
  '야',
  '자',
];

function cleanForTokens(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/[ㅋㅎㅠㅜ]+/g, ' ')
    .replace(/[^0-9a-z가-힣ᄀ-ᇿ㄰-㆏\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function stripParticle(token) {
  if (PARTICLE_EXCEPTIONS.has(token)) return token;
  for (const suffix of PARTICLE_SUFFIXES) {
    if (token.length > suffix.length && token.endsWith(suffix)) {
      return token.slice(0, -suffix.length);
    }
  }
  return token;
}

function tokenize(value) {
  return cleanForTokens(value)
    .split(/\s+/)
    .map((raw) => ({ raw, core: normalizeKo(stripParticle(raw)) }))
    .filter((token) => token.core);
}

function isHangulSyllable(char) {
  const code = char.charCodeAt(0);
  return code >= 0xac00 && code <= 0xd7a3;
}

function syllableBase(char) {
  if (!isHangulSyllable(char)) return char;
  const { lead, vowel } = decompose(char);
  return `${lead}${vowel}`;
}

function isLikelyPredicate(token) {
  return PREDICATE_ENDINGS.some((ending) => token.endsWith(ending));
}

function predicateStemMatches(modelToken, typedToken) {
  if (!isLikelyPredicate(modelToken.raw) && !isLikelyPredicate(typedToken.raw)) return false;

  const modelChars = Array.from(modelToken.core);
  const typedChars = Array.from(typedToken.core);
  if (!modelChars.length || !typedChars.length) return false;

  const firstMatches = modelChars[0] === typedChars[0] || syllableBase(modelChars[0]) === syllableBase(typedChars[0]);
  if (!firstMatches) return false;
  if (modelChars.length === 1 || typedChars.length === 1) return true;

  return syllableBase(modelChars[1]) === syllableBase(typedChars[1]);
}

function tokenMatches(modelToken, typedToken) {
  return modelToken.core === typedToken.core || predicateStemMatches(modelToken, typedToken);
}

export function gradeReply(typed, modelKo) {
  const modelTokens = tokenize(modelKo);
  const typedTokens = tokenize(typed).map((token) => ({ ...token, used: false }));
  if (!modelTokens.length || !typedTokens.length) {
    return { verdict: 'wrong', missing: modelTokens.map((token) => token.core), matched: [] };
  }

  const matched = [];
  const missing = [];

  for (const modelToken of modelTokens) {
    const typedToken = typedTokens.find((candidate) => !candidate.used && tokenMatches(modelToken, candidate));
    if (typedToken) {
      typedToken.used = true;
      matched.push(modelToken.core);
    } else {
      missing.push(modelToken.core);
    }
  }

  const ratio = matched.length / modelTokens.length;
  const verdict = ratio >= 0.8 ? 'correct' : ratio >= 0.58 ? 'close' : 'wrong';
  return { verdict, missing, matched };
}
