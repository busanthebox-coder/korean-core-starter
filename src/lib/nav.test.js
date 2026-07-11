import { describe, it, expect } from 'vitest';
import { NAV } from './nav.js';

describe('nav', () => {
  it('defines the five destinations with routes and labels', () => {
    expect(NAV.map((n) => n.path)).toEqual(['/learn', '/practice', '/speak', '/dictionary', '/guide']);
    expect(NAV.every((n) => n.label && n.icon)).toBe(true);
  });
});
