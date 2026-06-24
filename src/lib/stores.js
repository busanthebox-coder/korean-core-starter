import { writable } from 'svelte/store';

function persistedSet(key) {
  let initial = [];
  try { initial = JSON.parse(localStorage.getItem(key)) || []; } catch { initial = []; }
  const store = writable(new Set(initial));
  store.subscribe((set) => {
    try { localStorage.setItem(key, JSON.stringify([...set])); } catch { /* ignore */ }
  });
  return store;
}

function persistedBool(key, fallback) {
  let initial = fallback;
  try { const v = localStorage.getItem(key); if (v !== null) initial = v === '1'; } catch { /* ignore */ }
  const store = writable(initial);
  store.subscribe((v) => { try { localStorage.setItem(key, v ? '1' : '0'); } catch { /* ignore */ } });
  return store;
}

function persistedObject(key, fallback = {}) {
  let initial = fallback;
  try { initial = JSON.parse(localStorage.getItem(key)) || fallback; } catch { initial = fallback; }
  const store = writable(initial);
  store.subscribe((value) => {
    try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* ignore */ }
  });
  return store;
}

export const romanizationVisible = persistedBool('kcs.roman', true);
export function toggleRomanization() { romanizationVisible.update((v) => !v); }

export const lessonProgress = persistedSet('kcs.progress');
export function markLessonDone(id) { lessonProgress.update((s) => new Set(s).add(id)); }
export function unmarkLessonDone(id) {
  lessonProgress.update((s) => {
    const next = new Set(s);
    next.delete(id);
    return next;
  });
}
export function toggleLessonDone(id) {
  lessonProgress.update((s) => {
    const next = new Set(s);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    return next;
  });
}
export function resetLessonProgress() { lessonProgress.set(new Set()); }

export const lessonActivity = persistedObject('kcs.lesson-activity-v1', {});
function updateLessonActivity(id, patch) {
  if (!id) return;
  lessonActivity.update((state) => ({
    ...state,
    [id]: { ...(state[id] || {}), ...patch, updatedAt: Date.now() },
  }));
}
export function markDialogueSeen(id) { updateLessonActivity(id, { dialogueSeen: true }); }
export function markLessonPracticed(id) { updateLessonActivity(id, { practiceDone: true }); }
export function resetLessonActivity() { lessonActivity.set({}); }

export const guideProgress = persistedSet('kcs.guide-ready-v1');
export function toggleGuideReady(id) {
  guideProgress.update((set) => {
    const next = new Set(set);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    return next;
  });
}

export const shadowProgress = persistedSet('kcs.shadow-done-v1');
export function toggleShadowDone(id) {
  shadowProgress.update((set) => {
    const next = new Set(set);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    return next;
  });
}

export const filters = writable({ search: '', type: new Set(), level: new Set(), topic: new Set(), pos: new Set() });
