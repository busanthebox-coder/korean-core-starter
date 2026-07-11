import appData from '../../korean/data/app-data.json';
import { buildSayItItems, isSayItLength, splitKoreanSentences } from './sayIt.js';

describe('say-it sentence selection', () => {
  it('splits long Korean turns into short speakable sentences', () => {
    expect(splitKoreanSentences('친구랑 영화를 봤어요. 그다음에 밥을 먹었어요.')).toEqual([
      '친구랑 영화를 봤어요.',
      '그다음에 밥을 먹었어요.',
    ]);
  });

  it('prefers learner turns and keeps a question when available', () => {
    const chapter = {
      id: 'chapter-test',
      extendedDialogue: {
        lines: [
          { speaker: '튜터', ko: '오늘 어디에 갈 거예요?' },
          { speaker: '학습자', ko: '저는 학교에 갈 거예요.' },
          { speaker: '튜터', ko: '몇 시에 갈 거예요?' },
          { speaker: '학습자', ko: '아침 아홉 시에 학교에 가요.' },
          { speaker: '학습자', ko: '내일 같이 갈 수 있어요?' },
        ],
      },
    };

    const items = buildSayItItems(chapter);

    expect(items.map((item) => item.ko)).toContain('저는 학교에 갈 거예요.');
    expect(items.some((item) => item.ko.endsWith('?'))).toBe(true);
    expect(items.every((item) => item.speaker === '학습자')).toBe(true);
  });

  it('finds three 8-20 syllable items for every shipped chapter', () => {
    const bad = appData.course.chapters
      .map((chapter) => ({ chapter, items: buildSayItItems(chapter) }))
      .filter(({ items }) => items.length !== 3 || items.some((item) => !isSayItLength(item.ko)));

    expect(bad).toEqual([]);
  });
});
