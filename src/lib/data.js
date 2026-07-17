import { writable } from 'svelte/store';
import { curriculumSortValue } from './curriculumStructure.js';

const LEVEL_ORDER = ['A1', 'A2', 'B1', 'B2', 'C1'];
const READER_LEVEL_ORDER = { A1: 1, A2: 2, B1: 3, B2: 4 };
const SECTION_KEYS = {
  words: 'words',
  newcomerVocab: 'core',
  extendedVocab: 'extended',
  expressions: 'expressions',
  patterns: 'core',
};

export const entries = [];
export const entriesVersion = writable(0);

let byId = new Map();
let rootsByEntryId = new Map();
let clusterByEntryId = new Map();
let clustersByHangul = new Map();
let sectionResolver = null;

export let vocabPacks = [];
export let readers = [];
export let hanjaRoots = [];
export let chapters = [];
export let levels = [];
export let curriculumGuide = [];
export let functionTags = [];
export let grammar = [];
export let activities = [];
export let guideTracks = [];
export let dialogues = [];
export let conversations = [];
export let expressionClusters = [];

function notifyEntriesChanged() {
  entriesVersion.update((n) => n + 1);
}

function sortedEntries(items) {
  return (items || []).slice().sort((a, b) =>
    (a.sort ?? 0) - (b.sort ?? 0) ||
    String(a.id || '').localeCompare(String(b.id || ''))
  );
}

function compactIndexEntry(entry, section) {
  const row = {
    id: entry.id,
    hangul: entry.hangul,
    romanization: entry.romanization,
    english: entry.english,
    level: entry.level,
    type: entry.type,
    partOfSpeech: entry.partOfSpeech,
    topic: entry.topic,
    section,
  };
  if (entry.aliasIds?.length) row.aliasIds = entry.aliasIds;
  return row;
}

function markFull(entry, fallbackSection) {
  return {
    ...entry,
    section: entry.section || fallbackSection,
    _full: true,
  };
}

function rebuildById() {
  byId = new Map();
  for (const entry of entries) {
    if (!entry?.id) continue;
    byId.set(entry.id, entry);
    for (const aliasId of entry.aliasIds || []) if (!byId.has(aliasId)) byId.set(aliasId, entry);
  }
}

function rebuildHanjaRootsByEntryId() {
  rootsByEntryId = new Map();
  for (const root of hanjaRoots) {
    for (const member of root.members || []) {
      if (!member.entryId) continue;
      if (!rootsByEntryId.has(member.entryId)) rootsByEntryId.set(member.entryId, []);
      rootsByEntryId.get(member.entryId).push(root);
    }
  }
}

// A word can sit in more than one cluster (보다 is both "meet up with" and "see"),
// so hangul maps to a list while an entry keeps its primary (first) cluster.
function rebuildClusterIndex() {
  clusterByEntryId = new Map();
  clustersByHangul = new Map();
  for (const cluster of expressionClusters) {
    for (const member of cluster.members || []) {
      if (member.entryId && !clusterByEntryId.has(member.entryId)) clusterByEntryId.set(member.entryId, cluster);
      if (!member.hangul) continue;
      if (!clustersByHangul.has(member.hangul)) clustersByHangul.set(member.hangul, []);
      clustersByHangul.get(member.hangul).push(cluster);
    }
  }
}

function refreshLevels() {
  levels = LEVEL_ORDER.filter((level) => entries.some((entry) => entry.level === level));
}

export function validateVocabPackItems(pack, lookup = byId) {
  return (pack.items || []).map((item) => {
    if (!item.entryId) {
      throw new Error(`Invalid vocab pack item: ${pack.id} is missing entryId`);
    }
    if (!lookup.has(item.entryId)) {
      throw new Error(`Invalid vocab pack reference: ${pack.id} -> ${item.entryId}`);
    }
    for (const relatedId of item.relatedEntryIds || []) {
      if (!lookup.has(relatedId)) {
        throw new Error(`Invalid vocab pack related reference: ${pack.id} -> ${item.entryId} -> ${relatedId}`);
      }
    }
    return item;
  });
}

function installCoreSurfaces(core) {
  chapters = (core.course?.chapters || []).slice().sort((a, b) =>
    curriculumSortValue(a) - curriculumSortValue(b) || a.number - b.number
  );
  curriculumGuide = core.course?.curriculumGuide || [];
  functionTags = core.course?.functionTags || [];
  grammar = [...(core.grammar?.grammarItems || []), ...(core.grammar?.endingItems || [])];
  activities = core.activities?.chapterActivities || [];
  guideTracks = core.guide?.tracks || [];
  dialogues = core.dialogues?.dialogues || [];
  conversations = core.conversations?.conversations || [];
  readers = (core.readers || []).slice().sort((a, b) =>
    (READER_LEVEL_ORDER[a.level] || 99) - (READER_LEVEL_ORDER[b.level] || 99) ||
    String(a.id || '').localeCompare(String(b.id || ''))
  );
  hanjaRoots = (core.hanjaRoots || []).slice().sort((a, b) =>
    String(a.reading || '').localeCompare(String(b.reading || ''), 'ko') ||
    String(a.id || '').localeCompare(String(b.id || ''))
  );
  expressionClusters = core.expressionClusters || [];
  rebuildHanjaRootsByEntryId();
  rebuildClusterIndex();
}

function installVocabPacks(core) {
  vocabPacks = (core.vocabPacks || []).map((pack) => ({
    ...pack,
    items: validateVocabPackItems(pack),
  }));
}

function coreEntries(core) {
  return [
    ...(core.newcomerVocab || []),
    ...(core.patterns || []),
  ].map((entry) => markFull(entry, 'core'));
}

export function resetDataForTest() {
  entries.splice(0, entries.length);
  byId = new Map();
  rootsByEntryId = new Map();
  vocabPacks = [];
  readers = [];
  hanjaRoots = [];
  chapters = [];
  levels = [];
  curriculumGuide = [];
  functionTags = [];
  grammar = [];
  activities = [];
  guideTracks = [];
  dialogues = [];
  conversations = [];
  expressionClusters = [];
  clusterByEntryId = new Map();
  clustersByHangul = new Map();
  notifyEntriesChanged();
}

export function installBootData({ core, index }) {
  entries.splice(0, entries.length);
  installCoreSurfaces(core);

  const fullCoreById = new Map(coreEntries(core).map((entry) => [entry.id, entry]));
  const rows = sortedEntries(index.entries || []);
  for (const row of rows) {
    const full = fullCoreById.get(row.id);
    entries.push(full ? { ...full, aliasIds: row.aliasIds || full.aliasIds } : { ...row, _full: false });
  }
  for (const full of fullCoreById.values()) {
    if (!entries.some((entry) => entry.id === full.id)) entries.push(full);
  }

  rebuildById();
  refreshLevels();
  installVocabPacks(core);
  notifyEntriesChanged();
}

export function hydrateSection(section, payload) {
  const incoming = (payload?.entries || []).map((entry) => markFull(entry, section));
  if (!incoming.length) return;

  const indexById = new Map(entries.map((entry, index) => [entry.id, index]));
  for (const entry of incoming) {
    const index = indexById.get(entry.id);
    if (index == null) {
      indexById.set(entry.id, entries.length);
      entries.push(entry);
    } else {
      entries[index] = entry;
    }
  }
  rebuildById();
  refreshLevels();
  notifyEntriesChanged();
}

export function installStaticDataForTests(data) {
  const indexRows = Object.entries(SECTION_KEYS).flatMap(([key, section]) =>
    (data[key] || []).map((entry) => compactIndexEntry(entry, section))
  );
  installBootData({ core: data, index: { entries: indexRows } });
  hydrateSection('words', { entries: data.words || [] });
  hydrateSection('expressions', { entries: data.expressions || [] });
  hydrateSection('extended', { entries: data.extendedVocab || [] });
}

export const findEntry = (id) => byId.get(id) || null;
export const findVocabPack = (id) => vocabPacks.find((pack) => pack.id === id) || null;
export const findReader = (id) => readers.find((reader) => reader.id === id) || null;
export const findHanjaRoot = (id) => hanjaRoots.find((root) => root.id === id) || null;
export const hanjaRootsForEntry = (entryId) => rootsByEntryId.get(entryId) || [];
export const findGrammar = (id) => grammar.find((item) => item.id === id) || null;
export const clusterForEntry = (entryId) => clusterByEntryId.get(entryId) || null;
export const clustersForHangul = (hangul) => (hangul && clustersByHangul.get(hangul)) || [];
export const isFull = (entry) => !!entry?._full;

export function setSectionResolver(resolver) {
  sectionResolver = resolver;
}

export async function getEntryFull(id) {
  const entry = findEntry(id);
  if (!entry || isFull(entry) || !entry.section || entry.section === 'core') return entry;
  if (!sectionResolver) throw new Error(`No data section resolver installed for ${entry.section}`);
  await sectionResolver(entry.section);
  return findEntry(id);
}
