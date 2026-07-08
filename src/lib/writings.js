import { writable } from 'svelte/store';

export const WRITINGS_KEY = 'kcs.writings-v1';
const MAX_TEXT = 2000;
const MAX_PER_CHAPTER = 10;

function storageAvailable() {
  return typeof localStorage !== 'undefined';
}

function parseArchive(raw) {
  if (!raw) return {};
  return JSON.parse(raw);
}

function normalizeEntry(entry) {
  const text = String(entry?.text || '').trim().slice(0, MAX_TEXT);
  if (!text) return null;
  return {
    text,
    date: Number(entry?.date ?? Date.now()),
    checked: !!entry?.checked,
  };
}

function normalizeArchive(value) {
  const out = {};
  const source = value && typeof value === 'object' && !Array.isArray(value) ? value : {};
  for (const [chapterId, items] of Object.entries(source)) {
    if (!chapterId || !Array.isArray(items)) continue;
    const normalized = items
      .map(normalizeEntry)
      .filter(Boolean)
      .sort((a, b) => a.date - b.date)
      .slice(-MAX_PER_CHAPTER);
    if (normalized.length) out[chapterId] = normalized;
  }
  return out;
}

function readArchive() {
  if (!storageAvailable()) return {};
  try {
    return normalizeArchive(parseArchive(localStorage.getItem(WRITINGS_KEY)));
  } catch {
    return {};
  }
}

function writeArchive(value) {
  if (!storageAvailable()) return;
  const normalized = normalizeArchive(value);
  if (Object.keys(normalized).length) {
    localStorage.setItem(WRITINGS_KEY, JSON.stringify(normalized));
  } else {
    localStorage.removeItem(WRITINGS_KEY);
  }
}

export const writingsByChapter = writable(readArchive());
writingsByChapter.subscribe(writeArchive);

export function resetWritings() {
  writingsByChapter.set({});
  if (storageAvailable()) localStorage.removeItem(WRITINGS_KEY);
}

export function saveWriting(chapterId, text, checked = false, date = Date.now()) {
  const entry = normalizeEntry({ text, checked, date });
  if (!chapterId || !entry) return false;
  writingsByChapter.update((archive) => {
    const current = archive[chapterId] || [];
    return normalizeArchive({
      ...archive,
      [chapterId]: [...current, entry],
    });
  });
  return true;
}

export function writingsForChapter(archive, chapterId) {
  return normalizeArchive(archive)[chapterId] || [];
}

export function mergeWritingArchives(mineRaw, theirsRaw) {
  const mine = normalizeArchive(parseArchive(mineRaw));
  const theirs = normalizeArchive(parseArchive(theirsRaw));
  const out = {};
  const chapterIds = new Set([...Object.keys(mine), ...Object.keys(theirs)]);
  for (const chapterId of chapterIds) {
    const seen = new Set();
    const merged = [...(mine[chapterId] || []), ...(theirs[chapterId] || [])]
      .filter((entry) => {
        const key = `${entry.date}::${entry.text}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      })
      .sort((a, b) => a.date - b.date)
      .slice(-MAX_PER_CHAPTER);
    if (merged.length) out[chapterId] = merged;
  }
  return JSON.stringify(out);
}
