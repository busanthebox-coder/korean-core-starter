export function dayKey(date = new Date()) {
  const local = new Date(date);
  const year = local.getFullYear();
  const month = String(local.getMonth() + 1).padStart(2, '0');
  const day = String(local.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function spokeToday(spoken = {}, chapterId = '', today = dayKey()) {
  return Boolean(chapterId && (spoken[chapterId] || []).includes(today));
}

export function buildTodayPlan({ dueCount = 0, currentChapter = null, chapterStarted = false, spoken = {}, today = dayKey() } = {}) {
  const steps = [];
  if (dueCount > 0) {
    steps.push({ kind: 'review', label: `Review ${dueCount} due`, target: '/practice?review=1&today=1' });
  }
  if (currentChapter) {
    const verb = chapterStarted ? 'Continue' : 'Start';
    steps.push({ kind: 'lesson', label: `${verb} Chapter ${currentChapter.number}`, target: currentChapter.id });
    if (!spokeToday(spoken, currentChapter.id, today)) {
      steps.push({ kind: 'sayit', label: 'Say 3 useful lines', target: currentChapter.id });
    }
  }
  return steps;
}
