# Korean Core Starter Design System

This file records the existing Hanmok UI rules so new C0 pack screens extend the app instead of changing its voice.

## Product Feel

- Quiet study app, not a landing page.
- Warm paper background with ink, persimmon primary actions, green for mastery/correct states, and blue/purple only as small category accents.
- Compact lessons should feel like an app session: one focused surface, short chunks, obvious next action.

## Tokens

- Source: `src/styles/tokens.css`.
- Background: `--bg` paper cream.
- Surfaces: `--surface` white and `--surface-2` warm paper.
- Primary action: `--primary`, `--primary-press`, `--primary-on`.
- Correct/mastery: `--green`, `--green-dark`, `--green-soft`.
- Borders: `--border`, `--border-2`, `--rule`.
- Type: `--sans` for body/UI, `--serif-ko` for display Korean and lesson titles.

## Components

- Route pages use a constrained central column with 28-32px page padding.
- Course path items are single cards or rows, never nested cards.
- Cards use the existing 14-20px token radius; repeated path nodes use `--radius`.
- Primary actions use `.btn3d`; secondary actions use light pill buttons.
- Progress/completion states use filled circles, checkmarks, or slim bars.
- Lesson content runs through `LessonPlayer` where possible so progress, done state, and mobile behavior stay consistent.

## C0 Pack UI Rules

- Pack cards appear inside the Learn path immediately after the chapter where that pack becomes useful.
- Pack cards are visually related to chapter nodes but smaller and warmer, so they read as short side sessions.
- Pack title and count must be scannable: category, number of words, and one practical outcome.
- Pack open state uses `LessonPlayer` with short word chunks plus a MatchGame screen.
- Completed pack state uses `kcs.packs-v1` and should be reversible from the same UI.

## C3 Checkpoint UI Rules

- Checkpoint cards appear in the Learn path after A1, A2, and B1 track blocks.
- They use green mastery styling and explicitly read as diagnostic review, not a locked gate.
- Checkpoint sessions are one-question-at-a-time app screens with immediate feedback and a final weak-chapter report.
- Spiral review questions inside LessonPlayer carry a small green "복습" badge with the source chapter number.
- Checkpoint state uses `kcs.checkpoint-v1`; re-taking a checkpoint must remain available.

## C6 Reading Room UI Rules

- Reading Room appears inside the Learn path after the chapter list, not as a separate primary nav tab.
- Reader list cards use the warm side-session treatment from vocab packs, with level tabs and completion checks.
- Reader pages use `--serif-ko` for Korean body text, generous paragraph spacing, and no romanized body.
- Glossable tokens use a subtle dashed underline and one active popover at a time; unmatched tokens stay plain.
- Completed reader state uses `kcs.readers-v1` with score and read timestamp.

## Mobile

- No horizontal overflow.
- Pack cards collapse to one column.
- Buttons keep stable dimensions and do not rely on viewport-scaled font sizes.
