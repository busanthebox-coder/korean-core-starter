import { readFileSync } from 'node:fs';

const files = ['words', 'newcomer-vocab', 'vocab-extended', 'expressions', 'patterns'];
const data = Object.fromEntries(files.map(file => [
  file,
  JSON.parse(readFileSync(new URL(`../korean/data/${file}.json`, import.meta.url), 'utf8')).entries
]));
const course = JSON.parse(readFileSync(new URL('../korean/data/course.json', import.meta.url), 'utf8'));
const grammar = JSON.parse(readFileSync(new URL('../korean/data/grammar.json', import.meta.url), 'utf8'));
const activities = JSON.parse(readFileSync(new URL('../korean/data/activities.json', import.meta.url), 'utf8'));

const entries = files.flatMap(file => data[file]);
const ids = new Set(entries.map(entry => entry.id));
const grammarItems = [...(grammar.grammarItems || []), ...(grammar.endingItems || [])];
const grammarIds = new Set(grammarItems.map(item => item.id));
const chapterIds = new Set((course.chapters || []).map(chapter => chapter.id));
const issues = [];

function issue(id, message) {
  issues.push(`${id}: ${message}`);
}

function hasRomanization(items = []) {
  return items.every(item => item.romanization && item.romanization.length > 1);
}

for (const entry of entries) {
  if (!entry.explanation || entry.explanation.length < 120) issue(entry.id, 'explanation too short');
  if (!entry.learnerPriority || entry.learnerPriority.length < 50) issue(entry.id, 'missing learnerPriority');
  if (!entry.contextHint || entry.contextHint.length < 50) issue(entry.id, 'missing contextHint');
  if (!entry.lesson?.canDo) issue(entry.id, 'missing can-do lesson goal');
  if ((entry.lesson?.beginnerPath || []).length < 3) issue(entry.id, 'needs beginner path');
  if ((entry.lesson?.classroomScript || []).length < 3) issue(entry.id, 'needs classroom/practice script');
  if ((entry.lesson?.miniDialogue || []).length < 3) issue(entry.id, 'needs 3-line mini dialogue');
  if ((entry.lesson?.drills || []).length < 3) issue(entry.id, 'needs 3+ drills');
  if ((entry.lesson?.selfCheck || []).length < 3) issue(entry.id, 'needs 3+ self-checks');
  if (!hasRomanization(entry.usagePhrases || [])) issue(entry.id, 'usage phrase romanization missing');
  if (!hasRomanization(entry.examples || [])) issue(entry.id, 'example romanization missing');
  if ((entry.usagePhrases || []).length < 4) issue(entry.id, 'needs 4+ usage phrases');
  if ((entry.examples || []).length < 3) issue(entry.id, 'needs 3+ examples');
  if (!Array.isArray(entry.chapterIds)) issue(entry.id, 'missing chapterIds');
  if (!Array.isArray(entry.grammarIds)) issue(entry.id, 'missing grammarIds');
  if (!Array.isArray(entry.activityTags)) issue(entry.id, 'missing activityTags');
  if (Array.isArray(entry.chapterIds) && !entry.chapterIds.length) issue(entry.id, 'entry is not linked to a chapter');
  for (const id of entry.chapterIds || []) if (!chapterIds.has(id)) issue(entry.id, `broken chapterIds ${id}`);
  for (const id of entry.grammarIds || []) if (!grammarIds.has(id)) issue(entry.id, `broken grammarIds ${id}`);

  for (const id of entry.relatedPatternIds || []) if (!ids.has(id)) issue(entry.id, `broken relatedPatternIds ${id}`);
  for (const id of entry.relatedWordIds || []) if (!ids.has(id)) issue(entry.id, `broken relatedWordIds ${id}`);
  for (const [key, id] of Object.entries(entry.formLinks || {})) if (!ids.has(id)) issue(entry.id, `broken formLinks.${key} ${id}`);

  const learnerText = [
    entry.hangul,
    entry.romanization,
    entry.english,
    entry.explanation,
    entry.nuance,
    entry.contextHint,
    entry.lesson?.canDo,
    entry.lesson?.teacherNote,
    entry.lesson?.pronunciationTip,
    ...(entry.lesson?.studyFlow || []),
    ...(entry.lesson?.selfCheck || []),
    ...(entry.lesson?.miniDialogue || []).flatMap(line => [line.ko, line.en, line.romanization]),
    ...(entry.lesson?.drills || []).flatMap(item => [item.ko, item.en, item.romanization, item.note]),
    ...(entry.usagePhrases || []).flatMap(item => [item.ko, item.en, item.romanization, item.note]),
    ...(entry.examples || []).flatMap(item => [item.ko, item.en, item.romanization, item.note]),
    ...(entry.commonMistakes || [])
  ].filter(Boolean).join(' ');
  if (/못 가해요/.test(learnerText) && !/not 못 가해요|아니|Do not/.test(learnerText)) issue(entry.id, 'contains bad 못 가해요 example');
  if (/undefined|TODO|placeholder/i.test(learnerText)) issue(entry.id, 'placeholder artifact');
  if (/talk about (eat|go|do|drink|sleep|work|study) in/.test(learnerText)) issue(entry.id, 'awkward can-do wording');
}

if (data.words.length < 80) issue('counts', `expected 80+ words, got ${data.words.length}`);
if (data.expressions.length < 30) issue('counts', `expected 30+ expressions, got ${data.expressions.length}`);
if (data.patterns.length < 20) issue('counts', `expected 20+ patterns, got ${data.patterns.length}`);

const courseIds = [
  'expr-001','expr-002','expr-003','expr-004','expr-006','expr-007','expr-008','expr-009','pattern-001',
  'word-verb-001','word-verb-002','word-verb-003','word-verb-004','word-verb-007','word-verb-015','word-verb-016',
  'pattern-005','pattern-006','pattern-007','pattern-008','pattern-009','pattern-010','pattern-011','pattern-012','pattern-013',
  'pattern-014','pattern-015','pattern-016','pattern-017','pattern-018','pattern-019','pattern-020'
];
for (const id of courseIds) if (!ids.has(id)) issue('course', `missing course id ${id}`);

const beginnerChapters = (course.chapters || []).filter((c) => (c.number || 99) <= 11);
if (beginnerChapters.length !== 11) issue('course', `expected 11 beginner chapters, got ${beginnerChapters.length}`);
for (const chapter of course.chapters || []) {
  // Chapters 12+ are lighter "intermediate" hubs: vocab + grammar + a warm-up dialogue,
  // without the full beginner guided-lesson scaffolding.
  const isIntro = (chapter.number || 99) <= 11;
  const required = isIntro
    ? ['goal', 'dialogue', 'grammarFocus', 'linkedEntryIds', 'guidedPractice', 'realLifeTask', 'review']
    : ['goal', 'dialogue', 'grammarFocus', 'linkedEntryIds'];
  for (const field of required) {
    if (!chapter[field] || (Array.isArray(chapter[field]) && !chapter[field].length)) issue(chapter.id, `missing chapter field ${field}`);
  }
  if ((chapter.dialogue || []).length < 3) issue(chapter.id, 'needs 3-line warm-up dialogue');
  if (isIntro && (chapter.beginnerGuide || []).length < 3) issue(chapter.id, 'needs beginner guide');
  if (isIntro && (chapter.checkpoints || []).length < 3) issue(chapter.id, 'needs checkpoints');
  for (const line of chapter.dialogue || []) {
    if (!line.ko || !line.romanization || !line.en) issue(chapter.id, 'dialogue needs ko/romanization/en');
  }
  for (const id of chapter.linkedEntryIds || []) if (!ids.has(id)) issue(chapter.id, `broken linkedEntryIds ${id}`);
  for (const id of chapter.coreVocabularyIds || []) if (!ids.has(id)) issue(chapter.id, `broken coreVocabularyIds ${id}`);
  for (const id of chapter.patternIds || []) if (!ids.has(id)) issue(chapter.id, `broken patternIds ${id}`);
  for (const id of chapter.grammarFocus || []) if (!grammarIds.has(id)) issue(chapter.id, `broken grammarFocus ${id}`);
}

for (const item of grammarItems) {
  for (const field of ['plainEnglish', 'whenToUse', 'attachmentRule', 'sentenceFrames', 'examples', 'commonMistakes', 'practiceItems']) {
    if (!item[field] || (Array.isArray(item[field]) && !item[field].length)) issue(item.id, `missing grammar field ${field}`);
  }
  if (!item.beginnerExplanation || item.beginnerExplanation.length < 60) issue(item.id, 'missing beginner explanation');
  if ((item.studyOrder || []).length < 3) issue(item.id, 'needs study order');
  if ((item.examples || []).length < 3) issue(item.id, 'needs 3+ grammar examples');
  if ((item.practiceItems || []).length < 3 && item.type === 'particle') issue(item.id, 'needs 3+ grammar practice items');
  if ((item.commonMistakes || []).length < 1) issue(item.id, 'needs 1+ grammar common mistake');
  for (const ex of item.examples || []) if (!ex.ko || !ex.romanization || !ex.en) issue(item.id, 'grammar examples need ko/romanization/en');
}

const requiredActivityTypes = new Set(['recognition', 'fillBlank', 'particleChoice', 'formTransform', 'sentenceBuild']);
for (const chapter of course.chapters || []) {
  if ((chapter.number || 99) > 11) continue; // intermediate hubs use SRS/quizzes, not per-chapter activities
  const group = (activities.chapterActivities || []).find(item => item.chapterId === chapter.id);
  if (!group) {
    issue(chapter.id, 'missing chapter activities');
    continue;
  }
  const types = new Set((group.items || []).map(item => item.type));
  for (const type of requiredActivityTypes) if (!types.has(type)) issue(chapter.id, `missing activity type ${type}`);
  for (const item of group.items || []) {
    if (!item.prompt || !item.answer) issue(chapter.id, `activity ${item.type} missing prompt/answer`);
    if (['recognition', 'particleChoice'].includes(item.type) && (!item.choices || item.choices.length < 4)) issue(chapter.id, `activity ${item.type} needs 4 choices`);
  }
}
for (const group of activities.chapterActivities || []) if (!chapterIds.has(group.chapterId)) issue(group.chapterId, 'activity group points to missing chapter');

if ((data['newcomer-vocab'] || []).length < 10) issue('counts', `expected 10+ newcomer vocab, got ${(data['newcomer-vocab'] || []).length}`);

const guide = JSON.parse(readFileSync(new URL('../korean/data/guide.json', import.meta.url), 'utf8'));
const requiredTracks = ['track-arrival', 'track-transport', 'track-living', 'track-daily'];
const guideTrackIds = new Set((guide.tracks || []).map(track => track.id));
for (const id of requiredTracks) if (!guideTrackIds.has(id)) issue('guide', `missing track ${id}`);
for (const track of guide.tracks || []) {
  if (!(track.units || []).length) issue(track.id, 'track has no units');
  for (const unit of track.units || []) {
    for (const field of ['title', 'situation', 'goal', 'keyPhrases', 'dialogue', 'beginnerGuide', 'checkpoints', 'coreVocabularyIds']) {
      if (!unit[field] || (Array.isArray(unit[field]) && !unit[field].length)) issue(unit.id, `missing guide field ${field}`);
    }
    if ((unit.keyPhrases || []).length < 4) issue(unit.id, 'needs 4+ key phrases');
    if (!hasRomanization(unit.keyPhrases || [])) issue(unit.id, 'key phrase romanization missing');
    if (!hasRomanization(unit.drills || [])) issue(unit.id, 'drill romanization missing');
    if ((unit.dialogue || []).length < 3) issue(unit.id, 'needs 3-line dialogue');
    if ((unit.checkpoints || []).length < 3) issue(unit.id, 'needs 3+ checkpoints');
    for (const line of unit.dialogue || []) {
      if (!line.ko || !line.romanization || !line.en) issue(unit.id, 'dialogue needs ko/romanization/en');
    }
    for (const id of unit.coreVocabularyIds || []) if (!ids.has(id)) issue(unit.id, `broken coreVocabularyIds ${id}`);
    for (const id of unit.linkedEntryIds || []) if (!ids.has(id)) issue(unit.id, `broken linkedEntryIds ${id}`);
    for (const id of unit.grammarFocus || []) if (!grammarIds.has(id)) issue(unit.id, `broken grammarFocus ${id}`);
    for (const link of unit.deepLinks || []) {
      if (!/^https:\/\//.test(link.url || '')) issue(unit.id, `deepLink not https: ${link.label || '?'}`);
      if (!link.label) issue(unit.id, 'deepLink missing label');
    }
  }
}

const dialoguesData = JSON.parse(readFileSync(new URL('../korean/data/dialogues.json', import.meta.url), 'utf8'));
const dialogues = dialoguesData.dialogues || [];
if (dialogues.length < 8) issue('dialogues', `expected 8+ dialogues, got ${dialogues.length}`);
const dialogueIds = new Set();
for (const d of dialogues) {
  if (!d.id) issue('dialogues', 'dialogue missing id');
  if (dialogueIds.has(d.id)) issue(d.id, 'duplicate dialogue id');
  dialogueIds.add(d.id);
  for (const field of ['title', 'situation', 'lines']) {
    if (!d[field] || (Array.isArray(d[field]) && !d[field].length)) issue(d.id || 'dialogue', `missing dialogue field ${field}`);
  }
  if ((d.lines || []).length < 4) issue(d.id || 'dialogue', 'needs 4+ lines');
  for (const line of d.lines || []) {
    if (!line.ko || !line.romanization || !line.en || !line.speaker) issue(d.id || 'dialogue', 'line needs speaker/ko/romanization/en');
  }
}

if (issues.length) {
  console.error(issues.join('\n'));
  process.exit(1);
}

console.log(`Audit passed: ${entries.length} entries, ${data.words.length}/${data.expressions.length}/${data.patterns.length}.`);
