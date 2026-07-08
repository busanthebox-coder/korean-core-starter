# WS4 — 온보딩 + 레벨 배치 테스트

우선순위 P2. 규모: 중. 의존: 없음(WS1 이후 권장 — 첫 로딩 체감이 좋아진 뒤가 자연스러움).
목표 한 줄: 첫 방문자가 3분 안에 "내 시작점"을 알고 학습을 시작한다. 잠금은 없다 — 추천만.

## 현재 사실
- 신규 사용자는 무조건 Learn 챕터 목록(1과부터). 온보딩·배치 없음.
- 트랙 경계(표시 number 기준): **A1 = 1–11 / A2 = 12–34 / B1 = 35–56 / B2 = 57–63 / C1 = 64** (65는 종합).
  단, 하드코딩하지 말 것 — `src/lib/data.js`의 chapters에서 `level`(또는 curriculumTrack.cefr)로
  "각 레벨의 첫 챕터"를 계산하는 헬퍼를 `src/lib/curriculumStructure.js`에 추가:
  ```js
  export function firstChapterOfLevel(chapters, cefr) // → chapter | null
  ```
- 챕터에는 `inlineExercises`(rich)와 `checkpoints`가 있다 — 배치 문항의 원천.
- 신규 키: `kcs.onboarded-v1`('1'), `kcs.start-chapter-v1`(chapter id 문자열). WS3 BACKUP_KEYS에 추가.

## 구현

### 1. 문항 뱅크 큐레이션 (콘텐츠 작업 — 코드보다 먼저)
- 산출: `src/lib/placementBank.json` (앱 번들에 포함, 작음 — 15~24문항).
- 원천: 기존 챕터 inlineExercises에서 **판별력 높은 4지선다**를 골라 복사(신규 창작 금지·수정은 오탈자만).
  레벨당 5~8문항, 각 문항 `{level: 'A1'|'A2'|'B1', type: 'choice', prompt, choices: [{ko|en, correct}], sourceChapterId}`.
- 선별 기준: (a) 그 레벨의 대표 문법을 정면으로 묻는다 (b) 어휘가 아닌 문법 판별 (c) 보기 간 혼동이
  실제 학습자 오류를 반영(예: A2 과거형 -았/었 vs 현재, B1 간접화법 -다고/-냐고).
- 실행자가 챕터를 훑어 고르되, 후보 목록과 선정 이유를 이 파일 하단 `## 문항 선정 기록`에 남긴다.

### 2. 배치 로직: `src/lib/placement.js` (순수 함수 — 테스트 대상)
```js
export function nextRound(state)      // 현재 라운드 결과로 다음 라운드('A2'|'B1') 또는 종료 판정
export function placementResult(answers) // → {recommendedLevel: 'A1'|'A2'|'B1', correctByLevel}
```
- 규칙: A1 5문항 → 정답 ≥4(80%)면 A2 5문항 → ≥4면 B1 5문항 → ≥4면 B1 후반이 아니라 **B1 시작 추천 유지**
  (B2 배치는 하지 않는다 — 저자극 원칙, B2는 스스로 도달).
- 추천 = 마지막으로 80%를 넘긴 레벨의 **다음 레벨 첫 챕터**. A1에서 <4면 1과(한글 포함) 추천.

### 3. UI: `src/lib/components/Onboarding.svelte`
- 노출 조건: `!localStorage['kcs.onboarded-v1'] && lessonProgress.size === 0`.
  Learn.svelte 최상단에서 조건부 풀스크린 오버레이(라우팅 추가하지 않음 — 단순하게).
- 화면 1(환영): 앱 한 줄 소개 + 학습 흐름 4아이콘(단어→문법→대화→연습) + 버튼 2개
  `[처음부터 시작]` `[3분 배치 테스트]`. 처음부터 → onboarded 기록 후 종료.
- 화면 2(테스트): 문항 1개씩, 진행바(현재 라운드/문항), 뒤로가기 없음, 중도 이탈 버튼(=처음부터 취급).
- 화면 3(결과): "**N과 {title}**부터 시작하는 걸 추천해요" + 근거 한 줄(레벨별 정답 수)
  + `[여기서 시작]`(해당 챕터 열기) / `[그래도 1과부터]`. 선택 즉시 `kcs.start-chapter-v1` 저장, onboarded 기록.
- 스타일: Hanmok 토큰(`--bg/--accent/.btn3d`), Fraunces 헤딩. 모바일 375px 우선.

### 4. "이어서 학습" 카드
- Learn 챕터 목록 상단(LearnMissionPanel 위 또는 통합)에 카드:
  대상 = `kcs.start-chapter-v1`(있고 미완료면) 또는 **첫 미완료 챕터**(표시 순서 기준).
  "이어서 학습 · N과 {title}" + 진행률. 탭하면 그 챕터 열기.
- 재배치 진입로: Guide 탭에 "배치 테스트 다시 보기" 링크(onboarded 무시하고 테스트만 실행).

## 테스트
- placement.js 순수 함수: 경계(4/5, 3/5), 3라운드 통과, A1 전패, 결과→챕터 매핑(firstChapterOfLevel mock).
- Onboarding 노출 조건: 진도 있으면 절대 안 뜸 / onboarded면 안 뜸.
- placementBank.json 스키마 검증 테스트(레벨당 ≥5문항, correct 정확히 1개씩).
- "이어서 학습" 대상 계산(완료 셋 조합별).

## 수용 기준
1. 신규 사용자 E2E: 환영→테스트(모두 정답)→B1 첫 챕터 추천→시작 (수동 1회 + 로직은 테스트로).
2. 기존 사용자(진도 1개라도)에게 절대 노출 안 됨. 3. 중도 이탈해도 다시 방문 시 안 뜸(처음부터로 기록).
4. 전 테스트 green + build. 5. 챕터 잠금이 어디에도 생기지 않았다.

## 하지 말 것
- 챕터 잠금/강제 경로. B2·C1 배치. 신규 문항 창작(기존 재사용만). 라우터에 /onboarding 경로 추가(오버레이로).

## 문항 선정 기록
2026-07-08 Codex

원칙: 기존 `inlineExercises`에서 문법 판별력이 있는 선택형만 골랐다. 어휘 뜻만 맞히는 문제는 제외했고,
레벨당 5문항으로 짧게 유지했다.

### A1
- `chapter-02` — `저___ 학생이에요.`: 은/는 주제 표지를 초급 초반에서 바로 판별한다.
- `chapter-03` — `저는 일본 사람이 아니에요.`: 명사 부정 `아니에요`를 단순 어휘가 아니라 문장 구조로 확인한다.
- `chapter-04` — `시간___ 있어요?`: `있어요/없어요` 존재문에서 이/가 주격을 고르는 대표 오류를 본다.
- `chapter-05` — `저는 아침___ 먹어요.`: 목적어 조사 을/를을 받침 기준과 함께 확인한다.
- `chapter-08` — `오늘 회의가 있어서 ___ 가요.`: 의지 부정 `안`과 불가능 `못`을 구분하게 한다.

### A2
- `chapter-17` — `어제 친구랑 영화를 봤어요.`: 과거 완료 동작을 현재/미래와 구분한다.
- `chapter-18` — `토요일에 카페에 갈 거예요.`: 미래 계획 `-(으)ㄹ 거예요`를 과거/상태문과 구분한다.
- `chapter-20` — `세 시 십 분`: 시간 표현에서 고유어 시간+한자어 분 조합을 확인한다.
- `chapter-25` — `비싸지만 맛있어요.`: 대조 연결 `지만`을 이유/시간 연결과 구분한다.
- `chapter-46` — `주말이니까 한 시간이라도 공부해요.`: 결정의 근거를 주는 `니까`와 양보/단순 서술을 구분한다.

### B1
- `chapter-37` — `금요일에 본다고 하셨어요.`: 평서 간접화법 `-다고`를 질문/명령 보고와 구분한다.
- `chapter-37` — `몇 시에 만나냐고 물어봤어요.`: 의문 간접화법 `-냐고`를 평서/명령 보고와 구분한다.
- `chapter-34` — `선생님께서 오세요.`: 높임 주체 조사 `께서`와 주체 높임 `-시-` 계열 감각을 확인한다.
- `chapter-39` — `야근할 수밖에 없어요.`: 불가피성 `-(으)ㄹ 수밖에 없다`를 단순 불가능/추측과 구분한다.
- `chapter-12` — `문 닫은 것 같아요.`: 상태 추측에서 관형형 `-(으)ㄴ`을 현재 동작 관형형과 구분한다.

## 완료 기록
2026-07-08 Codex
- 변경 파일:
  - `src/lib/placementBank.json` — A1/A2/B1 각 5문항, 기존 inlineExercises 기반 배치 문항 뱅크.
  - `src/lib/placement.js` — 4/5 경계 라운드 진행, A1/A2/B1 추천, 이어서 학습 대상 계산.
  - `src/lib/curriculumStructure.js` — `firstChapterOfLevel` 추가. 실제 트랙 값(`curriculumTrack.cefr`)을 오래된 `level`보다 우선한다.
  - `src/lib/components/Onboarding.svelte` — 신규 사용자 환영/배치 테스트/결과 오버레이.
  - `src/routes/Learn.svelte` — 신규 사용자 조건부 오버레이, `#/learn?placement=1` 강제 재진입, 추천 챕터 열기.
  - `src/lib/components/LearnPathView.svelte` — “이어서 학습” 카드.
  - `src/routes/Guide.svelte` — “배치 테스트 다시 보기” 진입 카드.
  - `src/lib/stores.js`, `src/lib/backup.js`, `src/lib/backup.test.js` — `kcs.onboarded-v1`, `kcs.start-chapter-v1` 저장/백업.
  - `index.html`, `public/favicon.svg` — production QA에서 favicon 404 콘솔 에러가 떠서 명시 favicon 추가.
  - `docs/superpowers/specs/v2-upgrade/00-README.md`, `ws3-progress-backup.md`, 본 파일 — 상태/키/선정 기록 갱신.
- 검증:
  - RED evidence: `.omo/ws4-red.txt`에서 `placement.js`, `placementBank.json`, `Onboarding.svelte` 부재 실패 확인 후 구현.
  - 집중 테스트: `npx vitest run src/lib/placement.test.js src/lib/placementBank.test.js src/lib/components/Onboarding.test.js src/lib/backup.test.js` — 18 tests passed.
  - 최종 테스트/빌드/콘텐츠: `npm run preflight` — 47 files / 237 tests passed, build passed, content lint passed.
  - favicon 반영 후 `npm run build && npm run lint:content` — build passed, content lint passed.
  - Playwright visual QA(production preview `http://127.0.0.1:5193/korean-core-starter/`):
    신규 온보딩, 모두 정답 시 B1 첫 트랙 챕터 추천, 기존 진도 보유자 미노출, 이어서 학습 카드, Guide 재진입, 콘솔 에러 0.
    Evidence: `.omo/evidence/ws4-visual-qa/visual-qa.json`.
- 남긴 이슈:
  - 배치 테스트는 추천만 한다. 챕터 잠금/강제 경로는 넣지 않았다.
  - 오디오는 사용자 방침대로 이후 단계로 남겼다.
