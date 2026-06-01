import { describe, it, expect } from 'vitest';
import { entries, findEntry, chapters, dialogues, guideTracks, grammar } from './data.js';

describe('data layer', () => {
  it('loads a large vocabulary pool', () => {
    expect(entries.length).toBeGreaterThan(900);
  });
  it('findEntry resolves a known verb', () => {
    const e = findEntry('word-verb-001');
    expect(e).toBeTruthy();
    expect(e.hangul).toBeTypeOf('string');
  });
  it('every chapter cross-link resolves to an entry or grammar id', () => {
    const grammarIds = new Set(grammar.map((g) => g.id));
    const unresolved = [];
    for (const ch of chapters) {
      for (const id of [...(ch.linkedEntryIds || []), ...(ch.coreVocabularyIds || []), ...(ch.patternIds || [])]) {
        if (!findEntry(id)) unresolved.push(id);
      }
      for (const id of ch.grammarFocus || []) if (!grammarIds.has(id)) unresolved.push(id);
    }
    expect(unresolved).toEqual([]);
  });
  it('exposes dialogues and guide tracks', () => {
    expect(dialogues.length).toBeGreaterThanOrEqual(8);
    expect(guideTracks.length).toBe(4);
  });
});
