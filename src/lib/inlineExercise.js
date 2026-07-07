import { normalizeKo } from './quiz.js';

export const INLINE_EXERCISE_TYPES = new Set([
  'multipleChoice',
  'fillBlank',
  'errorCorrect',
  'translate',
  'particleChoice',
  'conjugate',
  'orderWords',
]);

export function correctOf(exercise) {
  return String(exercise?.correct || exercise?.answer || '');
}

export function answerVariants(exercise) {
  const direct = correctOf(exercise)
    .split('/')
    .map((item) => item.trim())
    .filter(Boolean);
  const accepted = Array.isArray(exercise?.accepted)
    ? exercise.accepted.map((item) => String(item || '').trim()).filter(Boolean)
    : [];
  return [...direct, ...accepted];
}

export function exerciseAnswerMatches(exercise, value) {
  const got = normalizeKo(value);
  if (!got) return false;
  return answerVariants(exercise).some((answer) => normalizeKo(answer) === got);
}

export function scrambledOrderTokens(tokens = []) {
  const cleaned = tokens.map((token) => String(token || '').trim()).filter(Boolean);
  if (cleaned.length < 2) return cleaned;
  const rotated = [...cleaned.slice(1), cleaned[0]];
  return rotated.join('\u0000') === cleaned.join('\u0000') ? cleaned.slice().reverse() : rotated;
}

export function orderAnswer(tokens = []) {
  return tokens.map((token) => String(token || '').trim()).filter(Boolean).join(' ');
}
