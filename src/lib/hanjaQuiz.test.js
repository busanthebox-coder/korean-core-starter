import { describe, expect, it } from 'vitest';
import { buildHanjaRootQuiz } from './hanjaQuiz.js';
import { hanjaRoots } from './data.js';

describe('buildHanjaRootQuiz', () => {
  it('builds three questions with unique options and one correct answer', () => {
    const root = hanjaRoots.find((item) => item.id === 'root-hak');
    const quiz = buildHanjaRootQuiz(root, hanjaRoots);

    expect(quiz).toHaveLength(3);
    for (const question of quiz) {
      const optionIds = question.options.map((option) => option.entryId);
      expect(new Set(optionIds).size).toBe(optionIds.length);
      expect(optionIds.filter((id) => id === question.correctEntryId)).toHaveLength(1);
      expect(question.options).toHaveLength(4);
    }
  });

  it('keeps visible option hangul unique when different entries share text', () => {
    const root = {
      id: 'root-target',
      hanja: '本',
      reading: '본',
      members: [{ entryId: 'entry-correct', hangul: '학교' }],
    };
    const roots = [
      root,
      {
        id: 'root-one',
        members: [
          { entryId: 'entry-a', hangul: '학생' },
          { entryId: 'entry-b', hangul: '학생' },
          { entryId: 'entry-c', hangul: '학원' },
          { entryId: 'entry-d', hangul: '방학' },
          { entryId: 'entry-e', hangul: '유학' },
        ],
      },
    ];

    const [question] = buildHanjaRootQuiz(root, roots, { count: 1 });
    const optionIds = question.options.map((option) => option.entryId);
    const optionHangul = question.options.map((option) => option.hangul);

    expect(new Set(optionIds).size).toBe(optionIds.length);
    expect(new Set(optionHangul).size).toBe(optionHangul.length);
    expect(optionHangul.filter((hangul) => hangul === '학생')).toHaveLength(1);
  });

  it('does not use another same-root member as a distractor', () => {
    const root = hanjaRoots.find((item) => item.id === 'root-jung-middle');
    const rootMemberIds = new Set(root.members.map((member) => member.entryId));
    const quiz = buildHanjaRootQuiz(root, hanjaRoots);

    expect(quiz).toHaveLength(3);
    for (const question of quiz) {
      const rootFamilyOptions = question.options.filter((option) => rootMemberIds.has(option.entryId));

      expect(rootFamilyOptions).toEqual([
        expect.objectContaining({ entryId: question.correctEntryId }),
      ]);
    }
  });
});
