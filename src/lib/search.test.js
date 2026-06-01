import { describe, it, expect } from 'vitest';
import { filterEntries, facetValues } from './search.js';
import { entries } from './data.js';

describe('filterEntries', () => {
  it('returns everything with empty filters', () => {
    expect(filterEntries(entries, {}).length).toBe(entries.length);
  });
  it('matches english/hangul/romanization by search', () => {
    const r = filterEntries(entries, { search: 'eat' });
    expect(r.some((e) => e.hangul === '먹다')).toBe(true);
    expect(r.every((e) => [e.hangul, e.romanization, e.english].join(' ').toLowerCase().includes('eat'))).toBe(true);
  });
  it('filters by type (Set)', () => {
    const r = filterEntries(entries, { type: new Set(['pattern']) });
    expect(r.length).toBeGreaterThan(0);
    expect(r.every((e) => e.type === 'pattern')).toBe(true);
  });
  it('filters by level', () => {
    const r = filterEntries(entries, { level: new Set(['A1']) });
    expect(r.every((e) => e.level === 'A1')).toBe(true);
  });
  it('combines search + facet', () => {
    const r = filterEntries(entries, { search: 'go', pos: new Set(['verb']) });
    expect(r.every((e) => e.partOfSpeech === 'verb')).toBe(true);
  });
});

describe('facetValues', () => {
  it('counts distinct types', () => {
    const f = facetValues(entries, (e) => e.type);
    const types = f.map((x) => x.value);
    expect(types).toContain('word');
    expect(types).toContain('pattern');
  });
});
