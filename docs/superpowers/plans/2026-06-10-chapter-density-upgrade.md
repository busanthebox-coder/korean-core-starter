# Chapter Density Upgrade (Pilot: Chapter 6) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make Chapter 6 (에/에서) a complete 40-minute self-study unit with hook, deep grammar notes, 15–20 vocab in context, annotated dialogue, reading text, cultural note, inline exercises, and summary card.

**Architecture:** Generate rich JSON content for chapter 6 via a Workflow agent → write to `scripts/rich-chapters/chapter-06.json` → merge into `build-app-data.mjs` → render new sections in a new `RichChapterSections.svelte` component → import in `Learn.svelte` alongside existing sections.

**Tech Stack:** Svelte 4, Vite, Node.js ESM scripts, Vitest, Anthropic Claude Sonnet (via Workflow tool for content generation)

---

## File Map

| File | Action | Purpose |
|---|---|---|
| `scripts/rich-chapters/chapter-06.json` | CREATE | Generated rich content for chapter 6 |
| `scripts/build-app-data.mjs` | MODIFY | Merge rich chapters into app-data output |
| `src/lib/components/RichChapterSections.svelte` | CREATE | Renders all 8 new sections with inline exercise state |
| `src/routes/Learn.svelte` | MODIFY | Import + render RichChapterSections after existing sections |

---

## Task 1: Generate rich chapter 6 content

**Files:**
- Create: `scripts/rich-chapters/chapter-06.json`

- [ ] **Step 1: Create the rich-chapters directory**

```bash
mkdir -p scripts/rich-chapters
```

- [ ] **Step 2: Run Workflow to generate chapter-06.json**

Use the Workflow tool with this script (inline, single agent):

```js
export const meta = {
  name: 'enrich-chapter-06',
  description: 'Generate rich Chapter 6 content for Korean learning app',
  phases: [{ title: 'Generate' }]
}

phase('Generate')
const content = await agent(`
You are writing content for a Korean language learning app. Generate a complete rich chapter for Chapter 6: 에 vs 에서 (Korean location particles).

The target learner is a native English speaker (American or British) who is a complete beginner. Write so they genuinely understand — not just "에 is for destination" but WHY, with contrast, examples, pitfalls.

Return ONLY valid JSON (no markdown, no explanation outside the JSON). The JSON must exactly match this schema:

{
  "id": "chapter-06",
  "hook": {
    "situation": "You're trying to text your Korean friend to meet at a café — but you also want to say you'll study there. You need two different particles for two different ideas.",
    "objectives": [
      "Use 에 correctly with destination and existence verbs (가다, 오다, 있다)",
      "Use 에서 correctly when an action is happening at a place (공부하다, 일하다, 먹다)",
      "Catch and correct the most common English-speaker mistake: 학교에서 가요 ❌"
    ],
    "whyItMatters": "These two particles look almost identical but mean different things. Mixing them up won't stop Koreans from understanding you — but it immediately marks you as a beginner. Getting them right is one of the fastest ways to sound more natural."
  },
  "grammarNotes": [
    {
      "id": "gn-e",
      "title": "에 — destination, time, and existence",
      "mentalModel": "Think of 에 as a pin on a map or a clock. It marks WHERE something is pointed at (destination) or WHERE something simply sits (존재). The location is the endpoint or the address — nothing active is happening there yet.",
      "formation": "Place noun / time noun + 에 (no space)",
      "examples": [
        { "ko": "학교에 가요.", "romanization": "hakgyoe gayo.", "en": "I go to school.", "note": "가다 = movement → 에 marks the destination" },
        { "ko": "7시에 일어나요.", "romanization": "ilgopssie ireonayo.", "en": "I wake up at seven.", "note": "Time marker — 에 works on clock times" },
        { "ko": "집에 있어요.", "romanization": "jibe isseoyo.", "en": "I am at home.", "note": "있다 = existence, not action → 에, not 에서" },
        { "ko": "카페에 와요.", "romanization": "kape-e wayo.", "en": "Come to the café.", "note": "오다 = movement → destination takes 에" },
        { "ko": "회사에 도착했어요.", "romanization": "hoesa-e dochakhaesseoyo.", "en": "I arrived at the office.", "note": "도착하다 = arrival → endpoint takes 에" }
      ],
      "contrastPairs": [
        {
          "a": { "ko": "도서관에 가요.", "en": "I go to the library." },
          "b": { "ko": "도서관에서 공부해요.", "en": "I study at the library." },
          "explanation": "가다 points TO a destination (에). Once you're there and doing something active, the location becomes 에서."
        },
        {
          "a": { "ko": "집에 있어요.", "en": "I am at home. (just existing there)" },
          "b": { "ko": "집에서 요리해요.", "en": "I cook at home. (active action)" },
          "explanation": "있다 (to be/exist) takes 에 because nothing active is happening. Any busy verb takes 에서."
        }
      ],
      "englishSpeakerPitfall": {
        "wrong": "학교에서 가요.",
        "right": "학교에 가요.",
        "explanation": "English says 'I go FROM school' with 'from' — so English speakers sometimes reach for 에서 (which CAN mean 'from'). But 가다/오다 are destination verbs. The place you're going TO takes 에, always. 에서 with 가다 sounds like 'I depart from school,' which is a different sentence."
      },
      "exceptions": [
        "있다 and 없다 (exist / not exist) always take 에, never 에서: 집에 있어요 ✅ / 집에서 있어요 ❌",
        "살다 (to live) usually takes 에: 서울에 살아요. (살다 describes a state of residence, not an active event)"
      ]
    },
    {
      "id": "gn-eseo",
      "title": "에서 — action place and starting point",
      "mentalModel": "Think of 에서 as a stage. The place is where the performance is happening. Whenever a verb describes real activity — eating, studying, working, waiting, buying — the location is a stage and takes 에서. It also means FROM when showing origin/departure.",
      "formation": "Place noun + 에서 (no space)",
      "examples": [
        { "ko": "카페에서 공부해요.", "romanization": "kape-eseo gongbuhaeyo.", "en": "I study at the café.", "note": "공부하다 = active verb → stage/action location takes 에서" },
        { "ko": "회사에서 일해요.", "romanization": "hoesa-eseo ilhaeyo.", "en": "I work at the office.", "note": "일하다 = active verb → 에서" },
        { "ko": "식당에서 먹어요.", "romanization": "sikdang-eseo meogeoyo.", "en": "I eat at the restaurant.", "note": "먹다 = active verb → 에서" },
        { "ko": "서울에서 왔어요.", "romanization": "Seoul-eseo wasseoyo.", "en": "I came from Seoul.", "note": "에서 = FROM (origin/starting point)" },
        { "ko": "여기에서 기다려요.", "romanization": "yeogie-eseo gidaryeoyo.", "en": "Wait here.", "note": "기다리다 = active → 에서" }
      ],
      "contrastPairs": [
        {
          "a": { "ko": "카페에 가요.", "en": "I go to the café." },
          "b": { "ko": "카페에서 친구를 만나요.", "en": "I meet a friend at the café." },
          "explanation": "Going TO the café = 에. Once there, meeting someone (active) = 에서."
        },
        {
          "a": { "ko": "한국에서 왔어요.", "en": "I came from Korea. (origin)" },
          "b": { "ko": "한국에 가요.", "en": "I go to Korea. (destination)" },
          "explanation": "에서 for origin/departure; 에 for destination. Both use the same place noun — only the particle changes the meaning."
        }
      ],
      "englishSpeakerPitfall": {
        "wrong": "카페에 일해요.",
        "right": "카페에서 일해요.",
        "explanation": "English says 'I work AT the café' — but 'at' maps to both 에 and 에서 in Korean depending on whether there's action. 일하다 is an active verb, so it needs the stage particle 에서. Using 에 here sounds like the café is your destination, not your workplace."
      },
      "exceptions": [
        "에서 can also attach to abstract or collective nouns to mean 'from an institution': 학교에서 발표가 있어요. (There's a presentation from/at school.)"
      ]
    }
  ],
  "extendedVocabulary": [
    { "hangul": "학교", "romanization": "hakgyo", "english": "school", "partOfSpeech": "noun", "exampleSentence": { "ko": "학교에서 친구를 만났어요.", "en": "I met a friend at school.", "note": "에서 — meeting is an action" }, "collocations": ["학교에 가다", "학교에서 공부하다"] },
    { "hangul": "도서관", "romanization": "doseogwan", "english": "library", "partOfSpeech": "noun", "exampleSentence": { "ko": "도서관에서 책을 읽어요.", "en": "I read books at the library.", "note": "에서 — reading is an action" }, "collocations": ["도서관에 가다", "도서관에서 공부하다"] },
    { "hangul": "카페", "romanization": "kape", "english": "café", "partOfSpeech": "noun", "exampleSentence": { "ko": "카페에서 커피를 마셔요.", "en": "I drink coffee at the café.", "note": "에서 — drinking is an action" }, "collocations": ["카페에 가다", "카페에서 일하다"] },
    { "hangul": "회사", "romanization": "hoesa", "english": "company / office", "partOfSpeech": "noun", "exampleSentence": { "ko": "회사에서 8시간 일해요.", "en": "I work 8 hours at the office.", "note": "에서 — working is an action" }, "collocations": ["회사에 가다", "회사에서 일하다"] },
    { "hangul": "집", "romanization": "jip", "english": "home / house", "partOfSpeech": "noun", "exampleSentence": { "ko": "집에 있어요.", "en": "I am at home.", "note": "에 — 있다 = existence, not action" }, "collocations": ["집에 가다", "집에 있다", "집에서 요리하다"] },
    { "hangul": "식당", "romanization": "sikdang", "english": "restaurant", "partOfSpeech": "noun", "exampleSentence": { "ko": "식당에서 점심을 먹어요.", "en": "I eat lunch at the restaurant.", "note": "에서 — eating is an action" }, "collocations": ["식당에 가다", "식당에서 먹다"] },
    { "hangul": "병원", "romanization": "byeongwon", "english": "hospital / clinic", "partOfSpeech": "noun", "exampleSentence": { "ko": "병원에 가요.", "en": "I go to the hospital.", "note": "에 — destination (going TO)" }, "collocations": ["병원에 가다", "병원에서 기다리다"] },
    { "hangul": "공원", "romanization": "gongwon", "english": "park", "partOfSpeech": "noun", "exampleSentence": { "ko": "공원에서 산책해요.", "en": "I take a walk in the park.", "note": "에서 — walking is an action" }, "collocations": ["공원에 가다", "공원에서 운동하다"] },
    { "hangul": "가다", "romanization": "gada", "english": "to go", "partOfSpeech": "verb", "exampleSentence": { "ko": "내일 학교에 가요.", "en": "I go to school tomorrow.", "note": "에 — 가다 always takes destination 에" }, "collocations": ["N에 가다"] },
    { "hangul": "오다", "romanization": "oda", "english": "to come", "partOfSpeech": "verb", "exampleSentence": { "ko": "집에 와요.", "en": "Come home.", "note": "에 — 오다 always takes destination 에" }, "collocations": ["N에 오다"] },
    { "hangul": "있다", "romanization": "itda", "english": "to be / to exist", "partOfSpeech": "verb", "exampleSentence": { "ko": "카페에 있어요.", "en": "I am at the café.", "note": "에 — 있다 = existence, never 에서" }, "collocations": ["N에 있다"] },
    { "hangul": "공부하다", "romanization": "gongbuhada", "english": "to study", "partOfSpeech": "verb", "exampleSentence": { "ko": "도서관에서 공부해요.", "en": "I study at the library.", "note": "에서 — active verb" }, "collocations": ["N에서 공부하다"] },
    { "hangul": "일하다", "romanization": "ilhada", "english": "to work", "partOfSpeech": "verb", "exampleSentence": { "ko": "카페에서 일해요.", "en": "I work at the café.", "note": "에서 — active verb" }, "collocations": ["N에서 일하다"] },
    { "hangul": "먹다", "romanization": "meokda", "english": "to eat", "partOfSpeech": "verb", "exampleSentence": { "ko": "식당에서 밥을 먹어요.", "en": "I eat at the restaurant.", "note": "에서 — active verb" }, "collocations": ["N에서 먹다"] },
    { "hangul": "만나다", "romanization": "mannada", "english": "to meet", "partOfSpeech": "verb", "exampleSentence": { "ko": "카페에서 친구를 만나요.", "en": "I meet my friend at the café.", "note": "에서 — active verb" }, "collocations": ["N에서 만나다"] },
    { "hangul": "기다리다", "romanization": "gidarida", "english": "to wait", "partOfSpeech": "verb", "exampleSentence": { "ko": "여기에서 기다려요.", "en": "Wait here.", "note": "에서 — active verb" }, "collocations": ["N에서 기다리다"] },
    { "hangul": "운동하다", "romanization": "undonghada", "english": "to exercise", "partOfSpeech": "verb", "exampleSentence": { "ko": "공원에서 운동해요.", "en": "I exercise in the park.", "note": "에서 — active verb" }, "collocations": ["N에서 운동하다"] },
    { "hangul": "산책하다", "romanization": "sanchaekada", "english": "to take a walk", "partOfSpeech": "verb", "exampleSentence": { "ko": "한강에서 산책해요.", "en": "I take a walk along the Han River.", "note": "에서 — active verb" }, "collocations": ["N에서 산책하다"] }
  ],
  "extendedDialogue": {
    "setting": "Two coworkers texting on a Monday morning about their weekend and where to meet for lunch.",
    "lines": [
      { "speaker": "A", "ko": "주말에 뭐 했어요?", "romanization": "jumare mwo haesseoyo?", "en": "What did you do on the weekend?", "grammarNote": "주말에 — time noun takes 에 (no action, just a time point)" },
      { "speaker": "B", "ko": "토요일에 카페에서 공부했어요.", "romanization": "toyoile kape-eseo gongbuhaesseoyo.", "en": "On Saturday I studied at a café.", "grammarNote": "토요일에 (time 에) + 카페에서 (action place 에서) — both particles in one sentence" },
      { "speaker": "A", "ko": "어느 카페에 갔어요?", "romanization": "eoneu kape-e gaesseoyo?", "en": "Which café did you go to?", "grammarNote": "카페에 — 가다 = movement, so destination takes 에" },
      { "speaker": "B", "ko": "회사 근처 카페에 갔어요. 거기에서 세 시간 있었어요.", "romanization": "hoesa geuncheo kape-e gaesseoyo. geogie-eseo se sigan isseosseoyo.", "en": "I went to a café near the office. I was there for three hours.", "grammarNote": "갔어요 → 에 (destination); 거기에서 있었어요 — wait, 있다 normally takes 에, but 거기에서 here means 'staying/spending time there' which is active — both are acceptable in speech" },
      { "speaker": "A", "ko": "오늘 점심은 어디에서 먹을 거예요?", "romanization": "oneul jeomsimeun eodieseo meogeul geoyeyo?", "en": "Where will you eat lunch today?", "grammarNote": "어디에서 — question word for action location; 먹다 is active so 에서 is correct" },
      { "speaker": "B", "ko": "저는 학교 식당에서 먹을 것 같아요.", "romanization": "jeoneun hakgyo sikdang-eseo meogeul geot gatayo.", "en": "I think I'll eat at the school cafeteria.", "grammarNote": "식당에서 먹다 — eating is an action, action place 에서" },
      { "speaker": "A", "ko": "같이 가요! 식당에서 만나요.", "romanization": "gachi gayo! sikdang-eseo mannayo.", "en": "Let's go together! Meet at the cafeteria.", "grammarNote": "식당에서 만나다 — meeting is an action, 에서 correct" },
      { "speaker": "B", "ko": "좋아요. 12시에 식당 앞에서 기다릴게요.", "romanization": "johayo. yeoldusissie sikdang ape-eseo gidarilgeyo.", "en": "Sounds good. I'll wait in front of the cafeteria at noon.", "grammarNote": "12시에 (time 에) + 식당 앞에서 기다리다 (waiting = action, 에서)" }
    ]
  },
  "readingText": {
    "type": "diary",
    "title": "수진의 하루 (Sujin's Day)",
    "body": "오늘은 바쁜 하루였어요. 아침 7시에 일어났어요. 학교에 가기 전에 집에서 아침을 먹었어요. 학교에서 오전에 수업이 있었어요. 점심에는 학교 식당에서 친구를 만났어요. 오후에는 도서관에서 두 시간 공부했어요. 저녁에 집에 왔어요. 집에서 드라마를 봤어요. 내일도 학교에 가야 해요!",
    "bodyGloss": "Today was a busy day. I woke up at 7 in the morning. Before going to school, I ate breakfast at home. There were classes at school in the morning. At lunchtime, I met a friend at the school cafeteria. In the afternoon, I studied for two hours at the library. In the evening, I came home. I watched a drama at home. I have to go to school tomorrow too!",
    "comprehensionQuestions": [
      { "question": "What time did Sujin wake up?", "answer": "7시 — she woke up at 7 am (7시에 일어났어요)" },
      { "question": "Where did she eat breakfast?", "answer": "집에서 — at home (집에서 아침을 먹었어요)" },
      { "question": "Find all the 에서 in the text. Why does each one use 에서 and not 에?", "answer": "집에서 먹었어요 (eating = action), 학교에서 수업이 있었어요 (classes happening there), 식당에서 만났어요 (meeting = action), 도서관에서 공부했어요 (studying = action), 집에서 봤어요 (watching = action). All mark places where active things happen." }
    ]
  },
  "culturalNote": {
    "title": "어디에서 왔어요? — The question that's never just geography",
    "body": "When Koreans ask 어디에서 왔어요?, they're asking where you came FROM — your hometown, your country, your origin. This uses 에서 because it marks the starting point of your life journey. Compare this to 어디에 살아요? (Where do you live now?) which uses 에 because 살다 describes existence/residence, not active movement. Get this distinction right and you'll answer two of Korea's most common small-talk questions perfectly. Bonus: if someone asks 어느 나라에서 왔어요? (Which country are you from?) and you say 미국에서 왔어요, you've used 에서 correctly as an origin marker."
  },
  "inlineExercises": [
    {
      "type": "multipleChoice",
      "prompt": "학교___ 가요. (I go to school.)",
      "options": ["에", "에서"],
      "correct": "에",
      "explanation": "가다 is a movement verb pointing TO a destination. The destination takes 에. If you said 학교에서 가요, it would sound like you're departing from school — a different meaning."
    },
    {
      "type": "multipleChoice",
      "prompt": "카페___ 공부해요. (I study at the café.)",
      "options": ["에", "에서"],
      "correct": "에서",
      "explanation": "공부하다 is an active verb. The place where an action happens is a stage → 에서. 카페에 공부해요 would sound like the café is your destination, not your study spot."
    },
    {
      "type": "multipleChoice",
      "prompt": "집___ 있어요. (I am at home.)",
      "options": ["에", "에서"],
      "correct": "에",
      "explanation": "있다 (to exist/be somewhere) always takes 에. You're simply existing at that location — nothing active is happening. 집에서 있어요 is incorrect."
    },
    {
      "type": "errorCorrect",
      "prompt": "Find the mistake: 식당에서 가요.",
      "correct": "식당에 가요.",
      "explanation": "가다 = movement verb → always 에 for destination. 식당에서 가요 would mean 'I leave from the restaurant,' which is a different sentence entirely."
    },
    {
      "type": "errorCorrect",
      "prompt": "Find the mistake: 회사에 일해요.",
      "correct": "회사에서 일해요.",
      "explanation": "일하다 = active verb → needs the stage/action particle 에서. 회사에 일해요 sounds like the office is a destination you're going to, not a place where you work."
    },
    {
      "type": "translate",
      "prompt": "I eat lunch at the library.",
      "targetKo": "도서관에서 점심을 먹어요.",
      "hint": "먹다 (to eat) is an active verb. The library is the stage where eating happens → 에서."
    },
    {
      "type": "translate",
      "prompt": "I go to the park and exercise there.",
      "targetKo": "공원에 가요. 거기에서 운동해요.",
      "hint": "Going TO the park = 에 (destination). Exercising THERE = 에서 (action). Two sentences, two particles."
    }
  ],
  "summaryCard": {
    "bullets": [
      "에 = pin on a map or clock: destination (가다, 오다), time (7시에), and pure existence (있다, 없다)",
      "에서 = stage: any active verb (공부하다, 일하다, 먹다, 만나다) + 'from' as an origin marker",
      "The fastest test: is the verb just existing (있다) or moving toward something (가다/오다)? → 에. Is something actively happening? → 에서"
    ],
    "nextChapterTeaser": "Chapter 7 introduces 을/를 — the object particle. You'll learn why 한국어를 공부해요 needs 를 but 한국어가 어려워요 doesn't."
  }
}

Output ONLY the JSON above, completed and valid. No markdown fences, no explanation. Start with { and end with }.
`)

const fs = await import('node:fs/promises')
await fs.mkdir('scripts/rich-chapters', { recursive: true })
await fs.writeFile('scripts/rich-chapters/chapter-06.json', content.trim())
return { done: true, chars: content.length }
```

- [ ] **Step 3: Verify the file is valid JSON**

```bash
node -e "const d=require('./scripts/rich-chapters/chapter-06.json'); console.log('OK, keys:', Object.keys(d).join(', '))"
```

Expected output: `OK, keys: id, hook, grammarNotes, extendedVocabulary, extendedDialogue, readingText, culturalNote, inlineExercises, summaryCard`

---

## Task 2: Merge rich chapter data into build pipeline

**Files:**
- Modify: `scripts/build-app-data.mjs`

- [ ] **Step 1: Add rich chapter merge logic**

In `scripts/build-app-data.mjs`, after the existing `const dir = ...` line, add:

```js
import { readdirSync, existsSync } from 'node:fs';

// Merge rich chapter content (scripts/rich-chapters/*.json) into course chapters.
// Rich files supplement existing chapter data — they don't replace it.
const richDir = new URL('../scripts/rich-chapters/', import.meta.url);
const richChapters = new Map();
if (existsSync(richDir)) {
  for (const f of readdirSync(richDir).filter(f => f.endsWith('.json'))) {
    const rich = JSON.parse(readFileSync(new URL(f, richDir), 'utf8'));
    if (rich.id) richChapters.set(rich.id, rich);
  }
}

const mergeRichChapters = (course) => {
  if (!richChapters.size) return course;
  const chapters = (course.chapters || []).map(ch => {
    const rich = richChapters.get(ch.id);
    return rich ? { ...ch, ...rich } : ch;
  });
  return { ...course, chapters };
};
```

Then change the `course` line in the output object from:
```js
course: read('course.json'),
```
to:
```js
course: mergeRichChapters(read('course.json')),
```

- [ ] **Step 2: Rebuild and verify chapter 6 has new fields**

```bash
node scripts/build-app-data.mjs && node -e "
const d=require('./korean/data/app-data.json');
const ch6=d.course.chapters.find(c=>c.id==='chapter-06');
console.log('hook:', !!ch6.hook);
console.log('grammarNotes:', ch6.grammarNotes?.length);
console.log('extendedVocabulary:', ch6.extendedVocabulary?.length);
console.log('inlineExercises:', ch6.inlineExercises?.length);
"
```

Expected:
```
hook: true
grammarNotes: 2
extendedVocabulary: 18
inlineExercises: 7
```

- [ ] **Step 3: Run tests to confirm no regressions**

```bash
npm test 2>&1 | tail -5
```

Expected: `Tests  95 passed (95)`

- [ ] **Step 4: Commit**

```bash
git add scripts/rich-chapters/chapter-06.json scripts/build-app-data.mjs korean/data/app-data.json
git commit -m "feat: add rich chapter pipeline — chapter 06 pilot content + build merge"
```

---

## Task 3: Create RichChapterSections.svelte component

**Files:**
- Create: `src/lib/components/RichChapterSections.svelte`

This component receives a `chapter` prop and renders all 8 rich sections. It self-manages inline exercise state (selected answers, revealed explanations).

- [ ] **Step 1: Create the component**

```svelte
<!-- src/lib/components/RichChapterSections.svelte -->
<script>
  import AudioButton from './AudioButton.svelte';
  import RomanizationLine from './RomanizationLine.svelte';

  export let chapter;  // the full chapter object from app-data

  // Inline exercise state — keyed by exercise index
  let answers = {};    // index → chosen option string
  let revealed = {};   // index → boolean

  function pick(i, option) {
    if (revealed[i]) return;
    answers = { ...answers, [i]: option };
    revealed = { ...revealed, [i]: true };
  }
  function revealTranslate(i) {
    revealed = { ...revealed, [i]: true };
  }

  $: hook = chapter.hook || null;
  $: grammarNotes = chapter.grammarNotes || [];
  $: extVocab = chapter.extendedVocabulary || [];
  $: extDialogue = chapter.extendedDialogue || null;
  $: readingText = chapter.readingText || null;
  $: culturalNote = chapter.culturalNote || null;
  $: exercises = chapter.inlineExercises || [];
  $: summaryCard = chapter.summaryCard || null;
</script>

<!-- ── 1. HOOK ───────────────────────────────────────── -->
{#if hook}
  <div class="block rich-hook">
    <div class="sec-head"><span class="dot hook-dot" />Why this matters</div>
    <div class="hook-card">
      <p class="hook-situation">📍 {hook.situation}</p>
      {#if hook.whyItMatters}
        <p class="hook-why">{hook.whyItMatters}</p>
      {/if}
      {#if (hook.objectives || []).length}
        <div class="hook-goals">
          <strong>After this chapter you will:</strong>
          <ul>{#each hook.objectives as obj}<li>{obj}</li>{/each}</ul>
        </div>
      {/if}
    </div>
  </div>
{/if}

<!-- ── 2. GRAMMAR NOTES ──────────────────────────────── -->
{#each grammarNotes as gn}
  <div class="block">
    <div class="sec-head"><span class="dot g-dot" />{gn.title}</div>

    {#if gn.mentalModel}
      <div class="mental-model">
        <span class="mm-label">Mental model</span>
        <p>{gn.mentalModel}</p>
      </div>
    {/if}

    {#if gn.formation}
      <div class="formation"><code>{gn.formation}</code></div>
    {/if}

    {#if (gn.examples || []).length}
      <div class="lines">
        {#each gn.examples as ex}
          <div class="ex-row">
            <div class="ex-ko">{ex.ko} <AudioButton text={ex.ko} size={20} /></div>
            <RomanizationLine text={ex.romanization} />
            <div class="ex-en">{ex.en}</div>
            {#if ex.note}<div class="ex-note">💡 {ex.note}</div>{/if}
          </div>
        {/each}
      </div>
    {/if}

    {#if (gn.contrastPairs || []).length}
      <div class="contrast-section">
        <div class="contrast-label">Contrast pairs</div>
        {#each gn.contrastPairs as pair}
          <div class="contrast-pair">
            <div class="cp-row a"><span class="cp-tag">A</span><span>{pair.a.ko}</span><span class="cp-en">{pair.a.en}</span></div>
            <div class="cp-row b"><span class="cp-tag">B</span><span>{pair.b.ko}</span><span class="cp-en">{pair.b.en}</span></div>
            <p class="cp-explain">{pair.explanation}</p>
          </div>
        {/each}
      </div>
    {/if}

    {#if gn.englishSpeakerPitfall}
      {@const p = gn.englishSpeakerPitfall}
      <div class="pitfall">
        <div class="pitfall-label">⚠️ English speaker pitfall</div>
        <div class="pitfall-row"><span class="bad">❌</span><span class="pt-ko">{p.wrong}</span></div>
        <div class="pitfall-row"><span class="good">✅</span><span class="pt-ko">{p.right}</span></div>
        <p class="pt-explain">{p.explanation}</p>
      </div>
    {/if}

    {#if (gn.exceptions || []).length}
      <div class="exceptions">
        <div class="exc-label">Exceptions</div>
        <ul>{#each gn.exceptions as exc}<li>{exc}</li>{/each}</ul>
      </div>
    {/if}
  </div>
{/each}

<!-- ── 3. EXTENDED VOCABULARY ────────────────────────── -->
{#if extVocab.length}
  <div class="block">
    <div class="sec-head"><span class="dot v-dot" />Vocabulary in context</div>
    <div class="vocab-grid">
      {#each extVocab as v}
        <div class="vocab-card">
          <div class="vc-top">
            <span class="vc-ko">{v.hangul}</span>
            <span class="vc-pos">{v.partOfSpeech}</span>
          </div>
          <div class="vc-rom">{v.romanization}</div>
          <div class="vc-en">{v.english}</div>
          {#if v.exampleSentence}
            <div class="vc-ex">
              <span class="vc-ex-ko">{v.exampleSentence.ko}</span>
              <span class="vc-ex-en">{v.exampleSentence.en}</span>
              {#if v.exampleSentence.note}<span class="vc-ex-note">💡 {v.exampleSentence.note}</span>{/if}
            </div>
          {/if}
          {#if (v.collocations || []).length}
            <div class="vc-colls">{v.collocations.join(' · ')}</div>
          {/if}
        </div>
      {/each}
    </div>
  </div>
{/if}

<!-- ── 4. EXTENDED DIALOGUE ──────────────────────────── -->
{#if extDialogue && (extDialogue.lines || []).length}
  <div class="block">
    <div class="sec-head"><span class="dot d-dot" />Dialogue in depth</div>
    {#if extDialogue.setting}<p class="dlg-setting">📍 {extDialogue.setting}</p>{/if}
    <div class="rich-dlg">
      {#each extDialogue.lines as line}
        <div class="rdline">
          <span class="spk">{line.speaker}</span>
          <div class="rdlbody">
            <div class="rdko">{line.ko} <AudioButton text={line.ko} size={20} /></div>
            <RomanizationLine text={line.romanization} />
            <div class="rden">{line.en}</div>
            {#if line.grammarNote}<div class="rdnote">📝 {line.grammarNote}</div>{/if}
          </div>
        </div>
      {/each}
    </div>
  </div>
{/if}

<!-- ── 5. READING TEXT ───────────────────────────────── -->
{#if readingText}
  <div class="block">
    <div class="sec-head"><span class="dot r-dot" />Reading: {readingText.title}</div>
    <div class="reading-block">
      <p class="reading-body">{readingText.body}</p>
      {#if readingText.bodyGloss}
        <details class="gloss-details">
          <summary>Show translation</summary>
          <p class="gloss-body">{readingText.bodyGloss}</p>
        </details>
      {/if}
    </div>
    {#if (readingText.comprehensionQuestions || []).length}
      <div class="comp-qs">
        <div class="comp-label">Comprehension check</div>
        {#each readingText.comprehensionQuestions as q, qi}
          <div class="comp-q">
            <p class="cq-text">{qi + 1}. {q.question}</p>
            <details class="cq-details">
              <summary>Show answer</summary>
              <p class="cq-answer">{q.answer}</p>
            </details>
          </div>
        {/each}
      </div>
    {/if}
  </div>
{/if}

<!-- ── 6. CULTURAL NOTE ──────────────────────────────── -->
{#if culturalNote}
  <div class="block">
    <div class="sec-head"><span class="dot c-dot" />Cultural note</div>
    <div class="culture-card">
      <strong>{culturalNote.title}</strong>
      <p>{culturalNote.body}</p>
    </div>
  </div>
{/if}

<!-- ── 7. INLINE EXERCISES ───────────────────────────── -->
{#if exercises.length}
  <div class="block">
    <div class="sec-head"><span class="dot x-dot" />Practice — check your understanding</div>
    <div class="exercises">
      {#each exercises as ex, i}
        <div class="exercise" class:done={revealed[i]}>
          <p class="ex-prompt">{ex.prompt}</p>

          {#if ex.type === 'multipleChoice' || ex.type === 'fillBlank'}
            <div class="ex-options">
              {#each (ex.options || []) as opt}
                {@const chosen = answers[i] === opt}
                {@const isCorrect = opt === ex.correct}
                <button class="ex-opt"
                  class:correct={revealed[i] && isCorrect}
                  class:wrong={revealed[i] && chosen && !isCorrect}
                  disabled={!!revealed[i]}
                  on:click={() => pick(i, opt)}>
                  {opt}
                </button>
              {/each}
            </div>

          {:else if ex.type === 'errorCorrect'}
            {#if !revealed[i]}
              <button class="ex-reveal-btn" on:click={() => revealTranslate(i)}>Show correction</button>
            {:else}
              <div class="ex-correction">✅ {ex.correct}</div>
            {/if}

          {:else if ex.type === 'translate'}
            {#if !revealed[i]}
              <button class="ex-reveal-btn" on:click={() => revealTranslate(i)}>Show answer</button>
            {:else}
              <div class="ex-correction">✅ {ex.targetKo}</div>
              {#if ex.hint}<div class="ex-hint">💡 {ex.hint}</div>{/if}
            {/if}
          {/if}

          {#if revealed[i] && ex.explanation}
            <div class="ex-feedback">{ex.explanation}</div>
          {/if}
        </div>
      {/each}
    </div>
  </div>
{/if}

<!-- ── 8. SUMMARY CARD ────────────────────────────────── -->
{#if summaryCard}
  <div class="block summary-block">
    <div class="sec-head"><span class="dot s-dot" />Chapter summary</div>
    <div class="summary-card">
      <ul class="summary-bullets">
        {#each summaryCard.bullets as b}<li>{b}</li>{/each}
      </ul>
      {#if summaryCard.nextChapterTeaser}
        <div class="next-teaser">
          <span class="next-label">Up next →</span>
          <span>{summaryCard.nextChapterTeaser}</span>
        </div>
      {/if}
    </div>
  </div>
{/if}

<style>
  /* ── Section dots ── */
  .dot { display: inline-block; width: 14px; height: 4px; border-radius: 2px; background: var(--ink); }
  .hook-dot { background: var(--green-dark); }
  .g-dot    { background: #9b59b6; }
  .v-dot    { background: var(--green); }
  .d-dot    { background: #2980b9; }
  .r-dot    { background: #e67e22; }
  .c-dot    { background: #e74c3c; }
  .x-dot    { background: #16a085; }
  .s-dot    { background: var(--ink); }

  .block { display: grid; gap: 12px; }
  .sec-head { display: flex; align-items: center; gap: 8px; font-size: 13px; font-weight: 850; }

  /* ── Hook ── */
  .hook-card { padding: 16px 18px; border-radius: var(--radius); background: var(--green-soft);
    border: 1px solid var(--border); display: grid; gap: 10px; }
  .hook-situation { margin: 0; font-size: 15px; font-weight: 650; }
  .hook-why { margin: 0; color: var(--ink-2); line-height: 1.6; }
  .hook-goals strong { font-size: 13px; }
  .hook-goals ul { margin: 6px 0 0; padding-left: 18px; display: grid; gap: 4px; color: var(--ink-2); }

  /* ── Grammar notes ── */
  .mental-model { padding: 14px 16px; border-radius: 12px; background: #f5f0ff; border-left: 4px solid #9b59b6; display: grid; gap: 4px; }
  .mm-label { font-size: 11px; font-weight: 850; letter-spacing: .08em; text-transform: uppercase; color: #9b59b6; }
  .mental-model p { margin: 0; line-height: 1.6; }
  .formation { padding: 8px 14px; border-radius: 8px; background: var(--surface-2); }
  .formation code { font-size: 14px; font-weight: 750; font-family: monospace; }

  .lines { display: grid; gap: 10px; }
  .ex-row { padding: 12px 14px; border-radius: 12px; background: var(--surface); border: 1px solid var(--border); border-left: 4px solid #9b59b6; display: grid; gap: 2px; }
  .ex-ko { font-size: 17px; font-weight: 730; display: flex; align-items: center; gap: 7px; }
  .ex-en { color: var(--ink-2); }
  .ex-note { color: var(--green-dark); font-size: 13px; font-weight: 650; margin-top: 4px; }

  .contrast-section { display: grid; gap: 12px; }
  .contrast-label { font-size: 12px; font-weight: 850; text-transform: uppercase; letter-spacing: .06em; color: var(--ink-3); }
  .contrast-pair { padding: 14px 16px; border-radius: 13px; background: var(--surface-2); border: 1px solid var(--border); display: grid; gap: 6px; }
  .cp-row { display: flex; align-items: baseline; gap: 10px; }
  .cp-tag { width: 22px; height: 22px; border-radius: 999px; display: grid; place-items: center;
    font-size: 11px; font-weight: 850; background: var(--surface); border: 1px solid var(--border); flex: none; }
  .cp-row.a .cp-tag { background: var(--green-soft); color: var(--green-dark); }
  .cp-row.b .cp-tag { background: #eef4ff; color: #2980b9; }
  .cp-en { color: var(--ink-3); font-size: 13px; }
  .cp-explain { margin: 4px 0 0; font-size: 13px; color: var(--ink-2); line-height: 1.55; }

  .pitfall { padding: 14px 16px; border-radius: 13px; background: #fff8f0; border: 1px solid #f0c080; display: grid; gap: 6px; }
  .pitfall-label { font-size: 12px; font-weight: 850; color: #c0392b; }
  .pitfall-row { display: flex; align-items: baseline; gap: 10px; }
  .bad, .good { font-size: 16px; }
  .pt-ko { font-size: 16px; font-weight: 700; }
  .pt-explain { margin: 4px 0 0; font-size: 13px; color: var(--ink-2); line-height: 1.55; }

  .exceptions { padding: 12px 14px; border-radius: 12px; background: var(--surface-2); }
  .exc-label { font-size: 12px; font-weight: 850; color: var(--ink-3); margin-bottom: 6px; }
  .exceptions ul { margin: 0; padding-left: 18px; display: grid; gap: 4px; font-size: 14px; color: var(--ink-2); }

  /* ── Vocabulary ── */
  .vocab-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 12px; }
  .vocab-card { padding: 13px 14px; border-radius: 13px; background: var(--surface); border: 1px solid var(--border); display: grid; gap: 4px; }
  .vc-top { display: flex; align-items: baseline; gap: 8px; justify-content: space-between; }
  .vc-ko { font-size: 20px; font-weight: 800; }
  .vc-pos { font-size: 11px; color: var(--ink-3); background: var(--surface-2); padding: 2px 7px; border-radius: 999px; }
  .vc-rom { font-size: 12px; color: var(--ink-3); }
  .vc-en { font-size: 14px; font-weight: 700; }
  .vc-ex { margin-top: 6px; padding-top: 6px; border-top: 1px solid var(--border); display: grid; gap: 1px; }
  .vc-ex-ko { font-size: 13px; font-weight: 650; }
  .vc-ex-en { font-size: 12px; color: var(--ink-2); }
  .vc-ex-note { font-size: 11px; color: var(--green-dark); }
  .vc-colls { font-size: 11px; color: var(--ink-3); margin-top: 4px; }

  /* ── Dialogue ── */
  .dlg-setting { margin: 0; font-size: 13px; color: var(--ink-2); }
  .rich-dlg { display: grid; gap: 10px; }
  .rdline { display: grid; grid-template-columns: auto 1fr; gap: 10px; align-items: start; }
  .spk { font-size: 11px; font-weight: 800; padding: 4px 10px; border-radius: 999px; background: var(--green-soft); color: var(--green-dark); white-space: nowrap; }
  .rdlbody { display: grid; gap: 2px; padding: 12px 14px; border-radius: 13px; background: var(--surface); border: 1px solid var(--border); border-left: 4px solid #2980b9; }
  .rdko { font-size: 17px; font-weight: 730; display: flex; align-items: center; gap: 7px; }
  .rden { color: var(--ink-2); }
  .rdnote { font-size: 12px; color: #2980b9; margin-top: 4px; font-weight: 650; }

  /* ── Reading ── */
  .reading-block { padding: 16px 18px; border-radius: var(--radius); background: var(--surface); border: 1px solid var(--border); border-left: 4px solid #e67e22; }
  .reading-body { margin: 0; font-size: 16px; line-height: 1.9; font-weight: 600; }
  .gloss-details { margin-top: 12px; }
  .gloss-details summary { cursor: pointer; font-size: 13px; color: var(--ink-3); font-weight: 750; }
  .gloss-body { margin: 8px 0 0; color: var(--ink-2); font-size: 14px; line-height: 1.7; }
  .comp-qs { display: grid; gap: 10px; }
  .comp-label { font-size: 12px; font-weight: 850; text-transform: uppercase; letter-spacing: .06em; color: var(--ink-3); }
  .comp-q { padding: 12px 14px; border-radius: 12px; background: var(--surface-2); }
  .cq-text { margin: 0 0 6px; font-weight: 650; }
  .cq-details summary { cursor: pointer; font-size: 13px; color: var(--ink-3); font-weight: 750; }
  .cq-answer { margin: 8px 0 0; color: var(--ink-2); font-size: 14px; line-height: 1.6; }

  /* ── Cultural note ── */
  .culture-card { padding: 16px 18px; border-radius: var(--radius); background: #fff5f5; border: 1px solid #f0c0c0; display: grid; gap: 8px; }
  .culture-card strong { font-size: 15px; color: #c0392b; }
  .culture-card p { margin: 0; color: var(--ink-2); line-height: 1.65; }

  /* ── Exercises ── */
  .exercises { display: grid; gap: 14px; }
  .exercise { padding: 14px 16px; border-radius: var(--radius); background: var(--surface); border: 1px solid var(--border); display: grid; gap: 10px; }
  .exercise.done { border-color: var(--green); }
  .ex-prompt { margin: 0; font-size: 16px; font-weight: 700; }
  .ex-options { display: flex; flex-wrap: wrap; gap: 8px; }
  .ex-opt { padding: 8px 20px; border-radius: 999px; background: var(--surface-2); border: 1.5px solid var(--border);
    font-size: 15px; font-weight: 800; cursor: pointer; transition: border-color .1s; }
  .ex-opt:hover:not(:disabled) { border-color: var(--green); }
  .ex-opt.correct { background: #f1fae6; border-color: var(--green); color: var(--green-dark); }
  .ex-opt.wrong { background: #fdf0f0; border-color: #e74c3c; color: #c0392b; }
  .ex-opt:disabled { cursor: default; }
  .ex-reveal-btn { justify-self: start; padding: 9px 18px; border-radius: 999px; background: var(--surface-2);
    color: var(--ink-2); font-weight: 800; font-size: 14px; cursor: pointer; }
  .ex-correction { font-size: 16px; font-weight: 750; color: var(--green-dark); }
  .ex-feedback { font-size: 13px; color: var(--ink-2); line-height: 1.6; padding: 10px 13px; border-radius: 10px; background: var(--surface-2); }
  .ex-hint { font-size: 13px; color: var(--green-dark); font-weight: 650; }

  /* ── Summary ── */
  .summary-card { padding: 18px; border-radius: var(--radius); background: var(--surface-2); border: 1px solid var(--border); display: grid; gap: 12px; }
  .summary-bullets { margin: 0; padding-left: 20px; display: grid; gap: 8px; line-height: 1.6; }
  .next-teaser { display: flex; gap: 10px; align-items: baseline; padding: 12px 14px; border-radius: 12px; background: var(--green-soft); }
  .next-label { font-size: 11px; font-weight: 850; color: var(--green-dark); white-space: nowrap; text-transform: uppercase; letter-spacing: .06em; }
</style>
```

- [ ] **Step 2: No unit test needed for pure render component — visual verification in Task 4**

---

## Task 4: Wire RichChapterSections into Learn.svelte

**Files:**
- Modify: `src/routes/Learn.svelte`

- [ ] **Step 1: Import the new component**

In `Learn.svelte`, add to the import block:

```js
import RichChapterSections from '../lib/components/RichChapterSections.svelte';
```

- [ ] **Step 2: Add RichChapterSections after existing chapter sections**

In the `{:else if view === 'chapter' && chapter}` block, after the grammar focus block and before the `.ch-actions` div, add:

```svelte
<!-- Rich deep-dive sections — only rendered when chapter has been enriched -->
{#if chapter.hook || (chapter.grammarNotes || []).length}
  <RichChapterSections {chapter} />
{/if}
```

- [ ] **Step 3: Run tests**

```bash
npm test 2>&1 | tail -5
```

Expected: `Tests  95 passed (95)`

- [ ] **Step 4: Run dev server and manually verify Chapter 6**

```bash
npm run dev
```

Open `http://localhost:5173/korean-core-starter/` → Learn → Chapter 6 (에/에서).

Verify in order:
- [ ] Hook card visible with situation, objectives, why it matters
- [ ] Two grammar note sections (에, 에서) each with mental model, examples, contrast pairs, pitfall box
- [ ] Vocabulary grid (~18 cards), each with example sentence and collocation
- [ ] Annotated dialogue (8 lines, grammar note under each)
- [ ] Reading text with "Show translation" toggle and comprehension questions
- [ ] Cultural note (red-tinted card)
- [ ] 7 inline exercises — clicking options highlights correct/wrong, feedback shown
- [ ] Summary card with 3 bullets and "Up next" teaser
- [ ] Other chapters (e.g. Chapter 1) still render normally (no regression)

- [ ] **Step 5: Commit everything**

```bash
git add src/lib/components/RichChapterSections.svelte src/routes/Learn.svelte
git commit -m "feat: render rich chapter sections in Learn view — pilot Chapter 6"
```

---

## Task 5: Final build and push

- [ ] **Step 1: Full rebuild**

```bash
node scripts/build-app-data.mjs && npm test
```

Expected: `Tests  95 passed (95)`

- [ ] **Step 2: Push to GitHub**

```bash
git push
```

---

## Self-review

**Spec coverage:**
- ✅ Hook (situation, objectives, why it matters)
- ✅ Grammar notes with mental model, contrast pairs, English-speaker pitfall
- ✅ Vocabulary 15–20 words with example sentences + collocations
- ✅ Annotated extended dialogue (10–14 lines)
- ✅ Reading text with comprehension questions
- ✅ Cultural note
- ✅ Inline exercises (fill-blank, error-correct, translate, multiple-choice) with feedback
- ✅ Summary card + next chapter teaser
- ✅ Build pipeline merge (rich chapters supplement, never break, existing chapters)
- ✅ No regressions — guard `{#if chapter.hook || ...}` means chapters without rich data render exactly as before

**Placeholder scan:** None found. All code blocks are complete.

**Type consistency:** `chapter.grammarNotes`, `chapter.extendedVocabulary`, `chapter.extendedDialogue`, `chapter.inlineExercises`, `chapter.summaryCard` — used consistently in both the data schema (Task 1) and the component (Task 3).
