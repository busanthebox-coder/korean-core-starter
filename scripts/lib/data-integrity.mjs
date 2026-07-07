import { createHash } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import {
  DATA_SECTIONS,
  dataManifestUrl,
  entryHeadword,
  entryManifestKey,
  entryManifestKeys,
  idManifestUrl,
  readJson,
  readSection,
  toPath,
  writeJson
} from './entry-manifest.mjs';

const SUPPORT_FILES = {
  grammar: { file: 'grammar.json' }
};

function hashJson(value) {
  return createHash('sha1').update(JSON.stringify(value)).digest('hex');
}

function readDataJson(dataDir, file) {
  return readJson(resolve(toPath(dataDir), file));
}

function bundlePathForDataDir(dataDir) {
  const localPath = resolve(toPath(dataDir), 'data-bundle.js');
  if (existsSync(localPath)) return localPath;
  return resolve(toPath(dataDir), '../data-bundle.js');
}

function readBundleData(file) {
  const text = readFileSync(file, 'utf8');
  const prefix = 'window.KOREAN_CORE_DATA = ';
  if (!text.startsWith(prefix)) throw new Error(`${file}: unexpected data-bundle format`);
  return JSON.parse(text.slice(prefix.length).replace(/;\s*$/, ''));
}

export function buildDataManifest(dataDir) {
  const sections = {};
  const supportFiles = {};
  for (const [section, config] of Object.entries(DATA_SECTIONS)) {
    const entries = readSection(dataDir, section);
    sections[section] = {
      file: config.file,
      count: entries.length,
      keys: entryManifestKeys(entries)
    };
  }
  for (const [name, config] of Object.entries(SUPPORT_FILES)) {
    const data = readDataJson(dataDir, config.file);
    supportFiles[name] = {
      file: config.file,
      hash: hashJson(data),
      grammarItems: Array.isArray(data.grammarItems) ? data.grammarItems.length : undefined,
      endingItems: Array.isArray(data.endingItems) ? data.endingItems.length : undefined
    };
  }
  return { version: 1, keyStrategy: 'entry keys + support file hashes', sections, supportFiles };
}

export function verifyDataDir(dataDir, options = {}) {
  const updateManifest = options.updateManifest === true;
  const errors = [];
  const warnings = [];
  const summary = {};

  if (updateManifest || !existsSync(dataManifestUrl)) {
    if (updateManifest) writeJson(dataManifestUrl, buildDataManifest(dataDir));
    return {
      ok: true,
      errors,
      warnings: existsSync(dataManifestUrl) ? warnings : ['data-manifest.json not found; count/headword guard skipped'],
      summary
    };
  }

  const dataManifest = readJson(dataManifestUrl);
  const idManifest = options.idManifest || (existsSync(idManifestUrl) ? readJson(idManifestUrl) : { sections: {} });
  verifyEntrySectionsWithOptions(dataDir, dataManifest, idManifest, errors, warnings, summary, options);
  if (options.skipSupportFiles !== true) verifySupportFiles(dataDir, dataManifest, errors, summary);
  if (options.skipDerivedArtifacts !== true) verifyDerivedArtifacts(dataDir, errors, summary);
  return { ok: errors.length === 0, errors, warnings, summary };
}

function verifyEntrySections(dataDir, dataManifest, idManifest, errors, warnings, summary) {
  return verifyEntrySectionsWithOptions(dataDir, dataManifest, idManifest, errors, warnings, summary, {});
}

function verifyEntrySectionsWithOptions(dataDir, dataManifest, idManifest, errors, warnings, summary, options = {}) {
  for (const [section, config] of Object.entries(DATA_SECTIONS)) {
    const entries = readSection(dataDir, section);
    const expected = dataManifest.sections?.[section];
    if (!expected) {
      errors.push(`${section}: missing from data-manifest.json`);
      continue;
    }
    summary[section] = { expected: expected.count, actual: entries.length };
    if (entries.length !== expected.count) {
      if (options.allowEntryAdditions === true && entries.length >= expected.count) {
        warnings.push(`${section}: ${entries.length - expected.count} intentional additions pending data-manifest update`);
      } else {
        errors.push(`${section}: expected ${expected.count} entries, got ${entries.length}`);
      }
    }
    verifyEntryIds(section, entries, idManifest, errors);
    verifyEntryKeys(section, entries, expected, errors, warnings);
    if (!existsSync(resolve(toPath(dataDir), config.file))) errors.push(`${section}: missing file ${config.file}`);
  }
}

function verifyEntryIds(section, entries, idManifest, errors) {
  const ids = new Set();
  const keys = new Set();
  const manifestKeys = entryManifestKeys(entries);
  for (let index = 0; index < entries.length; index += 1) {
    const entry = entries[index];
    if (ids.has(entry.id)) errors.push(`${section}: duplicate id ${entry.id}`);
    ids.add(entry.id);
    const key = manifestKeys[index];
    if (keys.has(key)) errors.push(`${section}: duplicate key ${key}`);
    keys.add(key);
    const idRecord = idManifest.sections?.[section]?.[key];
    if (!idRecord) {
      errors.push(`${section}: ${entry.id} (${entryHeadword(entry)}) missing from id-manifest.json`);
    } else if (idRecord.id !== entry.id) {
      errors.push(`${section}: ${entryHeadword(entry)} id changed ${idRecord.id} -> ${entry.id}`);
    } else if (Number.isFinite(idRecord.sort) && idRecord.sort !== entry.sort) {
      errors.push(`${section}: ${entryHeadword(entry)} sort changed ${idRecord.sort} -> ${entry.sort}`);
    }
  }
}

function verifyEntryKeys(section, entries, expected, errors, warnings) {
  const keys = new Set(entryManifestKeys(entries));
  const expectedKeys = new Set(expected.keys || []);
  const missing = [...expectedKeys].filter((key) => !keys.has(key));
  const added = [...keys].filter((key) => !expectedKeys.has(key));
  if (missing.length) errors.push(`${section}: missing ${missing.length} expected entries (${missing.slice(0, 5).join(', ')})`);
  if (added.length) warnings.push(`${section}: ${added.length} entries not in data-manifest.json; run verify-data-integrity.mjs --update-manifest after intentional content additions`);
}

function verifySupportFiles(dataDir, dataManifest, errors, summary) {
  for (const [name, config] of Object.entries(SUPPORT_FILES)) {
    const expected = dataManifest.supportFiles?.[name];
    if (!expected) {
      errors.push(`${name}: missing from data-manifest.json`);
      continue;
    }
    const filePath = resolve(toPath(dataDir), config.file);
    if (!existsSync(filePath)) {
      errors.push(`${name}: missing file ${config.file}`);
      continue;
    }
    const hash = hashJson(readJson(filePath));
    summary[name] = { expected: expected.hash, actual: hash };
    if (hash !== expected.hash) errors.push(`${name}: hash changed ${expected.hash} -> ${hash}`);
  }
}

function verifyDerivedArtifacts(dataDir, errors, summary) {
  const grammar = readDataJson(dataDir, 'grammar.json');
  const appDataPath = resolve(toPath(dataDir), 'app-data.json');
  const bundlePath = bundlePathForDataDir(dataDir);
  if (existsSync(appDataPath)) {
    const appData = readJson(appDataPath);
    summary.appDataGrammar = { synchronized: hashJson(appData.grammar) === hashJson(grammar) };
    if (!summary.appDataGrammar.synchronized) errors.push('app-data.json: grammar is out of sync with grammar.json');
  }
  if (existsSync(bundlePath)) {
    const bundle = readBundleData(bundlePath);
    summary.dataBundleGrammar = { synchronized: hashJson(bundle.grammar) === hashJson(grammar) };
    if (!summary.dataBundleGrammar.synchronized) errors.push('data-bundle.js: grammar is out of sync with grammar.json');
  }
}

export function compareDataDirs(expectedDir, actualDir) {
  const result = {};
  for (const section of Object.keys(DATA_SECTIONS)) {
    const expected = readSection(expectedDir, section);
    const actual = readSection(actualDir, section);
    const expectedByKey = new Map(expected.map((entry) => [entryManifestKey(entry), entry]));
    const actualByKey = new Map(actual.map((entry) => [entryManifestKey(entry), entry]));
    result[section] = {
      expected: expected.length,
      actual: actual.length,
      missing: [...expectedByKey.entries()].filter(([key]) => !actualByKey.has(key)).map(([, entry]) => entry),
      added: [...actualByKey.entries()].filter(([key]) => !expectedByKey.has(key)).map(([, entry]) => entry),
      idChanges: [...expectedByKey.entries()]
        .filter(([key, entry]) => actualByKey.has(key) && actualByKey.get(key).id !== entry.id)
        .map(([key, entry]) => ({ key, expected: entry.id, actual: actualByKey.get(key).id, headword: entryHeadword(entry) }))
    };
  }
  return result;
}
