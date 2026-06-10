# Korean Core Starter — Curriculum Expansion: Chapters 17–65

## What This Is

This is a ready-to-paste implementation prompt for expanding the Korean Core Starter app's curriculum from its current 16 chapters to a full 65-chapter progression. The app is built with Svelte 4, svelte-spa-router, and Vite. All learning data is stored in JSON files under `korean/data/` and assembled by `scripts/build-app-data.mjs` into a single `korean/data/app-data.json` that the Svelte frontend reads at runtime. Currently 16 chapters and approximately 100 grammar patterns are complete. This expansion adds patterns 101–165 and chapters 17–65.

---

## Tech Stack and Files

- `korean/data/course.json` — chapter definitions (array of chapter objects inside a `"chapters"` key)
- `korean/data/patterns.json` — grammar patterns (array of pattern objects inside an `"entries"` key)
- `korean/data/words.json`, `vocab-extended.json`, `expressions.json` — vocabulary entries
- `scripts/rich-chapters/chapter-XX.json` — rich 40-minute content per chapter (one file per chapter)
- `scripts/build-app-data.mjs` — rebuilds `korean/data/app-data.json` from all sources; run after every data change
- `src/lib/components/RichChapterSections.svelte` — renders rich content from the chapter JSON files

### course.json chapter object schema
```json
{
  "id": "chapter-17",
  "number": 17,
  "title": "Past Tense",
  "goal": "One sentence describing the learning goal.",
  "scenario": "One sentence real-world situation.",
  "dialogue": [
    { "speaker": "A", "ko": "...", "romanization": "...", "en": "..." }
  ],
  "grammarFocus": ["grammar-id-string"],
  "linkedEntryIds": ["pattern-xxx", "expr-xxx"],
  "coreVocabularyIds": [],
  "patternIds": ["pattern-101"],
  "guidedPractice": "One practice task description.",
  "realLifeTask": "One real-world application task.",
  "friendPractice": "One partner-practice description.",
  "review": "Can you... self-check question.",
  "beginnerGuide": [
    { "title": "...", "body": "..." }
  ],
  "checkpoints": ["I can ...", "I can ..."]
}
```

### patterns.json entry schema (abbreviated — match existing entries for full fields)
```json
{
  "id": "pattern-101",
  "sort": 2101,
  "type": "pattern",
  "level": "A2",
  "topic": ["daily-life"],
  "hangul": "V았/었어요",
  "romanization": "V-asseoyo / eosseoyo",
  "english": "past tense (polite)",
  "partOfSpeech": "pattern",
  "irregular": null,
  "shortExplanation": "...",
  "explanation": "...",
  "learnerPriority": "...",
  "contextHint": "...",
  "patternInfo": {
    "meaning": "...",
    "usableWith": ["verb"],
    "formNote": "...",
    "speechLevelTabs": { "casual": "...", "polite": "...", "formal": "..." }
  },
  "studyGuide": {
    "title": "...",
    "howToBuild": ["step 1", "step 2"],
    "whenToUse": "...",
    "learnerPath": "...",
    "linkedWordIds": [],
    "relatedPatternIds": []
  },
  "relatedWordIds": [],
  "relatedPatternIds": [],
  "usagePhrases": [
    { "ko": "...", "romanization": "...", "en": "..." }
  ]
}
```

### rich chapter JSON schema (canonical example: `scripts/rich-chapters/chapter-06.json`)
```json
{
  "id": "chapter-XX",
  "hook": {
    "situation": "A vivid real-world scenario that creates immediate motivation.",
    "objectives": ["objective 1", "objective 2", "objective 3"],
    "whyItMatters": "One paragraph explaining why this matters to a learner in Korea."
  },
  "grammarNotes": [
    {
      "id": "gn-id",
      "title": "Pattern Name",
      "mentalModel": "One memorable analogy or mental image for the rule.",
      "formation": "Stem + ending",
      "examples": [
        { "ko": "...", "romanization": "...", "en": "...", "note": "why this example illustrates the rule" }
      ],
      "contrastPairs": [
        {
          "a": { "ko": "...", "en": "..." },
          "b": { "ko": "...", "en": "..." },
          "explanation": "What distinguishes these two."
        }
      ],
      "englishSpeakerPitfall": {
        "wrong": "...",
        "right": "...",
        "explanation": "Why English speakers make this specific error."
      },
      "exceptions": ["exception 1", "exception 2"]
    }
  ],
  "extendedVocabulary": [
    {
      "ko": "...",
      "romanization": "...",
      "en": "...",
      "exampleSentence": { "ko": "...", "romanization": "...", "en": "..." }
    }
  ],
  "extendedDialogue": [
    {
      "speaker": "A",
      "ko": "...",
      "romanization": "...",
      "en": "...",
      "grammarNote": "Optional: name the pattern used here."
    }
  ],
  "readingText": {
    "title": "...",
    "ko": "Multi-sentence Korean paragraph.",
    "romanization": "...",
    "en": "...",
    "comprehensionQuestions": [
      { "q": "...", "a": "..." }
    ]
  },
  "culturalNote": {
    "title": "...",
    "body": "2–3 sentences of cultural context.",
    "tip": "One actionable tip for the learner."
  },
  "inlineExercises": [
    {
      "type": "fill-in-blank | multiple-choice | translation | error-correction",
      "prompt": "...",
      "answer": "...",
      "hint": "..."
    }
  ],
  "summaryCard": {
    "title": "Chapter XX at a glance",
    "keyPatterns": ["Pattern: example sentence"],
    "memorableSentence": "One sentence that uses all key patterns together.",
    "nextChapterPreview": "What chapter XX+1 will build on this."
  }
}
```

---

## Phase 1: Add New Patterns to patterns.json

Append the following pattern objects to the `"entries"` array in `korean/data/patterns.json`. Each object must follow the full schema shown above. The `sort` field should be `2000 + pattern number` (e.g., pattern-101 → sort 2101).

**Critical patterns to add first (pattern-101 to pattern-115) — these are directly referenced by chapters 17–47:**

```json
[
  {
    "id": "pattern-101",
    "sort": 2101,
    "type": "pattern",
    "level": "A2",
    "topic": ["daily-life", "time"],
    "hangul": "V았/었어요",
    "romanization": "V-asseoyo / eosseoyo",
    "english": "past tense (polite)",
    "partOfSpeech": "pattern",
    "irregular": null,
    "shortExplanation": "Polite past tense: ㅏ/ㅗ stem → 았어요; other vowels → 었어요; 하다 → 했어요.",
    "explanation": "Take the verb stem. If the last vowel is ㅏ or ㅗ, add 았어요; all other vowels add 었어요. Contracted stems: 하다 → 했어요; 오다 → 왔어요; 보다 → 봤어요. Irregular ㅂ stems: 춥다 → 추웠어요. Irregular ㄷ stems: 듣다 → 들었어요. Irregular ㅅ: 낫다 → 나았어요. Irregular 르: 모르다 → 몰랐어요.",
    "learnerPriority": "Memorize 3 contracted forms first: 했어요, 왔어요, 봤어요. Then practice ㅏ/ㅗ → 았어요 and everything else → 었어요.",
    "contextHint": "Use for any completed action in the past — yesterday, last year, just now.",
    "patternInfo": {
      "meaning": "past tense (polite)",
      "usableWith": ["verb", "adjective"],
      "formNote": "ㅏ/ㅗ stem → 았어요; other → 었어요; 하다 → 했어요. Irregular stems apply before this rule.",
      "speechLevelTabs": {
        "casual": "V았/었어 (반말)",
        "polite": "V았/었어요 (해요체)",
        "formal": "V았/었습니다 (합쇼체)"
      }
    },
    "studyGuide": {
      "title": "Past tense",
      "howToBuild": [
        "Find the verb stem (remove 다).",
        "Check the last vowel of the stem.",
        "ㅏ or ㅗ → add 았어요; anything else → add 었어요.",
        "하다 verbs: always 했어요.",
        "Apply irregular rules before attaching the ending."
      ],
      "whenToUse": "Any completed past action or state.",
      "learnerPath": "After this, study -(으)ㄹ 거예요 for future tense and -고 있었어요 for past progressive.",
      "linkedWordIds": [],
      "relatedPatternIds": ["pattern-102", "pattern-131"]
    },
    "relatedWordIds": [],
    "relatedPatternIds": ["pattern-102", "pattern-131"],
    "usagePhrases": [
      { "ko": "어제 밥을 먹었어요.", "romanization": "eoje babeul meogeosseoyo.", "en": "I ate rice yesterday." },
      { "ko": "작년에 한국에 갔어요.", "romanization": "jangnyeone hanguge gasseoyo.", "en": "I went to Korea last year." },
      { "ko": "날씨가 추웠어요.", "romanization": "nalssiga chuwosseoyo.", "en": "The weather was cold." },
      { "ko": "그 영화를 봤어요.", "romanization": "geu yeonghwareul bwasseoyo.", "en": "I watched that film." }
    ]
  },
  {
    "id": "pattern-102",
    "sort": 2102,
    "type": "pattern",
    "level": "A2",
    "topic": ["daily-life", "time"],
    "hangul": "V-(으)ㄹ 거예요",
    "romanization": "V-(eu)l geoyeyo",
    "english": "future tense / strong intention",
    "partOfSpeech": "pattern",
    "irregular": null,
    "shortExplanation": "Future tense or strong intention: vowel-final stem + ㄹ 거예요; consonant-final + 을 거예요.",
    "explanation": "After a vowel-final stem add -ㄹ 거예요 (가다 → 갈 거예요). After a consonant-final stem add -을 거예요 (먹다 → 먹을 거예요). ㄹ-final stems attach -ㄹ 거예요 directly (살다 → 살 거예요). For first-person: intention. For third-person: inference about the future.",
    "learnerPriority": "First memorize: 갈 거예요 (will go), 먹을 거예요 (will eat), 할 거예요 (will do).",
    "contextHint": "Use for plans, scheduled future events, and predictions about others.",
    "patternInfo": {
      "meaning": "future tense / strong intention",
      "usableWith": ["verb"],
      "formNote": "Vowel-final: -ㄹ 거예요. Consonant-final: -을 거예요. ㄹ-final: -ㄹ 거예요 (ㄹ does not double).",
      "speechLevelTabs": {
        "casual": "V-(으)ㄹ 거야",
        "polite": "V-(으)ㄹ 거예요",
        "formal": "V-(으)ㄹ 겁니다"
      }
    },
    "studyGuide": {
      "title": "Future tense",
      "howToBuild": [
        "Find the verb stem.",
        "Vowel-final stem → add ㄹ 거예요.",
        "Consonant-final stem → add 을 거예요.",
        "ㄹ-final stems (살다, 알다) → attach ㄹ 거예요 directly (ㄹ does not double)."
      ],
      "whenToUse": "Plans, intentions, and predictions. First person = intention; third person = inference.",
      "learnerPath": "After this, learn V-겠어요 for in-the-moment commitment and -(으)ㄹ 것 같아요 for uncertain prediction.",
      "linkedWordIds": [],
      "relatedPatternIds": ["pattern-101", "pattern-125"]
    },
    "relatedWordIds": [],
    "relatedPatternIds": ["pattern-101", "pattern-125"],
    "usagePhrases": [
      { "ko": "내일 친구를 만날 거예요.", "romanization": "naeil chingureul mannal geoyeyo.", "en": "I will meet a friend tomorrow." },
      { "ko": "비가 올 거예요.", "romanization": "biga ol geoyeyo.", "en": "It will probably rain." },
      { "ko": "이 책을 다 읽을 거예요.", "romanization": "i chaegeul da ilgeul geoyeyo.", "en": "I am going to finish reading this book." },
      { "ko": "그 사람은 바쁠 거예요.", "romanization": "geu sarameun bappeul geoyeyo.", "en": "That person is probably busy." }
    ]
  },
  {
    "id": "pattern-120",
    "sort": 2120,
    "type": "pattern",
    "level": "A2",
    "topic": ["daily-life"],
    "hangul": "ㅂ 불규칙",
    "romanization": "b irregular",
    "english": "ㅂ irregular: ㅂ → 워 before vowel endings",
    "partOfSpeech": "pattern",
    "irregular": "ㅂ",
    "shortExplanation": "Stems ending in ㅂ change ㅂ → 우 before vowel-initial endings: 춥다 → 추워요.",
    "explanation": "When a descriptive verb stem ends in ㅂ and the next suffix begins with a vowel, ㅂ changes to 우 (creating 워 with the following 어). 춥다 + 어요 → 추워요. 덥다 → 더워요. 어렵다 → 어려워요. Exceptions (regular ㅂ): 잡다 → 잡아요, 입다 → 입어요. Before consonant-initial endings, ㅂ is used normally: 춥습니다.",
    "learnerPriority": "Memorize the most common ones first: 추워요 (cold), 더워요 (hot), 어려워요 (difficult), 쉬워요 (easy), 매워요 (spicy).",
    "contextHint": "Almost all descriptive adjectives ending in ㅂ are irregular. Most action verbs ending in ㅂ (잡다, 입다, 씹다) are regular.",
    "patternInfo": {
      "meaning": "ㅂ irregular conjugation rule",
      "usableWith": ["verb", "adjective"],
      "formNote": "Before vowel endings: ㅂ → 우 + ending (워요/와요). Before consonant endings: ㅂ stays.",
      "speechLevelTabs": {
        "casual": "추워 (it's cold)",
        "polite": "추워요",
        "formal": "춥습니다"
      }
    },
    "studyGuide": {
      "title": "ㅂ irregular verbs",
      "howToBuild": [
        "Identify the stem ends in ㅂ.",
        "Check if it is a descriptive verb (adjective) — almost certainly irregular.",
        "Remove ㅂ and add 우 before the vowel ending.",
        "춥 + 어요 → 추 + 우 + 어요 → 추워요."
      ],
      "whenToUse": "Applies to ㅂ-final stems before -아/어요, -아/어서, -(으)면, -(으)ㄹ, -(으)ㄴ and other vowel-initial endings.",
      "learnerPath": "After mastering ㅂ irregular, study ㄷ irregular (pattern-121) and 르 irregular (pattern-123).",
      "linkedWordIds": [],
      "relatedPatternIds": ["pattern-121", "pattern-122", "pattern-123", "pattern-124"]
    },
    "relatedWordIds": [],
    "relatedPatternIds": ["pattern-121", "pattern-122", "pattern-123", "pattern-124"],
    "usagePhrases": [
      { "ko": "날씨가 추워요.", "romanization": "nalssiga chuweoyo.", "en": "The weather is cold." },
      { "ko": "한국어가 어려워요.", "romanization": "hangugeoga eoryeoweoyo.", "en": "Korean is difficult." },
      { "ko": "이 음식이 매워요.", "romanization": "i eumsigi maeweoyo.", "en": "This food is spicy." },
      { "ko": "오늘 쉬워요.", "romanization": "oneul shiweoyo.", "en": "It is easy today." }
    ]
  }
]
```

**Note**: The above shows 3 sample patterns with full schema. Generate all patterns 103–165 in the same format before appending. See `docs/superpowers/specs/2026-06-10-new-patterns-101-plus.md` for the complete list of patterns with their usage descriptions and examples. The full schemas for 104–165 should be constructed following the same field structure as the 3 samples above.

---

## Phase 2: Add Chapters 17–40 to course.json

Append the following chapter objects to the `"chapters"` array in `korean/data/course.json`. These are the already-planned chapters from the original curriculum design.

```json
[
  {
    "id": "chapter-17",
    "number": 17,
    "title": "Past Tense",
    "goal": "Form polite past tense sentences using 았/었어요 and apply irregular verb rules.",
    "scenario": "Telling a friend what you did yesterday.",
    "dialogue": [
      { "speaker": "A", "ko": "어제 뭐 했어요?", "romanization": "eoje mwo haesseoyo?", "en": "What did you do yesterday?" },
      { "speaker": "B", "ko": "친구를 만났어요. 같이 밥을 먹었어요.", "romanization": "chingureul mannasseoyo. gachi babeul meogeosseoyo.", "en": "I met a friend. We ate together." },
      { "speaker": "A", "ko": "어디서 먹었어요?", "romanization": "eodiseo meogeosseoyo?", "en": "Where did you eat?" }
    ],
    "grammarFocus": ["grammar-past-tense"],
    "linkedEntryIds": ["pattern-101"],
    "coreVocabularyIds": [],
    "patternIds": ["pattern-101"],
    "guidedPractice": "Write 5 past-tense sentences about yesterday using 았어요 and 었어요.",
    "realLifeTask": "Tell a Korean-speaking friend 3 things you did last week.",
    "friendPractice": "Friend asks 어제 뭐 했어요? Learner answers with 2 past-tense sentences.",
    "review": "Can you form past tense for both ㅏ/ㅗ and other vowel stems? Can you handle 하다 and ㅂ-irregular verbs?",
    "beginnerGuide": [
      { "title": "The vowel harmony trick", "body": "Korean past tense follows one rule: ㅏ or ㅗ in the last syllable → 았어요; everything else → 었어요. 하다 is the main exception: 했어요." },
      { "title": "Irregular verbs appear here", "body": "When you add 었어요 to a ㅂ-irregular stem like 춥다, the ㅂ changes to 워: 추웠어요. This is normal — not a mistake." }
    ],
    "checkpoints": [
      "I can conjugate regular verbs into past tense.",
      "I can apply the 하다 → 했어요 rule.",
      "I know ㅂ-irregular stems change to 워 in past tense."
    ]
  },
  {
    "id": "chapter-18",
    "number": 18,
    "title": "Future and Intention",
    "goal": "Express future plans and strong intentions using -(으)ㄹ 거예요.",
    "scenario": "Making weekend plans with a friend.",
    "dialogue": [
      { "speaker": "A", "ko": "이번 주말에 뭐 할 거예요?", "romanization": "ibeon jumare mwo hal geoyeyo?", "en": "What are you going to do this weekend?" },
      { "speaker": "B", "ko": "친구랑 영화를 볼 거예요.", "romanization": "chingurang yeonghwareul bol geoyeyo.", "en": "I'm going to watch a movie with a friend." },
      { "speaker": "A", "ko": "저도 같이 가도 돼요?", "romanization": "jeodo gachi gado dwaeyo?", "en": "Can I come too?" }
    ],
    "grammarFocus": ["grammar-future"],
    "linkedEntryIds": ["pattern-102"],
    "coreVocabularyIds": [],
    "patternIds": ["pattern-102"],
    "guidedPractice": "Write your plans for tomorrow using -(으)ㄹ 거예요 for each activity.",
    "realLifeTask": "Tell a Korean friend 3 plans for the weekend.",
    "friendPractice": "Friend asks 내일 뭐 할 거예요? Learner answers with 3 future sentences.",
    "review": "Can you form future tense after vowel-final and consonant-final stems? Can you handle ㄹ-final stems like 살다?",
    "beginnerGuide": [
      { "title": "Future vs intention", "body": "-(으)ㄹ 거예요 covers both future prediction (비가 올 거예요) and personal plans (갈 거예요). Context tells the listener which meaning applies." }
    ],
    "checkpoints": [
      "I can form -(으)ㄹ 거예요 after vowel-final stems.",
      "I can form -을 거예요 after consonant-final stems.",
      "I know ㄹ-final stems attach ㄹ 거예요 directly."
    ]
  },
  {
    "id": "chapter-19",
    "number": 19,
    "title": "Question Words",
    "goal": "Use the full set of Korean question words to ask open-ended questions in any situation.",
    "scenario": "Asking about people, places, times, reasons, and methods in daily conversation.",
    "dialogue": [
      { "speaker": "A", "ko": "어디에 가요?", "romanization": "eodie gayo?", "en": "Where are you going?" },
      { "speaker": "B", "ko": "친구 집에 가요. 왜요?", "romanization": "chingu jibe gayo. waeyo?", "en": "I'm going to a friend's house. Why?" },
      { "speaker": "A", "ko": "저도 같이 가고 싶어서요.", "romanization": "jeodo gachi gago sipheoseoyo.", "en": "Because I want to go together too." }
    ],
    "grammarFocus": ["grammar-question-words"],
    "linkedEntryIds": [],
    "coreVocabularyIds": [],
    "patternIds": [],
    "guidedPractice": "Ask one question with each of: 뭐, 어디, 언제, 왜, 어떻게, 누구, 얼마나.",
    "realLifeTask": "Ask a Korean speaker 5 questions using different question words.",
    "friendPractice": "Friend gives a statement. Learner asks a follow-up question using the appropriate question word.",
    "review": "Can you use all 7 main question words? Do you know when 누가 vs 누구를 is correct?",
    "beginnerGuide": [
      { "title": "Question words replace the unknown", "body": "In Korean, question words appear in the same position as the noun they replace. 뭐 replaces 밥 in 밥을 먹어요? → 뭐를/뭘 먹어요?" }
    ],
    "checkpoints": [
      "I can use 뭐, 어디, 언제, 왜, 어떻게, 누구, 얼마나 correctly.",
      "I know 누가 is the subject form and 누구를 is the object form.",
      "I can ask follow-up questions in conversation."
    ]
  },
  {
    "id": "chapter-20",
    "number": 20,
    "title": "Numbers and Time",
    "goal": "Use Sino-Korean and native Korean numbers for dates, times, prices, and ages.",
    "scenario": "Arranging to meet at a specific time and discussing prices at a market.",
    "dialogue": [
      { "speaker": "A", "ko": "몇 시에 만날까요?", "romanization": "myeot ssie mannalkkayo?", "en": "What time shall we meet?" },
      { "speaker": "B", "ko": "세 시에 만나요.", "romanization": "se ssie mannayo.", "en": "Let's meet at three o'clock." },
      { "speaker": "A", "ko": "이거 얼마예요?", "romanization": "igeo eolmayeyo?", "en": "How much is this?" }
    ],
    "grammarFocus": ["grammar-numbers"],
    "linkedEntryIds": [],
    "coreVocabularyIds": [],
    "patternIds": [],
    "guidedPractice": "Say these times and prices aloud: 2:30 PM, 10,000원, your age, today's date.",
    "realLifeTask": "Tell a Korean speaker when you wake up, eat lunch, and go to sleep.",
    "friendPractice": "Friend names a price or time. Learner writes the Hangul numerals.",
    "review": "Can you explain which number system to use for times (native) vs dates/money (Sino-Korean)?",
    "beginnerGuide": [
      { "title": "Two number systems", "body": "Korean has native numbers (하나/둘/셋) for hours and age, and Sino-Korean numbers (일/이/삼) for minutes, money, dates, and floors. You will use both every day." }
    ],
    "checkpoints": [
      "I can count to 100 in both number systems.",
      "I use native numbers for hours and age, Sino-Korean for minutes and money.",
      "I can say today's date in Korean."
    ]
  }
]
```

**Note**: The above shows chapters 17–20 as examples. Generate chapters 21–40 in the same format before appending. The intended chapters are:
- ch21: Descriptions (A-ㄴ/은 N, V-는 N)
- ch22: Likes and Comparisons
- ch23: Directions and Transport
- ch24: Suggestions and Trying
- ch25: Contrast and Concession
- ch26: Probability and Inference
- ch27: Ongoing Actions
- ch28: Sequence and Completion
- ch29: Mid-Action Change
- ch30: Cause and Unexpected Result
- ch31: Purpose and Duration
- ch32: Decisions and Changes
- ch33: Speech Levels
- ch34: Honorifics
- ch35: Discourse Markers
- ch36: Observation and Retrospection
- ch37: Reported Speech
- ch38: Advanced Noun Modification and Passive
- ch39: Inevitability and Limits
- ch40: Nuance and Hedging

Each chapter object needs the fields: id, number, title, goal, scenario, dialogue (3 turns), grammarFocus, linkedEntryIds, coreVocabularyIds (can be []), patternIds (use actual pattern IDs from patterns.json where they exist), guidedPractice, realLifeTask, friendPractice, review, beginnerGuide (2–3 entries), checkpoints (3 items).

---

## Phase 3: Add Chapters 41–65 to course.json

Append chapters 41–65 following the same schema. These chapters come from `docs/superpowers/specs/2026-06-10-curriculum-ch41-65.md`. Key chapter-to-pattern mappings:

| Chapter | Key Pattern IDs |
|---------|----------------|
| ch41 Irregular Verbs | pattern-120, 121, 122, 123, 124, 136 |
| ch42 Particle Expansion | pattern-108, 109, 110, 111, 112, 118, 139, 140 |
| ch43 Counters | pattern-119 |
| ch44 Pronunciation Rules | new patterns needed: see spec |
| ch45 Negation Deep Dive | pattern-120 (negation context), 121 (negation), 122 (N하다 split) |
| ch46 이다 Deep Dive | pattern-141, 142, 143, 144 |
| ch47 Family | pattern-145, 146 |
| ch48 Health | existing patterns: pattern-011, 018, 027 |
| ch49 Housing | existing patterns: pattern-002, 003, 007, 020 |
| ch50 Weather | existing patterns: pattern-020, 086 |
| ch51 Clothing | pattern-132 |
| ch52 Food Culture | existing patterns |
| ch53 Entertainment | existing patterns: pattern-085, 035 |
| ch54 Education | existing patterns |
| ch55 Transport | existing patterns |
| ch56 Social Customs | existing patterns |
| ch57 Causatives | pattern-147, 148, 149 |
| ch58 겠 | pattern-150, 151 |
| ch59 Unreal Conditionals | pattern-152, 153 |
| ch60 Nominalisation | pattern-154 |
| ch61 Attitude Endings | pattern-155, 156, 157, 158 |
| ch62 Topic vs Subject | pattern-159 |
| ch63 Written Korean | pattern-160, 161, 162, 163 |
| ch64 Internet Language | pattern-164, 165 |
| ch65 Synthesis | references all |

---

## Phase 4: Rebuild and Verify

After completing all JSON edits, run:

```bash
node scripts/build-app-data.mjs
npm test -- --run
```

The build script assembles all data sources into `korean/data/app-data.json`. The test suite will catch:
- Broken JSON syntax (parse errors)
- Pattern ID references in chapters that don't exist in patterns.json
- Duplicate IDs

If tests pass, start the dev server and verify the new chapters appear in the app:

```bash
npm run dev
```

Navigate to the chapters list and confirm chapters 17–65 appear. Click through chapter 41 (Irregular Verbs) and verify all 6 irregular pattern sections render correctly.

---

## Phase 5: Generate Rich Content

For each new chapter, generate a rich 40-minute study file at `scripts/rich-chapters/chapter-XX.json` using the schema shown in the Tech Stack section above. The canonical example is `scripts/rich-chapters/chapter-06.json`.

**Content requirements for each rich chapter file:**

1. **hook** — A vivid real-world scenario that gives the learner immediate motivation. The `situation` should be 2–3 sentences describing a specific moment where the chapter's grammar would be needed. The `whyItMatters` paragraph should explain the cost of not knowing this content.

2. **grammarNotes** — One note per major grammar point in the chapter. Each note needs:
   - A `mentalModel` — one memorable analogy or visual metaphor for the rule
   - At least 4 `examples` with Korean, romanization, English, and a brief note
   - At least one `contrastPair` showing the chapter's grammar versus the most-confused alternative
   - An `englishSpeakerPitfall` showing the specific error English speakers make
   - `exceptions` list where applicable

3. **extendedVocabulary** — 15–20 domain-specific words from the chapter's vocabulary domain, each with an example sentence

4. **extendedDialogue** — A realistic 8–10 turn dialogue in the chapter's scenario. Each turn should have a grammarNote identifying which pattern it demonstrates.

5. **readingText** — A 100–150 word Korean text in the chapter's domain, with 3–4 comprehension questions

6. **culturalNote** — The cultural insight from the chapter spec, expanded to 3–4 sentences plus one actionable `tip`

7. **inlineExercises** — 5–8 exercises mixing fill-in-blank, multiple-choice, translation, and error-correction types

8. **summaryCard** — 3–5 key patterns with one example sentence each, one memorable sentence that uses all patterns together, and a preview of the next chapter

**Priority order for rich content generation:**
1. ch41–47 (A2 gap chapters): critical for learner progression
2. ch17–20 (basic past/future/questions/numbers): high learner traffic
3. ch48–56 (B1 domains): high practical value
4. ch57–65 (B2/C1): advanced learners

---

## Important Constraints

- Do NOT modify chapters 1–16 — they are complete and tested
- Do NOT modify existing pattern entries (pattern-001 through pattern-100) — only append
- Pattern IDs must be unique and sequential; do not reuse an existing ID
- Each chapter's `patternIds` must reference patterns that actually exist in `patterns.json` after your edits
- The `sort` field on patterns should be `2000 + pattern number` (e.g., pattern-143 → sort: 2143)
- `coreVocabularyIds` can be `[]` initially — rich content generation does not require pre-linked vocab IDs
- Irregular verb chapters (ch41, ch44) need multiple `grammarNotes` entries in the rich file, one per irregular type
- Run `npm test -- --run` after each phase to catch regressions before proceeding to the next phase
- For chapters referencing patterns not yet in patterns.json (e.g., pronunciation rule patterns for ch44), add placeholder pattern entries with minimal required fields first, then expand them
- The `dialogue` field in course.json requires at least 3 turns; more is fine but 3 is the minimum that renders correctly in the app
- Romanization should use the Revised Romanization of Korean (국어의 로마자 표기법) standard

---

## Reference Files

All spec details are in these files:

- `docs/superpowers/specs/2026-06-10-new-patterns-101-plus.md` — full usage descriptions and examples for all new patterns
- `docs/superpowers/specs/2026-06-10-curriculum-ch41-65.md` — full chapter designs for ch41–65 including vocabulary lists, cultural notes, rationale
- `scripts/rich-chapters/chapter-06.json` — canonical rich chapter JSON example
- `korean/data/patterns.json` — existing pattern schema to match
- `korean/data/course.json` — existing chapter schema to match
