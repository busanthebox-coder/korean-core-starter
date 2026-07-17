import { beforeEach, describe, expect, it } from 'vitest';
import { clusterForEntry, clustersForHangul, expressionClusters, installStaticDataForTests, resetDataForTest } from './data.js';

const CLUSTER = {
  id: 'cluster-really',
  title: '진짜 vs 정말',
  rule: '진짜 is the casual spoken default; 정말 fits any register.',
  members: [
    { hangul: '진짜', entryId: 'w-1', when: 'casual speech', hint: 'the casual spoken default', example: { ko: '진짜 맛있어요.', en: 'Really tasty.' } },
    { hangul: '정말', entryId: 'w-2', when: 'any register', hint: 'the safe neutral pick', example: { ko: '정말 고마워요.', en: 'Thank you so much.' } },
  ],
};

const DATA = {
  words: [
    { id: 'w-1', hangul: '진짜', romanization: 'jinjja', english: 'really', level: 'A2', type: 'word', sort: 1 },
    { id: 'w-2', hangul: '정말', romanization: 'jeongmal', english: 'really', level: 'A2', type: 'word', sort: 2 },
    { id: 'w-3', hangul: '사과', romanization: 'sagwa', english: 'apple', level: 'A1', type: 'word', sort: 3 },
  ],
  expressionClusters: [CLUSTER],
};

describe('expression clusters', () => {
  beforeEach(() => {
    resetDataForTest();
    installStaticDataForTests(DATA);
  });

  it('installs clusters from boot core data', () => {
    expect(expressionClusters).toHaveLength(1);
    expect(expressionClusters[0].id).toBe('cluster-really');
  });

  it('finds the cluster a dictionary entry belongs to', () => {
    expect(clusterForEntry('w-1')?.id).toBe('cluster-really');
    expect(clusterForEntry('w-2')?.id).toBe('cluster-really');
  });

  it('returns null for an entry in no cluster', () => {
    expect(clusterForEntry('w-3')).toBeNull();
    expect(clusterForEntry('nope')).toBeNull();
  });

  // The lesson word screen only knows the hangul it is displaying, not an entry id.
  it('finds clusters by hangul for the lesson screen', () => {
    expect(clustersForHangul('진짜').map((c) => c.id)).toEqual(['cluster-really']);
    expect(clustersForHangul('사과')).toEqual([]);
    expect(clustersForHangul('')).toEqual([]);
  });

  it('drops cluster state on reset so tests cannot leak into each other', () => {
    resetDataForTest();
    expect(expressionClusters).toHaveLength(0);
    expect(clusterForEntry('w-1')).toBeNull();
    expect(clustersForHangul('진짜')).toEqual([]);
  });
});
