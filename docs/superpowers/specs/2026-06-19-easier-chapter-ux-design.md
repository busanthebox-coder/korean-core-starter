# Easier chapter UX — design (lesson-player model)

Date: 2026-06-19
Status: approved direction (pending final spec review)

## Problem

Learners say the site "looks difficult — too much text and explanation." A
chapter is one very long scroll with everything expanded and several overlapping
sections. An earlier "collapse" experiment hid bulk but did not make it
*comfortable to read*: a one-liner you must tap to learn anything is click-labor,
not ease.

Through prototyping with the owner we found the comfortable model: **one focused
screen at a time** — substantive but singular — advanced like a lesson player.
Not a long page, not a sparse list of toggles.

Audience: **English-speaking learners.** Explanations stay in English; "easier"
means focus and flow, not deleting content or switching language.

## Goals

1. A chapter is digestible: one focused screen at a time, never a 5,000-word wall.
2. Comfortable to read — the screen IS the content; no hunting, no click-labor.
3. Clear sense of place and progress, even when a chapter is content-heavy.

## Non-goals

- Rewriting/shortening the English content (deferred).
- Deleting content, or changing the lesson data schema and SRS/progress logic.

## Design — chapter as a lesson player

Replace the long chapter scroll with a **stepped lesson player**: one screen,
Prev/Next, grouped progress.

### Screen order (per owner decision)

`Words → Grammar → Dialogue → Practice`

Rationale: learn the pieces (words, then grammar), then see them combine in the
dialogue as payoff, then practice. Reading and culture note slot in as extra
screens (reading in the Dialogue group; culture as an end "notes" screen).

### Steps grouped into phases

Each item is its own focused screen, so content-heavy chapters have more screens
(e.g., ch41 has 6 grammar screens). To keep that from feeling endless, the
progress bar is **grouped into 4 phases** — Words · Grammar · Dialogue · Practice
— and shows position within the current phase (e.g., "Grammar · 2 / 6"). Many
screens, but the learner always sees "which phase, how far, almost done."

### Per-screen treatment

- Phase identity: a small color + icon tag per phase (Words, Grammar, Dialogue,
  Practice) so the screen type reads instantly.
- Each screen is substantive and self-contained: a Grammar screen shows the
  explanation, examples, and pitfall together (no separate detail layer needed —
  this resolves the earlier "where do I see detail?" question; detail is the
  screen).
- Smooth transition on advance; a completion screen at the end with a review CTA.
- Audio (`AudioButton`) and romanization stay available per line.

### Data → screens mapping

- `extendedVocabulary` / core vocab → Words screen(s)
- each `grammarNotes[]` entry → one Grammar screen (full: mentalModel, examples,
  contrast, pitfall, exceptions)
- `dialogue` + `extendedDialogue` → Dialogue screen(s), with grammar tags showing
  the just-learned patterns in use
- `readingText` → a screen in the Dialogue group
- `culturalNote` → an end "notes" screen
- `inlineExercises` → Practice screen(s)

Chapters vary (some lack reading/culture/extendedDialogue) — generate screens
from whatever exists; never render an empty screen.

## Implementation notes

- New `LessonPlayer.svelte` (step state, grouped progress, Prev/Next, completion)
  + a small set of per-phase screen components. Reuse existing parts: chat
  bubbles, `AudioButton`, `RomanizationLine`, and the inline-exercise rendering
  from `RichChapterSections.svelte` / `ExerciseHost.svelte`.
- In `Learn.svelte`, the chapter view renders `LessonPlayer` instead of the long
  stack of sections. List view, pager, and all SRS/progress wiring stay intact.
- This removes the earlier fragile "one-liner ↔ deep-dive matching" risk: each
  grammar note is simply its own screen.

## Staging (stability first)

1. **Player scaffold** — `LessonPlayer` with step nav + grouped progress, mapping
   existing chapter data to screens. Verify on ch2 (simple) and ch41
   (grammar-heavy) in the dev preview.
2. **Per-phase polish** — color/icon identity, transitions, completion screen,
   dialogue grammar tags.
3. **Wire actions** — mark-complete, add-deck, practice link, prev/next chapter;
   retire the old long-page section stack.

Each stage built and verified before the next.

## Risks

- Largest change yet to the chapter view — stage it; keep list/SRS untouched.
- 65 chapters with uneven content (missing reading/culture/dialogue) — screen
  generation must handle gaps gracefully; verify across several levels.
- Grouped-progress math (phases of varying length) must stay correct as content
  changes.

## Testing / verification

- Existing 134 tests stay green; add tests for screen generation from chapter
  data (including chapters missing optional sections) and grouped-progress
  position.
- Manual: ch1, 2, 17, 41, 65 in dev preview — focused screens, correct order,
  grouped progress, completion, prev/next chapter, mark-complete.
- Build succeeds.
