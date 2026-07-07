import { existsSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const ROOT = new URL('../', import.meta.url);
const JSON_SOURCE = new URL('../src/lib/contrastItems.json', import.meta.url);
const LEVELS = new Set(['A1', 'A2', 'B1', 'B2']);
const EXPECTED_GROUPS = 30;
const ITEMS_PER_GROUP = 6;
const EXPECTED_ITEMS = EXPECTED_GROUPS * ITEMS_PER_GROUP;

function clean(value) {
  return String(value || '').trim();
}

function hasBlank(sentence) {
  return clean(sentence).split('__').length === 2;
}

function addCount(map, key) {
  map.set(key, (map.get(key) || 0) + 1);
}

function loadItems() {
  if (!existsSync(JSON_SOURCE)) return [];
  return JSON.parse(readFileSync(JSON_SOURCE, 'utf8'));
}

export function validateContrastItems(items) {
  const errors = [];
  const groups = new Map();
  const ids = new Set();

  if (!Array.isArray(items)) {
    return {
      ok: false,
      errors: ['contrast items must be an array'],
      groupCount: 0,
      itemCount: 0,
      byLevel: {},
    };
  }

  items.forEach((item, index) => {
    const label = item?.id || `item #${index + 1}`;
    if (!item || typeof item !== 'object') {
      errors.push(`${label}: must be an object`);
      return;
    }

    if (!clean(item.id)) errors.push(`${label}: missing id`);
    else if (ids.has(item.id)) errors.push(`${label}: duplicate id`);
    else ids.add(item.id);

    if (!clean(item.contrast)) errors.push(`${label}: missing contrast`);
    if (!LEVELS.has(item.level)) errors.push(`${label}: level must be one of A1/A2/B1/B2`);
    if (!clean(item.prompt)) errors.push(`${label}: missing prompt`);
    if (!hasBlank(item.sentence)) errors.push(`${label}: sentence must contain exactly one __ blank`);
    if (!clean(item.answer)) errors.push(`${label}: missing answer`);
    if (!clean(item.answerKey)) errors.push(`${label}: missing answerKey`);
    if (!clean(item.explanation) || clean(item.explanation).length < 45) {
      errors.push(`${label}: explanation must explain the contrast in detail`);
    }
    if (item.entryId != null && !/^pattern-\d+/.test(clean(item.entryId))) {
      errors.push(`${label}: entryId must be omitted or pattern-*`);
    }

    if (!Array.isArray(item.options) || item.options.length < 2 || item.options.length > 3) {
      errors.push(`${label}: options must contain 2-3 contrast choices`);
    } else {
      const cleanedOptions = item.options.map(clean);
      const unique = new Set(cleanedOptions);
      if (unique.size !== cleanedOptions.length) errors.push(`${label}: duplicate options`);
      if (cleanedOptions.some((option) => !option)) errors.push(`${label}: empty option`);
      if (!unique.has(clean(item.answer))) errors.push(`${label}: answer is not in options`);
    }

    if (clean(item.contrast)) {
      if (!groups.has(item.contrast)) {
        groups.set(item.contrast, { level: item.level, answerCounts: new Map(), count: 0 });
      }
      const group = groups.get(item.contrast);
      group.count += 1;
      if (group.level !== item.level) errors.push(`${label}: group level mismatch for ${item.contrast}`);
      addCount(group.answerCounts, clean(item.answerKey) || clean(item.answer));
    }
  });

  if (items.length !== EXPECTED_ITEMS) {
    errors.push(`needs exactly ${EXPECTED_ITEMS} contrast items; found ${items.length}`);
  }
  if (groups.size !== EXPECTED_GROUPS) {
    errors.push(`needs exactly ${EXPECTED_GROUPS} contrast groups; found ${groups.size}`);
  }

  const byLevel = {};
  for (const [contrast, group] of groups) {
    byLevel[group.level] = (byLevel[group.level] || 0) + 1;
    if (group.count !== ITEMS_PER_GROUP) {
      errors.push(`${contrast}: needs ${ITEMS_PER_GROUP} items; found ${group.count}`);
    }
    const counts = [...group.answerCounts.values()].sort((a, b) => a - b);
    if (counts.length < 2) {
      errors.push(`${contrast}: answers must be distributed across at least 2 choices`);
    } else if (counts[0] < 2 || counts[counts.length - 1] > 4) {
      errors.push(`${contrast}: answer distribution must stay between 2:4 and 4:2`);
    }
  }

  return {
    ok: errors.length === 0,
    errors,
    groupCount: groups.size,
    itemCount: items.length,
    byLevel,
  };
}

export function formatContrastReport(result) {
  const lines = [];
  lines.push('Pattern contrast validation');
  lines.push(`Source: ${fileURLToPath(JSON_SOURCE).replace(fileURLToPath(ROOT), '')}`);
  lines.push(`Groups: ${result.groupCount}`);
  lines.push(`Items: ${result.itemCount}`);
  lines.push(`Levels: ${JSON.stringify(result.byLevel)}`);
  if (result.errors.length) {
    lines.push('');
    lines.push('Errors:');
    for (const error of result.errors) lines.push(`- ${error}`);
  }
  return lines.join('\n');
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const items = loadItems();
  const result = validateContrastItems(items);
  console.log(formatContrastReport(result));
  if (!result.ok) process.exit(1);
}
