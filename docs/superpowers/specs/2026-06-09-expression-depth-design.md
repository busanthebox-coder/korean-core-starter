# Expression depth upgrade — design

**Date:** 2026-06-09
**Goal:** When learning, expressions should feel *rich*. Diagnosis showed the felt thinness is a **depth** problem (the user chose "표현 1개당 깊이↑", "둘 다 최대 심화"), not quantity — there are 865 expressions, but each one's teaching content can go much deeper, especially on the axes that matter for set phrases/idioms.

## Scope
- The **865 expressions** in `scripts/expr-src/*.json` (53 files), deepened **in place**.
- No schema/UI change: depth lands in fields the app already renders (`nuance`, `structuredNuance`, `examples`, `usage`, `mistakes`).
- Unchanged per entry: `hangul`, `english`, `romanization`, `topic`, key set, and array lengths the audit needs (`usage`=4, `examples`=3, `mistakes`≥2).

## Depth rubric — "둘 다 최대" (expression-tuned + the base rich rubric)
Each expression's explanation must carry:
1. **직역 vs 실제 뜻** — literal composition vs the real intent (critical for idioms).
2. **언제·누구에게 (상황 + 격식)** — the situation it fits and the speech level (반말/존댓말/격식) + social caution (who you can/can't say it to).
3. **비슷한 *표현* 과의 차이** — a named near-synonym **expression** (not just a word) and the dividing line.
4. **변형·확장형** — common variants / stronger–weaker forms.
5. **영어권 함정** — the direct-translation or wrong-register trap.
- **examples (3, graded):** at least **one A/B mini-exchange** so the expression is seen as a real conversational turn.
- **usage (4):** real partner-phrases / lead-ins / variants.
- **mistakes (2–3):** concrete — wrong register, literal mistranslation, wrong situation.
- Plus the base rich axes (synonym contrast, collocations, register, origin where relevant, pitfalls, graded examples).

## Method
Follow the `korean-explanation-deepener` skill's Step-3 pattern: an author→QA **Workflow** per seed file (rubric inlined), each agent rewriting the real seed in place, then regenerate → audit → build-app-data → `npm test` → re-score depth.

## Execution (validation-first, user-approved)
- **Wave 0 (validate):** 4 representative files — `6x-e-idioms.json`, `6x-e-reactions.json`, `2x-texting.json`, `x-restaurant.json` (~53 expressions). User reviews sample quality.
- **Waves 1–2:** the remaining 49 files (~812 expressions).
- Each wave verified by the pipeline; deploy is a separate, explicit step.

## Out of scope (deferred)
- New `exchanges` field + mini-bubble UI (YAGNI; A/B dialogues fit existing `examples`).
- Adding new expressions (quantity), TTS, 17 MB bundle split.

## Note
Implementation vehicle is the existing, already-specced `korean-explanation-deepener` workflow (not a fresh writing-plans cycle), since that skill *is* the plan for in-place explanatory deepening.
