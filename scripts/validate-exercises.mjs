import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const DEFAULT_RICH_DIR = new URL('./rich-chapters/', import.meta.url);
const ALLOWED_TYPES = new Set([
  'multipleChoice',
  'fillBlank',
  'errorCorrect',
  'translate',
  'particleChoice',
  'conjugate',
  'orderWords',
]);
const OPTION_REQUIRED = new Set(['multipleChoice', 'particleChoice']);

function normalize(value) {
  return String(value || '').toLowerCase().replace(/[^0-9a-z가-힣ᄀ-ᇿ㄰-㆏]/g, '');
}

function clean(value) {
  return String(value || '').trim();
}

function chapterNumber(chapter, file) {
  const fromId = String(chapter.id || file).match(/chapter-(\d+)/);
  return fromId ? Number(fromId[1]) : 999;
}

function addCount(map, key) {
  map[key] = (map[key] || 0) + 1;
}

function validateOptions(exercise, label, errors) {
  const options = exercise.options;
  if (!Array.isArray(options)) {
    if (OPTION_REQUIRED.has(exercise.type)) errors.push(`${label}: ${exercise.type} needs options[]`);
    return;
  }
  if (OPTION_REQUIRED.has(exercise.type) && options.length < 2) {
    errors.push(`${label}: ${exercise.type} needs at least 2 options`);
  }
  const cleaned = options.map(clean);
  const seen = new Set();
  for (const option of cleaned) {
    if (!option) errors.push(`${label}: options include an empty value`);
    if (seen.has(option)) errors.push(`${label}: duplicate option "${option}"`);
    seen.add(option);
  }
  const correct = clean(exercise.correct);
  if (correct && !cleaned.includes(correct)) {
    errors.push(`${label}: correct "${correct}" is not in options`);
  }
}

function validateExercise(exercise, label, errors) {
  if (!exercise || typeof exercise !== 'object') {
    errors.push(`${label}: exercise must be an object`);
    return;
  }
  if (Object.prototype.hasOwnProperty.call(exercise, 'answer')) {
    errors.push(`${label}: use correct, not answer`);
  }
  if (!ALLOWED_TYPES.has(exercise.type)) {
    errors.push(`${label}: unknown type "${exercise.type || ''}"`);
  }
  if (!clean(exercise.prompt)) errors.push(`${label}: missing prompt`);
  if (!clean(exercise.correct)) errors.push(`${label}: missing correct`);
  if (!clean(exercise.explanation)) errors.push(`${label}: missing explanation`);
  validateOptions(exercise, label, errors);

  if (exercise.type === 'conjugate') {
    if (!clean(exercise.base)) errors.push(`${label}: conjugate needs base`);
    if (!clean(exercise.form)) errors.push(`${label}: conjugate needs form`);
  }
  if (exercise.type === 'orderWords') {
    if (!Array.isArray(exercise.tokens) || exercise.tokens.filter(clean).length < 2) {
      errors.push(`${label}: orderWords needs at least 2 tokens`);
    } else {
      const joined = exercise.tokens.map(clean).filter(Boolean).join(' ');
      if (normalize(joined) !== normalize(exercise.correct)) {
        errors.push(`${label}: orderWords tokens do not assemble to correct`);
      }
    }
  }
}

export function validateExercises({
  richDir = DEFAULT_RICH_DIR,
  minPerChapter = 10,
  enforceMinPerChapter = true,
} = {}) {
  const errors = [];
  const warnings = [];
  const rows = [];
  const totals = {};
  if (!existsSync(richDir)) {
    return {
      ok: false,
      errors: [`missing rich chapter directory: ${fileURLToPath(richDir)}`],
      warnings,
      rows,
      totals,
    };
  }

  const files = readdirSync(richDir)
    .filter((file) => file.endsWith('.json'))
    .sort((a, b) => a.localeCompare(b));
  for (const file of files) {
    const full = new URL(file, richDir);
    let chapter;
    try {
      chapter = JSON.parse(readFileSync(full, 'utf8'));
    } catch (error) {
      errors.push(`${file}: invalid JSON (${error.message})`);
      continue;
    }
    const id = chapter.id || file.replace(/\.json$/, '');
    const exercises = chapter.inlineExercises;
    if (!Array.isArray(exercises)) {
      errors.push(`${id}: missing inlineExercises[]`);
      continue;
    }
    if (enforceMinPerChapter && exercises.length < minPerChapter) {
      errors.push(`${id}: has ${exercises.length} exercises, needs at least ${minPerChapter}`);
    }
    const typeCounts = {};
    exercises.forEach((exercise, index) => {
      addCount(typeCounts, exercise?.type || 'missing');
      addCount(totals, exercise?.type || 'missing');
      validateExercise(exercise, `${id} #${index + 1}`, errors);
    });
    rows.push({
      id,
      number: chapter.number || chapterNumber(chapter, file),
      count: exercises.length,
      types: typeCounts,
    });
  }
  rows.sort((a, b) => a.number - b.number || a.id.localeCompare(b.id));
  return { ok: errors.length === 0, errors, warnings, rows, totals };
}

export function formatExerciseReport(result) {
  const typeNames = [...ALLOWED_TYPES];
  const lines = [];
  lines.push('Exercise distribution by chapter');
  lines.push(['chapter', 'count', ...typeNames].join('\t'));
  for (const row of result.rows) {
    lines.push([row.id, row.count, ...typeNames.map((type) => row.types[type] || 0)].join('\t'));
  }
  lines.push('');
  lines.push(`Totals: ${JSON.stringify(result.totals)}`);
  if (result.errors.length) {
    lines.push('');
    lines.push('Errors:');
    for (const error of result.errors) lines.push(`- ${error}`);
  }
  return lines.join('\n');
}

function cliOptions(argv) {
  const options = { enforceMinPerChapter: true, minPerChapter: 10, json: false };
  for (const arg of argv) {
    if (arg === '--no-min') options.enforceMinPerChapter = false;
    else if (arg === '--json') options.json = true;
    else if (arg.startsWith('--min-per-chapter=')) {
      options.minPerChapter = Number(arg.slice('--min-per-chapter='.length));
    }
  }
  return options;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const options = cliOptions(process.argv.slice(2));
  const result = validateExercises(options);
  if (options.json) console.log(JSON.stringify(result, null, 2));
  else console.log(formatExerciseReport(result));
  if (!result.ok) process.exit(1);
}
