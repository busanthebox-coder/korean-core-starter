import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { formatContentLintReport, lintContentData, runContentLint } from './lint-content.mjs';

function validAppData() {
  return {
    words: [{
      id: 'word-001',
      level: 'A1',
      hangul: '가다',
      examples: [{ ko: '학교에 가요.', romanization: 'hakgyoe gayo.', en: 'I go to school.' }],
    }],
    newcomerVocab: [],
    extendedVocab: [],
    expressions: [],
    patterns: [{ id: 'pattern-001', level: 'A1', examples: [{ ko: 'N이에요.', romanization: 'nieyo.', en: 'It is N.' }] }],
    course: {
      chapters: [{
        id: 'chapter-01',
        level: 'A1',
        linkedEntryIds: ['word-001'],
        coreVocabularyIds: ['word-001'],
        patternIds: ['pattern-001'],
        grammarFocus: ['grammar-001'],
      }],
    },
    grammar: { grammarItems: [{ id: 'grammar-001' }], endingItems: [] },
    vocabPacks: [{ id: 'pack-001', items: [{ entryId: 'word-001', relatedEntryIds: ['pattern-001'] }] }],
    guide: { tracks: [{ units: [{ id: 'guide-001', linkedEntryIds: ['word-001'] }] }] },
  };
}

function exerciseChapter(exercise) {
  const good = {
    type: 'multipleChoice',
    prompt: 'Choose the right answer.',
    options: ['가요', '와요'],
    correct: '가요',
    explanation: '가요 is correct because the sentence is about going.',
  };
  return {
    id: 'chapter-01',
    inlineExercises: Array.from({ length: 10 }, (_, index) => (index === 0 ? exercise : good)),
  };
}

describe('content lint', () => {
  it('passes a minimal valid app data fixture', () => {
    const result = lintContentData(validAppData());

    expect(result.ok).toBe(true);
    expect(formatContentLintReport(result)).toContain('Content lint passed.');
  });

  it('catches missing example romanization', () => {
    const data = validAppData();
    data.words[0].examples[0].romanization = '';

    const result = lintContentData(data);

    expect(result.ok).toBe(false);
    expect(result.errors).toContain('words:word-001 example #1 missing romanization');
  });

  it('catches an injected inline exercise answer that is not an option', () => {
    const tmp = mkdtempSync(join(tmpdir(), 'kcs-content-lint-'));
    try {
      const richDir = join(tmp, 'rich-chapters');
      mkdirSync(richDir);
      writeFileSync(
        join(richDir, 'chapter-01.json'),
        `${JSON.stringify(exerciseChapter({
          type: 'multipleChoice',
          prompt: 'Choose the right answer.',
          options: ['가요', '와요'],
          correct: '먹어요',
          explanation: 'The injected answer is intentionally absent from options.',
        }), null, 2)}\n`,
      );

      const result = runContentLint({
        appData: validAppData(),
        richDir,
        runA1Audit: false,
        runIntegrity: false,
      });

      expect(result.ok).toBe(false);
      expect(result.errors).toContain('inlineExercises: chapter-01 #1: correct "먹어요" is not in options');
    } finally {
      rmSync(tmp, { recursive: true, force: true });
    }
  });
});
