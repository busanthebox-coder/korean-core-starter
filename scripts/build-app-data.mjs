import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync, readdirSync, existsSync, mkdirSync, rmSync } from 'node:fs';
import { buildKoreanDataBundle } from './build-korean-data-bundle.mjs';
import { formatExerciseReport, validateExercises } from './validate-exercises.mjs';
import { checkReaderCoverage, formatCoverageReport } from './check-reader-coverage.mjs';
import { formatReaderReport, readReaders, validateReaderSet } from './validate-readers.mjs';
import { formatHanjaRootReport, readHanjaRoots, validateHanjaRoots } from './validate-hanja-roots.mjs';

// Emits korean/data/app-data.json for legacy/test surfaces and public/data/*.json
// for the Svelte app's split runtime loader.
// The full per-file JSON stays for the legacy app + audit; here we drop fields the
// new UI never renders (notably the large per-entry `lesson` block) to shrink the build.
const dir = new URL('../korean/data/', import.meta.url);
const read = (f) => JSON.parse(readFileSync(new URL(f, dir), 'utf8'));

// Merge rich chapter data from scripts/rich-chapters/*.json into course chapters.
// Rich chapters add teaching sections (hook, grammarNotes, extendedVocabulary, etc.)
// without replacing existing course structure.
const richDir = new URL('../scripts/rich-chapters/', import.meta.url);
const exerciseValidation = validateExercises({ richDir });
if (!exerciseValidation.ok) {
  throw new Error(`Exercise validation failed before app-data build:\n${formatExerciseReport(exerciseValidation)}`);
}
const richChapters = new Map();
if (existsSync(richDir)) {
  for (const f of readdirSync(richDir).filter(f => f.endsWith('.json'))) {
    const data = JSON.parse(readFileSync(new URL(f, richDir), 'utf8'));
    if (data.id) richChapters.set(data.id, data);
  }
}
const mergeRich = (chapter) => {
  const rich = richChapters.get(chapter.id);
  return rich ? { ...chapter, ...rich } : chapter;
};

// Fields the Svelte UI never reads (verified by grep over src/). Dropping them shrinks the build.
const STRIP = ['lesson', 'formGroupInfo', 'formLinks', 'contextHint', 'learnerPriority', 'activityTags', 'speechLevels', 'adjectiveForms', 'chapterIds', 'category', 'patternInfo', 'studyGuide', 'relatedWordIds'];
const slim = (e) => {
  const c = { ...e };
  for (const k of STRIP) delete c[k];
  return c;
};

// Some expressions are seeded in several situation files (e.g. 여기요, 안녕히 가세요),
// so the same headword can appear two or three times — and once we deepen one copy,
// the others would sit shallow right beside it in the dictionary. Keep only the
// RICHEST copy per headword. Richness = how much real teaching content it carries.
const richness = (e) =>
  (e.nuance || '').length +
  (e.structuredNuance || []).length * 200 +
  (e.examples || []).length * 20 +
  (e.usagePhrases || e.usage || []).length * 10 +
  (e.commonMistakes || e.mistakes || []).length * 10;

const dedupeRichest = (entries) => {
  const groups = new Map();
  for (const e of entries) {
    if (!groups.has(e.hangul)) groups.set(e.hangul, []);
    groups.get(e.hangul).push(e);
  }
  const seen = new Set();
  const out = [];
  for (const e of entries) {        // keep first-occurrence order, richest content
    if (seen.has(e.hangul)) continue;
    seen.add(e.hangul);
    const group = groups.get(e.hangul);
    const best = group.reduce((a, b) => (richness(b) > richness(a) ? b : a));
    // Preserve the dropped copies' ids as aliases so chapter/guide cross-links
    // that point at any duplicate still resolve to the kept (richest) entry.
    const aliasIds = group.map((g) => g.id).filter((id) => id && id !== best.id);
    out.push(aliasIds.length ? { ...best, aliasIds } : best);
  }
  return out;
};

const allExpr = read('expressions.json').entries.map(slim);
const dedupExpr = dedupeRichest(allExpr);
const words = read('words.json').entries.map(slim);
const newcomerVocab = read('newcomer-vocab.json').entries.map(slim);
const extendedVocab = read('vocab-extended.json').entries.map(slim);
const patterns = read('patterns.json').entries.map(slim);
const allEntries = [...words, ...newcomerVocab, ...extendedVocab, ...dedupExpr, ...patterns];

const course = (() => {
  const c = read('course.json');
  c.chapters = (c.chapters || []).map(mergeRich);
  return c;
})();

function applyB1Promotion(entries, courseData) {
  const byId = new Map();
  for (const entry of entries) {
    if (entry.id) byId.set(entry.id, entry);
    for (const aliasId of entry.aliasIds || []) if (!byId.has(aliasId)) byId.set(aliasId, entry);
  }
  const earlierCore = new Set();
  const b1Core = new Set();
  for (const chapter of courseData.chapters || []) {
    const ids = [...(chapter.coreVocabularyIds || []), ...(chapter.patternIds || [])];
    for (const id of ids) (/B1/i.test(chapter.level || '') ? b1Core : earlierCore).add(id);
  }
  for (const id of b1Core) {
    if (earlierCore.has(id)) continue;
    const entry = byId.get(id);
    if (entry && entry.level !== 'B1') entry.level = 'B1';
  }
}

applyB1Promotion(allEntries, course);

const readersRaw = readReaders('scripts/readers-src');
const readerValidation = validateReaderSet(readersRaw);
if (!readerValidation.ok) {
  throw new Error(`Reader validation failed before app-data build:\n${formatReaderReport(readerValidation)}`);
}
const readerCoverage = checkReaderCoverage(readersRaw, { entries: allEntries });
if (!readerCoverage.ok) {
  throw new Error(`Reader coverage failed before app-data build:\n${formatCoverageReport(readerCoverage)}`);
}
const readers = readersRaw.map(({ __file, ...reader }) => reader);

const hanjaRootsRaw = readHanjaRoots('scripts/hanja-src/roots.json');
const hanjaValidation = validateHanjaRoots(hanjaRootsRaw, allEntries);
if (!hanjaValidation.ok) {
  throw new Error(`Hanja root validation failed before app-data build:\n${formatHanjaRootReport(hanjaValidation)}`);
}
const hanjaRoots = hanjaRootsRaw.map(({ review, members = [], ...root }) => ({
  ...root,
  members: members.map(({ reviewed, ...member }) => member),
}));

function resolveById(entryId, hangul, packId) {
  const entry = allEntries.find((item) => item.id === entryId);
  if (!entry) throw new Error(`${packId} references missing entryId "${entryId}"`);
  if (hangul && entry.hangul !== hangul) {
    throw new Error(`${packId} entryId "${entryId}" is ${entry.hangul}, not ${hangul}`);
  }
  return entry;
}

function resolveByHangul(hangul, packId) {
  const matches = allEntries.filter((entry) => entry.hangul === hangul);
  if (!matches.length) throw new Error(`${packId} references missing entryHangul "${hangul}"`);
  if (matches.length > 1) {
    const candidates = matches.map((entry) => `${entry.id}:${entry.english}`).join(', ');
    throw new Error(`${packId} has ambiguous entryHangul "${hangul}" (${candidates}); add entryId`);
  }
  return matches
    .slice()
    .sort((a, b) =>
      (b.level === 'A1') - (a.level === 'A1') ||
      (b.type === 'word') - (a.type === 'word') ||
      (a.sort ?? 0) - (b.sort ?? 0)
    )[0];
}

function readVocabPacks() {
  const packs = JSON.parse(readFileSync(new URL('./vocab-packs.json', import.meta.url), 'utf8'));
  return packs.map((pack) => ({
    ...pack,
    items: (pack.items || []).map((item, index) => {
      const entry = item.entryId
        ? resolveById(item.entryId, item.entryHangul, `Vocab pack ${pack.id}`)
        : resolveByHangul(item.entryHangul, `Vocab pack ${pack.id}`);
      const relatedEntries = (item.relatedHangul || []).map((hangul) => resolveByHangul(hangul, `Vocab pack ${pack.id}`));
      return {
        ...item,
        order: index + 1,
        entryId: entry.id,
        entryEnglish: entry.english,
        entryRomanization: entry.romanization,
        entryLevel: entry.level,
        relatedEntryIds: relatedEntries.map((related) => related.id)
      };
    })
  }));
}

// Expression clusters ("진짜 vs 정말 vs 참") are an added comparison layer over the
// dictionary: they own the deciding rule, the entries own the gloss. Members are
// authored as hangul and resolved here so a typo fails the build, not the page.
function readExpressionClusters() {
  const clusters = JSON.parse(readFileSync(new URL('./expression-clusters.json', import.meta.url), 'utf8'));
  const seenIds = new Set();
  const clusterCountByEntry = new Map();
  return clusters.map((cluster) => {
    const label = `Expression cluster ${cluster.id}`;
    if (seenIds.has(cluster.id)) throw new Error(`Duplicate expression cluster id "${cluster.id}"`);
    seenIds.add(cluster.id);
    if (!cluster.rule) throw new Error(`${label} is missing a rule`);
    if ((cluster.members || []).length < 2) throw new Error(`${label} needs at least 2 members to compare`);
    const members = cluster.members.map((member) => {
      const entry = member.entryId
        ? resolveById(member.entryId, member.hangul, label)
        : resolveByHangul(member.hangul, label);
      if (!member.when || !member.hint || !member.example?.ko) {
        throw new Error(`${label} member "${member.hangul}" is missing when/hint/example`);
      }
      const count = (clusterCountByEntry.get(entry.id) || 0) + 1;
      clusterCountByEntry.set(entry.id, count);
      if (count > 2) throw new Error(`${label}: "${member.hangul}" is in ${count} clusters (max 2)`);
      return {
        ...member,
        entryId: entry.id,
        entryEnglish: entry.english,
        entryRomanization: entry.romanization,
        entryLevel: entry.level,
      };
    });
    return { ...cluster, members };
  });
}

const out = {
  words,
  newcomerVocab,
  extendedVocab,
  expressions: dedupExpr,
  patterns,
  course,
  grammar: read('grammar.json'),
  activities: read('activities.json'),
  guide: read('guide.json'),
  dialogues: read('dialogues.json'),
  conversations: read('conversations.json'),
  vocabPacks: readVocabPacks(),
  expressionClusters: readExpressionClusters(),
  readers,
  hanjaRoots,
};

const publicDataDir = new URL('../public/data/', import.meta.url);
const sectionById = new Map([
  ...words.map((entry) => [entry.id, 'words']),
  ...newcomerVocab.map((entry) => [entry.id, 'core']),
  ...extendedVocab.map((entry) => [entry.id, 'extended']),
  ...dedupExpr.map((entry) => [entry.id, 'expressions']),
  ...patterns.map((entry) => [entry.id, 'core']),
]);

function sortedEntries(items) {
  return items.slice().sort((a, b) =>
    (a.sort ?? 0) - (b.sort ?? 0) ||
    String(a.id || '').localeCompare(String(b.id || ''))
  );
}

function indexEntry(entry) {
  const row = {
    id: entry.id,
    hangul: entry.hangul,
    romanization: entry.romanization,
    english: entry.english,
    level: entry.level,
    type: entry.type,
    partOfSpeech: entry.partOfSpeech,
    topic: entry.topic,
    section: sectionById.get(entry.id) || 'extended',
  };
  if (entry.aliasIds?.length) row.aliasIds = entry.aliasIds;
  return row;
}

function writeHashedJson(logicalName, payload) {
  const json = JSON.stringify(payload);
  const hash = createHash('sha256').update(json).digest('hex').slice(0, 8);
  const fileName = `${logicalName}.${hash}.json`;
  writeFileSync(new URL(fileName, publicDataDir), json, 'utf8');
  return fileName;
}

function writeSplitData(data) {
  mkdirSync(publicDataDir, { recursive: true });
  for (const file of readdirSync(publicDataDir)) {
    if (/^(app-(core|index|words|expressions|extended)\.|manifest\.json$)/.test(file)) {
      rmSync(new URL(file, publicDataDir), { force: true });
    }
  }

  const files = {
    core: writeHashedJson('app-core', {
      course: data.course,
      grammar: data.grammar,
      activities: data.activities,
      guide: data.guide,
      dialogues: data.dialogues,
      conversations: data.conversations,
      vocabPacks: data.vocabPacks,
      expressionClusters: data.expressionClusters,
      readers: data.readers,
      hanjaRoots: data.hanjaRoots,
      newcomerVocab: data.newcomerVocab,
      patterns: data.patterns,
    }),
    index: writeHashedJson('app-index', {
      entries: sortedEntries(allEntries).map(indexEntry),
    }),
    words: writeHashedJson('app-words', { entries: data.words }),
    expressions: writeHashedJson('app-expressions', { entries: data.expressions }),
    extended: writeHashedJson('app-extended', { entries: data.extendedVocab }),
  };

  writeFileSync(
    new URL('manifest.json', publicDataDir),
    JSON.stringify({
      version: new Date().toISOString(),
      files,
    }),
    'utf8'
  );
  return files;
}

writeFileSync(new URL('app-data.json', dir), JSON.stringify(out));
const splitFiles = writeSplitData(out);
buildKoreanDataBundle();
const n = out.words.length + out.newcomerVocab.length + out.extendedVocab.length + out.expressions.length + out.patterns.length;
const removed = allExpr.length - dedupExpr.length;
console.log(`Built app-data.json and public/data manifest (${n} entries, ${readers.length} readers, ${hanjaRoots.length} hanja roots, lesson stripped; ${removed} duplicate expressions collapsed to richest; split: ${Object.values(splitFiles).join(', ')}).`);
