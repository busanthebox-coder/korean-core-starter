import { describe, expect, it } from 'vitest';
import { validateReaderSet } from '../../scripts/validate-readers.mjs';

const expected = [
  ['reader-a1-01', 'A1', '제 하루'],
  ['reader-a1-02', 'A1', '우리 가족'],
  ['reader-a1-03', 'A1', '주말에 만나요'],
  ['reader-a1-04', 'A1', '제가 좋아하는 음식'],
  ['reader-a1-05', 'A1', '우리 동네'],
  ['reader-a2-06', 'A2', '부산 여행 일기'],
  ['reader-a2-07', 'A2', '그 식당, 다시 갈 거예요'],
  ['reader-a2-08', 'A2', '길을 잃어버린 날'],
  ['reader-a2-09', 'A2', '한국의 사계절'],
  ['reader-a2-10', 'A2', '인터넷 쇼핑 실수'],
  ['reader-b1-11', 'B1', '친구에게'],
  ['reader-b1-12', 'B1', '원룸 구하기'],
  ['reader-b1-13', 'B1', '아침형 인간 실험'],
  ['reader-b1-14', 'B1', '첫 출근 날'],
  ['reader-b1-15', 'B1', '설날에 생긴 일'],
  ['reader-b2-16', 'B2', '스마트폰과 우리'],
  ['reader-b2-17', 'B2', '시장과 마트 사이'],
  ['reader-b2-18', 'B2', '지하철에서'],
  ['reader-b2-19', 'B2', '한국어 선생님 인터뷰'],
  ['reader-b2-20', 'B2', '아파트 게시판 공지 두 장'],
];

function fixtureReaders() {
  return expected.map(([id, level, title]) => ({
    id,
    level,
    title,
    titleEn: `${title} English`,
    genre: 'fixture',
    body: ['가 '.repeat({ A1: 100, A2: 250, B1: 450, B2: 700 }[level]).trim()],
    bodyTranslation: ['fixture translation'],
    comprehensionQuestions: Array.from({ length: 4 }, (_, index) => ({
      type: 'multipleChoice',
      prompt: `Question ${index + 1}?`,
      options: ['one', 'two', 'three'],
      correct: 'one',
      explanation: 'one is correct; two and three are distractors.',
    })),
    summaryPrompt: '이 글을 두 문장으로 요약해 보세요.',
    newWords: [],
  }));
}

describe('reader validation', () => {
  it('accepts the planned 20-reader shape', () => {
    const result = validateReaderSet(fixtureReaders());

    expect(result.ok).toBe(true);
    expect(result.counts).toEqual({ A1: 5, A2: 5, B1: 5, B2: 5 });
  });

  it('rejects missing or extra readers', () => {
    const result = validateReaderSet(fixtureReaders().slice(1));

    expect(result.ok).toBe(false);
    expect(result.errors.join('\n')).toContain('needs exactly 20 readers');
    expect(result.errors.join('\n')).toContain('missing reader-a1-01');
  });

  it('rejects ambiguous comprehension answers and duplicate options', () => {
    const readers = fixtureReaders();
    readers[0].comprehensionQuestions[0].options = ['one', 'one', 'two'];

    const result = validateReaderSet(readers);

    expect(result.ok).toBe(false);
    expect(result.errors.join('\n')).toContain('duplicate options');
    expect(result.errors.join('\n')).toContain('exactly one correct option');
  });

  it('rejects romanization fields in reader content', () => {
    const readers = fixtureReaders();
    readers[0].romanization = 'je haru';

    const result = validateReaderSet(readers);

    expect(result.ok).toBe(false);
    expect(result.errors.join('\n')).toContain('must not include romanization fields');
  });

  it('rejects romanized Korean inside reader body text', () => {
    const readers = fixtureReaders();
    readers[0].body[0] += ' annyeong haseyo';

    const result = validateReaderSet(readers);

    expect(result.ok).toBe(false);
    expect(result.errors.join('\n')).toContain('romanized Korean in body');
  });

  it.each(['annyeong', 'haseyo', 'gamsahamnida', 'gayo', 'juseyo'])(
    'rejects single-token romanized Korean body text: %s',
    (word) => {
      const readers = fixtureReaders();
      readers[0].body[0] += ` ${word}`;

      const result = validateReaderSet(readers);

      expect(result.ok).toBe(false);
      expect(result.errors.join('\n')).toContain('romanized Korean in body');
    }
  );

  it('allows all-uppercase acronyms inside reader body text', () => {
    const readers = fixtureReaders();
    readers[0].body[0] += ' KTX';

    const result = validateReaderSet(readers);

    expect(result.ok).toBe(true);
  });
});
