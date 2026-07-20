// Splitting a chapter into two sittings.
//
// The home screen promises "10 minutes for today", but a chapter runs about 24
// screens — chapter 1 alone is 17 new words, 2 grammar notes, a dialogue and 11
// drills. That is a textbook unit, not a session, and there is no point at which
// stopping feels like finishing rather than giving up.
//
// So we mark the seam the lesson already has: everything taught, then everything
// drilled. The learner may carry straight on — nothing is blocked — but they are
// told they have reached a real stopping place, and where they stopped is kept.

const TEACHING_PHASES = new Set(['words', 'grammar', 'dialogue']);
const MIN_TAUGHT = 3;   // fewer than this and the first sitting isn't worth naming
const MIN_LEFT = 6;     // fewer than this and the rest is quicker than the interruption

const PHASE_NAMES = {
  words: 'words',
  grammar: 'grammar',
  dialogue: 'the dialogue',
};

export function sessionBreakAt(screens = []) {
  const firstDrill = screens.findIndex((screen) => !TEACHING_PHASES.has(screen?.phase));
  if (firstDrill < MIN_TAUGHT) return -1;
  if (screens.length - firstDrill < MIN_LEFT) return -1;
  return firstDrill;
}

export function sessionSummary(screens = []) {
  const names = [];
  for (const screen of screens) {
    const name = PHASE_NAMES[screen?.phase];
    if (name && !names.includes(name)) names.push(name);
  }
  if (!names.length) return 'the first part';
  if (names.length === 1) return names[0];
  return `${names.slice(0, -1).join(', ')} and ${names[names.length - 1]}`;
}

export function withSessionBreak(screens = []) {
  const at = sessionBreakAt(screens);
  if (at < 0) return screens;
  const breakScreen = {
    phase: screens[at].phase,
    kind: 'sessionBreak',
    data: {
      doneCount: at,
      remainingCount: screens.length - at,
      covered: sessionSummary(screens.slice(0, at)),
    },
  };
  return [...screens.slice(0, at), breakScreen, ...screens.slice(at)];
}
