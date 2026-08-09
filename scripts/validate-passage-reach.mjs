// C11 machine gate: can a learner who has done chapters 1..N actually read
// chapter N's passage and dialogue? Written by the harness designer, not by the
// author, so it cannot be tuned to whatever the text happens to say.
//
// "Reach" = share of eojeol (space-separated words) whose stem the learner has
// already met. Counted as within reach:
//   - a headword from extendedVocabulary of chapters 1..N (this chapter's own
//     vocabulary counts: it is taught in the same lesson)
//   - a speaker name used in this chapter
//   - a closed-class function word (particles, numerals, pronouns, conjunctions
//     and the handful of light verbs) — those are taught as grammar, not vocab
//
// Usage: node scripts/validate-passage-reach.mjs 3        (one chapter)
//        node scripts/validate-passage-reach.mjs 1-11     (a run, prints a table)
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const pad = (n) => String(n).padStart(2, '0');
const load = (n) => JSON.parse(readFileSync(join(root, 'scripts', 'rich-chapters', `chapter-${pad(n)}.json`), 'utf8'));

// Closed-class items the course teaches as grammar, plus the light verbs that
// carry almost every A1 sentence. Deliberately short: if a content word is
// missing from here, the text has to earn it from the vocabulary lists.
const FUNCTION_WORDS = [
  '저', '나', '너', '우리', '저희', '당신', '이', '그', '저것', '이것', '그것', '여기', '거기', '저기',
  '누구', '무엇', '뭐', '언제', '어디', '어떻게', '왜', '몇', '무슨', '어느', '얼마',
  '하나', '둘', '셋', '넷', '다섯', '여섯', '일곱', '여덟', '아홉', '열',
  '일', '이', '삼', '사', '오', '육', '칠', '팔', '구', '십', '백', '천', '만',
  '네', '예', '아니요', '안', '못', '더', '아주', '너무', '많이', '조금', '좀', '다', '잘',
  '아', '어', '와', '오', '응', '음', '자', '그래', '정말', '진짜', '참',
  '그리고', '그런데', '그래서', '하지만', '그럼', '또', '같이', '함께', '먼저', '지금', '오늘', '내일', '어제',
  '하다', '있다', '없다', '되다', '이다', '아니다', '가다', '오다', '보다', '주다', '말', '것', '거', '수', '때', '분', '씨', '님',
];

// The gate must not punish an author for conjugating. A stem the learner was
// taught stays "met" through the contractions A1 actually uses: 마시다 → 마셔,
// 바쁘다 → 바빠, 하다 → 해. Composed with jamo arithmetic, not a word list.
const CHO = 'ㄱㄲㄴㄷㄸㄹㅁㅂㅃㅅㅆㅇㅈㅉㅊㅋㅌㅍㅎ';
const JUNG = 'ㅏㅐㅑㅒㅓㅔㅕㅖㅗㅘㅙㅚㅛㅜㅝㅞㅟㅠㅡㅢㅣ';
const JONG = ' ㄱㄲㄳㄴㄵㄶㄷㄹㄺㄻㄼㄽㄾㄿㅀㅁㅂㅄㅅㅆㅇㅈㅊㅋㅌㅍㅎ';
const decompose = (ch) => {
  const code = ch.codePointAt(0) - 0xac00;
  if (code < 0 || code > 11171) return null;
  return [CHO[Math.floor(code / 588)], JUNG[Math.floor((code % 588) / 28)], JONG[code % 28].trim()];
};
const compose = (c, v, t = '') =>
  String.fromCodePoint(0xac00 + CHO.indexOf(c) * 588 + JUNG.indexOf(v) * 28 + (t ? JONG.indexOf(t) : 0));

function contractions(stem) {
  const out = [];
  const last = stem.at(-1);
  const parts = last && decompose(last);
  if (!parts) return out;
  const [c, v, t] = parts;
  const head = stem.slice(0, -1);
  if (t) return out;                                   // 있, 먹 … already match by prefix
  if (v === 'ㅣ') out.push(head + compose(c, 'ㅕ'));     // 마시 → 마셔
  if (v === 'ㅡ') out.push(head + compose(c, 'ㅏ'), head + compose(c, 'ㅓ')); // 바쁘 → 바빠
  if (v === 'ㅗ') out.push(head + compose(c, 'ㅘ'));     // 보 → 봐
  if (v === 'ㅜ') out.push(head + compose(c, 'ㅝ'));     // 주 → 줘
  if (v === 'ㅏ' || v === 'ㅓ') out.push(stem);          // 가, 서 — no change
  return out;
}

export function reachOf(n) {
  const known = new Set();
  const names = new Set();
  for (let i = 1; i <= n; i += 1) {
    let ch;
    try { ch = load(i); } catch { continue; }
    for (const w of ch.extendedVocabulary || []) {
      for (const part of String(w.hangul || '').split('/')) {
        const t = part.trim();
        if (!t) continue;
        known.add(t);
        if (t.endsWith('다') && t.length > 1) {
          const stem = t.slice(0, -1);
          known.add(stem);
          for (const form of contractions(stem)) known.add(form);
        }
        if (t.endsWith('하다') && t.length > 2) {
          known.add(t.slice(0, -2));            // 하다-noun
          known.add(`${t.slice(0, -2)}해`);      // 공부해요
          known.add(`${t.slice(0, -2)}했`);      // 공부했어요
        }
      }
    }
    // the cast recurs across chapters, so a name met earlier is still a name
    for (const line of (ch.extendedDialogue?.lines || [])) if (line.speaker) names.add(String(line.speaker).trim());
  }
  const ch = load(n);
  for (const line of ch.extendedDialogue?.lines || []) if (line.speaker) names.add(String(line.speaker).trim());
  for (const word of FUNCTION_WORDS) {
    known.add(word);
    if (word.endsWith('다') && word.length > 1) known.add(word.slice(0, -1));
  }

  const inReach = (eojeol) => {
    const bare = String(eojeol).replace(/[^가-힣]/g, '');
    if (!bare) return null;                       // punctuation / latin only
    for (const nm of names) if (bare.startsWith(nm)) return true;
    for (const k of known) if (k.length >= 1 && bare.startsWith(k)) return true;
    return false;
  };

  const score = (text) => {
    const words = String(text || '').split(/\s+/).map(inReach).filter((v) => v !== null);
    if (!words.length) return { total: 0, pct: null, misses: [] };
    const hit = words.filter(Boolean).length;
    const misses = String(text).split(/\s+/).filter((e) => inReach(e) === false).map((e) => e.replace(/[^가-힣]/g, ''));
    return { total: words.length, pct: Math.round((hit / words.length) * 100), misses: [...new Set(misses)] };
  };

  return {
    chapter: n,
    reading: score(ch.readingText?.body),
    dialogue: score((ch.extendedDialogue?.lines || []).map((l) => l.ko).join(' ')),
  };
}

// --- CLI ------------------------------------------------------------------
const arg = process.argv[2];
if (arg) {
  const [from, to] = arg.includes('-') ? arg.split('-').map(Number) : [Number(arg), Number(arg)];
  const TARGET = Number(process.env.REACH_TARGET || 90);
  const rows = [];
  let fail = 0;
  for (let n = from; n <= to; n += 1) {
    const r = reachOf(n);
    rows.push({
      chapter: n,
      reading: r.reading.pct === null ? '—' : `${r.reading.pct}%`,
      dialogue: r.dialogue.pct === null ? '—' : `${r.dialogue.pct}%`,
      'out of reach': [...r.reading.misses, ...r.dialogue.misses].slice(0, 6).join(' '),
    });
    for (const [what, s] of [['reading', r.reading], ['dialogue', r.dialogue]]) {
      if (s.pct !== null && s.pct < TARGET) {
        fail += 1;
        console.error(`✗ chapter ${n} ${what}: ${s.pct}% in reach (target ${TARGET}%) — ${s.misses.slice(0, 10).join(', ')}`);
      }
    }
  }
  console.table(rows);
  const nums = rows.flatMap((r) => [r.reading, r.dialogue]).filter((v) => v !== '—').map((v) => parseInt(v, 10));
  console.log(`mean ${Math.round(nums.reduce((a, b) => a + b, 0) / nums.length)}% · target ${TARGET}% · ${fail} text(s) below target`);
  process.exit(fail ? 1 : 0);
}
