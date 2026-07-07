#!/usr/bin/env node
import { mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
import {
  DATA_SECTIONS,
  compareDataDirs,
  defaultDataDir,
  entryDisplayKey,
  entryHeadword
} from './lib/integrity.mjs';

function parseArgs(argv) {
  const options = {
    outDir: '',
    report: 'docs/superpowers/specs/v2-upgrade/ws2-drift-report.md',
    keepOut: false
  };
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--out') options.outDir = resolve(argv[++i]);
    else if (arg === '--report') options.report = resolve(argv[++i]);
    else if (arg === '--keep-out') options.keepOut = true;
    else throw new Error(`Unknown argument: ${arg}`);
  }
  if (!options.outDir) options.outDir = join(tmpdir(), `kcs-drift-${Date.now()}`);
  return options;
}

function loadSeedHeadwords() {
  const dirs = ['vocab-src', 'expr-src', 'pattern-src', 'verb-src'];
  const map = new Map();
  for (const dir of dirs) {
    let files = [];
    try {
      files = readdirSync(new URL(`./${dir}/`, import.meta.url)).filter((file) => file.endsWith('.json')).sort();
    } catch {
      continue;
    }
    for (const file of files) {
      const items = JSON.parse(readFileSync(new URL(`./${dir}/${file}`, import.meta.url), 'utf8'));
      for (const item of Array.isArray(items) ? items : []) {
        const headword = item.hangul || item.pattern || item.ko || '';
        if (!headword) continue;
        if (!map.has(headword)) map.set(headword, []);
        map.get(headword).push(`${dir}/${file}`);
      }
    }
  }
  return map;
}

function classify(entry, seedHeadwords) {
  const headword = entryHeadword(entry);
  if (seedHeadwords.has(headword)) return 'seed-present/generated-filter-or-key-drift';
  return 'historical-manual-data-without-seed';
}

function tableRows(entries, seedHeadwords, limit = 240) {
  return entries.slice(0, limit).map((entry) => (
    `| ${entry.id || ''} | ${entryDisplayKey(entry)} | ${classify(entry, seedHeadwords)} |`
  ));
}

function loadJsonArray(file) {
  return JSON.parse(readFileSync(new URL(file, import.meta.url), 'utf8'));
}

function appendRecoveryTreatment(lines) {
  const recoveredVocab = loadJsonArray('./vocab-src/recovered-2026-07.json');
  const recoveredPatterns = loadJsonArray('./pattern-src/recovered-2026-07.json');
  const uniqueVocabHangul = new Set(recoveredVocab.map((entry) => entry.hangul));

  lines.push(
    '### Initial RED proof before recovery',
    '',
    '| Finding | Value |',
    '|---|---:|',
    '| Initial extendedVocab display-key loss | 185 |',
    `| Recovered extendedVocab seed rows | ${recoveredVocab.length} |`,
    `| Unique recovered extendedVocab Hangul forms | ${uniqueVocabHangul.size} |`,
    `| Recovered pattern seed rows | ${recoveredPatterns.length} |`,
    '',
    'The recovered row count is larger than the original display-key loss because manifest identity preserves homographs and multiple-sense rows separately.',
    '',
    '### Recovery classification and treatment',
    '',
    '| # | Section | Headword / pattern | Kind | English | Classified cause | Treatment |',
    '|---:|---|---|---|---|---|---|'
  );

  let row = 1;
  for (const entry of recoveredVocab) {
    lines.push(`| ${row} | extendedVocab | ${entry.hangul} | ${entry.kind || ''} | ${entry.english || ''} | historical-manual-data-without-seed | restored in \`scripts/vocab-src/recovered-2026-07.json\`; id/sort pinned by \`scripts/id-manifest.json\` |`);
    row += 1;
  }
  for (const entry of recoveredPatterns) {
    lines.push(`| ${row} | patterns | ${entry.hangul || entry.pattern || ''} | pattern | ${entry.english || ''} | historical-manual-data-without-seed | restored in \`scripts/pattern-src/recovered-2026-07.json\`; id/sort pinned by \`scripts/id-manifest.json\` |`);
    row += 1;
  }
  lines.push('');
}

function makeReport(comparison, seedHeadwords) {
  const lines = [
    '# WS2 Drift Report',
    '',
    `Generated at: ${new Date().toISOString()}`,
    '',
    '## Summary',
    '',
    '| Section | HEAD count | Generated count | HEAD-only | Generated-only | Existing id changes |',
    '|---|---:|---:|---:|---:|---:|'
  ];

  for (const [section, data] of Object.entries(comparison)) {
    lines.push(`| ${section} | ${data.expected} | ${data.actual} | ${data.missing.length} | ${data.added.length} | ${data.idChanges.length} |`);
  }

  lines.push('', '## Cause Classification', '');
  appendRecoveryTreatment(lines);
  for (const [section, data] of Object.entries(comparison)) {
    if (!data.missing.length && !data.added.length && !data.idChanges.length) continue;
    lines.push(`### ${section}`, '');
    if (data.missing.length) {
      lines.push('HEAD-only entries:', '', '| id | key | classified cause |', '|---|---|---|');
      lines.push(...tableRows(data.missing, seedHeadwords));
      if (data.missing.length > 240) lines.push(`| ... | ${data.missing.length - 240} more | ... |`);
      lines.push('');
    }
    if (data.added.length) {
      lines.push('Generated-only entries:', '', '| id | key | classified cause |', '|---|---|---|');
      lines.push(...tableRows(data.added, seedHeadwords));
      if (data.added.length > 240) lines.push(`| ... | ${data.added.length - 240} more | ... |`);
      lines.push('');
    }
    if (data.idChanges.length) {
      lines.push('Existing-key id changes:', '', '| key/headword | HEAD id | Generated id |', '|---|---|---|');
      for (const change of data.idChanges.slice(0, 240)) {
        lines.push(`| ${change.headword} | ${change.expected} | ${change.actual} |`);
      }
      if (data.idChanges.length > 240) lines.push(`| ... | ${data.idChanges.length - 240} more | ... |`);
      lines.push('');
    }
  }

  lines.push(
    '## Notes',
    '',
    '- `historical-manual-data-without-seed` means the committed generated JSON had a real entry that no current source seed could reproduce.',
    '- `seed-present/generated-filter-or-key-drift` means a same-headword seed exists, so the drift needs source/schema or key review.',
    '- Final WS2 completion requires HEAD-only entries 0 and existing id changes 0 after recovery seeds and id manifest are applied.'
  );
  return `${lines.join('\n')}\n`;
}

try {
  const options = parseArgs(process.argv.slice(2));
  mkdirSync(options.outDir, { recursive: true });
  const generated = spawnSync(
    process.execPath,
    ['scripts/generate-korean-data.mjs', '--out', options.outDir],
    { cwd: new URL('../', import.meta.url), encoding: 'utf8' }
  );
  if (generated.status !== 0) {
    console.error(generated.stdout);
    console.error(generated.stderr);
    process.exit(generated.status || 1);
  }

  const comparison = compareDataDirs(defaultDataDir(), options.outDir);
  const seedHeadwords = loadSeedHeadwords();
  writeFileSync(options.report, makeReport(comparison, seedHeadwords), 'utf8');

  for (const section of Object.keys(DATA_SECTIONS)) {
    const data = comparison[section];
    console.log(`${section}: head=${data.expected} generated=${data.actual} missing=${data.missing.length} added=${data.added.length} idChanges=${data.idChanges.length}`);
  }
  console.log(`Wrote ${options.report}`);
  if (!options.keepOut) rmSync(options.outDir, { recursive: true, force: true });
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
}
