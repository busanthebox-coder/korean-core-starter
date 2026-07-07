# WS2 Drift Report

Generated at: 2026-07-06T16:30:41.832Z

## Summary

| Section | HEAD count | Generated count | HEAD-only | Generated-only | Existing id changes |
|---|---:|---:|---:|---:|---:|
| words | 545 | 545 | 0 | 0 | 0 |
| expressions | 876 | 876 | 0 | 0 | 0 |
| patterns | 170 | 170 | 0 | 0 | 0 |
| newcomerVocab | 18 | 18 | 0 | 0 | 0 |
| extendedVocab | 2247 | 2247 | 0 | 0 | 0 |

## Cause Classification

### Initial RED proof before recovery

| Finding | Value |
|---|---:|
| Initial extendedVocab display-key loss | 185 |
| Recovered extendedVocab seed rows | 188 |
| Unique recovered extendedVocab Hangul forms | 186 |
| Recovered pattern seed rows | 70 |
| Initial generated-only expressions | 19 |

The recovered row count is larger than the original display-key loss because manifest identity preserves homographs and multiple-sense rows separately.

### Cause taxonomy summary

The WS2 order required the loss to be classified as (a) source seed absence, (b) generator filter/schema exclusion, or (c) historical manual generated-data edit. The observed loss resolves as follows:

| Cause bucket | Count | Evidence | Treatment |
|---|---:|---|---|
| Source seed absent / historical generated-data edit | 258 recovered rows | 188 `extendedVocab` rows and 70 `patterns` rows existed in committed generated JSON but could not be reproduced from current source seeds. | Restored as `scripts/vocab-src/recovered-2026-07.json` and `scripts/pattern-src/recovered-2026-07.json`; existing ids/sorts pinned in `scripts/id-manifest.json`. |
| Generator filter/schema exclusion with same-headword source present | 0 | No recovered row had a current source seed that should have produced the same manifest identity but was filtered out by generation logic. | No generator filter exception was needed. |
| Source-backed generated-only expressions | 19 | Initial regeneration produced 19 more expressions than committed generated JSON; these were source-backed additions rather than loss. | Kept through the final generate/apply/build pipeline; final expressions are `876/876` with `Generated-only 0`. |

Final status after recovery: all tracked sections have `HEAD-only 0`, `Generated-only 0`, and `Existing id changes 0`.

### Recovery classification and treatment

| # | Section | Headword / pattern | Kind | English | Classified cause | Treatment |
|---:|---|---|---|---|---|---|
| 1 | extendedVocab | 공지 | noun | notice / announcement | historical-manual-data-without-seed | restored in `scripts/vocab-src/recovered-2026-07.json`; id/sort pinned by `scripts/id-manifest.json` |
| 2 | extendedVocab | 변경된 일정 | noun phrase | changed schedule | historical-manual-data-without-seed | restored in `scripts/vocab-src/recovered-2026-07.json`; id/sort pinned by `scripts/id-manifest.json` |
| 3 | extendedVocab | 읽히다 | verb | to be read / to make someone read | historical-manual-data-without-seed | restored in `scripts/vocab-src/recovered-2026-07.json`; id/sort pinned by `scripts/id-manifest.json` |
| 4 | extendedVocab | 팔리다 | verb | to be sold | historical-manual-data-without-seed | restored in `scripts/vocab-src/recovered-2026-07.json`; id/sort pinned by `scripts/id-manifest.json` |
| 5 | extendedVocab | 잡히다 | verb | to be set / to be scheduled | historical-manual-data-without-seed | restored in `scripts/vocab-src/recovered-2026-07.json`; id/sort pinned by `scripts/id-manifest.json` |
| 6 | extendedVocab | 닫히다 | verb | to be closed | historical-manual-data-without-seed | restored in `scripts/vocab-src/recovered-2026-07.json`; id/sort pinned by `scripts/id-manifest.json` |
| 7 | extendedVocab | 먹이다 | verb | to feed / to make someone take | historical-manual-data-without-seed | restored in `scripts/vocab-src/recovered-2026-07.json`; id/sort pinned by `scripts/id-manifest.json` |
| 8 | extendedVocab | 앉히다 | verb | to seat someone | historical-manual-data-without-seed | restored in `scripts/vocab-src/recovered-2026-07.json`; id/sort pinned by `scripts/id-manifest.json` |
| 9 | extendedVocab | 입히다 | verb | to dress someone / put clothing on someone | historical-manual-data-without-seed | restored in `scripts/vocab-src/recovered-2026-07.json`; id/sort pinned by `scripts/id-manifest.json` |
| 10 | extendedVocab | 한글 | noun | Hangul / Korean writing system | historical-manual-data-without-seed | restored in `scripts/vocab-src/recovered-2026-07.json`; id/sort pinned by `scripts/id-manifest.json` |
| 11 | extendedVocab | 자음 | noun | consonant | historical-manual-data-without-seed | restored in `scripts/vocab-src/recovered-2026-07.json`; id/sort pinned by `scripts/id-manifest.json` |
| 12 | extendedVocab | 모음 | noun | vowel | historical-manual-data-without-seed | restored in `scripts/vocab-src/recovered-2026-07.json`; id/sort pinned by `scripts/id-manifest.json` |
| 13 | extendedVocab | 글자 | noun | letter / character | historical-manual-data-without-seed | restored in `scripts/vocab-src/recovered-2026-07.json`; id/sort pinned by `scripts/id-manifest.json` |
| 14 | extendedVocab | 소리 | noun | sound | historical-manual-data-without-seed | restored in `scripts/vocab-src/recovered-2026-07.json`; id/sort pinned by `scripts/id-manifest.json` |
| 15 | extendedVocab | 이건 | contraction | this is / as for this | historical-manual-data-without-seed | restored in `scripts/vocab-src/recovered-2026-07.json`; id/sort pinned by `scripts/id-manifest.json` |
| 16 | extendedVocab | 제 | pronoun | my (polite/humble) | historical-manual-data-without-seed | restored in `scripts/vocab-src/recovered-2026-07.json`; id/sort pinned by `scripts/id-manifest.json` |
| 17 | extendedVocab | 아니에요 | expression | is not / am not / are not | historical-manual-data-without-seed | restored in `scripts/vocab-src/recovered-2026-07.json`; id/sort pinned by `scripts/id-manifest.json` |
| 18 | extendedVocab | 한국어 | noun | Korean language | historical-manual-data-without-seed | restored in `scripts/vocab-src/recovered-2026-07.json`; id/sort pinned by `scripts/id-manifest.json` |
| 19 | extendedVocab | 영어 | noun | English language | historical-manual-data-without-seed | restored in `scripts/vocab-src/recovered-2026-07.json`; id/sort pinned by `scripts/id-manifest.json` |
| 20 | extendedVocab | 있어요 | verb | there is / have | historical-manual-data-without-seed | restored in `scripts/vocab-src/recovered-2026-07.json`; id/sort pinned by `scripts/id-manifest.json` |
| 21 | extendedVocab | 없어요 | verb | there is not / do not have | historical-manual-data-without-seed | restored in `scripts/vocab-src/recovered-2026-07.json`; id/sort pinned by `scripts/id-manifest.json` |
| 22 | extendedVocab | 예약 | noun | reservation / booking | historical-manual-data-without-seed | restored in `scripts/vocab-src/recovered-2026-07.json`; id/sort pinned by `scripts/id-manifest.json` |
| 23 | extendedVocab | 한강 | proper noun | the Han River | historical-manual-data-without-seed | restored in `scripts/vocab-src/recovered-2026-07.json`; id/sort pinned by `scripts/id-manifest.json` |
| 24 | extendedVocab | 안내소 | noun | information desk / help desk | historical-manual-data-without-seed | restored in `scripts/vocab-src/recovered-2026-07.json`; id/sort pinned by `scripts/id-manifest.json` |
| 25 | extendedVocab | 2호선 | noun | Line 2 (subway) | historical-manual-data-without-seed | restored in `scripts/vocab-src/recovered-2026-07.json`; id/sort pinned by `scripts/id-manifest.json` |
| 26 | extendedVocab | 전개 | noun | development / pacing (of a story) | historical-manual-data-without-seed | restored in `scripts/vocab-src/recovered-2026-07.json`; id/sort pinned by `scripts/id-manifest.json` |
| 27 | extendedVocab | 결말 | noun | ending / conclusion (of a story) | historical-manual-data-without-seed | restored in `scripts/vocab-src/recovered-2026-07.json`; id/sort pinned by `scripts/id-manifest.json` |
| 28 | extendedVocab | 연기 | noun | acting / performance | historical-manual-data-without-seed | restored in `scripts/vocab-src/recovered-2026-07.json`; id/sort pinned by `scripts/id-manifest.json` |
| 29 | extendedVocab | 주인공 | noun | main character / protagonist | historical-manual-data-without-seed | restored in `scripts/vocab-src/recovered-2026-07.json`; id/sort pinned by `scripts/id-manifest.json` |
| 30 | extendedVocab | 개인적으로 | adverb | personally / in my personal opinion | historical-manual-data-without-seed | restored in `scripts/vocab-src/recovered-2026-07.json`; id/sort pinned by `scripts/id-manifest.json` |
| 31 | extendedVocab | 솔직히 | adverb | honestly / frankly | historical-manual-data-without-seed | restored in `scripts/vocab-src/recovered-2026-07.json`; id/sort pinned by `scripts/id-manifest.json` |
| 32 | extendedVocab | 계시다 | verb | to be / to stay (honorific for a person's presence) | historical-manual-data-without-seed | restored in `scripts/vocab-src/recovered-2026-07.json`; id/sort pinned by `scripts/id-manifest.json` |
| 33 | extendedVocab | 드리다 | verb | to give (humble, to someone respected) | historical-manual-data-without-seed | restored in `scripts/vocab-src/recovered-2026-07.json`; id/sort pinned by `scripts/id-manifest.json` |
| 34 | extendedVocab | 말씀드리다 | verb | to tell / to say (humble, to someone respected) | historical-manual-data-without-seed | restored in `scripts/vocab-src/recovered-2026-07.json`; id/sort pinned by `scripts/id-manifest.json` |
| 35 | extendedVocab | 뵙다 | verb | to meet / to see (humble, someone respected) | historical-manual-data-without-seed | restored in `scripts/vocab-src/recovered-2026-07.json`; id/sort pinned by `scripts/id-manifest.json` |
| 36 | extendedVocab | 잡수시다 | verb | to eat (very honorific) | historical-manual-data-without-seed | restored in `scripts/vocab-src/recovered-2026-07.json`; id/sort pinned by `scripts/id-manifest.json` |
| 37 | extendedVocab | 하마터면 | adverb | almost / by a narrow margin | historical-manual-data-without-seed | restored in `scripts/vocab-src/recovered-2026-07.json`; id/sort pinned by `scripts/id-manifest.json` |
| 38 | extendedVocab | 떨리다 | verb | to tremble / to feel nervous and shaky | historical-manual-data-without-seed | restored in `scripts/vocab-src/recovered-2026-07.json`; id/sort pinned by `scripts/id-manifest.json` |
| 39 | extendedVocab | 실력 | noun | skill level / actual ability | historical-manual-data-without-seed | restored in `scripts/vocab-src/recovered-2026-07.json`; id/sort pinned by `scripts/id-manifest.json` |
| 40 | extendedVocab | 바람에 | connective | because of / as a result of an unexpected problem | historical-manual-data-without-seed | restored in `scripts/vocab-src/recovered-2026-07.json`; id/sort pinned by `scripts/id-manifest.json` |
| 41 | extendedVocab | 취향 | noun | taste; personal preference | historical-manual-data-without-seed | restored in `scripts/vocab-src/recovered-2026-07.json`; id/sort pinned by `scripts/id-manifest.json` |
| 42 | extendedVocab | 추천하다 | verb | to recommend | historical-manual-data-without-seed | restored in `scripts/vocab-src/recovered-2026-07.json`; id/sort pinned by `scripts/id-manifest.json` |
| 43 | extendedVocab | 한번 | adverb | once; just to try | historical-manual-data-without-seed | restored in `scripts/vocab-src/recovered-2026-07.json`; id/sort pinned by `scripts/id-manifest.json` |
| 44 | extendedVocab | 괜찮다 | adjective | to be okay; to be fine | historical-manual-data-without-seed | restored in `scripts/vocab-src/recovered-2026-07.json`; id/sort pinned by `scripts/id-manifest.json` |
| 45 | extendedVocab | 상관없다 | adjective | to not matter; to be okay either way | historical-manual-data-without-seed | restored in `scripts/vocab-src/recovered-2026-07.json`; id/sort pinned by `scripts/id-manifest.json` |
| 46 | extendedVocab | 늦다 | adjective | to be late | historical-manual-data-without-seed | restored in `scripts/vocab-src/recovered-2026-07.json`; id/sort pinned by `scripts/id-manifest.json` |
| 47 | extendedVocab | 가능성 | noun | possibility; chance | historical-manual-data-without-seed | restored in `scripts/vocab-src/recovered-2026-07.json`; id/sort pinned by `scripts/id-manifest.json` |
| 48 | extendedVocab | 단서 | noun | clue | historical-manual-data-without-seed | restored in `scripts/vocab-src/recovered-2026-07.json`; id/sort pinned by `scripts/id-manifest.json` |
| 49 | extendedVocab | 추측하다 | verb | to guess; to infer | historical-manual-data-without-seed | restored in `scripts/vocab-src/recovered-2026-07.json`; id/sort pinned by `scripts/id-manifest.json` |
| 50 | extendedVocab | 그치다 | verb | to stop; to let up | historical-manual-data-without-seed | restored in `scripts/vocab-src/recovered-2026-07.json`; id/sort pinned by `scripts/id-manifest.json` |
| 51 | extendedVocab | 중 | noun | middle; in the middle of | historical-manual-data-without-seed | restored in `scripts/vocab-src/recovered-2026-07.json`; id/sort pinned by `scripts/id-manifest.json` |
| 52 | extendedVocab | 동안 | noun | during; for a duration | historical-manual-data-without-seed | restored in `scripts/vocab-src/recovered-2026-07.json`; id/sort pinned by `scripts/id-manifest.json` |
| 53 | extendedVocab | 그다음 | adverb | then; after that; next | historical-manual-data-without-seed | restored in `scripts/vocab-src/recovered-2026-07.json`; id/sort pinned by `scripts/id-manifest.json` |
| 54 | extendedVocab | 중간에 | adverb | in the middle; midway | historical-manual-data-without-seed | restored in `scripts/vocab-src/recovered-2026-07.json`; id/sort pinned by `scripts/id-manifest.json` |
| 55 | extendedVocab | 열리다 | verb | to open; to be opened | historical-manual-data-without-seed | restored in `scripts/vocab-src/recovered-2026-07.json`; id/sort pinned by `scripts/id-manifest.json` |
| 56 | extendedVocab | 켜지다 | verb | to turn on; to be turned on | historical-manual-data-without-seed | restored in `scripts/vocab-src/recovered-2026-07.json`; id/sort pinned by `scripts/id-manifest.json` |
| 57 | extendedVocab | 취업 | noun | employment; getting a job | historical-manual-data-without-seed | restored in `scripts/vocab-src/recovered-2026-07.json`; id/sort pinned by `scripts/id-manifest.json` |
| 58 | extendedVocab | 해요체 | noun | everyday polite speech style | historical-manual-data-without-seed | restored in `scripts/vocab-src/recovered-2026-07.json`; id/sort pinned by `scripts/id-manifest.json` |
| 59 | extendedVocab | 합쇼체 | noun | formal polite speech style | historical-manual-data-without-seed | restored in `scripts/vocab-src/recovered-2026-07.json`; id/sort pinned by `scripts/id-manifest.json` |
| 60 | extendedVocab | 반말 | noun | casual non-polite speech | historical-manual-data-without-seed | restored in `scripts/vocab-src/recovered-2026-07.json`; id/sort pinned by `scripts/id-manifest.json` |
| 61 | extendedVocab | 존댓말 | noun | polite or respectful speech | historical-manual-data-without-seed | restored in `scripts/vocab-src/recovered-2026-07.json`; id/sort pinned by `scripts/id-manifest.json` |
| 62 | extendedVocab | 말투 | noun | way of speaking; speech tone | historical-manual-data-without-seed | restored in `scripts/vocab-src/recovered-2026-07.json`; id/sort pinned by `scripts/id-manifest.json` |
| 63 | extendedVocab | 격식 | noun | formality; formal manners | historical-manual-data-without-seed | restored in `scripts/vocab-src/recovered-2026-07.json`; id/sort pinned by `scripts/id-manifest.json` |
| 64 | extendedVocab | 높임말 | noun | honorific or respectful language | historical-manual-data-without-seed | restored in `scripts/vocab-src/recovered-2026-07.json`; id/sort pinned by `scripts/id-manifest.json` |
| 65 | extendedVocab | 께서 | particle | honorific subject particle | historical-manual-data-without-seed | restored in `scripts/vocab-src/recovered-2026-07.json`; id/sort pinned by `scripts/id-manifest.json` |
| 66 | extendedVocab | 께 | particle | to a respected person | historical-manual-data-without-seed | restored in `scripts/vocab-src/recovered-2026-07.json`; id/sort pinned by `scripts/id-manifest.json` |
| 67 | extendedVocab | 계시다 | verb | to be; to stay (honorific) | historical-manual-data-without-seed | restored in `scripts/vocab-src/recovered-2026-07.json`; id/sort pinned by `scripts/id-manifest.json` |
| 68 | extendedVocab | 드시다 | verb | to eat; to drink (honorific) | historical-manual-data-without-seed | restored in `scripts/vocab-src/recovered-2026-07.json`; id/sort pinned by `scripts/id-manifest.json` |
| 69 | extendedVocab | 주무시다 | verb | to sleep (honorific) | historical-manual-data-without-seed | restored in `scripts/vocab-src/recovered-2026-07.json`; id/sort pinned by `scripts/id-manifest.json` |
| 70 | extendedVocab | 말씀하시다 | verb | to say; to speak (honorific) | historical-manual-data-without-seed | restored in `scripts/vocab-src/recovered-2026-07.json`; id/sort pinned by `scripts/id-manifest.json` |
| 71 | extendedVocab | 드리다 | verb | to give/do for a respected person (humble) | historical-manual-data-without-seed | restored in `scripts/vocab-src/recovered-2026-07.json`; id/sort pinned by `scripts/id-manifest.json` |
| 72 | extendedVocab | 근데 | adverb | but; by the way (casual shortened 그런데) | historical-manual-data-without-seed | restored in `scripts/vocab-src/recovered-2026-07.json`; id/sort pinned by `scripts/id-manifest.json` |
| 73 | extendedVocab | 사실은 | adverb | actually; to be honest | historical-manual-data-without-seed | restored in `scripts/vocab-src/recovered-2026-07.json`; id/sort pinned by `scripts/id-manifest.json` |
| 74 | extendedVocab | 잖아요 | ending | you know; as you know | historical-manual-data-without-seed | restored in `scripts/vocab-src/recovered-2026-07.json`; id/sort pinned by `scripts/id-manifest.json` |
| 75 | extendedVocab | 거든요 | ending | you see; the thing is | historical-manual-data-without-seed | restored in `scripts/vocab-src/recovered-2026-07.json`; id/sort pinned by `scripts/id-manifest.json` |
| 76 | extendedVocab | 는데요 | ending | though; you see; soft trailing ending | historical-manual-data-without-seed | restored in `scripts/vocab-src/recovered-2026-07.json`; id/sort pinned by `scripts/id-manifest.json` |
| 77 | extendedVocab | 자료 | noun | materials; data; documents | historical-manual-data-without-seed | restored in `scripts/vocab-src/recovered-2026-07.json`; id/sort pinned by `scripts/id-manifest.json` |
| 78 | extendedVocab | 배경 | noun | background; context | historical-manual-data-without-seed | restored in `scripts/vocab-src/recovered-2026-07.json`; id/sort pinned by `scripts/id-manifest.json` |
| 79 | extendedVocab | 상대방 | noun | the other person; conversation partner | historical-manual-data-without-seed | restored in `scripts/vocab-src/recovered-2026-07.json`; id/sort pinned by `scripts/id-manifest.json` |
| 80 | extendedVocab | 부드럽게 | adverb | softly; gently; smoothly | historical-manual-data-without-seed | restored in `scripts/vocab-src/recovered-2026-07.json`; id/sort pinned by `scripts/id-manifest.json` |
| 81 | extendedVocab | 말을 꺼내다 | phrase | to bring up a topic | historical-manual-data-without-seed | restored in `scripts/vocab-src/recovered-2026-07.json`; id/sort pinned by `scripts/id-manifest.json` |
| 82 | extendedVocab | 보니까 | expression | when I saw/tried/checked | historical-manual-data-without-seed | restored in `scripts/vocab-src/recovered-2026-07.json`; id/sort pinned by `scripts/id-manifest.json` |
| 83 | extendedVocab | 더라고요 | ending | I noticed; it turned out | historical-manual-data-without-seed | restored in `scripts/vocab-src/recovered-2026-07.json`; id/sort pinned by `scripts/id-manifest.json` |
| 84 | extendedVocab | 더니 | ending | I observed X, and then Y happened | historical-manual-data-without-seed | restored in `scripts/vocab-src/recovered-2026-07.json`; id/sort pinned by `scripts/id-manifest.json` |
| 85 | extendedVocab | 생각보다 | adverb | more/less than expected | historical-manual-data-without-seed | restored in `scripts/vocab-src/recovered-2026-07.json`; id/sort pinned by `scripts/id-manifest.json` |
| 86 | extendedVocab | 처음에는 | adverbial phrase | at first | historical-manual-data-without-seed | restored in `scripts/vocab-src/recovered-2026-07.json`; id/sort pinned by `scripts/id-manifest.json` |
| 87 | extendedVocab | 예전에는 | adverbial phrase | in the past; before | historical-manual-data-without-seed | restored in `scripts/vocab-src/recovered-2026-07.json`; id/sort pinned by `scripts/id-manifest.json` |
| 88 | extendedVocab | 요즘은 | adverbial phrase | these days; nowadays | historical-manual-data-without-seed | restored in `scripts/vocab-src/recovered-2026-07.json`; id/sort pinned by `scripts/id-manifest.json` |
| 89 | extendedVocab | 알게 되다 | phrase | to come to know; to find out | historical-manual-data-without-seed | restored in `scripts/vocab-src/recovered-2026-07.json`; id/sort pinned by `scripts/id-manifest.json` |
| 90 | extendedVocab | 관찰하다 | verb | to observe | historical-manual-data-without-seed | restored in `scripts/vocab-src/recovered-2026-07.json`; id/sort pinned by `scripts/id-manifest.json` |
| 91 | extendedVocab | 붐비다 | verb | to be crowded | historical-manual-data-without-seed | restored in `scripts/vocab-src/recovered-2026-07.json`; id/sort pinned by `scripts/id-manifest.json` |
| 92 | extendedVocab | 다고 했어요 | reported-speech ending | said that... | historical-manual-data-without-seed | restored in `scripts/vocab-src/recovered-2026-07.json`; id/sort pinned by `scripts/id-manifest.json` |
| 93 | extendedVocab | 냐고 물어봤어요 | reported-question ending | asked whether/if... | historical-manual-data-without-seed | restored in `scripts/vocab-src/recovered-2026-07.json`; id/sort pinned by `scripts/id-manifest.json` |
| 94 | extendedVocab | 는지 | embedded-question ending | whether; what/when/where... inside a sentence | historical-manual-data-without-seed | restored in `scripts/vocab-src/recovered-2026-07.json`; id/sort pinned by `scripts/id-manifest.json` |
| 95 | extendedVocab | 라고 하다 | reported-command ending | to tell someone to... | historical-manual-data-without-seed | restored in `scripts/vocab-src/recovered-2026-07.json`; id/sort pinned by `scripts/id-manifest.json` |
| 96 | extendedVocab | 대요 | contracted reported ending | they say; I heard that | historical-manual-data-without-seed | restored in `scripts/vocab-src/recovered-2026-07.json`; id/sort pinned by `scripts/id-manifest.json` |
| 97 | extendedVocab | 물어보다 | verb phrase | to ask; to ask and find out | historical-manual-data-without-seed | restored in `scripts/vocab-src/recovered-2026-07.json`; id/sort pinned by `scripts/id-manifest.json` |
| 98 | extendedVocab | 다시 말하다 | verb phrase | to say again; to repeat | historical-manual-data-without-seed | restored in `scripts/vocab-src/recovered-2026-07.json`; id/sort pinned by `scripts/id-manifest.json` |
| 99 | extendedVocab | 올라온 공지 | noun phrase | a notice that was posted | historical-manual-data-without-seed | restored in `scripts/vocab-src/recovered-2026-07.json`; id/sort pinned by `scripts/id-manifest.json` |
| 100 | extendedVocab | 제출할 보고서 | noun phrase | a report to submit | historical-manual-data-without-seed | restored in `scripts/vocab-src/recovered-2026-07.json`; id/sort pinned by `scripts/id-manifest.json` |
| 101 | extendedVocab | 쓰이다 | verb | to be written; to be used | historical-manual-data-without-seed | restored in `scripts/vocab-src/recovered-2026-07.json`; id/sort pinned by `scripts/id-manifest.json` |
| 102 | extendedVocab | 수밖에 없다 | bound expression | to have no choice but to | historical-manual-data-without-seed | restored in `scripts/vocab-src/recovered-2026-07.json`; id/sort pinned by `scripts/id-manifest.json` |
| 103 | extendedVocab | 리가 없다 | bound expression | there is no way that | historical-manual-data-without-seed | restored in `scripts/vocab-src/recovered-2026-07.json`; id/sort pinned by `scripts/id-manifest.json` |
| 104 | extendedVocab | 뿐이다 | bound expression | to be only; to be nothing but | historical-manual-data-without-seed | restored in `scripts/vocab-src/recovered-2026-07.json`; id/sort pinned by `scripts/id-manifest.json` |
| 105 | extendedVocab | 걸요 | sentence ending | probably; I think... | historical-manual-data-without-seed | restored in `scripts/vocab-src/recovered-2026-07.json`; id/sort pinned by `scripts/id-manifest.json` |
| 106 | extendedVocab | 좋겠어요 | wish expression | I hope; it would be good if... | historical-manual-data-without-seed | restored in `scripts/vocab-src/recovered-2026-07.json`; id/sort pinned by `scripts/id-manifest.json` |
| 107 | extendedVocab | 다면 | conditional ending | if; supposing that | historical-manual-data-without-seed | restored in `scripts/vocab-src/recovered-2026-07.json`; id/sort pinned by `scripts/id-manifest.json` |
| 108 | extendedVocab | 것 같아요 | hedging expression | I think; it seems like | historical-manual-data-without-seed | restored in `scripts/vocab-src/recovered-2026-07.json`; id/sort pinned by `scripts/id-manifest.json` |
| 109 | extendedVocab | 겠 | modal marker | will; must be; I see (inference/volition marker) | historical-manual-data-without-seed | restored in `scripts/vocab-src/recovered-2026-07.json`; id/sort pinned by `scripts/id-manifest.json` |
| 110 | extendedVocab | 조심스럽게 | adverb | carefully; cautiously | historical-manual-data-without-seed | restored in `scripts/vocab-src/recovered-2026-07.json`; id/sort pinned by `scripts/id-manifest.json` |
| 111 | extendedVocab | 선물 | noun | gift; present | historical-manual-data-without-seed | restored in `scripts/vocab-src/recovered-2026-07.json`; id/sort pinned by `scripts/id-manifest.json` |
| 112 | extendedVocab | 알레르기 | noun | allergy | historical-manual-data-without-seed | restored in `scripts/vocab-src/recovered-2026-07.json`; id/sort pinned by `scripts/id-manifest.json` |
| 113 | extendedVocab | 저희 | pronoun | our / my (humble, polite) | historical-manual-data-without-seed | restored in `scripts/vocab-src/recovered-2026-07.json`; id/sort pinned by `scripts/id-manifest.json` |
| 114 | extendedVocab | 식후 | noun | after meals | historical-manual-data-without-seed | restored in `scripts/vocab-src/recovered-2026-07.json`; id/sort pinned by `scripts/id-manifest.json` |
| 115 | extendedVocab | 원룸 | noun | studio apartment | historical-manual-data-without-seed | restored in `scripts/vocab-src/recovered-2026-07.json`; id/sort pinned by `scripts/id-manifest.json` |
| 116 | extendedVocab | 부동산 | noun | real estate; real estate office | historical-manual-data-without-seed | restored in `scripts/vocab-src/recovered-2026-07.json`; id/sort pinned by `scripts/id-manifest.json` |
| 117 | extendedVocab | 전세 | noun | large-deposit lease | historical-manual-data-without-seed | restored in `scripts/vocab-src/recovered-2026-07.json`; id/sort pinned by `scripts/id-manifest.json` |
| 118 | extendedVocab | 계약서 | noun | contract document | historical-manual-data-without-seed | restored in `scripts/vocab-src/recovered-2026-07.json`; id/sort pinned by `scripts/id-manifest.json` |
| 119 | extendedVocab | 계약하다 | verb | to sign / make a contract | historical-manual-data-without-seed | restored in `scripts/vocab-src/recovered-2026-07.json`; id/sort pinned by `scripts/id-manifest.json` |
| 120 | extendedVocab | 포함되다 | verb | to be included | historical-manual-data-without-seed | restored in `scripts/vocab-src/recovered-2026-07.json`; id/sort pinned by `scripts/id-manifest.json` |
| 121 | extendedVocab | 따로 | adverb | separately | historical-manual-data-without-seed | restored in `scripts/vocab-src/recovered-2026-07.json`; id/sort pinned by `scripts/id-manifest.json` |
| 122 | extendedVocab | 사이즈 | noun | size | historical-manual-data-without-seed | restored in `scripts/vocab-src/recovered-2026-07.json`; id/sort pinned by `scripts/id-manifest.json` |
| 123 | extendedVocab | 치수 | noun | size; measurement | historical-manual-data-without-seed | restored in `scripts/vocab-src/recovered-2026-07.json`; id/sort pinned by `scripts/id-manifest.json` |
| 124 | extendedVocab | 피팅룸 | noun | fitting room | historical-manual-data-without-seed | restored in `scripts/vocab-src/recovered-2026-07.json`; id/sort pinned by `scripts/id-manifest.json` |
| 125 | extendedVocab | 단정하다 | adjective | to be neat; tidy; presentable | historical-manual-data-without-seed | restored in `scripts/vocab-src/recovered-2026-07.json`; id/sort pinned by `scripts/id-manifest.json` |
| 126 | extendedVocab | 인분 | counter | serving; portion for one person | historical-manual-data-without-seed | restored in `scripts/vocab-src/recovered-2026-07.json`; id/sort pinned by `scripts/id-manifest.json` |
| 127 | extendedVocab | 공기밥 | noun | bowl of rice | historical-manual-data-without-seed | restored in `scripts/vocab-src/recovered-2026-07.json`; id/sort pinned by `scripts/id-manifest.json` |
| 128 | extendedVocab | 밑반찬 | noun | basic side dishes | historical-manual-data-without-seed | restored in `scripts/vocab-src/recovered-2026-07.json`; id/sort pinned by `scripts/id-manifest.json` |
| 129 | extendedVocab | 익다 | verb | to be cooked; to ripen | historical-manual-data-without-seed | restored in `scripts/vocab-src/recovered-2026-07.json`; id/sort pinned by `scripts/id-manifest.json` |
| 130 | extendedVocab | 쌈장 | noun | ssamjang; thick sauce for wraps | historical-manual-data-without-seed | restored in `scripts/vocab-src/recovered-2026-07.json`; id/sort pinned by `scripts/id-manifest.json` |
| 131 | extendedVocab | 드라마 | noun | TV drama; series | historical-manual-data-without-seed | restored in `scripts/vocab-src/recovered-2026-07.json`; id/sort pinned by `scripts/id-manifest.json` |
| 132 | extendedVocab | 댓글 | noun | comment | historical-manual-data-without-seed | restored in `scripts/vocab-src/recovered-2026-07.json`; id/sort pinned by `scripts/id-manifest.json` |
| 133 | extendedVocab | 공유하다 | verb | to share | historical-manual-data-without-seed | restored in `scripts/vocab-src/recovered-2026-07.json`; id/sort pinned by `scripts/id-manifest.json` |
| 134 | extendedVocab | 자막 | noun | subtitles; captions | historical-manual-data-without-seed | restored in `scripts/vocab-src/recovered-2026-07.json`; id/sort pinned by `scripts/id-manifest.json` |
| 135 | extendedVocab | 끊기다 | verb | to cut out; disconnect; buffer | historical-manual-data-without-seed | restored in `scripts/vocab-src/recovered-2026-07.json`; id/sort pinned by `scripts/id-manifest.json` |
| 136 | extendedVocab | 아이돌 | noun | idol; K-pop idol | historical-manual-data-without-seed | restored in `scripts/vocab-src/recovered-2026-07.json`; id/sort pinned by `scripts/id-manifest.json` |
| 137 | extendedVocab | 연결하다 | verb | to connect | historical-manual-data-without-seed | restored in `scripts/vocab-src/recovered-2026-07.json`; id/sort pinned by `scripts/id-manifest.json` |
| 138 | extendedVocab | 교수님 | noun | professor | historical-manual-data-without-seed | restored in `scripts/vocab-src/recovered-2026-07.json`; id/sort pinned by `scripts/id-manifest.json` |
| 139 | extendedVocab | 학기 | noun | semester; school term | historical-manual-data-without-seed | restored in `scripts/vocab-src/recovered-2026-07.json`; id/sort pinned by `scripts/id-manifest.json` |
| 140 | extendedVocab | 중간고사 | noun | midterm exam | historical-manual-data-without-seed | restored in `scripts/vocab-src/recovered-2026-07.json`; id/sort pinned by `scripts/id-manifest.json` |
| 141 | extendedVocab | 기말고사 | noun | final exam | historical-manual-data-without-seed | restored in `scripts/vocab-src/recovered-2026-07.json`; id/sort pinned by `scripts/id-manifest.json` |
| 142 | extendedVocab | 과제 | noun | assignment; homework | historical-manual-data-without-seed | restored in `scripts/vocab-src/recovered-2026-07.json`; id/sort pinned by `scripts/id-manifest.json` |
| 143 | extendedVocab | 호선 | noun | subway line number | historical-manual-data-without-seed | restored in `scripts/vocab-src/recovered-2026-07.json`; id/sort pinned by `scripts/id-manifest.json` |
| 144 | extendedVocab | 예매하다 | verb | to book or buy a ticket in advance | historical-manual-data-without-seed | restored in `scripts/vocab-src/recovered-2026-07.json`; id/sort pinned by `scripts/id-manifest.json` |
| 145 | extendedVocab | 편도 | noun | one-way ticket | historical-manual-data-without-seed | restored in `scripts/vocab-src/recovered-2026-07.json`; id/sort pinned by `scripts/id-manifest.json` |
| 146 | extendedVocab | 왕복 | noun | round trip | historical-manual-data-without-seed | restored in `scripts/vocab-src/recovered-2026-07.json`; id/sort pinned by `scripts/id-manifest.json` |
| 147 | extendedVocab | 매진 | noun | sold out for tickets or seats | historical-manual-data-without-seed | restored in `scripts/vocab-src/recovered-2026-07.json`; id/sort pinned by `scripts/id-manifest.json` |
| 148 | extendedVocab | 지연 | noun | delay | historical-manual-data-without-seed | restored in `scripts/vocab-src/recovered-2026-07.json`; id/sort pinned by `scripts/id-manifest.json` |
| 149 | extendedVocab | 배차 간격 | noun | interval between buses or trains | historical-manual-data-without-seed | restored in `scripts/vocab-src/recovered-2026-07.json`; id/sort pinned by `scripts/id-manifest.json` |
| 150 | extendedVocab | 매표소 | noun | ticket counter / ticket office | historical-manual-data-without-seed | restored in `scripts/vocab-src/recovered-2026-07.json`; id/sort pinned by `scripts/id-manifest.json` |
| 151 | extendedVocab | 동갑 | noun | same age | historical-manual-data-without-seed | restored in `scripts/vocab-src/recovered-2026-07.json`; id/sort pinned by `scripts/id-manifest.json` |
| 152 | extendedVocab | 호칭 | noun | form of address / title | historical-manual-data-without-seed | restored in `scripts/vocab-src/recovered-2026-07.json`; id/sort pinned by `scripts/id-manifest.json` |
| 153 | extendedVocab | 어르신 | noun | elder; older person respectfully | historical-manual-data-without-seed | restored in `scripts/vocab-src/recovered-2026-07.json`; id/sort pinned by `scripts/id-manifest.json` |
| 154 | extendedVocab | 세제 | noun | detergent | historical-manual-data-without-seed | restored in `scripts/vocab-src/recovered-2026-07.json`; id/sort pinned by `scripts/id-manifest.json` |
| 155 | extendedVocab | 덕분에 | expression | thanks to | historical-manual-data-without-seed | restored in `scripts/vocab-src/recovered-2026-07.json`; id/sort pinned by `scripts/id-manifest.json` |
| 156 | extendedVocab | 재우다 | verb | to put someone to sleep | historical-manual-data-without-seed | restored in `scripts/vocab-src/recovered-2026-07.json`; id/sort pinned by `scripts/id-manifest.json` |
| 157 | extendedVocab | 웃기다 | verb | to make someone laugh; to be funny | historical-manual-data-without-seed | restored in `scripts/vocab-src/recovered-2026-07.json`; id/sort pinned by `scripts/id-manifest.json` |
| 158 | extendedVocab | 울리다 | verb | to make someone cry; to ring | historical-manual-data-without-seed | restored in `scripts/vocab-src/recovered-2026-07.json`; id/sort pinned by `scripts/id-manifest.json` |
| 159 | extendedVocab | 낮추다 | verb | to lower | historical-manual-data-without-seed | restored in `scripts/vocab-src/recovered-2026-07.json`; id/sort pinned by `scripts/id-manifest.json` |
| 160 | extendedVocab | 줄이다 | verb | to reduce; to cut down on | historical-manual-data-without-seed | restored in `scripts/vocab-src/recovered-2026-07.json`; id/sort pinned by `scripts/id-manifest.json` |
| 161 | extendedVocab | 당연하다 | adjective | to be natural; obvious; no wonder | historical-manual-data-without-seed | restored in `scripts/vocab-src/recovered-2026-07.json`; id/sort pinned by `scripts/id-manifest.json` |
| 162 | extendedVocab | 근거 | noun | evidence; grounds; basis | historical-manual-data-without-seed | restored in `scripts/vocab-src/recovered-2026-07.json`; id/sort pinned by `scripts/id-manifest.json` |
| 163 | extendedVocab | 결론 | noun | conclusion | historical-manual-data-without-seed | restored in `scripts/vocab-src/recovered-2026-07.json`; id/sort pinned by `scripts/id-manifest.json` |
| 164 | extendedVocab | 핵심 | noun | core; key point | historical-manual-data-without-seed | restored in `scripts/vocab-src/recovered-2026-07.json`; id/sort pinned by `scripts/id-manifest.json` |
| 165 | extendedVocab | 논리 | noun | logic; reasoning | historical-manual-data-without-seed | restored in `scripts/vocab-src/recovered-2026-07.json`; id/sort pinned by `scripts/id-manifest.json` |
| 166 | extendedVocab | 사례 | noun | case; example | historical-manual-data-without-seed | restored in `scripts/vocab-src/recovered-2026-07.json`; id/sort pinned by `scripts/id-manifest.json` |
| 167 | extendedVocab | 가설 | noun | hypothesis | historical-manual-data-without-seed | restored in `scripts/vocab-src/recovered-2026-07.json`; id/sort pinned by `scripts/id-manifest.json` |
| 168 | extendedVocab | 이론 | noun | theory | historical-manual-data-without-seed | restored in `scripts/vocab-src/recovered-2026-07.json`; id/sort pinned by `scripts/id-manifest.json` |
| 169 | extendedVocab | 반론 | noun | counterargument; objection | historical-manual-data-without-seed | restored in `scripts/vocab-src/recovered-2026-07.json`; id/sort pinned by `scripts/id-manifest.json` |
| 170 | extendedVocab | 완전 | adverb | totally; really (casual intensifier) | historical-manual-data-without-seed | restored in `scripts/vocab-src/recovered-2026-07.json`; id/sort pinned by `scripts/id-manifest.json` |
| 171 | extendedVocab | 레전드 | noun | legendary; iconic; wildly memorable (slang) | historical-manual-data-without-seed | restored in `scripts/vocab-src/recovered-2026-07.json`; id/sort pinned by `scripts/id-manifest.json` |
| 172 | extendedVocab | 개웃겨 | expression | hilarious; so funny (very casual slang) | historical-manual-data-without-seed | restored in `scripts/vocab-src/recovered-2026-07.json`; id/sort pinned by `scripts/id-manifest.json` |
| 173 | extendedVocab | 라이브 채팅 | noun | live chat | historical-manual-data-without-seed | restored in `scripts/vocab-src/recovered-2026-07.json`; id/sort pinned by `scripts/id-manifest.json` |
| 174 | extendedVocab | 입자 | noun | particle | historical-manual-data-without-seed | restored in `scripts/vocab-src/recovered-2026-07.json`; id/sort pinned by `scripts/id-manifest.json` |
| 175 | extendedVocab | 시제 | noun | tense | historical-manual-data-without-seed | restored in `scripts/vocab-src/recovered-2026-07.json`; id/sort pinned by `scripts/id-manifest.json` |
| 176 | extendedVocab | 연결어 | noun | connector; linking word | historical-manual-data-without-seed | restored in `scripts/vocab-src/recovered-2026-07.json`; id/sort pinned by `scripts/id-manifest.json` |
| 177 | extendedVocab | 문체 | noun | writing style; register style | historical-manual-data-without-seed | restored in `scripts/vocab-src/recovered-2026-07.json`; id/sort pinned by `scripts/id-manifest.json` |
| 178 | extendedVocab | 택시 | noun | taxi | historical-manual-data-without-seed | restored in `scripts/vocab-src/recovered-2026-07.json`; id/sort pinned by `scripts/id-manifest.json` |
| 179 | extendedVocab | 정류장 | noun | bus stop; stop | historical-manual-data-without-seed | restored in `scripts/vocab-src/recovered-2026-07.json`; id/sort pinned by `scripts/id-manifest.json` |
| 180 | extendedVocab | 환승 | noun | transfer | historical-manual-data-without-seed | restored in `scripts/vocab-src/recovered-2026-07.json`; id/sort pinned by `scripts/id-manifest.json` |
| 181 | extendedVocab | 약국 | noun | pharmacy | historical-manual-data-without-seed | restored in `scripts/vocab-src/recovered-2026-07.json`; id/sort pinned by `scripts/id-manifest.json` |
| 182 | extendedVocab | 처방전 | noun | prescription | historical-manual-data-without-seed | restored in `scripts/vocab-src/recovered-2026-07.json`; id/sort pinned by `scripts/id-manifest.json` |
| 183 | extendedVocab | 보증금 | noun | deposit; security deposit | historical-manual-data-without-seed | restored in `scripts/vocab-src/recovered-2026-07.json`; id/sort pinned by `scripts/id-manifest.json` |
| 184 | extendedVocab | 월세 | noun | monthly rent | historical-manual-data-without-seed | restored in `scripts/vocab-src/recovered-2026-07.json`; id/sort pinned by `scripts/id-manifest.json` |
| 185 | extendedVocab | 미세먼지 | noun | fine dust; particulate air pollution | historical-manual-data-without-seed | restored in `scripts/vocab-src/recovered-2026-07.json`; id/sort pinned by `scripts/id-manifest.json` |
| 186 | extendedVocab | 충전 | noun | top-up; charge | historical-manual-data-without-seed | restored in `scripts/vocab-src/recovered-2026-07.json`; id/sort pinned by `scripts/id-manifest.json` |
| 187 | extendedVocab | 표 | noun | ticket | historical-manual-data-without-seed | restored in `scripts/vocab-src/recovered-2026-07.json`; id/sort pinned by `scripts/id-manifest.json` |
| 188 | extendedVocab | 받침 | noun | final consonant at the bottom of a syllable block | historical-manual-data-without-seed | restored in `scripts/vocab-src/recovered-2026-07.json`; id/sort pinned by `scripts/id-manifest.json` |
| 189 | patterns | V았/었어요 | pattern | polite past tense | historical-manual-data-without-seed | restored in `scripts/pattern-src/recovered-2026-07.json`; id/sort pinned by `scripts/id-manifest.json` |
| 190 | patterns | V-(으)ㄹ 거예요 | pattern | future tense / strong intention | historical-manual-data-without-seed | restored in `scripts/pattern-src/recovered-2026-07.json`; id/sort pinned by `scripts/id-manifest.json` |
| 191 | patterns | V기 전에 | pattern | before doing | historical-manual-data-without-seed | restored in `scripts/pattern-src/recovered-2026-07.json`; id/sort pinned by `scripts/id-manifest.json` |
| 192 | patterns | V-습니다 / ㅂ니다 | pattern | formal polite speech style | historical-manual-data-without-seed | restored in `scripts/pattern-src/recovered-2026-07.json`; id/sort pinned by `scripts/id-manifest.json` |
| 193 | patterns | -(으)시- | pattern | subject honorific suffix | historical-manual-data-without-seed | restored in `scripts/pattern-src/recovered-2026-07.json`; id/sort pinned by `scripts/id-manifest.json` |
| 194 | patterns | V이/히/리/기다 (passive) | pattern | lexical passive verbs | historical-manual-data-without-seed | restored in `scripts/pattern-src/recovered-2026-07.json`; id/sort pinned by `scripts/id-manifest.json` |
| 195 | patterns | V이/히/리/기/우/추/구다 (causative) | pattern | lexical causative verbs | historical-manual-data-without-seed | restored in `scripts/pattern-src/recovered-2026-07.json`; id/sort pinned by `scripts/id-manifest.json` |
| 196 | patterns | N에게 / 한테 / 께 | pattern | to / from a person | historical-manual-data-without-seed | restored in `scripts/pattern-src/recovered-2026-07.json`; id/sort pinned by `scripts/id-manifest.json` |
| 197 | patterns | N와/과 / 하고 / (이)랑 | pattern | and / with for nouns | historical-manual-data-without-seed | restored in `scripts/pattern-src/recovered-2026-07.json`; id/sort pinned by `scripts/id-manifest.json` |
| 198 | patterns | N밖에 + 부정 | pattern | nothing but / only with negation | historical-manual-data-without-seed | restored in `scripts/pattern-src/recovered-2026-07.json`; id/sort pinned by `scripts/id-manifest.json` |
| 199 | patterns | N이나 (approximation / 'about N') | pattern | as many as / surprisingly much | historical-manual-data-without-seed | restored in `scripts/pattern-src/recovered-2026-07.json`; id/sort pinned by `scripts/id-manifest.json` |
| 200 | patterns | N이라도 | pattern | at least / even if only | historical-manual-data-without-seed | restored in `scripts/pattern-src/recovered-2026-07.json`; id/sort pinned by `scripts/id-manifest.json` |
| 201 | patterns | -네요 | pattern | fresh realization ending | historical-manual-data-without-seed | restored in `scripts/pattern-src/recovered-2026-07.json`; id/sort pinned by `scripts/id-manifest.json` |
| 202 | patterns | -군요 / -구나 | pattern | realization / exclamation ending | historical-manual-data-without-seed | restored in `scripts/pattern-src/recovered-2026-07.json`; id/sort pinned by `scripts/id-manifest.json` |
| 203 | patterns | -(으)ㄹ걸요 | pattern | probably / should have | historical-manual-data-without-seed | restored in `scripts/pattern-src/recovered-2026-07.json`; id/sort pinned by `scripts/id-manifest.json` |
| 204 | patterns | V았/었으면 좋겠어요 | pattern | wish / hoped-for situation | historical-manual-data-without-seed | restored in `scripts/pattern-src/recovered-2026-07.json`; id/sort pinned by `scripts/id-manifest.json` |
| 205 | patterns | V-는지 / (으)ㄴ지 / (으)ㄹ지 | pattern | embedded question clause | historical-manual-data-without-seed | restored in `scripts/pattern-src/recovered-2026-07.json`; id/sort pinned by `scripts/id-manifest.json` |
| 206 | patterns | N의 | pattern | possession / genitive marker | historical-manual-data-without-seed | restored in `scripts/pattern-src/recovered-2026-07.json`; id/sort pinned by `scripts/id-manifest.json` |
| 207 | patterns | 수 분 개 명 권 ... (단위 명사) | pattern | Korean counters and classifiers | historical-manual-data-without-seed | restored in `scripts/pattern-src/recovered-2026-07.json`; id/sort pinned by `scripts/id-manifest.json` |
| 208 | patterns | ㅂ 불규칙 | pattern | ㅂ irregular conjugation | historical-manual-data-without-seed | restored in `scripts/pattern-src/recovered-2026-07.json`; id/sort pinned by `scripts/id-manifest.json` |
| 209 | patterns | ㄷ 불규칙 | pattern | ㄷ irregular conjugation | historical-manual-data-without-seed | restored in `scripts/pattern-src/recovered-2026-07.json`; id/sort pinned by `scripts/id-manifest.json` |
| 210 | patterns | ㅅ 불규칙 | pattern | ㅅ irregular conjugation | historical-manual-data-without-seed | restored in `scripts/pattern-src/recovered-2026-07.json`; id/sort pinned by `scripts/id-manifest.json` |
| 211 | patterns | 르 불규칙 | pattern | 르 irregular conjugation | historical-manual-data-without-seed | restored in `scripts/pattern-src/recovered-2026-07.json`; id/sort pinned by `scripts/id-manifest.json` |
| 212 | patterns | ㅎ 불규칙 | pattern | ㅎ irregular conjugation | historical-manual-data-without-seed | restored in `scripts/pattern-src/recovered-2026-07.json`; id/sort pinned by `scripts/id-manifest.json` |
| 213 | patterns | A/V-겠- | pattern | 겠 for volition and inference | historical-manual-data-without-seed | restored in `scripts/pattern-src/recovered-2026-07.json`; id/sort pinned by `scripts/id-manifest.json` |
| 214 | patterns | V-(으)ㄴ/는데 | pattern | background / soft contrast clause | historical-manual-data-without-seed | restored in `scripts/pattern-src/recovered-2026-07.json`; id/sort pinned by `scripts/id-manifest.json` |
| 215 | patterns | 따라서 / 그러나 / 반면에 / 즉 / 결국 | pattern | formal written discourse connectors | historical-manual-data-without-seed | restored in `scripts/pattern-src/recovered-2026-07.json`; id/sort pinned by `scripts/id-manifest.json` |
| 216 | patterns | V/A-아/어지다 | pattern | become / passive change | historical-manual-data-without-seed | restored in `scripts/pattern-src/recovered-2026-07.json`; id/sort pinned by `scripts/id-manifest.json` |
| 217 | patterns | V-아/어 놓다 / 두다 | pattern | do and leave prepared | historical-manual-data-without-seed | restored in `scripts/pattern-src/recovered-2026-07.json`; id/sort pinned by `scripts/id-manifest.json` |
| 218 | patterns | V/A-다면 / N이라면 | pattern | hypothetical condition | historical-manual-data-without-seed | restored in `scripts/pattern-src/recovered-2026-07.json`; id/sort pinned by `scripts/id-manifest.json` |
| 219 | patterns | V-고 있다 | pattern | progressive action | historical-manual-data-without-seed | restored in `scripts/pattern-src/recovered-2026-07.json`; id/sort pinned by `scripts/id-manifest.json` |
| 220 | patterns | A/V-아/어 보이다 | pattern | looks / appears | historical-manual-data-without-seed | restored in `scripts/pattern-src/recovered-2026-07.json`; id/sort pinned by `scripts/id-manifest.json` |
| 221 | patterns | ㅂ-변칙 | pattern | ㅂ irregular drill | historical-manual-data-without-seed | restored in `scripts/pattern-src/recovered-2026-07.json`; id/sort pinned by `scripts/id-manifest.json` |
| 222 | patterns | ㄷ-변칙 | pattern | ㄷ irregular drill | historical-manual-data-without-seed | restored in `scripts/pattern-src/recovered-2026-07.json`; id/sort pinned by `scripts/id-manifest.json` |
| 223 | patterns | ㅅ-변칙 | pattern | ㅅ irregular drill | historical-manual-data-without-seed | restored in `scripts/pattern-src/recovered-2026-07.json`; id/sort pinned by `scripts/id-manifest.json` |
| 224 | patterns | ㄹ-탈락 | pattern | ㄹ deletion before ㄴ/ㅂ/ㅅ | historical-manual-data-without-seed | restored in `scripts/pattern-src/recovered-2026-07.json`; id/sort pinned by `scripts/id-manifest.json` |
| 225 | patterns | ㅎ-변칙 | pattern | ㅎ irregular drill | historical-manual-data-without-seed | restored in `scripts/pattern-src/recovered-2026-07.json`; id/sort pinned by `scripts/id-manifest.json` |
| 226 | patterns | 르-변칙 | pattern | 르 irregular drill | historical-manual-data-without-seed | restored in `scripts/pattern-src/recovered-2026-07.json`; id/sort pinned by `scripts/id-manifest.json` |
| 227 | patterns | N도 | pattern | also / too / even | historical-manual-data-without-seed | restored in `scripts/pattern-src/recovered-2026-07.json`; id/sort pinned by `scripts/id-manifest.json` |
| 228 | patterns | N만 | pattern | only / just | historical-manual-data-without-seed | restored in `scripts/pattern-src/recovered-2026-07.json`; id/sort pinned by `scripts/id-manifest.json` |
| 229 | patterns | N이었어요 / 였어요 | pattern | past tense of 이다 | historical-manual-data-without-seed | restored in `scripts/pattern-src/recovered-2026-07.json`; id/sort pinned by `scripts/id-manifest.json` |
| 230 | patterns | N인데 | pattern | noun background clause | historical-manual-data-without-seed | restored in `scripts/pattern-src/recovered-2026-07.json`; id/sort pinned by `scripts/id-manifest.json` |
| 231 | patterns | N이라서 / 라서 | pattern | because it is N | historical-manual-data-without-seed | restored in `scripts/pattern-src/recovered-2026-07.json`; id/sort pinned by `scripts/id-manifest.json` |
| 232 | patterns | N이니까 / 니까 | pattern | since it is N | historical-manual-data-without-seed | restored in `scripts/pattern-src/recovered-2026-07.json`; id/sort pinned by `scripts/id-manifest.json` |
| 233 | patterns | 저희 가족은 ~ 명이에요 | pattern | describing family size | historical-manual-data-without-seed | restored in `scripts/pattern-src/recovered-2026-07.json`; id/sort pinned by `scripts/id-manifest.json` |
| 234 | patterns | N께서 V으시다 | pattern | honorific subject particle and verb | historical-manual-data-without-seed | restored in `scripts/pattern-src/recovered-2026-07.json`; id/sort pinned by `scripts/id-manifest.json` |
| 235 | patterns | V-이/히/리/기/우/구/추-다 (사동) | pattern | morphological causative | historical-manual-data-without-seed | restored in `scripts/pattern-src/recovered-2026-07.json`; id/sort pinned by `scripts/id-manifest.json` |
| 236 | patterns | V-게 하다 | pattern | analytic causative | historical-manual-data-without-seed | restored in `scripts/pattern-src/recovered-2026-07.json`; id/sort pinned by `scripts/id-manifest.json` |
| 237 | patterns | V-게 만들다 | pattern | forceful / resultative causative | historical-manual-data-without-seed | restored in `scripts/pattern-src/recovered-2026-07.json`; id/sort pinned by `scripts/id-manifest.json` |
| 238 | patterns | V-겠어요 / V-겠습니다 (volition) | pattern | formal commitment with 겠 | historical-manual-data-without-seed | restored in `scripts/pattern-src/recovered-2026-07.json`; id/sort pinned by `scripts/id-manifest.json` |
| 239 | patterns | A/V-겠네요 / A/V-겠군요 (inference) | pattern | inference with 겠 | historical-manual-data-without-seed | restored in `scripts/pattern-src/recovered-2026-07.json`; id/sort pinned by `scripts/id-manifest.json` |
| 240 | patterns | V-았/었으면 좋겠어요 (counterfactual wish) | pattern | counterfactual wish | historical-manual-data-without-seed | restored in `scripts/pattern-src/recovered-2026-07.json`; id/sort pinned by `scripts/id-manifest.json` |
| 241 | patterns | V-았/었더라면 … -았/었을 텐데 | pattern | strong counterfactual conditional | historical-manual-data-without-seed | restored in `scripts/pattern-src/recovered-2026-07.json`; id/sort pinned by `scripts/id-manifest.json` |
| 242 | patterns | V-기 vs V-는 것 (nominalisation contrast) | pattern | nominalization contrast | historical-manual-data-without-seed | restored in `scripts/pattern-src/recovered-2026-07.json`; id/sort pinned by `scripts/id-manifest.json` |
| 243 | patterns | A/V-네요 (fresh realisation, sentence-final) | pattern | fresh realization constraint | historical-manual-data-without-seed | restored in `scripts/pattern-src/recovered-2026-07.json`; id/sort pinned by `scripts/id-manifest.json` |
| 244 | patterns | A/V-군요 / V-는군요 (exclamatory polite) | pattern | exclamatory realization | historical-manual-data-without-seed | restored in `scripts/pattern-src/recovered-2026-07.json`; id/sort pinned by `scripts/id-manifest.json` |
| 245 | patterns | V-(으)ㄹ걸요 (regret / hedged assertion) | pattern | regret / hedged assertion | historical-manual-data-without-seed | restored in `scripts/pattern-src/recovered-2026-07.json`; id/sort pinned by `scripts/id-manifest.json` |
| 246 | patterns | V-았/었을 텐데 (unfulfilled expectation) | pattern | unfulfilled past expectation | historical-manual-data-without-seed | restored in `scripts/pattern-src/recovered-2026-07.json`; id/sort pinned by `scripts/id-manifest.json` |
| 247 | patterns | N이/가 vs N은/는 (discourse contrast) | pattern | topic versus subject particles | historical-manual-data-without-seed | restored in `scripts/pattern-src/recovered-2026-07.json`; id/sort pinned by `scripts/id-manifest.json` |
| 248 | patterns | 따라서 / 그러므로 (formal conclusion connectors) | pattern | formal conclusion connectors | historical-manual-data-without-seed | restored in `scripts/pattern-src/recovered-2026-07.json`; id/sort pinned by `scripts/id-manifest.json` |
| 249 | patterns | 그러나 / 반면에 / 한편 (formal contrast connectors) | pattern | formal contrast connectors | historical-manual-data-without-seed | restored in `scripts/pattern-src/recovered-2026-07.json`; id/sort pinned by `scripts/id-manifest.json` |
| 250 | patterns | 즉 / 다시 말해서 (written clarification) | pattern | written clarification connectors | historical-manual-data-without-seed | restored in `scripts/pattern-src/recovered-2026-07.json`; id/sort pinned by `scripts/id-manifest.json` |
| 251 | patterns | 결국 / 궁극적으로 (culmination markers) | pattern | culmination markers | historical-manual-data-without-seed | restored in `scripts/pattern-src/recovered-2026-07.json`; id/sort pinned by `scripts/id-manifest.json` |
| 252 | patterns | ㅋㅋ / ㅠㅠ / ㅇㅇ (consonant emoticons) | pattern | Korean consonant emoticons | historical-manual-data-without-seed | restored in `scripts/pattern-src/recovered-2026-07.json`; id/sort pinned by `scripts/id-manifest.json` |
| 253 | patterns | 완전 / 진짜 / 대박 (colloquial intensifiers) | pattern | colloquial intensifiers | historical-manual-data-without-seed | restored in `scripts/pattern-src/recovered-2026-07.json`; id/sort pinned by `scripts/id-manifest.json` |
| 254 | patterns | 연음: 받침 + 모음 | pattern | liaison: final consonant links to a following vowel | historical-manual-data-without-seed | restored in `scripts/pattern-src/recovered-2026-07.json`; id/sort pinned by `scripts/id-manifest.json` |
| 255 | patterns | 경음화: 받침 뒤 된소리 | pattern | tensification after blocked codas | historical-manual-data-without-seed | restored in `scripts/pattern-src/recovered-2026-07.json`; id/sort pinned by `scripts/id-manifest.json` |
| 256 | patterns | 비음화: ㄱ/ㄷ/ㅂ + ㄴ/ㅁ | pattern | nasalization before ㄴ or ㅁ | historical-manual-data-without-seed | restored in `scripts/pattern-src/recovered-2026-07.json`; id/sort pinned by `scripts/id-manifest.json` |
| 257 | patterns | 격음화: 받침 + ㅎ | pattern | aspiration when stops meet ㅎ | historical-manual-data-without-seed | restored in `scripts/pattern-src/recovered-2026-07.json`; id/sort pinned by `scripts/id-manifest.json` |
| 258 | patterns | 통합 산출 체크리스트 | pattern | integrated production checklist | historical-manual-data-without-seed | restored in `scripts/pattern-src/recovered-2026-07.json`; id/sort pinned by `scripts/id-manifest.json` |

## Notes

- `historical-manual-data-without-seed` means the committed generated JSON had a real entry that no current source seed could reproduce.
- `seed-present/generated-filter-or-key-drift` means a same-headword seed exists, so the drift needs source/schema or key review.
- Final WS2 completion requires HEAD-only entries 0 and existing id changes 0 after recovery seeds and id manifest are applied.
