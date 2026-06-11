import { describe, expect, it } from 'vitest';
import { chapters, findEntry, grammar } from './data.js';
import { chapterLayerItemIds, isTrackStart } from './curriculumStructure.js';

const byNumber = (number) => chapters.find((chapter) => chapter.number === number);
const curriculumGrammarIds = [
  'grammar-question-words',
  'grammar-speech-levels',
  'grammar-particle-ui',
  'grammar-copula-ida',
  'grammar-advanced-get',
  'grammar-counterfactual-conditionals',
  'grammar-nominalization-gi-geot',
  'grammar-written-connectors',
  'grammar-internet-language',
  'grammar-production-checklist',
  'grammar-sound-tensification',
];

describe('curriculum structure', () => {
  it('orders the lesson path by recommended difficulty, not raw chapter number', () => {
    const firstFifteen = chapters.slice(0, 15).map((chapter) => chapter.number);

    expect(firstFifteen).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 17, 18, 19, 20]);
    expect(chapters.findIndex((chapter) => chapter.number === 17)).toBeLessThan(
      chapters.findIndex((chapter) => chapter.number === 12),
    );
  });

  it('gives every chapter a track, layer plan, prerequisites, and exit task', () => {
    for (const chapter of chapters) {
      expect(chapter.curriculumOrder).toBeGreaterThan(0);
      expect(chapter.curriculumTrack?.id).toBeTruthy();
      expect(chapter.curriculumTrack?.label).toBeTruthy();
      expect(chapter.curriculumTrack?.cefr).toBeTruthy();
      expect(chapter.learningLayers?.map((layer) => layer.id)).toEqual(['core', 'expand', 'reference']);
      expect(chapterLayerItemIds(chapter).length).toBeGreaterThan(0);
      expect(Array.isArray(chapter.prerequisiteChapterIds)).toBe(true);
      expect(chapter.exitTask?.canDo).toBeTruthy();
      expect(chapter.exitTask?.prompt).toBeTruthy();
      expect(chapter.exitTask?.sampleAnswer?.ko).toBeTruthy();
      expect(chapter.exitTask?.checklist?.length).toBeGreaterThanOrEqual(3);
    }
  });

  it('keeps layer and prerequisite ids resolvable', () => {
    const chapterIds = new Set(chapters.map((chapter) => chapter.id));
    const grammarIds = new Set(grammar.map((item) => item.id));

    for (const chapter of chapters) {
      for (const id of chapterLayerItemIds(chapter)) expect(findEntry(id)).toBeTruthy();
      for (const layer of chapter.learningLayers || []) {
        for (const id of layer.grammarIds || []) expect(grammarIds.has(id)).toBe(true);
      }
      for (const id of chapter.prerequisiteChapterIds || []) expect(chapterIds.has(id)).toBe(true);
    }
  });

  it('connects chapters 17-65 to explicit grammar focus cards', () => {
    const grammarIds = new Set(grammar.map((item) => item.id));

    for (const chapter of chapters.filter((item) => item.number >= 17)) {
      expect(chapter.grammarFocus?.length, `chapter ${chapter.number}`).toBeGreaterThan(0);
      for (const id of chapter.grammarFocus || []) expect(grammarIds.has(id)).toBe(true);
    }
  });

  it('keeps curriculum-added grammar cards studyable', () => {
    for (const id of curriculumGrammarIds) {
      const item = grammar.find((grammarItem) => grammarItem.id === id);

      expect(item?.sentenceFrames?.length, id).toBeGreaterThanOrEqual(2);
      expect(item?.examples?.length, id).toBeGreaterThanOrEqual(2);
      expect(item?.practiceItems?.length, id).toBeGreaterThanOrEqual(2);
      expect(item?.commonMistakes?.length, id).toBeGreaterThanOrEqual(1);
    }
  });

  it('keeps every chapter in a warm coaching tone', () => {
    const stiffFragments = [
      'Master these first',
      'after the core feels stable',
      'Use at least one core item',
      'Check the particle, verb ending',
      'Demonstrate mastery',
      'morphological causatives',
      'semantic weight',
      'discourse-level',
      'spanning multiple registers',
      'Deploy the expressive',
      'Construct counterfactual',
    ];

    for (const chapter of chapters) {
      const visibleStudyText = [
        chapter.goal,
        chapter.scenario,
        chapter.realLifeTask,
        chapter.exitTask?.prompt,
        chapter.exitTask?.canDo,
        chapter.exitTask?.sampleAnswer?.ko,
        ...(chapter.exitTask?.checklist || []),
        ...(chapter.learningLayers || []).map((layer) => layer.purpose),
      ].join(' ');

      expect(chapter.realLifeTask, `chapter ${chapter.number}`).toBeTruthy();
      expect(chapter.checkpoints?.length, `chapter ${chapter.number}`).toBeGreaterThanOrEqual(3);
      for (const fragment of stiffFragments) expect(visibleStudyText).not.toContain(fragment);
    }

    expect(byNumber(6)?.dialogue?.map((line) => line.ko)).toContain('카페에서 친구를 만나요.');
    expect(byNumber(11)?.exitTask?.sampleAnswer?.ko).toBe('일이 있어서 못 가요. 끝나고 전화할게요.');
    expect(byNumber(57)?.exitTask?.sampleAnswer?.ko).toBe('선생님이 학생들에게 문장을 읽혔어요. 학생들이 문장을 읽게 했어요.');
    expect(byNumber(65)?.goal).toBe('Put the whole course together in one message that fits the situation.');
  });

  it('keeps chapter sample answers visibly polished', () => {
    const detachedParticle = /[가-힣] (은|는|이|가|을|를|에|에서|로|으로|와|과|도|만)(\s|$)/;

    for (const chapter of chapters) {
      const sample = chapter.exitTask?.sampleAnswer?.ko || '';

      expect(sample, `chapter ${chapter.number}`).toMatch(/[가-힣]/);
      expect(detachedParticle.test(sample), `chapter ${chapter.number}: ${sample}`).toBe(false);
    }
  });

  it('adds a Natural Why coaching card to the pilot chapter', () => {
    const pilot = byNumber(17)?.naturalWhy;

    expect(pilot?.lessNatural?.ko).toBe('어제 영화를 봐요.');
    expect(pilot?.natural?.ko).toBe('어제 영화를 봤어요.');
    expect(pilot?.why).toContain('어제');
    expect(pilot?.nativeCorrections?.length).toBeGreaterThanOrEqual(3);
    expect(pilot?.practiceExamples?.length).toBeGreaterThanOrEqual(3);
    expect(pilot?.askNative).toContain('한국인은 더 짧게 어떻게 말해요?');
  });

  it('keeps chapter 17 warm-up dialogue conversational', () => {
    const lines = byNumber(17)?.dialogue || [];
    const koreanLines = lines.map((line) => line.ko);

    expect(koreanLines).toEqual([
      '어제 뭐 했어요?',
      '어제 친구랑 영화 봤어요.',
      '어땠어요?',
      '재미있었어요. 근데 날씨가 좀 추웠어요.',
    ]);
    expect(koreanLines).not.toContain('날씨가 추웠지만 재미있었어요.');
  });

  it('keeps warm-up dialogues from turning into grammar example lists', () => {
    const chapter18 = byNumber(18)?.dialogue?.map((line) => line.ko) || [];
    const chapter57 = byNumber(57)?.dialogue?.map((line) => line.ko) || [];
    const chapter58 = byNumber(58)?.dialogue?.map((line) => line.ko) || [];
    const chapter59 = byNumber(59)?.dialogue?.map((line) => line.ko) || [];

    expect(chapter18).toEqual([
      '주말에 뭐 할 거예요?',
      '친구를 만나서 카페에 갈 거예요.',
      '비가 오면요?',
      '비가 오면 집에서 공부할 거예요.',
    ]);
    expect(chapter57).toContain('네. 밥을 먹이고 낮잠도 재웠어요.');
    expect(chapter57).not.toContain('알리다와 낮추다도 기본형이랑 비교해서 외워야 해요.');
    expect(chapter58).toContain('사람이 많아서 시간이 좀 걸리겠네요.');
    expect(chapter58).not.toContain('자료를 보니 결과가 달라지겠네요.');
    expect(chapter59).toContain('어제 면접에 늦었다면서요?');
    expect(chapter59).not.toContain('친구에게 바로 사과했더라면 지금 이렇게 후회하지 않았을 텐데요.');
  });

  it('marks the start of each track for the Learn path', () => {
    const starts = chapters.filter((chapter, index) => isTrackStart(chapter, chapters[index - 1]));

    expect(starts.map((chapter) => chapter.curriculumTrack.cefr)).toEqual(['A1', 'A2', 'B1', 'B2', 'C1']);
    expect(byNumber(17)?.curriculumTrack.cefr).toBe('A2');
    expect(byNumber(12)?.curriculumTrack.cefr).toBe('B1');
  });
});
