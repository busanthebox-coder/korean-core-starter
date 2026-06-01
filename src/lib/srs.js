// Spaced-repetition (Leitner-style) review state, persisted to localStorage.
// Pure functions take state + now so they're testable; `reviews` is the live store.
import { writable } from 'svelte/store';

const KEY = 'ksrs-v1';
const MIN = 60 * 1000;
const DAY = 24 * 60 * MIN;
// Interval per box. Box 0 = brand-new / lapsed (due immediately in-session).
const STEPS = [0, 1 * DAY, 3 * DAY, 7 * DAY, 16 * DAY, 35 * DAY, 90 * DAY];
const AGAIN = 10 * MIN;
const MAX = STEPS.length - 1;

const fresh = (now) => ({ box: 0, due: now, reps: 0, lapses: 0 });

export function addCard(state, id, now = Date.now()) {
  if (state[id]) return state;
  return { ...state, [id]: fresh(now) };
}

export function gradeCard(state, id, rating, now = Date.now()) {
  const c = state[id] || fresh(now);
  let box = c.box;
  let lapses = c.lapses;
  if (rating === 'again') { box = 0; lapses += 1; }
  else if (rating === 'easy') box = Math.min(MAX, box + 2);
  else box = Math.min(MAX, box + 1); // 'good'
  const due = now + (rating === 'again' ? AGAIN : STEPS[box]);
  return { ...state, [id]: { box, due, reps: c.reps + 1, lapses } };
}

export function dueIds(state, now = Date.now()) {
  return Object.entries(state)
    .filter(([, c]) => c.due <= now)
    .sort((a, b) => a[1].due - b[1].due)
    .map(([id]) => id);
}

export function summarize(state, now = Date.now()) {
  const ids = Object.keys(state);
  return {
    total: ids.length,
    due: dueIds(state, now).length,
    learned: ids.filter((id) => state[id].box >= 3).length,
  };
}

function read() {
  try { return JSON.parse(localStorage.getItem(KEY)) || {}; } catch { return {}; }
}
function write(state) {
  try { localStorage.setItem(KEY, JSON.stringify(state)); } catch { /* ignore */ }
}

function createReviews() {
  const start = typeof localStorage !== 'undefined' ? read() : {};
  const { subscribe, update, set } = writable(start);
  return {
    subscribe,
    add: (id) => update((s) => { const n = addCard(s, id); write(n); return n; }),
    addMany: (ids) => update((s) => { let n = s; for (const id of ids) n = addCard(n, id); write(n); return n; }),
    grade: (id, rating) => update((s) => { const n = gradeCard(s, id, rating); write(n); return n; }),
    has: (id) => !!read()[id],
    reset: () => { write({}); set({}); },
  };
}

export const reviews = createReviews();
