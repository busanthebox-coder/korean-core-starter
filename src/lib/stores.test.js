import { describe, it, expect, beforeEach } from 'vitest';
import { get } from 'svelte/store';
import { romanizationVisible, toggleRomanization, lessonProgress, markLessonDone } from './stores.js';

beforeEach(() => localStorage.clear());

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
});
