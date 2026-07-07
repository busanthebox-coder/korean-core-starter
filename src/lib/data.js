// Single slim bundle built by scripts/build-app-data.mjs (run after generate-korean-data.mjs).
import data from '../../korean/data/app-data.json';
import { curriculumSortValue } from './curriculumStructure.js';

export const entries = [
  ...data.words,
  ...data.newcomerVocab,
  ...data.extendedVocab,
  ...data.expressions,
  ...data.patterns,
].sort((a, b) => (a.sort ?? 0) - (b.sort ?? 0));

const byId = new Map(entries.map((e) => [e.id, e]));
// Deduped expressions carry the ids of their dropped duplicates as `aliasIds`,
// so cross-links pointing at any duplicate resolve to the kept (richest) entry.
for (const e of entries) {
  if (e.aliasIds) for (const a of e.aliasIds) if (!byId.has(a)) byId.set(a, e);
}
export const findEntry = (id) => byId.get(id) || null;

function validateVocabPackItems(pack) {
  return (pack.items || []).map((item) => {
    if (!item.entryId) {
      throw new Error(`Invalid vocab pack item: ${pack.id} is missing entryId`);
    }
    if (!byId.has(item.entryId)) {
      throw new Error(`Invalid vocab pack reference: ${pack.id} -> ${item.entryId}`);
    }
    for (const relatedId of item.relatedEntryIds || []) {
      if (!byId.has(relatedId)) {
        throw new Error(`Invalid vocab pack related reference: ${pack.id} -> ${item.entryId} -> ${relatedId}`);
      }
    }
    return item;
  });
}

export const vocabPacks = (data.vocabPacks || []).map((pack) => ({
  ...pack,
  items: validateVocabPackItems(pack)
}));
export const findVocabPack = (id) => vocabPacks.find((pack) => pack.id === id) || null;

const READER_LEVEL_ORDER = { A1: 1, A2: 2, B1: 3, B2: 4 };
export const readers = (data.readers || []).slice().sort((a, b) =>
  (READER_LEVEL_ORDER[a.level] || 99) - (READER_LEVEL_ORDER[b.level] || 99) ||
  String(a.id || '').localeCompare(String(b.id || ''))
);
export const findReader = (id) => readers.find((reader) => reader.id === id) || null;

export const hanjaRoots = (data.hanjaRoots || []).slice().sort((a, b) =>
  String(a.reading || '').localeCompare(String(b.reading || ''), 'ko') ||
  String(a.id || '').localeCompare(String(b.id || ''))
);
export const findHanjaRoot = (id) => hanjaRoots.find((root) => root.id === id) || null;

const rootsByEntryId = new Map();
for (const root of hanjaRoots) {
  for (const member of root.members || []) {
    if (!member.entryId) continue;
    if (!rootsByEntryId.has(member.entryId)) rootsByEntryId.set(member.entryId, []);
    rootsByEntryId.get(member.entryId).push(root);
  }
}
export const hanjaRootsForEntry = (entryId) => rootsByEntryId.get(entryId) || [];

export const chapters = (data.course.chapters || []).slice().sort((a, b) =>
  curriculumSortValue(a) - curriculumSortValue(b) || a.number - b.number
);

// ── Truthful B1 tagging ──────────────────────────────────────────────────
// The dataset ships only A1/A2 levels, yet chapters 12–16 are a real B1 track
// (reported speech, guessing, abstract society/work vocabulary). A word or
// pattern that is FIRST taught (core) in a B1 chapter is genuinely B1, so we
// promote it here — derived from chapter.level, so it survives regeneration and
// never inflates B1 with guesses. Items reused from an earlier A1/A2 chapter are
// left untouched.
(function tagB1() {
  const earlierCore = new Set();
  const b1Core = new Set();
  for (const ch of chapters) {
    const ids = [...(ch.coreVocabularyIds || []), ...(ch.patternIds || [])];
    for (const id of ids) (/B1/i.test(ch.level || '') ? b1Core : earlierCore).add(id);
  }
  for (const id of b1Core) {
    if (earlierCore.has(id)) continue;          // taught earlier → keep its level
    const e = byId.get(id);
    if (e && e.level !== 'B1') e.level = 'B1';
  }
})();

// Levels actually present in the data, low→high, for filter UIs.
const LEVEL_ORDER = ['A1', 'A2', 'B1', 'B2', 'C1'];
export const levels = LEVEL_ORDER.filter((l) => entries.some((e) => e.level === l));
export const curriculumGuide = data.course.curriculumGuide || [];
export const functionTags = data.course.functionTags || [];
export const grammar = [...(data.grammar.grammarItems || []), ...(data.grammar.endingItems || [])];
export const findGrammar = (id) => grammar.find((g) => g.id === id) || null;
export const activities = data.activities.chapterActivities || [];
export const guideTracks = data.guide.tracks || [];
export const dialogues = data.dialogues.dialogues || [];
export const conversations = (data.conversations && data.conversations.conversations) || [];
