# Korean Core Starter — V2 업그레이드 마스터 플랜 (2026-07-05)

> 설계: Fable. 실행: Claude Opus / Codex(GPT-5.5) — 세션당 워크스트림 1개씩 집어갈 것.
> 이 문서는 개요다. **실행자는 [v2-upgrade/00-README.md](v2-upgrade/00-README.md)의 WS별 상세 스펙을 따른다**
> (파일 경로·함수 시그니처·테스트 케이스·수용 기준 포함). 상충 시 상세 스펙이 우선.

---

## 0. 현재 상태 스냅샷 (2026-07-05, commit `46793a7`, branch `hanmok-redesign`)

### 스택 & 구조
- Svelte 4 + Vite + svelte-spa-router SPA. base `/korean-core-starter/`. 배포: `npm run deploy`(gh-pages).
- 탭 6개: Learn(레슨 플레이어) / Practice(SRS·퀴즈) / Shadow / Roleplay / Dictionary / Guide.
- 디자인: "Hanmok" 토큰 (`src/styles/tokens.css` — cream `#FAF4EA`, persimmon `#E8552E`, Fraunces + Gowun Batang + Pretendard, `.btn3d`).
- 테스트: vitest 134개 (25파일) 전부 green. **모든 WS는 착수 전·완료 후 `npx vitest run` 필수.**

### 데이터 파이프라인 (중요 — 함정 있음)
```
scripts/{verb,expr,vocab}-src/*.json   ← 손편집 시드 (263파일)
  └→ scripts/generate-korean-data.mjs  → korean/data/{words,expressions,vocab-extended,…}.json
       └→ scripts/apply-curriculum-structure.mjs → korean/data/course.json (number=학습순서)
            └→ scripts/build-app-data.mjs        → korean/data/app-data.json (rich-chapters/*.json 병합, id로 spread)
                 └→ src/lib/data.js가 동기 import → 전 탭 소비
```
- **⚠️ 함정 #1 (치명)**: 커밋된 `vocab-extended.json`(2247 entries)은 현재 src 시드로 재생성 불가.
  `generate-korean-data.mjs`를 돌리면 **185개 항목이 소실**된다(한국어·예약·선물·드라마·환승 등,
  headword 기준 HEAD-only 185개). 2026-07-05 실측: 재생성 시 vocab-extended 2247→2059, app-data 3768→3528.
  → **WS2 완료 전까지 `generate-korean-data.mjs` 실행 금지.** `build-app-data.mjs`(rich-chapter 병합)만 안전.
- 함정 #2: 프로젝트 경로가 샌드박스 read-denied라 Bash/python은 `dangerouslyDisableSandbox: true` 필요 (Claude Code 실행자용 메모).
- 함정 #3: `scripts/rich-chapters/chapter-NN.json`의 NN은 **id**(불변)이며 화면 표시 번호(number)와 다르다. number는 `apply-curriculum-structure.mjs`의 `order` 배열 position이 부여.

### 번들 실측 (dist)
| 청크 | 크기 | gzip |
|---|---|---|
| `data-*.js` (app-data.json 전체) | **17.6 MB** | **4.94 MB** |
| `index-*.js` (앱 코드) | 230 KB | 70 KB |
| `index-*.css` | 105 KB | 16 KB |

app-data.json 섹션별 (raw JSON): extendedVocab **9.0MB** / expressions **4.2MB** / words **2.8MB** /
course 1.7MB / patterns 0.5MB / grammar 0.3MB / 나머지(each) ≤0.2MB. 총 18.8MB, 3,768 entries.

### 진도 저장 (전부 localStorage)
`src/lib/stores.js`: `kcs.progress`(챕터 완료 Set) · `kcs.lesson-activity-v1` · `kcs.guide-ready-v1` ·
`kcs.shadow-done-v1` · `kcs.roman`. `src/lib/srs.js`: `ksrs-v1`(Leitner 7-box). `src/lib/mistakes.js`도 확인할 것.

---

## 1. 워크스트림 총괄

| WS | 제목 | 우선순위 | 규모 | 의존성 |
|----|------|---------|------|--------|
| WS1 | 데이터 분할 로딩 (20MB → 코어 즉시 + 지연 로드) | **P1** | 대 | 없음 |
| WS2 | 파이프라인 정합성 복구 (재생성 안전화) | **P1** | 중 | 없음 (WS1과 병렬 가능) |
| WS3 | 진도 내보내기/가져오기 | P1 | 소 | 없음 |
| WS4 | 온보딩 + 레벨 배치 테스트 | P2 | 중 | WS1 권장(첫 로딩 체감) |
| WS5 | SRS 전면화 (오늘의 복습 + 스트릭) | P2 | 중 | 없음 |
| WS6 | 쓰기 과제 자기평가 강화 | P2 | 소 | 없음 |
| WS7 | Roleplay 채점 완화 | P2 | 중 | 없음 |
| WS8 | 문법 갭필(-지요/죠 · 반말 확장 · -(으)ㅂ시다) | P2 | 소 | WS2 이후 권장 |
| WS9 | PWA/오프라인 | P3 | 중 | **WS1 필수** |
| WS10 | 고품질 오디오 | P3(최후) | 대 | 사용자 별도 승인 필요 |

**권장 실행 순서**: WS2 → WS1 → WS3 → WS5 → WS4 → WS6 → WS8 → WS7 → (P3는 별도 논의)
WS2를 먼저 두는 이유: WS1이 build-app-data를 손대는데, 그 전에 "재생성 금지" 지뢰부터 제거해야
이후 모든 콘텐츠 작업(WS8 포함)이 안전해진다.

---

## 2. WS1 — 데이터 분할 로딩

### 목표
첫 페인트에 필요한 데이터만 즉시 로드. 목표 수치: **초기 데이터 gzip ≤ 1.2MB** (현 4.94MB),
Dictionary 첫 진입 시 추가 로드 허용(스피너 1회), 이후 캐시.

### 분할 설계 (build-app-data.mjs가 4파일 산출)
| 파일 | 내용 | raw 예상 |
|---|---|---|
| `app-core.json` | course(리치챕터 병합 완료) + grammar + activities + guide + dialogues + conversations + patterns + newcomerVocab | ~3.5MB |
| `app-words.json` | words (545) | ~2.8MB |
| `app-expressions.json` | expressions (788) | ~4.2MB |
| `app-extended.json` | extendedVocab (2247) | ~9.0MB |

추가 산출: `app-index.json` — 전 3,768 entries의 슬림 인덱스
`{id, hangul, romanization, english, level, type, partOfSpeech, topic, section}` (section ∈ words|expressions|extended).
raw ~600KB 예상. Dictionary 목록/검색/필터는 인덱스만으로 렌더 → 상세(EntryDetail) 열 때 해당 섹션 로드.

### 로더 설계 (`src/lib/data.js` 개조 — 소비자 6개 라우트의 import 시그니처 유지가 핵심)
```js
// 동기 유지 (코어에 포함되므로 기존 코드 무수정):
export let chapters, grammar, activities, guideTracks, dialogues, conversations, ...
// 변경:
export const entries = []            // 시작은 index 기반 슬림 항목, 섹션 도착 시 hydrate
export const dataState = writable({ core: false, words: false, expressions: false, extended: false })
export async function ensureSection(name)   // idempotent, 실패 시 1회 재시도
export function findEntry(id)               // 슬림 → hydrate되면 풀 엔트리 반환
```
- 부트 시퀀스: `main.js`에서 `Promise.all([core, index, words])` 후 앱 마운트(스켈레톤 스플래시 표시).
  words까지 포함하는 이유: Learn 챕터 어휘·Practice 퀴즈가 words에 의존 → 끊김 없는 UX.
  (core+index+words gzip 합계 ≈ 1.1~1.2MB 예상 — 목표 충족, 실측으로 검증할 것)
- Dictionary 진입: `ensureSection('expressions')` + `ensureSection('extended')` 병렬, 로딩 바 표시.
- EntryDetail: 슬림 항목이면 해당 섹션 로드 후 렌더 (로딩 상태 UI 필요).
- `tagB1()`(data.js 내 B1 승격 로직)은 core+index 도착 시점에 인덱스에 적용, hydrate 시 재적용.
- aliasIds 해석(중복 표현 → richest 병합)은 인덱스 생성 시점에 build 스크립트에서 미리 계산해 인덱스에 굽는다.
- fetch 경로: `import.meta.env.BASE_URL + 'data/app-core.json'` — JSON은 `public/data/`로 복사(빌드 스크립트가 emit)
  하거나 `?url` import. **dynamic `import()` of JSON 대신 fetch를 권장** (Vite가 JSON을 JS로 감싸는 오버헤드 제거,
  브라우저 캐시 활용). vite.config의 `manualChunks` data 항목은 제거.

### 수용 기준
1. `npm run build` 후 초기 로드 대상(gzip 합) ≤ 1.2MB — CI성 검증 스크립트 `scripts/check-bundle-size.mjs` 추가(초과 시 exit 1).
2. 전 탭 스모크: Learn 챕터 열기(어휘 표시), Practice 퀴즈 1회, Dictionary 검색→상세, Guide/Shadow/Roleplay 렌더.
3. 기존 134 테스트 + 신규 로더 테스트(섹션 hydrate·findEntry 슬림→풀 전환·ensureSection 멱등성) green.
4. 오프라인 아님·네트워크 실패 시: 재시도 버튼 있는 에러 상태(무한 스피너 금지).

---

## 3. WS2 — 파이프라인 정합성 복구

### 목표
`node scripts/generate-korean-data.mjs && node scripts/apply-curriculum-structure.mjs && node scripts/build-app-data.mjs`
전체 재실행이 **커밋된 데이터와 항목 수/headword 집합이 동일**한 결과를 내도록 만든다.

### 작업 설계
1. **소실분 역추출**: HEAD의 `korean/data/vocab-extended.json`·`words.json`·`expressions.json`에서
   재생성본에 없는 항목(headword 기준, 2026-07-05 실측 185개 + expressions 쪽 역방향 19개도 조사)을 추출.
2. **원인 분류**: (a) src 시드에 아예 없는 항목 → 새 시드 파일 `scripts/vocab-src/recovered-*.json`으로 저장,
   (b) generate 스크립트의 필터/중복제거 로직이 떨어뜨리는 항목 → 로직 수정, (c) 과거 수동 편집 항목 → 시드화.
   ※ expressions는 재생성본이 오히려 19개 **많았음**(857→876) — 신규 시드가 이미 추가된 것. 이 19개는
   "생성돼야 정상"이므로 유지하되, 커밋 데이터에 없던 이유를 확인하고 함께 반영.
3. **가드 추가**: `scripts/verify-data-integrity.mjs` 신설 —
   재생성 결과의 섹션별 카운트·headword 집합을 `scripts/data-manifest.json`(체크인)과 대조, 다르면 diff 출력 후 exit 1.
   generate 스크립트 말미에서 자동 호출.
4. **문서화**: `scripts/README.md`에 파이프라인 순서와 "manifest 갱신 절차" 명시.

### 수용 기준
- 전체 파이프라인 재실행 → `git diff --stat korean/data/`가 의미적 no-op(항목 수 동일, headword 집합 동일.
  예문 텍스트는 커밋본과 동일해야 함 — 38개 예문 패치가 src에도 반영돼 있으므로 자연 충족).
- verify 스크립트가 인위적으로 항목 1개 제거 시 실패하는 것을 테스트로 확인.
- app-data 3,768 entries 유지. 134 테스트 green.

---

## 4. WS3 — 진도 내보내기/가져오기

### 설계
- `src/lib/backup.js` 신설: `exportProgress()` → `{version: 1, exportedAt, keys: {...}}` JSON.
  대상 키: `kcs.progress`, `kcs.lesson-activity-v1`, `kcs.guide-ready-v1`, `kcs.shadow-done-v1`,
  `kcs.roman`, `ksrs-v1`, mistakes 저장 키(`src/lib/mistakes.js`에서 확인), Roleplay/Practice가 쓰는 여타 `kcs.*` 키 전수 조사 후 포함.
- `importProgress(json)`: version 체크 → 키별 **병합**(Set류는 합집합, SRS는 카드별 `reps` 큰 쪽 우선) — 덮어쓰기 아님.
  잘못된 파일이면 아무것도 변경하지 않고 에러 리턴(원자성).
- UI: Guide 탭(또는 설정 영역)에 "학습 기록 백업" 카드 — 내보내기(파일 다운로드 `kcs-progress-YYYYMMDD.json`) / 가져오기(파일 선택).
- 내보내기 후 마지막 백업 시각을 localStorage에 기록, 30일 경과+진도 존재 시 부드러운 리마인더 배지.

### 수용 기준
- 라운드트립 테스트: export → localStorage 전체 삭제 → import → 모든 스토어 원복.
- 병합 테스트: 서로 다른 두 기기 시나리오(교집합+각자 고유 진도) → 합집합.
- 손상 JSON/버전 불일치 → 상태 무변경 + 사용자 에러 메시지.

---

## 5. WS4 — 온보딩 + 레벨 배치 테스트

### 설계
- 첫 방문(진도 0 & `kcs.onboarded-v1` 없음) 시 Learn 위에 온보딩 화면:
  1. 환영 + 앱 구조 1화면 요약 (단어→문법→대화→연습 흐름).
  2. 선택지: "처음부터(1과)" / "배치 테스트(3분)".
- 배치 테스트: `src/lib/placement.js` + `PlacementQuiz.svelte`.
  - 문항 뱅크는 **기존 챕터 inlineExercises에서 판별력 높은 것 선별**해 `scripts/placement-bank.json`으로 큐레이션(신규 생성 아님 — 콘텐츠 재사용).
  - 적응형 3라운드: A1 5문항 → 정답률 ≥80%면 A2 5문항 → ≥80%면 B1 5문항. 결과 = 마지막으로 80% 넘긴 레벨의 다음 트랙 시작 챕터.
  - 시작점 매핑: A1 시작=1과 / A2 시작=12과 / B1 시작=35과 (number 기준, `curriculumStructure.js`의 트랙 경계 상수를 단일 소스로).
- 결과 화면: "N과부터 시작 추천" + 이전 챕터들은 잠그지 않음(추천만). `kcs.start-chapter-v1` 저장,
  Learn 상단 "이어서 학습" 카드가 이 값 또는 마지막 미완료 챕터를 가리킴.

### 수용 기준
- 신규 사용자 플로우 E2E(테스트: placement 채점 로직 단위 테스트 + 시작점 매핑 테스트).
- 기존 사용자(진도 존재)는 온보딩 절대 안 뜸. "다시 배치 테스트" 진입로를 Guide에 제공.

---

## 6. WS5 — SRS 전면화

### 설계 (srs.js는 이미 견고 — 노출·유입이 문제)
1. **유입 자동화**: 퀴즈/연습 오답 시 해당 entry를 SRS에 자동 추가(현재 수동 추가 경로 조사 후 보강).
   Roleplay/쓰기에서 학습자가 별표한 항목도 addCard.
2. **홈 노출**: Learn 상단(LearnMissionPanel)에 "오늘의 복습 N개" 카드 — due 카드 수 표시, 탭하면 ReviewSession.
   BottomNav Practice 아이콘에 due 뱃지(9+ 표기).
3. **스트릭**: `src/lib/streak.js` — 하루 1активity(레슨 화면 완료·복습 1회·쓰기 제출)면 스트릭 +1.
   자정 경계는 로컬 타임존. 어제 놓치면 0으로(용서 토큰 없음 — v1은 단순하게). Learn 헤더에 🔥N 표시.
4. **일일 목표**: 기본 "복습 다 비우기 + 새 화면 10개". 설정 불필요(v1 고정).

### 수용 기준
- 오답→SRS 유입 단위 테스트. due 계산·뱃지 표시 테스트. 스트릭 경계(자정 전후·연속·단절) 테스트.
- Practice 탭에서 due=0일 때의 빈 상태 디자인(다음 due 시각 안내) 포함.

---

## 7. WS6 — 쓰기 과제 자기평가 강화

### 설계 (전 65과에 writingTask 있음 — commit `46793a7`)
- LessonPlayer 쓰기 화면에 textarea(현재 UI 확인 후 없으면 추가) + 제출 시:
  1. 모범답안 비교 표시(현행 유지).
  2. **자기 체크리스트**: 챕터 grammarNotes 제목에서 자동 생성 — "이 글에 [문법명]을 썼나요?" 체크박스.
     전부 체크해야 화면 완료 처리(정직성은 학습자 몫 — 채점 아님).
  3. 제출 글을 `kcs.writings-v1`(localStorage, {chapterId, text, date})에 저장.
- Guide 또는 Learn 완료 화면에 "내가 쓴 글" 아카이브 목록(챕터별, 다시 쓰기 버튼).
- WS3의 백업 대상 키에 `kcs.writings-v1` 포함(WS3 먼저 끝났으면 그쪽 스펙에 추가 반영).

### 수용 기준
- 체크리스트가 챕터 문법 수와 일치. 저장·아카이브 렌더 테스트. 빈 제출 방지.

---

## 8. WS7 — Roleplay 채점 완화

### 설계 (백로그 해소 — `src/routes/Conversation.svelte`)
- 현행 채점 로직을 먼저 **정독**하고 실패 사례를 수집할 것(브리틀의 실체 파악이 선행).
- 방향: 정확 일치/포함 매칭 → 3단계 판정으로:
  1. **핵심 토큰 매칭**: 기대 답의 핵심 형태소(조사 제거·활용 정규화 — `conjugation.js`/`hangul.js` 재사용)가 포함되면 통과.
  2. **부분 점수**: 핵심 토큰 일부만 → "거의 다 왔어요" + 빠진 요소 힌트(정답 노출 없이 문법명/첫 글자).
  3. **2회 실패 시**: 모범답안 보여주고 따라 쓰기로 통과 처리(막힘 방지 — 학습 지속이 목표).
- 외부 API 채점(LLM)은 이번 범위 **밖**(정적 사이트 유지). 규칙 기반으로만.

### 수용 기준
- 기존 실패했던 자연스러운 응답 샘플 ≥10개를 테스트 케이스로 고정(조사 생략·어순 변화·유의어 활용형).
- 오답이 통과되는 false-positive 테스트도 ≥5개(엉뚱한 답은 여전히 실패해야).

---

## 9. WS8 — 문법 갭필 (감사에서 확인된 진짜 빈틈 3개)

| 갭 | 반영 위치 (id 기준) | 형태 |
|---|---|---|
| -지요/죠 (확인·동의) | chapter-35(Discourse Markers) 또는 chapter-12 — 실행자가 grammarNotes 흐름 보고 판단 | grammarNote 1개 추가 |
| 반말 확장 (평서·의문·청유·명령 세트) | chapter-33(Speech Levels)에 노트 1~2개 증설 | grammarNote + 대화 예 |
| -(으)ㅂ시다 (격식 청유) | chapter-24(Suggestions) — -(으)ㄹ까요 옆에 대비로 | grammarNote 1개 추가 |

- 스키마는 기존 textbook-grade 형식 그대로: `{title, func, formTable, examples×4, keyPoint, pronunciation, drill, englishSpeakerPitfall}`.
- 고빈도 어휘만, 해요체 기본. **rich-chapters/*.json 편집 → build-app-data만 재실행** (WS2 전이라면 generate 금지).
- 추가 후 해당 챕터 LessonPlayer 화면 수가 늘어나는 것 확인(문법 1노트=1화면).

### 수용 기준
- 노트 수 검증(python으로 before/after 카운트), 빌드·테스트 green, 프리뷰에서 새 화면 렌더 확인.

---

## 9.5. C-시리즈 — 교육 콘텐츠 보강 (상세: [v2-upgrade/09-content-enrichment.md](v2-upgrade/09-content-enrichment.md))

기술 WS와 별도의 콘텐츠·교수법 트랙. 실측 근거: 듣기 연습 0개(4기능 중 유일 공백), 연습문제
챕터당 중앙값 5개에 70% 객관식 편중, 문법 대조 뱅크 8쌍, 활용 데이터(495동사×15형)는 있으나 드릴 없음.

| # | 내용 | 규모 | 비고 |
|---|---|---|---|
| C1 | 듣기 트랙(받아쓰기+듣고 고르기, TTS 기반) | 중 | 신규 콘텐츠 불필요 — 기존 문장 파생 |
| C5 | 활용 트레이너(495동사×15형 드릴) | 소~중 | 원료 완비, 가성비 최고 |
| C2 | 연습문제 확충(챕터당 5→10, 유형 6종: +조사 고르기·활용 변형·어순 조립) | 대 | 생성→교차리뷰 파이프라인 |
| C3 | 누적 복습 유닛(A1/A2/B1 체크포인트 + 나선형 섞기) | 중 | 잠금 없음 원칙 유지 |
| C4 | 문법 대조 뱅크 8→30쌍(에vs에서, -아서vs-니까 등) | 소~중 | 기존 UI 재사용 |
| C6 | 읽기 자료실(레벨별 장문 20편, 탭 글로스+이해문항) | 대 | 어휘 커버리지 ≥85% 요구 |
| C7 | 한자어 어근 패밀리 40개(학·생·식…) | 중 | B1+ 어휘 확장 장치 |
| C8 | 발음 미니멀 페어 | 소 | TTS 품질 검증 통과분만, 실험적 |

권장 순서(사용자 결정 2026-07-05: 듣기·TTS는 최후순위): **C0 → C5 → C2 → C3 → C4 → C6 → C7**,
C1·C8은 오디오 단계(WS10)와 함께. 기술 WS와 병행 가능(단 WS2 이전 generate 금지 동일).
각 항목의 실행자용 상세 스펙은 [v2-upgrade/](v2-upgrade/00-README.md)에 개별 파일로 존재.

**C0 — 기초 어휘 기반 정비 (콘텐츠 0순위, 2026-07-05 감사 결과)**: 표준 A1 필수어 175개 감사 결과
콘텐츠는 98% 존재하나 **74%(129개)가 A2로 오태깅**(생성기 기본값 탓 — 하나·엄마·월요일·빨간색이 전부 A2 라벨,
A1 라벨은 동사 88%)이고, 필수어 표본의 41%가 어느 챕터에도 연결 안 돼 코스 동선 밖에 떠 있다.
→ 레벨 재태깅 + 생성기 기본값 제거 + 주제 어휘 팩 8개(숫자·요일·가족·색·몸·음식·집·직업)를 챕터 사이에 배치.
상세: [v2-upgrade/c0-beginner-foundation.md](v2-upgrade/c0-beginner-foundation.md)

## 10. P3 (이번 라운드 범위 밖 — 설계 착수 조건만)
- **WS9 PWA**: WS1 완료 후. service worker로 data/*.json + 앱 셸 캐시, 업데이트 토스트. manifest.json + 아이콘.
- **WS10 오디오**: 사용자가 명시적으로 승인할 때만(비용). 후보: 핵심 대화 각 챕터 1개 × 65 고품질 TTS 사전 생성 → 정적 mp3.
  Web Speech는 폴백으로 유지. **사용자가 "오디오는 가장 마지막"이라고 못박음.**

---

## 11. 실행자 공통 규칙 (모든 WS)
1. 브랜치 `hanmok-redesign`에서 작업. **커밋·푸시·배포는 사용자가 명시 요청할 때만.**
2. 착수 전 `npx vitest run`으로 기준선 green 확인 → 완료 후 다시 green + `npm run build` 성공.
3. **WS2 완료 전 `generate-korean-data.mjs` 실행 금지** (185개 소실). rich-chapter/콘텐츠 작업은 `build-app-data.mjs`만.
4. 콘텐츠(한국어 문장) 생성 시: 고빈도 일상 어휘만(사용자가 '명함'류 저빈도어 명시 거부), 해요체 기본, 로마자 병기 규칙은 기존 데이터 형식 따름.
5. UI 문자열은 영어(제품), 사용자 응대는 한국어.
6. 각 WS 완료 시 이 문서의 해당 섹션에 `✅ done (날짜, 커밋)` 마킹하고 변경 요약 1줄 추가.
