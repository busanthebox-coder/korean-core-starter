// Pure filtering for the Dictionary. `filters` uses Sets for multi-select facets.
export function filterEntries(entries, filters = {}) {
  const { search = '', type, level, topic, pos } = filters;
  const q = (search || '').trim().toLowerCase();
  return entries.filter((e) => {
    if (type && type.size && !type.has(e.type)) return false;
    if (level && level.size && !level.has(e.level)) return false;
    if (pos && pos.size && !pos.has(e.partOfSpeech)) return false;
    if (topic && topic.size && !(e.topic || []).some((t) => topic.has(t))) return false;
    if (q) {
      const hay = [e.hangul, e.romanization, e.english].filter(Boolean).join(' ').toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });
}

// Distinct facet values present in the data, with counts, for building filter chips.
export function facetValues(entries, accessor) {
  const counts = new Map();
  for (const e of entries) {
    const vals = accessor(e);
    for (const v of Array.isArray(vals) ? vals : [vals]) {
      if (v == null || v === '') continue;
      counts.set(v, (counts.get(v) || 0) + 1);
    }
  }
  return [...counts.entries()].sort((a, b) => b[1] - a[1]).map(([value, count]) => ({ value, count }));
}
