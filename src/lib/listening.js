import { normalizeKo } from './quiz.js';
import { gradeReply } from './replyGrader.js';

const IDEAL_MIN = 8;
const IDEAL_MAX = 20;
const FALLBACK_MIN = 5;
const FALLBACK_MAX = 36;

function cleanedText(value) {
  return String(value || '').replace(/\s+/g, ' ').trim();
}

function normalizedLength(value) {
  return normalizeKo(value).replace(/[0-9a-z]/g, '').length;
}

function isUsableSentence(item, min, max) {
  const len = normalizedLength(item.ko);
  return item.ko && item.en && len >= min && len <= max;
}

function addCandidate(out, seen, item) {
  const ko = cleanedText(item.ko);
  const en = cleanedText(item.en || item.english);
  const key = normalizeKo(ko);
  if (!key || seen.has(key)) return;
  seen.add(key);
  out.push({
    id: item.id,
    ko,
    en,
    romanization: cleanedText(item.romanization),
    entryIds: Array.isArray(item.entryIds) ? item.entryIds.filter(Boolean) : [],
    source: item.source || 'chapter',
  });
}

export function collectListeningCandidates(chapter) {
  const seen = new Set();
  const all = [];
  (chapter?.grammarNotes || []).forEach((note, noteIndex) => {
    (note.examples || []).forEach((example, exampleIndex) => addCandidate(all, seen, {
      ...example,
      id: `${chapter.id}-grammar-${noteIndex}-${exampleIndex}`,
      source: 'grammar',
    }));
  });
  const lines = chapter?.extendedDialogue?.lines?.length
    ? chapter.extendedDialogue.lines
    : chapter?.dialogue || [];
  lines.forEach((line, lineIndex) => addCandidate(all, seen, {
    ...line,
    id: `${chapter.id}-dialogue-${lineIndex}`,
    source: 'dialogue',
  }));

  const ideal = all.filter((item) => isUsableSentence(item, IDEAL_MIN, IDEAL_MAX));
  if (ideal.length >= 4) return ideal;
  return all.filter((item) => isUsableSentence(item, FALLBACK_MIN, FALLBACK_MAX));
}

function optionsFor(target, candidates) {
  const seen = new Set([target.en]);
  const options = [target.en];
  for (const candidate of candidates) {
    if (!candidate.en || seen.has(candidate.en)) continue;
    seen.add(candidate.en);
    options.push(candidate.en);
    if (options.length === 4) break;
  }
  return options.length === 4 ? [...options.slice(1), options[0]] : [];
}

export function buildListeningItemsFromCandidates(candidates, { count = 4 } = {}) {
  const pool = (candidates || []).filter(Boolean);
  const items = [];
  const dictationCount = Math.min(2, count);
  for (const candidate of pool.slice(0, dictationCount)) {
    items.push({
      ...candidate,
      type: 'dictation',
      answer: candidate.ko,
    });
  }

  for (const candidate of pool.slice(dictationCount)) {
    const options = optionsFor(candidate, pool);
    if (!options.length) continue;
    items.push({
      ...candidate,
      type: 'listenChoice',
      answer: candidate.en,
      options,
    });
    if (items.length >= count) break;
  }
  return items.length >= Math.min(count, 4) ? items.slice(0, count) : [];
}

export function buildChapterListeningItems(chapter, options = {}) {
  return buildListeningItemsFromCandidates(collectListeningCandidates(chapter), options);
}

export function buildListeningPractice(chapters, { chapterId = '', count = 8 } = {}) {
  const selected = chapterId
    ? (chapters || []).filter((chapter) => chapter.id === chapterId)
    : (chapters || []);
  const candidates = selected.flatMap(collectListeningCandidates);
  return buildListeningItemsFromCandidates(candidates, { count });
}

export function countListeningCandidates(chapters, chapterId = '') {
  const selected = chapterId
    ? (chapters || []).filter((chapter) => chapter.id === chapterId)
    : (chapters || []);
  return selected.flatMap(collectListeningCandidates).length;
}

export function gradeDictation(input, item) {
  if (normalizeKo(input) === normalizeKo(item?.ko)) return { verdict: 'correct', missing: [] };
  const partial = gradeReply(input, item?.ko || '');
  return {
    verdict: partial.verdict === 'wrong' ? 'wrong' : 'close',
    missing: partial.missing || [],
  };
}
