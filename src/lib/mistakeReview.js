import { mistakes } from './mistakes.js';
import { reviews } from './srs.js';

export function recordMissedItems(ids = [], now = Date.now()) {
  const clean = [...new Set(ids.filter(Boolean))];
  if (!clean.length) return;
  mistakes.record(clean, now);
  reviews.addMany(clean);
}
