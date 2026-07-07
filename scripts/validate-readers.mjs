import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { resolve, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const LEVELS = ['A1', 'A2', 'B1', 'B2'];
const DEFAULT_SRC = 'scripts/readers-src';
const DEFAULT_EXPECTED_COUNT = 20;
const LEVEL_COUNT = 5;
const QUESTION_COUNT = 4;
const MAX_NEW_WORDS = 5;
const LENGTH_RANGES = {
  A1: [100, 200],
  A2: [250, 450],
  B1: [450, 700],
  B2: [700, 1000],
};
export const EXPECTED_READERS = [
  ['reader-a1-01', 'A1', '제 하루'],
  ['reader-a1-02', 'A1', '우리 가족'],
  ['reader-a1-03', 'A1', '주말에 만나요'],
  ['reader-a1-04', 'A1', '제가 좋아하는 음식'],
  ['reader-a1-05', 'A1', '우리 동네'],
  ['reader-a2-06', 'A2', '부산 여행 일기'],
  ['reader-a2-07', 'A2', '그 식당, 다시 갈 거예요'],
  ['reader-a2-08', 'A2', '길을 잃어버린 날'],
  ['reader-a2-09', 'A2', '한국의 사계절'],
  ['reader-a2-10', 'A2', '인터넷 쇼핑 실수'],
  ['reader-b1-11', 'B1', '친구에게'],
  ['reader-b1-12', 'B1', '원룸 구하기'],
  ['reader-b1-13', 'B1', '아침형 인간 실험'],
  ['reader-b1-14', 'B1', '첫 출근 날'],
  ['reader-b1-15', 'B1', '설날에 생긴 일'],
  ['reader-b2-16', 'B2', '스마트폰과 우리'],
  ['reader-b2-17', 'B2', '시장과 마트 사이'],
  ['reader-b2-18', 'B2', '지하철에서'],
  ['reader-b2-19', 'B2', '한국어 선생님 인터뷰'],
  ['reader-b2-20', 'B2', '아파트 게시판 공지 두 장'],
];

function readJson(path) {
  return JSON.parse(readFileSync(path, 'utf8'));
}

export function readReaders(src = DEFAULT_SRC) {
  if (!existsSync(src)) return [];
  return readdirSync(src)
    .filter((file) => /^reader-.*\.json$/.test(file))
    .sort()
    .map((file) => ({ ...readJson(join(src, file)), __file: join(src, file) }));
}

function text(value) {
  return typeof value === 'string' && value.trim().length > 0;
}

function koreanLength(reader) {
  return (reader.body || []).join('').replace(/\s/g, '').length;
}

function hasRomanizationKey(value) {
  if (!value || typeof value !== 'object') return false;
  return Object.entries(value).some(([key, child]) =>
    /roman|romaja|romanization/i.test(key) || hasRomanizationKey(child)
  );
}

function hasRomanizedKoreanBody(reader) {
  const body = Array.isArray(reader.body) ? reader.body.join(' ') : '';
  const latinRuns = body.match(/[A-Za-z][A-Za-z'-]*/g) || [];
  return latinRuns.some((word) => word !== word.toUpperCase());
}

function validateQuestion(reader, question, index, errors) {
  const prefix = `${reader.id} question ${index + 1}`;
  if (question?.type !== 'multipleChoice') errors.push(`${prefix} must be multipleChoice`);
  if (!text(question?.prompt)) errors.push(`${prefix} needs prompt`);
  if (!Array.isArray(question?.options) || question.options.length < 3 || question.options.length > 4) {
    errors.push(`${prefix} needs 3-4 options`);
    return;
  }
  if (new Set(question.options).size !== question.options.length) errors.push(`${prefix} has duplicate options`);
  if (!text(question.correct)) errors.push(`${prefix} needs correct`);
  const correctCount = question.options.filter((option) => option === question.correct).length;
  if (correctCount !== 1) errors.push(`${prefix} must have exactly one correct option`);
  if (!text(question.explanation)) errors.push(`${prefix} needs explanation`);
}

export function validateReaderSet(readers, { expectCount = DEFAULT_EXPECTED_COUNT } = {}) {
  const errors = [];
  if (!Array.isArray(readers) || readers.length === 0) errors.push('reader set is empty');
  if (readers.length !== expectCount) errors.push(`needs exactly ${expectCount} readers; found ${readers.length}`);

  const expectedById = new Map(EXPECTED_READERS.map(([id, level, title]) => [id, { level, title }]));
  const ids = new Set();
  const counts = Object.fromEntries(LEVELS.map((level) => [level, 0]));
  for (const reader of readers) {
    const label = reader.id || reader.__file || 'reader';
    if (!text(reader.id)) errors.push(`${label} needs id`);
    if (ids.has(reader.id)) errors.push(`${reader.id} is duplicated`);
    ids.add(reader.id);

    const expected = expectedById.get(reader.id);
    if (!expected) errors.push(`${label} is not in the B5 reader plan`);
    if (!LEVELS.includes(reader.level)) errors.push(`${label} has invalid level ${reader.level}`);
    else counts[reader.level] += 1;
    if (expected && reader.level !== expected.level) errors.push(`${reader.id} must be ${expected.level}, not ${reader.level}`);
    if (expected && reader.title !== expected.title) errors.push(`${reader.id} title must be ${expected.title}`);
    if (!text(reader.titleEn)) errors.push(`${label} needs titleEn`);
    if (!text(reader.genre)) errors.push(`${label} needs genre`);
    if (!Array.isArray(reader.body) || reader.body.length === 0 || !reader.body.every(text)) errors.push(`${label} needs body paragraphs`);
    if (!Array.isArray(reader.bodyTranslation) || reader.bodyTranslation.length !== (reader.body || []).length) {
      errors.push(`${label} bodyTranslation must match body paragraph count`);
    }
    if (hasRomanizationKey(reader)) errors.push(`${label} must not include romanization fields`);
    if (hasRomanizedKoreanBody(reader)) errors.push(`${label} has romanized Korean in body`);
    const [min, max] = LENGTH_RANGES[reader.level] || [0, Infinity];
    const length = koreanLength(reader);
    if (length < min || length > max) errors.push(`${label} length ${length} outside ${reader.level} range ${min}-${max}`);

    if (!Array.isArray(reader.comprehensionQuestions) || reader.comprehensionQuestions.length !== QUESTION_COUNT) {
      errors.push(`${label} needs exactly ${QUESTION_COUNT} comprehension questions`);
    } else {
      reader.comprehensionQuestions.forEach((question, index) => validateQuestion(reader, question, index, errors));
    }
    if (!text(reader.summaryPrompt)) errors.push(`${label} needs summaryPrompt`);
    if (!Array.isArray(reader.newWords)) errors.push(`${label} needs newWords array`);
    else if (reader.newWords.length > MAX_NEW_WORDS) errors.push(`${label} has more than ${MAX_NEW_WORDS} newWords`);
  }

  for (const level of LEVELS) {
    if (counts[level] !== LEVEL_COUNT) errors.push(`${level} needs exactly ${LEVEL_COUNT} readers; found ${counts[level]}`);
  }
  for (const [id] of EXPECTED_READERS) {
    if (!ids.has(id)) errors.push(`missing ${id}`);
  }
  return { ok: errors.length === 0, errors, counts, total: readers.length };
}

export function formatReaderReport(result) {
  const lines = [
    result.ok ? 'Reader validation passed.' : 'Reader validation failed.',
    `Readers: ${result.total}`,
    `By level: ${LEVELS.map((level) => `${level}=${result.counts?.[level] || 0}`).join(', ')}`,
  ];
  for (const error of result.errors || []) lines.push(`- ${error}`);
  return lines.join('\n');
}

function parseArgs(argv) {
  const args = { src: DEFAULT_SRC, expectCount: DEFAULT_EXPECTED_COUNT, selfTest: false };
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--src') args.src = argv[++i];
    else if (arg === '--expect-count') args.expectCount = Number(argv[++i]);
    else if (arg === '--self-test-boundaries') args.selfTest = true;
  }
  return args;
}

function validFixture() {
  return EXPECTED_READERS.map(([id, level, title]) => ({
    id,
    level,
    title,
    titleEn: `${title} English`,
    genre: 'fixture',
    body: ['가 '.repeat(LENGTH_RANGES[level][0]).trim()],
    bodyTranslation: ['fixture translation'],
    comprehensionQuestions: Array.from({ length: QUESTION_COUNT }, (_, index) => ({
      type: 'multipleChoice',
      prompt: `Question ${index + 1}?`,
      options: ['one', 'two', 'three'],
      correct: 'one',
      explanation: 'one is correct; the other choices are distractors.',
    })),
    summaryPrompt: '요약해 보세요.',
    newWords: [],
  }));
}

function runBoundarySelfTest() {
  const cases = [
    ['empty', []],
    ['malformed schema', (() => { const items = validFixture(); delete items[0].title; return items; })()],
    ['duplicate ids', (() => { const items = validFixture(); items[1] = { ...items[1], id: items[0].id }; return items; })()],
    ['translation mismatch', (() => { const items = validFixture(); items[0] = { ...items[0], bodyTranslation: [] }; return items; })()],
    ['wrong question count', (() => { const items = validFixture(); items[0] = { ...items[0], comprehensionQuestions: [] }; return items; })()],
    ['zero correct options', (() => {
      const items = validFixture();
      items[0].comprehensionQuestions[0] = { ...items[0].comprehensionQuestions[0], correct: 'missing' };
      return items;
    })()],
    ['duplicate options and multiple correct options', (() => {
      const items = validFixture();
      items[0].comprehensionQuestions[0] = { ...items[0].comprehensionQuestions[0], options: ['one', 'one', 'two'] };
      return items;
    })()],
    ['romanization field', (() => { const items = validFixture(); items[0] = { ...items[0], romanization: 'gayo' }; return items; })()],
    ['romanized body', (() => { const items = validFixture(); items[0].body[0] += ' gayo'; return items; })()],
    ['single-token romanized body', (() => { const items = validFixture(); items[0].body[0] += ' gamsahamnida'; return items; })()],
  ];
  const failures = cases.filter(([, readers]) => validateReaderSet(readers).ok).map(([name]) => name);
  if (failures.length) {
    return { ok: false, errors: failures.map((name) => `boundary case did not fail: ${name}`) };
  }
  return { ok: true, errors: [] };
}

function isMain() {
  return process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1]);
}

if (isMain()) {
  const args = parseArgs(process.argv.slice(2));
  if (args.selfTest) {
    const result = runBoundarySelfTest();
    console.log(result.ok ? 'Reader boundary self-test passed.' : 'Reader boundary self-test failed.');
    for (const error of result.errors) console.log(`- ${error}`);
    process.exit(result.ok ? 0 : 1);
  }
  const result = validateReaderSet(readReaders(args.src), { expectCount: args.expectCount });
  console.log(formatReaderReport(result));
  if (!result.ok) {
    console.log(`Source: ${args.src}`);
    process.exit(1);
  }
}
