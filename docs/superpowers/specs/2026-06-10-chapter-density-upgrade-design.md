# Chapter Density Upgrade — Design Spec

**Date:** 2026-06-10
**Status:** Approved (verbal) — proceeding with one pilot chapter

---

## Problem

Each of the 16 existing chapters is a skeleton: ~5 vocabulary words, 1 grammar point with a one-liner explanation, and a 3-line warm-up dialogue. A native English speaker reading this cannot actually learn Korean from it. The content is insufficient for 40-minute self-study.

---

## Goal

Make each chapter a complete 40-minute self-study unit that a native English speaker can work through and genuinely understand. Density first, then expand to 40+ chapters using the same template.

---

## Chapter Structure (40 min target)

| Section | Time | Current | Target |
|---|---|---|---|
| Hook + objectives | 3 min | ❌ | situation, 3 goals, why it matters |
| Core grammar | 12 min | 1-liner | mental model, contrast pairs, 5+ examples, English-speaker pitfall |
| Vocabulary in context | 10 min | 5 words, no examples | 15–20 words, each with example sentence + collocation |
| Extended dialogue | 5 min | 3 lines | 10–14 lines, each annotated with grammar note |
| Reading text | 5 min | ❌ | 6–8 sentence passage using only chapter vocab, 2–3 comprehension questions |
| Cultural note | 2 min | ❌ | 1 pragmatic/cultural insight tied to the grammar |
| Inline exercises | 5 min | external redirect | 5–8 questions (fill-blank, error-correct, translate), immediate feedback |
| Summary card | 1 min | ❌ | 3-bullet recap, next chapter preview |

---

## Data Schema — New Fields Per Chapter

Added to each chapter object in the chapter seed data (or generated into `app-data.json`):

```json
{
  "hook": {
    "situation": "string — real-world scenario that opens the lesson",
    "objectives": ["string × 3"],
    "whyItMatters": "string — consequence of getting this wrong"
  },
  "grammarNotes": [
    {
      "id": "string",
      "title": "string",
      "mentalModel": "string — one memorable analogy or rule",
      "formation": "string — e.g. 'Noun + 에'",
      "examples": [
        { "ko": "string", "romanization": "string", "en": "string", "note": "string — why this form" }
      ],
      "contrastPairs": [
        { "a": { "ko": "string", "en": "string" }, "b": { "ko": "string", "en": "string" }, "explanation": "string" }
      ],
      "englishSpeakerPitfall": {
        "wrong": "string", "right": "string", "explanation": "string"
      },
      "exceptions": ["string"]
    }
  ],
  "extendedVocabulary": [
    {
      "hangul": "string",
      "romanization": "string",
      "english": "string",
      "partOfSpeech": "string",
      "exampleSentence": { "ko": "string", "en": "string", "note": "string" },
      "collocations": ["string"]
    }
  ],
  "extendedDialogue": {
    "setting": "string",
    "lines": [
      { "speaker": "A|B", "ko": "string", "romanization": "string", "en": "string", "grammarNote": "string" }
    ]
  },
  "readingText": {
    "type": "diary|sms|sns|notice",
    "title": "string",
    "body": "string — 6–8 sentences, chapter vocab only",
    "comprehensionQuestions": [
      { "question": "string", "answer": "string" }
    ]
  },
  "culturalNote": {
    "title": "string",
    "body": "string"
  },
  "inlineExercises": [
    {
      "type": "fillBlank|errorCorrect|translate|multipleChoice",
      "prompt": "string",
      "options": ["string"] ,
      "correct": "string",
      "explanation": "string"
    }
  ],
  "summaryCard": {
    "bullets": ["string × 3"],
    "nextChapterTeaser": "string"
  }
}
```

---

## Implementation Plan

### Phase 1 — Pilot (one chapter, Chapter 6: 에/에서)
1. Write `scripts/enrich-chapter.mjs` — takes a chapter ID, calls Sonnet to generate all new fields, writes back to chapter seed or directly to a `rich-chapters/` folder
2. Add rendering to `Learn.svelte` chapter view — new sections with appropriate UI
3. Verify visually and with a test read-through
4. Commit

### Phase 2 — Scale
5. Run all 16 chapters through the same script
6. Rebuild app-data
7. Run tests

---

## Quality Bar

Generated content must pass:
- Grammar explanations that actually contrast (never explain one form in isolation)
- Vocabulary examples use ONLY words taught in this chapter or earlier
- Exercises have explanations for wrong answers (not just ✓/✗)
- Reading text is natural Korean, not textbook stiff
- A native English speaker reading the chapter cold can answer all comprehension questions
