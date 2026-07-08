# WS6 — 쓰기 과제 자기평가 강화

우선순위 P2. 규모: 소. 의존: 없음(WS3 완료 시 BACKUP_KEYS 한 줄 추가).
목표 한 줄: "쓰고 → 목표 문법을 썼는지 스스로 점검하고 → 쓴 글이 쌓이는" 루프를 만든다.

## 현재 사실 (LessonPlayer.svelte 323행 부근 실측)
- 전 65과에 `writingTask {prompt, hint, model, modelEn}` 존재(commit 46793a7).
- 쓰기 화면: prompt/hint + `<textarea bind:value={answers[i]}>` + `<details>` 모범답안. **제출 개념 없음**,
  글은 화면 이동하면 휘발(answers는 컴포넌트 로컬), 점검 장치 없음.
- 챕터 문법: `chapter.grammarNotes[].title` (예: "-았/었어요 — Past Tense"). LessonPlayer가 이미 chapter를 받는다.

## 구현

### 1. 자기 체크리스트
- 쓰기 화면에 textarea 아래 "쓴 글 점검" 블록 추가. 항목 = 각 grammarNote에서 자동 생성:
  - 라벨: grammarNote.title에서 **한국어 형태 부분만** 추출해 "『{형태}』를 썼나요?" 형식.
    추출 규칙: title이 대개 `"{한국어형태} — {영어설명}"` 꼴 → `—`(em-dash) 앞부분 trim.
    em-dash 없으면 title 전체 사용. 유틸 `grammarFormLabel(title)`을 `src/lib/lessonPlan.js`에 추가 + 테스트.
  - 각 항목은 체크박스. **모두 체크해야 next(Finish 방향) 활성화** — 단, "건너뛰기(그냥 넘어갈래요)"
    텍스트 버튼을 작게 제공(강제가 학습 이탈을 만들면 안 됨. 건너뛰면 체크 없이 통과).
- 참고: 자동 채점이 아니다. 정직성은 학습자 몫 — UI 문구도 "스스로 확인해 보세요" 톤.

### 2. 글 저장: 키 `kcs.writings-v1`
- 구조: `{ [chapterId]: [{text, date, checked: bool}] }` — 챕터당 배열(다시 쓰기 누적, 최신이 마지막).
- 저장 시점: 체크리스트 완료(또는 건너뛰기) 후 next로 화면을 떠날 때, `text.trim()` 비어있지 않으면.
- `src/lib/writings.js` 신설: persistedObject 패턴 재사용(`stores.js`의 헬퍼 참고하되 순환 import 주의 —
  stores.js에 두는 것도 허용, 실행자 판단), `saveWriting(chapterId, text, checked)`, `writingsByChapter` 스토어.
- 항목당 2,000자 제한(초과분 자름), 챕터당 최근 10개만 유지(오래된 것 drop) — localStorage 용량 보호.

### 3. 아카이브 UI: "내가 쓴 글"
- 위치: LessonPlayer **완료 화면**(dojang 도장 아래)에 "이 챕터에서 쓴 글 N개" 접이식 목록 +
  Guide 탭에 전체 아카이브 카드(챕터별 그룹, 최신순, 각 항목에 날짜·본문·[이 챕터 다시 쓰기] 버튼 → 챕터 열기).
- 빈 상태: "아직 쓴 글이 없어요 — 각 챕터 마지막 '"Write it'" 화면에서 써 보세요."

### 4. 연동
- WS3가 완료돼 있으면 `src/lib/backup.js` BACKUP_KEYS에 `'kcs.writings-v1'` 추가 + 병합 규칙:
  챕터별 배열 concat 후 date 기준 정렬·중복(text+date 동일) 제거·10개 컷.
- WS5가 완료돼 있으면 저장 시 `recordActivity()` 호출(스트릭 인정).

## 테스트
- `grammarFormLabel`: em-dash 有/無, 공백, 영어만 있는 title.
- 저장: trim-빈 글 저장 안 됨 / 2,000자 컷 / 10개 롤링.
- 체크리스트: grammarNotes 3개 챕터 → 체크박스 3개, 전부 체크 전 next 비활성, 건너뛰기로 통과.
- 아카이브 렌더(빈/1개/여러 챕터).

## 수용 기준
1. 챕터에서 글 작성→체크→완료→완료 화면과 Guide 아카이브에 글이 보인다(수동 E2E 1회).
2. 새로고침 후에도 글 유지. 3. grammarNotes 없는 챕터(있다면 ch1)에서 체크리스트가 비어도 에러 없음.
4. 전 테스트 green + build. 5. 모바일 375px 레이아웃 정상.

## 하지 말 것
- LLM/API 채점(정적 사이트 유지). 문법 자동 검출(형태소 분석 없이 부정확 — 하지 않는다).
- 모범답안과 유사도 점수(오해 유발).

## 완료 기록
2026-07-08 Codex(GPT-5.5)

- 변경 파일:
  - `src/lib/lessonPlan.js`, `src/lib/lessonPlan.test.js` — `grammarFormLabel`, `grammarSelfCheckItems` 추가. em dash 앞 형태 추출, 영어 gloss 제거, 한국어 괄호 우선 추출.
  - `src/lib/writings.js`, `src/lib/writings.test.js` — `kcs.writings-v1` 저장소, 빈 글 제외, 2,000자 제한, 챕터별 최신 10개, 백업 병합 helper.
  - `src/lib/components/LessonPlayer.svelte`, `src/lib/components/lessonPlayer/LessonScreen.svelte`, `src/lib/components/lessonPlayer/PracticeScreen.svelte`, `src/lib/components/LessonPlayer.test.js` — 쓰기 체크리스트, Skip self-check, Finish 잠금, 저장 시 `recordActivity()` 연결.
  - `src/lib/components/lessonPlayer/LessonComplete.svelte`, `src/lib/components/WritingArchive.svelte`, `src/lib/components/WritingArchive.test.js`, `src/routes/Guide.svelte` — 완료 화면 챕터별 글 목록, Guide 전체 글 아카이브, 챕터 다시 쓰기 버튼.
  - `src/lib/backup.js`, `src/lib/backup.test.js`, `docs/superpowers/specs/v2-upgrade/00-README.md`, `docs/superpowers/specs/v2-upgrade/ws3-progress-backup.md` — `kcs.writings-v1` 백업 대상/병합 규칙과 키 표 반영.
- 테스트/검증:
  - `npx vitest run src/lib/lessonPlan.test.js src/lib/writings.test.js src/lib/components/LessonPlayer.test.js src/lib/components/WritingArchive.test.js src/lib/backup.test.js` — 5 files / 23 tests passed.
  - `npm run preflight` — 51 files / 253 tests passed, build passed, boot data gzip 1,099,441 bytes PASS, content lint PASS.
  - Playwright manual QA: `chapter-19`에서 Write it까지 이동, 체크 전 Finish disabled, 체크 후 enabled, 완료 화면 "이 챕터에서 쓴 글 1개", Guide "내가 쓴 글" 저장 확인, "이 챕터 다시 쓰기"가 `#/learn?chapter=chapter-19`로 이동 확인.
  - 캡처: `.omo/evidence/ws6-writing-self-check/{desktop-writing-checked.png,desktop-complete-archive-open.png,desktop-guide-archive.png,mobile-writing-checklist.png}`. 1280px/375px 모두 horizontal overflow 0, console error 0.
- 남긴 이슈:
  - LLM/API 채점, 문법 자동 검출, 모범답안 유사도 점수는 스펙상 범위 밖이라 추가하지 않음.
