import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';

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

export function buildKoreanDataBundle() {
  const bundle = Object.fromEntries(
    Object.entries(files).map(([key, file]) => [
      key,
      JSON.parse(readFileSync(new URL(file, dataDir), 'utf8'))
    ])
  );
  const appDataFile = new URL('app-data.json', dataDir);
  if (!existsSync(appDataFile)) {
    throw new Error('Missing korean/data/app-data.json; run node scripts/build-app-data.mjs before building the legacy bundle.');
  }
  const appData = JSON.parse(readFileSync(appDataFile, 'utf8'));
  bundle.vocabPacks = appData.vocabPacks || [];
  bundle.readers = appData.readers || [];

  writeFileSync(
    outFile,
    `window.KOREAN_CORE_DATA = ${JSON.stringify(bundle)};\n`,
    'utf8'
  );

  console.log(`Built Korean data bundle: ${Object.keys(files).length} files.`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  buildKoreanDataBundle();
}
