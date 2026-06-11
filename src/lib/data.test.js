import { describe, it, expect } from 'vitest';
import { entries, findEntry, chapters, dialogues, guideTracks, grammar, levels } from './data.js';

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
    expect(guideTracks.length).toBeGreaterThanOrEqual(5);
    expect(guideTracks.some((track) => track.id === 'track-emergency-work')).toBe(true);
  });

  describe('truthful B1 tagging', () => {
    it('promotes the vocabulary first taught in B1 chapters', () => {
      const b1 = entries.filter((e) => e.level === 'B1');
      expect(b1.length).toBeGreaterThan(0);
      // The advertised "A1–B1" range is now real.
      expect(levels).toContain('B1');
    });
    it('only promotes items that are core to a B1 chapter (not reused earlier)', () => {
      const b1ChapterCore = new Set();
      const earlierCore = new Set();
      for (const ch of chapters) {
        const ids = [...(ch.coreVocabularyIds || []), ...(ch.patternIds || [])];
        for (const id of ids) (/B1/i.test(ch.level || '') ? b1ChapterCore : earlierCore).add(id);
      }
      for (const e of entries) {
        if (e.level !== 'B1') continue;
        expect(b1ChapterCore.has(e.id)).toBe(true);
        expect(earlierCore.has(e.id)).toBe(false);
      }
    });
  });
});
