#!/usr/bin/env node
// Renumbers course.json chapters to the study order in curriculum-path.json.
//
// Touches only the ordering fields — number, curriculumOrder, curriculumTrack,
// prerequisiteChapterIds — and never the chapter's content or its `level`.
// `level` is the authored content difficulty and stays the source of truth;
// the track is derived from it, so the two can no longer drift apart (they were
// out of step on 21 of 65 chapters, which let A2-band chapters pull B1 words).
//
// Safe to re-run: it is a pure function of curriculum-path.json + course.json.
import { readFileSync, writeFileSync } from 'node:fs';

const dataDir = new URL('../korean/data/', import.meta.url);
const readJson = (url) => JSON.parse(readFileSync(url, 'utf8'));

const TRACKS = {
  A1: { id: 'a1-foundation', cefr: 'A1', label: 'A1 Foundation', description: 'Hangul, survival sentences, particles, polite present, and daily actions.' },
  A2: { id: 'a2-builder', cefr: 'A2', label: 'A2 Builder', description: 'Tense, questions, numbers, modifiers, connectors, particles, counters, and repair chapters.' },
  B1: { id: 'b1-independent', cefr: 'B1', label: 'B1 Independent Korean', description: 'Discourse, reported speech, honorifics, observation, social domains, and longer explanations.' },
  B2: { id: 'b2-advanced-control', cefr: 'B2', label: 'B2 Advanced Control', description: 'Causatives, counterfactuals, nominalisation, attitude endings, discourse control, and register switching.' },
  C1: { id: 'c1-written-synthesis', cefr: 'C1', label: 'C1 Written & Synthesis', description: 'Formal writing, internet register awareness, and whole-course production checks.' },
};
// The closing review chapter is authored 'B2/C1'; it belongs to the written/synthesis track.
const trackForLevel = (level) => TRACKS[level] || TRACKS.C1;

// The tone overrides are authored per chapter but keyed by the chapter's ORIGINAL
// number, and `chapter-NN`'s id preserves exactly that number. The old sequencer looked
// them up by the displayed number instead, so once chapters were renumbered every
// override landed on the wrong chapter: "Past Tense" was advertised as "Choose a speech
// level…", and the future-tense chapter opened with a past-tense warm-up. Re-keying by id
// puts all six authored fields back on the chapter they were written for.
const overrideId = (entry) => `chapter-${String(entry.number).padStart(2, '0')}`;

function applyToneOverride(chapter, override) {
  if (!override) return chapter;
  const next = { ...chapter };
  for (const field of ['goal', 'scenario', 'dialogue', 'realLifeTask', 'checkpoints']) {
    if (override[field] !== undefined) next[field] = override[field];
  }
  // exitTask is derived from those fields, so it has to be rebuilt alongside them.
  const sampleAnswer = override.exitTask?.sampleAnswer
    || chapter.exitTask?.sampleAnswer
    || { ko: '이 표현을 실제 상황에서 사용할 수 있어요.', romanization: 'i pyohyeoneul silje sanghwangeseo sayonghal su isseoyo.', en: String(next.goal || next.title || '').split('.')[0] };
  next.exitTask = {
    ...chapter.exitTask,
    canDo: next.goal || chapter.exitTask?.canDo,
    prompt: next.realLifeTask || next.scenario || chapter.exitTask?.prompt || `Use ${chapter.title} in one real sentence.`,
    sampleAnswer,
    checklist: [...new Set([
      ...((next.checkpoints || []).slice(0, 4)),
      'Make it about your real day: your name, place, time, or plan.',
      'Keep the first version short before you make it longer.',
      'Say it once out loud, then fix one word or ending if it feels off.',
    ])].slice(0, 5),
  };
  return next;
}

export function applyCurriculumPath(course, pathSpec, toneOverrides = []) {
  const byId = new Map((course.chapters || []).map((chapter) => [chapter.id, chapter]));
  const orderedIds = pathSpec.path.map((step) => step.id);

  const missing = orderedIds.filter((id) => !byId.has(id));
  if (missing.length) throw new Error(`curriculum-path references unknown chapters: ${missing.join(', ')}`);
  const unlisted = [...byId.keys()].filter((id) => !orderedIds.includes(id));
  if (unlisted.length) throw new Error(`curriculum-path is missing chapters: ${unlisted.join(', ')}`);
  const duplicates = orderedIds.filter((id, index) => orderedIds.indexOf(id) !== index);
  if (duplicates.length) throw new Error(`curriculum-path lists chapters twice: ${duplicates.join(', ')}`);

  const overrideById = new Map(toneOverrides.map((entry) => [overrideId(entry), entry]));
  const unmatched = [...overrideById.keys()].filter((id) => !byId.has(id));
  if (unmatched.length) throw new Error(`tone overrides target unknown chapters: ${unmatched.join(', ')}`);

  const chapters = orderedIds.map((id, index) => {
    const chapter = applyToneOverride(byId.get(id), overrideById.get(id));
    const position = index + 1;
    // Prerequisites are the two chapters immediately before — the same rule the
    // previous sequencer used, recomputed for the new positions.
    const prerequisiteChapterIds = [orderedIds[index - 1], orderedIds[index - 2]].filter(Boolean);
    return {
      ...chapter,
      number: position,
      curriculumOrder: position,
      curriculumTrack: trackForLevel(chapter.level),
      prerequisiteChapterIds,
    };
  });

  return { ...course, curriculumTracks: Object.values(TRACKS), chapters };
}

if (process.argv[1] && import.meta.url.endsWith(process.argv[1].split('/').pop())) {
  const course = readJson(new URL('course.json', dataDir));
  const pathSpec = readJson(new URL('../scripts/curriculum-path.json', import.meta.url));
  const toneOverrides = readJson(new URL('../scripts/curriculum-chapter-tone-overrides.json', import.meta.url));
  const before = new Map(course.chapters.map((c) => [c.id, c.number]));
  const beforeGoal = new Map(course.chapters.map((c) => [c.id, c.goal]));
  const next = applyCurriculumPath(course, pathSpec, toneOverrides);
  const regoaled = next.chapters.filter((c) => beforeGoal.get(c.id) !== c.goal);
  console.log(`Re-keyed tone overrides by chapter id: ${regoaled.length} chapters got their own goal back.`);

  const moved = next.chapters.filter((c) => before.get(c.id) !== c.number);
  writeFileSync(new URL('course.json', dataDir), JSON.stringify(next, null, 2) + '\n', 'utf8');
  console.log(`Applied curriculum path: ${next.chapters.length} chapters, ${moved.length} moved.`);
  for (const chapter of moved.slice(0, 12)) {
    console.log(`  ${String(before.get(chapter.id)).padStart(2)} → ${String(chapter.number).padStart(2)}  ${chapter.level.padEnd(5)} ${chapter.title.slice(0, 44)}`);
  }
  if (moved.length > 12) console.log(`  … and ${moved.length - 12} more`);
}
