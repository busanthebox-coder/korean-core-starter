export function recommendDrill({ dueCount = 0, weakCount = 0, chapterHasConjugation = false, canRecognize = true } = {}) {
  if (dueCount > 0) return { kind: 'review', label: `Review ${dueCount} due`, cta: `Review ${dueCount}`, sub: 'These are the cards scheduled for today.' };
  if (weakCount > 0) return { kind: 'weak', label: `Repair ${weakCount} weak`, cta: 'Practice weak items', sub: 'Clear the items that recently caused trouble.' };
  if (chapterHasConjugation) return { kind: 'conjugation', label: 'Conjugation trainer', cta: 'Practice forms', sub: 'Turn this chapter’s verbs into everyday Korean.' };
  return {
    kind: 'quiz',
    label: 'Quick quiz',
    cta: 'Start quiz',
    sub: canRecognize ? 'A short mixed quiz is the best next repetition.' : 'Choose a larger set in More drills to start a quiz.',
  };
}
