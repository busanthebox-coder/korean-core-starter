// Spaced-repetition (Leitner-style) review state, persisted to localStorage.
// Pure functions take state + now so they're testable; `reviews` is the live store.
import { derived, readable, writable } from 'svelte/store';

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

export function dueCountInState(state, now = Date.now()) {
  return dueIds(state, now).length;
}

export function nextDueAt(state, now = Date.now()) {
  const future = Object.values(state)
    .map((card) => Number(card?.due || 0))
    .filter((due) => due > now)
    .sort((a, b) => a - b);
  return future[0] || null;
}

export function relativeDueLabel(dueAt, now = Date.now()) {
  if (!dueAt) return '';
  const diff = Math.max(0, dueAt - now);
  if (diff <= MIN) return 'now';
  const mins = Math.round(diff / MIN);
  if (mins < 60) return `in ${mins} min`;
  const hours = Math.round(mins / 60);
  if (hours < 48) return `in about ${hours} hour${hours === 1 ? '' : 's'}`;
  const days = Math.round(hours / 24);
  return `in about ${days} day${days === 1 ? '' : 's'}`;
}

export function summarize(state, now = Date.now()) {
  const ids = Object.keys(state);
  return {
    total: ids.length,
    due: dueIds(state, now).length,
    learned: ids.filter((id) => state[id].box >= 3).length,
  };
}

// Mastery over a specific set of item ids (e.g. one chapter's vocabulary).
// An item counts as mastered once it has reached box 3 (survived several
// spaced reviews). Items never added to the deck count as not-yet-mastered.
export function masteryOf(state, ids = []) {
  const total = ids.length;
  let started = 0, mastered = 0;
  for (const id of ids) {
    const c = state[id];
    if (!c) continue;
    started += 1;
    if (c.box >= 3) mastered += 1;
  }
  return { total, started, mastered, pct: total ? Math.round((mastered / total) * 100) : 0 };
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

const minuteTick = readable(Date.now(), (set) => {
  if (typeof window === 'undefined') return () => {};
  const refresh = () => set(Date.now());
  refresh();
  const id = setInterval(refresh, MIN);
  window.addEventListener('focus', refresh);
  return () => {
    clearInterval(id);
    window.removeEventListener('focus', refresh);
  };
});

export const dueCount = derived([reviews, minuteTick], ([$reviews, now]) => dueCountInState($reviews, now));
