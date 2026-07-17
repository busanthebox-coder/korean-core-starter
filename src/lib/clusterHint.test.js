import { describe, expect, it } from 'vitest';
import { clusterHintLine } from './clusterHint.js';

const CLUSTER = {
  id: 'cluster-really',
  members: [
    { hangul: '진짜', hint: 'the casual spoken default' },
    { hangul: '정말', hint: 'the safe neutral pick' },
    { hangul: '참', hint: 'warm and gentle' },
  ],
};

describe('clusterHintLine', () => {
  it('names the other members and states what this one is', () => {
    expect(clusterHintLine(CLUSTER, '진짜')).toBe('vs 정말, 참 — 진짜 is the casual spoken default.');
  });

  it('lists the others from the perspective of whichever word is on screen', () => {
    expect(clusterHintLine(CLUSTER, '참')).toBe('vs 진짜, 정말 — 참 is warm and gentle.');
  });

  it('stays quiet when there is nothing to compare', () => {
    expect(clusterHintLine(null, '진짜')).toBeNull();
    expect(clusterHintLine(CLUSTER, '')).toBeNull();
    expect(clusterHintLine(CLUSTER, '사과')).toBeNull();
    expect(clusterHintLine({ members: [{ hangul: '진짜', hint: 'x' }] }, '진짜')).toBeNull();
  });

  it('stays quiet for a member with no hint authored', () => {
    expect(clusterHintLine({ members: [{ hangul: '가', hint: '' }, { hangul: '나', hint: 'y' }] }, '가')).toBeNull();
  });
});
