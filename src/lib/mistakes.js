import { writable } from 'svelte/store';

const KEY = 'kcs.mistakes-v1';

export function recordMistakesInState(state, ids = [], now = Date.now()) {
  const next = { ...(state || {}) };
  for (const id of [...new Set(ids.filter(Boolean))]) {
    const current = next[id] || { misses: 0, lastMissed: 0 };
    next[id] = { misses: current.misses + 1, lastMissed: now };
  }
  return next;
}

export function resolveMistakesInState(state, ids = []) {
  const next = { ...(state || {}) };
  for (const id of ids.filter(Boolean)) delete next[id];
  return next;
}

export function sortedMistakeIds(state) {
  return Object.entries(state || {})
    .sort((a, b) => (b[1].misses - a[1].misses) || (b[1].lastMissed - a[1].lastMissed))
    .map(([id]) => id);
}

function read() {
  try { return JSON.parse(localStorage.getItem(KEY)) || {}; } catch { return {}; }
}

function write(state) {
  try { localStorage.setItem(KEY, JSON.stringify(state)); } catch { /* ignore */ }
}

function createMistakes() {
  const start = typeof localStorage !== 'undefined' ? read() : {};
  const { subscribe, update, set } = writable(start);
  return {
    subscribe,
    record: (ids, now = Date.now()) => update((s) => {
      const next = recordMistakesInState(s, ids, now);
      write(next);
      return next;
    }),
    resolve: (ids) => update((s) => {
      const next = resolveMistakesInState(s, ids);
      write(next);
      return next;
    }),
    clearAll: () => { write({}); set({}); },
  };
}

export const mistakes = createMistakes();
