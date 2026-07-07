import { writable } from 'svelte/store';

function isRecoverableStorageError(error) {
  return error instanceof SyntaxError || (typeof DOMException !== 'undefined' && error instanceof DOMException);
}

function readStoredJson(key, fallback) {
  if (typeof localStorage === 'undefined') return fallback;
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) || fallback : fallback;
  } catch (error) {
    if (isRecoverableStorageError(error)) return fallback;
    throw error;
  }
}

function writeStoredJson(key, value) {
  if (typeof localStorage === 'undefined') return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    if (!isRecoverableStorageError(error)) throw error;
  }
}

function readStoredBool(key, fallback) {
  if (typeof localStorage === 'undefined') return fallback;
  try {
    const value = localStorage.getItem(key);
    return value === null ? fallback : value === '1';
  } catch (error) {
    if (isRecoverableStorageError(error)) return fallback;
    throw error;
  }
}

function writeStoredBool(key, value) {
  if (typeof localStorage === 'undefined') return;
  try {
    localStorage.setItem(key, value ? '1' : '0');
  } catch (error) {
    if (!isRecoverableStorageError(error)) throw error;
  }
}

function persistedSet(key) {
  const initial = readStoredJson(key, []);
  const store = writable(new Set(initial));
  store.subscribe((set) => writeStoredJson(key, [...set]));
  return store;
}

function persistedBool(key, fallback) {
  const initial = readStoredBool(key, fallback);
  const store = writable(initial);
  store.subscribe((value) => writeStoredBool(key, value));
  return store;
}

function persistedObject(key, fallback = {}) {
  const initial = readStoredJson(key, fallback);
  const store = writable(initial);
  store.subscribe((value) => writeStoredJson(key, value));
  return store;
}

export const romanizationVisible = persistedBool('kcs.roman', true);
export function toggleRomanization() { romanizationVisible.update((v) => !v); }

export const orientationDone = persistedBool('kcs.orientation-v1', false);
export function markOrientationDone() { orientationDone.set(true); }
export function resetOrientationDone() { orientationDone.set(false); }

export const imeFallbackEnabled = persistedBool('kcs.ime-fallback-v1', false);
export function toggleImeFallback() { imeFallbackEnabled.update((v) => !v); }
export function setImeFallback(value) { imeFallbackEnabled.set(!!value); }

export const romanNudgeSeen = persistedBool('kcs.roman-nudge-v1', false);
export function markRomanNudgeSeen() { romanNudgeSeen.set(true); }
export function resetRomanNudgeSeen() { romanNudgeSeen.set(false); }

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

export const checkpointProgress = persistedObject('kcs.checkpoint-v1', {});
export function recordCheckpointResult(trackId, result = {}, now = Date.now()) {
  if (!trackId) return;
  const total = Math.max(0, Number(result.total) || 0);
  const score = Math.max(0, Math.min(total, Number(result.score) || 0));
  const weakChapterIds = Array.isArray(result.weakChapterIds) ? result.weakChapterIds.filter(Boolean) : [];
  checkpointProgress.update((state) => {
    const current = state[trackId] || {};
    return {
      ...state,
      [trackId]: {
        best: Math.max(current.best || 0, score),
        last: score,
        total,
        lastAt: now,
        weakChapterIds,
      },
    };
  });
}
export function resetCheckpointProgress() { checkpointProgress.set({}); }

export const guideProgress = persistedSet('kcs.guide-ready-v1');
export function toggleGuideReady(id) {
  guideProgress.update((set) => {
    const next = new Set(set);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    return next;
  });
}

export const packProgress = persistedSet('kcs.packs-v1');
export function togglePackDone(id) {
  packProgress.update((set) => {
    const next = new Set(set);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    return next;
  });
}
export function resetPackProgress() { packProgress.set(new Set()); }

export const readerProgress = persistedObject('kcs.readers-v1', {});
export function recordReaderResult(id, result = {}, now = Date.now()) {
  if (!id) return;
  const total = Math.max(0, Number(result.total) || 0);
  const score = Math.max(0, Math.min(total, Number(result.score) || 0));
  const summary = typeof result.summary === 'string' ? result.summary.trim() : '';
  readerProgress.update((state) => ({
    ...state,
    [id]: {
      readAt: now,
      score,
      total,
      ...(summary ? { summary } : {}),
    },
  }));
}
export function resetReaderProgress() { readerProgress.set({}); }

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
