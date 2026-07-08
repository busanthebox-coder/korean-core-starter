import { writable } from 'svelte/store';

export const STREAK_KEY = 'kcs.streak-v1';
const DAY_MS = 24 * 60 * 60 * 1000;
const EMPTY = { current: 0, best: 0, lastDay: '' };

function read() {
  try {
    return { ...EMPTY, ...(JSON.parse(localStorage.getItem(STREAK_KEY)) || {}) };
  } catch {
    return { ...EMPTY };
  }
}

function write(state) {
  try { localStorage.setItem(STREAK_KEY, JSON.stringify(state)); } catch {}
}

export function localDay(now = new Date()) {
  const d = now instanceof Date ? now : new Date(now);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function previousDay(day) {
  const d = new Date(`${day}T12:00:00`);
  d.setTime(d.getTime() - DAY_MS);
  return localDay(d);
}

export function touchStreak(state = EMPTY, now = new Date()) {
  const today = localDay(now);
  const current = Number(state.current || 0);
  const best = Number(state.best || 0);
  let nextCurrent = 1;
  if (state.lastDay === today) nextCurrent = Math.max(1, current);
  else if (state.lastDay === previousDay(today)) nextCurrent = current + 1;
  return { current: nextCurrent, best: Math.max(best, nextCurrent), lastDay: today };
}

function createStreak() {
  const { subscribe, update, set } = writable(typeof localStorage === 'undefined' ? { ...EMPTY } : read());
  return {
    subscribe,
    record: (now = new Date()) => update((state) => {
      const next = touchStreak(state, now);
      write(next);
      return next;
    }),
    reset: () => { write({ ...EMPTY }); set({ ...EMPTY }); },
  };
}

export const streak = createStreak();
export const recordActivity = (now = new Date()) => streak.record(now);
