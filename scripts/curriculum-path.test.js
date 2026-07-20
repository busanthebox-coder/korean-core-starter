import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { applyCurriculumPath } from './apply-curriculum-path.mjs';
import { validateCurriculumPath } from './validate-curriculum-path.mjs';

const readJson = (path) => JSON.parse(readFileSync(new URL(path, import.meta.url), 'utf8'));
const pathSpec = readJson('./curriculum-path.json');
const course = readJson('../korean/data/course.json');

const LEVEL_RANK = { A1: 1, A2: 2, B1: 3, B2: 4, 'B2/C1': 5, C1: 5 };

describe('curriculum path', () => {
  it('covers every chapter exactly once', () => {
    const ids = pathSpec.path.map((step) => step.id);
    expect(ids).toHaveLength(course.chapters.length);
    expect(new Set(ids).size).toBe(ids.length);
    expect(new Set(ids)).toEqual(new Set(course.chapters.map((c) => c.id)));
  });

  it('records why every chapter sits where it does', () => {
    for (const step of pathSpec.path) expect(step.why, step.id).toBeTruthy();
  });

  // The bug this file exists to prevent: reported speech used to be taught four
  // chapters before the past tense it is built out of.
  it('never lets difficulty go backwards along the path', () => {
    const byId = new Map(course.chapters.map((c) => [c.id, c]));
    const ranks = pathSpec.path.map((step) => ({ id: step.id, rank: LEVEL_RANK[byId.get(step.id)?.level] }));
    for (const step of ranks) expect(step.rank, step.id).toBeGreaterThan(0);
    for (let i = 1; i < ranks.length; i += 1) {
      expect(ranks[i].rank, `${ranks[i].id} after ${ranks[i - 1].id}`).toBeGreaterThanOrEqual(ranks[i - 1].rank);
    }
  });

  it('teaches past tense before anything that needs it', () => {
    const position = (id) => pathSpec.path.findIndex((step) => step.id === id) + 1;
    const pastTense = course.chapters.find((c) => /Past Tense/i.test(c.title));
    const reported = course.chapters.find((c) => /^Reported Speech/i.test(c.title));
    expect(position(pastTense.id)).toBeLessThan(position(reported.id));
    // It is the first thing after the A1 band, not something you meet two thirds in.
    expect(position(pastTense.id)).toBe(12);
  });
});

describe('applyCurriculumPath', () => {
  const applied = applyCurriculumPath(course, pathSpec);

  it('numbers chapters 1..N in path order and keeps ids stable', () => {
    expect(applied.chapters.map((c) => c.number)).toEqual(applied.chapters.map((_, i) => i + 1));
    expect(applied.chapters.map((c) => c.id)).toEqual(pathSpec.path.map((s) => s.id));
    // Saved progress is keyed by id, so the set of ids must survive untouched.
    expect(new Set(applied.chapters.map((c) => c.id))).toEqual(new Set(course.chapters.map((c) => c.id)));
  });

  it('derives the track from the authored level so the two cannot drift', () => {
    for (const chapter of applied.chapters) {
      const expected = chapter.level === 'B2/C1' ? 'C1' : chapter.level;
      expect(chapter.curriculumTrack.cefr, chapter.id).toBe(expected);
    }
  });

  it('leaves chapter content alone', () => {
    const before = new Map(course.chapters.map((c) => [c.id, c]));
    for (const chapter of applied.chapters) {
      const original = before.get(chapter.id);
      expect(chapter.title).toBe(original.title);
      expect(chapter.level).toBe(original.level);
      expect(chapter.grammarNotes).toEqual(original.grammarNotes);
    }
  });

  it('points prerequisites at the two chapters immediately before', () => {
    expect(applied.chapters[0].prerequisiteChapterIds).toEqual([]);
    expect(applied.chapters[5].prerequisiteChapterIds).toEqual([
      applied.chapters[4].id,
      applied.chapters[3].id,
    ]);
  });

  it('refuses a path that drops or repeats a chapter', () => {
    expect(() => applyCurriculumPath(course, { path: pathSpec.path.slice(1) })).toThrow(/missing chapters/);
    expect(() => applyCurriculumPath(course, { path: [...pathSpec.path, pathSpec.path[0]] })).toThrow(/twice/);
    expect(() => applyCurriculumPath(course, { path: [{ id: 'chapter-999' }] })).toThrow(/unknown chapters/);
  });
});

describe('tone overrides re-keyed by chapter id', () => {
  const toneOverrides = readJson('./curriculum-chapter-tone-overrides.json');
  const applied = applyCurriculumPath(course, pathSpec, toneOverrides);
  const byId = new Map(applied.chapters.map((c) => [c.id, c]));

  // Every override is authored for chapter-NN and was landing on whatever chapter
  // happened to sit at display position N — so the past-tense chapter advertised
  // "Choose a speech level…" and the future chapter opened with a past-tense warm-up.
  it('puts each authored goal back on the chapter it was written for', () => {
    for (const override of toneOverrides) {
      const id = `chapter-${String(override.number).padStart(2, '0')}`;
      expect(byId.get(id)?.goal, id).toBe(override.goal);
    }
  });

  it('fixes the two chapters that made the mismatch obvious', () => {
    expect(byId.get('chapter-17').title).toMatch(/Past Tense/);
    expect(byId.get('chapter-17').goal).toMatch(/yesterday/i);
    expect(byId.get('chapter-18').title).toMatch(/Future/);
    expect(byId.get('chapter-18').dialogue.map((l) => l.ko).join(' ')).toMatch(/거예요/);
  });

  it('rebuilds the exit task from the restored goal', () => {
    const chapter = byId.get('chapter-17');
    expect(chapter.exitTask.canDo).toBe(chapter.goal);
    expect(chapter.exitTask.checklist.length).toBeGreaterThanOrEqual(3);
    expect(chapter.exitTask.sampleAnswer?.ko).toBeTruthy();
  });

  it('refuses overrides that point at a chapter that does not exist', () => {
    expect(() => applyCurriculumPath(course, pathSpec, [{ number: 99, goal: 'x' }])).toThrow(/unknown chapters/);
  });
});

describe('validateCurriculumPath', () => {
  it('passes on the shipped course', () => {
    expect(validateCurriculumPath(course).errors).toEqual([]);
  });

  it('catches a chapter whose track no longer matches its level', () => {
    const broken = { ...course, chapters: course.chapters.map((c, i) => (i === 20 ? { ...c, curriculumTrack: { ...c.curriculumTrack, cefr: 'C1' } } : c)) };
    expect(validateCurriculumPath(broken).errors.join(' ')).toMatch(/track C1 but level/);
  });

  it('catches difficulty going backwards in the shipped order', () => {
    // Swap a B2 chapter into an A2 slot — position and order both, so the
    // sequence stays 1..65 and only the difficulty invariant is violated.
    const swapped = course.chapters.map((c) => ({ ...c }));
    const hard = swapped.find((c) => c.level === 'B2');
    const easy = swapped.find((c) => c.level === 'A2');
    [hard.number, easy.number] = [easy.number, hard.number];
    [hard.curriculumOrder, easy.curriculumOrder] = [easy.curriculumOrder, hard.curriculumOrder];
    expect(validateCurriculumPath({ ...course, chapters: swapped }).errors.join(' ')).toMatch(/difficulty drops/);
  });
});
