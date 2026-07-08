export function curriculumSortValue(chapter = {}) {
  return chapter.curriculumOrder || chapter.number || 9999;
}

export function isTrackStart(chapter, previous) {
  if (!chapter?.curriculumTrack) return false;
  return chapter.curriculumTrack.id !== previous?.curriculumTrack?.id;
}

export function firstChapterOfLevel(chapters = [], cefr) {
  return chapters
    .slice()
    .sort((a, b) => curriculumSortValue(a) - curriculumSortValue(b) || (a.number || 0) - (b.number || 0))
    .find((chapter) => (chapter.curriculumTrack?.cefr || chapter.level) === cefr) || null;
}

export function chapterLayerItemIds(chapter = {}) {
  return [
    ...new Set((chapter.learningLayers || []).flatMap((layer) => layer.itemIds || [])),
  ];
}

export function layerProgressLabel(layer = {}) {
  const itemCount = (layer.itemIds || []).length;
  const grammarCount = (layer.grammarIds || []).length;
  const parts = [];
  if (itemCount) parts.push(`${itemCount} items`);
  if (grammarCount) parts.push(`${grammarCount} grammar`);
  return parts.join(' · ') || 'Reference';
}
