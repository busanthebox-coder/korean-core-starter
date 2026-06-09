// Pure exercise generators. All accept an `rng` (defaults to Math.random) for testability.

export function shuffle(arr, rng = Math.random) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// A single multiple-choice question. direction: 'koToEn' | 'enToKo' | 'listen'
export function makeMCQuestion(pool, { direction = 'koToEn' } = {}, rng = Math.random) {
  const shuffled = shuffle(pool, rng);
  const target = shuffled[0];
  const distractors = shuffled.slice(1, 4);
  const choices = shuffle([target, ...distractors], rng);
  const optionText = (e) => (direction === 'koToEn' ? e.english : e.hangul);
  return {
    type: direction === 'listen' ? 'listen' : 'mc',
    direction,
    prompt: direction === 'enToKo' ? target.english : target.hangul,
    promptRomanization: direction === 'koToEn' ? target.romanization : '',
    audio: target.hangul,
    options: choices.map(optionText),
    answer: optionText(target),
    reason: target.shortExplanation || `${target.hangul} (${target.romanization}) = ${target.english}`,
  };
}

// A match game: N Korean↔English pairs.
export function makeMatch(pool, rng = Math.random, size = 5) {
  const picks = shuffle(pool, rng).slice(0, Math.min(size, pool.length));
  return { type: 'match', pairs: picks.map((e) => ({ id: e.id, ko: e.hangul, en: e.english })) };
}

// A sequence of MC/listen questions, rotating direction for variety.
export function buildQuiz(pool, { count = 10, rng = Math.random } = {}) {
  if (!pool || pool.length < 4) return [];
  const directions = ['koToEn', 'enToKo', 'listen'];
  const out = [];
  for (let i = 0; i < count; i++) {
    out.push(makeMCQuestion(pool, { direction: directions[i % directions.length] }, rng));
  }
  return out;
}

// ── Production (산출) — the learner makes Korean, we grade it ───────────────

// Normalize Korean (or romaja) for forgiving comparison: keep only Hangul
// syllables/jamo + latin letters + digits, drop spaces, punctuation and case.
export function normalizeKo(s) {
  return (s || '')
    .toLowerCase()
    .replace(/[^0-9a-z가-힣ᄀ-ᇿ㄰-㆏]/g, '');
}

// Shuffle that avoids returning the original order (for word-bank scrambles).
function scramble(tokens, rng) {
  if (tokens.length < 2) return tokens.slice();
  let out = shuffle(tokens, rng);
  let guard = 0;
  while (out.join(' ') === tokens.join(' ') && guard++ < 8) out = shuffle(tokens, rng);
  return out;
}

// Write: show the English, learner TYPES the Korean word. Graded by normalizeKo.
export function buildWriteQuiz(pool, { count = 8, rng = Math.random } = {}) {
  if (!pool || !pool.length) return [];
  return shuffle(pool, rng)
    .slice(0, Math.min(count, pool.length))
    .map((target) => ({
      type: 'type',
      prompt: target.english,
      answer: target.hangul,
      answerRomanization: target.romanization,
      reason: target.shortExplanation || `${target.hangul} (${target.romanization}) = ${target.english}`,
    }));
}

// Build: arrange scrambled word tiles into the example sentence. No keyboard
// needed (tap tiles), so it works without a Korean IME — pure production.
const buildable = (x) => {
  if (!x || !x.ko) return false;
  const n = x.ko.trim().split(/\s+/).length;
  return n >= 2 && n <= 9;
};
export function buildSentenceQuiz(pool, { count = 6, rng = Math.random } = {}) {
  const withEx = (pool || []).filter((e) => (e.examples || []).some(buildable));
  if (!withEx.length) return [];
  return shuffle(withEx, rng)
    .slice(0, Math.min(count, withEx.length))
    .map((target) => {
      const ex = shuffle((target.examples || []).filter(buildable), rng)[0];
      const tokens = ex.ko.trim().split(/\s+/);
      return {
        type: 'build',
        prompt: ex.en,
        answer: ex.ko.trim(),
        tokens,                          // correct order
        scrambled: scramble(tokens, rng), // shown order
        romanization: ex.romanization || '',
        reason: `${ex.ko} — ${ex.en}`,
      };
    });
}
