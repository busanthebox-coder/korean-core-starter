# WS5 — SRS 전면화 (오늘의 복습 + 스트릭)

우선순위 P2(체감 최대). 규모: 중. 의존성 없음.
목표 한 줄: 잘 만들어진 SRS(`src/lib/srs.js`)를 **눈에 띄고, 자동으로 차게** 만든다.

## 현재 사실
- `srs.js`: Leitner 7-box(0,1,3,7,16,35,90일 / again=10분), `reviews` 스토어(키 `ksrs-v1`),
  `addCard/gradeCard/dueIds/summarize` 존재, 테스트 있음.
- Practice.svelte: `dueCards = dueIds($reviews).map(findEntry)...slice(0,40)`, `startReview()`,
  `addSet()`(수동으로 세트 추가) — **유입이 수동 중심**이라 대부분의 사용자에게 SRS가 빈다.
- 오답 기록은 별도 시스템(`mistakes.js`, `kcs.mistakes-v1`)에 쌓이고 SRS와 연결 안 됨.
- Learn 상단에 `LearnMissionPanel.svelte`(props: `mission {dueCount, weakCount, steps}, onOpenChapter,
  doneCount, totalChapters`) — 이미 due/weak 수를 받게 돼 있음. Learn.svelte에서 어떻게 채우는지 확인 후 활용.

## 구현

### 1. 오답 → SRS 자동 유입
- 오답이 기록되는 모든 지점을 찾는다: `grep -rn "mistakes.record\|recordMistakes" src/` —
  Practice 퀴즈, MatchGame, LessonPlayer 연습(있다면), Conversation 등.
- 각 지점에서 `reviews.addMany(ids)`를 함께 호출(이미 카드면 addCard가 no-op이므로 안전).
- 원칙: **오답 = 자동 등록, 정답은 등록 안 함**(덱 오염 방지). 기존 수동 addSet 경로는 유지.
- LessonPlayer 챕터 완료 시: 그 챕터 연습에서 틀린 항목만 유입(전체 어휘 자동 등록 금지 — 덱 폭발 방지).

### 2. "오늘의 복습" 노출
- **Learn 상단**: LearnMissionPanel의 mission.steps 첫 항목으로 due>0이면
  `"복습 N개 비우기"` 스텝 추가(탭하면 `#/practice`로 이동 + 자동으로 review 스테이지 진입).
  Practice로 넘길 때 자동 시작 신호는 해시 쿼리(`#/practice?review=1`) 또는 세션 플래그 —
  svelte-spa-router의 querystring 처리 방식을 확인해 택1.
- **BottomNav Practice 아이콘 뱃지**: `src/lib/components/BottomNav.svelte`에 due 수 뱃지
  (persimmon 배경, 9 초과 시 `9+`). due 계산은 `derived(reviews, ...)` 스토어를 srs.js에 추가:
  ```js
  export const dueCount = derived(reviews, ($r) => dueIds($r).length);
  ```
  주의: due는 시간 경과로도 변한다 → 1분 interval로 재계산하는 가벼운 tick 스토어와 결합(포커스 시에도 갱신).
- **빈 상태**: due=0이면 Practice 복습 카드에 "다 비웠어요 🎉 다음 복습: {가장 이른 due 시각 상대표기}" 표시.

### 3. 스트릭: `src/lib/streak.js` 신설 (키 `kcs.streak-v1`)
```js
// {current, best, lastDay}  — lastDay = 'YYYY-MM-DD' 로컬 타임존
export function touchStreak(state, now = new Date())
// 오늘 이미 기록 → 그대로 / 어제였음 → current+1 / 그 외 → current=1. best 동기 갱신.
export const streak = writable(...persist...)
export function recordActivity()   // touchStreak 적용
```
- `recordActivity()` 호출 지점: 레슨 화면 완료(LessonPlayer next에서 1회/일 디바운스),
  ReviewSession 카드 1장 채점, 쓰기 제출(WS6 이후), Shadow "Mark done".
- 표시: Learn 헤더(챕터 목록 상단) `🔥 N일` — 0이면 숨김. 과한 게임화 금지(v1: 배지·보상 없음).
- 자정 경계는 **로컬 자정**. `lastDay` 문자열 비교로 구현(타임스탬프 비교 금지 — DST/타임존 함정).

### 4. WS3 연동
- `kcs.streak-v1`을 `src/lib/backup.js`의 BACKUP_KEYS에 추가(WS3 완료돼 있다면).
  병합 규칙: `best`는 max, `current/lastDay`는 lastDay 최신 쪽.

## 테스트
- 스트릭: 오늘 2회 →1 / 어제→오늘 →+1 / 그제→오늘 →1 리셋 / best 유지. 날짜 문자열 경계(월말·연말).
- 오답 유입: 퀴즈 오답 시 reviews에 카드 생성, 정답 시 생성 안 됨(관련 컴포넌트 테스트에 케이스 추가).
- dueCount derived 스토어 계산.
- LearnMissionPanel: due>0일 때 복습 스텝 렌더(기존 컴포넌트 테스트 관례 따름).

## 수용 기준
1. 새 사용자가 퀴즈에서 3개 틀리면 → Practice 뱃지 3 → 복습 세션에서 그 3개가 나온다 (수동 E2E 1회).
2. due=0 빈 상태에 다음 복습 시각 안내. 3. 스트릭이 이틀 연속 활동으로 2가 됨(시스템 시계 mock 테스트).
4. 전 테스트 green + build. 5. 모바일 375px에서 뱃지/카드 레이아웃 정상.

## 하지 말 것
- SRS 알고리즘 변경(Leitner 유지 — 이미 테스트된 코어). 알림(Notification API)·리그·XP(범위 밖).
- 챕터 전체 어휘 자동 등록(덱 폭발).

## 완료 기록
(실행자가 작성)
