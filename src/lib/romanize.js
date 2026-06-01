// Revised-Romanization-ish transliterator with liaison, 받침 nasalization, and ㄹ-assimilation.
// Ported from scripts/generate-korean-data.mjs (kept identical so stored + runtime readings match).
const CHOSEONG = ['g','kk','n','d','tt','r','m','b','pp','s','ss','','j','jj','ch','k','t','p','h'];
const JUNGSEONG = ['a','ae','ya','yae','eo','e','yeo','ye','o','wa','wae','oe','yo','u','wo','we','wi','yu','eu','ui','i'];
const JONGSEONG = ['', 'k','k','ks','n','nj','nh','t','l','lk','lm','lb','ls','lt','lp','lh','m','p','ps','t','t','ng','t','t','k','t','p','t'];
const LIAISON = {
  1: ['', 'g'], 2: ['', 'kk'], 3: ['k', 's'], 4: ['', 'n'], 5: ['n', 'j'], 6: ['n', ''],
  7: ['', 'd'], 8: ['', 'r'], 9: ['l', 'g'], 10: ['l', 'm'], 11: ['l', 'b'], 12: ['l', 's'],
  13: ['l', 't'], 14: ['l', 'p'], 15: ['', 'r'], 16: ['', 'm'], 17: ['', 'b'], 18: ['p', 's'],
  19: ['', 's'], 20: ['', 'ss'], 22: ['', 'j'], 23: ['', 'ch'], 24: ['', 'k'], 25: ['', 't'],
  26: ['', 'p'], 27: ['', '']
};
// Compatibility-jamo (U+3131–U+3163) romanization, for texting slang like ㅋㅋ, ㅇㅇ, ㅠㅠ.
const JAMO_ROMAN = {
  'ㄱ':'g','ㄲ':'kk','ㄳ':'gs','ㄴ':'n','ㄵ':'nj','ㄶ':'nh','ㄷ':'d','ㄸ':'tt','ㄹ':'r','ㄺ':'rg','ㄻ':'rm','ㄼ':'rb','ㄽ':'rs','ㄾ':'rt','ㄿ':'rp','ㅀ':'rh','ㅁ':'m','ㅂ':'b','ㅃ':'pp','ㅄ':'bs','ㅅ':'s','ㅆ':'ss','ㅇ':'ng','ㅈ':'j','ㅉ':'jj','ㅊ':'ch','ㅋ':'k','ㅌ':'t','ㅍ':'p','ㅎ':'h',
  'ㅏ':'a','ㅐ':'ae','ㅑ':'ya','ㅒ':'yae','ㅓ':'eo','ㅔ':'e','ㅕ':'yeo','ㅖ':'ye','ㅗ':'o','ㅘ':'wa','ㅙ':'wae','ㅚ':'oe','ㅛ':'yo','ㅜ':'u','ㅝ':'wo','ㅞ':'we','ㅟ':'wi','ㅠ':'yu','ㅡ':'eu','ㅢ':'ui','ㅣ':'i'
};

export function romanizeKorean(text = '') {
  const chars = String(text).split('');
  let carry = '';
  return chars.map((char, index) => {
    const code = char.charCodeAt(0);
    if (code < 0xac00 || code > 0xd7a3) return JAMO_ROMAN[char] || char;
    const offset = code - 0xac00;
    const initial = Math.floor(offset / 588);
    const vowel = Math.floor((offset % 588) / 28);
    const final = offset % 28;
    // Next syllable, skipping spaces so sound changes apply across word boundaries (몇 명 → myeon myeong).
    // Liaison, however, only links when the next syllable is directly adjacent (no space).
    const adjacent = chars[index + 1] && chars[index + 1].charCodeAt(0) >= 0xac00 && chars[index + 1].charCodeAt(0) <= 0xd7a3;
    let j = index + 1;
    while (chars[j] === ' ') j++;
    const nextCode = chars[j]?.charCodeAt(0) || 0;
    const isNextSyl = nextCode >= 0xac00 && nextCode <= 0xd7a3;
    const nextOffset = nextCode - 0xac00;
    const nextInitial = isNextSyl ? Math.floor(nextOffset / 588) : -1;
    const nextVowel = isNextSyl ? Math.floor((nextOffset % 588) / 28) : -1;

    const liaison = adjacent && final && nextInitial === 11 ? LIAISON[final] : null;
    const onset = carry || CHOSEONG[initial];
    carry = liaison ? liaison[1] : '';
    let coda = liaison ? liaison[0] : JONGSEONG[final];

    // 구개음화 (palatalization): ㄷ/ㅌ + 이 → 지/치 (같이 gachi, 맏이 maji, 굳이 guji)
    if (liaison && nextVowel === 20) {
      if (final === 7) carry = 'j';        // ㄷ + 이
      else if (final === 25) carry = 'ch'; // ㅌ + 이
    }

    // 비음화 before ㄴ(2)/ㅁ(6): stop codas nasalize
    if (!liaison && final && (nextInitial === 2 || nextInitial === 6)) {
      if ([1, 2, 9, 24].includes(final)) coda = 'ng';
      else if ([7, 13, 19, 20, 22, 23, 25, 27].includes(final)) coda = 'n';
      else if ([14, 17, 26].includes(final)) coda = 'm';
    }
    // ㄹ-assimilation before ㄹ(5)
    if (!liaison && final && nextInitial === 5) {
      if (final === 4 || final === 8) { coda = 'l'; carry = 'l'; }
      else {
        if ([1, 2, 9, 24].includes(final)) coda = 'ng';
        else if ([7, 13, 19, 20, 22, 23, 25, 27].includes(final)) coda = 'n';
        else if ([14, 17, 26].includes(final)) coda = 'm';
        carry = 'n';
      }
    }
    // 격음화 (aspiration): ㅎ fuses with a neighbouring ㄱ/ㄷ/ㅂ/ㅈ → ㅋ/ㅌ/ㅍ/ㅊ
    if (!liaison && final) {
      // ㅎ-type final + plain stop onset: 좋다→조타, 많다→만타, 싫다→실타
      if ([6, 15, 27].includes(final) && [0, 3, 7, 12].includes(nextInitial)) {
        carry = { 0: 'k', 3: 't', 7: 'p', 12: 'ch' }[nextInitial];
        coda = final === 6 ? 'n' : final === 15 ? 'l' : '';
      }
      // stop final + ㅎ onset(18): 축하→추카, 입학→이팍, 못해→모태, 읽히→일키
      else if (nextInitial === 18) {
        if ([1, 2, 24].includes(final)) { carry = 'k'; coda = ''; }
        else if (final === 9) { carry = 'k'; coda = 'l'; }
        else if ([7, 19, 20, 22, 23, 25].includes(final)) { carry = 't'; coda = ''; }
        else if ([17, 26].includes(final)) { carry = 'p'; coda = ''; }
        else if (final === 11) { carry = 'p'; coda = 'l'; }
      }
    }
    return onset + JUNGSEONG[vowel] + coda;
  }).join('').replace(/\s+/g, ' ').trim();
}
