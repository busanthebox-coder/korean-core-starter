#!/usr/bin/env node
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const repoRoot = new URL('../../', import.meta.url);
const dataDir = new URL('../../korean/data/', import.meta.url);

function readJson(urlOrPath) {
  return JSON.parse(readFileSync(urlOrPath, 'utf8'));
}

function parseArgs(argv) {
  const options = { json: false, out: null };
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--json') options.json = true;
    else if (arg === '--out') options.out = resolve(argv[++i]);
    else throw new Error(`Unknown argument: ${arg}`);
  }
  return options;
}

function flattenChecklist(checklist) {
  return (checklist.categories || []).flatMap((category) =>
    (category.items || []).map((hangul) => ({
      hangul: String(hangul).trim(),
      categoryId: category.id,
      categoryLabel: category.label || category.id,
      required: category.required !== false
    }))
  ).filter((item) => item.hangul);
}

function allEntries(data) {
  return [
    ...(data.words || []),
    ...(data.newcomerVocab || []),
    ...(data.extendedVocab || []),
    ...(data.expressions || []),
    ...(data.patterns || [])
  ];
}

function idsFromCourse(course) {
  const ids = new Set();
  for (const chapter of course.chapters || []) {
    for (const id of [
      ...(chapter.coreVocabularyIds || []),
      ...(chapter.linkedEntryIds || []),
      ...(chapter.patternIds || [])
    ]) ids.add(id);
  }
  return ids;
}

function idsFromPacks(packs) {
  const ids = new Set();
  for (const pack of packs || []) {
    for (const item of pack.items || []) {
      if (item.entryId) ids.add(item.entryId);
      for (const relatedId of item.relatedEntryIds || []) ids.add(relatedId);
    }
  }
  return ids;
}

function byHangul(entries) {
  const map = new Map();
  for (const entry of entries) {
    const key = entry.hangul || entry.pattern || entry.ko;
    if (!key) continue;
    if (!map.has(key)) map.set(key, []);
    map.get(key).push(entry);
  }
  return map;
}

function distribution(entries) {
  const out = {};
  for (const entry of entries) {
    const key = entry.partOfSpeech || entry.type || 'unknown';
    out[key] = (out[key] || 0) + 1;
  }
  return out;
}

function pct(n, d) {
  return d ? Number((n / d).toFixed(4)) : 0;
}

const options = parseArgs(process.argv.slice(2));
const checklist = readJson(new URL('./a1-checklist.json', import.meta.url));
const appData = readJson(new URL('app-data.json', dataDir));
const verbLevels = readJson(new URL('./verb-levels.json', import.meta.url));

const requiredC0PackIds = [
  'pack-numbers',
  'pack-family',
  'pack-body',
  'pack-time',
  'pack-people-places',
  'pack-home-things',
  'pack-food-basic',
  'pack-colors'
];
const requiredC9SurvivalPackIds = [
  'pack-survival-basics',
  'pack-survival-help'
];
const requiredVocabPackIds = [...requiredC0PackIds, ...requiredC9SurvivalPackIds];

const checklistRows = flattenChecklist(checklist);
const entries = allEntries(appData);
const entryByHangul = byHangul(entries);
const courseReachable = idsFromCourse(appData.course || {});
const packReachable = idsFromPacks(appData.vocabPacks || []);
const reachable = new Set([...courseReachable, ...packReachable]);
const a1Entries = entries.filter((entry) => entry.level === 'A1');
const vocabPackIds = new Set((appData.vocabPacks || []).map((pack) => pack.id));

const rows = checklistRows.map((item) => {
  const matches = entryByHangul.get(item.hangul) || [];
  const a1Matches = matches.filter((entry) => entry.level === 'A1');
  const reachableMatches = matches.filter((entry) => reachable.has(entry.id));
  return {
    ...item,
    matchIds: matches.map((entry) => entry.id),
    levels: [...new Set(matches.map((entry) => entry.level || 'missing'))],
    a1: a1Matches.length > 0,
    reachable: reachableMatches.length > 0,
    reachableIds: reachableMatches.map((entry) => entry.id)
  };
});

const total = rows.length;
const a1Count = rows.filter((row) => row.a1).length;
const requiredRows = rows.filter((row) => row.required);
const reachableRequiredCount = requiredRows.filter((row) => row.reachable).length;
const report = {
  ok: false,
  generatedAt: new Date().toISOString(),
  thresholds: {
    minimumA1Coverage: checklist.minimumA1Coverage ?? 0.95,
    requiredReachability: 1
  },
  summary: {
    checklistItems: total,
    a1Tagged: a1Count,
    a1Coverage: pct(a1Count, total),
    requiredItems: requiredRows.length,
    requiredReachable: reachableRequiredCount,
    requiredReachability: pct(reachableRequiredCount, requiredRows.length),
    vocabPacks: (appData.vocabPacks || []).length,
    minimumVocabPacks: requiredVocabPackIds.length,
    requiredVocabPacks: requiredVocabPackIds,
    verbLevelReview: {
      a1Core: (verbLevels.a1Core || []).length,
      b1Candidates: (verbLevels.b1Candidates || []).length,
      defaultLevel: verbLevels.defaultLevel || null
    },
    a1PosDistribution: distribution(a1Entries)
  },
  missingEntries: rows.filter((row) => row.matchIds.length === 0),
  notA1: rows.filter((row) => row.matchIds.length > 0 && !row.a1),
  unreachableRequired: requiredRows.filter((row) => !row.reachable),
  missingRequiredVocabPacks: requiredVocabPackIds.filter((id) => !vocabPackIds.has(id)),
  categories: Object.values(rows.reduce((acc, row) => {
    acc[row.categoryId] ||= { id: row.categoryId, label: row.categoryLabel, total: 0, a1Tagged: 0, reachable: 0 };
    acc[row.categoryId].total += 1;
    if (row.a1) acc[row.categoryId].a1Tagged += 1;
    if (row.reachable) acc[row.categoryId].reachable += 1;
    return acc;
  }, {}))
};

report.ok =
  report.summary.a1Coverage >= report.thresholds.minimumA1Coverage &&
  report.summary.requiredReachability === 1 &&
  report.summary.vocabPacks >= report.summary.minimumVocabPacks &&
  report.missingRequiredVocabPacks.length === 0 &&
  report.missingEntries.length === 0;

if (options.out) writeFileSync(options.out, `${JSON.stringify(report, null, 2)}\n`, 'utf8');

if (options.json) {
  console.log(JSON.stringify(report, null, 2));
} else {
  console.log(`A1 audit: ${report.ok ? 'PASS' : 'FAIL'}`);
  console.log(`coverage=${report.summary.a1Coverage} reachable=${report.summary.requiredReachability} packs=${report.summary.vocabPacks}`);
  if (report.missingEntries.length) console.log(`missing=${report.missingEntries.map((row) => row.hangul).join(', ')}`);
  if (report.missingRequiredVocabPacks.length) console.log(`missingPacks=${report.missingRequiredVocabPacks.join(', ')}`);
  if (report.notA1.length) console.log(`notA1=${report.notA1.slice(0, 20).map((row) => `${row.hangul}:${row.levels.join('/')}`).join(', ')}`);
  if (report.unreachableRequired.length) console.log(`unreachable=${report.unreachableRequired.slice(0, 20).map((row) => row.hangul).join(', ')}`);
}

process.exit(report.ok ? 0 : 1);
