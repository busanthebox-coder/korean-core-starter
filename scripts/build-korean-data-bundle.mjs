import { readFileSync, writeFileSync } from 'node:fs';

const dataDir = new URL('../korean/data/', import.meta.url);
const outFile = new URL('../korean/data-bundle.js', import.meta.url);

const files = {
  words: 'words.json',
  newcomerVocab: 'newcomer-vocab.json',
  extendedVocab: 'vocab-extended.json',
  expressions: 'expressions.json',
  patterns: 'patterns.json',
  course: 'course.json',
  grammar: 'grammar.json',
  activities: 'activities.json',
  guide: 'guide.json',
  dialogues: 'dialogues.json'
};

const bundle = Object.fromEntries(
  Object.entries(files).map(([key, file]) => [
    key,
    JSON.parse(readFileSync(new URL(file, dataDir), 'utf8'))
  ])
);

writeFileSync(
  outFile,
  `window.KOREAN_CORE_DATA = ${JSON.stringify(bundle)};\n`,
  'utf8'
);

console.log(`Built Korean data bundle: ${Object.keys(files).length} files.`);
