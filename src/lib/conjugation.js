import { LEADS, VOWELS, TAILS, compose, decompose } from './hangul.js';

// ── A conservative Korean conjugator ─────────────────────────────────────────
// Generates the everyday forms (polite/formal/past/future/negative + verb modal
// forms) for a 다-final verb or adjective when the dataset ships none. It covers
// the predictable rules with certainty (regular, vowel contraction, ㅡ-drop, 하다)
// and the consonant irregulars (ㅂ/ㄷ/ㅅ/ㄹ-르/ㅎ) via rule + exception lists, so
// it never silently teaches a wrong irregular. Returns null when it cannot be
// confident (so the UI shows nothing rather than a guess).

const li = (j) => LEADS.indexOf(j);
const vi = (j) => VOWELS.indexOf(j);
const ti = (j) => TAILS.indexOf(j);
const syl = (lead, vowel, tail = '') => compose(li(lead), vi(vowel), ti(tail));
const setTail = (s, tail) => { const d = decompose(s); return compose(li(d.lead), vi(d.vowel), ti(tail)); };
const isBright = (v) => v === 'ㅏ' || v === 'ㅗ';

// ㅂ-final stems that are actually REGULAR (default for ㅂ is irregular).
const REGULAR_B = new Set(['입다', '잡다', '좁다', '넓다', '씹다', '뽑다', '업다', '접다', '집다', '꼬집다', '수줍다', '곱씹다']);
// ㅅ/ㄷ-final stems that ARE irregular (default for ㅅ and ㄷ is regular).
const IRREGULAR_S = new Set(['짓다', '낫다', '붓다', '긋다', '잇다', '젓다']);
const IRREGULAR_D = new Set(['듣다', '걷다', '묻다', '싣다', '깨닫다', '일컫다', '붇다']);
// 르-final stems that are 으-regular rather than 르-irregular.
const EU_REGULAR_REU = new Set(['따르다', '들르다', '치르다', '우러르다', '다다르다']);
// ㅂ-irregular stems whose infinitive takes 와 (not 워).
const WA_B = new Set(['돕다', '곱다']);

function classify(hangul, pos, flag) {
  const stem = hangul.replace(/다$/, '');
  const last = stem.slice(-1);
  const d = decompose(last);
  if (!d.vowel) return 'unknown';
  const f = (flag || '').toLowerCase();
  if (/하$/.test(stem)) return 'hada';
  if (last === '르' && !EU_REGULAR_REU.has(hangul)) return 'reu';
  if (d.vowel === 'ㅡ' && !d.tail) return 'eu';
  if (!d.tail) return 'vowel';
  if (d.tail === 'ㅂ') return REGULAR_B.has(hangul) ? 'regular' : 'birr';
  if (d.tail === 'ㄷ') return IRREGULAR_D.has(hangul) || f.includes('ㄷ') ? 'dirr' : 'regular';
  if (d.tail === 'ㅅ') return IRREGULAR_S.has(hangul) || f.includes('ㅅ') ? 'sirr' : 'regular';
  if (d.tail === 'ㅎ') return pos === 'adjective' && hangul !== '좋다' ? 'hirr' : 'regular';
  return 'regular';
}

// The 아/어 (infinitive) form — the base for polite/past/must.
function infinitive(stem, type) {
  const head = stem.slice(0, -1);
  const last = stem.slice(-1);
  const d = decompose(last);
  const headV = head ? decompose(head.slice(-1)).vowel : '';
  switch (type) {
    case 'hada':
      return head + '해';
    case 'eu': {
      const v = isBright(headV) ? 'ㅏ' : 'ㅓ';
      return head + syl(d.lead, v);
    }
    case 'reu': {
      const v = isBright(headV) ? 'ㅏ' : 'ㅓ';
      return head.slice(0, -1) + setTail(head.slice(-1), 'ㄹ') + syl('ㄹ', v);
    }
    case 'birr':
      return head + setTail(last, '') + (WA_B.has(stem + '다') ? '와' : '워');
    case 'dirr': {
      const v = isBright(d.vowel) ? 'ㅏ' : 'ㅓ';
      return head + setTail(last, 'ㄹ') + syl('ㅇ', v);
    }
    case 'sirr': {
      const v = isBright(d.vowel) ? 'ㅏ' : 'ㅓ';
      return head + setTail(last, '') + syl('ㅇ', v);
    }
    case 'hirr':
      return head + syl(d.lead, d.vowel === 'ㅑ' ? 'ㅒ' : 'ㅐ');
    case 'vowel': {
      const merged = vowelMerge(d);
      if (merged) return head + merged;
      return head + last + syl('ㅇ', isBright(d.vowel) ? 'ㅏ' : 'ㅓ'); // hiatus (쉬다→쉬어)
    }
    default: { // regular consonant tail
      return head + last + syl('ㅇ', isBright(d.vowel) ? 'ㅏ' : 'ㅓ');
    }
  }
}

function vowelMerge(d) {
  const L = li(d.lead);
  switch (d.vowel) {
    case 'ㅏ': return compose(L, vi('ㅏ'));
    case 'ㅓ': return compose(L, vi('ㅓ'));
    case 'ㅕ': return compose(L, vi('ㅕ'));
    case 'ㅐ': return compose(L, vi('ㅐ'));
    case 'ㅔ': return compose(L, vi('ㅔ'));
    case 'ㅗ': return compose(L, vi('ㅘ'));
    case 'ㅜ': return compose(L, vi('ㅝ'));
    case 'ㅣ': return compose(L, vi('ㅕ'));
    case 'ㅚ': return compose(L, vi('ㅙ'));
    default: return null; // ㅟ, ㅢ → hiatus
  }
}

// The 으-series base (for future/can): returns the string that precedes
// " 거예요" / " 수 있어요", already carrying ㄹ/을 as needed.
function lForm(stem, type) {
  const head = stem.slice(0, -1);
  const last = stem.slice(-1);
  const d = decompose(last);
  switch (type) {
    case 'birr': return head + setTail(last, '') + '울';
    case 'dirr': return head + setTail(last, 'ㄹ') + '을';
    case 'sirr': return head + setTail(last, '') + '을';
    case 'hirr': return head + setTail(setTail(last, ''), 'ㄹ');
    default:
      if (!d.tail) return head + setTail(last, 'ㄹ');   // vowel/eu/reu/hada → 갈/클/모를/공부할
      if (d.tail === 'ㄹ') return stem;                  // 살 거예요
      return stem + '을';                                // 먹을, 받을
  }
}

function formalForm(stem) {
  const head = stem.slice(0, -1);
  const last = stem.slice(-1);
  const d = decompose(last);
  if (!d.tail) return head + setTail(last, 'ㅂ') + '니다';           // 마시 → 마십니다
  if (d.tail === 'ㄹ') return head + setTail(last, 'ㅂ') + '니다';   // (ㄹ drops) 살 → 삽니다
  return stem + '습니다';                                            // 먹습니다, 덥습니다
}

const hadaNoun = (stem) => (/하$/.test(stem) && stem.length > 1 ? stem.slice(0, -1) : null);

export function conjugate(hangul, { partOfSpeech = 'verb', irregular = '' } = {}) {
  if (typeof hangul !== 'string' || !/다$/.test(hangul) || hangul.length < 2) return null;
  const stem = hangul.replace(/다$/, '');
  const type = classify(hangul, partOfSpeech, irregular);
  if (type === 'unknown') return null;

  const inf = infinitive(stem, type);
  const polite = inf + '요';
  const past = setTail(inf.slice(-1), 'ㅆ');
  const isAdj = partOfSpeech === 'adjective';
  const noun = hadaNoun(stem);

  const forms = {
    politePresent: polite,
    formalPresent: formalForm(stem),
    past: inf.slice(0, -1) + past + '어요',
    future: lForm(stem, type) + ' 거예요',
    negative: noun ? noun + ' 안 ' + (type === 'hada' ? '해요' : polite.slice(noun.length))
                   : '안 ' + polite,
  };
  if (!isAdj) {
    forms.want = stem + '고 싶어요';
    forms.can = lForm(stem, type) + ' 수 있어요';
    forms.cannot = noun ? noun + ' 못 ' + (type === 'hada' ? '해요' : polite.slice(noun.length)) : '못 ' + polite;
    forms.must = inf + '야 해요';
  }
  return forms;
}

// Verb-specific explanation for WHY a 아/어-based form looks the way it does.
// Covers the forms whose shape depends on the stem (polite present, past, must).
// Returns null for other forms so the caller can fall back to a generic note.
export function explainForm(entry, key) {
  if (!['politePresent', 'past', 'must'].includes(key)) return null;
  const form = entry.forms?.[key];
  if (!form) return null;

  const stem = (entry.hangul || '').replace(/다$/, '');
  const irr = entry.irregular || '';

  if (/하$/.test(stem)) {
    return `하다-verb: 하 contracts with 여 to become 해, so this is ${form}. Most noun+하다 verbs work this way (공부했어요, 숙제했어요).`;
  }
  if (irr.includes('ㅂ')) return `ㅂ-irregular: the final ㅂ changes to 우 before a vowel ending, giving ${form} — not a literal attachment.`;
  if (irr.includes('ㄷ')) return `ㄷ-irregular: the final ㄷ turns into ㄹ before a vowel ending, giving ${form}.`;
  if (irr.includes('르')) return `르-irregular: 르 doubles the ㄹ before a vowel, giving ${form} (모르다 → 몰랐어요).`;
  if (irr.includes('ㅡ')) return `ㅡ-stem: the ㅡ drops before 아/어, giving ${form} (크다 → 컸어요).`;

  const last = stem.slice(-1);
  const d = decompose(last);
  if (!d.tail) {
    return `The stem ends in the vowel ${d.vowel}, so 아/어 merges into it and contracts → ${form} (자다 → 잤어요, 오다 → 왔어요).`;
  }
  const bright = d.vowel === 'ㅏ' || d.vowel === 'ㅗ';
  return `The stem ends in a consonant and its vowel is ${d.vowel}, so it takes ${bright ? '아 (ㅏ/ㅗ are "bright" vowels)' : '어'} → ${form}.`;
}
