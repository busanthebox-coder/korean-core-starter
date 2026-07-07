import { conjugate } from './conjugation.js';
import { LEADS, VOWELS, TAILS, compose, decompose } from './hangul.js';
import { cleanGlossToken } from './glossTokens.js';

const PHRASE_HELPERS = new Set(['싶어요', '거예요', '것', '같아요', '때문에', '바람에', '나서']);

const li = (j) => LEADS.indexOf(j);
const vi = (j) => VOWELS.indexOf(j);
const ti = (j) => TAILS.indexOf(j);

function setTail(s, tail) {
  const d = decompose(s);
  return compose(li(d.lead), vi(d.vowel), ti(tail));
}

export function addGlossMatch(map, form, entry) {
  const clean = cleanGlossToken(form);
  if (!clean || clean.includes(' ')) return;
  if (!map.has(clean)) map.set(clean, entry);
}

function hasTail(word) {
  return Boolean(decompose(word.slice(-1)).tail);
}

function attachTailOrBridge(stem, tail, bridge) {
  if (hasTail(stem)) return stem + bridge;
  return stem.slice(0, -1) + setTail(stem.slice(-1), tail);
}

function verbPresentModifier(stem) {
  const last = stem.slice(-1);
  const d = decompose(last);
  if (d.tail === 'ㄹ') return stem.slice(0, -1) + setTail(last, '') + '는';
  return stem + '는';
}

function writtenPresentStatement(stem) {
  const last = stem.slice(-1);
  const d = decompose(last);
  if (!d.tail) return stem.slice(0, -1) + setTail(last, 'ㄴ') + '다';
  if (d.tail === 'ㄹ') return stem.slice(0, -1) + setTail(last, 'ㄴ') + '다';
  return stem + '는다';
}

function verbPastModifier(stem) {
  const last = stem.slice(-1);
  const d = decompose(last);
  if (!d.tail || d.tail === 'ㄹ') return stem.slice(0, -1) + setTail(last, 'ㄴ');
  return stem + '은';
}

function addPhraseHelpers(map, entry) {
  for (const token of String(entry.hangul || '').split(/\s+/).map(cleanGlossToken)) {
    if (PHRASE_HELPERS.has(token)) addGlossMatch(map, token, entry);
  }
}

function adjectiveModifier(hangul) {
  if (/하다$/.test(hangul)) return hangul.replace(/하다$/, '한');
  const stem = hangul.replace(/다$/, '');
  const last = stem.slice(-1);
  const d = decompose(last);
  if (!d.vowel) return null;
  if (!d.tail || d.tail === 'ㄹ') return stem.slice(0, -1) + setTail(last, 'ㄴ');
  if (d.tail === 'ㅂ') return stem.slice(0, -1) + setTail(last, '') + '운';
  return stem + '은';
}

function addGeneratedDerivatives(map, entry, generated) {
  if (!/다$/.test(entry.hangul || '')) return;
  const stem = entry.hangul.replace(/다$/, '');
  const politeBase = generated?.politePresent?.replace(/요$/, '');
  const pastBase = generated?.past?.replace(/어요$/, '');
  if (politeBase) {
    addGlossMatch(map, politeBase, entry);
    for (const ending of ['서', '도', '야', '야지', '지만', '면']) addGlossMatch(map, politeBase + ending, entry);
  }
  if (pastBase) {
    for (const ending of ['다', '지만', '고', '기', '는데', '다고', '다고요', '지요', '거든요']) addGlossMatch(map, pastBase + ending, entry);
  }
  const futureFirst = generated?.future?.split(/\s+/)[0];
  if (futureFirst) {
    addGlossMatch(map, futureFirst + '수록', entry);
    addGlossMatch(map, futureFirst + '까', entry);
  }
  for (const ending of ['고', '지', '기', '기로', '지만', '는', '느라']) addGlossMatch(map, stem + ending, entry);
  for (const ending of ['더라고요', '거든요']) addGlossMatch(map, stem + ending, entry);
  addGlossMatch(map, stem + (hasTail(stem) ? '으면' : '면'), entry);
  addGlossMatch(map, stem + (hasTail(stem) ? '으면서' : '면서'), entry);
  if (entry.partOfSpeech === 'adjective') {
    addGlossMatch(map, adjectiveModifier(entry.hangul), entry);
    addGlossMatch(map, stem + '게', entry);
    addGlossMatch(map, entry.hangul.replace(/다$/, '다고'), entry);
    addGlossMatch(map, entry.hangul.replace(/다$/, '다고요'), entry);
    return;
  }
  const bridge = hasTail(stem) ? '으' : '';
  for (const ending of ['러', '려고', '시고', '시기', '십시오', '셔서', '셨어요', '시자', '세요']) {
    addGlossMatch(map, stem + bridge + ending, entry);
  }
  addGlossMatch(map, stem + (hasTail(stem) ? '으며' : '며'), entry);
  addGlossMatch(map, verbPresentModifier(stem), entry);
  addGlossMatch(map, verbPresentModifier(stem) + '지', entry);
  addGlossMatch(map, verbPresentModifier(stem) + '데도', entry);
  addGlossMatch(map, verbPastModifier(stem), entry);
  for (const ending of ['자', '자고', '게', '라고', '라고요']) addGlossMatch(map, stem + ending, entry);
  addGlossMatch(map, writtenPresentStatement(stem), entry);
  addGlossMatch(map, attachTailOrBridge(stem, 'ㄴ', '는') + '다고', entry);
  addGlossMatch(map, attachTailOrBridge(stem, 'ㄴ', '는') + '다고요', entry);
  addGlossMatch(map, attachTailOrBridge(stem, 'ㄴ', '는') + '다는', entry);
}

export function addEntryForms(map, entry) {
  addPhraseHelpers(map, entry);
  for (const form of Object.values(entry.forms || {})) {
    addGlossMatch(map, form, entry);
    if (typeof form === 'string' && form.includes(' ')) addGlossMatch(map, form.split(/\s+/)[0], entry);
  }
  const generated = conjugate(entry.hangul, {
    partOfSpeech: entry.partOfSpeech || entry.type,
    irregular: entry.irregular || '',
  });
  for (const form of Object.values(generated || {})) {
    addGlossMatch(map, form, entry);
    if (typeof form === 'string' && form.includes(' ')) addGlossMatch(map, form.split(/\s+/)[0], entry);
  }
  addGeneratedDerivatives(map, entry, generated);
}
