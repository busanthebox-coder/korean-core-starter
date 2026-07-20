# S2 — 레벨 게이트: Practice·Speak·Dictionary가 학습자 레벨을 알게

규모: 중. 의존: S1 권장(추천 순서가 맞아야 게이트가 티가 남).
목표 한 줄: "어려운 단어가 중간에 섞인다"의 세 진원지(Practice 전체풀·Speak A2 추천·Dictionary 전량)를
레벨 신호 하나로 막는다.

## 실측 근거 (2026-07-20)
- Practice 기본 덱 `all` = 전체 3,848개(B2·C1 포함) — `Practice.svelte: let deck = 'all'` → `return entries`.
- Speak 추천 섀도 = dialogues[0] = "Opening a Bank Account"(A2) — 레벨 무시 첫 미완료.
- Dictionary 기본 = 3,848개 전량 렌더(680 화면분).
- 챕터 단어 21개 사전 미등재(주세요·얼마예요·부터·까지·그럼·반갑습니다·찍다 등).

## 구현

### Part A. `learnerLevel()` (00-README §공통 참조)
1. `src/lib/learnerLevel.js` 신설 (TDD):
   - `learnerLevel({ placement, completedChapters, chapters })` → 'A1'|'A2'|'B1'|'B2'|'C1'.
   - max(배치테스트 레벨, 완료 챕터 최고 레벨), 신규 = A1. 강등 없음.
   - `levelCap(level)` = 한 레벨 위까지 허용 셋 (A1 → {A1,A2}). B2 학습자부터는 전체.
2. 저장 키 신설 없음 — `kcs.placement-v1`(WS4 기존)과 lessonProgress에서 파생.

### Part B. Practice 풀 게이트
1. 기본 덱 변경: `all` → **`recommended`** = (SRS due 카드) ∪ (현재 챕터 어휘) ∪ (levelCap 내 최근 3챕터 어휘).
   비어 있으면 levelCap 내 전체로 폴백.
2. `all` 덱은 유지하되 levelCap 필터 기본 적용 + **"모든 레벨 포함" 토글**(세션 한정, 저장 안 함)으로 해제 가능.
3. 퀴즈 오답 보기(distractor) 생성 경로(quiz.js)를 실측해 같은 levelCap 풀에서만 뽑도록 — 정답이 A1인데
   오답 보기가 B2면 소거법으로 풀린다(기존 시험 품질 작업과 같은 원리).
4. conjugation 드릴 레벨 옵션 기본값도 levelCap로.

### Part C. Speak 추천 게이트
1. `recommendedShadow`·`recommendedRoleplay`·`pickBuddyMissions` 입력을 levelCap로 필터.
   시나리오·다이얼로그의 레벨 필드 실측 필요 — **없으면** linked 챕터의 레벨로 파생, 그것도 없으면
   vocab 난이도로 추정하는 매핑 테이블을 스크립트로 생성해 체크인(추정치는 리뷰 1회).
2. 1일차 사용자의 첫 섀도가 인사·자기소개급이 되는지 E2E로 고정.
3. C15 주간 버디 미션도 같은 필터 상속(이미 register 필터를 타므로 같은 자리에서 levelCap 합성).

### Part D. Dictionary 기본 화면
1. 기본 진입: 전량 렌더 대신 **levelCap 필터 on + 가상 스크롤(또는 200개 페이지네이션)**.
   "모든 레벨 보기" 칩으로 해제. 검색은 항상 전체 대상(검색했다는 건 명시적 의도).
2. 이건 성능 수정이기도 하다(탭 요소 3,901개 → 수백). Hanmok 카드 디자인은 유지.

### Part E. 사전 미등재 챕터 단어 21개 마감
- 각각 판정: (a) 사전에 유사 표제어 존재 → 챕터 단어를 그 표기로 정정(예: 이거/이것 → 이거),
  (b) 진짜 부재 → expr/vocab 시드 추가(WS2 규칙: 생성→리뷰→적용).
  '됩니다/돼요', '먹을 수 있다' 같은 활용형·구는 (a) 우선 — 표제어 원형으로 정정.
- 마감 후 검증: "챕터 단어 사전 도달률 100%" 검사를 lint-content에 추가(회귀 방지).

## 수용 기준
1. 신규 사용자(A1)의 Practice 기본 세션에 B1+ 항목 0개(테스트로 고정).
2. 신규 사용자의 Speak 추천 3종(섀도·롤플레이·버디)이 전부 levelCap 내(E2E).
3. Dictionary 첫 렌더 항목 수 ≤ 300, "모든 레벨 보기"로 전체 접근 가능.
4. 챕터 단어 사전 도달률 100%(린트). 5. 테스트 green + build + lint:content. 브라우저 QA 375px.

## 하지 말 것
- 콘텐츠 삭제·잠금. 학습자가 명시적으로 B2를 열면 막지 않는다.
- 레벨 신호를 컴포넌트마다 재계산(learnerLevel.js 한 곳). 새 저장 키.
- Dictionary 검색까지 levelCap(검색은 전체 — 명시적 의도 존중).
