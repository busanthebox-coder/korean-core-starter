// Single slim bundle built by scripts/build-app-data.mjs (run after generate-korean-data.mjs).
import data from '../../korean/data/app-data.json';

export const entries = [
  ...data.words,
  ...data.newcomerVocab,
  ...data.extendedVocab,
  ...data.expressions,
  ...data.patterns,
].sort((a, b) => (a.sort ?? 0) - (b.sort ?? 0));

const byId = new Map(entries.map((e) => [e.id, e]));
export const findEntry = (id) => byId.get(id) || null;

export const chapters = (data.course.chapters || []).slice().sort((a, b) => a.number - b.number);
export const curriculumGuide = data.course.curriculumGuide || [];
export const functionTags = data.course.functionTags || [];
export const grammar = [...(data.grammar.grammarItems || []), ...(data.grammar.endingItems || [])];
export const findGrammar = (id) => grammar.find((g) => g.id === id) || null;
export const activities = data.activities.chapterActivities || [];
export const guideTracks = data.guide.tracks || [];
export const dialogues = data.dialogues.dialogues || [];
export const conversations = (data.conversations && data.conversations.conversations) || [];
