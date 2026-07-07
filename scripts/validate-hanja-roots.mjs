import { existsSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const DEFAULT_SRC = 'scripts/hanja-src/roots.json';
const DEFAULT_DATA_DIR = 'korean/data';
const EXPECTED_ROOTS = 40;
const MIN_MEMBERS = 3;
const LEVELS = new Set(['A1', 'A2', 'B1', 'B2']);
const REVIEW_STATUS = 'manual-reviewed';
const REQUIRED_REVIEW_CHECKS = ['existing-entry', 'same-hanja-family', 'everyday-use', 'homophone-separated'];

function clean(value) {
  return String(value || '').trim();
}

function readJson(path) {
  return JSON.parse(readFileSync(path, 'utf8'));
}

export function readHanjaRoots(src = DEFAULT_SRC) {
  if (!existsSync(src)) return [];
  const roots = readJson(src);
  return Array.isArray(roots) ? roots : [];
}

export function readGeneratedEntries(dataDir = DEFAULT_DATA_DIR) {
  const files = [
    'words.json',
    'newcomer-vocab.json',
    'vocab-extended.json',
    'expressions.json',
    'patterns.json',
  ];
  return files.flatMap((file) => {
    const data = readJson(`${dataDir}/${file}`);
    return Array.isArray(data.entries) ? data.entries : [];
  });
}

function noteHomophoneSplits(roots) {
  const byReading = new Map();
  for (const root of roots) {
    const reading = clean(root.reading);
    if (!reading) continue;
    if (!byReading.has(reading)) byReading.set(reading, []);
    byReading.get(reading).push(root.id || root.hanja || reading);
  }
  return [...byReading.entries()]
    .filter(([, ids]) => ids.length >= 2)
    .map(([reading, ids]) => ({ reading, ids }));
}

export function validateHanjaRoots(roots, entries, { expectedRoots = EXPECTED_ROOTS } = {}) {
  const errors = [];
  let rootReviewCount = 0;
  let memberReviewCount = 0;
  const entryById = new Map();
  for (const entry of entries || []) {
    if (entry?.id) entryById.set(entry.id, entry);
  }

  if (!Array.isArray(roots)) {
    return { ok: false, errors: ['hanja roots must be an array'], rootCount: 0, homophoneSplits: [] };
  }
  if (roots.length !== expectedRoots) {
    errors.push(`needs exactly ${expectedRoots} roots; found ${roots.length}`);
  }

  const rootIds = new Set();
  const rootKeys = new Set();
  for (const [index, root] of roots.entries()) {
    const label = clean(root?.id) || `root #${index + 1}`;
    if (!root || typeof root !== 'object') {
      errors.push(`${label}: must be an object`);
      continue;
    }

    const id = clean(root.id);
    const hanja = clean(root.hanja);
    const reading = clean(root.reading);
    if (!id) errors.push(`${label}: missing id`);
    else if (rootIds.has(id)) errors.push(`${label}: duplicate root id`);
    else rootIds.add(id);
    if (!hanja) errors.push(`${label}: missing hanja`);
    if (!reading) errors.push(`${label}: missing reading`);
    const rootKey = `${hanja}|${reading}`;
    if (hanja && reading && rootKeys.has(rootKey)) errors.push(`${label}: duplicate hanja+reading ${rootKey}`);
    rootKeys.add(rootKey);
    if (!clean(root.gloss)) errors.push(`${label}: missing gloss`);
    if (!clean(root.note)) errors.push(`${label}: missing note`);
    if (!LEVELS.has(root.level)) errors.push(`${label}: level must be A1/A2/B1/B2`);
    const review = root.review;
    if (!review || typeof review !== 'object' || Array.isArray(review)) {
      errors.push(`${label}: missing manual review metadata`);
    } else {
      const checks = Array.isArray(review.checks) ? review.checks.map(clean) : [];
      if (clean(review.status) !== REVIEW_STATUS) {
        errors.push(`${label}: review.status must be ${REVIEW_STATUS}`);
      }
      if (!clean(review.batch)) errors.push(`${label}: review.batch is required`);
      if (!clean(review.checkedAt)) errors.push(`${label}: review.checkedAt is required`);
      if (!clean(review.reviewer)) errors.push(`${label}: review.reviewer is required`);
      if (!clean(review.evidence)) errors.push(`${label}: review.evidence is required`);
      for (const requiredCheck of REQUIRED_REVIEW_CHECKS) {
        if (!checks.includes(requiredCheck)) {
          errors.push(`${label}: review.checks must include ${requiredCheck}`);
        }
      }
      if (
        clean(review.status) === REVIEW_STATUS &&
        clean(review.batch) &&
        clean(review.checkedAt) &&
        clean(review.reviewer) &&
        clean(review.evidence) &&
        REQUIRED_REVIEW_CHECKS.every((requiredCheck) => checks.includes(requiredCheck))
      ) {
        rootReviewCount += 1;
      }
    }
    if (!Array.isArray(root.members)) {
      errors.push(`${label}: members must be an array`);
      continue;
    }
    if (root.members.length < MIN_MEMBERS) {
      errors.push(`${label}: needs at least ${MIN_MEMBERS} members; found ${root.members.length}`);
    }

    const memberIds = new Set();
    for (const [memberIndex, member] of root.members.entries()) {
      const memberLabel = `${label} member #${memberIndex + 1}`;
      const entryId = clean(member?.entryId);
      const hangul = clean(member?.hangul);
      if (!entryId) {
        errors.push(`${memberLabel}: missing entryId`);
        continue;
      }
      if (memberIds.has(entryId)) errors.push(`${memberLabel}: duplicate entryId ${entryId}`);
      memberIds.add(entryId);
      const entry = entryById.get(entryId);
      if (!entry) {
        errors.push(`${memberLabel}: missing entryId ${entryId}`);
        continue;
      }
      if (!hangul) errors.push(`${memberLabel}: missing hangul`);
      else if (entry.hangul !== hangul) errors.push(`${memberLabel}: entryId ${entryId} is ${entry.hangul}, not ${hangul}`);
      if (!clean(member.breakdown)) errors.push(`${memberLabel}: missing breakdown`);
      if (member?.reviewed !== true) errors.push(`${memberLabel}: reviewed must be true`);
      else memberReviewCount += 1;
    }
  }

  const homophoneSplits = noteHomophoneSplits(roots);
  if (homophoneSplits.length < 2) {
    errors.push(`needs at least 2 homophone split readings; found ${homophoneSplits.length}`);
  }

  return {
    ok: errors.length === 0,
    errors,
    rootCount: roots.length,
    memberCount: roots.reduce((sum, root) => sum + (Array.isArray(root.members) ? root.members.length : 0), 0),
    rootReviewCount,
    memberReviewCount,
    homophoneSplits,
  };
}

export function formatHanjaRootReport(result) {
  const lines = [
    result.ok ? 'Hanja root validation passed.' : 'Hanja root validation failed.',
    `Roots: ${result.rootCount}`,
    `Members: ${result.memberCount || 0}`,
    `Manual review: ${result.rootReviewCount || 0}/${result.rootCount} roots; ${result.memberReviewCount || 0}/${result.memberCount || 0} members`,
    `Homophone splits: ${result.homophoneSplits.map((split) => `${split.reading}(${split.ids.join(', ')})`).join('; ') || 'none'}`,
  ];
  if (result.errors.length) {
    lines.push('');
    lines.push('Errors:');
    for (const error of result.errors) lines.push(`- ${error}`);
  }
  return lines.join('\n');
}

function parseArgs(argv) {
  const args = { src: DEFAULT_SRC, dataDir: DEFAULT_DATA_DIR, expectCount: EXPECTED_ROOTS };
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === '--src') args.src = argv[++index];
    else if (arg === '--data-dir') args.dataDir = argv[++index];
    else if (arg === '--expect-count') args.expectCount = Number(argv[++index]);
    else throw new Error(`Unknown argument: ${arg}`);
  }
  return args;
}

function isMain() {
  return process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1];
}

if (isMain()) {
  const args = parseArgs(process.argv.slice(2));
  const roots = readHanjaRoots(args.src);
  const entries = readGeneratedEntries(args.dataDir);
  const result = validateHanjaRoots(roots, entries, { expectedRoots: args.expectCount });
  console.log(formatHanjaRootReport(result));
  if (!result.ok) process.exit(1);
}
