export const WEAK_DECK = '__weak';
export const FOCUS_DECK = '__focus';

export function uniqueIds(ids = []) {
  return [...new Set(ids.filter(Boolean))];
}

export function chapterItemIds(chapter = {}) {
  return uniqueIds([
    ...(chapter.coreVocabularyIds || []),
    ...(chapter.linkedEntryIds || []),
    ...(chapter.patternIds || []),
  ]);
}

export function entryIdsForUnit(unit = {}) {
  return uniqueIds([...(unit.coreVocabularyIds || []), ...(unit.linkedEntryIds || [])]);
}

export function packItemIds(pack = {}) {
  return uniqueIds((pack.items || []).flatMap((item) => [item.entryId, ...(item.relatedEntryIds || [])]));
}

export function chapterForEntry(chapters = [], entryId) {
  if (!entryId) return null;
  return chapters.find((chapter) => chapterItemIds(chapter).includes(entryId)) || null;
}

export function focusPracticePath(ids = []) {
  const focus = uniqueIds(ids).join(',');
  return focus ? `/practice?focus=${encodeURIComponent(focus)}` : '/practice';
}

export function learnChapterPath(chapterId) {
  return chapterId ? `/learn?chapter=${encodeURIComponent(chapterId)}` : '/learn';
}

export function parseFocusParam(hash = '') {
  const query = (hash.split('?')[1] || '').split('#')[0];
  const focus = new URLSearchParams(query).get('focus');
  const ids = uniqueIds((focus || '').split(',').map((id) => id.trim()));
  return { deck: ids.length ? FOCUS_DECK : null, ids };
}

export function buildTodayMission({ chapters = [], completedIds = new Set(), reviews = {}, mistakeIds = [], now = Date.now() } = {}) {
  const dueCount = Object.values(reviews).filter((card) => card?.due <= now).length;
  const weakCount = uniqueIds(mistakeIds).length;
  const nextChapter = chapters.find((chapter) => !completedIds.has(chapter.id)) || chapters[chapters.length - 1] || null;
  const steps = [
    {
      kind: 'review',
      label: dueCount ? `복습 ${dueCount}개 비우기` : 'Open review',
      detail: dueCount ? 'Clear cards scheduled for today.' : 'Add a deck or do a light review.',
      path: dueCount ? '/practice?review=1' : '/practice',
    },
    {
      kind: 'weak',
      label: weakCount ? `Repair ${weakCount} weak` : 'No weak items',
      detail: weakCount ? 'Fix mistakes before new material.' : 'Keep this clear by correcting misses.',
      path: weakCount ? `/practice?deck=${WEAK_DECK}` : '/practice',
    },
    {
      kind: 'chapter',
      label: nextChapter ? `Continue Ch ${nextChapter.number}` : 'Course complete',
      detail: nextChapter ? nextChapter.title : 'Review, speak, and maintain.',
      chapter: nextChapter,
    },
    {
      kind: 'speak',
      label: 'Shadow 1 scene',
      detail: 'Listen, repeat, and advance line by line.',
      path: '/speak?mode=shadow',
    },
  ];
  return { dueCount, weakCount, nextChapter, steps };
}
