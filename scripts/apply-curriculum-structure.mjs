import { readFileSync, writeFileSync } from 'node:fs';

const dataDir = new URL('../korean/data/', import.meta.url);
const readJson = (file) => JSON.parse(readFileSync(new URL(file, dataDir), 'utf8'));
const readLocalJson = (file) => JSON.parse(readFileSync(new URL(file, import.meta.url), 'utf8'));
const writeJson = (file, value) => writeFileSync(new URL(file, dataDir), `${JSON.stringify(value, null, 2)}\n`);
const unique = (items = []) => [...new Set(items.filter(Boolean))];

const tracks = {
  a1: { id: 'a1-foundation', cefr: 'A1', label: 'A1 Foundation', description: 'Hangul, survival sentences, particles, polite present, and daily actions.' },
  a2: { id: 'a2-builder', cefr: 'A2', label: 'A2 Builder', description: 'Tense, questions, numbers, modifiers, connectors, particles, counters, and repair chapters.' },
  b1: { id: 'b1-independent', cefr: 'B1', label: 'B1 Independent Korean', description: 'Discourse, reported speech, honorifics, observation, social domains, and longer explanations.' },
  b2: { id: 'b2-advanced-control', cefr: 'B2', label: 'B2 Advanced Control', description: 'Causatives, counterfactuals, nominalisation, attitude endings, discourse control, and register switching.' },
  c1: { id: 'c1-written-synthesis', cefr: 'C1', label: 'C1 Written & Synthesis', description: 'Formal writing, internet register awareness, and whole-course production checks.' },
};

const order = [
  1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11,
  17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32,
  41, 42, 43, 44, 45, 46, 47,
  12, 13, 14, 15, 16, 33, 34, 35, 36, 37, 38, 39, 40, 48, 49, 50, 51, 52, 53, 54, 55, 56,
  57, 58, 59, 60, 61, 62, 64,
  63, 65,
];

const grammarFocus = {
  17: ['grammar-tense-past'],
  18: ['grammar-tense-future'],
  19: ['grammar-question-words'],
  20: ['grammar-foundation-numbers-sino', 'grammar-foundation-numbers-native', 'grammar-foundation-time-date', 'grammar-foundation-counters'],
  21: ['grammar-modifier-nl'],
  22: ['grammar-compare-boda'],
  23: ['grammar-particle-ro-euro'],
  24: ['grammar-ending-try', 'grammar-ending-request', 'grammar-ending-permission'],
  25: ['grammar-connector-context', 'grammar-ending-neunde-soft'],
  26: ['grammar-ending-nabwa', 'grammar-ending-geot-gata', 'grammar-ending-tende'],
  27: ['grammar-tense-progressive'],
  28: ['grammar-time-after', 'grammar-connector-jamaja', 'grammar-connector-gonaseo'],
  29: ['grammar-ending-daga', 'grammar-resultant-eo-itda'],
  30: ['grammar-connector-eoseo', 'grammar-connector-barame'],
  31: ['grammar-purpose-wihaeseo', 'grammar-time-before', 'grammar-particle-buteo-kkaji'],
  32: ['grammar-ending-giro-hada', 'grammar-ending-ge-doeda', 'grammar-passive-eojida'],
  33: ['grammar-speech-levels', 'grammar-banmal'],
  34: ['grammar-honorific-si', 'grammar-honorific-words'],
  35: ['grammar-connector-context', 'grammar-ending-jana', 'grammar-ending-geodeun', 'grammar-ending-neunde-soft'],
  36: ['grammar-ending-deorago', 'grammar-ending-deoni'],
  37: ['grammar-indirect-statement', 'grammar-indirect-question'],
  38: ['grammar-modifier-nl', 'grammar-passive', 'grammar-causative'],
  39: ['grammar-ending-l-ppeon', 'grammar-particle-man'],
  40: ['grammar-ending-eulgeol', 'grammar-ending-geot-gata', 'grammar-ending-nabwa', 'grammar-connector-if'],
  41: ['grammar-irregular-verbs-catalog', 'grammar-irregular-stems'],
  42: ['grammar-particle-ege-hante', 'grammar-particle-do', 'grammar-particle-man', 'grammar-particle-ui'],
  43: ['grammar-foundation-counters', 'grammar-counter', 'grammar-numbers-native', 'grammar-numbers-sino'],
  44: ['grammar-sound-liaison', 'grammar-sound-tensification', 'grammar-sound-nasalization', 'grammar-sound-aspiration'],
  45: ['grammar-negation-short', 'grammar-ending-mot'],
  46: ['grammar-copula-ida'],
  47: ['grammar-honorific-si', 'grammar-honorific-words'],
  48: ['grammar-ending-request', 'grammar-connector-barame', 'grammar-connector-eoseo', 'grammar-tense-progressive'],
  49: ['grammar-particle-e', 'grammar-particle-eseo', 'grammar-modifier-nl', 'grammar-ending-nota-duda'],
  50: ['grammar-ending-nabwa', 'grammar-ending-neunde-soft', 'grammar-connector-if', 'grammar-connector-barame'],
  51: ['grammar-ending-try', 'grammar-ending-geotgatda', 'grammar-modifier-nl', 'grammar-compare-boda'],
  52: ['grammar-particle-ro-euro', 'grammar-connector-eoseo', 'grammar-connector-if', 'grammar-connector-barame'],
  53: ['grammar-ending-geot-gata', 'grammar-indirect-statement', 'grammar-ending-neunde-soft', 'grammar-ending-geodeun'],
  54: ['grammar-ending-request', 'grammar-ending-giro-hada', 'grammar-ending-eulsurok', 'grammar-time-before'],
  55: ['grammar-particle-ro-euro', 'grammar-connector-if', 'grammar-connector-barame'],
  56: ['grammar-ending-jana', 'grammar-ending-geodeun', 'grammar-ending-neunde-soft'],
  57: ['grammar-causative'],
  58: ['grammar-advanced-get', 'grammar-ending-tende', 'grammar-tense-future'],
  59: ['grammar-counterfactual-conditionals', 'grammar-connector-if'],
  60: ['grammar-nominalization-gi-geot', 'grammar-time-before'],
  61: ['grammar-ending-neyo', 'grammar-ending-eulgeol', 'grammar-ending-tende'],
  62: ['grammar-particle-eun-neun', 'grammar-particle-i-ga'],
  63: ['grammar-written-connectors'],
  64: ['grammar-internet-language'],
  65: ['grammar-production-checklist', 'grammar-written-connectors', 'grammar-particle-eun-neun'],
};

const newGrammarItems = readLocalJson('curriculum-grammar-extras.json');
const chapterToneOverrides = new Map(readLocalJson('curriculum-chapter-tone-overrides.json').map((chapter) => [chapter.number, chapter]));

function trackFor(number) {
  if (number <= 11) return tracks.a1;
  if ((number >= 17 && number <= 32) || (number >= 41 && number <= 47)) return tracks.a2;
  if ((number >= 12 && number <= 16) || (number >= 33 && number <= 56)) return tracks.b1;
  if ((number >= 57 && number <= 62) || number === 64) return tracks.b2;
  return tracks.c1;
}

function sampleAnswer(chapter) {
  const line = (chapter.dialogue || []).find((item, index) => index > 0 && item.ko) || (chapter.dialogue || []).find((item) => item.ko);
  if (line) return { ko: line.ko, romanization: line.romanization || '', en: line.en || '' };
  const first = String(chapter.goal || chapter.title || 'I can use this chapter.').split('.')[0];
  return { ko: '이 표현을 실제 상황에서 사용할 수 있어요.', romanization: 'i pyohyeoneul silje sanghwangeseo sayonghal su isseoyo.', en: first };
}

function taskFor(chapter, explicitTask = {}) {
  return {
    canDo: explicitTask.canDo || chapter.goal,
    prompt: explicitTask.prompt || chapter.realLifeTask || chapter.scenario || `Use ${chapter.title} in one real sentence.`,
    sampleAnswer: explicitTask.sampleAnswer || sampleAnswer(chapter),
    checklist: unique([
      ...((explicitTask.checklist || chapter.checkpoints || []).slice(0, 4)),
      'Make it about your real day: your name, place, time, or plan.',
      'Keep the first version short before you make it longer.',
      'Say it once out loud, then fix one word or ending if it feels off.',
    ]).slice(0, 5),
  };
}

function layersFor(chapter) {
  const core = unique(chapter.coreVocabularyIds || []);
  const expand = unique([...(chapter.linkedEntryIds || []), ...(chapter.patternIds || [])].filter((id) => !core.includes(id)));
  return [
    { id: 'core', label: 'Core', purpose: 'Start here: these are the words and patterns you need for the main sentence.', minutes: 20, itemIds: core },
    { id: 'expand', label: 'Expand', purpose: 'Use these next so the same grammar works in more real situations.', minutes: 15, itemIds: expand },
    { id: 'reference', label: 'Reference', purpose: 'Open these when a sentence feels confusing or you want to check the rule.', minutes: 5, grammarIds: unique(chapter.grammarFocus || []) },
  ];
}

const course = readJson('course.json');
const orderIndex = new Map(order.map((number, index) => [number, index + 1]));
const chapterByNumber = new Map((course.chapters || []).map((chapter) => [chapter.number, chapter]));
const orderedIds = order.map((number) => chapterByNumber.get(number)?.id).filter(Boolean);
const idAt = (index) => orderedIds[index] || null;
const orderPosition = (number) => orderIndex.get(number) || number + 1000;

course.curriculumTracks = Object.values(tracks);
course.chapters = (course.chapters || []).map((chapter) => {
  const override = chapterToneOverrides.get(chapter.number) || {};
  const source = { ...chapter, ...override };
  const position = orderPosition(chapter.number);
  const prior = unique([idAt(position - 2), idAt(position - 3)]).filter((id) => id && id !== chapter.id);
  const nextGrammarFocus = unique([...(grammarFocus[source.number] || []), ...(source.grammarFocus || [])]);
  const updated = {
    ...source,
    // Display "Chapter N" follows the curriculum sequence (order[]), so the visible
    // numbers run 1..65 in study order. (id stays stable; run once on original-numbered course.json.)
    number: position,
    level: source.level || trackFor(source.number).cefr,
    curriculumOrder: position,
    curriculumTrack: trackFor(source.number),
    grammarFocus: nextGrammarFocus,
    prerequisiteChapterIds: prior,
  };
  return {
    ...updated,
    learningLayers: layersFor(updated),
    exitTask: taskFor(updated, override.exitTask),
  };
});

const grammar = readJson('grammar.json');
for (const item of newGrammarItems) {
  const next = {
    ...item,
    romanization: item.romanization || item.hangul,
    whenToUse: item.whenToUse || item.plainEnglish,
    attachmentRule: item.attachmentRule || 'Use the chapter examples first, then check the sentence frame before producing your own sentence.',
    contrastWith: item.contrastWith || 'Compare with the nearest earlier grammar card before choosing this form.',
    sentenceFrames: item.sentenceFrames?.length ? item.sentenceFrames : [item.hangul],
    examples: item.examples || [],
    commonMistakes: item.commonMistakes || ['Do not use this form outside the register or situation taught in the chapter.'],
    practiceItems: item.practiceItems || [],
    beginnerExplanation: item.beginnerExplanation || item.plainEnglish,
    studyOrder: item.studyOrder || ['Read the chapter example.', 'Identify the sentence part that changes.', 'Make one controlled sentence.', 'Check register and listener.'],
  };
  const existing = [...(grammar.grammarItems || []), ...(grammar.endingItems || [])].find((grammarItem) => grammarItem.id === item.id);
  if (existing) Object.assign(existing, next);
  else grammar.endingItems.push(next);
}

writeJson('course.json', course);
writeJson('grammar.json', grammar);
