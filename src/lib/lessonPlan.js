const LABELS = {
  dialogue: 'Dialogue',
  deck: 'Add deck',
  practice: 'Practice',
  complete: 'Complete',
};

export function hasPracticeReps(reviews = {}, ids = []) {
  return ids.some((id) => (reviews[id]?.reps || 0) > 0);
}

export function grammarFormLabel(title = '') {
  const label = String(title || '').split('—')[0].trim();
  const outsideParens = label.replace(/\([^)]*\)/g, '').trim();
  const koreanParen = label.match(/\(([^)]*[ㄱ-ㅎㅏ-ㅣ가-힣][^)]*)\)/);
  if (koreanParen && !/[ㄱ-ㅎㅏ-ㅣ가-힣]/.test(outsideParens)) return koreanParen[1].trim();
  return label.replace(/\s*\([^)]*[A-Za-z][^)]*\)\s*$/g, '').trim() || label;
}

export function grammarSelfCheckItems(notes = []) {
  return notes
    .map((note, index) => {
      const form = grammarFormLabel(note?.title ?? note);
      return form ? { id: `grammar-${index}`, form, label: `Did you use 『${form}』?` } : null;
    })
    .filter(Boolean);
}

export function lessonPlanState({
  chapter,
  itemIds = [],
  reviews = {},
  activity = {},
  lessonDone = false,
  deckReady = false,
} = {}) {
  const chapterActivity = chapter?.id ? activity[chapter.id] || {} : {};
  const hasDialogue = !!(chapter?.dialogue || []).length;
  const dialogueDone = !hasDialogue || !!chapterActivity.dialogueSeen;
  const practiceDone = !!chapterActivity.practiceDone || hasPracticeReps(reviews, itemIds);
  const completeDone = !!lessonDone;
  const deckDone = !!deckReady;

  let active = null;
  if (!dialogueDone) active = 'dialogue';
  else if (!deckDone) active = 'deck';
  else if (!practiceDone) active = 'practice';
  else if (!completeDone) active = 'complete';

  const doneCount = [dialogueDone, deckDone, practiceDone, completeDone].filter(Boolean).length;
  return {
    active,
    nextLabel: active ? LABELS[active] : 'Plan complete',
    doneCount,
    total: 4,
    dialogueDone,
    deckDone,
    practiceDone,
    completeDone,
  };
}
