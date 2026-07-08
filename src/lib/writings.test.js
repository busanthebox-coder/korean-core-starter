import { beforeEach, describe, expect, it } from 'vitest';
import { get } from 'svelte/store';
import {
  mergeWritingArchives,
  resetWritings,
  saveWriting,
  writingsByChapter,
} from './writings.js';

beforeEach(() => {
  localStorage.clear();
  resetWritings();
});

describe('writing archive', () => {
  it('does not save blank writing', () => {
    expect(saveWriting('chapter-01', '   ', true, 100)).toBe(false);
    expect(get(writingsByChapter)).toEqual({});
  });

  it('trims, caps at 2000 characters, and records checked state', () => {
    const text = `  ${'가'.repeat(2100)}  `;

    expect(saveWriting('chapter-01', text, true, 100)).toBe(true);

    const saved = get(writingsByChapter)['chapter-01'][0];
    expect(saved.text).toHaveLength(2000);
    expect(saved.checked).toBe(true);
    expect(saved.date).toBe(100);
  });

  it('keeps only the latest 10 writings per chapter', () => {
    for (let i = 0; i < 12; i += 1) saveWriting('chapter-01', `문장 ${i}`, false, i);

    const saved = get(writingsByChapter)['chapter-01'];
    expect(saved).toHaveLength(10);
    expect(saved.map((item) => item.text)).toEqual([
      '문장 2',
      '문장 3',
      '문장 4',
      '문장 5',
      '문장 6',
      '문장 7',
      '문장 8',
      '문장 9',
      '문장 10',
      '문장 11',
    ]);
  });

  it('merges archives by chapter, date, and duplicate text/date pairs', () => {
    const mine = JSON.stringify({
      'chapter-01': [
        { text: '로컬', date: 10, checked: true },
        { text: '같음', date: 20, checked: false },
      ],
    });
    const theirs = JSON.stringify({
      'chapter-01': [
        { text: '같음', date: 20, checked: true },
        { text: '원격', date: 30, checked: false },
      ],
      'chapter-02': [{ text: '둘', date: 40, checked: true }],
    });

    expect(JSON.parse(mergeWritingArchives(mine, theirs))).toEqual({
      'chapter-01': [
        { text: '로컬', date: 10, checked: true },
        { text: '같음', date: 20, checked: false },
        { text: '원격', date: 30, checked: false },
      ],
      'chapter-02': [{ text: '둘', date: 40, checked: true }],
    });
  });
});
