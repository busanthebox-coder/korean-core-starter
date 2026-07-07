import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

export const DATA_SECTIONS = {
  words: { file: 'words.json', idPrefix: 'word-extra-', sortBase: 10000 },
  expressions: { file: 'expressions.json', idPrefix: 'expr-', sortBase: 1000 },
  patterns: { file: 'patterns.json', idPrefix: 'pattern-', sortBase: 2000 },
  newcomerVocab: { file: 'newcomer-vocab.json', idPrefix: 'word-newcomer-', sortBase: 500 },
  extendedVocab: { file: 'vocab-extended.json', idPrefix: 'word-ext-', sortBase: 700 }
};

export const KEY_STRATEGY = [
  'hangul/pattern',
  'partOfSpeech/type',
  'english',
  'first usage phrase',
  'first example',
  'nuance hash'
].join(' + ');

export const repoRoot = new URL('../../', import.meta.url);
export const idManifestUrl = new URL('../id-manifest.json', import.meta.url);
export const dataManifestUrl = new URL('../data-manifest.json', import.meta.url);

export const toPath = (value) => value instanceof URL ? fileURLToPath(value) : value;
export const readJson = (file) => JSON.parse(readFileSync(file, 'utf8'));
export const writeJson = (file, value) => {
  mkdirSync(dirname(toPath(file)), { recursive: true });
  writeFileSync(file, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
};

const normalizeSpace = (value = '') => String(value).replace(/\s+/g, ' ').trim();
const hashText = (value = '') => createHash('sha1').update(normalizeSpace(value)).digest('hex').slice(0, 12);

function phraseText(phrase, field) {
  if (!phrase) return '';
  if (Array.isArray(phrase)) return phrase[field === 'ko' ? 0 : field === 'en' ? 1 : 2] || '';
  return phrase[field] || '';
}

export function entryHeadword(entry) {
  return normalizeSpace(entry.hangul || entry.pattern || entry.ko || entry.title || entry.id);
}

export function entryKind(entry) {
  return normalizeSpace(entry.partOfSpeech || entry.kind || entry.type || '');
}

export function entryManifestKey(entry) {
  const usage = entry.usagePhrases || entry.usage || [];
  const examples = entry.examples || [];
  return [
    entryHeadword(entry),
    entryKind(entry),
    normalizeSpace(entry.english || ''),
    hashText(`${phraseText(usage[0], 'ko')}|${phraseText(usage[0], 'en')}`),
    hashText(`${phraseText(examples[0], 'ko')}|${phraseText(examples[0], 'en')}`),
    hashText(entry.nuance || entry.patternInfo?.formNote || '')
  ].join('|');
}

export function entryManifestKeys(entries) {
  const seen = new Map();
  return entries.map((entry) => {
    const key = entryManifestKey(entry);
    const count = (seen.get(key) || 0) + 1;
    seen.set(key, count);
    return count === 1 ? key : `${key}|duplicate:${count}`;
  });
}

export function entryDisplayKey(entry) {
  return [entryHeadword(entry), entryKind(entry)].join('|');
}

export function readSection(dataDir, section) {
  const config = DATA_SECTIONS[section];
  if (!config) throw new Error(`Unknown data section: ${section}`);
  const data = readJson(resolve(toPath(dataDir), config.file));
  return Array.isArray(data.entries) ? data.entries : [];
}

export function readAllSections(dataDir) {
  return Object.fromEntries(
    Object.keys(DATA_SECTIONS).map((section) => [section, readSection(dataDir, section)])
  );
}

export function buildIdManifest(dataDir) {
  const sections = {};
  const errors = [];
  for (const section of Object.keys(DATA_SECTIONS)) {
    const seen = new Map();
    sections[section] = {};
    const entries = readSection(dataDir, section);
    const keys = entryManifestKeys(entries);
    for (let index = 0; index < entries.length; index += 1) {
      const entry = entries[index];
      const key = keys[index];
      if (seen.has(key)) {
        errors.push(`${section}: duplicate manifest key for ${entry.id} and ${seen.get(key)}: ${key}`);
        continue;
      }
      seen.set(key, entry.id);
      sections[section][key] = {
        id: entry.id,
        sort: entry.sort,
        headword: entryHeadword(entry),
        kind: entryKind(entry),
        english: normalizeSpace(entry.english || '')
      };
    }
  }
  if (errors.length) throw new Error(errors.join('\n'));
  return { version: 1, keyStrategy: KEY_STRATEGY, sections };
}

export function loadIdManifest() {
  if (!existsSync(idManifestUrl)) return { version: 1, keyStrategy: KEY_STRATEGY, sections: {} };
  return readJson(idManifestUrl);
}

export function writeIdManifest(manifest) {
  writeJson(idManifestUrl, manifest);
}

function nextNumericId(prefix, usedIds) {
  let max = 0;
  const re = new RegExp(`^${prefix.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(\\d+)$`);
  for (const id of usedIds) {
    const match = re.exec(id);
    if (match) max = Math.max(max, Number(match[1]));
  }
  return `${prefix}${String(max + 1).padStart(3, '0')}`;
}

export function applyStableIds(section, entries, manifest) {
  const config = DATA_SECTIONS[section];
  if (!config) throw new Error(`Unknown data section: ${section}`);
  manifest.sections ||= {};
  manifest.sections[section] ||= {};
  const sectionManifest = manifest.sections[section];
  const usedIds = new Set(Object.values(sectionManifest).map((record) => record.id));
  const usedSorts = new Set(Object.values(sectionManifest).map((record) => record.sort).filter(Number.isFinite));
  const consumedKeys = new Set();
  const batchKeys = new Set(entries.map(entryManifestKey));
  let changed = false;

  for (const entry of entries) {
    const key = entryManifestKey(entry);
    let manifestKey = key;
    let record = sectionManifest[manifestKey];
    if (record && consumedKeys.has(record.id)) {
      record = null;
      let duplicateIndex = 2;
      while (sectionManifest[`${key}|duplicate:${duplicateIndex}`] && consumedKeys.has(sectionManifest[`${key}|duplicate:${duplicateIndex}`].id)) {
        duplicateIndex += 1;
      }
      manifestKey = `${key}|duplicate:${duplicateIndex}`;
      record = sectionManifest[manifestKey];
    }
    if (!record) {
      const candidates = matchingManifestRecords(sectionManifest, batchKeys, consumedKeys, entry, true);
      const looseCandidates = candidates.length ? candidates : matchingManifestRecords(sectionManifest, batchKeys, consumedKeys, entry, false);
      if (looseCandidates.length === 1) {
        record = looseCandidates[0][1];
        sectionManifest[manifestKey] = record;
        changed = true;
      }
    }
    if (!record) {
      let id = nextNumericId(config.idPrefix, usedIds);
      while (usedIds.has(id)) id = nextNumericId(config.idPrefix, new Set([...usedIds, id]));
      let sort = Math.max(config.sortBase, ...usedSorts) + 1;
      while (usedSorts.has(sort)) sort += 1;
      record = {
        id,
        sort,
        headword: entryHeadword(entry),
        kind: entryKind(entry),
        english: normalizeSpace(entry.english || '')
      };
      sectionManifest[manifestKey] = record;
      usedIds.add(id);
      usedSorts.add(sort);
      changed = true;
    }
    entry.id = record.id;
    entry.sort = record.sort;
    consumedKeys.add(record.id);
  }

  return { changed };
}

function matchingManifestRecords(sectionManifest, batchKeys, consumedKeys, entry, includeEnglish) {
  const headword = entryHeadword(entry);
  const kind = entryKind(entry);
  const english = normalizeSpace(entry.english || '');
  return Object.entries(sectionManifest).filter(([candidateKey, candidate]) =>
    !batchKeys.has(candidateKey.replace(/\|duplicate:\d+$/, '')) &&
    !consumedKeys.has(candidate.id) &&
    candidate.headword === headword &&
    candidate.kind === kind &&
    (!includeEnglish || candidate.english === english)
  );
}

export function defaultDataDir() {
  return fileURLToPath(new URL('korean/data/', repoRoot));
}

export function manifestPaths() {
  return {
    idManifest: fileURLToPath(idManifestUrl),
    dataManifest: fileURLToPath(dataManifestUrl)
  };
}
