import { describe, expect, it } from 'vitest';
import { lintContentData } from './lint-content.mjs';

// Minimal data shaped like app-data.json — enough for the cluster checks to run.
const base = () => ({
  words: [
    { id: 'w-1', hangul: '진짜', romanization: 'jinjja', english: 'really', level: 'A2', type: 'word' },
    { id: 'w-2', hangul: '정말', romanization: 'jeongmal', english: 'really', level: 'A2', type: 'word' },
    { id: 'w-3', hangul: '참', romanization: 'cham', english: 'really', level: 'A2', type: 'word' },
  ],
  expressionClusters: [
    {
      id: 'cluster-really',
      title: '진짜 vs 정말',
      rule: '진짜 is casual; 정말 fits any register.',
      members: [
        { hangul: '진짜', entryId: 'w-1', when: 'casual speech', hint: 'the casual default', example: { ko: '진짜 맛있어요.', en: 'Really tasty.' } },
        { hangul: '정말', entryId: 'w-2', when: 'any register', hint: 'the neutral pick', example: { ko: '정말 고마워요.', en: 'Thank you so much.' } },
      ],
    },
  ],
});

const clusterErrors = (mutate) => {
  const data = base();
  mutate(data);
  return lintContentData(data).errors.filter((e) => e.includes('cluster'));
};

describe('expression cluster lint', () => {
  it('passes clean cluster data', () => {
    const result = lintContentData(base());
    expect(result.errors.filter((e) => e.includes('cluster'))).toEqual([]);
    expect(result.summary.expressionClusters).toBe(1);
  });

  it('catches a member pointing at an entry that does not exist', () => {
    expect(clusterErrors((d) => { d.expressionClusters[0].members[0].entryId = 'w-nope'; })[0]).toMatch(/missing linked id w-nope/);
  });

  it('catches a member missing the fields the UI renders', () => {
    expect(clusterErrors((d) => { d.expressionClusters[0].members[0].hint = ''; })[0]).toMatch(/has no hint/);
    expect(clusterErrors((d) => { d.expressionClusters[0].members[0].when = ''; })[0]).toMatch(/has no "when"/);
    expect(clusterErrors((d) => { d.expressionClusters[0].members[0].example = {}; })[0]).toMatch(/has no Korean example/);
    expect(clusterErrors((d) => { d.expressionClusters[0].members[0].example.en = ''; })[0]).toMatch(/example has no translation/);
  });

  it('catches a cluster with nothing to compare', () => {
    expect(clusterErrors((d) => { d.expressionClusters[0].members.pop(); })[0]).toMatch(/at least 2 members/);
  });

  it('catches a missing rule — the rule is the whole point of a cluster', () => {
    expect(clusterErrors((d) => { d.expressionClusters[0].rule = ''; })[0]).toMatch(/missing rule/);
  });

  it('catches the same word listed twice inside one cluster', () => {
    expect(clusterErrors((d) => { d.expressionClusters[0].members[1].hangul = '진짜'; })[0]).toMatch(/listed twice/);
  });

  it('catches duplicate cluster ids', () => {
    expect(clusterErrors((d) => { d.expressionClusters.push({ ...base().expressionClusters[0] }); })[0]).toMatch(/duplicate cluster id/);
  });

  it('allows a word in two clusters but not three', () => {
    const twin = (id) => ({
      id,
      title: 'twin',
      rule: 'r',
      members: [
        { hangul: '진짜', entryId: 'w-1', when: 'w', hint: 'h', example: { ko: '진짜요.', en: 'Really.' } },
        { hangul: '참', entryId: 'w-3', when: 'w', hint: 'h', example: { ko: '참 좋아요.', en: 'So nice.' } },
      ],
    });
    expect(clusterErrors((d) => { d.expressionClusters.push(twin('c-2')); })).toEqual([]);
    expect(clusterErrors((d) => { d.expressionClusters.push(twin('c-2'), twin('c-3')); })[0]).toMatch(/belongs to 3 clusters/);
  });
});
