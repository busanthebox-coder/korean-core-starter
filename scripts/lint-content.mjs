#!/usr/bin/env node
import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { validateExercises } from './validate-exercises.mjs';
import { validateConversations } from './validate-conversations.mjs';
import { validateCurriculumPath } from './validate-curriculum-path.mjs';
import { defaultDataDir, verifyDataDir } from './lib/integrity.mjs';

const REPO_ROOT = process.cwd();
const DEFAULT_APP_DATA = resolve(REPO_ROOT, 'korean/data/app-data.json');
const DEFAULT_RICH_DIR = resolve(REPO_ROOT, 'scripts/rich-chapters');
const ENTRY_SECTIONS = ['words', 'newcomerVocab', 'extendedVocab', 'expressions', 'patterns'];
const LEVELS = new Set(['A1', 'A2', 'B1', 'B2', 'C1']);

function readJson(pathOrUrl) {
  return JSON.parse(readFileSync(pathOrUrl, 'utf8'));
}

function clean(value) {
  return String(value || '').trim();
}

function toDirUrl(value) {
  if (value instanceof URL) return value;
  const path = resolve(value);
  return pathToFileURL(path.endsWith('/') ? path : `${path}/`);
}

function addLinkedErrors(ids, knownIds, label, errors) {
  for (const id of ids || []) {
    if (!clean(id)) errors.push(`${label}: blank linked id`);
    else if (!knownIds.has(id)) errors.push(`${label}: missing linked id ${id}`);
  }
}

function validChapterLevel(level) {
  return clean(level).split('/').every((part) => LEVELS.has(part));
}

function entryRows(data, errors) {
  const rows = [];
  for (const section of ENTRY_SECTIONS) {
    const entries = data?.[section];
    if (!Array.isArray(entries)) {
      errors.push(`${section}: must be an array`);
      continue;
    }
    for (const entry of entries) rows.push({ section, entry });
  }
  return rows;
}

function validateExampleFields(section, entry, errors) {
  const examples = entry.examples || [];
  if (!Array.isArray(examples)) return;
  examples.forEach((example, index) => {
    const label = `${section}:${entry.id || entry.hangul || `entry #${index + 1}`} example #${index + 1}`;
    if (!example || typeof example !== 'object' || Array.isArray(example)) {
      errors.push(`${label} must be an object`);
      return;
    }
    for (const key of ['ko', 'romanization', 'en']) {
      if (!clean(example[key])) errors.push(`${label} missing ${key}`);
    }
  });
}

function guideUnits(guide) {
  return (guide?.tracks || []).flatMap((track) => track.units || []);
}

// Clusters are the "which one do I use" layer. A member pointing at a dead entry, or a
// word spread across so many clusters that no comparison is memorable, both make the
// feature worse than absent — so they fail the build rather than ship quietly.
function lintExpressionClusters(clusters, linkableEntryIds, errors, warnings) {
  const clusterCountByEntry = new Map();
  const seenIds = new Set();
  for (const cluster of clusters || []) {
    const label = `cluster:${cluster.id || 'unknown'}`;
    if (seenIds.has(cluster.id)) errors.push(`${label}: duplicate cluster id`);
    seenIds.add(cluster.id);
    if (!clean(cluster.rule)) errors.push(`${label}: missing rule`);
    if (!clean(cluster.title)) errors.push(`${label}: missing title`);
    const members = cluster.members || [];
    if (members.length < 2) errors.push(`${label}: needs at least 2 members to compare`);
    const seenHangul = new Set();
    for (const member of members) {
      addLinkedErrors([member.entryId], linkableEntryIds, `${label}.members`, errors);
      if (!clean(member.hangul)) errors.push(`${label}: member with blank hangul`);
      if (seenHangul.has(member.hangul)) errors.push(`${label}: "${member.hangul}" listed twice`);
      seenHangul.add(member.hangul);
      if (!clean(member.when)) errors.push(`${label}: "${member.hangul}" has no "when"`);
      if (!clean(member.hint)) errors.push(`${label}: "${member.hangul}" has no hint`);
      if (!clean(member.example?.ko)) errors.push(`${label}: "${member.hangul}" has no Korean example`);
      else if (!clean(member.example?.en)) errors.push(`${label}: "${member.hangul}" example has no translation`);
      if (member.entryId) clusterCountByEntry.set(member.entryId, (clusterCountByEntry.get(member.entryId) || 0) + 1);
    }
  }
  for (const [entryId, count] of clusterCountByEntry) {
    if (count > 2) errors.push(`cluster: entry ${entryId} belongs to ${count} clusters (max 2)`);
  }
}

export function lintContentData(data) {
  const errors = [];
  const warnings = [];
  const rows = entryRows(data, errors);
  const primaryEntryIds = new Set();
  const linkableEntryIds = new Set();
  const grammarIds = new Set([
    ...((data?.grammar?.grammarItems || []).map((item) => item.id)),
    ...((data?.grammar?.endingItems || []).map((item) => item.id)),
  ].filter(Boolean));

  for (const { section, entry } of rows) {
    const label = `${section}:${entry?.id || entry?.hangul || 'entry'}`;
    if (!clean(entry?.id)) errors.push(`${label}: missing id`);
    else if (primaryEntryIds.has(entry.id)) errors.push(`${label}: duplicate id ${entry.id}`);
    else primaryEntryIds.add(entry.id);
    if (clean(entry?.id)) linkableEntryIds.add(entry.id);
    for (const aliasId of entry?.aliasIds || []) {
      if (clean(aliasId)) linkableEntryIds.add(aliasId);
    }
    if (!LEVELS.has(entry?.level)) errors.push(`${label}: invalid level ${entry?.level || ''}`);
    validateExampleFields(section, entry, errors);
  }

  for (const chapter of data?.course?.chapters || []) {
    const label = `chapter:${chapter.id || chapter.number || 'unknown'}`;
    if (chapter.level && !validChapterLevel(chapter.level)) errors.push(`${label}: invalid level ${chapter.level}`);
    addLinkedErrors(chapter.linkedEntryIds, linkableEntryIds, `${label}.linkedEntryIds`, errors);
    addLinkedErrors(chapter.coreVocabularyIds, linkableEntryIds, `${label}.coreVocabularyIds`, errors);
    addLinkedErrors(chapter.patternIds, linkableEntryIds, `${label}.patternIds`, errors);
    addLinkedErrors(chapter.grammarFocus, grammarIds, `${label}.grammarFocus`, errors);
  }

  for (const pack of data?.vocabPacks || []) {
    for (const item of pack.items || []) {
      const label = `vocabPack:${pack.id || 'unknown'}`;
      addLinkedErrors([item.entryId], linkableEntryIds, `${label}.items`, errors);
      addLinkedErrors(item.relatedEntryIds, linkableEntryIds, `${label}.relatedEntryIds`, errors);
    }
  }

  for (const unit of guideUnits(data?.guide)) {
    addLinkedErrors(unit.linkedEntryIds, linkableEntryIds, `guide:${unit.id || 'unknown'}.linkedEntryIds`, errors);
  }

  validateConversations(data?.conversations, errors);
  lintExpressionClusters(data?.expressionClusters, linkableEntryIds, errors, warnings);
  for (const error of validateCurriculumPath(data?.course).errors) errors.push(`curriculum: ${error}`);

  return {
    ok: errors.length === 0,
    errors,
    warnings,
    summary: {
      entries: rows.length,
      chapters: data?.course?.chapters?.length || 0,
      guideUnits: guideUnits(data?.guide).length,
      expressionClusters: (data?.expressionClusters || []).length,
    },
  };
}

function appendExternalResult(result, label, external) {
  if (!external.ok) {
    for (const error of external.errors || []) result.errors.push(`${label}: ${error}`);
  }
  return result;
}

function runA1Audit() {
  const result = spawnSync(process.execPath, ['scripts/level-audit/audit-a1.mjs', '--json'], {
    cwd: REPO_ROOT,
    encoding: 'utf8',
  });
  if (result.status !== 0) {
    return { ok: false, errors: [`A1 audit failed: ${clean(result.stderr) || clean(result.stdout) || `exit ${result.status}`}`] };
  }
  const report = JSON.parse(result.stdout);
  if (!report.ok) {
    return {
      ok: false,
      errors: [`A1 checklist coverage ${report.summary?.a1Coverage ?? 'unknown'} below ${report.thresholds?.minimumA1Coverage ?? 'threshold'}`],
    };
  }
  return { ok: true, errors: [], summary: report.summary };
}

export function runContentLint({
  appData,
  appDataPath = DEFAULT_APP_DATA,
  dataDir,
  richDir = DEFAULT_RICH_DIR,
  runA1Audit: shouldRunA1Audit = true,
  runIntegrity = true,
} = {}) {
  const data = appData || readJson(appDataPath);
  const result = lintContentData(data);
  const exercises = validateExercises({ richDir: toDirUrl(richDir) });
  appendExternalResult(result, 'inlineExercises', exercises);
  result.summary.inlineExerciseChapters = exercises.rows.length;

  if (runIntegrity) {
    const integrity = verifyDataDir(dataDir || defaultDataDir());
    appendExternalResult(result, 'data integrity', integrity);
    result.summary.dataIntegrity = integrity.ok ? 'PASS' : 'FAIL';
  }

  if (shouldRunA1Audit) {
    const a1 = runA1Audit();
    appendExternalResult(result, 'A1 audit', a1);
    result.summary.a1Coverage = a1.summary?.a1Coverage;
  }

  result.ok = result.errors.length === 0;
  return result;
}

export function formatContentLintReport(result) {
  const lines = [
    result.ok ? 'Content lint passed.' : 'Content lint failed.',
    `Summary: ${JSON.stringify(result.summary)}`,
  ];
  if (result.warnings?.length) {
    lines.push('');
    lines.push('Warnings:');
    for (const warning of result.warnings) lines.push(`- ${warning}`);
  }
  if (result.errors?.length) {
    lines.push('');
    lines.push('Errors:');
    for (const error of result.errors) lines.push(`- ${error}`);
  }
  return lines.join('\n');
}

function parseArgs(argv) {
  const options = { runA1Audit: true, runIntegrity: true };
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === '--app-data') options.appDataPath = resolve(argv[++index]);
    else if (arg === '--data-dir') options.dataDir = resolve(argv[++index]);
    else if (arg === '--rich-dir') options.richDir = resolve(argv[++index]);
    else if (arg === '--skip-a1-audit') options.runA1Audit = false;
    else if (arg === '--skip-integrity') options.runIntegrity = false;
    else throw new Error(`Unknown argument: ${arg}`);
  }
  return options;
}

function isMain() {
  try {
    return process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1]);
  } catch {
    return false;
  }
}

if (isMain()) {
  try {
    const result = runContentLint(parseArgs(process.argv.slice(2)));
    console.log(formatContentLintReport(result));
    process.exit(result.ok ? 0 : 1);
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
}
