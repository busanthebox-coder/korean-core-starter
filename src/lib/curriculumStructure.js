export function curriculumSortValue(chapter = {}) {
  return chapter.curriculumOrder || chapter.number || 9999;
}

export function isTrackStart(chapter, previous) {
  if (!chapter?.curriculumTrack) return false;
  return chapter.curriculumTrack.id !== previous?.curriculumTrack?.id;
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
