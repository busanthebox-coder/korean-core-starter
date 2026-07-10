import { describe, expect, it } from 'vitest';
import {
  readGeneratedEntries,
  readHanjaRoots,
  validateHanjaRoots,
} from '../../scripts/validate-hanja-roots.mjs';

describe('hanja root validation', () => {
  it('requires manual review metadata for every root and member', () => {
    const roots = readHanjaRoots();
    const entries = readGeneratedEntries();
    const valid = validateHanjaRoots(roots, entries);

    expect(valid.ok).toBe(true);
    expect(valid.rootReviewCount).toBe(40);
    // 212 after the 2026-07-10 content review removed two misclassified members
    // (대단하다 — native-origin, not 大端; 합병증 — 倂, not 病).
    expect(valid.memberReviewCount).toBe(212);

    const missingRootReview = structuredClone(roots);
    delete missingRootReview[0].review;
    const rootResult = validateHanjaRoots(missingRootReview, entries);

    expect(rootResult.ok).toBe(false);
    expect(rootResult.errors.join('\n')).toContain('missing manual review metadata');

    const missingMemberReview = structuredClone(roots);
    delete missingMemberReview[0].members[0].reviewed;
    const memberResult = validateHanjaRoots(missingMemberReview, entries);

    expect(memberResult.ok).toBe(false);
    expect(memberResult.errors.join('\n')).toContain('reviewed must be true');
  });
});
