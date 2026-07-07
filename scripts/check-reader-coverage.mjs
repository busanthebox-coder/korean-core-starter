import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildGlossIndex, matchGlossToken, tokenizeKoreanText } from '../src/lib/gloss.js';
import { formatReaderReport, readReaders, validateReaderSet } from './validate-readers.mjs';

const DEFAULT_SRC = 'scripts/readers-src';
const DEFAULT_MIN = 0.85;

function readJson(path) {
  return JSON.parse(readFileSync(path, 'utf8'));
}

function loadEntries() {
  const data = readJson('korean/data/app-data.json');
  return [
    ...(data.words || []),
    ...(data.newcomerVocab || []),
    ...(data.extendedVocab || []),
    ...(data.expressions || []),
    ...(data.patterns || []),
  ];
}

function manualEntriesFor(reader, entries) {
  const byId = new Map(entries.map((entry) => [entry.id, entry]));
  const byHangul = new Map(entries.map((entry) => [entry.hangul, entry]));
  return (reader.newWords || []).map((word, index) => {
    const value = String(word || '').trim();
    return byId.get(value) || byHangul.get(value) || {
      id: `${reader.id}-manual-${index + 1}`,
      hangul: value,
      english: 'reader word',
      partOfSpeech: 'reader word',
    };
  });
}

export function coverageForReader(reader, entries = loadEntries()) {
  const index = buildGlossIndex([...entries, ...manualEntriesFor(reader, entries)]);
  const tokens = tokenizeKoreanText((reader.body || []).join('\n'));
  const rows = tokens.map((token) => ({ token, match: matchGlossToken(token, index) }));
  const matched = rows.filter((row) => row.match).length;
  const total = rows.length;
  const coverage = total ? matched / total : 0;
  const unmatched = [...new Set(rows.filter((row) => !row.match).map((row) => row.token))];
  return { readerId: reader.id, level: reader.level, title: reader.title, total, matched, coverage, unmatched };
}

export function checkReaderCoverage(readers, { min = DEFAULT_MIN, entries = loadEntries() } = {}) {
  const validation = validateReaderSet(readers);
  const rows = readers.map((reader) => coverageForReader(reader, entries));
  const errors = [...validation.errors];
  for (const row of rows) {
    if (!row.total) errors.push(`${row.readerId} has no Korean tokens`);
    if (row.coverage < min) {
      errors.push(`${row.readerId} coverage ${(row.coverage * 100).toFixed(1)}% below ${(min * 100).toFixed(0)}%`);
    }
  }
  return { ok: errors.length === 0, errors, rows, validation };
}

export function formatCoverageReport(result) {
  const lines = [
    result.ok ? 'Reader coverage passed.' : 'Reader coverage failed.',
    formatReaderReport(result.validation),
    'Coverage:',
  ];
  for (const row of result.rows) {
    const pct = (row.coverage * 100).toFixed(1);
    const sample = row.unmatched.slice(0, 12).join(', ') || 'none';
    lines.push(`- ${row.readerId} ${row.level} ${pct}% (${row.matched}/${row.total}) unmatched: ${sample}`);
  }
  for (const error of result.errors) lines.push(`ERROR: ${error}`);
  return lines.join('\n');
}

function parseArgs(argv) {
  const args = { src: DEFAULT_SRC, min: DEFAULT_MIN, selfTest: false };
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--src') args.src = argv[++i];
    else if (arg === '--min') args.min = Number(argv[++i]);
    else if (arg === '--self-test-boundaries') args.selfTest = true;
  }
  return args;
}

function boundarySelfTest() {
  const readers = [{
    id: 'reader-a1-01',
    level: 'A1',
    title: '제 하루',
    titleEn: 'My Day',
    genre: 'fixture',
    body: ['없는말 없는말 없는말 없는말 없는말 없는말 없는말 없는말 없는말 없는말'],
    bodyTranslation: ['fixture'],
    comprehensionQuestions: Array.from({ length: 4 }, (_, index) => ({
      type: 'multipleChoice',
      prompt: `Question ${index + 1}?`,
      options: ['one', 'two', 'three'],
      correct: 'one',
      explanation: 'one is correct; the other choices are distractors.',
    })),
    summaryPrompt: '요약해 보세요.',
    newWords: [],
  }];
  const result = checkReaderCoverage(readers, { entries: [] });
  return !result.ok && result.errors.some((error) => error.includes('coverage'));
}

function isMain() {
  return process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1]);
}

if (isMain()) {
  const args = parseArgs(process.argv.slice(2));
  if (args.selfTest) {
    const ok = boundarySelfTest();
    console.log(ok ? 'Reader coverage boundary self-test passed.' : 'Reader coverage boundary self-test failed.');
    process.exit(ok ? 0 : 1);
  }
  const result = checkReaderCoverage(readReaders(args.src), { min: args.min });
  console.log(formatCoverageReport(result));
  process.exit(result.ok ? 0 : 1);
}
