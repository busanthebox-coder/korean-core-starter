import { shuffle } from './quiz.js';
import { scrambledOptions } from './inlineExercise.js';
import reactionData from './reactionDrills.json';

// Half of a real conversation is backchannelling — 그렇군요 / 그러니까요 / 잘됐네요.
// The app taught none of it, so these drills show one line the other person says
// and ask which reaction actually fits. The partner lines are lifted from the
// polite roleplay scenarios, so they're sentences that really occur in the app.
export const reactionItems = reactionData;

export const REACTION_LEVELS = ['A1', 'A2', 'B1'];

export function buildReactionQuiz({ count = 10, rng = Math.random, level = 'all' } = {}) {
  const candidates = level === 'all'
    ? reactionItems
    : reactionItems.filter((item) => item.level === level);
  return shuffle(candidates, rng).slice(0, Math.min(count, candidates.length));
}

// Authored data lists the natural option first. Render through the same
// deterministic scramble the inline exercises use, so the answer's slot is not
// a tell but also doesn't flicker between renders.
export function reactionOptionsFor(item) {
  const options = item?.options || [];
  if (options.length < 2) return options;
  const byKo = new Map(options.map((option) => [option.ko, option]));
  return scrambledOptions(options.map((option) => option.ko), item.id).map((ko) => byKo.get(ko));
}

export function reactionAnswerOf(item) {
  return (item?.options || []).find((option) => option.natural) || null;
}

export function reactionEntryIds(item) {
  return Array.isArray(item?.entryIds) ? item.entryIds.filter(Boolean) : [];
}
