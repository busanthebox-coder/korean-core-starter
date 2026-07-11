export const PLACEMENT_LEVELS = ['A1', 'A2', 'B1'];
const PASSING = 4;

export function correctByLevel(answers = []) {
  return PLACEMENT_LEVELS.reduce((out, level) => {
    const levelAnswers = answers.filter((answer) => answer.level === level);
    out[level] = {
      correct: levelAnswers.filter((answer) => answer.correct).length,
      total: levelAnswers.length,
    };
    return out;
  }, {});
}

export function nextRound({ currentLevel = 'A1', answers = [] } = {}) {
  const scores = correctByLevel(answers);
  const current = scores[currentLevel] || { correct: 0, total: 0 };
  if (current.total < 5) return { status: 'asking', level: currentLevel };
  if (current.correct < PASSING || currentLevel === 'B1') return { status: 'done' };
  const nextIndex = PLACEMENT_LEVELS.indexOf(currentLevel) + 1;
  return { status: 'round', level: PLACEMENT_LEVELS[nextIndex] || 'B1' };
}

export function placementResult(answers = []) {
  const scores = correctByLevel(answers);
  let recommendedLevel = 'A1';
  if ((scores.A1?.correct || 0) >= PASSING) recommendedLevel = 'A2';
  if ((scores.A2?.correct || 0) >= PASSING) recommendedLevel = 'B1';
  return { recommendedLevel, correctByLevel: scores };
}

export function shouldShowOnboarding({ force = false } = {}) {
  return force;
}

function sortedChapters(chapters = []) {
  return chapters
    .slice()
    .sort((a, b) => (a.curriculumOrder || a.number || 9999) - (b.curriculumOrder || b.number || 9999) || (a.number || 0) - (b.number || 0));
}

export function continueChapter(chapters = [], completedIds = new Set(), startChapterId = '') {
  const saved = chapters.find((chapter) => chapter.id === startChapterId);
  if (saved && !completedIds.has(saved.id)) return saved;
  const ordered = sortedChapters(chapters);
  return ordered.find((chapter) => !completedIds.has(chapter.id)) || ordered[ordered.length - 1] || null;
}
