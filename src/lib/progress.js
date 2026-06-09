// Engagement model: study streak + daily goal, persisted to localStorage.
// Pure helpers take (state, now) so they're deterministic and testable; `study`
// is the live store. This complements srs.js (which models per-item mastery).
import { writable } from 'svelte/store';

const KEY = 'kcs.study-v1';
const DAY = 24 * 60 * 60 * 1000;
const DEFAULT_GOAL = 20;

// Local calendar day, e.g. "2026-06-09".
export function dayKey(now = Date.now()) {
  const d = new Date(now);
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${m}-${day}`;
}

export function todayCount(state, now = Date.now()) {
  return (state.log || {})[dayKey(now)] || 0;
}

export function goalOf(state) {
  return state.goal || DEFAULT_GOAL;
}

export function goalMet(state, now = Date.now()) {
  return todayCount(state, now) >= goalOf(state);
}

// Consecutive active days ending today (or yesterday, as a one-day grace so the
// streak doesn't read as broken before you've studied today).
export function streak(state, now = Date.now()) {
  const log = state.log || {};
  const active = (ts) => (log[dayKey(ts)] || 0) > 0;
  let cursor = now;
  if (!active(cursor)) cursor -= DAY;
  let n = 0;
  while (active(cursor)) { n += 1; cursor -= DAY; }
  return n;
}

// Longest run of consecutive active days ever recorded.
export function bestStreak(state) {
  const log = state.log || {};
  const days = Object.keys(log)
    .filter((k) => log[k] > 0)
    .map((k) => Math.round(Date.parse(`${k}T00:00:00`) / DAY))
    .sort((a, b) => a - b);
  let best = 0, run = 0, prev = null;
  for (const d of days) {
    run = prev !== null && d === prev + 1 ? run + 1 : 1;
    best = Math.max(best, run);
    prev = d;
  }
  return best;
}

function read() {
  try {
    const raw = JSON.parse(localStorage.getItem(KEY)) || {};
    return { goal: DEFAULT_GOAL, log: {}, ...raw };
  } catch { return { goal: DEFAULT_GOAL, log: {} }; }
}
function write(state) {
  try { localStorage.setItem(KEY, JSON.stringify(state)); } catch { /* ignore */ }
}

function createStudy() {
  const start = typeof localStorage !== 'undefined' ? read() : { goal: DEFAULT_GOAL, log: {} };
  const { subscribe, update } = writable(start);
  return {
    subscribe,
    // Record n study actions (questions answered, cards reviewed) for today.
    log: (n = 1, now = Date.now()) => update((s) => {
      if (!n) return s;
      const k = dayKey(now);
      const log = { ...(s.log || {}) };
      log[k] = (log[k] || 0) + n;
      const next = { ...s, log };
      write(next);
      return next;
    }),
    setGoal: (g) => update((s) => {
      const next = { ...s, goal: Math.max(1, Math.round(g) || DEFAULT_GOAL) };
      write(next);
      return next;
    }),
  };
}

export const study = createStudy();
