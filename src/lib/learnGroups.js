import { curriculumSortValue } from './curriculumStructure.js';

const LEVEL_ORDER = ['A1', 'A2', 'B1', 'B2', 'C1'];

function chapterLevel(chapter = {}) {
  return chapter.curriculumTrack?.cefr || chapter.level || 'Other';
}

function orderedChapters(chapters = []) {
  return chapters
    .slice()
    .sort((a, b) => curriculumSortValue(a) - curriculumSortValue(b) || (a.number || 0) - (b.number || 0));
}

function groupSortValue(group) {
  const known = LEVEL_ORDER.indexOf(group.key);
  return known >= 0 ? known : LEVEL_ORDER.length + group.firstOrder;
}

export function groupChaptersByLevel(chapters = [], completedIds = new Set()) {
  const map = new Map();
  for (const chapter of orderedChapters(chapters)) {
    const key = chapterLevel(chapter);
    if (!map.has(key)) {
      map.set(key, {
        key,
        label: chapter.curriculumTrack?.label || key,
        description: chapter.curriculumTrack?.description || '',
        chapters: [],
        doneCount: 0,
        totalCount: 0,
        firstOrder: curriculumSortValue(chapter),
      });
    }
    const group = map.get(key);
    group.chapters.push(chapter);
    group.totalCount += 1;
    if (completedIds.has(chapter.id)) group.doneCount += 1;
  }
  return [...map.values()].sort((a, b) => groupSortValue(a) - groupSortValue(b));
}

export function activeGroupKey(chapters = [], completedIds = new Set()) {
  const next = orderedChapters(chapters).find((chapter) => !completedIds.has(chapter.id));
  if (next) return chapterLevel(next);
  return groupChaptersByLevel(chapters, completedIds).at(-1)?.key || '';
}

function normalized(value) {
  return String(value || '').trim().toLowerCase();
}

function matchesFilter(chapter, filterText) {
  const query = normalized(filterText);
  if (!query) return true;
  return [
    chapter.title,
    chapter.goal,
    chapter.id,
    chapter.number,
    chapter.curriculumTrack?.label,
  ].some((value) => normalized(value).includes(query));
}

export function groupsForLearnHome({
  chapters = [],
  completedIds = new Set(),
  openKeys = new Set(),
  filterText = '',
} = {}) {
  const query = normalized(filterText);
  const activeKey = activeGroupKey(chapters, completedIds);
  return groupChaptersByLevel(chapters, completedIds)
    .map((group) => {
      const matches = group.chapters.filter((chapter) => matchesFilter(chapter, query));
      return {
        ...group,
        chapters: query ? matches : group.chapters,
        matchCount: matches.length,
        open: query ? matches.length > 0 : openKeys.has(group.key) || group.key === activeKey,
      };
    })
    .filter((group) => !query || group.matchCount > 0);
}
