import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const LEVEL_ORDER = ['A1', 'A2', 'B1', 'B2'];

function readJson(path) {
  return JSON.parse(readFileSync(path, 'utf8'));
}

function entriesFrom(data) {
  return [
    ...(data.words || []),
    ...(data.newcomerVocab || []),
    ...(data.extendedVocab || []),
    ...(data.expressions || []),
    ...(data.patterns || []),
  ];
}

function levelRank(level) {
  const rank = LEVEL_ORDER.indexOf(level);
  return rank === -1 ? Number.POSITIVE_INFINITY : rank;
}

function grammarLabel(id, grammarById) {
  const item = grammarById.get(id);
  if (!item) return id;
  return item.title || item.pattern || item.label || id;
}

function collectForLevel(targetLevel, data) {
  const targetRank = levelRank(targetLevel);
  const entries = entriesFrom(data);
  const byId = new Map(entries.map((entry) => [entry.id, entry]));
  const grammarItems = [
    ...((data.grammar && data.grammar.grammarItems) || []),
    ...((data.grammar && data.grammar.endingItems) || []),
  ];
  const grammarById = new Map(grammarItems.map((item) => [item.id, item]));
  const chapters = (data.course.chapters || [])
    .filter((chapter) => levelRank(chapter.level) <= targetRank)
    .sort((a, b) => a.number - b.number);
  const grammarIds = new Set();
  const vocabularyIds = new Set();
  const patternIds = new Set();
  for (const chapter of chapters) {
    for (const id of chapter.grammarFocus || []) grammarIds.add(id);
    for (const id of chapter.coreVocabularyIds || []) vocabularyIds.add(id);
    for (const id of chapter.patternIds || []) patternIds.add(id);
  }
  const vocabulary = [...vocabularyIds]
    .map((id) => byId.get(id))
    .filter(Boolean)
    .map((entry) => ({ id: entry.id, hangul: entry.hangul, english: entry.english, level: entry.level, type: entry.type }));
  const patterns = [...patternIds]
    .map((id) => byId.get(id))
    .filter(Boolean)
    .map((entry) => ({ id: entry.id, hangul: entry.hangul, english: entry.english, level: entry.level }));
  return {
    level: targetLevel,
    chapters: chapters.map((chapter) => ({
      id: chapter.id,
      number: chapter.number,
      level: chapter.level,
      title: chapter.title,
    })),
    grammar: [...grammarIds].map((id) => ({ id, label: grammarLabel(id, grammarById) })),
    vocabulary,
    patterns,
  };
}

export function extractReaderControls(data = readJson('korean/data/app-data.json')) {
  return {
    generatedAt: new Date().toISOString(),
    source: 'korean/data/app-data.json',
    levels: Object.fromEntries(LEVEL_ORDER.map((level) => [level, collectForLevel(level, data)])),
  };
}

function formatSummary(controls) {
  const lines = ['Reader controls extracted.'];
  for (const level of LEVEL_ORDER) {
    const item = controls.levels[level];
    lines.push(
      `${level}: chapters=${item.chapters.length}, grammar=${item.grammar.length}, vocabulary=${item.vocabulary.length}, patterns=${item.patterns.length}`
    );
    lines.push(`  latest chapters: ${item.chapters.slice(-5).map((chapter) => `${chapter.number}:${chapter.title}`).join(' | ')}`);
    lines.push(`  sample grammar: ${item.grammar.slice(0, 8).map((grammar) => grammar.label).join(' | ')}`);
    lines.push(`  sample vocabulary: ${item.vocabulary.slice(0, 18).map((entry) => entry.hangul).join(', ')}`);
  }
  return lines.join('\n');
}

function parseArgs(argv) {
  const args = { out: '' };
  for (let i = 0; i < argv.length; i += 1) {
    if (argv[i] === '--out') args.out = argv[++i];
  }
  return args;
}

function isMain() {
  return process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1]);
}

if (isMain()) {
  const args = parseArgs(process.argv.slice(2));
  const controls = extractReaderControls();
  if (args.out) {
    mkdirSync(dirname(args.out), { recursive: true });
    writeFileSync(args.out, `${JSON.stringify(controls, null, 2)}\n`);
  }
  console.log(formatSummary(controls));
}
