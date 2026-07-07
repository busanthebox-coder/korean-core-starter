import { correctOf } from './inlineExercise.js';
import { curriculumSortValue } from './curriculumStructure.js';

export const CHECKPOINT_COUNT = 20;
export const CHECKPOINT_MAX_PER_CHAPTER = 2;
export const CHECKPOINT_TRACK_LIMIT = 3;
export const SPIRAL_RATE = 0.2;
export const SPIRAL_LOOKBACK = 3;

const CHECKPOINT_PREFIX = 'checkpoint';
const TRACK_SHORT_LABEL = {
  'a1-foundation': 'A1',
  'a2-builder': 'A2',
  'b1-independent': 'B1',
};

export function seededRng(seed = '') {
  let hash = 2166136261;
  for (const char of String(seed)) {
    hash ^= char.charCodeAt(0);
    hash = Math.imul(hash, 16777619);
  }
  return () => {
    hash += 0x6d2b79f5;
    let value = hash;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

function sortedChapters(chapters = []) {
  return chapters
    .slice()
    .sort((a, b) => curriculumSortValue(a) - curriculumSortValue(b) || (a.number || 0) - (b.number || 0));
}

function slotId(trackId) {
  return `${CHECKPOINT_PREFIX}-${trackId}`;
}

function trackLabel(track) {
  if (!track?.id) return 'Review';
  return TRACK_SHORT_LABEL[track.id] || (track.label || track.id).split(/\s+/)[0];
}

export function checkpointSlots(chapters = []) {
  const groups = [];
  for (const chapter of sortedChapters(chapters)) {
    const track = chapter.curriculumTrack;
    if (!track?.id) continue;
    const current = groups[groups.length - 1];
    if (!current || current.trackId !== track.id) {
      groups.push({ trackId: track.id, track, chapters: [chapter] });
    } else {
      current.chapters.push(chapter);
    }
  }
  return groups.slice(0, CHECKPOINT_TRACK_LIMIT).map((group) => {
    const last = group.chapters[group.chapters.length - 1];
    const shortLabel = trackLabel(group.track);
    return {
      id: slotId(group.trackId),
      trackId: group.trackId,
      track: shortLabel,
      title: `${shortLabel} Checkpoint`,
      subtitle: 'A 20-question review of this track.',
      afterChapterId: last?.id || '',
      afterChapterNumber: last?.number || 0,
      chapterIds: group.chapters.map((chapter) => chapter.id),
    };
  });
}

function withSource(exercise, chapter, index) {
  return {
    ...exercise,
    checkpointExerciseId: `${chapter.id}:${index}`,
    sourceChapterId: chapter.id,
    sourceChapterNumber: chapter.number,
    sourceChapterTitle: chapter.title,
  };
}

function shuffle(items, rng) {
  const next = items.slice();
  for (let index = next.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(rng() * (index + 1));
    [next[index], next[swapIndex]] = [next[swapIndex], next[index]];
  }
  return next;
}

export function checkpointPool(chapters = [], slot) {
  const chapterIds = new Set(slot?.chapterIds || []);
  return sortedChapters(chapters)
    .filter((chapter) => chapterIds.has(chapter.id))
    .flatMap((chapter) => (chapter.inlineExercises || []).map((exercise, index) => withSource(exercise, chapter, index)));
}

export function sampleCheckpointExercises(chapters = [], slot, options = {}) {
  const count = options.count ?? CHECKPOINT_COUNT;
  const maxPerChapter = options.maxPerChapter ?? CHECKPOINT_MAX_PER_CHAPTER;
  const rng = options.rng || Math.random;
  const pool = shuffle(checkpointPool(chapters, slot), rng);
  const selected = [];
  const perChapter = {};

  function canUse(exercise, strictType = true) {
    if (!correctOf(exercise)) return false;
    if ((perChapter[exercise.sourceChapterId] || 0) >= maxPerChapter) return false;
    if (strictType && selected[selected.length - 1]?.type === exercise.type) return false;
    return !selected.some((item) => item.checkpointExerciseId === exercise.checkpointExerciseId);
  }

  while (selected.length < count) {
    const exercise = pool.find((item) => canUse(item, true)) || pool.find((item) => canUse(item, false));
    if (!exercise) break;
    selected.push(exercise);
    perChapter[exercise.sourceChapterId] = (perChapter[exercise.sourceChapterId] || 0) + 1;
  }

  return selected;
}

export function weakChapterSummary(results = []) {
  const byChapter = {};
  for (const result of results) {
    if (!result?.sourceChapterId) continue;
    const current = byChapter[result.sourceChapterId] || {
      chapterId: result.sourceChapterId,
      number: result.sourceChapterNumber,
      title: result.sourceChapterTitle,
      total: 0,
      wrong: 0,
    };
    current.total += 1;
    if (!result.correct) current.wrong += 1;
    byChapter[result.sourceChapterId] = current;
  }
  return Object.values(byChapter)
    .filter((item) => item.wrong > 0)
    .map((item) => ({ ...item, accuracy: Math.round(((item.total - item.wrong) / item.total) * 100) }))
    .sort((a, b) => b.wrong - a.wrong || a.accuracy - b.accuracy || a.number - b.number);
}

export function previousChapters(chapters = [], chapter, lookback = SPIRAL_LOOKBACK) {
  const ordered = sortedChapters(chapters);
  const index = ordered.findIndex((item) => item.id === chapter?.id);
  if (index < lookback) return [];
  return ordered.slice(Math.max(0, index - lookback), index);
}

export function pickSpiralReviewExercise(chapters = [], chapter, options = {}) {
  const rng = options.rng || Math.random;
  const prior = previousChapters(chapters, chapter, options.lookback ?? SPIRAL_LOOKBACK);
  const pool = prior.flatMap((item) => (item.inlineExercises || []).map((exercise, index) => withSource(exercise, item, index)));
  const candidates = pool.filter((exercise) => correctOf(exercise));
  if (!candidates.length) return null;
  const picked = candidates[Math.floor(rng() * candidates.length)];
  return { ...picked, isSpiralReview: true };
}

export function maybeInsertSpiralReview(screens = [], chapters = [], chapter, options = {}) {
  const rate = options.rate ?? SPIRAL_RATE;
  const rng = options.rng || Math.random;
  if (!chapter || rng() >= rate) return screens;
  const review = pickSpiralReviewExercise(chapters, chapter, { ...options, rng });
  if (!review) return screens;
  const lastExerciseIndex = screens.reduce((last, screen, index) => (
    screen.phase === 'practice' && screen.kind === 'exercise' ? index : last
  ), -1);
  const insertAt = lastExerciseIndex >= 0 ? lastExerciseIndex + 1 : screens.length;
  return [
    ...screens.slice(0, insertAt),
    { phase: 'practice', kind: 'exercise', data: review },
    ...screens.slice(insertAt),
  ];
}
