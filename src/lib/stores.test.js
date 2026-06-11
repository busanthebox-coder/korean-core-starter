import { describe, it, expect, beforeEach } from 'vitest';
import { get } from 'svelte/store';
import {
  romanizationVisible,
  toggleRomanization,
  lessonActivity,
  lessonProgress,
  markDialogueSeen,
  markLessonDone,
  markLessonPracticed,
  guideProgress,
  resetLessonActivity,
  resetLessonProgress,
  toggleGuideReady,
  toggleLessonDone,
  unmarkLessonDone,
} from './stores.js';

beforeEach(() => {
  localStorage.clear();
  resetLessonActivity();
  resetLessonProgress();
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
});
