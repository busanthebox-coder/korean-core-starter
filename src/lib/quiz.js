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
