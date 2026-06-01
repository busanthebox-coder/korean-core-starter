import { readFileSync, writeFileSync } from 'node:fs';

// Emits korean/data/app-data.json: a single slim bundle for the Svelte app.
// The full per-file JSON stays for the legacy app + audit; here we drop fields the
// new UI never renders (notably the large per-entry `lesson` block) to shrink the build.
const dir = new URL('../korean/data/', import.meta.url);
const read = (f) => JSON.parse(readFileSync(new URL(f, dir), 'utf8'));

// Fields the Svelte UI never reads (verified by grep over src/). Dropping them shrinks the build.
const STRIP = ['lesson', 'formGroupInfo', 'formLinks', 'contextHint', 'learnerPriority', 'activityTags', 'speechLevels', 'adjectiveForms', 'chapterIds', 'category', 'patternInfo', 'studyGuide', 'relatedWordIds'];
const slim = (e) => {
  const c = { ...e };
  for (const k of STRIP) delete c[k];
  return c;
};

const out = {
  words: read('words.json').entries.map(slim),
  newcomerVocab: read('newcomer-vocab.json').entries.map(slim),
  extendedVocab: read('vocab-extended.json').entries.map(slim),
  expressions: read('expressions.json').entries.map(slim),
  patterns: read('patterns.json').entries.map(slim),
  course: read('course.json'),
  grammar: read('grammar.json'),
  activities: read('activities.json'),
  guide: read('guide.json'),
  dialogues: read('dialogues.json'),
  conversations: read('conversations.json'),
};

writeFileSync(new URL('app-data.json', dir), JSON.stringify(out));
const n = out.words.length + out.newcomerVocab.length + out.extendedVocab.length + out.expressions.length + out.patterns.length;
console.log(`Built app-data.json (${n} entries, lesson stripped).`);
