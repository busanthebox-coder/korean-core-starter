// allow: SIZE_OK - durable data-generation pipeline; this change set locks behavior with generate/apply/build/verify/test/browser evidence, while structural generator extraction belongs to the WS2 pipeline refactor.
import { copyFileSync, existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import {
  applyStableIds,
  loadIdManifest,
  verifyDataDir,
  writeIdManifest
} from './lib/integrity.mjs';

function optionsFromArgs(argv) {
  const defaultDir = new URL('../korean/data/', import.meta.url);
  const options = {
    outDir: defaultDir,
    acceptManifestAdditions: false
  };
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === '--out') {
      const value = argv[++index];
      if (!value) throw new Error('Missing value for --out');
      options.outDir = pathToFileURL(`${resolve(value)}/`);
    } else if (arg === '--accept-manifest-additions') {
      options.acceptManifestAdditions = true;
    } else {
      throw new Error(`Unknown argument: ${arg}`);
    }
  }
  return options;
}

const sourceDataDir = new URL('../korean/data/', import.meta.url);
const generatorOptions = optionsFromArgs(process.argv.slice(2));
const requestedOutDir = generatorOptions.outDir;
mkdirSync(requestedOutDir, { recursive: true });

const stagingDirPath = mkdtempSync(join(tmpdir(), 'kcs-generate-'));
const outDir = pathToFileURL(`${stagingDirPath}/`);
let stagingCleaned = false;
function cleanupStaging() {
  if (stagingCleaned) return;
  rmSync(stagingDirPath, { recursive: true, force: true });
  stagingCleaned = true;
}
process.once('exit', cleanupStaging);

function readDataInput(name, fallback = null) {
  const candidates = [new URL(name, outDir), new URL(name, requestedOutDir), new URL(name, sourceDataDir)];
  for (const candidate of candidates) {
    try {
      return JSON.parse(readFileSync(candidate, 'utf8'));
    } catch (error) {
      if (error?.code !== 'ENOENT') throw error;
    }
  }
  return fallback;
}

function publishGeneratedFiles() {
  for (const file of [
    'words.json',
    'expressions.json',
    'patterns.json',
    'newcomer-vocab.json',
    'vocab-extended.json',
    'guide.json',
    'dialogues.json',
    'conversations.json',
    'grammar.json'
  ]) {
    copyFileSync(new URL(file, outDir), new URL(file, requestedOutDir));
  }

  const bundleTarget = requestedOutDir.href === sourceDataDir.href
    ? new URL('../korean/data-bundle.js', import.meta.url)
    : new URL('data-bundle.js', requestedOutDir);
  copyFileSync(new URL('data-bundle.js', outDir), bundleTarget);
}

let activeIdManifest = null;
let pendingIdManifest = null;

const formKeys = [
  'dictionary', 'casualPresent', 'politePresent', 'formalPresent', 'negative',
  'past', 'future', 'want', 'can', 'cannot', 'must', 'dontHaveTo',
  'pleaseDo', 'pleaseDont', 'shallWe'
];

const formGroupInfo = {
  essential: {
    meaning: 'The base forms you need before building longer sentences.',
    example: 'Use the polite form with staff, teachers, strangers, and most adults.'
  },
  conversation: {
    meaning: 'Forms for time, desire, ability, and inability.',
    example: 'These answer questions like what happened, what you will do, and what you can do.'
  },
  survival: {
    meaning: 'Forms for rules, permission, requests, and suggestions.',
    example: 'Use request forms only when it is natural to ask someone else to do that action.'
  }
};

const formPatternLinks = {
  negative: 'pattern-009',
  want: 'pattern-005',
  can: 'pattern-007',
  cannot: 'pattern-008',
  must: 'pattern-011',
  dontHaveTo: 'pattern-012',
  pleaseDo: 'pattern-015',
  pleaseDont: 'pattern-014',
  shallWe: 'pattern-016'
};

const patternStudyGuides = {
  'pattern-001': {
    title: 'Noun sentences',
    howToBuild: ['Choose a noun.', 'Use 이에요 after a final consonant and 예요 after a vowel.', 'Use 입니다 when the situation is very formal.'],
    whenToUse: 'Use this for identity, names, jobs, places, and simple “it is...” sentences. It does not describe actions.',
    learnerPath: 'After this, study 있어요 and 없어요 so you can say what something is and whether it exists.',
    linkedWordIds: ['word-verb-007'],
    relatedPatternIds: ['pattern-002', 'pattern-003']
  },
  'pattern-002': {
    title: 'Existence and possession',
    howToBuild: ['Put the thing before 이/가.', 'Use 이 after a consonant and 가 after a vowel.', 'Add 있어요 for “there is” or “I have.”'],
    whenToUse: 'Use it for having time, money, reservations, friends, or for asking whether something exists in a place.',
    learnerPath: 'Pair this with 없어요. Together they cover many beginner travel and classroom situations.',
    linkedWordIds: ['word-verb-029'],
    relatedPatternIds: ['pattern-003', 'pattern-013']
  },
  'pattern-003': {
    title: 'Absence and not having',
    howToBuild: ['Put the missing thing before 이/가.', 'Use 없어요 to say it does not exist or you do not have it.', 'Add a time or place if needed.'],
    whenToUse: 'Use it for “I do not have time,” “there is no bathroom,” “there is no problem,” and similar survival sentences.',
    learnerPath: 'Learn it together with 있어요 so yes/no existence questions feel natural.',
    linkedWordIds: ['word-verb-029'],
    relatedPatternIds: ['pattern-002', 'pattern-009']
  },
  'pattern-004': {
    title: 'Item requests',
    howToBuild: ['Name the item you want.', 'Add 주세요.', 'Add quantity words like 하나 or 한 잔 before 주세요 when needed.'],
    whenToUse: 'Use this in restaurants, cafes, stores, counters, and anywhere you are asking for a concrete item.',
    learnerPath: 'This is different from V아/어 주세요. N 주세요 asks for a thing; V아/어 주세요 asks someone to do an action.',
    linkedWordIds: ['word-verb-022'],
    relatedPatternIds: ['pattern-015']
  },
  'pattern-005': {
    title: 'Desire: want to do',
    howToBuild: ['Remove 다 from the dictionary verb.', 'Add 고 싶어요.', 'Put the object before the verb if the action needs one.'],
    whenToUse: 'Use it for your own wants: 먹고 싶어요, 가고 싶어요, 쉬고 싶어요. It sounds softer and more useful than directly saying “I want X” in many beginner situations.',
    learnerPath: 'Practice this after you know the polite present form. It is one of the fastest ways to turn vocabulary into real conversation.',
    linkedWordIds: ['word-verb-001', 'word-verb-002', 'word-verb-003', 'word-verb-026'],
    relatedPatternIds: ['pattern-006', 'pattern-016']
  },
  'pattern-006': {
    title: 'Negative desire',
    howToBuild: ['Remove 다 from the verb.', 'Add 고 싶지 않아요.', 'Add 지금은 or 오늘은 to make the refusal softer.'],
    whenToUse: 'Use this when you do not want to eat, go, wait, talk, or continue. It is often gentler than 싫어요.',
    learnerPath: 'Use this with simple time words first, then compare it with 안 V해요, which only says you do not do something.',
    linkedWordIds: ['word-verb-001', 'word-verb-003', 'word-verb-014', 'word-verb-018'],
    relatedPatternIds: ['pattern-005', 'pattern-009', 'pattern-010']
  },
  'pattern-007': {
    title: 'Ability and possibility',
    howToBuild: ['Remove 다 from the verb.', 'Use ㄹ 수 있어요 after a vowel ending.', 'Use 을 수 있어요 after a consonant ending.'],
    whenToUse: 'Use it for skills, schedule possibility, permission-like possibility, and practical questions such as 카드로 살 수 있어요?',
    learnerPath: 'Study this with 못 V해요 so you can clearly say what is possible and what is not possible.',
    linkedWordIds: ['word-verb-003', 'word-verb-006', 'word-verb-011', 'word-verb-012'],
    relatedPatternIds: ['pattern-008', 'pattern-013']
  },
  'pattern-008': {
    title: 'Cannot / unable to',
    howToBuild: ['For most verbs, put 못 before the normal polite verb: 가요 becomes 못 가요, 먹어요 becomes 못 먹어요.', 'Do not add 해요 to a non-하다 verb. It is 못 가요, not 못 가해요.', 'For 하다 verbs, use 못 해요 or noun 못 해요: 해요 becomes 못 해요, 공부해요 becomes 공부 못 해요.'],
    whenToUse: 'Use it for inability, schedule conflicts, food restrictions, or language limits: 못 가요, 못 먹어요, 한국어를 잘 못해요. It says “I cannot” because of a real limit, not simply “I choose not to.”',
    learnerPath: 'This is a survival pattern. First memorize real examples like 못 가요, 못 먹어요, and 말 못 해요 before trying to build new ones.',
    linkedWordIds: ['word-verb-001', 'word-verb-003', 'word-verb-014', 'word-verb-018'],
    relatedPatternIds: ['pattern-007', 'pattern-009']
  },
  'pattern-009': {
    title: 'Short negative',
    howToBuild: ['Put 안 before most simple verbs.', 'For noun + 하다 verbs, put 안 between the noun and 하다.', 'Use it with a time word to make the meaning clear.'],
    whenToUse: 'Use it for ordinary negatives: 안 가요, 안 먹어요, 공부 안 해요. It is short, common, and conversational.',
    learnerPath: 'Compare it with 못 V해요. 안 often means you do not do it; 못 means you cannot.',
    linkedWordIds: ['word-verb-001', 'word-verb-003', 'word-verb-015', 'word-verb-016'],
    relatedPatternIds: ['pattern-008', 'pattern-010']
  },
  'pattern-010': {
    title: 'Careful negative',
    howToBuild: ['Remove 다 from the verb or adjective.', 'Add 지 않아요.', 'Use it when you want a more careful or written-sounding negative.'],
    whenToUse: 'Use it with both verbs and adjectives: 가지 않아요, 맵지 않아요, 어렵지 않아요. It sounds more careful than the short 안 negative, so it is useful in explanations, writing, or polite clarification.',
    learnerPath: 'Beginners can use 안 first, then learn 지 않아요 for careful speech and longer sentences.',
    linkedWordIds: ['word-verb-003', 'word-verb-001'],
    relatedPatternIds: ['pattern-009', 'pattern-006']
  },
  'pattern-011': {
    title: 'Obligation: have to',
    howToBuild: ['Choose the 아/어 form of the verb.', 'Add 야 해요.', 'Use a reason before it when you want to explain why.'],
    whenToUse: 'Use it for rules, appointments, health needs, work, school, and personal plans: 가야 해요, 먹어야 해요, 예약해야 해요.',
    learnerPath: 'This is a core survival pattern because it lets you explain constraints instead of only saying yes or no.',
    linkedWordIds: ['word-verb-003', 'word-verb-001', 'word-verb-015', 'word-verb-029'],
    relatedPatternIds: ['pattern-012', 'pattern-018']
  },
  'pattern-012': {
    title: 'Not necessary / do not have to',
    howToBuild: ['Remove 다 from the verb.', 'Add 지 않아도 돼요.', 'Use it to remove an obligation.'],
    whenToUse: 'Use it to reassure someone or explain that something is optional: 기다리지 않아도 돼요, 예약하지 않아도 돼요.',
    learnerPath: 'Study it right after 아/어야 해요. The pair gives you “must” and “do not have to.”',
    linkedWordIds: ['word-verb-003', 'word-verb-018', 'word-verb-029', 'word-verb-015'],
    relatedPatternIds: ['pattern-011', 'pattern-013']
  },
  'pattern-013': {
    title: 'Permission question',
    howToBuild: ['Use the 아/어 form of the verb.', 'Add 도 돼요?', 'Add 여기서, 지금, or the object if the question needs context.'],
    whenToUse: 'Use it before sitting, entering, taking photos, using a card, or doing anything where permission matters.',
    learnerPath: 'This is one of the most useful travel patterns. Pair it with 지 마세요 so you understand both permission and prohibition.',
    linkedWordIds: ['word-verb-010', 'word-verb-030', 'word-verb-012', 'word-verb-003'],
    relatedPatternIds: ['pattern-014', 'pattern-012']
  },
  'pattern-014': {
    title: 'Prohibition: please do not',
    howToBuild: ['Remove 다 from the verb.', 'Add 지 마세요.', 'Use a place or time phrase if the rule needs context.'],
    whenToUse: 'Use it for rules, warnings, and gentle requests: 사진 찍지 마세요, 가지 마세요, 걱정하지 마세요. You will see it on signs and hear it from staff, but use it carefully because it can sound like an instruction.',
    learnerPath: 'You need this mostly for understanding signs and staff instructions. Use it carefully when speaking to others.',
    linkedWordIds: ['word-verb-003', 'word-verb-030', 'word-verb-024', 'word-verb-025'],
    relatedPatternIds: ['pattern-013', 'pattern-015']
  },
  'pattern-015': {
    title: 'Action requests',
    howToBuild: ['Use the 아/어 form of the verb.', 'Add 주세요.', 'Add 좀 to soften everyday requests.'],
    whenToUse: 'Use it when asking someone to do an action: 도와주세요, 열어 주세요, 다시 말해 주세요, 사진 찍어 주세요.',
    learnerPath: 'This is not the same as N 주세요. Learn both so you can ask for items and actions naturally.',
    linkedWordIds: ['word-verb-024', 'word-verb-014', 'word-verb-021', 'word-verb-030'],
    relatedPatternIds: ['pattern-004', 'pattern-014']
  },
  'pattern-016': {
    title: 'Suggestion / checking what to do',
    howToBuild: ['Use ㄹ까요 after a vowel-ending stem.', 'Use 을까요 after a consonant-ending stem.', 'Add 같이 or 지금 when useful.'],
    whenToUse: 'Use it for suggestions and gentle decision questions: 갈까요?, 먹을까요?, 기다릴까요? It can mean “shall we” when deciding together, or “should I” when asking what action you should take.',
    learnerPath: 'This turns verbs into conversation starters. It is especially useful after you know 가다, 먹다, 기다리다, and 주문하다.',
    linkedWordIds: ['word-verb-003', 'word-verb-001', 'word-verb-018', 'word-verb-028'],
    relatedPatternIds: ['pattern-005', 'pattern-017']
  },
  'pattern-017': {
    title: 'Speaker decision / promise',
    howToBuild: ['Use ㄹ게요 after a vowel-ending stem.', 'Use 을게요 after a consonant-ending stem.', 'Use it only for what the speaker will do.'],
    whenToUse: 'Use it when you decide or promise your own action: 제가 할게요, 전화할게요, 기다릴게요. It is common when responding to someone and volunteering what you will do next.',
    learnerPath: 'Do not use this to predict another person. It is about the speaker’s choice.',
    linkedWordIds: ['word-verb-003', 'word-verb-007', 'word-verb-027', 'word-verb-018'],
    relatedPatternIds: ['pattern-016', 'pattern-018']
  },
  'pattern-018': {
    title: 'Reason connector',
    howToBuild: ['Use 아서/어서 after the first verb or adjective.', 'Put the result after it.', 'Use 그래서 in your English brain: reason, so result.'],
    whenToUse: 'Use it to explain why something happened: 바빠서 못 가요, 아파서 쉬어요, 늦어서 죄송합니다. It lets beginners connect a reason to a result without making two separate sentences.',
    learnerPath: 'This makes your Korean sound connected instead of like separate flashcard sentences.',
    linkedWordIds: ['word-verb-026', 'word-verb-003', 'word-verb-006'],
    relatedPatternIds: ['pattern-011', 'pattern-020']
  },
  'pattern-019': {
    title: 'And / sequence connector',
    howToBuild: ['Remove 다 from the first verb or adjective.', 'Add 고.', 'Put the next action or description after it.'],
    whenToUse: 'Use it to list actions or describe sequence: 먹고 가요, 씻고 자요, 싸고 좋아요. It is one of the easiest ways to make longer sentences from vocabulary you already know.',
    learnerPath: 'Use this after you can make short sentences. It helps combine two simple ideas into one sentence.',
    linkedWordIds: ['word-verb-001', 'word-verb-003', 'word-verb-008', 'word-verb-015'],
    relatedPatternIds: ['pattern-018', 'pattern-020']
  },
  'pattern-020': {
    title: 'Condition: if / when',
    howToBuild: ['Remove 다 from the verb or adjective.', 'Add 면.', 'Put the result, request, or advice after it.'],
    whenToUse: 'Use it for conditions: 시간이 있으면 전화해 주세요, 비싸면 안 사요, 아프면 쉬어야 해요. It helps you say what should happen depending on time, price, health, or permission.',
    learnerPath: 'This is a bridge into longer Korean. Keep the first half short while you are a beginner.',
    linkedWordIds: ['word-verb-026', 'word-verb-027', 'word-verb-006'],
    relatedPatternIds: ['pattern-018', 'pattern-011']
  }
};

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

function romanizeKorean(text = '') {
  const chars = String(text).split('');
  let carry = '';
  return chars.map((char, index) => {
    const code = char.charCodeAt(0);
    if (code < 0xac00 || code > 0xd7a3) {
      if (JAMO_ROMAN[char]) return JAMO_ROMAN[char];
      return char;
    }
    const offset = code - 0xac00;
    const initial = Math.floor(offset / 588);
    const vowel = Math.floor((offset % 588) / 28);
    const final = offset % 28;
    // Next syllable, skipping spaces so sound changes apply across word boundaries (몇 명 → myeon myeong).
    // Liaison only links when the next syllable is directly adjacent (no space).
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
    // 구개음화 (palatalization): ㄷ/ㅌ + 이 → 지/치 (같이 gachi, 맏이 maji)
    if (liaison && nextVowel === 20) {
      if (final === 7) carry = 'j';
      else if (final === 25) carry = 'ch';
    }
    // 받침 nasalization before ㄴ(2)/ㅁ(6): ㄱ-stop → ng, ㄷ-stop → n, ㅂ-stop → m
    if (!liaison && final && (nextInitial === 2 || nextInitial === 6)) {
      if ([1, 2, 9, 24].includes(final)) coda = 'ng';
      else if ([7, 13, 19, 20, 22, 23, 25, 27].includes(final)) coda = 'n';
      else if ([14, 17, 26].includes(final)) coda = 'm';
    }
    // ㄹ-assimilation before ㄹ(5): ㄴ/ㄹ coda → ll; nasal/stop coda → coda nasalizes and ㄹ → n
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
      if ([6, 15, 27].includes(final) && [0, 3, 7, 12].includes(nextInitial)) {
        carry = { 0: 'k', 3: 't', 7: 'p', 12: 'ch' }[nextInitial];
        coda = final === 6 ? 'n' : final === 15 ? 'l' : '';
      } else if (nextInitial === 18) {
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

function phrase(ko, en, note = '', romanization = '') {
  return { ko, romanization: romanization || romanizeKorean(ko), en, note };
}

function topicTask(topic) {
  return {
    food: 'ordering food, explaining food restrictions, and asking what to eat together',
    transportation: 'using buses, subways, taxis, and asking where to get on or off',
    shopping: 'buying things, checking prices, quantities, and payment options',
    school: 'classroom communication, study plans, and asking for repetition or help',
    work: 'talking about work, schedules, tasks, and obligations',
    home: 'daily routines at home, sleep, doors, windows, and simple requests',
    health: 'saying what hurts, asking for rest, and explaining basic health needs',
    travel: 'getting around, reservations, directions, photos, and emergency help'
  }[topic] || 'basic everyday communication';
}

function activityName(base) {
  return {
    eat: 'eating',
    drink: 'drinking',
    go: 'going places',
    come: 'coming',
    'see / watch': 'seeing or watching things',
    buy: 'buying things',
    do: 'doing tasks',
    sleep: 'sleeping',
    'wake up / get up': 'waking up and getting up',
    sit: 'sitting',
    read: 'reading',
    'write / use': 'writing or using something',
    listen: 'listening',
    'speak / say': 'speaking or saying something',
    study: 'studying',
    work: 'working',
    meet: 'meeting people',
    wait: 'waiting',
    'ride / take': 'taking transportation',
    'get off': 'getting off transportation',
    'find / look for': 'finding or looking for something',
    give: 'giving something',
    receive: 'receiving something',
    open: 'opening something',
    close: 'closing something',
    rest: 'resting',
    'call by phone': 'making phone calls',
    order: 'ordering',
    'reserve / book': 'making reservations',
    'take a photo': 'taking photos'
  }[base] || base;
}

function makeDialogue(lines) {
  return lines.map(([speaker, ko, en]) => ({ speaker, ko, romanization: romanizeKorean(ko), en }));
}

function makePracticeQuestionEnglish(text = '') {
  const clean = text.replace(/[.?!]\s*$/, '').trim();
  if (!clean) return 'Practice this sentence.';
  if (/^(please|shall|can|may|is|are|do|does|did|where|how|what|when|why)\b/i.test(clean)) return `${clean}?`;
  return `Do you ${clean}?`;
}

function verbTeachingFocus(base, formMap, contextPhrase) {
  const naturalFrame = contextPhrase?.ko || formMap.politePresent;
  return [
    {
      title: '1. Memorize the safe sentence first',
      body: `${formMap.politePresent} is the everyday polite form. A beginner can use it with staff, teachers, adult classmates, and strangers. Do not start from ${formMap.dictionary} when speaking.`
    },
    {
      title: '2. Add one real-life noun or place',
      body: `Practice the verb inside a useful frame like ${naturalFrame}. Korean words become usable only when you know what particle or place phrase usually sits beside them.`
    },
    {
      title: '3. Separate choice from inability',
      body: `${formMap.negative} means you do not do it or are not doing it. ${formMap.cannot} means you cannot do it because of time, ability, rules, health, or circumstances.`
    },
    {
      title: '4. Recycle the same verb through patterns',
      body: `Once ${formMap.politePresent} feels easy, practice ${formMap.want}, ${formMap.can}, and ${formMap.must}. This is how one verb becomes many real sentences.`
    }
  ];
}

function expressionTeachingFocus(entry) {
  return [
    {
      title: '1. Learn it as one chunk',
      body: `${entry.hangul} is already a complete expression. Say the whole phrase smoothly before analyzing the grammar.`
    },
    {
      title: '2. Know the social situation',
      body: `Use it in the situation shown in the examples. Korean expressions often depend on who you are talking to, not only on the English translation.`
    },
    {
      title: '3. Add one follow-up',
      body: `A real conversation usually needs one more sentence after ${entry.hangul}. Practice the mini dialogue so it does not stay as a single memorized line.`
    }
  ];
}

function patternTeachingFocus(entry, guide) {
  const firstStep = guide?.howToBuild?.[0] || 'Find the noun or verb stem that the pattern attaches to.';
  const firstUse = entry.usagePhrases?.[0]?.ko || entry.hangul;
  return [
    {
      title: '1. Replace the study symbol',
      body: `${firstStep} The letters V and N are textbook symbols. They are never spoken aloud. Replace them with a real verb or noun.`
    },
    {
      title: '2. Memorize two complete examples',
      body: `Start with complete phrases such as ${firstUse}. After two examples feel natural, substitute only one word at a time.`
    },
    {
      title: '3. Check the situation before speaking',
      body: guide?.whenToUse || entry.patternInfo?.formNote || 'Use the pattern only in the situation shown by the examples.'
    },
    {
      title: '4. Connect it back to word cards',
      body: 'Open the linked words and find the same pattern inside their form panels. This makes grammar feel reusable instead of abstract.'
    }
  ];
}

function makeVerbLesson(entry, topic, base) {
  const u = entry.usagePhrases;
  const e = entry.examples;
  const contextPhrase = u[5] || u[0];
  const contextKo = contextPhrase.ko.endsWith('?') ? contextPhrase.ko : `${contextPhrase.ko}?`;
  return {
    canDo: `Use ${entry.forms.politePresent} in a real beginner sentence, then change it into want, can, cannot, and have-to forms without losing the basic meaning.`,
    studyFlow: [
      `Say ${entry.forms.politePresent} first. This is the safest spoken form for most beginner situations.`,
      `Add one useful frame: ${contextPhrase.ko}. Read the Hangul first, then check the romanization.`,
      `Practice the contrast between ${entry.forms.negative} and ${entry.forms.cannot}.`,
      'Open one linked pattern and come back to this card to see the same grammar in a verb form.'
    ],
    teacherNote: `Do not ask a beginner to memorize all 15 forms at once. Teach ${entry.forms.politePresent} first, then add one communicative need: desire (${entry.forms.want}), possibility (${entry.forms.can}), or limitation (${entry.forms.cannot}).`,
    pronunciationTip: `${entry.hangul} is written ${entry.romanization}. In real sentences, compare the audio with the romanization because Korean sound changes can cross syllable blocks.`,
    beginnerPath: verbTeachingFocus(base, entry.forms, contextPhrase),
    classroomScript: [
      `Teacher says: ${entry.forms.politePresent}. Learner repeats three times.`,
      `Teacher asks a yes/no question with ${contextPhrase.ko.replace(/[.?!]\s*$/, '')}. Learner answers with 네 or 아니요.`,
      `Learner changes the sentence to ${entry.forms.negative}, then ${entry.forms.cannot}.`,
      `Learner says one personal sentence using today, tomorrow, here, or together.`
    ],
    miniDialogue: makeDialogue([
      ['A', contextKo, makePracticeQuestionEnglish(contextPhrase.en)],
      ['B', `${e[0].ko}`, e[0].en],
      ['A', `${entry.forms.shallWe}`, `Shall we ${base}?`]
    ]),
    drills: [
      phrase(entry.forms.negative, `I do not ${base}.`, 'Change the polite present into a simple negative.'),
      phrase(entry.forms.want, `I want to ${base}.`, 'Change the verb into a desire sentence.'),
      phrase(entry.forms.cannot, `I cannot ${base}.`, 'Use this for inability or a real limitation.')
    ],
    selfCheck: [
      `Can you say “I ${base}” politely?`,
      `Can you say “I want to ${base}”?`,
      `Can you explain the difference between ${entry.forms.negative} and ${entry.forms.cannot}?`
    ]
  };
}

function makeExpressionLesson(entry, topic) {
  const u = entry.usagePhrases;
  const e = entry.examples;
  return {
    canDo: `Use ${entry.hangul} naturally in ${topicTask(topic)}.`,
    studyFlow: [
      `Say ${entry.hangul} as one complete chunk.`,
      'Read the first example aloud three times. Then hide the English and say the Korean again.',
      'Choose one follow-up sentence from the usage phrases so it becomes a short exchange.',
      'Check whether the expression is safe with strangers, staff, teachers, or only friendly situations.'
    ],
    teacherNote: `Expressions are not built word by word at first. Learn ${entry.hangul} as a ready-to-say sentence, then notice the grammar later through related pattern links.`,
    pronunciationTip: `Say it as one smooth phrase: ${entry.romanization}. Do not pause between every Korean syllable block.`,
    beginnerPath: expressionTeachingFocus(entry),
    classroomScript: [
      `Teacher gives a situation. Learner chooses whether ${entry.hangul} fits.`,
      `Learner says ${entry.hangul}, then adds one follow-up phrase.`,
      'Teacher changes the role: staff, friend, teacher, stranger. Learner decides whether the expression is still natural.'
    ],
    miniDialogue: makeDialogue([
      ['A', u[0].ko, u[0].en],
      ['B', u[1]?.ko || e[0].ko, u[1]?.en || e[0].en],
      ['A', e[0].ko, e[0].en]
    ]),
    drills: (u || []).slice(0, 3).map(item => phrase(item.ko, item.en, item.note)),
    selfCheck: [
      `Can you say ${entry.hangul} without reading the English?`,
      'Can you choose when this expression is polite enough?',
      'Can you use it with one follow-up sentence?'
    ]
  };
}

function makePatternLesson(entry, guide) {
  const u = entry.usagePhrases;
  const e = entry.examples;
  return {
    canDo: `Use ${entry.hangul} to express “${entry.english}” in a short real-life sentence.`,
    studyFlow: [
      'Read the pattern explanation before memorizing the shape.',
      'Study the build steps and identify whether the pattern attaches to a noun, verb, or adjective.',
      'Practice the usage phrases as substitutions, changing only one part at a time.',
      'Open one linked word and see the same pattern inside a verb card.'
    ],
    teacherNote: guide?.learnerPath || 'Learn the pattern through examples first, then substitute one word at a time.',
    pronunciationTip: `Pattern labels are study tools. In speech, practice the full example phrase such as ${u[0]?.ko || entry.hangul}.`,
    beginnerPath: patternTeachingFocus(entry, guide),
    classroomScript: [
      'Learner underlines the stem or noun that changes.',
      'Learner reads two complete examples without saying the study symbols V or N.',
      'Teacher gives one new word. Learner substitutes it into the same pattern.',
      'Learner explains when the pattern is natural in plain English.'
    ],
    miniDialogue: makeDialogue([
      ['A', u[0]?.ko || e[0].ko, u[0]?.en || e[0].en],
      ['B', u[1]?.ko || e[1].ko, u[1]?.en || e[1].en],
      ['A', e[0].ko, e[0].en]
    ]),
    drills: (u || []).slice(0, 4).map(item => phrase(item.ko, item.en, item.note)),
    selfCheck: [
      'Can you say the pattern with one verb or noun from the linked cards?',
      'Can you explain when this pattern is natural?',
      'Can you avoid the “Watch out” mistake?'
    ]
  };
}

function makeWordLesson(entry) {
  const firstUsage = entry.usagePhrases?.[0] || phrase(entry.hangul, entry.english);
  const secondUsage = entry.usagePhrases?.[1] || firstUsage;
  return {
    canDo: `Use ${entry.hangul} inside a real beginner sentence, not only as an isolated translation.`,
    studyFlow: [
      `Say the word first: ${entry.hangul}. Check the romanization only after trying the Hangul.`,
      `Memorize one useful chunk: ${firstUsage.ko}.`,
      'Notice which particle, place marker, or ending appears around the word.',
      'Make one personal sentence by changing only one noun, place, time, or adjective.'
    ],
    teacherNote: `${entry.hangul} should be taught as a sentence ingredient. The student needs the common frame more than a dictionary definition.`,
    pronunciationTip: `${entry.hangul} is written ${entry.romanization}. Use audio and Hangul together because romanization is only a helper.`,
    beginnerPath: [
      {
        title: '1. Learn the word with a frame',
        body: `Do not stop at "${entry.english}". Start with ${firstUsage.ko}, because that shows how the word behaves in Korean.`
      },
      {
        title: '2. Notice the grammar beside it',
        body: `Look for particles and endings around the word. Those small pieces tell you whether it is a topic, subject, object, place, time, method, or description.`
      },
      {
        title: '3. Use it in one real situation',
        body: entry.contextHint || `Use this word in ${topicTask(entry.topic?.[0])}.`
      }
    ],
    classroomScript: [
      `Teacher says ${entry.hangul}. Learner repeats from Hangul, not English spelling.`,
      `Learner reads ${firstUsage.ko}, then explains the English meaning.`,
      `Teacher gives a new situation. Learner chooses ${firstUsage.ko} or ${secondUsage.ko}.`,
      'Learner makes one personal sentence using the same frame.'
    ],
    miniDialogue: makeDialogue([
      ['A', firstUsage.ko.endsWith('?') ? firstUsage.ko : `${firstUsage.ko}.`, firstUsage.en],
      ['B', secondUsage.ko.endsWith('.') || secondUsage.ko.endsWith('?') ? secondUsage.ko : `${secondUsage.ko}.`, secondUsage.en],
      ['A', entry.examples?.[0]?.ko || firstUsage.ko, entry.examples?.[0]?.en || firstUsage.en]
    ]),
    drills: (entry.usagePhrases || []).slice(0, 4),
    selfCheck: [
      `Can you read ${entry.hangul} without starting from romanization?`,
      `Can you say one full sentence with ${entry.hangul}?`,
      'Can you point to the particle or ending used in the example?'
    ]
  };
}

// Present noun-describing (관형형) forms for adjectives, including ㅂ-irregular and 있다 → 는.
const ADJ_MODIFIER = {
  '좋다': '좋은', '싫다': '싫은', '크다': '큰', '작다': '작은', '많다': '많은',
  '비싸다': '비싼', '싸다': '싼', '맛있다': '맛있는', '맵다': '매운',
  '쉽다': '쉬운', '어렵다': '어려운', '바쁘다': '바쁜'
};

function irregularTip(irregular, hangul, polite) {
  switch (irregular) {
    case 'ㅂ irregular':
      return { title: 'Irregular stem: ㅂ → 우', body: `${hangul} is a ㅂ-irregular word. Before a vowel ending the final ㅂ turns into 우, so the polite form is ${polite} — not a literal ㅂ + 어요. The same change gives the noun-describing form (맵다 → 매운, 쉽다 → 쉬운). Anchor on ${polite} and build the rest from it.` };
    case 'ㄷ irregular':
      return { title: 'Irregular stem: ㄷ → ㄹ', body: `${hangul} is a ㄷ-irregular verb. The final ㄷ becomes ㄹ before a vowel ending, so it conjugates to ${polite}, never the literal ㄷ + 어요. The ㄷ stays ㄷ before a consonant ending (듣고, 듣습니다).` };
    case 'ㅡ contraction':
      return { title: 'Irregular stem: ㅡ drop', body: `${hangul} loses its ㅡ vowel before 아/어, giving ${polite} (the same drop turns 바쁘다 into 바빠요). The ㅡ never takes its own 어요, so don't add 어요 to the bare ㅡ.` };
    case 'ㄹ irregular':
      return { title: 'Irregular stem: ㄹ', body: `${hangul} is a ㄹ-stem word. The ㄹ drops before ㄴ/ㅂ/ㅅ endings: 살다 → 삽니다 (formal), 사는 (describing a noun), 사세요 (honorific). Before a vowel the ㄹ stays: ${polite}.` };
    default:
      return { title: 'Irregular stem', body: `${hangul} has an irregular stem (${irregular}). Memorize its polite form ${polite} as the anchor and build the other forms from there.` };
  }
}

function verbConjugationTips(entry, f) {
  const tips = [{
    title: 'ㄹ / 을 — can & will',
    body: `To say "can" or the future, attach ㄹ/을 to the stem: a vowel-final stem takes ㄹ and a consonant-final stem takes 을. ${entry.hangul} becomes ${f.can} ("can") and ${f.future} ("will"). That is why 가다 → 갈 수 있어요 (not 가을), while 먹다 → 먹을 수 있어요. The same ㄹ/을 choice drives 거예요 and the noun-describing form.`
  }];
  if (entry.irregular) tips.push(irregularTip(entry.irregular, entry.hangul, f.politePresent));
  return tips;
}

function adjectiveConjugationTips(entry) {
  const tips = [];
  if (entry.modifier) {
    tips.push({
      title: 'Describing a noun: ㄴ/은 vs ㄹ/을',
      body: `To put ${entry.hangul} in front of a noun, use the ㄴ/은 form for how something is right now: ${entry.modifier} 것 ("a ${entry.english.replace(/^to (be )?/, '')} thing"). The ㄹ/을 form points to something that will or might become that way later. So 뜨거운 물 is water that is hot now, but 뜨거울 물 is water that will be hot — same adjective, different time feeling. For everyday description, reach for the ㄴ/은 form.`
    });
  }
  if (entry.irregular) tips.push(irregularTip(entry.irregular, entry.hangul, entry.speechLevels?.polite || entry.modifier || entry.hangul));
  return tips;
}

// Rotate explanation structure so cards do not all read identically.
function verbExplanation(index, hangul, romanization, english, f, usage, topic) {
  const u = usage[0];
  const variants = [
    `${hangul} (${romanization}) means "${english}". Start from the polite form ${f.politePresent} — it is safe with almost anyone, so use it before the dictionary form ${f.dictionary}. A strong first sentence is ${u[0]} ("${u[1]}"); once that feels natural, swap the noun, place, or time and reuse the verb everywhere. Korean changes the ending rather than the word, so the same ${hangul} also becomes ${f.want} (want), ${f.can} (can), and ${f.cannot} (cannot). Say one true sentence about ${topicTask(topic)}, then bend it.`,
    `"${english}" in Korean is ${hangul} (${romanization}). In real conversation you will lean on the polite form ${f.politePresent}, so make that your default and leave the bare dictionary form ${f.dictionary} for study notes. Grow outward from one concrete line — ${u[0]} ("${u[1]}") — then reshape the same stem into ${f.want} (desire), ${f.can} (ability), and ${f.cannot} (a real limit) as the moment needs. The stem stays put; only the ending moves.`,
    `${hangul} (${romanization}) = "${english}". Don't try to memorize all fifteen forms at once; anchor on ${f.politePresent} plus one useful sentence like ${u[0]} ("${u[1]}"). After that the endings carry the meaning — ${f.want} for what you want, ${f.can} for what you can, ${f.cannot} for what you can't. Keep the stem, change the ending, and one verb gives you a dozen sentences about ${topicTask(topic)}.`
  ];
  return variants[index % variants.length];
}

function wordExplanation(index, hangul, romanization, english, usage, topic) {
  const u = usage[0];
  const variants = [
    `${hangul} (${romanization}) means "${english}". Learn it inside a frame, not as a bare word: a useful first chunk is ${u[0]} ("${u[1]}"). In Korean the particle or ending next to ${hangul} signals its job — topic, subject, object, place, time, method, or description — so read the examples for the small piece beside it. Start with one real sentence about ${topicTask(topic)}, then change a single part.`,
    `"${english}" is ${hangul} (${romanization}). The word itself is easy; what matters is the company it keeps, like ${u[0]} ("${u[1]}"). Watch the particle attached to ${hangul} in each example — that little marker, not the word, tells you whether it is the topic, the subject, the object, or a place. Copy one full sentence about ${topicTask(topic)} first, then vary one word.`,
    `${hangul} (${romanization}) = "${english}". Treat it as a building block that needs a frame: ${u[0]} ("${u[1]}") shows how it actually behaves. The grammar lives in the particle or ending beside ${hangul}, so notice that piece as you read, not just the dictionary meaning. Begin from a complete sentence about ${topicTask(topic)} and swap just one element to make it yours.`
  ];
  return variants[index % variants.length];
}

function verbEntry(seed, index) {
  const [hangul, romanization, english, topic, forms, usage, examples, nuance, extraMistakes = [], irregular = null] = seed;
  const formMap = Object.fromEntries(formKeys.map((key, i) => [key, forms[i]]));
  const formLinks = Object.fromEntries(Object.entries(formPatternLinks).filter(([key]) => formMap[key]));
  const base = english.replace(/^to /, '');
  const entry = {
    id: `word-verb-${String(index + 1).padStart(3, '0')}`,
    sort: index + 1,
    type: 'word',
    level: 'A1',
    topic: [topic, 'daily-life'].filter((v, i, arr) => arr.indexOf(v) === i),
    hangul,
    romanization,
    english,
    partOfSpeech: 'verb',
    irregular,
    shortExplanation: `${hangul} means "${english}" and is practiced through polite conversation forms.`,
    explanation: verbExplanation(index, hangul, romanization, english, formMap, usage, topic),
    learnerPriority: `First master ${formMap.politePresent}. Then practice ${formMap.negative} vs ${formMap.cannot}, because that contrast appears constantly in beginner conversations.`,
    contextHint: `Use this verb when talking about ${topicTask(topic)}. Start with one complete sentence and then substitute the noun, place, or time phrase.`,
    speechLevels: {
      casual: formMap.casualPresent,
      polite: formMap.politePresent,
      formal: formMap.formalPresent
    },
    forms: formMap,
    formLinks,
    relatedPatternIds: [...new Set(Object.values(formLinks))],
    formGroupInfo,
    usagePhrases: [
      phrase(formMap.politePresent, `I ${base}.`, 'Safe polite present form.'),
      phrase(formMap.negative, `I do not ${base}.`, 'Short everyday negative.'),
      phrase(formMap.want, `I want to ${base}.`, 'Useful for choices and plans.'),
      phrase(formMap.can, `I can ${base}.`, 'Ability or possibility.'),
      phrase(formMap.must, `I have to ${base}.`, 'Requirement or obligation.'),
      ...usage.map(([ko, en, note]) => phrase(ko, en, note))
    ].slice(0, 6),
    examples: examples.map(([ko, en, note]) => phrase(ko, en, note)),
    nuance,
    commonMistakes: [
      `Do not use the dictionary form ${hangul} as a complete polite sentence.`,
      `Use ${formMap.politePresent} as the default until you know the relationship is casual.`,
      ...extraMistakes
    ],
    notes: irregular ? [`${irregular}: memorize ${formMap.casualPresent} and ${formMap.politePresent} together.`] : []
  };
  entry.lesson = makeVerbLesson(entry, topic, base);
  entry.conjugationTips = verbConjugationTips(entry, formMap);
  return entry;
}

function generalWordEntry(seed, index) {
  const [kind, hangul, english, topic, chapterIds, grammarIds, usage, examples, nuance, mistakes = [], forms = null] = seed;
  const partOfSpeech = {
    noun: 'noun',
    adjective: 'adjective',
    adverb: 'adverb',
    question: 'question-word'
  }[kind] || kind;
  const entry = {
    id: `word-${kind}-${String(index + 1).padStart(3, '0')}`,
    sort: 100 + index + 1,
    type: 'word',
    level: index < 34 ? 'A1' : 'A2',
    topic: [topic, 'daily-life'].filter((v, i, arr) => arr.indexOf(v) === i),
    hangul,
    romanization: romanizeKorean(hangul),
    english,
    partOfSpeech,
    irregular: forms?.irregular || null,
    shortExplanation: `${hangul} means "${english}" and is learned through practical beginner sentence frames.`,
    explanation: wordExplanation(index, hangul, romanizeKorean(hangul), english, usage, topic),
    learnerPriority: `First memorize ${usage[0][0]}. Then read the examples and notice the particle or ending attached near ${hangul}.`,
    contextHint: `Use this word when talking about ${topicTask(topic)}. The examples show whether it naturally works with 은/는, 이/가, 을/를, 에, 에서, 로/으로, or a descriptive ending.`,
    speechLevels: forms?.speechLevels || null,
    adjectiveForms: forms?.adjectiveForms || null,
    usagePhrases: usage.map(([ko, en, note]) => phrase(ko, en, note)),
    examples: examples.map(([ko, en, note]) => phrase(ko, en, note)),
    nuance,
    commonMistakes: [
      'Do not memorize this only as an English translation; memorize one Korean sentence frame.',
      ...mistakes
    ],
    notes: forms?.note ? [forms.note] : [],
    chapterIds,
    grammarIds,
    activityTags: []
  };
  entry.modifier = ADJ_MODIFIER[hangul] || null;
  entry.lesson = makeWordLesson(entry);
  entry.conjugationTips = partOfSpeech === 'adjective'
    ? adjectiveConjugationTips(entry)
    : (entry.irregular ? [irregularTip(entry.irregular, hangul, entry.speechLevels?.polite || hangul)] : []);
  return entry;
}

const verbSeeds = [
  ['먹다','meokda','to eat','food',['먹다','먹어','먹어요','먹습니다','안 먹어요','먹었어요','먹을 거예요','먹고 싶어요','먹을 수 있어요','못 먹어요','먹어야 해요','안 먹어도 돼요','먹어 주세요','먹지 마세요','먹을까요?'],[['점심을 먹어요','eat lunch.','Use an object with 을/를.'],['같이 먹을까요?','Shall we eat together?','Natural invitation.']], [['아침을 먹어요.','I eat breakfast.','Simple daily routine.'],['저녁을 같이 먹을까요?','Shall we eat dinner together?','Invitation.'],['매운 음식은 못 먹어요.','I cannot eat spicy food.','Useful food restriction.']], '먹다 is used for meals and food. For medicine, Korean often uses 약을 먹어요, literally “eat medicine,” which means “take medicine.”'],
  ['마시다','masida','to drink','food',['마시다','마셔','마셔요','마십니다','안 마셔요','마셨어요','마실 거예요','마시고 싶어요','마실 수 있어요','못 마셔요','마셔야 해요','안 마셔도 돼요','마셔 주세요','마시지 마세요','마실까요?'],[['물을 마셔요','drink water.','Common object phrase.'],['커피 마실까요?','Shall we drink coffee?','Natural suggestion.']], [['물을 좀 마셔요.','I drink some water.','Use 좀 to soften.'],['커피를 마시고 싶어요.','I want to drink coffee.','Desire form.'],['술은 못 마셔요.','I cannot drink alcohol.','Restriction.']], '마시다 is for liquids. In casual speech, Koreans often drop particles: 커피 마셔요 is natural.'],
  ['가다','gada','to go','travel',['가다','가','가요','갑니다','안 가요','갔어요','갈 거예요','가고 싶어요','갈 수 있어요','못 가요','가야 해요','안 가도 돼요','가 주세요','가지 마세요','갈까요?'],[['학교에 가요','go to school.','Destination takes 에.'],['지금 가요','go now.','Very common response.']], [['집에 가요.','I go home.','Destination pattern.'],['내일 병원에 가야 해요.','I have to go to the hospital tomorrow.','Obligation.'],['같이 갈까요?','Shall we go together?','Suggestion.']], 'Use 에 for destination: 학교에 가요, 집에 가요. Do not use 에서 for destination.'],
  ['오다','oda','to come','daily-life',['오다','와','와요','옵니다','안 와요','왔어요','올 거예요','오고 싶어요','올 수 있어요','못 와요','와야 해요','안 와도 돼요','와 주세요','오지 마세요','올까요?'],[['집에 와요','come home.','Destination can still use 에.'],['빨리 와 주세요','Please come quickly.','Useful request.']], [['친구가 와요.','My friend is coming.','Subject marker.'],['오늘 못 와요.','I cannot come today.','Useful cancellation.'],['여기로 와 주세요.','Please come here.','Request with 여기로.']], '오다 is from the speaker’s point of view. If someone moves toward you or your place, 오다 is usually right.'],
  ['보다','boda','to see / watch','daily-life',['보다','봐','봐요','봅니다','안 봐요','봤어요','볼 거예요','보고 싶어요','볼 수 있어요','못 봐요','봐야 해요','안 봐도 돼요','봐 주세요','보지 마세요','볼까요?'],[['영화를 봐요','watch a movie.','Common object.'],['잠깐 봐 주세요','Please look for a moment.','Polite request.']], [['영화를 봐요.','I watch a movie.','Common use.'],['사진을 봐 주세요.','Please look at the photo.','Request.'],['내일 다시 볼까요?','Shall we look again tomorrow?','Suggestion.']], '보다 covers seeing, watching, and looking at something. Context tells which English verb fits.'],
  ['사다','sada','to buy','shopping',['사다','사','사요','삽니다','안 사요','샀어요','살 거예요','사고 싶어요','살 수 있어요','못 사요','사야 해요','안 사도 돼요','사 주세요','사지 마세요','살까요?'],[['이거 사요','buy this.','Shopping phrase.'],['선물 살까요?','Shall we buy a gift?','Suggestion.']], [['이거 사고 싶어요.','I want to buy this.','Shopping.'],['카드로 살 수 있어요?','Can I buy it by card?','Payment.'],['오늘은 안 사요.','I am not buying it today.','Negative.']], 'Use 사다 for buying goods. For paying a bill, 계산하다 or 결제하다 may be better.'],
  ['하다','hada','to do','work',['하다','해','해요','합니다','안 해요','했어요','할 거예요','하고 싶어요','할 수 있어요','못 해요','해야 해요','안 해도 돼요','해 주세요','하지 마세요','할까요?'],[['숙제를 해요','do homework.','Noun + 하다 pattern.'],['제가 할게요','I will do it.','Promise form.']], [['지금 해요.','I do it now.','Simple sentence.'],['제가 할 수 있어요.','I can do it.','Ability.'],['안 해도 돼요.','You do not have to do it.','Very useful permission.']], '하다 combines with many nouns: 공부하다, 일하다, 운동하다. It is one of the most important Korean verbs.'],
  ['자다','jada','to sleep','home',['자다','자','자요','잡니다','안 자요','잤어요','잘 거예요','자고 싶어요','잘 수 있어요','못 자요','자야 해요','안 자도 돼요','자 주세요','자지 마세요','잘까요?'],[['잘 자요','sleep well / good night.','Set phrase.'],['좀 자고 싶어요','I want to sleep a little.','Natural with 좀.']], [['오늘 일찍 자요.','I sleep early today.','Daily routine.'],['어제 잘 못 잤어요.','I could not sleep well yesterday.','Common complaint.'],['이제 잘까요?','Shall we sleep now?','Suggestion.']], '자다 becomes 잘 before some future or ability forms: 잘 거예요, 잘 수 있어요.', ['자 주세요 is grammatically possible, but 잘 자요 is the natural phrase for “good night.” Use request forms only with a real context.']],
  ['일어나다','ireonada','to wake up / get up','home',['일어나다','일어나','일어나요','일어납니다','안 일어나요','일어났어요','일어날 거예요','일어나고 싶어요','일어날 수 있어요','못 일어나요','일어나야 해요','안 일어나도 돼요','일어나 주세요','일어나지 마세요','일어날까요?'],[['아침에 일어나요','wake up in the morning.','Time marker 에.'],['일찍 일어나야 해요','have to wake up early.','Obligation.']], [['저는 7시에 일어나요.','I wake up at seven.','Time expression.'],['내일 일찍 일어나야 해요.','I have to wake up early tomorrow.','Obligation.'],['아직 일어나지 마세요.','Please do not get up yet.','Polite prohibition.']], '일어나다 can mean wake up or stand/get up, depending on context.'],
  ['앉다','anjda','to sit','daily-life',['앉다','앉아','앉아요','앉습니다','안 앉아요','앉았어요','앉을 거예요','앉고 싶어요','앉을 수 있어요','못 앉아요','앉아야 해요','안 앉아도 돼요','앉아 주세요','앉지 마세요','앉을까요?'],[['여기 앉아요','sit here.','Common location phrase.'],['앉아 주세요','Please sit.','Polite request.']], [['여기 앉아도 돼요?','May I sit here?','Permission.'],['잠깐 앉아 주세요.','Please sit for a moment.','Request.'],['저는 바닥에 못 앉아요.','I cannot sit on the floor.','Ability.']], '앉아 주세요 is a polite request; 앉으세요 is also common and a little more direct.'],
  ['읽다','ikda','to read','school',['읽다','읽어','읽어요','읽습니다','안 읽어요','읽었어요','읽을 거예요','읽고 싶어요','읽을 수 있어요','못 읽어요','읽어야 해요','안 읽어도 돼요','읽어 주세요','읽지 마세요','읽을까요?'],[['책을 읽어요','read a book.','Object marker 을.'],['다시 읽어 주세요','Please read it again.','Classroom request.']], [['책을 읽어요.','I read a book.','Common object.'],['이 문장을 읽어 주세요.','Please read this sentence.','Classroom.'],['한글을 읽을 수 있어요.','I can read Hangul.','Ability.']], '읽다 has pronunciation changes, but beginners can first memorize 읽어요 as the practical polite form.'],
  ['쓰다','sseuda','to write / use','school',['쓰다','써','써요','씁니다','안 써요','썼어요','쓸 거예요','쓰고 싶어요','쓸 수 있어요','못 써요','써야 해요','안 써도 돼요','써 주세요','쓰지 마세요','쓸까요?'],[['이름을 써요','write a name.','Writing meaning.'],['카드를 써요','use a card.','Use meaning.']], [['이름을 써 주세요.','Please write your name.','Form or document.'],['카드 써도 돼요?','Can I use a card?','Payment.'],['펜을 못 써요.','I cannot use the pen.','Ability.']], '쓰다 can mean write or use. The object tells the meaning: 이름을 쓰다, 카드를 쓰다.'],
  ['듣다','deutda','to listen','school',['듣다','들어','들어요','듣습니다','안 들어요','들었어요','들을 거예요','듣고 싶어요','들을 수 있어요','못 들어요','들어야 해요','안 들어도 돼요','들어 주세요','듣지 마세요','들을까요?'],[['음악을 들어요','listen to music.','Common object.'],['잘 들어 주세요','Please listen carefully.','Classroom request.']], [['음악을 들어요.','I listen to music.','Common use.'],['다시 들어도 돼요?','May I listen again?','Permission.'],['소리가 잘 안 들려요.','I cannot hear the sound well.','Related expression.']], '듣다 is ㄷ irregular: 듣다 becomes 들어요 in polite speech.', ['듣다 changes to 들어요, not 듣어요.'], 'ㄷ irregular'],
  ['말하다','malhada','to speak / say','daily-life',['말하다','말해','말해요','말합니다','말 안 해요','말했어요','말할 거예요','말하고 싶어요','말할 수 있어요','말 못 해요','말해야 해요','말 안 해도 돼요','말해 주세요','말하지 마세요','말할까요?'],[['천천히 말해요','speak slowly.','Useful request frame.'],['다시 말해 주세요','Please say it again.','Survival phrase.']], [['한국어로 말해요.','I speak in Korean.','Language marker 로.'],['천천히 말해 주세요.','Please speak slowly.','Request.'],['지금 말해도 돼요?','May I speak now?','Permission.']], 'Use 로 for language: 한국어로 말해요, 영어로 말해요. 말하다 can mean both “speak” and “say,” so the object or quote decides the English translation.'],
  ['공부하다','gongbuhada','to study','school',['공부하다','공부해','공부해요','공부합니다','공부 안 해요','공부했어요','공부할 거예요','공부하고 싶어요','공부할 수 있어요','공부 못 해요','공부해야 해요','공부 안 해도 돼요','공부해 주세요','공부하지 마세요','공부할까요?'],[['한국어를 공부해요','study Korean.','Language object.'],['같이 공부할까요?','Shall we study together?','Suggestion.']], [['한국어를 공부해요.','I study Korean.','Core sentence.'],['내일 시험이라서 공부해야 해요.','I have a test tomorrow, so I have to study.','Reason.'],['오늘은 공부 안 해도 돼요.','I do not have to study today.','Permission.']], '공부하다 is noun + 하다, so the short negative is often 공부 안 해요.'],
  ['일하다','ilhada','to work','work',['일하다','일해','일해요','일합니다','일 안 해요','일했어요','일할 거예요','일하고 싶어요','일할 수 있어요','일 못 해요','일해야 해요','일 안 해도 돼요','일해 주세요','일하지 마세요','일할까요?'],[['회사에서 일해요','work at a company.','Action location uses 에서.'],['오늘 일해요','work today.','Time phrase.']], [['회사에서 일해요.','I work at a company.','Location of action.'],['오늘 늦게까지 일해야 해요.','I have to work late today.','Obligation.'],['주말에는 일 안 해요.','I do not work on weekends.','Routine.']], 'Use 에서 for where an action happens: 회사에서 일해요.'],
  ['만나다','mannada','to meet','daily-life',['만나다','만나','만나요','만납니다','안 만나요','만났어요','만날 거예요','만나고 싶어요','만날 수 있어요','못 만나요','만나야 해요','안 만나도 돼요','만나 주세요','만나지 마세요','만날까요?'],[['친구를 만나요','meet a friend.','Object marker 를.'],['내일 만날까요?','Shall we meet tomorrow?','Scheduling.']], [['친구를 만나요.','I meet a friend.','Common object.'],['내일 3시에 만날까요?','Shall we meet tomorrow at three?','Scheduling.'],['오늘은 못 만나요.','I cannot meet today.','Cancellation.']], '만나다 takes a person as the object: 친구를 만나요, 선생님을 만나요.'],
  ['기다리다','gidarida','to wait','transportation',['기다리다','기다려','기다려요','기다립니다','안 기다려요','기다렸어요','기다릴 거예요','기다리고 싶어요','기다릴 수 있어요','못 기다려요','기다려야 해요','안 기다려도 돼요','기다려 주세요','기다리지 마세요','기다릴까요?'],[['잠깐 기다려 주세요','Please wait a moment.','Very useful request.'],['여기서 기다려요','wait here.','Place phrase.']], [['잠깐 기다려 주세요.','Please wait a moment.','Polite request.'],['버스를 기다려요.','I wait for the bus.','Transportation.'],['오래 기다렸어요.','I waited a long time.','Past.']], '기다려 주세요 is one of the most useful service and classroom requests.'],
  ['타다','tada','to ride / take','transportation',['타다','타','타요','탑니다','안 타요','탔어요','탈 거예요','타고 싶어요','탈 수 있어요','못 타요','타야 해요','안 타도 돼요','타 주세요','타지 마세요','탈까요?'],[['버스를 타요','take the bus.','Transportation object.'],['지하철을 타요','take the subway.','Common commute phrase.']], [['버스를 타요.','I take the bus.','Transportation.'],['공항까지 택시를 탈 거예요.','I will take a taxi to the airport.','Travel.'],['여기서 타야 해요?','Do I have to get on here?','Question.']], 'Use 타다 for getting on or riding transportation: 버스를 타요, 지하철을 타요.'],
  ['내리다','naerida','to get off','transportation',['내리다','내려','내려요','내립니다','안 내려요','내렸어요','내릴 거예요','내리고 싶어요','내릴 수 있어요','못 내려요','내려야 해요','안 내려도 돼요','내려 주세요','내리지 마세요','내릴까요?'],[['여기서 내려요','get off here.','Important travel phrase.'],['다음 역에서 내려요','get off at the next station.','Station phrase.']], [['여기서 내려요?','Do I get off here?','Travel question.'],['다음 역에서 내려야 해요.','I have to get off at the next station.','Obligation.'],['아직 내리지 마세요.','Please do not get off yet.','Safety.']], '내리다 is the opposite of 타다 for transportation. Use 에서 for the place where you get off.'],
  ['찾다','chatda','to find / look for','travel',['찾다','찾아','찾아요','찾습니다','안 찾아요','찾았어요','찾을 거예요','찾고 싶어요','찾을 수 있어요','못 찾아요','찾아야 해요','안 찾아도 돼요','찾아 주세요','찾지 마세요','찾을까요?'],[['길을 찾아요','find the way.','Travel phrase.'],['찾아 주세요','Please find it for me.','Request.']], [['화장실을 찾고 있어요.','I am looking for the bathroom.','Progressive.'],['길을 못 찾겠어요.','I cannot find the way.','Travel trouble.'],['같이 찾을까요?','Shall we look together?','Suggestion.']], '찾다 can mean find or look for. 찾고 있어요 often means “I am looking for.”'],
  ['주다','juda','to give','daily-life',['주다','줘','줘요','줍니다','안 줘요','줬어요','줄 거예요','주고 싶어요','줄 수 있어요','못 줘요','줘야 해요','안 줘도 돼요','주세요','주지 마세요','줄까요?'],[['물 주세요','Please give me water.','Essential request.'],['제가 줄게요','I will give it.','Offer.']], [['물 좀 주세요.','Please give me some water.','Request.'],['영수증을 주세요.','Please give me a receipt.','Shopping.'],['제가 도와줄게요.','I will help you.','Related giving-help pattern.']], '주세요 comes from 주다 and is one of the most important polite request endings.', ['Do not say 줘 주세요 for a normal request. Use 주세요 by itself.']],
  ['받다','batda','to receive','daily-life',['받다','받아','받아요','받습니다','안 받아요','받았어요','받을 거예요','받고 싶어요','받을 수 있어요','못 받아요','받아야 해요','안 받아도 돼요','받아 주세요','받지 마세요','받을까요?'],[['문자를 받아요','receive a text.','Common object.'],['도움을 받아요','receive help.','Useful noun.']], [['문자를 받았어요.','I received a text.','Past.'],['영수증을 받을 수 있어요?','Can I get a receipt?','Shopping.'],['도움을 받고 싶어요.','I want to receive help.','Need help.']], '받다 is for receiving things, messages, help, service, or documents.', ['받아 주세요 often means “please accept/take this,” not simply “please receive” in an abstract way.']],
  ['열다','yeolda','to open','home',['열다','열어','열어요','엽니다','안 열어요','열었어요','열 거예요','열고 싶어요','열 수 있어요','못 열어요','열어야 해요','안 열어도 돼요','열어 주세요','열지 마세요','열까요?'],[['문을 열어요','open the door.','Common object.'],['창문 열어도 돼요?','May I open the window?','Permission.']], [['문을 열어 주세요.','Please open the door.','Request.'],['창문을 열어도 돼요?','May I open the window?','Permission.'],['아직 열지 마세요.','Please do not open it yet.','Prohibition.']], '열다 is ㄹ irregular in some formal forms: 엽니다. Memorize 열어요 first.', [], 'ㄹ irregular'],
  ['닫다','datda','to close','home',['닫다','닫아','닫아요','닫습니다','안 닫아요','닫았어요','닫을 거예요','닫고 싶어요','닫을 수 있어요','못 닫아요','닫아야 해요','안 닫아도 돼요','닫아 주세요','닫지 마세요','닫을까요?'],[['문을 닫아요','close the door.','Common object.'],['닫아 주세요','Please close it.','Request.']], [['문을 닫아 주세요.','Please close the door.','Request.'],['가게가 닫았어요.','The store closed.','Past.'],['아직 닫지 마세요.','Please do not close it yet.','Prohibition.']], '닫다 is the opposite of 열다. Use it for doors, windows, stores, apps, and lids.'],
  ['쉬다','swida','to rest','health',['쉬다','쉬어','쉬어요','쉽니다','안 쉬어요','쉬었어요','쉴 거예요','쉬고 싶어요','쉴 수 있어요','못 쉬어요','쉬어야 해요','안 쉬어도 돼요','쉬어 주세요','쉬지 마세요','쉴까요?'],[['좀 쉬어요','rest a little.','Softened with 좀.'],['쉬어야 해요','have to rest.','Health advice.']], [['오늘은 좀 쉬고 싶어요.','I want to rest a little today.','Desire.'],['아프면 쉬어야 해요.','If you are sick, you should rest.','Advice.'],['여기서 쉴 수 있어요?','Can I rest here?','Permission.']], '쉬다 is used for taking a break, resting, or being off work/school.'],
  ['전화하다','jeonhwahada','to call by phone','daily-life',['전화하다','전화해','전화해요','전화합니다','전화 안 해요','전화했어요','전화할 거예요','전화하고 싶어요','전화할 수 있어요','전화 못 해요','전화해야 해요','전화 안 해도 돼요','전화해 주세요','전화하지 마세요','전화할까요?'],[['전화해 주세요','Please call me.','Useful request.'],['나중에 전화할게요','I will call later.','Promise.']], [['나중에 전화할게요.','I will call later.','Promise.'],['지금 전화할 수 있어요?','Can you call now?','Question.'],['밤에는 전화하지 마세요.','Please do not call at night.','Boundary.']], '전화하다 is noun + 하다, so 전화 안 해요 is a natural short negative.'],
  ['주문하다','jumunhada','to order','food',['주문하다','주문해','주문해요','주문합니다','주문 안 해요','주문했어요','주문할 거예요','주문하고 싶어요','주문할 수 있어요','주문 못 해요','주문해야 해요','주문 안 해도 돼요','주문해 주세요','주문하지 마세요','주문할까요?'],[['음식을 주문해요','order food.','Restaurant phrase.'],['지금 주문할까요?','Shall we order now?','Suggestion.']], [['음식을 주문하고 싶어요.','I want to order food.','Restaurant.'],['아직 주문 안 했어요.','I have not ordered yet.','Status.'],['같이 주문할까요?','Shall we order together?','Suggestion.']], '주문하다 is used for ordering food, drinks, products, or services.'],
  ['예약하다','yeyakada','to reserve / book','travel',['예약하다','예약해','예약해요','예약합니다','예약 안 해요','예약했어요','예약할 거예요','예약하고 싶어요','예약할 수 있어요','예약 못 해요','예약해야 해요','예약 안 해도 돼요','예약해 주세요','예약하지 마세요','예약할까요?'],[['방을 예약해요','book a room.','Travel phrase.'],['예약했어요','I made a reservation.','Check-in phrase.']], [['방을 예약하고 싶어요.','I want to book a room.','Hotel.'],['이미 예약했어요.','I already made a reservation.','Check-in.'],['예약해야 해요?','Do I have to reserve?','Question.']], '예약하다 works for restaurants, hotels, tickets, classes, and appointments.'],
  ['사진 찍다','sajin jjikda','to take a photo','travel',['사진 찍다','사진 찍어','사진 찍어요','사진 찍습니다','사진 안 찍어요','사진 찍었어요','사진 찍을 거예요','사진 찍고 싶어요','사진 찍을 수 있어요','사진 못 찍어요','사진 찍어야 해요','사진 안 찍어도 돼요','사진 찍어 주세요','사진 찍지 마세요','사진 찍을까요?'],[['사진 찍어 주세요','Please take a photo.','Travel request.'],['사진 찍어도 돼요?','May I take a photo?','Permission.']], [['사진 찍어 주세요.','Please take a photo.','Travel request.'],['여기서 사진 찍어도 돼요?','May I take a photo here?','Permission.'],['박물관에서는 사진 찍지 마세요.','Please do not take photos in the museum.','Rule.']], '사진 찍다 is a phrase verb. Keep 사진 with 찍다 when you mean “take a photo.”']
];

const generalWordSeeds = [
  ['noun','학생','student','school',['chapter-02','chapter-03'],['grammar-particle-eun-neun'],[['학생이에요','I am a student.','Identity sentence.'],['저는 학생이에요','I am a student.','Topic marker.'],['학생이 있어요','There is a student.','Subject/existence.'],['학생하고 공부해요','I study with a student.','With a person.']], [['저는 학생이에요.','I am a student.','Self-introduction.'],['학생이 질문해요.','The student asks a question.','Subject.'],['학생하고 같이 공부해요.','I study together with a student.','Together.']], '학생 is a common identity word. Use 이에요 after 학생 because it ends in a consonant.', ['Use 학생이에요, not 학생예요.']],
  ['noun','선생님','teacher','school',['chapter-02','chapter-10'],['grammar-particle-ege-hante'],[['선생님이에요','is a teacher.','Identity.'],['선생님께 물어봐요','I ask the teacher.','Honorific direction.'],['선생님, 안녕하세요','Hello, teacher.','Polite address.'],['선생님한테 말해요','I speak to the teacher.','Everyday direction.']], [['우리 선생님이에요.','This is our teacher.','Introduction.'],['선생님께 물어봐요.','I ask the teacher.','Respectful.'],['선생님, 다시 말해 주세요.','Teacher, please say it again.','Classroom.']], '님 makes the word respectful. 선생님 is also used as a polite title.', ['Do not call a teacher 선생 without 님 in ordinary polite speech.']],
  ['noun','친구','friend','daily-life',['chapter-02','chapter-06'],['grammar-particle-i-ga','grammar-particle-ege-hante'],[['친구예요','is a friend.','Vowel ending takes 예요.'],['친구가 와요','A friend is coming.','Subject.'],['친구를 만나요','I meet a friend.','Object.'],['친구한테 말해요','I tell a friend.','To a person.']], [['제 친구예요.','This is my friend.','Introduction.'],['친구를 만나요.','I meet a friend.','Object.'],['친구가 집에 와요.','A friend comes home.','Subject and place.']], '친구 can mean friend or same-age peer depending on context.', ['Use 친구를 만나요 for meeting a friend; do not use 에 for the person you meet.']],
  ['noun','사람','person / people','daily-life',['chapter-04','chapter-07'],['grammar-particle-i-ga','grammar-particle-eun-neun'],[['사람이 많아요','There are many people.','Subject.'],['한국 사람이에요','I am Korean / a Korean person.','Identity.'],['이 사람은 누구예요?','Who is this person?','Topic question.'],['사람을 만나요','I meet a person.','Object.']], [['사람이 많아요.','There are many people.','Subject.'],['이 사람은 누구예요?','Who is this person?','Topic.'],['좋은 사람을 만났어요.','I met a good person.','Object.']], '사람 can mean one person or people in general. It is useful for describing crowds, identity, and who someone is.', ['Do not use 사람 for a close relationship when 친구, 선생님, or 가족 is more specific.']],
  ['noun','이름','name','daily-life',['chapter-02','chapter-03'],['grammar-particle-eun-neun'],[['이름이 뭐예요?','What is your name?','Question.'],['제 이름은 하나예요','My name is Hana.','Topic.'],['이름을 써 주세요','Please write your name.','Object.'],['이름이 있어요','There is a name.','Subject.']], [['이름이 뭐예요?','What is your name?','Basic question.'],['제 이름은 하나예요.','My name is Hana.','Self-introduction.'],['여기에 이름을 써 주세요.','Please write your name here.','Form.']], '제 이름은 is a safe polite way to introduce your name.', ['Do not translate “my” as 나의 in normal self-introduction; 제 is natural and polite.']],
  ['noun','학교','school','school',['chapter-03','chapter-06'],['grammar-particle-e','grammar-particle-eseo'],[['학교에 가요','I go to school.','Destination.'],['학교에서 공부해요','I study at school.','Action place.'],['학교예요','It is a school.','Noun sentence.'],['학교에 있어요','I am at school.','Existence place.']], [['학교에 가요.','I go to school.','Destination.'],['학교에서 한국어를 공부해요.','I study Korean at school.','Action place.'],['지금 학교에 있어요.','I am at school now.','Location.']], '학교 is one of the clearest words for practicing 에 vs 에서.', ['Say 학교에 가요 for destination, not 학교에서 가요.']],
  ['noun','집','home / house','home',['chapter-04','chapter-06'],['grammar-particle-e','grammar-particle-eseo'],[['집에 가요','I go home.','Destination.'],['집에 있어요','I am at home.','Location.'],['집에서 쉬어요','I rest at home.','Action place.'],['집이 멀어요','My home is far.','Subject.']], [['집에 가요.','I go home.','Destination.'],['오늘은 집에서 쉬어요.','I rest at home today.','Action place.'],['친구가 집에 와요.','A friend comes to my home.','Destination.']], '집 can mean home or house. 집에 often means “home” in movement/location sentences.', ['Do not add 에서 for going home; use 집에 가요.']],
  ['noun','회사','company / workplace','work',['chapter-06'],['grammar-particle-e','grammar-particle-eseo'],[['회사에 가요','I go to work / the company.','Destination.'],['회사에서 일해요','I work at a company.','Action place.'],['회사원이에요','I am an office worker.','Identity.'],['회사에 있어요','I am at work.','Location.']], [['회사에 가요.','I go to work.','Destination.'],['회사에서 일해요.','I work at a company.','Action place.'],['지금 회사에 있어요.','I am at work now.','Location.']], '회사 often means workplace in daily conversation, not only the company as an organization.', ['회사에 일해요 is unnatural for “work at a company”; use 회사에서 일해요.']],
  ['noun','시간','time','daily-life',['chapter-04','chapter-11'],['grammar-particle-i-ga','grammar-particle-buteo-kkaji'],[['시간이 있어요','I have time.','Existence/possession.'],['시간이 없어요','I do not have time.','Absence.'],['시간이 있으면','if you have time.','Condition.'],['몇 시예요?','What time is it?','Related question.']], [['시간이 있어요?','Do you have time?','Question.'],['오늘은 시간이 없어요.','I do not have time today.','Topic + subject.'],['시간이 있으면 전화해 주세요.','If you have time, please call.','Condition.']], '시간 works with 있어요/없어요 and is essential for scheduling.', ['Do not use 시간을 있어요 for “have time”; say 시간이 있어요.']],
  ['noun','오늘','today','daily-life',['chapter-05','chapter-08'],['grammar-particle-eun-neun'],[['오늘은 공부해요','Today, I study.','Topic.'],['오늘 가요','I go today.','Time word.'],['오늘은 못 가요','I cannot go today.','Limitation.'],['오늘도 일해요','I work today too.','Also.']], [['오늘은 학교에 가요.','Today, I go to school.','Topic.'],['오늘은 못 만나요.','I cannot meet today.','Schedule.'],['오늘도 공부해요.','I study today too.','Also.']], '오늘 usually does not need 에. 오늘에 sounds unnatural for ordinary “today.”', ['Do not say 오늘에 가요 for “I go today.” Say 오늘 가요 or 오늘은 가요.']],
  ['noun','내일','tomorrow','daily-life',['chapter-05','chapter-11'],['grammar-particle-eun-neun'],[['내일 봐요','See you tomorrow.','Goodbye.'],['내일 가요','I go tomorrow.','Future time.'],['내일은 쉬어요','Tomorrow, I rest.','Topic.'],['내일 전화할게요','I will call tomorrow.','Promise.']], [['내일 봐요.','See you tomorrow.','Closing.'],['내일 병원에 가요.','I go to the hospital tomorrow.','Plan.'],['내일 전화할게요.','I will call tomorrow.','Promise.']], '내일 is a time word, so it can appear naturally without 에.', ['Do not overuse 에 after today/tomorrow words.']],
  ['noun','물','water','food',['chapter-07'],['grammar-particle-eul-reul'],[['물 주세요','Water, please.','Request.'],['물을 마셔요','I drink water.','Object.'],['물이 있어요','There is water.','Subject.'],['찬물 주세요','Cold water, please.','Restaurant.']], [['물 주세요.','Water, please.','Restaurant.'],['물을 좀 마셔요.','I drink some water.','Object.'],['여기 물이 있어요.','There is water here.','Subject.']], '물 is essential in restaurants. 물 주세요 is more useful than just knowing “water.”', ['Use 물을 마셔요 for drinking water, but 물 주세요 for requesting water.']],
  ['noun','커피','coffee','food',['chapter-07','chapter-08'],['grammar-particle-eul-reul'],[['커피 주세요','Coffee, please.','Order.'],['커피를 마셔요','I drink coffee.','Object.'],['커피 마시고 싶어요','I want to drink coffee.','Desire.'],['아이스 커피 주세요','Iced coffee, please.','Cafe.']], [['커피 주세요.','Coffee, please.','Cafe.'],['커피를 마시고 싶어요.','I want to drink coffee.','Desire.'],['오늘은 커피 안 마셔요.','I do not drink coffee today.','Negative.']], 'In speech, 커피 마셔요 without 를 is also natural, but learn the full frame first.', ['Do not pronounce 커피 like English “coffee”; listen to the Korean vowels.']],
  ['noun','음식','food','food',['chapter-07','chapter-08'],['grammar-particle-eul-reul','grammar-particle-eun-neun'],[['음식을 먹어요','I eat food.','Object.'],['매운 음식','spicy food.','Description.'],['한국 음식','Korean food.','Noun phrase.'],['음식이 맛있어요','The food is delicious.','Subject.']], [['한국 음식을 먹고 싶어요.','I want to eat Korean food.','Desire.'],['매운 음식은 못 먹어요.','I cannot eat spicy food.','Restriction.'],['이 음식이 맛있어요.','This food is delicious.','Subject.']], '음식 is the general word for food or cuisine. It combines naturally with Korean, spicy, delicious, and eat.', ['For a meal, 밥 can also be natural; 음식 is broader.']],
  ['noun','돈','money','shopping',['chapter-04','chapter-07'],['grammar-particle-i-ga','grammar-particle-eul-reul'],[['돈이 있어요','I have money.','Possession.'],['돈이 없어요','I do not have money.','Absence.'],['돈을 내요','I pay money.','Object.'],['현금이 없어요','I do not have cash.','Related.']], [['돈이 있어요.','I have money.','Possession.'],['현금이 없어요.','I do not have cash.','Shopping.'],['돈을 내야 해요.','I have to pay money.','Obligation.']], '돈 is money. In stores, 카드 and 현금 are often more specific and useful.', ['Do not use 돈을 있어요 for “have money”; say 돈이 있어요.']],
  ['noun','카드','card','shopping',['chapter-07'],['grammar-particle-ro-euro'],[['카드 돼요?','Can I pay by card?','Shortcut.'],['카드로 결제해요','I pay by card.','Method.'],['카드 써도 돼요?','May I use a card?','Permission.'],['카드가 있어요','I have a card.','Possession.']], [['카드 돼요?','Can I pay by card?','Store.'],['카드로 결제할게요.','I will pay by card.','Payment.'],['카드 써도 돼요?','May I use a card?','Permission.']], '카드로 is the method “by card.” 카드 돼요? is short but very common.', ['카드로 사요 means buy by card, not buy a card.']],
  ['noun','지하철','subway','transportation',['chapter-10'],['grammar-particle-ro-euro','grammar-particle-e'],[['지하철을 타요','I take the subway.','Object.'],['지하철로 가요','I go by subway.','Method.'],['지하철역 어디예요?','Where is the subway station?','Travel.'],['지하철에서 내려요','I get off the subway.','Place/action.']], [['지하철을 타요.','I take the subway.','Transportation.'],['지하철로 갈 수 있어요?','Can I go by subway?','Method.'],['지하철역이 어디예요?','Where is the subway station?','Question.']], '지하철 is the subway system; 지하철역 is the subway station.', ['Use 지하철을 타요 for taking it; use 지하철로 가요 for going by subway.']],
  ['noun','버스','bus','transportation',['chapter-10'],['grammar-particle-eul-reul','grammar-particle-ro-euro'],[['버스를 타요','I take the bus.','Object.'],['버스로 가요','I go by bus.','Method.'],['버스를 기다려요','I wait for the bus.','Object.'],['버스에서 내려요','I get off the bus.','Place/action.']], [['버스를 타요.','I take the bus.','Transportation.'],['버스를 기다려요.','I wait for the bus.','Waiting.'],['다음 정류장에서 내려요.','I get off at the next stop.','Travel.']], '버스 is useful with 타다, 기다리다, 내리다, and 로/으로 for transportation method.', ['Do not say 버스에 타요 as your first pattern; 버스를 타요 is the beginner frame.']],
  ['noun','화장실','bathroom / restroom','travel',['chapter-04','chapter-10'],['grammar-particle-i-ga','grammar-particle-e'],[['화장실 어디예요?','Where is the bathroom?','Travel.'],['화장실이 있어요?','Is there a bathroom?','Existence.'],['화장실에 가요','I go to the bathroom.','Destination.'],['화장실에서 기다려요','I wait at the bathroom.','Action place.']], [['화장실 어디예요?','Where is the bathroom?','Direct.'],['여기 화장실 있어요?','Is there a bathroom here?','Existence.'],['화장실에 가고 싶어요.','I want to go to the bathroom.','Need.']], '화장실 is the normal public word for bathroom/restroom.', ['화장실이 어디예요? is complete; 화장실 어디예요? is natural spoken Korean.']],
  ['noun','병원','hospital / clinic','health',['chapter-06','chapter-08'],['grammar-particle-e'],[['병원에 가요','I go to the hospital/clinic.','Destination.'],['병원에 가야 해요','I have to go to the hospital.','Obligation.'],['병원이 어디예요?','Where is the hospital?','Question.'],['병원에서 기다려요','I wait at the hospital.','Action place.']], [['아파서 병원에 가요.','I am sick, so I go to the hospital.','Reason.'],['내일 병원에 가야 해요.','I have to go to the clinic tomorrow.','Schedule.'],['병원이 어디예요?','Where is the hospital?','Question.']], '병원 can mean hospital or clinic in everyday Korean.', ['Use 병원에 가요 for going to the clinic; the place of an action uses 병원에서.']],
  ['noun','약','medicine','health',['chapter-08','chapter-11'],['grammar-particle-eul-reul'],[['약을 먹어요','I take medicine.','Korean says eat medicine.'],['약이 있어요','I have medicine.','Possession.'],['약을 먹어야 해요','I have to take medicine.','Obligation.'],['약국에 가요','I go to the pharmacy.','Related.']], [['약을 먹어야 해요.','I have to take medicine.','Health.'],['약이 있어요?','Do you have medicine?','Question.'],['아파서 약을 먹어요.','I am sick, so I take medicine.','Reason.']], 'Korean commonly says 약을 먹어요 for taking medicine.', ['Do not translate “take medicine” word by word with take; use 먹다 in Korean.']],
  ['noun','길','road / way','travel',['chapter-10'],['grammar-particle-eul-reul'],[['길을 찾아요','I look for the way.','Travel.'],['길을 잃었어요','I am lost.','Set expression.'],['길이 막혀요','The road is blocked / traffic is bad.','Subject.'],['이 길로 가요','I go this way.','Direction.']], [['길을 잃었어요.','I am lost.','Travel.'],['길을 못 찾겠어요.','I cannot find the way.','Problem.'],['이 길로 가세요.','Please go this way.','Direction.']], '길 can mean road, path, way, or route. 길을 잃었어요 is a survival phrase.', ['Do not over-translate 길 as only physical road; it can mean way/route.']],
  ['noun','사진','photo','travel',['chapter-09','chapter-10'],['grammar-particle-eul-reul'],[['사진을 찍어요','I take a photo.','Object.'],['사진 찍어도 돼요?','May I take a photo?','Permission.'],['사진 찍어 주세요','Please take a photo.','Request.'],['사진을 봐요','I look at a photo.','Object.']], [['사진 찍어도 돼요?','May I take a photo?','Permission.'],['사진 찍어 주세요.','Please take a photo.','Request.'],['여기서 사진 찍지 마세요.','Please do not take photos here.','Rule.']], '사진 is usually paired with 찍다 for taking photos.', ['Use 사진 찍다 for “take a photo,” not 사진을 하다.']],
  ['noun','전화','phone call','daily-life',['chapter-10','chapter-11'],['grammar-ending-promise'],[['전화해요','I call.','Verb from noun + 하다.'],['전화할게요','I will call.','Promise.'],['전화해 주세요','Please call me.','Request.'],['전화번호가 뭐예요?','What is your phone number?','Related.']], [['나중에 전화할게요.','I will call later.','Promise.'],['지금 전화할 수 있어요?','Can you call now?','Question.'],['전화해 주세요.','Please call me.','Request.']], '전화 is a noun, but 전화하다 is the verb “to call.”', ['전화 alone is not a full verb; use 전화해요 or 전화하다 forms.']],
  ['noun','책','book','school',['chapter-05'],['grammar-particle-eul-reul'],[['책을 읽어요','I read a book.','Object.'],['책이 있어요','There is a book.','Subject.'],['한국어 책','Korean book.','Noun phrase.'],['책을 사요','I buy a book.','Shopping.']], [['책을 읽어요.','I read a book.','Object.'],['한국어 책이 있어요.','There is a Korean book.','Subject.'],['이 책을 사고 싶어요.','I want to buy this book.','Desire.']], '책 is useful with 읽다, 사다, 있다, and 없다. It also helps beginners practice object marker 을 because 책 ends in a consonant.', ['Use 책을 읽어요 for reading a book, not 책을 봐요 as your first beginner frame.']],
  ['noun','펜','pen','school',['chapter-05'],['grammar-particle-ro-euro','grammar-particle-eul-reul'],[['펜으로 써요','I write with a pen.','Tool.'],['펜이 있어요','I have a pen.','Possession.'],['펜을 써요','I use a pen.','Object.'],['펜 주세요','Pen, please.','Request.']], [['펜으로 이름을 써요.','I write my name with a pen.','Tool.'],['펜이 있어요?','Do you have a pen?','Question.'],['이 펜을 써도 돼요?','May I use this pen?','Permission.']], '펜 works well for practicing 로/으로 as a tool marker.', ['펜으로 means with a pen; 펜을 means the pen is the object.']],
  ['adjective','좋다','to be good / to like','daily-life',['chapter-04','chapter-11'],['grammar-particle-i-ga'],[['좋아요','It is good / I like it.','Polite adjective.'],['이거 좋아요','This is good.','Pointing.'],['날씨가 좋아요','The weather is good.','Subject.'],['저는 커피가 좋아요','I like coffee.','Preference.']], [['이거 좋아요.','This is good.','Evaluation.'],['날씨가 좋아요.','The weather is good.','Subject.'],['저는 한국어가 좋아요.','I like Korean.','Preference.']], '좋아요 can mean “it is good” or “I like it.” The subject often takes 이/가.', ['For liking something, Korean often says X이/가 좋아요, not X을/를 좋아요.'], {speechLevels:{casual:'좋아',polite:'좋아요',formal:'좋습니다'}, adjectiveForms:{past:'좋았어요',future:'좋을 거예요'}, note:'좋다 is an adjective, so it does not use want/request forms like verbs.'}],
  ['adjective','싫다','to dislike / to be undesirable','daily-life',['chapter-08'],['grammar-particle-i-ga'],[['싫어요','I do not like it.','Polite.'],['이거 싫어요','I do not like this.','Direct.'],['기다리는 게 싫어요','I dislike waiting.','Gerund phrase.'],['매운 음식이 싫어요','I dislike spicy food.','Preference.']], [['저는 매운 음식이 싫어요.','I dislike spicy food.','Preference.'],['기다리는 게 싫어요.','I dislike waiting.','Feeling.'],['그건 싫어요.','I do not like that.','Direct.']], '싫어요 can sound strong. For polite refusal, 고 싶지 않아요 can be softer.', ['Do not use 싫어요 for every polite refusal; sometimes 괜찮아요 or 안 해도 돼요 is softer.'], {speechLevels:{casual:'싫어',polite:'싫어요',formal:'싫습니다'}, adjectiveForms:{past:'싫었어요',future:'싫을 거예요'}}],
  ['adjective','크다','to be big','shopping',['chapter-07'],['grammar-particle-i-ga'],[['커요','It is big.','Polite.'],['너무 커요','It is too big.','Shopping.'],['큰 가방','big bag.','Before noun.'],['사이즈가 커요','The size is big.','Subject.']], [['이거 너무 커요.','This is too big.','Shopping.'],['큰 가방 주세요.','Please give me a big bag.','Request.'],['사이즈가 커요.','The size is big.','Subject.']], '크다 changes to 커요 in polite speech. It is useful in shopping because size problems are often described with 너무 커요 or 큰 ___.', ['크다 becomes 커요, not 크어요.'], {speechLevels:{casual:'커',polite:'커요',formal:'큽니다'}, adjectiveForms:{past:'컸어요',future:'클 거예요'}, irregular:'ㅡ contraction'}],
  ['adjective','작다','to be small','shopping',['chapter-07'],['grammar-particle-i-ga'],[['작아요','It is small.','Polite.'],['너무 작아요','It is too small.','Shopping.'],['작은 컵','small cup.','Before noun.'],['사이즈가 작아요','The size is small.','Subject.']], [['이거 너무 작아요.','This is too small.','Shopping.'],['작은 컵 주세요.','Please give me a small cup.','Request.'],['방이 작아요.','The room is small.','Description.']], '작다 is regular in polite speech: 작아요. In shopping and housing situations, it is often paired with size words like 사이즈, 컵, 방, and 가방.', ['Use 작은 before a noun: 작은 컵, not 작다 컵.'], {speechLevels:{casual:'작아',polite:'작아요',formal:'작습니다'}, adjectiveForms:{past:'작았어요',future:'작을 거예요'}}],
  ['adjective','많다','to be many / much','daily-life',['chapter-04'],['grammar-particle-i-ga'],[['많아요','There are many / it is a lot.','Polite.'],['사람이 많아요','There are many people.','Subject.'],['시간이 많아요','I have a lot of time.','Subject.'],['많이 먹어요','I eat a lot.','Adverb form.']], [['사람이 많아요.','There are many people.','Subject.'],['시간이 많지 않아요.','I do not have much time.','Careful negative.'],['한국어를 많이 공부해요.','I study Korean a lot.','Adverb related.']], '많다 describes quantity. 많이 is the adverb form “a lot.” Learners should practice both because 많아요 describes a noun, while 많이 describes an action.', ['많다 and 많이 are different: 사람이 많아요, 많이 먹어요.'], {speechLevels:{casual:'많아',polite:'많아요',formal:'많습니다'}, adjectiveForms:{past:'많았어요',future:'많을 거예요'}}],
  ['adjective','비싸다','to be expensive','shopping',['chapter-07','chapter-11'],['grammar-connector-if'],[['비싸요','It is expensive.','Polite.'],['너무 비싸요','It is too expensive.','Shopping.'],['비싸면 안 사요','If it is expensive, I do not buy it.','Condition.'],['비싸지 않아요','It is not expensive.','Careful negative.']], [['이거 비싸요?','Is this expensive?','Question.'],['너무 비싸서 안 사요.','It is too expensive, so I will not buy it.','Reason.'],['비싸면 안 사요.','If it is expensive, I do not buy it.','Condition.']], '비싸요 is useful for shopping but can sound blunt if said directly to staff.', ['Use 너무 비싸요 carefully; it can sound like a complaint.'], {speechLevels:{casual:'비싸',polite:'비싸요',formal:'비쌉니다'}, adjectiveForms:{past:'비쌌어요',future:'비쌀 거예요'}}],
  ['adjective','싸다','to be cheap','shopping',['chapter-07','chapter-11'],['grammar-connector-and'],[['싸요','It is cheap.','Polite.'],['싸고 좋아요','It is cheap and good.','Connector.'],['더 싼 거 있어요?','Do you have a cheaper one?','Shopping.'],['싸지 않아요','It is not cheap.','Careful negative.']], [['이거 싸요.','This is cheap.','Shopping.'],['싸고 좋아요.','It is cheap and good.','Connector.'],['더 싼 거 있어요?','Do you have a cheaper one?','Shopping.']], '싸다 can also mean “to wrap” in other contexts, but 싸요 in shopping usually means cheap.', ['Context matters: 싸요 can mean cheap or wraps, but shopping context makes it clear.'], {speechLevels:{casual:'싸',polite:'싸요',formal:'쌉니다'}, adjectiveForms:{past:'쌌어요',future:'쌀 거예요'}}],
  ['adjective','맛있다','to be delicious','food',['chapter-07'],['grammar-particle-i-ga'],[['맛있어요','It is delicious.','Polite.'],['음식이 맛있어요','The food is delicious.','Subject.'],['정말 맛있어요','It is really delicious.','Emphasis.'],['맛있는 음식','delicious food.','Before noun.']], [['이 음식이 맛있어요.','This food is delicious.','Subject.'],['정말 맛있어요.','It is really delicious.','Compliment.'],['맛있는 커피예요.','It is delicious coffee.','Before noun.']], '맛있어요 is one of the safest compliments in restaurants and with hosts.', ['Do not split 맛 and 있어요 too much in speech; say 맛있어요 smoothly.'], {speechLevels:{casual:'맛있어',polite:'맛있어요',formal:'맛있습니다'}, adjectiveForms:{past:'맛있었어요',future:'맛있을 거예요'}}],
  ['adjective','맵다','to be spicy','food',['chapter-07','chapter-08'],['grammar-particle-eun-neun'],[['매워요','It is spicy.','ㅂ irregular.'],['매운 음식','spicy food.','Before noun.'],['맵지 않아요','It is not spicy.','Careful negative.'],['매운 음식은 못 먹어요','I cannot eat spicy food.','Restriction.']], [['이 음식은 매워요.','This food is spicy.','Topic.'],['매운 음식은 못 먹어요.','I cannot eat spicy food.','Restriction.'],['맵지 않아요.','It is not spicy.','Negative.']], '맵다 is ㅂ irregular: 매워요, 매운 음식. It is especially useful for food restrictions, because 매운 음식은 못 먹어요 is a survival sentence.', ['맵다 becomes 매워요, not 맵어요.'], {speechLevels:{casual:'매워',polite:'매워요',formal:'맵습니다'}, adjectiveForms:{past:'매웠어요',future:'매울 거예요'}, irregular:'ㅂ irregular'}],
  ['adjective','쉽다','to be easy','school',['chapter-11'],['grammar-connector-and'],[['쉬워요','It is easy.','ㅂ irregular.'],['쉽지 않아요','It is not easy.','Negative.'],['쉬운 문제','easy problem.','Before noun.'],['한국어가 쉬워요?','Is Korean easy?','Question.']], [['이 문제는 쉬워요.','This problem is easy.','Topic.'],['한국어는 쉽지 않아요.','Korean is not easy.','Careful negative.'],['쉬운 문장이에요.','It is an easy sentence.','Before noun.']], '쉽다 is ㅂ irregular: 쉬워요, 쉬운. It helps learners talk about difficulty level, but the opposite 어렵다 is often needed in the same lesson.', ['쉽다 becomes 쉬워요, not 쉽어요.'], {speechLevels:{casual:'쉬워',polite:'쉬워요',formal:'쉽습니다'}, adjectiveForms:{past:'쉬웠어요',future:'쉬울 거예요'}, irregular:'ㅂ irregular'}],
  ['adjective','어렵다','to be difficult','school',['chapter-10','chapter-11'],['grammar-connector-and'],[['어려워요','It is difficult.','ㅂ irregular.'],['어렵지 않아요','It is not difficult.','Negative.'],['어려운 문제','difficult problem.','Before noun.'],['한국어가 어려워요','Korean is difficult.','Subject.']], [['한국어가 어려워요.','Korean is difficult.','Subject.'],['이 문장이 어려워요.','This sentence is difficult.','Subject.'],['어렵지만 재미있어요.','It is difficult, but fun.','Contrast.']], '어렵다 is ㅂ irregular: 어려워요, 어려운. It is useful in classroom repair conversations because learners often need to say a sentence or lesson is difficult.', ['어렵다 becomes 어려워요, not 어렵어요.'], {speechLevels:{casual:'어려워',polite:'어려워요',formal:'어렵습니다'}, adjectiveForms:{past:'어려웠어요',future:'어려울 거예요'}, irregular:'ㅂ irregular'}],
  ['adjective','바쁘다','to be busy','work',['chapter-08','chapter-11'],['grammar-connector-because'],[['바빠요','I am busy.','Polite.'],['오늘 바빠요','I am busy today.','Time.'],['바빠서 못 가요','I am busy, so I cannot go.','Reason.'],['바쁘지 않아요','I am not busy.','Negative.']], [['오늘은 바빠요.','I am busy today.','Topic.'],['바빠서 못 가요.','I am busy, so I cannot go.','Reason.'],['내일은 바쁘지 않아요.','I am not busy tomorrow.','Negative.']], '바쁘다 becomes 바빠요 in polite speech. It is a high-frequency reason word because 바빠서 못 가요 politely explains why a plan is impossible.', ['바쁘다 becomes 바빠요, not 바쁘어요.'], {speechLevels:{casual:'바빠',polite:'바빠요',formal:'바쁩니다'}, adjectiveForms:{past:'바빴어요',future:'바쁠 거예요'}, irregular:'ㅡ contraction'}],
  ['adverb','지금','now','daily-life',['chapter-05','chapter-09'],[],[['지금 가요','I am going now.','Time.'],['지금은 못 가요','As for now, I cannot go.','Contrast.'],['지금 해도 돼요?','May I do it now?','Permission.'],['지금 주문할까요?','Shall we order now?','Suggestion.']], [['지금 가요.','I am going now.','Time.'],['지금은 안 돼요.','Now is not okay.','Limit.'],['지금 주문할까요?','Shall we order now?','Question.']], '지금 usually comes near the beginning of the sentence or before the verb phrase.', ['Do not add 에 to 지금 in ordinary beginner sentences.']],
  ['adverb','여기','here','travel',['chapter-06','chapter-09'],['grammar-particle-e','grammar-particle-eseo'],[['여기에 있어요','It is here.','Location.'],['여기서 기다려요','I wait here.','Action place.'],['여기 앉아도 돼요?','May I sit here?','Permission.'],['여기로 와 주세요','Please come here.','Direction.']], [['여기서 기다려 주세요.','Please wait here.','Action place.'],['여기 앉아도 돼요?','May I sit here?','Permission.'],['여기에 있어요.','It is here.','Location.']], '여기 changes with particles: 여기에 location, 여기서 action place, 여기로 direction.', ['여기 and 여기서 are not always interchangeable.']],
  ['adverb','거기','there','travel',['chapter-06','chapter-10'],['grammar-particle-e','grammar-particle-eseo'],[['거기에 가요','I go there.','Destination.'],['거기서 만나요','I meet there.','Action place.'],['거기 있어요?','Are you there?','Location.'],['거기로 갈게요','I will go there.','Direction.']], [['거기서 만나요.','Let us meet there.','Action place.'],['거기에 가요.','I go there.','Destination.'],['거기로 갈게요.','I will go there.','Direction.']], '거기 means there, often near the listener or already-mentioned place.', ['Use 거기에 for destination/location and 거기서 for action place.']],
  ['adverb','같이','together','daily-life',['chapter-08','chapter-11'],['grammar-connector-and'],[['같이 가요','Let us go together.','Invitation.'],['같이 먹을까요?','Shall we eat together?','Suggestion.'],['같이 공부해요','We study together.','Action.'],['친구하고 같이 가요','I go together with a friend.','With person.']], [['같이 갈까요?','Shall we go together?','Suggestion.'],['친구하고 같이 공부해요.','I study together with a friend.','Together.'],['저도 같이 가요.','I am going together too.','Also.']], '같이 can mean together or like/as in other contexts; here it means together.', ['For “with a friend,” say 친구하고/친구랑 같이, not 친구로 같이.']],
  ['adverb','다시','again','school',['chapter-01','chapter-10'],[],[['다시 말해 주세요','Please say it again.','Request.'],['다시 들어요','Listen again.','Classroom.'],['다시 봐요','Look again / see again.','Review.'],['다시 할게요','I will do it again.','Promise.']], [['다시 말해 주세요.','Please say it again.','Classroom.'],['다시 들어요.','Listen again.','Study.'],['내일 다시 볼까요?','Shall we look again tomorrow?','Suggestion.']], '다시 is one of the most useful repair words for learners.', ['다시 means again; 더 means more. They are not always the same.']],
  ['adverb','천천히','slowly','school',['chapter-01','chapter-10'],[],[['천천히 말해 주세요','Please speak slowly.','Survival.'],['천천히 읽어요','I read slowly.','Action.'],['천천히 가요','Go slowly.','Movement.'],['조금 천천히 말해 주세요','Please speak a little slowly.','Soft request.']], [['천천히 말해 주세요.','Please speak slowly.','Learner phrase.'],['조금 천천히 읽어 주세요.','Please read a little slowly.','Classroom.'],['천천히 가세요.','Please go slowly / take care.','Polite.']], '천천히 is polite and clear for asking someone to slow down.', ['Do not pronounce it as English syllables; listen to the Korean rhythm.']],
  ['question','뭐','what','daily-life',['chapter-03','chapter-08'],[],[['뭐예요?','What is it?','Question.'],['뭐 먹어요?','What do you eat?','Object question.'],['뭐 하고 싶어요?','What do you want to do?','Desire.'],['뭐 드릴까요?','What can I get you?','Service.']], [['이건 뭐예요?','What is this?','Object identity.'],['뭐 먹고 싶어요?','What do you want to eat?','Desire.'],['지금 뭐 해요?','What are you doing now?','Daily.']], '뭐 is the spoken form of 무엇. It is very common in everyday Korean.', ['뭐예요 is natural spoken Korean; 무엇이에요 is more careful/dictionary-like.']],
  ['question','어디','where','travel',['chapter-06','chapter-10'],['grammar-particle-e','grammar-particle-eseo'],[['어디예요?','Where is it?','Question.'],['어디에 가요?','Where are you going?','Destination.'],['어디에서 공부해요?','Where do you study?','Action place.'],['화장실 어디예요?','Where is the bathroom?','Travel.']], [['어디에 가요?','Where are you going?','Destination.'],['어디에서 만나요?','Where do we meet?','Action place.'],['지하철역 어디예요?','Where is the subway station?','Travel.']], '어디 combines with 에 and 에서 depending on destination vs action place.', ['어디에 and 어디에서 are different: destination vs action place.']],
  ['question','언제','when','daily-life',['chapter-06','chapter-11'],[],[['언제 가요?','When do you go?','Question.'],['언제 만나요?','When do we meet?','Schedule.'],['언제까지 해요?','Until when do you do it?','Range.'],['언제 전화할까요?','When should I call?','Suggestion.']], [['언제 가요?','When do you go?','Schedule.'],['언제 만날까요?','When shall we meet?','Planning.'],['언제까지 일해요?','Until when do you work?','Range.']], '언제 asks about time. It usually does not need 에.', ['Do not say 언제에 가요 in ordinary speech.']],
  ['question','누구','who','daily-life',['chapter-02','chapter-09'],['grammar-particle-ege-hante'],[['누구예요?','Who is it?','Identity.'],['누구한테 줘요?','Who do I give it to?','Person receiver.'],['누구를 만나요?','Who do you meet?','Object.'],['누구하고 가요?','Who do you go with?','With person.']], [['누구예요?','Who is it?','Question.'],['누구를 만나요?','Who do you meet?','Object.'],['누구한테 말해요?','Who do you tell?','Receiver.']], '누구 changes naturally with particles: 누구를, 누구한테, 누구하고.', ['누가 means “who” as subject; 누구가 is not the normal beginner form.']],
  ['question','얼마','how much','shopping',['chapter-07'],[],[['얼마예요?','How much is it?','Price.'],['이거 얼마예요?','How much is this?','Shopping.'],['전부 얼마예요?','How much is everything?','Total.'],['하나에 얼마예요?','How much for one?','Per item.']], [['이거 얼마예요?','How much is this?','Shopping.'],['전부 얼마예요?','How much is everything?','Total.'],['하나에 얼마예요?','How much for one?','Per item.']], '얼마 asks price or amount. In shops, 이거 얼마예요? is a survival question.', ['얼마 and 얼마나 are related but not identical; use 얼마 for price first.']],
  ['question','어떻게','how','travel',['chapter-10','chapter-11'],[],[['어떻게 가요?','How do I go?','Directions.'],['어떻게 해요?','What should I do?','Problem.'],['어떻게 말해요?','How do you say it?','Language.'],['어떻게 도와드릴까요?','How can I help you?','Service.']], [['어떻게 가요?','How do I get there?','Directions.'],['이거 어떻게 해요?','How do I do this?','Problem.'],['한국어로 어떻게 말해요?','How do you say it in Korean?','Language.']], '어떻게 asks method or manner. 어떻게 해요? is a very useful “what should I do?” phrase.', ['어떻게 and 뭐 are different: how vs what.']]
];

// Survival nouns for the Newcomer Guide. Same tuple shape as generalWordSeeds:
// [kind, hangul, english, topic, chapterIds, grammarIds, usage, examples, nuance, mistakes].
// Emitted to newcomer-vocab.json with word-newcomer-* ids so the core 80/30/20 counts stay intact.
const newcomerSeeds = [
  ['noun','티머니','T-money (transit card)','transportation',['chapter-07','chapter-10'],['grammar-ending-request','grammar-particle-ro-euro'],[['티머니 주세요','A T-money card, please.','Request with N 주세요.'],['티머니로 타요','I ride with T-money.','Method 로.'],['티머니 있어요?','Do you have a T-money card?','Existence question.'],['티머니 충전해 주세요','Please charge the T-money.','Top-up request.']], [['편의점에서 티머니를 샀어요.','I bought a T-money card at the convenience store.','Past purchase.'],['티머니로 버스를 타요.','I ride the bus with T-money.','Method.'],['티머니 잔액이 없어요.','There is no balance on my T-money.','Problem.']], '티머니 (T-money) is the most common rechargeable transit card. You buy and recharge it at convenience stores and stations, and use it on subways, buses, and many taxis.', ['Do not say 티머니를 충전돼요; say 티머니를 충전해요 or 충전해 주세요.']],
  ['noun','충전','charge / top-up','shopping',['chapter-07'],['grammar-ending-request','grammar-particle-ro-euro'],[['충전해 주세요','Please charge it / top it up.','Core request.'],['만 원 충전해 주세요','Please charge 10,000 won.','Amount plus top-up.'],['카드로 충전돼요?','Can I top up by card?','Payment method.'],['어디서 충전해요?','Where do I top up?','Place question.']], [['지하철역에서 충전했어요.','I topped up at the subway station.','Past.'],['현금으로만 충전돼요.','You can only top up with cash.','Limitation.'],['오천 원 충전해 주세요.','Please charge 5,000 won.','Amount.']], '충전 means recharging value onto a card or topping up a balance (transit cards, prepaid SIMs, gift cards). The verb is 충전하다, and the request 충전해 주세요 is essential.', ['충전 adds balance; do not confuse it with 결제, which means making a payment.']],
  ['noun','유심','SIM / USIM card','travel',['chapter-07','chapter-10'],['grammar-ending-want','grammar-ending-request'],[['유심 주세요','A SIM card, please.','Request.'],['유심 사고 싶어요','I want to buy a SIM card.','Desire.'],['유심 바꿔 주세요','Please change the SIM.','Request.'],['선불 유심 있어요?','Do you have a prepaid SIM?','Existence.']], [['공항에서 유심을 샀어요.','I bought a SIM card at the airport.','Past.'],['유심을 바꾸고 싶어요.','I want to change my SIM.','Desire.'],['이 유심은 한 달 동안 써요.','I use this SIM for one month.','Duration.']], '유심 (USIM/SIM) is the small card that gives your phone a Korean number and data. Travelers often choose 선불 유심 (prepaid SIM) or an eSIM at the airport or a phone shop.', ['유심 is the physical card; the plan or number service is 요금제, which is related but different.']],
  ['noun','외국인등록증','Alien Registration Card (ARC)','travel',['chapter-02','chapter-10'],['grammar-particle-i-ga','grammar-ending-must'],[['외국인등록증이 있어요','I have an ARC.','Possession.'],['외국인등록증 주세요','Your ARC, please.','Staff request.'],['외국인등록증을 신청해요','I apply for an ARC.','Action.'],['외국인등록증이 필요해요?','Do I need an ARC?','Question.']], [['은행에서 외국인등록증이 필요해요.','You need an ARC at the bank.','Requirement.'],['외국인등록증을 신청해야 해요.','I have to apply for an ARC.','Obligation.'],['외국인등록증 있어요?','Do you have your ARC?','Question.']], '외국인등록증 (ARC) is the ID card for foreign residents. You usually apply within 90 days at an immigration office, and you need it for banking, phone contracts, and many services.', ['Carry the actual 외국인등록증 card; a passport alone is often not enough for resident services.']],
  ['noun','공항','airport','travel',['chapter-06','chapter-10'],['grammar-particle-e','grammar-particle-eseo'],[['공항에 가요','I go to the airport.','Destination.'],['공항에서 유심을 사요','I buy a SIM at the airport.','Action place.'],['공항이 멀어요?','Is the airport far?','Question.'],['공항버스 타요','I take the airport bus.','Transport.']], [['인천공항에 도착했어요.','I arrived at Incheon Airport.','Arrival.'],['공항에서 택시를 탔어요.','I took a taxi at the airport.','Action place.'],['공항까지 어떻게 가요?','How do I get to the airport?','Directions.']], '공항 is airport. From the airport you can reach the city by 공항철도 (airport railroad), 공항버스 (airport limousine bus), or taxi.', ['For going to the airport use 공항에 가요; for actions done there use 공항에서.']],
  ['noun','환승','transfer (transit)','transportation',['chapter-10','chapter-06'],['grammar-particle-eseo','grammar-ending-request'],[['어디서 환승해요?','Where do I transfer?','Question.'],['환승해야 해요','I have to transfer.','Obligation.'],['환승 무료예요?','Is the transfer free?','Cost.'],['여기서 환승해요','I transfer here.','Place.']], [['시청역에서 환승해요.','I transfer at City Hall Station.','Place.'],['버스에서 지하철로 환승했어요.','I transferred from bus to subway.','Route.'],['환승하면 더 싸요.','It is cheaper if you transfer with one card.','Condition.']], '환승 means transferring between buses and subways. If you tap the same transit card, transfers within a time limit are usually discounted or free.', ['Tap your card when getting off too, or you may lose the 환승 transfer discount.']],
  ['noun','정류장','bus stop','transportation',['chapter-06','chapter-10'],['grammar-particle-e','grammar-particle-eseo'],[['버스 정류장 어디예요?','Where is the bus stop?','Question.'],['다음 정류장에서 내려요','I get off at the next stop.','Action.'],['정류장이 가까워요','The bus stop is near.','Description.'],['이번 정류장이에요?','Is it this stop?','Confirmation.']], [['다음 정류장에서 내려요.','I get off at the next stop.','Travel.'],['정류장에서 버스를 기다려요.','I wait for the bus at the stop.','Action place.'],['버스 정류장이 어디예요?','Where is the bus stop?','Question.']], '정류장 is a bus stop. For the subway you say 역 (station) instead. Knowing 다음 정류장 (next stop) helps you get off at the right place.', ['Use 정류장 for buses and 역 for subway or train stations.']],
  ['noun','표','ticket','travel',['chapter-07','chapter-10'],['grammar-ending-want','grammar-ending-request'],[['표 한 장 주세요','One ticket, please.','Counter 장.'],['표를 사고 싶어요','I want to buy a ticket.','Desire.'],['표가 있어요?','Are there tickets available?','Availability.'],['표 어디서 사요?','Where do I buy tickets?','Place.']], [['KTX 표를 예매했어요.','I booked a KTX ticket.','Past booking.'],['표 두 장 주세요.','Two tickets, please.','Counter.'],['표가 다 팔렸어요.','The tickets are sold out.','Status.']], '표 is a ticket for a train, bus, or movie. For trains like KTX and SRT you often 예매 (book in advance) online or at the station; tickets are counted with 장.', ['Count tickets with 장: 표 한 장, 표 두 장, not 표 하나 in formal counting.']],
  ['noun','택시','taxi','transportation',['chapter-10','chapter-06'],['grammar-ending-request','grammar-particle-ro-euro'],[['택시 타요','I take a taxi.','Transport.'],['택시 불러 주세요','Please call a taxi.','Request.'],['여기로 가 주세요','Please go here.','Direction.'],['택시로 가요','I go by taxi.','Method.']], [['공항에서 택시를 탔어요.','I took a taxi from the airport.','Past.'],['이 주소로 가 주세요.','Please go to this address.','Direction.'],['택시가 안 잡혀요.','I cannot catch a taxi.','Problem.']], '택시 is taxi. Apps like Kakao T are common; if you show the address in Korean and say 여기로 가 주세요, the driver can take you there.', ['Show the destination in Korean as an address or in an app; English place names may not be understood.']],
  ['noun','월세','monthly rent','home',['chapter-04','chapter-07'],['grammar-particle-i-ga','grammar-ending-must'],[['월세가 얼마예요?','How much is the monthly rent?','Price.'],['월세를 내요','I pay the monthly rent.','Payment.'],['월세가 비싸요','The rent is expensive.','Description.'],['보증금이 있어요?','Is there a deposit?','Related.']], [['월세가 오십만 원이에요.','The monthly rent is 500,000 won.','Price.'],['매달 월세를 내야 해요.','I have to pay rent every month.','Obligation.'],['월세가 너무 비싸요.','The rent is too expensive.','Complaint.']], '월세 is monthly rent, usually paired with a smaller deposit (보증금). It contrasts with 전세, a large lump-sum deposit with little or no monthly rent.', ['월세 (monthly rent) and 전세 (lump-sum deposit lease) are different contracts; do not mix them up.']],
  ['noun','보증금','deposit (housing)','home',['chapter-04','chapter-07'],['grammar-particle-i-ga','grammar-particle-eul-reul'],[['보증금이 얼마예요?','How much is the deposit?','Price.'],['보증금을 내요','I pay the deposit.','Payment.'],['보증금을 돌려받아요','I get the deposit back.','Return.'],['보증금이 너무 높아요','The deposit is too high.','Description.']], [['보증금이 천만 원이에요.','The deposit is 10 million won.','Price.'],['계약할 때 보증금을 내요.','You pay the deposit when you sign the contract.','Timing.'],['이사 갈 때 보증금을 돌려받아요.','You get the deposit back when you move out.','Return.']], '보증금 is the deposit a tenant pays the landlord. With 월세 it is usually returned when you move out, minus any unpaid rent or damage.', ['Keep the contract (계약서); you need it to get your 보증금 back.']],
  ['noun','계좌','bank account','shopping',['chapter-04','chapter-07'],['grammar-particle-i-ga','grammar-ending-want'],[['계좌를 만들고 싶어요','I want to open a bank account.','Desire.'],['계좌가 있어요?','Do you have an account?','Question.'],['계좌번호 주세요','Your account number, please.','Request.'],['계좌로 보내요','I send money to the account.','Transfer.']], [['은행에서 계좌를 만들었어요.','I opened an account at the bank.','Past.'],['외국인등록증으로 계좌를 만들어요.','I open an account with my ARC.','Requirement.'],['계좌로 송금해 주세요.','Please transfer to the account.','Transfer.']], '계좌 is a bank account. To open one (계좌를 만들다) you usually need your 외국인등록증 (ARC) and a phone number; the passbook is 통장.', ['Opening an account often requires an ARC (외국인등록증); a passport alone may not be accepted.']],
  ['noun','분리수거','separated recycling','home',['chapter-09','chapter-05'],['grammar-ending-must','grammar-ending-prohibition'],[['분리수거를 해요','I sort the recycling.','Action.'],['분리수거 어떻게 해요?','How do I sort recycling?','Question.'],['분리수거를 해야 해요','I have to sort the recycling.','Obligation.'],['여기에 버려도 돼요?','May I throw it away here?','Permission.']], [['플라스틱은 분리수거해요.','Plastic is separated for recycling.','Rule.'],['음식물 쓰레기는 따로 버려요.','Food waste is thrown out separately.','Rule.'],['분리수거 날이 언제예요?','When is the recycling day?','Schedule.']], '분리수거 is the strict trash sorting used in Korea: plastic, paper, glass, cans, and food waste go separately, often on set days. Rules vary by district (구).', ['General trash must go in a 종량제봉투 (volume-rate bag); recyclables are sorted separately.']],
  ['noun','종량제봉투','volume-rate trash bag','home',['chapter-07','chapter-09'],['grammar-ending-request','grammar-particle-e'],[['종량제봉투 주세요','A volume-rate trash bag, please.','Request.'],['종량제봉투 어디서 사요?','Where do I buy the trash bags?','Place.'],['10리터 종량제봉투 주세요','A 10-liter bag, please.','Size.'],['종량제봉투에 버려요','I throw it in the official bag.','Action.']], [['편의점에서 종량제봉투를 사요.','I buy trash bags at the convenience store.','Place.'],['종량제봉투에 일반 쓰레기를 넣어요.','I put general trash in the official bag.','Use.'],['종량제봉투 사이즈가 여러 개예요.','There are several bag sizes.','Info.']], '종량제봉투 is the official, district-specific bag you must use for general trash; you buy it at convenience stores and marts. Using the wrong bag can mean it is not collected.', ['Buy the bag for your district (구); bags from another district may not be collected.']],
  ['noun','약국','pharmacy','health',['chapter-06','chapter-08'],['grammar-particle-e','grammar-ending-want'],[['약국이 어디예요?','Where is the pharmacy?','Question.'],['약국에 가요','I go to the pharmacy.','Destination.'],['약을 사고 싶어요','I want to buy medicine.','Desire.'],['감기약 주세요','Cold medicine, please.','Request.']], [['약국에서 감기약을 샀어요.','I bought cold medicine at the pharmacy.','Past.'],['병원 옆에 약국이 있어요.','There is a pharmacy next to the hospital.','Location.'],['약국이 문을 닫았어요.','The pharmacy is closed.','Status.']], '약국 is a pharmacy. For prescription medicine you bring a 처방전 from a clinic; for minor issues, pharmacists can recommend over-the-counter medicine.', ['For prescription drugs you need a 처방전; not everything is available without one.']],
  ['noun','처방전','prescription','health',['chapter-08','chapter-06'],['grammar-particle-eul-reul','grammar-ending-request'],[['처방전 주세요','The prescription, please.','Request.'],['처방전이 있어요?','Do you have a prescription?','Question.'],['처방전을 받았어요','I got a prescription.','Past.'],['처방전이 필요해요','I need a prescription.','Need.']], [['병원에서 처방전을 받았어요.','I got a prescription at the clinic.','Past.'],['처방전을 약국에 냈어요.','I gave the prescription to the pharmacy.','Action.'],['이 약은 처방전이 필요해요.','This medicine needs a prescription.','Requirement.']], '처방전 is a prescription written by a doctor. You receive it at a 병원 or clinic and take it to a 약국 to get the medicine; many drugs require it.', ['처방전 (prescription) is from the clinic; you fill it at the 약국 (pharmacy), which is a different place.']],
  ['noun','택배','parcel delivery','shopping',['chapter-07','chapter-10'],['grammar-particle-i-ga','grammar-ending-request'],[['택배가 왔어요','A package arrived.','Arrival.'],['택배를 보내요','I send a parcel.','Action.'],['택배 언제 와요?','When does the delivery come?','Question.'],['문 앞에 놔 주세요','Please leave it at the door.','Request.']], [['택배가 아직 안 왔어요.','The package has not arrived yet.','Status.'],['택배를 편의점에서 보냈어요.','I sent the parcel at the convenience store.','Place.'],['택배 송장 번호가 뭐예요?','What is the tracking number?','Tracking.']], '택배 is courier parcel delivery (for example CJ대한통운 or 우체국). You track it with a 송장 번호 (tracking number); convenience-store drop-off and pickup are common.', ['택배 is parcel courier service; 배달 usually means food delivery, which is a different service.']],
  ['noun','미세먼지','fine dust (air pollution)','health',['chapter-04','chapter-11'],['grammar-particle-i-ga','grammar-connector-because'],[['미세먼지가 많아요','There is a lot of fine dust.','Condition.'],['미세먼지가 심해요','The fine dust is severe.','Severity.'],['마스크를 써요','I wear a mask.','Response.'],['오늘 미세먼지 어때요?','How is the fine dust today?','Question.']], [['오늘은 미세먼지가 심해요.','The fine dust is bad today.','Condition.'],['미세먼지가 많아서 마스크를 써요.','I wear a mask because of the fine dust.','Reason.'],['미세먼지가 나쁨이에요.','The fine dust level is bad.','Index.']], '미세먼지 is fine dust or air pollution, reported daily as 좋음(good), 보통(normal), 나쁨(bad), and 매우 나쁨(very bad). On bad days people wear masks and limit outdoor time.', ['미세먼지 (PM10) and 초미세먼지 (PM2.5) are reported separately; check both.']]
];

function expressionExplanation(index, hangul, romanization, english, usage) {
  const u = usage[0];
  const variants = [
    `${hangul} (${romanization}) means "${english}". Say it as one set phrase — for example ${u[0]} ("${u[1]}"). What matters is the situation and how polite it sounds, so copy it whole from the examples instead of translating word by word.`,
    `"${english}" — that is ${hangul} (${romanization}). It is a fixed expression you use as a chunk, like ${u[0]} ("${u[1]}"). Match it to the right moment and the right listener; the examples show when it fits and what usually comes next.`,
    `${hangul} (${romanization}) = "${english}". Treat it as a ready-made line rather than separate words: ${u[0]} ("${u[1]}"). Learn the situation it belongs to, and notice the reply it tends to invite.`
  ];
  return variants[index % variants.length];
}
function patternExplanation(index, hangul, romanization, english, usage, formNote) {
  const u = usage[0];
  const variants = [
    `${hangul} (${romanization}) means "${english}" — a sentence frame, not a single word. Keep the frame and swap the marked V or N for your own, e.g. ${u[0]} ("${u[1]}"). ${formNote}`,
    `"${english}" uses the pattern ${hangul} (${romanization}). Plug a real verb stem or noun into the slot: ${u[0]} ("${u[1]}"). ${formNote}`,
    `${hangul} (${romanization}) = "${english}". It is a reusable structure — change one word at a time and the grammar stays correct: ${u[0]} ("${u[1]}"). ${formNote}`
  ];
  return variants[index % variants.length];
}
function expressionEntry(seed, index) {
  const [hangul, romanization, english, topic, usage, examples, nuance, mistakes = []] = seed;
  const entry = {
    id: `expr-${String(index + 1).padStart(3, '0')}`,
    sort: 1000 + index + 1,
    type: 'expression',
    level: 'A1',
    topic: [topic],
    hangul,
    romanization,
    english,
    partOfSpeech: 'expression',
    irregular: null,
    shortExplanation: `${hangul} is a practical expression meaning "${english}".`,
    explanation: expressionExplanation(index, hangul, romanization, english, usage),
    learnerPriority: `Memorize ${hangul} with one situation and one follow-up phrase. Do not translate it word by word while speaking.`,
    contextHint: `Use this expression in ${topicTask(topic)}. Check the examples to see whether it fits staff, strangers, teachers, friends, or emergencies.`,
    speechLevels: null,
    usagePhrases: usage.map(([ko, en, note]) => phrase(ko, en, note)),
    examples: examples.map(([ko, en, note]) => phrase(ko, en, note)),
    nuance,
    commonMistakes: [
      'Do not add another polite ending to a phrase that is already complete.',
      'Use the whole expression in the situation shown by the examples.',
      ...mistakes
    ],
    notes: []
  };
  entry.lesson = makeExpressionLesson(entry, topic);
  return entry;
}

const expressionSeeds = [
  ['안녕하세요','annyeonghaseyo','Hello.','daily-life',[['안녕하세요','Hello.','Safe greeting.'],['안녕하세요?','Hello / how are you?','Question-like greeting.'],['선생님, 안녕하세요','Hello, teacher.','Polite address.'],['안녕하세요, 저는 민수예요','Hello, I am Minsu.','Self-introduction.']], [['안녕하세요.','Hello.','Basic greeting.'],['안녕하세요, 처음 뵙겠습니다.','Hello, nice to meet you.','Formal first meeting.'],['안녕하세요, 저는 하나예요.','Hello, I am Hana.','Introduction.']], 'Safe with almost everyone. It is more polite than 안녕.'],
  ['감사합니다','gamsahamnida','Thank you.','daily-life',[['감사합니다','Thank you.','Formal and safe.'],['정말 감사합니다','Thank you very much.','Stronger thanks.'],['도와주셔서 감사합니다','Thank you for helping.','Specific thanks.'],['오늘 감사합니다','Thank you for today.','Common closing.']], [['감사합니다.','Thank you.','Basic.'],['정말 감사합니다.','Thank you very much.','Stronger.'],['도와주셔서 감사합니다.','Thank you for helping me.','Specific.']], 'Formal, polite, and safe. 고마워요 is warmer and a bit less formal.'],
  ['고마워요','gomawoyo','Thank you.','daily-life',[['고마워요','Thank you.','Polite but warm.'],['정말 고마워요','Thank you so much.','Warm thanks.'],['도와줘서 고마워요','Thanks for helping.','Friendly.'],['오늘 고마워요','Thanks for today.','Natural close.']], [['고마워요.','Thank you.','Polite.'],['정말 고마워요.','Thank you so much.','Warm.'],['도와줘서 고마워요.','Thanks for helping.','Friendly.']], 'Polite enough for many situations, but 감사합니다 is safer in formal service or business contexts.'],
  ['죄송합니다','joesonghamnida','I am sorry.','daily-life',[['죄송합니다','I am sorry.','Formal apology.'],['정말 죄송합니다','I am very sorry.','Stronger apology.'],['늦어서 죄송합니다','Sorry I am late.','Reason + apology.'],['방해해서 죄송합니다','Sorry to interrupt.','Formal interruption.']], [['죄송합니다.','I am sorry.','Basic apology.'],['늦어서 죄송합니다.','Sorry I am late.','Specific apology.'],['잠시 방해해서 죄송합니다.','Sorry to interrupt for a moment.','Polite.']], 'Use this when you need to sound respectful. 미안해요 is softer and less formal.'],
  ['괜찮아요','gwaenchanayo','It is okay.','daily-life',[['괜찮아요','It is okay.','Reassurance.'],['저는 괜찮아요','I am okay.','About yourself.'],['괜찮아요?','Are you okay?','Checking.'],['네, 괜찮아요','Yes, it is okay.','Response.']], [['괜찮아요.','It is okay.','Basic.'],['저는 괜찮아요.','I am okay.','Self.'],['여기 앉아도 괜찮아요?','Is it okay if I sit here?','Permission.']], 'Can mean “I am okay,” “it is okay,” or “no problem” depending on context.'],
  ['네','ne','Yes.','daily-life',[['네','Yes.','Polite yes.'],['네, 맞아요','Yes, that is right.','Agreement.'],['네, 알겠어요','Yes, I understand.','Acknowledgment.'],['네, 괜찮아요','Yes, it is okay.','Reassurance.']], [['네.','Yes.','Basic.'],['네, 맞아요.','Yes, that is right.','Agreement.'],['네, 알겠습니다.','Yes, I understand.','Formal.']], '네 can also mean “I hear you” or “okay” while listening, not only yes.'],
  ['아니요','aniyo','No.','daily-life',[['아니요','No.','Polite no.'],['아니요, 괜찮아요','No, it is okay.','Declining politely.'],['아니요, 몰라요','No, I do not know.','Answer.'],['아니요, 안 가요','No, I am not going.','Negative answer.']], [['아니요.','No.','Basic.'],['아니요, 괜찮아요.','No, it is okay.','Polite decline.'],['아니요, 저는 안 가요.','No, I am not going.','Clarifying.']], 'Use 아니요 as a polite no. 아니 is casual, and 아니요 often sounds softer when followed by a short explanation like 괜찮아요 or 몰라요.'],
  ['잠시만요','jamsimanyo','One moment, please.','daily-life',[['잠시만요','One moment, please.','Polite pause.'],['잠시만 기다려 주세요','Please wait a moment.','Request.'],['잠시만요, 지나갈게요','Excuse me, I will pass.','Moving through.'],['잠시만 확인할게요','I will check for a moment.','Service/work.']], [['잠시만요.','One moment, please.','Basic.'],['잠시만 기다려 주세요.','Please wait a moment.','Polite request.'],['잠시만 확인할게요.','I will check for a moment.','Work/service.']], 'More polite than 잠깐만요. Very useful in stores, offices, and classrooms.'],
  ['실례합니다','sillyehamnida','Excuse me.','travel',[['실례합니다','Excuse me.','Formal attention.'],['실례합니다, 지나갈게요','Excuse me, I will pass.','Crowded place.'],['실례합니다, 화장실 어디예요?','Excuse me, where is the bathroom?','Question starter.'],['실례합니다, 잠시만요','Excuse me, one moment.','Polite interruption.']], [['실례합니다.','Excuse me.','Basic.'],['실례합니다, 지하철역 어디예요?','Excuse me, where is the subway station?','Travel.'],['실례합니다, 지나갈게요.','Excuse me, I will pass.','Crowded place.']], 'Use before asking strangers a question or passing through.'],
  ['여기요','yeogiyo','Excuse me / over here.','food',[['여기요','Excuse me / over here.','Calling staff.'],['여기요, 주문할게요','Excuse me, we will order.','Restaurant.'],['여기요, 물 주세요','Excuse me, water please.','Restaurant.'],['여기요, 계산해 주세요','Excuse me, check please.','Restaurant.']], [['여기요.','Excuse me.','Calling staff.'],['여기요, 물 주세요.','Excuse me, water please.','Restaurant.'],['여기요, 계산해 주세요.','Excuse me, check please.','Restaurant.']], 'Common in restaurants. Do not use it like “here” in all contexts.'],
  ['이거 주세요','igeo juseyo','This one, please.','shopping',[['이거 주세요','This one, please.','Pointing and buying.'],['이거 하나 주세요','One of these, please.','Quantity.'],['이거 두 개 주세요','Two of these, please.','Quantity.'],['이거 포장해 주세요','Please wrap / pack this.','Shopping/food.']], [['이거 주세요.','This one, please.','Shopping.'],['이거 하나 주세요.','One of these, please.','Quantity.'],['이거 카드로 살 수 있어요?','Can I buy this by card?','Payment.']], '이거 is casual spoken “this thing.” 이것 is a little more dictionary-like.'],
  ['물 주세요','mul juseyo','Water, please.','food',[['물 주세요','Water, please.','Basic request.'],['찬물 주세요','Cold water, please.','Restaurant.'],['물 한 잔 주세요','One glass of water, please.','Quantity.'],['물 좀 주세요','Some water, please.','Softened request.']], [['물 주세요.','Water, please.','Basic.'],['찬물 한 잔 주세요.','One glass of cold water, please.','Restaurant.'],['물 좀 더 주세요.','Please give me a little more water.','More.']], '좀 softens a request. 물 좀 주세요 sounds natural and polite enough in restaurants.'],
  ['계산해 주세요','gyesanhae juseyo','Check, please.','food',[['계산해 주세요','Check, please.','Restaurant.'],['따로 계산해 주세요','Please split the bill.','Payment.'],['같이 계산해 주세요','Please put it together.','Payment.'],['카드로 계산할게요','I will pay by card.','Payment.']], [['계산해 주세요.','Check, please.','Restaurant.'],['카드로 계산할게요.','I will pay by card.','Payment.'],['따로 계산할 수 있어요?','Can we pay separately?','Question.']], '계산하다 means calculate or pay/check out. In restaurants it means paying the bill.'],
  ['포장해 주세요','pojanghae juseyo','Please make it to go.','food',[['포장해 주세요','Please make it to go.','Food/shopping.'],['이거 포장해 주세요','Please pack this.','Pointing.'],['남은 거 포장해 주세요','Please pack the leftovers.','Restaurant.'],['포장 가능해요?','Is takeout possible?','Question.']], [['포장해 주세요.','Please make it to go.','Basic.'],['남은 거 포장해 주세요.','Please pack the leftovers.','Restaurant.'],['이거 포장 가능해요?','Can this be packed to go?','Question.']], 'For food, 포장 means takeout or packing leftovers.'],
  ['얼마예요?','eolmayeyo','How much is it?','shopping',[['얼마예요?','How much is it?','Price question.'],['이거 얼마예요?','How much is this?','Shopping.'],['전부 얼마예요?','How much is everything?','Total.'],['하나에 얼마예요?','How much for one?','Per item.']], [['이거 얼마예요?','How much is this?','Shopping.'],['전부 얼마예요?','How much is everything?','Total.'],['하나에 얼마예요?','How much for one?','Per item.']], 'Use with pointing. 이거 얼마예요? is one of the most useful shopping questions.'],
  ['카드 돼요?','kadeu dwaeyo','Can I pay by card?','shopping',[['카드 돼요?','Can I pay by card?','Spoken shortcut.'],['카드 결제 돼요?','Is card payment possible?','Clearer.'],['현금만 돼요?','Is it cash only?','Question.'],['카드로 할게요','I will pay by card.','Payment.']], [['카드 돼요?','Can I pay by card?','Short spoken.'],['카드 결제 돼요?','Is card payment possible?','Clear.'],['그럼 현금으로 할게요.','Then I will pay in cash.','Fallback.']], '카드 돼요? is casual but common in stores. 카드 결제 돼요? is clearer and more polite.'],
  ['화장실 어디예요?','hwajangsil eodiyeyo','Where is the bathroom?','travel',[['화장실 어디예요?','Where is the bathroom?','Direct question.'],['화장실이 어디예요?','Where is the bathroom?','More complete.'],['저쪽이에요','It is over there.','Likely answer.'],['여기 화장실 있어요?','Is there a bathroom here?','Existence question.']], [['화장실 어디예요?','Where is the bathroom?','Travel.'],['실례합니다, 화장실이 어디예요?','Excuse me, where is the bathroom?','Polite.'],['여기 화장실 있어요?','Is there a bathroom here?','Alternative.']], 'Dropping 이 is common in speech: 화장실 어디예요? is natural.'],
  ['지하철역 어디예요?','jihacheollyeok eodiyeyo','Where is the subway station?','transportation',[['지하철역 어디예요?','Where is the subway station?','Travel.'],['지하철역이 어디예요?','Where is the subway station?','More complete.'],['가까운 역 어디예요?','Where is the nearest station?','Useful.'],['몇 호선이에요?','Which line is it?','Follow-up.']], [['지하철역 어디예요?','Where is the subway station?','Direct.'],['가까운 지하철역이 어디예요?','Where is the nearest subway station?','Travel.'],['몇 호선이에요?','Which subway line is it?','Follow-up.']], '역 means station; 지하철역 specifically means subway station.'],
  ['길을 잃었어요','gireul ireosseoyo','I am lost.','travel',[['길을 잃었어요','I am lost.','Travel emergency.'],['제가 길을 잃었어요','I am lost.','Clear subject.'],['도와주세요','Please help me.','Follow-up.'],['여기가 어디예요?','Where is this place?','Follow-up.']], [['길을 잃었어요.','I am lost.','Basic.'],['죄송하지만 길을 잃었어요.','Sorry, but I am lost.','Polite.'],['여기가 어디예요?','Where am I / where is this?','Follow-up.']], 'Use this when you genuinely need help finding your way.'],
  ['도와주세요','dowajuseyo','Please help me.','travel',[['도와주세요','Please help me.','Urgent or normal help.'],['좀 도와주세요','Please help me a little.','Softer.'],['한국어를 잘 못해요','I cannot speak Korean well.','Useful follow-up.'],['길을 잃었어요','I am lost.','Travel follow-up.']], [['도와주세요.','Please help me.','Basic.'],['죄송하지만 좀 도와주세요.','Sorry, but please help me.','Polite.'],['한국어를 잘 못해요. 도와주세요.','I cannot speak Korean well. Please help me.','Survival.']], 'Can be urgent or ordinary depending on tone. Add 좀 to soften a normal request.'],
  ['천천히 말해 주세요','cheoncheonhi malhae juseyo','Please speak slowly.','school',[['천천히 말해 주세요','Please speak slowly.','Survival phrase.'],['조금 천천히 말해 주세요','Please speak a little slowly.','Softer.'],['다시 말해 주세요','Please say it again.','Related.'],['잘 못 들었어요','I did not hear well.','Follow-up.']], [['천천히 말해 주세요.','Please speak slowly.','Basic.'],['죄송하지만 조금 천천히 말해 주세요.','Sorry, but please speak a little slowly.','Polite.'],['잘 못 들었어요. 다시 말해 주세요.','I did not hear well. Please say it again.','Follow-up.']], 'Very useful for learners. It is polite and clear.'],
  ['다시 말해 주세요','dasi malhae juseyo','Please say it again.','school',[['다시 말해 주세요','Please say it again.','Request.'],['한 번 더 말해 주세요','Please say it one more time.','Natural.'],['잘 못 들었어요','I did not hear well.','Reason.'],['천천히 말해 주세요','Please speak slowly.','Related.']], [['다시 말해 주세요.','Please say it again.','Basic.'],['한 번 더 말해 주세요.','Please say it one more time.','Natural.'],['잘 못 들었어요. 다시 말해 주세요.','I did not hear well. Please say it again.','Reason.']], '다시 means again. 한 번 더 is also very natural for “one more time.”'],
  ['한국어를 조금 해요','hangugeoreul jogeum haeyo','I speak a little Korean.','school',[['한국어를 조금 해요','I speak a little Korean.','Modest statement.'],['한국어를 잘 못해요','I cannot speak Korean well.','More useful for beginners.'],['조금만 알아요','I only know a little.','Humble.'],['천천히 말해 주세요','Please speak slowly.','Follow-up.']], [['한국어를 조금 해요.','I speak a little Korean.','Basic.'],['한국어를 잘 못해요.','I cannot speak Korean well.','Often more natural.'],['천천히 말해 주세요.','Please speak slowly.','Follow-up.']], '잘 못해요 is often more honest and useful than 조금 해요 for beginners.'],
  ['영어 할 수 있어요?','yeongeo hal su isseoyo','Can you speak English?','travel',[['영어 할 수 있어요?','Can you speak English?','Short spoken.'],['영어로 말해도 돼요?','May I speak in English?','Polite alternative.'],['한국어를 잘 못해요','I cannot speak Korean well.','Explanation.'],['천천히 말해 주세요','Please speak slowly.','Fallback.']], [['영어 할 수 있어요?','Can you speak English?','Direct.'],['영어로 말해도 돼요?','May I speak in English?','Polite.'],['한국어를 잘 못해요.','I cannot speak Korean well.','Explanation.']], '영어 하세요? is also common, but 영어 할 수 있어요? is clearer for learners.'],
  ['잘 모르겠어요','jal moreugesseoyo','I am not sure / I do not really know.','school',[['잘 모르겠어요','I am not sure.','Soft unknown.'],['모르겠어요','I do not know.','Neutral.'],['아직 잘 모르겠어요','I am not sure yet.','With 아직.'],['다시 설명해 주세요','Please explain again.','Follow-up.']], [['잘 모르겠어요.','I am not sure.','Basic.'],['아직 잘 모르겠어요.','I am not sure yet.','Soft.'],['다시 설명해 주세요.','Please explain again.','Classroom.']], '모르겠어요 is softer than 몰라요 in many adult situations.'],
  ['알겠어요','algesseoyo','I understand / okay.','school',[['알겠어요','I understand / okay.','Polite.'],['네, 알겠어요','Yes, I understand.','Response.'],['잘 알겠어요','I understand well.','Stronger.'],['알겠습니다','I understand.','Formal.']], [['알겠어요.','I understand.','Basic.'],['네, 알겠습니다.','Yes, I understand.','Formal.'],['이제 알겠어요.','Now I understand.','Learning.']], '알겠어요 often means “okay, I got it,” not only intellectual understanding.'],
  ['사진 찍어도 돼요?','sajin jjigeodo dwaeyo','May I take a photo?','travel',[['사진 찍어도 돼요?','May I take a photo?','Permission.'],['여기서 사진 찍어도 돼요?','May I take a photo here?','Place.'],['사진 찍지 마세요','Please do not take photos.','Likely sign.'],['사진 찍어 주세요','Please take a photo.','Request.']], [['사진 찍어도 돼요?','May I take a photo?','Basic.'],['여기서 사진 찍어도 돼요?','May I take a photo here?','Travel.'],['죄송하지만 사진 찍어 주세요.','Sorry, but please take a photo.','Request.']], 'Use this before taking photos in museums, shops, or private spaces.'],
  ['예약했어요','yeyakhaesseoyo','I made a reservation.','travel',[['예약했어요','I made a reservation.','Check-in.'],['예약하고 싶어요','I want to make a reservation.','Before booking.'],['예약 확인해 주세요','Please check my reservation.','Hotel/restaurant.'],['이름은 하나예요','The name is Hana.','Follow-up.']], [['예약했어요.','I made a reservation.','Basic.'],['예약 확인해 주세요.','Please check my reservation.','Check-in.'],['제 이름은 하나예요.','My name is Hana.','Follow-up.']], 'Use at hotels, restaurants, clinics, and ticket counters.'],
  ['아파요','apayo','It hurts / I am sick.','health',[['아파요','It hurts / I am sick.','Basic.'],['머리가 아파요','My head hurts.','Body part.'],['배가 아파요','My stomach hurts.','Body part.'],['병원에 가야 해요','I have to go to the hospital.','Follow-up.']], [['아파요.','I am sick / it hurts.','Basic.'],['머리가 아파요.','My head hurts.','Specific.'],['병원에 가야 해요.','I have to go to the hospital.','Follow-up.']], 'Use body part + 이/가 아파요: 머리가 아파요, 배가 아파요.'],
  ['내일 봐요','naeil bwayo','See you tomorrow.','daily-life',[['내일 봐요','See you tomorrow.','Polite casual goodbye.'],['나중에 봐요','See you later.','General.'],['다음에 봐요','See you next time.','General.'],['조심히 가세요','Get home safely.','Polite goodbye.']], [['내일 봐요.','See you tomorrow.','Basic.'],['그럼 내일 봐요.','Then see you tomorrow.','Natural closing.'],['조심히 가세요.','Get home safely.','Goodbye.']], '봐요 here means “see.” It is a friendly polite goodbye.']
];

function patternEntry(seed, index) {
  const [hangul, romanization, english, usableWith, tabs, formNote, usage, examples, mistakes = []] = seed;
  const id = `pattern-${String(index + 1).padStart(3, '0')}`;
  const guide = patternStudyGuides[id];
  const entry = {
    id,
    sort: 2000 + index + 1,
    type: 'pattern',
    level: index < 16 ? 'A1' : 'A2',
    topic: ['daily-life'],
    hangul,
    romanization,
    english,
    partOfSpeech: 'pattern',
    irregular: null,
    shortExplanation: `${hangul} means "${english}" as a reusable Korean sentence pattern.`,
    explanation: patternExplanation(index, hangul, romanization, english, usage, formNote),
    learnerPriority: `First memorize two complete polite examples. Then substitute one word at a time and check whether the pattern attaches to a noun, verb, or adjective.`,
    contextHint: guide?.whenToUse || formNote,
    patternInfo: {
      meaning: english,
      usableWith,
      formNote,
      speechLevelTabs: { casual: tabs[0], polite: tabs[1], formal: tabs[2] }
    },
    studyGuide: guide,
    relatedWordIds: guide?.linkedWordIds || [],
    relatedPatternIds: guide?.relatedPatternIds || [],
    usagePhrases: usage.map(([ko, en, note]) => phrase(ko, en, note)),
    examples: examples.map(([ko, en, note]) => phrase(ko, en, note)),
    nuance: formNote,
    commonMistakes: [
      ...mistakes,
      /[VN]/.test(hangul)
        ? 'Do not say the study symbol V or N out loud; replace it with a real verb stem or noun.'
        : 'Memorize two complete examples before trying to create new sentences from this pattern.',
      'Check whether the pattern attaches to a noun, verb, or adjective before using it.'
    ],
    notes: []
  };
  entry.lesson = makePatternLesson(entry, guide);
  return entry;
}

const patternSeeds = [
  ['N이에요 / 예요','N-ieyo / yeyo','to be / am / is / are',['noun'],['N이야 / 야','N이에요 / 예요','N입니다'],'Use 이에요 after a final consonant and 예요 after a vowel.',[['학생이에요','I am a student.','Consonant ending.'],['친구예요','It is a friend.','Vowel ending.'],['저는 하나예요','I am Hana.','Name.'],['회사원입니다','I am an office worker.','Formal.']], [['저는 학생이에요.','I am a student.','Introduction.'],['여기는 학교예요.','This place is a school.','Place.'],['제 이름은 하나입니다.','My name is Hana.','Formal.']]],
  ['N이/가 있어요','N-i/ga isseoyo','there is / have',['noun'],['N이/가 있어','N이/가 있어요','N이/가 있습니다'],'Use for existence or possession. 이 follows consonants; 가 follows vowels.',[['시간이 있어요','I have time.','Common.'],['물이 있어요','There is water.','Existence.'],['친구가 있어요','I have a friend.','Possession.'],['예약이 있어요','I have a reservation.','Travel.']], [['시간이 있어요.','I have time.','Possession.'],['여기 화장실이 있어요?','Is there a bathroom here?','Question.'],['예약이 있습니다.','I have a reservation.','Formal.']]],
  ['N이/가 없어요','N-i/ga eopseoyo','there is not / do not have',['noun'],['N이/가 없어','N이/가 없어요','N이/가 없습니다'],'Use for absence or not having something.',[['시간이 없어요','I do not have time.','Common.'],['돈이 없어요','I do not have money.','Possession.'],['예약이 없어요','I do not have a reservation.','Travel.'],['문제가 없어요','There is no problem.','Reassurance.']], [['시간이 없어요.','I do not have time.','Common.'],['여기 물이 없어요.','There is no water here.','Existence.'],['문제가 없습니다.','There is no problem.','Formal.']]],
  ['N 주세요','N juseyo','please give me N',['noun'],['N 줘','N 주세요','N 주십시오'],'Use for ordering or asking for an item. Add 좀 when you want the request to sound a little softer.',[['물 주세요','Water, please.','Restaurant.'],['이거 주세요','This one, please.','Shopping.'],['영수증 주세요','Receipt, please.','Shopping.'],['메뉴 주세요','Menu, please.','Restaurant.']], [['물 주세요.','Water, please.','Basic.'],['이거 하나 주세요.','One of these, please.','Quantity.'],['영수증 주세요.','Receipt, please.','Shopping.']]],
  ['V고 싶어요','V-go sipeoyo','want to do',['verb'],['V고 싶어','V고 싶어요','V고 싶습니다'],'Attach 고 싶어요 to a verb stem to say what you want to do.',[['먹고 싶어요','I want to eat.','Food.'],['가고 싶어요','I want to go.','Travel.'],['쉬고 싶어요','I want to rest.','Health.'],['한국어를 배우고 싶어요','I want to learn Korean.','Learning.']], [['커피를 마시고 싶어요.','I want to drink coffee.','Desire.'],['집에 가고 싶어요.','I want to go home.','Travel.'],['오늘은 쉬고 싶어요.','I want to rest today.','Health.']]],
  ['V고 싶지 않아요','V-go sipji anayo','do not want to do',['verb'],['V고 싶지 않아','V고 싶지 않아요','V고 싶지 않습니다'],'Negative desire. Softer than saying 싫어요 in many situations.',[['먹고 싶지 않아요','I do not want to eat.','Food.'],['가고 싶지 않아요','I do not want to go.','Travel.'],['말하고 싶지 않아요','I do not want to speak.','Boundary.'],['기다리고 싶지 않아요','I do not want to wait.','Feeling.']], [['지금은 먹고 싶지 않아요.','I do not want to eat right now.','Soft refusal.'],['오늘은 가고 싶지 않아요.','I do not want to go today.','Feeling.'],['그 이야기는 하고 싶지 않아요.','I do not want to talk about that.','Boundary.']]],
  ['Vㄹ/을 수 있어요','V-l/eul su isseoyo','can do',['verb'],['Vㄹ/을 수 있어','Vㄹ/을 수 있어요','Vㄹ/을 수 있습니다'],'Use for ability or possibility. The final sound decides ㄹ 수 있어요 after vowels and 을 수 있어요 after consonants.',[['갈 수 있어요','I can go.','ㄹ after vowel.'],['먹을 수 있어요','I can eat.','을 after consonant.'],['한국어를 읽을 수 있어요','I can read Korean.','Ability.'],['카드로 살 수 있어요','I can buy it by card.','Shopping.']], [['저는 한글을 읽을 수 있어요.','I can read Hangul.','Ability.'],['오늘 갈 수 있어요.','I can go today.','Schedule.'],['카드로 살 수 있어요?','Can I buy it by card?','Question.']]],
  ['못 + verb','mot + verb','cannot / be unable to',['verb'],['못 가 / 못 해','못 가요 / 못 해요','못 갑니다 / 못 합니다'],'For most verbs, put 못 before the normal verb form: 가요 becomes 못 가요. For 하다 verbs, use 못 해요 or noun 못 해요. Never make forms like 못 가해요.',[['못 가요','I cannot go.','Schedule.'],['못 먹어요','I cannot eat.','Food restriction.'],['말 못 해요','I cannot speak.','Language.'],['예약 못 해요','I cannot reserve.','Booking.']], [['오늘은 못 가요.','I cannot go today.','Schedule.'],['매운 음식은 못 먹어요.','I cannot eat spicy food.','Restriction.'],['한국어를 잘 못해요.','I cannot speak Korean well.','Learner phrase.']], ['Do not attach 해요 to every verb. Say 못 가요, not 못 가해요.']],
  ['안 V해요','an V-haeyo','do not do / am not doing',['verb','adjective'],['안 V해','안 V해요','안 V합니다'],'Short negative. With noun + 하다 verbs, the 안 often goes between the noun and 하다.',[['안 가요','I am not going.','Simple.'],['안 먹어요','I do not eat.','Food.'],['공부 안 해요','I do not study.','Noun + 하다.'],['일 안 해요','I do not work.','Noun + 하다.']], [['오늘은 안 가요.','I am not going today.','Simple.'],['저는 고기를 안 먹어요.','I do not eat meat.','Food.'],['주말에는 일 안 해요.','I do not work on weekends.','Routine.']]],
  ['V지 않아요','V-ji anayo','do not / is not',['verb','adjective'],['V지 않아','V지 않아요','V지 않습니다'],'Longer negative. It sounds a little more careful or written than 안.',[['가지 않아요','do not go.','Verb.'],['먹지 않아요','do not eat.','Verb.'],['비싸지 않아요','is not expensive.','Adjective.'],['어렵지 않아요','is not difficult.','Adjective.']], [['저는 오늘 가지 않아요.','I am not going today.','Careful negative.'],['이 음식은 맵지 않아요.','This food is not spicy.','Adjective.'],['한국어는 쉽지 않지만 재미있어요.','Korean is not easy, but it is fun.','Contrast.']]],
  ['V아/어야 해요','V-a/eoya haeyo','have to / must',['verb'],['V아/어야 해','V아/어야 해요','V아/어야 합니다'],'Use for obligation or necessary action. It can describe rules, plans, health needs, or things you personally must do.',[['가야 해요','I have to go.','Common.'],['먹어야 해요','I have to eat.','Health/routine.'],['공부해야 해요','I have to study.','School.'],['예약해야 해요','I have to reserve.','Travel.']], [['내일 일찍 가야 해요.','I have to go early tomorrow.','Obligation.'],['약을 먹어야 해요.','I have to take medicine.','Health.'],['시험이 있어서 공부해야 해요.','I have a test, so I have to study.','Reason.']]],
  ['V지 않아도 돼요','V-ji anado dwaeyo','do not have to do',['verb'],['V지 않아도 돼','V지 않아도 돼요','V지 않아도 됩니다'],'Use to say something is not necessary. It sounds like permission or relief, not like refusing to do something.',[['가지 않아도 돼요','You do not have to go.','Permission.'],['기다리지 않아도 돼요','You do not have to wait.','Service.'],['예약하지 않아도 돼요','You do not need to reserve.','Travel.'],['공부하지 않아도 돼요','You do not have to study.','School.']], [['오늘은 가지 않아도 돼요.','You do not have to go today.','Permission.'],['여기서 기다리지 않아도 돼요.','You do not have to wait here.','Service.'],['예약하지 않아도 돼요.','You do not need to make a reservation.','Travel.']]],
  ['V아/어도 돼요?','V-a/eodo dwaeyo','may I / is it okay to do?',['verb'],['V아/어도 돼?','V아/어도 돼요?','V아/어도 됩니까?'],'Ask permission politely. Use a place or object before it when the situation needs to be clear.',[['앉아도 돼요?','May I sit?','Permission.'],['사진 찍어도 돼요?','May I take a photo?','Travel.'],['들어가도 돼요?','May I go in?','Place.'],['카드 써도 돼요?','May I use a card?','Payment.']], [['여기 앉아도 돼요?','May I sit here?','Permission.'],['사진 찍어도 돼요?','May I take a photo?','Travel.'],['카드 써도 돼요?','Can I use a card?','Payment.']]],
  ['V지 마세요','V-ji maseyo','please do not do',['verb'],['V지 마','V지 마세요','V지 마십시오'],'Polite prohibition or warning. It can appear on signs, from staff, or as a gentle request between people.',[['가지 마세요','Please do not go.','Warning.'],['사진 찍지 마세요','Please do not take photos.','Rule.'],['문 열지 마세요','Please do not open the door.','Rule.'],['걱정하지 마세요','Please do not worry.','Reassurance.']], [['여기서 사진 찍지 마세요.','Please do not take photos here.','Rule.'],['아직 가지 마세요.','Please do not go yet.','Request.'],['걱정하지 마세요.','Please do not worry.','Reassurance.']]],
  ['V아/어 주세요','V-a/eo juseyo','please do',['verb'],['V아/어 줘','V아/어 주세요','V아/어 주십시오'],'Polite request for someone to do an action.',[['도와주세요','Please help me.','Survival.'],['열어 주세요','Please open it.','Request.'],['다시 말해 주세요','Please say it again.','Learning.'],['사진 찍어 주세요','Please take a photo.','Travel.']], [['문을 열어 주세요.','Please open the door.','Request.'],['다시 말해 주세요.','Please say it again.','Classroom.'],['사진 찍어 주세요.','Please take a photo.','Travel.']]],
  ['Vㄹ/을까요?','V-l/eulkkayo','shall we / should I?',['verb'],['Vㄹ/을까?','Vㄹ/을까요?','Vㄹ/을까요?'],'Use for suggestions or asking what to do.',[['갈까요?','Shall we go?','Suggestion.'],['먹을까요?','Shall we eat?','Suggestion.'],['기다릴까요?','Should I wait?','Ask what to do.'],['주문할까요?','Shall we order?','Restaurant.']], [['같이 갈까요?','Shall we go together?','Suggestion.'],['지금 주문할까요?','Shall we order now?','Restaurant.'],['여기서 기다릴까요?','Should I wait here?','Question.']]],
  ['Vㄹ/을게요','V-l/eulgeyo','I will do',['verb'],['Vㄹ/을게','Vㄹ/을게요','V겠습니다'],'Speaker’s promise or decision. Use it when you choose what you will do in response to the situation.',[['갈게요','I will go.','Leaving.'],['제가 할게요','I will do it.','Offer.'],['전화할게요','I will call.','Promise.'],['기다릴게요','I will wait.','Promise.']], [['먼저 갈게요.','I will go first.','Leaving.'],['제가 할게요.','I will do it.','Offer.'],['나중에 전화할게요.','I will call later.','Promise.']]],
  ['V아서/어서','V-aseo/eoseo','because / so',['verb','adjective'],['V아서/어서','V아서/어서요','V아서/어서입니다'],'Connect a reason to a result. Do not use it for commands or suggestions in formal grammar.',[['바빠서 못 가요','I am busy, so I cannot go.','Reason.'],['아파서 쉬어요','I am sick, so I rest.','Health.'],['비싸서 안 사요','It is expensive, so I am not buying it.','Shopping.'],['늦어서 죄송합니다','Sorry I am late.','Apology.']], [['바빠서 못 가요.','I am busy, so I cannot go.','Reason.'],['아파서 병원에 가요.','I am sick, so I go to the hospital.','Reason.'],['늦어서 죄송합니다.','Sorry I am late.','Apology.']]],
  ['V고','V-go','and / and then',['verb','adjective'],['V고','V고요','V고'],'Connect actions or descriptions. It can simply list two ideas, or show one action followed by another.',[['먹고 가요','eat and go.','Sequence.'],['공부하고 일해요','study and work.','Two actions.'],['싸고 좋아요','It is cheap and good.','Two descriptions.'],['씻고 자요','wash and sleep.','Routine.']], [['밥을 먹고 학교에 가요.','I eat and go to school.','Sequence.'],['저는 공부하고 일해요.','I study and work.','Two actions.'],['이 가방은 싸고 좋아요.','This bag is cheap and good.','Descriptions.']]],
  ['V면','V-myeon','if / when',['verb','adjective'],['V면','V면요','V면'],'Set a condition. Beginners can read it as “if,” while context sometimes makes it closer to “when.”',[['시간이 있으면','if you have time.','Condition.'],['비싸면 안 사요','If it is expensive, I do not buy it.','Shopping.'],['아프면 쉬세요','If you are sick, rest.','Advice.'],['괜찮으면 가요','If it is okay, let us go.','Suggestion.']], [['시간이 있으면 전화해 주세요.','If you have time, please call.','Condition.'],['비싸면 안 사요.','If it is expensive, I do not buy it.','Shopping.'],['아프면 쉬어야 해요.','If you are sick, you should rest.','Advice.']]]
];

function expressionPatternLinks(entry) {
  const text = [entry.hangul, ...(entry.usagePhrases || []).map(p => p.ko), ...(entry.examples || []).map(p => p.ko)].join(' ');
  const links = [];
  if (/주세요|해 주세요|말해 주세요|도와주세요|찍어 주세요/.test(text)) links.push('pattern-015');
  if (/ 주세요|물 주세요|이거 주세요|영수증 주세요|메뉴 주세요/.test(text)) links.push('pattern-004');
  if (/도 돼요/.test(text)) links.push('pattern-013');
  if (/지 마세요/.test(text)) links.push('pattern-014');
  if (/할 수 있어요|할 수/.test(text)) links.push('pattern-007');
  if (/못해요|못 해요|못 들었어요|잘 못/.test(text)) links.push('pattern-008');
  if (/아야 해요|어야 해요|해야 해요/.test(text)) links.push('pattern-011');
  if (/했어요/.test(text)) links.push('pattern-017');
  return [...new Set(links)];
}

function readOptionalScriptJson(path, fallback) {
  try {
    return JSON.parse(readFileSync(new URL(path, import.meta.url), 'utf8'));
  } catch (error) {
    if (error?.code === 'ENOENT') return fallback;
    throw error;
  }
}

function checklistItems(checklist) {
  return (checklist.categories || [])
    .flatMap((category) => (category.items || []).map((item) => String(item).trim()))
    .filter(Boolean);
}

const a1Checklist = readOptionalScriptJson('./level-audit/a1-checklist.json', { categories: [] });
const a1ChecklistSet = new Set(checklistItems(a1Checklist));
const verbLevelReview = readOptionalScriptJson('./level-audit/verb-levels.json', { a1Core: [], b1Candidates: [], defaultLevel: 'A2' });
const verbA1Set = new Set(verbLevelReview.a1Core || []);
const verbB1Set = new Set(verbLevelReview.b1Candidates || []);
const levelReviewWarnings = [];

function applyReviewedLevel(entry, source = '') {
  if (!entry) return;
  if (entry.partOfSpeech === 'verb') {
    if (verbA1Set.has(entry.hangul)) entry.level = 'A1';
    else {
      entry.level = verbLevelReview.defaultLevel || 'A2';
      if (verbB1Set.has(entry.hangul)) entry.levelCandidate = 'B1';
    }
    return;
  }
  if (a1ChecklistSet.has(entry.hangul)) {
    entry.level = 'A1';
    return;
  }
  if (!entry.level) {
    entry.level = 'A2';
    levelReviewWarnings.push(`${source || entry.id || 'entry'}:${entry.hangul}`);
  }
}

const words = [
  ...verbSeeds.map(verbEntry),
  ...generalWordSeeds.map(generalWordEntry)
];
const expressions = expressionSeeds.map(expressionEntry).map(entry => ({
  ...entry,
  relatedPatternIds: expressionPatternLinks(entry)
}));
const patterns = patternSeeds.map(patternEntry);

// Extended content authored in src files (agents write these): grows the core sets
// through the same entry builders, with ids continuing after the curated seeds.
function loadSeedDir(dir) {
  const url = new URL(`./${dir}/`, import.meta.url);
  try {
    return readdirSync(url).filter(f => f.endsWith('.json')).sort()
      .flatMap(f => { const a = JSON.parse(readFileSync(new URL(f, url), 'utf8')); return Array.isArray(a) ? a : []; });
  } catch { return []; }
}
loadSeedDir('verb-src').forEach((o, i) => {
  const forms = formKeys.map(k => o.forms?.[k]);
  const rom = o.romanization || romanizeKorean(o.hangul);
  const seed = [o.hangul, rom, o.english, o.topic, forms, o.usage, o.examples, o.nuance, o.mistakes || [], o.irregular || null];
  const e = verbEntry(seed, verbSeeds.length + i);
  if (o.structuredNuance) e.structuredNuance = o.structuredNuance;
  words.push(e);
});
loadSeedDir('expr-src').forEach((o, i) => {
  const rom = o.romanization || romanizeKorean(o.hangul);
  const seed = [o.hangul, rom, o.english, o.topic, o.usage, o.examples, o.nuance, o.mistakes || []];
  const e = expressionEntry(seed, expressionSeeds.length + i);
  e.relatedPatternIds = expressionPatternLinks(e);
  if (o.structuredNuance) e.structuredNuance = o.structuredNuance;
  expressions.push(e);
});
loadSeedDir('pattern-src').forEach((o, i) => {
  const seed = [o.hangul, o.romanization, o.english, o.usableWith || ['verb'], [o.tabs?.casual, o.tabs?.polite, o.tabs?.formal], o.formNote, o.usage, o.examples, o.mistakes || []];
  const e = patternEntry(seed, patternSeeds.length + i);
  if (o.structuredNuance) e.structuredNuance = o.structuredNuance;
  patterns.push(e);
});

const newcomerVocab = newcomerSeeds.map((seed, index) => {
  const entry = generalWordEntry(seed, index);
  entry.id = `word-newcomer-${String(index + 1).padStart(3, '0')}`;
  entry.sort = 500 + index + 1;
  entry.level = 'A1';
  entry.category = 'newcomer';
  return entry;
});

// Extended themed vocabulary: hand-authored seed objects in scripts/vocab-src/*.json,
// built through the same generalWordEntry quality machinery. Kept separate from the
// core 80/30/20 so coverage can grow without breaking those invariants.
function loadExtendedSeeds() {
  const dir = new URL('./vocab-src/', import.meta.url);
  let files = [];
  try { files = readdirSync(dir).filter(f => f.endsWith('.json')).sort(); } catch { return []; }
  return files.flatMap(file => {
    const arr = JSON.parse(readFileSync(new URL(file, dir), 'utf8'));
    return Array.isArray(arr) ? arr : [];
  });
}
const extendedVocab = loadExtendedSeeds().map((o, index) => {
  const seed = [o.kind || 'noun', o.hangul, o.english, o.topic || 'daily-life', o.chapterIds || [], o.grammarIds || [], o.usage || [], o.examples || [], o.nuance || '', o.mistakes || []];
  const entry = generalWordEntry(seed, index);
  entry.id = `word-ext-${String(index + 1).padStart(3, '0')}`;
  entry.sort = 700 + index + 1;
  entry.level = o.level || null;
  entry.category = 'extended';
  if (o.structuredNuance) entry.structuredNuance = o.structuredNuance;
  return entry;
});

for (const [section, list] of [
  ['words', words],
  ['expressions', expressions],
  ['patterns', patterns],
  ['newcomerVocab', newcomerVocab],
  ['extendedVocab', extendedVocab]
]) {
  for (const entry of list) applyReviewedLevel(entry, section);
}

if (levelReviewWarnings.length) {
  console.warn(
    `Level review warning: ${levelReviewWarnings.length} generated entries had no explicit source level; ` +
    `applied reviewed fallback. First items: ${levelReviewWarnings.slice(0, 24).join(', ')}`
  );
}

if (existsSync(new URL('./id-manifest.json', import.meta.url))) {
  const idManifest = loadIdManifest();
  activeIdManifest = idManifest;
  let idManifestChanged = false;
  for (const [section, list] of [
    ['words', words],
    ['expressions', expressions],
    ['patterns', patterns],
    ['newcomerVocab', newcomerVocab],
    ['extendedVocab', extendedVocab]
  ]) {
    const result = applyStableIds(section, list, idManifest);
    idManifestChanged = idManifestChanged || result.changed;
  }
  if (idManifestChanged) pendingIdManifest = idManifest;
}

function addTextbookLinks(entries) {
  const course = readDataInput('course.json', { chapters: [] });
  const activities = readDataInput('activities.json', { chapterActivities: [] });
  const activityByChapter = new Map((activities.chapterActivities || []).map(group => [
    group.chapterId,
    [...new Set((group.items || []).map(item => item.type))]
  ]));
  for (const entry of entries) {
    const chapterIds = [...(entry.chapterIds || [])];
    const grammarIds = [...(entry.grammarIds || [])];
    const activityTags = [...(entry.activityTags || [])];
    for (const chapter of course.chapters || []) {
      const linked = new Set([...(chapter.linkedEntryIds || []), ...(chapter.coreVocabularyIds || []), ...(chapter.patternIds || [])]);
      if (!linked.has(entry.id)) continue;
      chapterIds.push(chapter.id);
      grammarIds.push(...(chapter.grammarFocus || []));
      activityTags.push(...(activityByChapter.get(chapter.id) || []));
    }
    entry.chapterIds = [...new Set(chapterIds)];
    entry.grammarIds = [...new Set(grammarIds)];
    entry.activityTags = [...new Set(activityTags)];
  }
}

addTextbookLinks([...words, ...expressions, ...patterns, ...newcomerVocab, ...extendedVocab]);

// Ensure every entry is linked to at least one chapter (extended verbs/expressions/patterns
// are not referenced in course.json, so fall back to a topic-appropriate chapter).
const TOPIC_CHAPTER = {
  food: 'chapter-07', transportation: 'chapter-10', shopping: 'chapter-07', school: 'chapter-10',
  work: 'chapter-06', home: 'chapter-06', health: 'chapter-08', travel: 'chapter-10', 'daily-life': 'chapter-02'
};
for (const entry of [...words, ...expressions, ...patterns, ...newcomerVocab, ...extendedVocab]) {
  if (!Array.isArray(entry.grammarIds)) entry.grammarIds = [];
  if (!Array.isArray(entry.activityTags)) entry.activityTags = [];
  if (!Array.isArray(entry.chapterIds) || !entry.chapterIds.length) {
    entry.chapterIds = [TOPIC_CHAPTER[entry.topic?.[0]] || 'chapter-02'];
  }
}

function validateContent() {
  const errors = [];
  const all = [...words, ...expressions, ...patterns];
  if (words.length < 80) errors.push(`Expected 80+ words, got ${words.length}`);
  if (expressions.length < 30) errors.push(`Expected 30+ expressions, got ${expressions.length}`);
  if (patterns.length < 20) errors.push(`Expected 20+ patterns, got ${patterns.length}`);
  for (const entry of all) {
    if (!entry.explanation || entry.explanation.length < 120) errors.push(`${entry.id}: explanation too short`);
    if (!Array.isArray(entry.usagePhrases) || entry.usagePhrases.length < 4) errors.push(`${entry.id}: needs 4+ usage phrases`);
    if (!Array.isArray(entry.examples) || entry.examples.length < 3) errors.push(`${entry.id}: needs 3+ examples`);
    if (!entry.nuance || entry.nuance.length < 40) errors.push(`${entry.id}: nuance too short`);
    if (!Array.isArray(entry.commonMistakes) || entry.commonMistakes.length < 2) errors.push(`${entry.id}: needs mistakes`);
    if (!entry.lesson?.canDo || !entry.lesson?.miniDialogue?.length || !entry.lesson?.drills?.length) {
      errors.push(`${entry.id}: missing textbook-style lesson block`);
    }
    if (!Array.isArray(entry.chapterIds)) errors.push(`${entry.id}: missing chapterIds`);
    if (!Array.isArray(entry.grammarIds)) errors.push(`${entry.id}: missing grammarIds`);
    if (!Array.isArray(entry.activityTags)) errors.push(`${entry.id}: missing activityTags`);
    if (entry.partOfSpeech === 'verb') {
      for (const key of formKeys) if (!entry.forms?.[key]) errors.push(`${entry.id}: missing ${key}`);
    }
    if (entry.type === 'pattern' && !entry.patternInfo?.speechLevelTabs?.polite) {
      errors.push(`${entry.id}: missing speech tabs`);
    }
    if (entry.type === 'pattern' && entry.studyGuide && !entry.studyGuide.howToBuild?.length) {
      errors.push(`${entry.id}: missing study guide`);
    }
  }
  if (errors.length) throw new Error(errors.join('\n'));
}

validateContent();

writeFileSync(new URL('words.json', outDir), JSON.stringify({ entries: words }, null, 2));
writeFileSync(new URL('expressions.json', outDir), JSON.stringify({ entries: expressions }, null, 2));
writeFileSync(new URL('patterns.json', outDir), JSON.stringify({ entries: patterns }, null, 2));
writeFileSync(new URL('newcomer-vocab.json', outDir), JSON.stringify({ entries: newcomerVocab }, null, 2));
writeFileSync(new URL('vocab-extended.json', outDir), JSON.stringify({ entries: extendedVocab }, null, 2));

// Assemble the Newcomer Guide from per-track source files and add romanization to every Korean line.
function romanizeLine(item) {
  const { ko, romanization, ...rest } = item;
  return { ko, romanization: romanization || romanizeKorean(ko), ...rest };
}
const guideTracks = readdirSync(new URL('./guide-src/', import.meta.url))
  .filter(file => file.endsWith('.json'))
  .sort()
  .map(file => JSON.parse(readFileSync(new URL(`./guide-src/${file}`, import.meta.url), 'utf8')));
for (const track of guideTracks) {
  for (const unit of track.units || []) {
    unit.keyPhrases = (unit.keyPhrases || []).map(romanizeLine);
    unit.dialogue = (unit.dialogue || []).map(romanizeLine);
    if (unit.drills) unit.drills = unit.drills.map(romanizeLine);
  }
}
writeFileSync(new URL('guide.json', outDir), `${JSON.stringify({ tracks: guideTracks }, null, 2)}\n`, 'utf8');

// Assemble situational roleplay dialogues from scripts/dialogue-src/*.json (each = array of dialogue objects).
const dialogues = [];
try {
  const ddir = new URL('./dialogue-src/', import.meta.url);
  for (const file of readdirSync(ddir).filter(f => f.endsWith('.json')).sort()) {
    const arr = JSON.parse(readFileSync(new URL(file, ddir), 'utf8'));
    for (const d of (Array.isArray(arr) ? arr : [])) {
      d.lines = (d.lines || []).map(romanizeLine);
      dialogues.push(d);
    }
  }
} catch { /* no dialogue-src dir yet */ }
writeFileSync(new URL('dialogues.json', outDir), `${JSON.stringify({ dialogues }, null, 2)}\n`, 'utf8');

// Assemble casual conversation-practice scenarios from scripts/convo-src/*.json.
// Each scenario has turns: partner lines ({role:'partner',ko,en}) and your turns
// ({role:'you',prompt,choices:[{ko,en,correct,feedback}]}). Romanize every Korean line.
const conversations = [];
try {
  const cdir = new URL('./convo-src/', import.meta.url);
  for (const file of readdirSync(cdir).filter(f => f.endsWith('.json')).sort()) {
    const arr = JSON.parse(readFileSync(new URL(file, cdir), 'utf8'));
    for (const c of (Array.isArray(arr) ? arr : [])) {
      c.turns = (c.turns || []).map((t) =>
        (t.role === 'you' && Array.isArray(t.choices))
          ? { ...t, choices: t.choices.map(romanizeLine) }
          : romanizeLine(t)
      );
      conversations.push(c);
    }
  }
} catch { /* no convo-src dir yet */ }
writeFileSync(new URL('conversations.json', outDir), `${JSON.stringify({ conversations }, null, 2)}\n`, 'utf8');

// Re-romanize Korean in grammar.json with the fixed romanizer so all examples
// (including hand-added grammar cards) stay correct and consistent.
{
  const grammarPath = new URL('grammar.json', outDir);
  const grammar = readDataInput('grammar.json', { grammarItems: [], endingItems: [] });
  grammar.grammarItems = grammar.grammarItems || [];
  grammar.endingItems = grammar.endingItems || [];
  // Merge hand-authored grammar cards from scripts/grammar-src/*.json (idempotent by id).
  try {
    const gdir = new URL('./grammar-src/', import.meta.url);
    const seen = new Set([...grammar.grammarItems, ...grammar.endingItems].map(it => it.id));
    for (const file of readdirSync(gdir).filter(f => f.endsWith('.json')).sort()) {
      for (const card of JSON.parse(readFileSync(new URL(file, gdir), 'utf8'))) {
        if (card && card.id && !seen.has(card.id)) { grammar.endingItems.push(card); seen.add(card.id); }
      }
    }
  } catch { /* no grammar-src dir */ }
  const fix = item => { if (item && item.ko) item.romanization = romanizeKorean(item.ko); };
  for (const it of [...grammar.grammarItems, ...grammar.endingItems]) {
    (it.examples || []).forEach(fix);
    (it.miniDialogue || []).forEach(fix);
  }
  writeFileSync(grammarPath, `${JSON.stringify(grammar, null, 2)}\n`, 'utf8');
}

function readDataFile(name, fallback) {
  return readDataInput(name, fallback);
}

const integrity = verifyDataDir(outDir, {
  idManifest: activeIdManifest,
  skipSupportFiles: true,
  skipDerivedArtifacts: true,
  allowEntryAdditions: generatorOptions.acceptManifestAdditions
});
if (!integrity.ok) {
  throw new Error(`Data integrity check failed:\n${integrity.errors.join('\n')}`);
}
for (const warning of integrity.warnings) {
  if (!warning.includes('data-manifest.json not found')) console.warn(`Data integrity warning: ${warning}`);
}
if (pendingIdManifest) writeIdManifest(pendingIdManifest);

const bundle = {
  words: { entries: words },
  newcomerVocab: { entries: newcomerVocab },
  extendedVocab: { entries: extendedVocab },
  expressions: { entries: expressions },
  patterns: { entries: patterns },
  course: readDataFile('course.json', { chapters: [] }),
  grammar: readDataFile('grammar.json', { grammarItems: [], endingItems: [] }),
  activities: readDataFile('activities.json', { chapterActivities: [] }),
  guide: readDataFile('guide.json', { tracks: [] }),
  dialogues: readDataFile('dialogues.json', { dialogues: [] })
};

writeFileSync(new URL('data-bundle.js', outDir), `window.KOREAN_CORE_DATA = ${JSON.stringify(bundle)};\n`, 'utf8');
publishGeneratedFiles();
cleanupStaging();

console.log(`Generated curated Korean starter set: ${words.length + expressions.length + patterns.length} entries.`);
