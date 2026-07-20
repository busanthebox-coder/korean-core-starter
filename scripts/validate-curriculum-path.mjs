// Guards the shipped chapter order: difficulty must never step backwards, and a
// chapter's track must agree with its authored level. Both invariants were broken
// before — 12 B1 chapters sat ahead of the past tense, and 21 chapters carried a
// track that disagreed with their level, which is what let an A2-band lesson pull
// B1 vocabulary into its conjugation drill.
const LEVEL_RANK = { A1: 1, A2: 2, B1: 3, B2: 4, 'B2/C1': 5, C1: 5 };

export function validateCurriculumPath(course) {
  const errors = [];
  const chapters = (course?.chapters || []).slice().sort((a, b) =>
    (a.curriculumOrder || a.number || 0) - (b.curriculumOrder || b.number || 0)
  );
  if (!chapters.length) return { ok: true, errors };

  let previous = null;
  for (const chapter of chapters) {
    const label = `chapter ${chapter.number} (${chapter.id})`;
    const rank = LEVEL_RANK[chapter.level];
    if (!rank) {
      errors.push(`${label}: unknown level "${chapter.level}"`);
      continue;
    }
    const trackCefr = chapter.curriculumTrack?.cefr;
    const expectedTrack = chapter.level === 'B2/C1' ? 'C1' : chapter.level;
    if (trackCefr !== expectedTrack) {
      errors.push(`${label}: track ${trackCefr} but level ${chapter.level} — the two must agree`);
    }
    if (previous && rank < LEVEL_RANK[previous.level]) {
      errors.push(`${label}: difficulty drops from ${previous.level} (chapter ${previous.number}) to ${chapter.level}`);
    }
    previous = chapter;
  }

  const positions = chapters.map((chapter) => chapter.number);
  const expected = chapters.map((_, index) => index + 1);
  if (positions.join(',') !== expected.join(',')) {
    errors.push(`chapter numbers are not 1..${chapters.length} in path order`);
  }

  return { ok: errors.length === 0, errors };
}
