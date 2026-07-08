import { describe, expect, it } from 'vitest';
import {
  buildChapterListeningItems,
  buildListeningPractice,
  collectListeningCandidates,
  countListeningCandidates,
  gradeDictation,
} from './listening.js';

const chapter = {
  id: 'chapter-test',
  grammarNotes: [{
    examples: [
      { ko: '어제 친구를 만났어요.', en: 'I met a friend yesterday.', romanization: 'eoje chingureul mannasseoyo.' },
      { ko: '아침에 밥을 먹었어요.', en: 'I ate breakfast.', romanization: 'achime babeul meogeosseoyo.' },
      { ko: '집에서 쉬었어요.', en: 'I rested at home.', romanization: 'jibeseo swieosseoyo.' },
      { ko: '영화가 재미있었어요.', en: 'The movie was fun.', romanization: 'yeonghwaga jaemiisseosseoyo.' },
    ],
  }],
  extendedDialogue: {
    lines: [
      { ko: '어제 뭐 했어요?', en: 'What did you do yesterday?', romanization: 'eoje mwo haesseoyo?' },
      { ko: '친구랑 영화를 봤어요.', en: 'I watched a movie with a friend.', romanization: 'chingurang yeonghwareul bwasseoyo.' },
    ],
  },
};

describe('listening item builder', () => {
  it('collects short chapter sentences without duplicates', () => {
    const candidates = collectListeningCandidates({
      ...chapter,
      extendedDialogue: { lines: [{ ko: '어제 친구를 만났어요.', en: 'Duplicate sentence.' }] },
    });

    expect(candidates.map((item) => item.ko)).toContain('어제 친구를 만났어요.');
    expect(candidates.filter((item) => item.ko === '어제 친구를 만났어요.')).toHaveLength(1);
  });

  it('builds two dictation items and listen-choice items with unique options', () => {
    const items = buildChapterListeningItems(chapter);

    expect(items).toHaveLength(4);
    expect(items.slice(0, 2).map((item) => item.type)).toEqual(['dictation', 'dictation']);
    expect(items.slice(2).every((item) => item.type === 'listenChoice')).toBe(true);
    for (const item of items.slice(2)) {
      expect(new Set(item.options)).toHaveLength(4);
      expect(item.options).toContain(item.answer);
    }
  });

  it('can build a practice set from all chapters or one selected chapter', () => {
    const chapters = [chapter, { ...chapter, id: 'chapter-other' }];

    expect(countListeningCandidates(chapters)).toBeGreaterThan(countListeningCandidates(chapters, 'chapter-test'));
    expect(buildListeningPractice(chapters, { chapterId: 'chapter-test', count: 4 })).toHaveLength(4);
  });
});

describe('dictation grading', () => {
  it('requires an exact normalized answer for a correct verdict', () => {
    const item = { ko: '어제 친구를 만났어요.' };

    expect(gradeDictation(' 어제 친구를 만났어요! ', item).verdict).toBe('correct');
    expect(gradeDictation('어제 친구 만났어요', item).verdict).toBe('close');
    expect(gradeDictation('오늘 학교에 가요', item).verdict).toBe('wrong');
  });
});
