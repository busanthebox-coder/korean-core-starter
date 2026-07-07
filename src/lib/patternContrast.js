import { shuffle } from './quiz.js';
import contrastItemsData from './contrastItems.json';

export const contrastItems = contrastItemsData;

export const CONTRAST_LEVELS = ['A1', 'A2', 'B1', 'B2'];

export const contrastLevelOptions = ['all', ...CONTRAST_LEVELS];

export function contrastStats(items = contrastItems) {
  return items.reduce((stats, item) => {
    stats.total += 1;
    stats.byLevel[item.level] = (stats.byLevel[item.level] || 0) + 1;
    stats.byContrast[item.contrast] = (stats.byContrast[item.contrast] || 0) + 1;
    return stats;
  }, { total: 0, byLevel: {}, byContrast: {} });
}

export function buildContrastQuiz({ count = 8, rng = Math.random, level = 'all' } = {}) {
  const candidates = level === 'all'
    ? contrastItems
    : contrastItems.filter((item) => item.level === level);
  return shuffle(candidates, rng).slice(0, Math.min(count, candidates.length));
}
