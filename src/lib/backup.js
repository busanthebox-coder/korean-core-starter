import { mergeWritingArchives, WRITINGS_KEY } from './writings.js';

export const BACKUP_META = {
  app: 'korean-core-starter',
  version: 1,
  lastBackupAt: 'kcs.last-backup-at',
};

export const BACKUP_KEYS = [
  'kcs.roman',
  'kcs.progress',
  'kcs.lesson-activity-v1',
  'kcs.lesson-position-v1',
  'kcs.guide-ready-v1',
  'kcs.shadow-done-v1',
  'kcs.spoken-v1',
  'kcs.packs-v1',
  'kcs.orientation-v1',
  'kcs.ime-fallback-v1',
  'kcs.roman-nudge-v1',
  'kcs.onboarded-v1',
  'kcs.start-chapter-v1',
  'kcs.learn-open-v1',
  'kcs.checkpoint-v1',
  'kcs.readers-v1',
  'ksrs-v1',
  'kcs.mistakes-v1',
  'kcs.study-v1',
  'kcs.streak-v1',
  WRITINGS_KEY,
];

const BACKUP_KEY_SET = new Set(BACKUP_KEYS);
const JSON_SET_KEYS = new Set(['kcs.progress', 'kcs.guide-ready-v1', 'kcs.shadow-done-v1', 'kcs.packs-v1', 'kcs.learn-open-v1']);
const SCALAR_KEYS = new Set([
  'kcs.roman',
  'kcs.orientation-v1',
  'kcs.ime-fallback-v1',
  'kcs.roman-nudge-v1',
  'kcs.onboarded-v1',
  'kcs.start-chapter-v1',
]);
const THIRTY_DAYS = 30 * 24 * 60 * 60 * 1000;

function storageAvailable() {
  return typeof localStorage !== 'undefined';
}

function safeGet(key) {
  if (!storageAvailable()) return null;
  return localStorage.getItem(key);
}

function parseJson(raw) {
  return JSON.parse(raw);
}

function objectEntries(value) {
  return value && typeof value === 'object' && !Array.isArray(value) ? Object.entries(value) : [];
}

function stringify(value) {
  return JSON.stringify(value);
}

function mergeUniqueArrays(mineRaw, theirsRaw) {
  const mine = mineRaw ? parseJson(mineRaw) : [];
  const theirs = theirsRaw ? parseJson(theirsRaw) : [];
  if (!Array.isArray(mine) || !Array.isArray(theirs)) throw new Error('Expected array progress values');
  return stringify([...new Set([...mine, ...theirs].filter(Boolean))]);
}

function mergeByLatestUpdatedAt(mineRaw, theirsRaw) {
  const mine = mineRaw ? parseJson(mineRaw) : {};
  const theirs = theirsRaw ? parseJson(theirsRaw) : {};
  const out = { ...mine };
  for (const [id, incoming] of objectEntries(theirs)) {
    const current = out[id];
    if (!current || Number(incoming?.updatedAt || 0) >= Number(current?.updatedAt || 0)) out[id] = incoming;
  }
  return stringify(out);
}

function mergeSrs(mineRaw, theirsRaw) {
  const mine = mineRaw ? parseJson(mineRaw) : {};
  const theirs = theirsRaw ? parseJson(theirsRaw) : {};
  const out = { ...mine };
  for (const [id, incoming] of objectEntries(theirs)) {
    const current = out[id];
    const incomingReps = Number(incoming?.reps || 0);
    const currentReps = Number(current?.reps || 0);
    if (!current || incomingReps > currentReps) out[id] = incoming;
    else if (incomingReps === currentReps && Number(incoming?.due ?? Infinity) < Number(current?.due ?? Infinity)) out[id] = incoming;
  }
  return stringify(out);
}

function mergeMistakes(mineRaw, theirsRaw) {
  const mine = mineRaw ? parseJson(mineRaw) : {};
  const theirs = theirsRaw ? parseJson(theirsRaw) : {};
  const out = { ...mine };
  for (const [id, incoming] of objectEntries(theirs)) {
    const current = out[id];
    const incomingMisses = Number(incoming?.misses || 0);
    const currentMisses = Number(current?.misses || 0);
    if (!current || incomingMisses > currentMisses) out[id] = incoming;
    else if (incomingMisses === currentMisses && Number(incoming?.lastMissed || 0) > Number(current?.lastMissed || 0)) out[id] = incoming;
  }
  return stringify(out);
}

function mergeCheckpoint(mineRaw, theirsRaw) {
  const mine = mineRaw ? parseJson(mineRaw) : {};
  const theirs = theirsRaw ? parseJson(theirsRaw) : {};
  const out = { ...mine };
  for (const [id, incoming] of objectEntries(theirs)) {
    const current = out[id];
    const incomingBest = Number(incoming?.best || 0);
    const currentBest = Number(current?.best || 0);
    if (!current || incomingBest > currentBest) out[id] = incoming;
    else if (incomingBest === currentBest && Number(incoming?.lastAt || 0) > Number(current?.lastAt || 0)) out[id] = incoming;
  }
  return stringify(out);
}

function mergeReaders(mineRaw, theirsRaw) {
  const mine = mineRaw ? parseJson(mineRaw) : {};
  const theirs = theirsRaw ? parseJson(theirsRaw) : {};
  const out = { ...mine };
  for (const [id, incoming] of objectEntries(theirs)) {
    const current = out[id];
    const incomingScore = Number(incoming?.score || 0);
    const currentScore = Number(current?.score || 0);
    if (!current || incomingScore > currentScore) out[id] = incoming;
    else if (incomingScore === currentScore && Number(incoming?.readAt || 0) > Number(current?.readAt || 0)) out[id] = incoming;
  }
  return stringify(out);
}

function mergeSpoken(mineRaw, theirsRaw) {
  const mine = mineRaw ? parseJson(mineRaw) : {};
  const theirs = theirsRaw ? parseJson(theirsRaw) : {};
  const out = { ...mine };
  for (const [chapterId, incomingDays] of objectEntries(theirs)) {
    const currentDays = Array.isArray(out[chapterId]) ? out[chapterId] : [];
    const nextDays = Array.isArray(incomingDays) ? incomingDays : [];
    out[chapterId] = [...new Set([...currentDays, ...nextDays].filter(Boolean))].sort();
  }
  return stringify(out);
}

function mergeStudy(mineRaw, theirsRaw) {
  const mine = mineRaw ? parseJson(mineRaw) : {};
  const theirs = theirsRaw ? parseJson(theirsRaw) : {};
  const mineLog = mine.log || {};
  const theirsLog = theirs.log || {};
  const log = { ...mineLog };
  for (const [day, count] of Object.entries(theirsLog)) {
    log[day] = Math.max(Number(log[day] || 0), Number(count || 0));
  }
  return stringify({
    ...mine,
    ...theirs,
    goal: Math.max(Number(mine.goal || 0), Number(theirs.goal || 0)) || mine.goal || theirs.goal,
    log,
  });
}

function mergeStreak(mineRaw, theirsRaw) {
  const mine = mineRaw ? parseJson(mineRaw) : {};
  const theirs = theirsRaw ? parseJson(theirsRaw) : {};
  const latest = String(theirs.lastDay || '') >= String(mine.lastDay || '') ? theirs : mine;
  return stringify({
    current: Number(latest.current || 0),
    best: Math.max(Number(mine.best || 0), Number(theirs.best || 0)),
    lastDay: latest.lastDay || '',
  });
}

function validateKnownValue(key, raw) {
  if (SCALAR_KEYS.has(key)) return;
  parseJson(raw);
}

export function mergeStrategies(key, mine, theirs) {
  if (JSON_SET_KEYS.has(key)) return mergeUniqueArrays(mine, theirs);
  if (SCALAR_KEYS.has(key)) return theirs;
  if (key === 'kcs.lesson-activity-v1' || key === 'kcs.lesson-position-v1') return mergeByLatestUpdatedAt(mine, theirs);
  if (key === 'ksrs-v1') return mergeSrs(mine, theirs);
  if (key === 'kcs.mistakes-v1') return mergeMistakes(mine, theirs);
  if (key === 'kcs.checkpoint-v1') return mergeCheckpoint(mine, theirs);
  if (key === 'kcs.readers-v1') return mergeReaders(mine, theirs);
  if (key === 'kcs.spoken-v1') return mergeSpoken(mine, theirs);
  if (key === 'kcs.study-v1') return mergeStudy(mine, theirs);
  if (key === 'kcs.streak-v1') return mergeStreak(mine, theirs);
  if (key === WRITINGS_KEY) return mergeWritingArchives(mine, theirs);
  validateKnownValue(key, theirs);
  return theirs;
}

function readBackup(input) {
  if (typeof input === 'string') return JSON.parse(input);
  return input;
}

function invalidResult(error) {
  return { ok: false, imported: [], skipped: [], error };
}

export function exportProgress(now = Date.now()) {
  const data = {};
  if (storageAvailable()) {
    for (const key of BACKUP_KEYS) {
      const value = localStorage.getItem(key);
      if (value !== null) data[key] = value;
    }
  }
  return {
    version: BACKUP_META.version,
    app: BACKUP_META.app,
    exportedAt: now,
    data,
  };
}

export function importProgress(input, { merge = true } = {}) {
  let file;
  try {
    file = readBackup(input);
  } catch {
    return invalidResult('Backup file is not valid JSON.');
  }
  if (!file || typeof file !== 'object' || Array.isArray(file)) return invalidResult('Backup file has an invalid shape.');
  if (file.version !== BACKUP_META.version) return invalidResult(`Unsupported backup version: ${file.version ?? 'missing'}.`);
  if (!file.data || typeof file.data !== 'object' || Array.isArray(file.data)) return invalidResult('Backup file has no data object.');

  const imported = [];
  const skipped = [];
  const writes = [];
  for (const [key, incomingRaw] of Object.entries(file.data)) {
    if (!BACKUP_KEY_SET.has(key) || typeof incomingRaw !== 'string') {
      skipped.push(key);
      continue;
    }
    try {
      validateKnownValue(key, incomingRaw);
      const currentRaw = safeGet(key);
      const nextRaw = merge && currentRaw !== null ? mergeStrategies(key, currentRaw, incomingRaw) : incomingRaw;
      validateKnownValue(key, nextRaw);
      writes.push([key, nextRaw]);
      imported.push(key);
    } catch {
      skipped.push(key);
    }
  }

  for (const [key, value] of writes) localStorage.setItem(key, value);
  return { ok: true, imported, skipped };
}

export function backupReminderState(now = Date.now()) {
  const hasProgress = BACKUP_KEYS.some((key) => {
    const value = safeGet(key);
    return value !== null && value !== '' && value !== '[]' && value !== '{}';
  });
  const lastRaw = safeGet(BACKUP_META.lastBackupAt);
  const lastBackupAt = Number(lastRaw || 0) || null;
  const ageMs = lastBackupAt ? now - lastBackupAt : Infinity;
  return {
    hasProgress,
    lastBackupAt,
    shouldRemind: hasProgress && ageMs > THIRTY_DAYS,
  };
}
