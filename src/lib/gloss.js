import { addEntryForms, addGlossMatch } from './glossForms.js';
import { COMMON_READER_ENTRIES } from './glossReaderEntries.js';
import { COPULA_ENDINGS, cleanGlossToken, stripParticle } from './glossTokens.js';

export { cleanGlossToken, stripParticle } from './glossTokens.js';

export function buildGlossIndex(entries = []) {
  const byHeadword = new Map();
  const byForm = new Map();
  for (const entry of [...entries, ...COMMON_READER_ENTRIES]) {
    if (!entry?.hangul || !entry?.id) continue;
    addGlossMatch(byHeadword, entry.hangul, entry);
    addEntryForms(byForm, entry);
  }
  return { byHeadword, byForm };
}

export function matchGlossToken(raw, index) {
  const token = cleanGlossToken(raw);
  if (!token || !index) return null;
  const exact = index.byHeadword.get(token) || index.byForm.get(token);
  if (exact) return { token, entry: exact, matched: token, strategy: 'exact' };

  for (const ending of COPULA_ENDINGS) {
    if (token.length <= ending.length || !token.endsWith(ending)) continue;
    const base = token.slice(0, -ending.length);
    const entry = index.byHeadword.get(base) || index.byForm.get(base);
    if (entry) return { token, entry, matched: base, strategy: 'copula' };
  }

  const stripped = stripParticle(token);
  if (stripped !== token) {
    const entry = index.byHeadword.get(stripped) || index.byForm.get(stripped);
    if (entry) return { token, entry, matched: stripped, strategy: 'particle' };
  }
  return null;
}

export function tokenizeKoreanText(text) {
  return String(text || '')
    .split(/\s+/)
    .map(cleanGlossToken)
    .filter((token) => /[가-힣]/.test(token));
}
