// Which lesson screens make the learner type Korean.
//
// Typing needs a Korean IME the learner may not have set up, so for now these
// screens are set aside from every chapter — the data stays, only the screens are
// filtered out of the flow. Flip USE back on (or delete the filter call) to restore.
//
// Tap-based practice is kept: multiple choice (options) and word-order tiles
// (orderWords) need no keyboard, and matching and say-it aren't typing at all.

const TYPING_KINDS = new Set(['writing', 'conjugation', 'listening']);

export function isTypingScreen(screen) {
  if (!screen) return false;
  if (TYPING_KINDS.has(screen.kind)) return true;
  // An inline exercise with no options and no word tiles is a free-text box.
  if (screen.kind === 'exercise') {
    const data = screen.data || {};
    const hasOptions = Array.isArray(data.options) && data.options.length > 0;
    const isOrderWords = data.type === 'orderWords';
    return !hasOptions && !isOrderWords;
  }
  return false;
}

export function withoutTyping(screens = []) {
  return screens.filter((screen) => !isTypingScreen(screen));
}
