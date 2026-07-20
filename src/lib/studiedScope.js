// What the learner has actually met so far.
//
// Practice used to default to every entry in the app — 3,848 items — so a learner
// three chapters in was drilling words from chapter 60. This narrows the default to
// the chapters they have finished plus the one they are on, which is the honest
// answer to "practise what I'm studying".
//
// There are no accounts, so progress only ever comes from this browser's
// localStorage. Someone on a new device reads as a brand-new learner, and the
// fallbacks below have to stay sensible for that case rather than returning nothing.

function orderedChapters(chapters = []) {
  return chapters.slice().sort((a, b) =>
    (a.curriculumOrder || a.number || 0) - (b.curriculumOrder || b.number || 0)
  );
}

export function studiedChapterIds(chapters = [], progress = new Set()) {
  const ordered = orderedChapters(chapters);
  if (!ordered.length) return [];
  const done = ordered.filter((chapter) => progress.has?.(chapter.id));
  // "Current" is the first unfinished chapter — chapters are never locked, so a
  // learner can complete one out of order without skipping what they left behind.
  const current = ordered.find((chapter) => !progress.has?.(chapter.id));
  const ids = [...done.map((chapter) => chapter.id)];
  if (current) ids.push(current.id);
  return ids.length ? ids : [ordered[0].id];
}

export function studiedEntryIds(chapters = [], progress = new Set()) {
  const byId = new Map(chapters.map((chapter) => [chapter.id, chapter]));
  const ids = [];
  const seen = new Set();
  for (const chapterId of studiedChapterIds(chapters, progress)) {
    const chapter = byId.get(chapterId);
    if (!chapter) continue;
    for (const id of [
      ...(chapter.coreVocabularyIds || []),
      ...(chapter.linkedEntryIds || []),
      ...(chapter.patternIds || []),
    ]) {
      if (!id || seen.has(id)) continue;
      seen.add(id);
      ids.push(id);
    }
  }
  return ids;
}

// Everything taught up to and including one chapter, in teaching order.
// The lesson's conjugation drill used to widen from the chapter's own handful of
// verbs to every word sharing its CEFR level — 401 of them, most from chapters the
// learner has not reached. This keeps the drill inside what has been taught.
export function entryIdsUpToChapter(chapters = [], chapterId = '') {
  const ordered = orderedChapters(chapters);
  const position = ordered.findIndex((chapter) => chapter.id === chapterId);
  if (position < 0) return [];
  const ids = [];
  const seen = new Set();
  for (const chapter of ordered.slice(0, position + 1)) {
    for (const id of [...(chapter.coreVocabularyIds || []), ...(chapter.linkedEntryIds || [])]) {
      if (!id || seen.has(id)) continue;
      seen.add(id);
      ids.push(id);
    }
  }
  return ids;
}

export function studiedLabel(chapters = [], progress = new Set()) {
  const byId = new Map(chapters.map((chapter) => [chapter.id, chapter]));
  const numbers = studiedChapterIds(chapters, progress)
    .map((id) => byId.get(id)?.number)
    .filter((number) => Number.isFinite(number));
  if (!numbers.length) return 'Your chapters';
  const first = Math.min(...numbers);
  const last = Math.max(...numbers);
  return first === last ? `Chapter ${first}` : `Chapters ${first}–${last}`;
}
