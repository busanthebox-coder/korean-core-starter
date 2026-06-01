import { decompose } from './hangul.js';

// Verb-specific explanation for WHY a 아/어-based form looks the way it does.
// Covers the forms whose shape depends on the stem (polite present, past, must).
// Returns null for other forms so the caller can fall back to a generic note.
export function explainForm(entry, key) {
  if (!['politePresent', 'past', 'must'].includes(key)) return null;
  const form = entry.forms?.[key];
  if (!form) return null;

  const stem = (entry.hangul || '').replace(/다$/, '');
  const irr = entry.irregular || '';

  if (/하$/.test(stem)) {
    return `하다-verb: 하 contracts with 여 to become 해, so this is ${form}. Most noun+하다 verbs work this way (공부했어요, 숙제했어요).`;
  }
  if (irr.includes('ㅂ')) return `ㅂ-irregular: the final ㅂ changes to 우 before a vowel ending, giving ${form} — not a literal attachment.`;
  if (irr.includes('ㄷ')) return `ㄷ-irregular: the final ㄷ turns into ㄹ before a vowel ending, giving ${form}.`;
  if (irr.includes('르')) return `르-irregular: 르 doubles the ㄹ before a vowel, giving ${form} (모르다 → 몰랐어요).`;
  if (irr.includes('ㅡ')) return `ㅡ-stem: the ㅡ drops before 아/어, giving ${form} (크다 → 컸어요).`;

  const last = stem.slice(-1);
  const d = decompose(last);
  if (!d.tail) {
    return `The stem ends in the vowel ${d.vowel}, so 아/어 merges into it and contracts → ${form} (자다 → 잤어요, 오다 → 왔어요).`;
  }
  const bright = d.vowel === 'ㅏ' || d.vowel === 'ㅗ';
  return `The stem ends in a consonant and its vowel is ${d.vowel}, so it takes ${bright ? '아 (ㅏ/ㅗ are "bright" vowels)' : '어'} → ${form}.`;
}
