export const LESSON_POSITION_KEY = 'kcs.lesson-position-v1';

function readPositions() {
  if (typeof localStorage === 'undefined') return {};
  try {
    const parsed = JSON.parse(localStorage.getItem(LESSON_POSITION_KEY) || '{}');
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {};
  } catch {
    return {};
  }
}

function boundedIndex(index, total) {
  const lastIndex = Math.max(0, Math.trunc(Number(total) || 0) - 1);
  return Math.max(0, Math.min(lastIndex, Math.trunc(Number(index) || 0)));
}

export function readLessonPosition(chapterId, total) {
  if (!chapterId || Number(total) <= 0) return 0;
  return boundedIndex(readPositions()[chapterId]?.index, total);
}

// True once the learner has opened the chapter and moved at least one screen —
// lets the Today card say "Start" vs "Continue" honestly.
export function hasLessonPosition(chapterId) {
  return Boolean(chapterId && readPositions()[chapterId]);
}

export function writeLessonPosition(chapterId, index, total, now = Date.now()) {
  if (!chapterId || Number(total) <= 0 || typeof localStorage === 'undefined') return;
  const positions = readPositions();
  positions[chapterId] = { index: boundedIndex(index, total), updatedAt: now };
  try {
    localStorage.setItem(LESSON_POSITION_KEY, JSON.stringify(positions));
  } catch {}
}

export function clearLessonPosition(chapterId) {
  if (!chapterId || typeof localStorage === 'undefined') return;
  const positions = readPositions();
  if (!(chapterId in positions)) return;
  delete positions[chapterId];
  try {
    if (Object.keys(positions).length) localStorage.setItem(LESSON_POSITION_KEY, JSON.stringify(positions));
    else localStorage.removeItem(LESSON_POSITION_KEY);
  } catch {}
}
