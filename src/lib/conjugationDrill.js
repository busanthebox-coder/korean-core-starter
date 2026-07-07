import { normalizeKo } from './quiz.js';

export const CONJUGATION_FORM_KEYS = [
  'dictionary',
  'casualPresent',
  'politePresent',
  'formalPresent',
  'negative',
  'past',
  'future',
  'want',
  'can',
  'cannot',
  'must',
  'dontHaveTo',
  'pleaseDo',
  'pleaseDont',
  'shallWe',
];

export const FORM_LABELS = {
  dictionary: { en: 'dictionary form', ko: '기본형', pattern: 'V/A-다' },
  casualPresent: { en: 'casual present', ko: '반말 현재', pattern: '아/어' },
  politePresent: { en: 'polite present', ko: '존댓말 현재', pattern: '아/어요' },
  formalPresent: { en: 'formal present', ko: '격식체 현재', pattern: 'ㅂ/습니다' },
  negative: { en: 'negative', ko: '부정', pattern: '안 V / -지 않아요' },
  past: { en: 'polite past', ko: '존댓말 과거', pattern: '았/었어요' },
  future: { en: 'future plan or prediction', ko: '미래', pattern: '(으)ㄹ 거예요' },
  want: { en: 'want to', ko: '희망', pattern: '고 싶어요' },
  can: { en: 'can do', ko: '가능', pattern: '(으)ㄹ 수 있어요' },
  cannot: { en: 'cannot do', ko: '불가능', pattern: '(으)ㄹ 수 없어요 / 못 V' },
  must: { en: 'must do', ko: '의무', pattern: '아/어야 해요' },
  dontHaveTo: { en: 'do not have to', ko: '불필요', pattern: '안 해도 돼요' },
  pleaseDo: { en: 'please do', ko: '부탁', pattern: '아/어 주세요' },
  pleaseDont: { en: 'please do not', ko: '금지 부탁', pattern: '지 마세요' },
  shallWe: { en: 'shall we', ko: '제안', pattern: '(으)ㄹ까요?' },
};

export const CHAPTER_FORM_MAP = {
  'chapter-05': ['politePresent', 'negative'],
  'chapter-08': ['want', 'can', 'cannot'],
  'chapter-09': ['pleaseDo', 'pleaseDont', 'must', 'dontHaveTo'],
  'chapter-17': ['past'],
  'chapter-18': ['future'],
  'chapter-24': ['shallWe'],
  'chapter-33': ['formalPresent', 'casualPresent'],
  'chapter-41': ['politePresent', 'past'],
  'chapter-45': ['negative'],
};

export function rngFromString(seedText = '') {
  let seed = 2166136261;
  for (const ch of String(seedText)) {
    seed ^= ch.charCodeAt(0);
    seed = Math.imul(seed, 16777619);
  }
  return () => {
    seed += 0x6D2B79F5;
    let t = seed;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function getChapterConjugationForms(chapterOrId) {
  const id = typeof chapterOrId === 'string' ? chapterOrId : chapterOrId?.id;
  return CHAPTER_FORM_MAP[id] ? CHAPTER_FORM_MAP[id].slice() : [];
}

function cleanForms(forms = []) {
  const seen = new Set();
  return forms
    .filter((form) => CONJUGATION_FORM_KEYS.includes(form))
    .filter((form) => {
      if (seen.has(form)) return false;
      seen.add(form);
      return true;
    });
}

function answerFor(entry, form) {
  const answer = entry?.forms?.[form];
  return typeof answer === 'string' && answer.trim() ? answer.trim() : '';
}

function irregularLabel(entry) {
  const raw = String(entry?.irregular || '').trim();
  if (!raw || /^regular$/i.test(raw) || /^none$/i.test(raw)) return 'regular';
  return raw;
}

function isIrregular(entry) {
  return irregularLabel(entry) !== 'regular';
}

function weightedPick(candidates, rng) {
  const total = candidates.reduce((sum, c) => sum + c.weight, 0);
  let cursor = rng() * total;
  for (const candidate of candidates) {
    cursor -= candidate.weight;
    if (cursor <= 0) return candidate;
  }
  return candidates[candidates.length - 1];
}

function buildCandidate(entry, form, irregularWeight) {
  const answer = answerFor(entry, form);
  if (!answer) return null;
  const irregular = irregularLabel(entry);
  return {
    entry,
    form,
    answer,
    weight: irregular === 'regular' ? 1 : irregularWeight,
    irregular,
  };
}

function toQuestion(candidate) {
  const label = FORM_LABELS[candidate.form];
  const item = {
    type: 'conjugation',
    entryId: candidate.entry.id,
    base: candidate.entry.hangul,
    romanization: candidate.entry.romanization || '',
    english: candidate.entry.english || '',
    partOfSpeech: candidate.entry.partOfSpeech || candidate.entry.type || '',
    form: candidate.form,
    label,
    answer: candidate.answer,
    irregular: candidate.irregular,
    prompt: candidate.entry.hangul,
    promptEnglish: candidate.entry.english || '',
  };
  item.reason = explainConjugationItem(item);
  return item;
}

export function buildConjugationQuiz(
  pool,
  { forms = ['past', 'politePresent'], count = 10, rng = Math.random, irregularWeight = 1.5 } = {}
) {
  const requestedForms = cleanForms(forms);
  if (!Array.isArray(pool) || !pool.length || !requestedForms.length || count <= 0) return [];

  const candidates = [];
  for (const entry of pool) {
    for (const form of requestedForms) {
      const candidate = buildCandidate(entry, form, irregularWeight);
      if (candidate) candidates.push(candidate);
    }
  }
  if (!candidates.length) return [];

  const out = [];
  let previousEntryId = null;
  for (let i = 0; i < count; i += 1) {
    const avoidRepeat = candidates.filter((candidate) => candidate.entry.id !== previousEntryId);
    const eligible = avoidRepeat.length ? avoidRepeat : candidates;
    const picked = weightedPick(eligible, rng);
    out.push(toQuestion(picked));
    previousEntryId = picked.entry.id;
  }
  return out;
}

export function answerVariants(answer = '') {
  return String(answer)
    .split(/\s*[/;]\s*/)
    .map((part) => part.trim())
    .filter(Boolean);
}

export function gradeConjugation(input, item) {
  const got = normalizeKo(input);
  const accepted = answerVariants(item?.answer).map(normalizeKo).filter(Boolean);
  return {
    ok: !!got && accepted.includes(got),
    got,
    expected: item?.answer || '',
  };
}

function irregularHint(irregular) {
  if (/ㄷ/.test(irregular)) {
    return 'ㄷ irregular: before a vowel-starting ending, ㄷ changes to ㄹ, so the sound flows more naturally.';
  }
  if (/ㅂ/.test(irregular)) {
    return 'ㅂ irregular: many descriptive/action stems change ㅂ to 우/오 before vowel-starting endings.';
  }
  if (/ㅅ/.test(irregular)) {
    return 'ㅅ irregular: ㅅ drops before vowel-starting endings, so the stem becomes smoother.';
  }
  if (/르/.test(irregular)) {
    return '르 irregular: 르 often changes to ㄹ라/ㄹ러 before 아/어-style endings.';
  }
  if (/ㅡ|eu/i.test(irregular)) {
    return 'ㅡ irregular: ㅡ drops before 아/어-style endings, then the nearby vowel guides 아 vs 어.';
  }
  if (/ㅎ/.test(irregular)) {
    return 'ㅎ irregular: many adjective stems lose ㅎ and the vowel contracts in 아/어-style forms.';
  }
  if (/ㄹ/.test(irregular)) {
    return 'ㄹ stem: ㄹ often disappears before some formal endings, but stays in many everyday forms.';
  }
  return `${irregular}: this verb has a stored natural form, so memorize it as a chunk.`;
}

export function explainConjugationItem(item) {
  const label = FORM_LABELS[item?.form] || { en: 'this form', pattern: 'the target pattern' };
  const answer = item?.answer || '';
  const base = item?.base || 'this word';
  const irregular = item?.irregular || 'regular';
  const target = `${label.en} (${label.pattern})`;

  if (irregular !== 'regular') {
    return `${irregularHint(irregular)} For ${base}, the ${target} answer is ${answer}.`;
  }
  return `Use the ${target} form for ${base}. The natural answer is ${answer}.`;
}
