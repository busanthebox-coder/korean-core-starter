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
    conversations: {
      conversations: [{
        id: 'convo-001',
        title: 'Making a plan',
        situation: 'A friend asks what you want to do.',
        setting: 'texting',
        partner: '친구',
        tip: 'Match the close-friend register.',
        buddyCard: {
          instructionKo: '친한 친구 역할을 해 주세요. 학습자는 초급이니 천천히 말해 주세요.',
          reactionKo: '좋아, 같이 하자!',
        },
        turns: [
          { role: 'partner', ko: '주말에 뭐 해?', romanization: 'jumare mwo hae?', en: 'What are you doing this weekend?' },
          {
            role: 'you',
            prompt: 'Say you are free and ask why.',
            choices: [
              { ko: '별거 없는데, 왜?', romanization: 'byeolgeo eomneunde, wae?', en: 'Nothing much, why?', correct: true, feedback: 'Natural and casual.' },
              { ko: '바쁩니다.', romanization: 'bappeumnida.', en: 'I am busy.', correct: false, feedback: 'Too formal and contradicts the prompt.' },
            ],
          },
        ],
        vocab: ['주말'],
      }],
    },
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

  it('catches malformed conversation choices and vocab', () => {
    const data = validAppData();
    const conversation = data.conversations.conversations[0];
    delete conversation.turns[1].choices[0].correct;
    delete conversation.turns[1].choices[0].feedback;
    conversation.vocab = [{ ko: '주말', en: 'weekend' }];
    conversation.buddyCard.instructionKo = 'Play the friend role.';

    const result = lintContentData(data);

    expect(result.ok).toBe(false);
    expect(result.errors).toContain('conversation:convo-001 turn #2: expected exactly one correct choice, got 0');
    expect(result.errors).toContain('conversation:convo-001 turn #2 choice #1: missing feedback');
    expect(result.errors).toContain('conversation:convo-001: vocab must contain nonempty strings');
    expect(result.errors).toContain('conversation:convo-001.buddyCard.instructionKo: must be Korean-only helper text');
    expect(result.errors).toContain('conversation:convo-001.buddyCard.instructionKo: must contain 2-3 sentences');
  });

  it('catches a Korean buddy instruction that misses the card style contract', () => {
    const data = validAppData();
    data.conversations.conversations[0].buddyCard.instructionKo = '친한 친구 역할입니다.';

    const result = lintContentData(data);

    expect(result.ok).toBe(false);
    expect(result.errors).toContain('conversation:convo-001.buddyCard.instructionKo: must contain 2-3 sentences');
    expect(result.errors).toContain('conversation:convo-001.buddyCard.instructionKo: must use a polite request ending');
  });

  it('catches missing, duplicate, and non-string conversation fields', () => {
    const missing = validAppData();
    delete missing.conversations;
    expect(lintContentData(missing).errors).toContain('conversations: must contain a conversations array');

    const malformed = validAppData();
    const duplicate = structuredClone(malformed.conversations.conversations[0]);
    malformed.conversations.conversations.push(duplicate);
    malformed.conversations.conversations[0].title = {};
    malformed.conversations.conversations[0].turns[1].choices[0].en = {};
    delete malformed.conversations.conversations[0].vocab;

    const result = lintContentData(malformed);
    expect(result.errors).toContain('conversation:convo-001: missing title');
    expect(result.errors).toContain('conversation:convo-001: duplicate id convo-001');
    expect(result.errors).toContain('conversation:convo-001: vocab must contain nonempty strings');
    expect(result.errors).toContain('conversation:convo-001 turn #2 choice #1: missing en');
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
