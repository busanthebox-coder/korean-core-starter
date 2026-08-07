// C10 machine gate: validate a rich chapter file against the shape and floor
// values measured from shipped chapters 57-65 (2026-08-07). Written by the
// harness designer, NOT by the authoring agent — the gate must not be gameable
// by the thing it gates. Usage: node scripts/validate-rich-chapter.mjs 66
import { readFileSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const n = Number(process.argv[2]);
if (!n) { console.error('usage: node scripts/validate-rich-chapter.mjs <chapterNumber>'); process.exit(2); }
const file = join(root, 'scripts', 'rich-chapters', `chapter-${String(n).padStart(2, '0')}.json`);
const ch = JSON.parse(readFileSync(file, 'utf8'));

const errors = [];
const warns = [];
const ok = (cond, msg) => { if (!cond) errors.push(msg); };
const isStr = (v) => typeof v === 'string' && v.trim().length > 0;

// ---------- top-level shape (floors from shipped 57-65) ----------
ok(ch.id === `chapter-${String(n).padStart(2, '0')}`, `id must be chapter-${String(n).padStart(2, '0')}`);
ok(ch.hook && isStr(ch.hook.situation) && isStr(ch.hook.whyItMatters), 'hook{situation,whyItMatters} required');
ok(Array.isArray(ch.grammarNotes) && ch.grammarNotes.length >= 3 && ch.grammarNotes.length <= 6, 'grammarNotes 3-6');
ok(Array.isArray(ch.extendedVocabulary) && ch.extendedVocabulary.length >= 10 && ch.extendedVocabulary.length <= 24, 'extendedVocabulary 10-24');
ok(ch.extendedDialogue && Array.isArray(ch.extendedDialogue.lines) && ch.extendedDialogue.lines.length >= 5 && ch.extendedDialogue.lines.length <= 8, 'dialogue lines 5-8');
ok(ch.readingText && isStr(ch.readingText.body) && ch.readingText.body.length >= 200 && ch.readingText.body.length <= 400, 'readingText.body 200-400 chars');
ok(isStr(ch.readingText?.bodyTranslation), 'readingText.bodyTranslation required');
ok(Array.isArray(ch.readingText?.comprehensionQuestions) && ch.readingText.comprehensionQuestions.length >= 2, 'comprehensionQuestions >= 2');
ok(ch.culturalNote && isStr(ch.culturalNote.body), 'culturalNote.body required');
ok(Array.isArray(ch.inlineExercises) && ch.inlineExercises.length >= 8 && ch.inlineExercises.length <= 12, 'inlineExercises 8-12');
ok(ch.summaryCard && Array.isArray(ch.summaryCard.bullets) && ch.summaryCard.bullets.length >= 3, 'summaryCard.bullets >= 3');
ok(ch.writingTask && isStr(ch.writingTask.prompt) && isStr(ch.writingTask.model), 'writingTask{prompt,model} required');
ok(Array.isArray(ch.canDo) && ch.canDo.length >= 3 && ch.canDo.length <= 5 && ch.canDo.every(isStr), 'canDo 3-5 strings');

// ---------- grammar notes ----------
for (const [i, g] of (ch.grammarNotes || []).entries()) {
  const at = `grammarNotes[${i}] "${(g.title || '?').slice(0, 30)}"`;
  // keyPoint is {label, body} in shipped chapters; accept a plain string too
  const keyPointOk = isStr(g.keyPoint) || (g.keyPoint && isStr(g.keyPoint.label) && isStr(g.keyPoint.body));
  ok(isStr(g.title) && isStr(g.func) && keyPointOk, `${at}: title/func/keyPoint required`);
  ok(Array.isArray(g.formTable), `${at}: formTable must be an array (may be empty)`);
  for (const row of g.formTable || []) ok(isStr(row.when) && isStr(row.add) && isStr(row.ex), `${at}: formTable rows need when/add/ex`);
  ok(Array.isArray(g.examples) && g.examples.length >= 3, `${at}: examples >= 3`);
  for (const ex of g.examples || []) ok(isStr(ex.ko) && isStr(ex.en) && isStr(ex.romanization), `${at}: examples need ko/en/romanization`);
  ok(g.drill && isStr(g.drill.instruction) && Array.isArray(g.drill.items) && g.drill.items.length >= 2, `${at}: drill{instruction,items>=2} required`);
  const p = g.englishSpeakerPitfall;
  ok(p && isStr(p.wrong) && isStr(p.right) && isStr(p.explanation), `${at}: englishSpeakerPitfall{wrong,right,explanation} required`);
  if (p && p.wrong === p.right) errors.push(`${at}: pitfall wrong === right`);
}

// ---------- vocabulary ----------
for (const [i, w] of (ch.extendedVocabulary || []).entries()) {
  const at = `vocab[${i}] "${(w.hangul || '?').slice(0, 16)}"`;
  ok(isStr(w.hangul) && isStr(w.romanization) && isStr(w.english) && isStr(w.partOfSpeech), `${at}: hangul/romanization/english/partOfSpeech required`);
  ok(w.exampleSentence && isStr(w.exampleSentence.ko) && isStr(w.exampleSentence.en), `${at}: exampleSentence{ko,en} required`);
}

// ---------- dialogue ----------
const speakers = new Set((ch.extendedDialogue?.lines || []).map((l) => l.speaker));
ok(speakers.size >= 2, 'dialogue needs >= 2 distinct speakers');
for (const [i, l] of (ch.extendedDialogue?.lines || []).entries()) {
  ok(isStr(l.speaker) && isStr(l.ko) && isStr(l.en), `dialogue line ${i}: speaker/ko/en required`);
}

// ---------- inline exercises ----------
const KNOWN = new Set(['multipleChoice', 'particleChoice', 'conjugate', 'orderWords', 'fillBlank', 'errorCorrect']);
const MOVABLE = /(에|에는|에서|에서는|마다|부터|까지|에게|한테|께|같이|하고|이랑|랑)$/;
const bare = (t) => String(t).replace(/[.,!?…'"’”」』)]+$/u, '');
for (const [i, e] of (ch.inlineExercises || []).entries()) {
  const at = `inlineExercises[${i}] (${e.type})`;
  ok(KNOWN.has(e.type), `${at}: unknown type`);
  ok(isStr(e.prompt) && isStr(e.explanation), `${at}: prompt/explanation required`);
  if (Array.isArray(e.options)) {
    ok(e.options.includes(e.correct), `${at}: correct must be one of options`);
    ok(new Set(e.options).size === e.options.length, `${at}: duplicate options`);
    for (const a of e.options) for (const b of e.options) {
      if (a !== b && (String(a).includes(String(b)) || String(b).includes(String(a)))) {
        warns.push(`${at}: containment pair ${a} / ${b} — confirm the prompt disambiguates`);
      }
    }
  }
  if (e.type === 'orderWords') {
    ok(Array.isArray(e.tokens) && e.tokens.join(' ').replace(/\s+/g, ' ').trim() === String(e.correct).replace(/\s+/g, ' ').trim(), `${at}: tokens must rebuild correct`);
    const heads = (e.tokens || []).slice(0, -1).map(bare);
    if (heads.length >= 2 && heads.some((t) => MOVABLE.test(t)) && !/Start with/.test(e.prompt)) {
      errors.push(`${at}: movable adverbial without "(Start with X.)" hint — chapter-54 rule`);
    }
  }
}

// ---------- placeholders / lorem ----------
const raw = JSON.stringify(ch);
for (const bad of ['TODO', 'XXX', 'lorem', 'PLACEHOLDER', '...']) {
  if (bad === '...' ? raw.includes('"..."') : raw.toLowerCase().includes(bad.toLowerCase())) warns.push(`suspicious marker in content: ${bad}`);
}

// ---------- duplication vs shipped chapters ----------
const richDir = join(root, 'scripts', 'rich-chapters');
const titleOwners = new Map();
const exampleOwners = new Map();
for (const f of readdirSync(richDir).filter((f) => f.endsWith('.json') && f !== `chapter-${String(n).padStart(2, '0')}.json`)) {
  const other = JSON.parse(readFileSync(join(richDir, f), 'utf8'));
  for (const g of other.grammarNotes || []) {
    titleOwners.set(g.title, f);
    for (const ex of g.examples || []) exampleOwners.set(ex.ko, f);
  }
}
for (const g of ch.grammarNotes || []) {
  if (titleOwners.has(g.title)) errors.push(`grammar title duplicates ${titleOwners.get(g.title)}: ${g.title}`);
  for (const ex of g.examples || []) {
    if (exampleOwners.has(ex.ko)) errors.push(`example duplicates ${exampleOwners.get(ex.ko)}: ${ex.ko}`);
  }
}

// ---------- new-headword budget (<= 8 per chapter, spec C10) ----------
const dictSets = new Set();
for (const f of ['words.json', 'vocab-extended.json', 'expressions.json', 'newcomer-vocab.json']) {
  try {
    const data = JSON.parse(readFileSync(join(root, 'korean', 'data', f), 'utf8'));
    for (const e of data.entries || []) if (e?.hangul) for (const h of String(e.hangul).split('/')) dictSets.add(h.trim());
  } catch { /* optional source */ }
}
const fresh = (ch.extendedVocabulary || []).filter((w) => !dictSets.has(String(w.hangul).split('/')[0].trim()));
if (fresh.length > 8) errors.push(`new headwords ${fresh.length} > 8: ${fresh.map((w) => w.hangul).join(', ')}`);
else if (fresh.length) console.log(`new headwords (${fresh.length}/8): ${fresh.map((w) => w.hangul).join(', ')}`);

// ---------- verdict ----------
for (const w of warns) console.log('⚠ ' + w);
if (errors.length) {
  for (const e of errors) console.error('✗ ' + e);
  console.error(`validate-rich-chapter: FAIL — ${errors.length} error(s), ${warns.length} warning(s)`);
  process.exit(1);
}
console.log(`validate-rich-chapter: PASS — chapter-${n} (${warns.length} warning(s))`);
