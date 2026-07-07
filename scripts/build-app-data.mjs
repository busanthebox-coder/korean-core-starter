import { readFileSync, writeFileSync, readdirSync, existsSync } from 'node:fs';
import { buildKoreanDataBundle } from './build-korean-data-bundle.mjs';
import { formatExerciseReport, validateExercises } from './validate-exercises.mjs';
import { checkReaderCoverage, formatCoverageReport } from './check-reader-coverage.mjs';
import { formatReaderReport, readReaders, validateReaderSet } from './validate-readers.mjs';

// Emits korean/data/app-data.json: a single slim bundle for the Svelte app.
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

function resolveById(entryId, hangul, packId) {
  const entry = allEntries.find((item) => item.id === entryId);
  if (!entry) throw new Error(`Vocab pack ${packId} references missing entryId "${entryId}"`);
  if (hangul && entry.hangul !== hangul) {
    throw new Error(`Vocab pack ${packId} entryId "${entryId}" is ${entry.hangul}, not ${hangul}`);
  }
  return entry;
}

function resolveByHangul(hangul, packId) {
  const matches = allEntries.filter((entry) => entry.hangul === hangul);
  if (!matches.length) throw new Error(`Vocab pack ${packId} references missing entryHangul "${hangul}"`);
  if (matches.length > 1) {
    const candidates = matches.map((entry) => `${entry.id}:${entry.english}`).join(', ');
    throw new Error(`Vocab pack ${packId} has ambiguous entryHangul "${hangul}" (${candidates}); add entryId`);
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
        ? resolveById(item.entryId, item.entryHangul, pack.id)
        : resolveByHangul(item.entryHangul, pack.id);
      const relatedEntries = (item.relatedHangul || []).map((hangul) => resolveByHangul(hangul, pack.id));
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

const out = {
  words,
  newcomerVocab,
  extendedVocab,
  expressions: dedupExpr,
  patterns,
  course: (() => {
    const c = read('course.json');
    c.chapters = (c.chapters || []).map(mergeRich);
    return c;
  })(),
  grammar: read('grammar.json'),
  activities: read('activities.json'),
  guide: read('guide.json'),
  dialogues: read('dialogues.json'),
  conversations: read('conversations.json'),
  vocabPacks: readVocabPacks(),
  readers,
};

writeFileSync(new URL('app-data.json', dir), JSON.stringify(out));
buildKoreanDataBundle();
const n = out.words.length + out.newcomerVocab.length + out.extendedVocab.length + out.expressions.length + out.patterns.length;
const removed = allExpr.length - dedupExpr.length;
console.log(`Built app-data.json (${n} entries, ${readers.length} readers, lesson stripped; ${removed} duplicate expressions collapsed to richest).`);
