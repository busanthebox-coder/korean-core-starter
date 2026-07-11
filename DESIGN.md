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

## C7 Hanja Root UI Rules

- Same-root links live inside entry detail sheets as a compact section after ordinary entry connections.
- Current words read as selected tags; other root-family members are buttons that stay inside the same sheet.
- Root browser lives in Guide as a reference/practice surface, with search, level tabs, a selected-root panel, and a short unique-option quiz.
- Hanja cards explain meaning families only; they do not teach stroke order or ask learners to write characters.

## C1 Listening UI Rules

- Listening practice uses the shared `ListeningSession` surface in LessonPlayer and Practice, not a separate route.
- The Korean sentence stays hidden until the learner answers; reveal shows Korean, romanization, and English together.
- Playback is capped at three plays per item, with a 0.8x speed toggle for careful listening.
- If the browser has no usable Korean Web Speech support, listening screens and mode buttons stay hidden.

## V3 Speak UI Rules

- Speak is the single primary speaking tab and opens on the daily speaking plan; the larger shadowing and roleplay libraries are mounted only after the learner chooses one.
- The daily speaking plan is three short actions: say lesson lines, repeat one scene, then answer one prompt.
- Say-it lines are generated from lesson dialogue first and saved in `kcs.spoken-v1` only after all three lines are checked.
- Daily speaking actions deep-link to the exact activity instead of reopening the beginning of a chapter.
- Only one speaking library is visible at a time so the route remains a short session launcher rather than a long catalogue.
- Old `/talk`, `/chat`, and `/conversation` routes redirect to `/speak` so learners do not have to choose between speaking surfaces.

## Active Lesson UI Rules

- Chapter lessons remember the learner's current screen per chapter and resume there after leaving and returning.
- A direct activity link such as Say-it temporarily opens that activity without replacing the learner's saved chapter position.
- Completing a full chapter clears its saved screen position; backing out keeps it.
- Route changes begin at the top of the destination page. Smooth motion is reserved for deliberate in-page moves initiated by the learner.
- Each lesson screen should contain one task or one small concept group; content that cannot fit comfortably on a mobile viewport must be split into another screen.
- Word screens contain no more than three entries. The Korean form and meaning stay visible, while examples and usage rationale open on request.

## V3 Today UI Rules

- Learn opens with one warm, persimmon-edged Today card. It replaces separate progress and mission cards and exposes one primary Start action.
- The Today card shows only the next action. Remaining actions stay hidden until the learner finishes the current one.
- Progress is reduced to chapter count and one slim bar; mastery and streak detail belong in secondary views.
- On mobile, the first Learn viewport contains the Today card and the current level header. Course library surfaces begin below that point.
- Practice opens on one recommended drill. The full practice toolbox stays in a native details disclosure labelled "More drills".

## WS12 Learn IA Rules

- Learn path is grouped by CEFR track accordions; only the current unfinished track opens by default.
- User-opened track headers persist in `kcs.learn-open-v1`, while search results open matching groups automatically.
- Group headers show a stamp-style level mark, chapter-only progress, and the existing curriculum track description.
- Chapter, vocab pack, and checkpoint cards keep their existing card anatomy inside each group.

## Mobile

- No horizontal overflow.
- Pack cards collapse to one column.
- Buttons keep stable dimensions and do not rely on viewport-scaled font sizes.
