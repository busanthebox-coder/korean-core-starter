import { describe, it, expect, beforeEach } from 'vitest';
import { get } from 'svelte/store';
import {
  romanizationVisible,
  toggleRomanization,
  imeFallbackEnabled,
  checkpointProgress,
  lessonActivity,
  lessonProgress,
  readerProgress,
  markOrientationDone,
  markRomanNudgeSeen,
  markDialogueSeen,
  markLessonDone,
  markLessonPracticed,
  orientationDone,
  romanNudgeSeen,
  guideProgress,
  resetOrientationDone,
  resetRomanNudgeSeen,
  resetLessonActivity,
  resetCheckpointProgress,
  resetLessonProgress,
  resetReaderProgress,
  recordReaderResult,
  recordCheckpointResult,
  setImeFallback,
  toggleGuideReady,
  toggleImeFallback,
  toggleLessonDone,
  unmarkLessonDone,
} from './stores.js';

beforeEach(() => {
  localStorage.clear();
  resetLessonActivity();
  resetCheckpointProgress();
  resetLessonProgress();
  resetReaderProgress();
  resetOrientationDone();
  resetRomanNudgeSeen();
  setImeFallback(false);
});

describe('stores', () => {
  it('romanization toggles', () => {
    romanizationVisible.set(true);
    expect(get(romanizationVisible)).toBe(true);
    toggleRomanization();
    expect(get(romanizationVisible)).toBe(false);
  });
  it('marks a lesson done and persists', () => {
    markLessonDone('chapter-01');
    expect(get(lessonProgress).has('chapter-01')).toBe(true);
    expect(JSON.parse(localStorage.getItem('kcs.progress'))).toContain('chapter-01');
  });

  it('unmarks and toggles lesson completion', () => {
    markLessonDone('chapter-01');
    unmarkLessonDone('chapter-01');
    expect(get(lessonProgress).has('chapter-01')).toBe(false);

    toggleLessonDone('chapter-01');
    expect(get(lessonProgress).has('chapter-01')).toBe(true);
    toggleLessonDone('chapter-01');
    expect(get(lessonProgress).has('chapter-01')).toBe(false);
  });

  it('resets lesson progress', () => {
    markLessonDone('chapter-01');
    markLessonDone('chapter-02');
    resetLessonProgress();
    expect([...get(lessonProgress)]).toEqual([]);
    expect(JSON.parse(localStorage.getItem('kcs.progress'))).toEqual([]);
  });

  it('tracks per-chapter lesson activity', () => {
    markDialogueSeen('chapter-01');
    markLessonPracticed('chapter-01');
    const state = get(lessonActivity);
    expect(state['chapter-01'].dialogueSeen).toBe(true);
    expect(state['chapter-01'].practiceDone).toBe(true);
    expect(JSON.parse(localStorage.getItem('kcs.lesson-activity-v1'))['chapter-01'].practiceDone).toBe(true);

    resetLessonActivity();
    expect(get(lessonActivity)).toEqual({});
  });

  it('toggles guide unit readiness', () => {
    toggleGuideReady('unit-a');
    expect(get(guideProgress).has('unit-a')).toBe(true);
    toggleGuideReady('unit-a');
    expect(get(guideProgress).has('unit-a')).toBe(false);
  });

  it('records checkpoint best, last, and weak chapters', () => {
    recordCheckpointResult('a1-foundation', {
      score: 14,
      total: 20,
      weakChapterIds: ['chapter-03', 'chapter-07'],
    }, 10);
    recordCheckpointResult('a1-foundation', {
      score: 12,
      total: 20,
      weakChapterIds: ['chapter-05'],
    }, 20);

    expect(get(checkpointProgress)['a1-foundation']).toEqual({
      best: 14,
      last: 12,
      total: 20,
      lastAt: 20,
      weakChapterIds: ['chapter-05'],
    });
    expect(JSON.parse(localStorage.getItem('kcs.checkpoint-v1'))['a1-foundation'].best).toBe(14);
  });

  it('records Reading Room progress with score and read time', () => {
    recordReaderResult('reader-a1-01', { score: 3, total: 4, summary: '짧은 요약' }, 1234);

    expect(get(readerProgress)['reader-a1-01']).toEqual({
      readAt: 1234,
      score: 3,
      total: 4,
      summary: '짧은 요약',
    });
    expect(JSON.parse(localStorage.getItem('kcs.readers-v1'))['reader-a1-01'].score).toBe(3);

    resetReaderProgress();
    expect(get(readerProgress)).toEqual({});
  });

  it('tracks C9 onboarding state keys', () => {
    markOrientationDone();
    expect(get(orientationDone)).toBe(true);
    expect(localStorage.getItem('kcs.orientation-v1')).toBe('1');

    toggleImeFallback();
    expect(get(imeFallbackEnabled)).toBe(true);
    expect(localStorage.getItem('kcs.ime-fallback-v1')).toBe('1');

    markRomanNudgeSeen();
    expect(get(romanNudgeSeen)).toBe(true);
    expect(localStorage.getItem('kcs.roman-nudge-v1')).toBe('1');
  });
});
