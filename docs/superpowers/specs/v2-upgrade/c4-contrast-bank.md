# C4 — 문법 대조 뱅크 확장 (8쌍 → 30쌍)

콘텐츠 트랙. 규모: 소~중. 의존 없음. 오디오 무관.
목표 한 줄: 학습자가 실제로 헷갈리는 문법 쌍 30개를 판별 규칙 + 판별 퀴즈로 훈련시킨다.

## 현재 사실 (실측)
- `src/lib/patternContrast.js`: contrastItems ~8개. 아이템 스키마(그대로 유지):
  ```js
  { id: 'cause-01', entryId: 'pattern-018', contrast: '-아서/어서 vs -니까 vs -거든요',
    prompt: 'Choose the smooth cause-result connector.', sentence: '비가 와__ 택시를 탔어요.',
    answer: '서', options: ['서','니까','거든요'], explanation: '...' }
  ```
- UI는 `PatternContrastSession.svelte` + Practice의 `startContrast()`(`buildContrastQuiz({count:8})`) — 재사용, 개조 불필요.
- 기존 커버: 은/는vs이/가(2) · 원인 연결(3) · 목적(2) · 명사화(1).

## 확장 목표 목록 (쌍당 판별 퀴즈 6문항 → 신규 ~130문항)

기존 유지 + 아래 추가. `contrast` 문자열·`level` 필드(신규, 스키마에 추가)와 함께:

| # | 대조 | 레벨 | 판별 규칙 씨앗(문항 설계의 축) |
|---|---|---|---|
| 1 | 에 vs 에서 | A1 | 존재·도착점 = 에 / 행위 장소·출발점 = 에서 |
| 2 | 안 vs 못 | A1 | 의지 부정 vs 능력·외부 사정 |
| 3 | 하고 vs (이)랑 vs 와/과 | A1 | 뜻 동일, 격식·구어 층위 차이 |
| 4 | 은/는 vs 이/가 (기초) | A1 | 기존 2문항 → 6문항으로 증설(새 정보/대조/질문의 답) |
| 5 | -고 vs -아서/어서 (순차) | A2 | 단순 나열 vs 선행이 후행의 전제(가서 샀어요) |
| 6 | -아서 vs -(으)니까 | A2 | 기존 유지+증설: 명령·청유 앞은 -니까만 |
| 7 | -(으)러 vs -(으)려고 | A2 | 이동 동사 목적 vs 일반 의도 |
| 8 | -지만 vs -는데 | A2 | 정면 대조 vs 배경 깔기 |
| 9 | N 동안 vs V-는 동안 | A2 | 명사 기간 vs 동작 진행 중 |
| 10 | -(으)ㄹ 수 있다 vs -아/어도 되다 | A2 | 능력·가능 vs 허락 |
| 11 | 부터 vs 에서 (시작점) | A2 | 시간·순서의 시작 vs 공간 출발 |
| 12 | -고 있다 vs -아/어 있다 | A2 | 진행 vs 결과 상태(앉아 있다) |
| 13 | -자마자 vs -고 나서 | A2 | 즉시 연쇄 vs 완료 후 |
| 14 | 만 vs 밖에 | A2 | 긍정문 '만' / '밖에'는 부정 동반 |
| 15 | -는 것 같다 vs -나 보다 | B1 | 내 판단 완곡 vs 관찰 증거 기반 추측 |
| 16 | -거든요 vs -잖아요 | B1 | 상대가 모르는 이유 제공 vs 아는 사실 환기 |
| 17 | -더라고요 vs -았/었어요 | B1 | 직접 목격 회상 vs 중립 과거 보고 |
| 18 | -다가 vs -고 나서 | B1 | 중단·전환 vs 순차 완료 |
| 19 | -게 하다 vs -게 되다 | B1 | 사동(시킴) vs 피동적 변화(그렇게 됨) |
| 20 | -(으)면 vs -(으)니까 (조건·이유) | B1 | 가정 vs 기정 이유 |
| 21 | -기 위해서 vs -도록 | B1 | 목적(주어 동일) vs 목표·기준 |
| 22 | 한테 vs 께 (+주다 vs 드리다) | B1 | 높임 대상 정렬 |
| 23 | -(으)ㄹ 뻔했다 vs -(으)ㄹ 뿐이다 | B1 | 형태 유사 함정쌍 |
| 24 | -았/었으면 좋겠다 vs -(으)면 좋겠다 | B2 | 반사실 소망 vs 일반 소망 |
| 25 | -았더라면 vs -았으면 | B2 | 반사실 조건 강함/중립 |
| 26 | -기 vs -는 것 | B2 | 명사화 화체·관용 분포(기존 nominal 증설) |
| 27 | 이/가 vs 은/는 (담화 층위) | B2 | 신정보 도입 후 재언급, 대조 초점 |
| 28 | -겠- vs -(으)ㄹ 것이다 | B2 | 화자 의지·즉석 추측 vs 계획·객관 예측 |
| 29 | 사동 접미(-이/히/리/기) vs -게 하다 | B2 | 어휘적 vs 통사적 사동 |
| 30 | -(으)ㅂ시다 vs -(으)ㄹ까요? vs -자 | B2 | 청유 격식 3층위(WS8 갭필과 연계) |

## 콘텐츠 요구사항 (쌍당)
- 문항 6개: `sentence`는 빈칸 `__` 1개, options 2~3개(대조 대상만 — 무관 보기 금지),
  **6문항 중 정답이 양쪽에 고루 분포**(한쪽만 정답이면 패턴 암기됨. 3:3 또는 4:2).
- explanation은 "왜 이쪽인지 + 왜 저쪽이 아닌지" 두 방향 모두. 고빈도 어휘, 해요체.
- `entryId`: 기존 항목처럼 관련 pattern/grammar entry에 연결 — `korean/data`에서 검색해 실존 id만
  (없으면 생략 가능하게 UI 방어 확인).
- `level` 필드 추가 → PatternContrastSession 진입 전 레벨 필터 UI(간단한 칩)를 Practice setup에 추가.

## 파이프라인
1. 생성 스펙(`/tmp/.../c4_gen_spec.md`): 이 표 + 스키마 + 기존 8개 실물 예시.
2. 배치 에이전트 5개(6쌍씩) → 교차 리뷰(정답 유일성·정답 분포 균형·판별 규칙 정확성 — 특히 #6 명령문 앞
   -아서 금지, #14 밖에+부정 같은 절대 규칙 위반 문항이 없는지) → 적용.
3. `patternContrast.js`에 직접 추가(데이터 파일 아님 — JS 모듈. 30쌍×6이면 코드가 길어지니
   `src/lib/contrastItems.json`으로 분리하고 patternContrast.js가 import하는 리팩터 허용, WS1 분할과 무관한 소형 JSON).
4. 검증 스크립트: id 유일성, answer∈options, 쌍당 6문항, 정답 분포 ≥2:4.

## 테스트·수용 기준
1. 총 ≥30쌍·~190문항(기존 포함), 검증 스크립트 통과. 2. Practice contrast 세션에서 레벨 필터 동작.
3. buildContrastQuiz가 새 데이터로 정상 동작(기존 테스트 + 분포 테스트). 4. 전 테스트 green + build.
5. 리뷰 판정 기록(수정된 문항 수) 남김.

## 하지 말 것
- PatternContrastSession UI 대개조(필터 칩 추가만). 4지선다화(대조 훈련은 2~3지가 교육적으로 옳다).

## 완료 기록
2026-07-07 Codex ULW pass:
- Added `src/lib/contrastItems.json` with 30 contrast groups x 6 questions = 180 items.
- Added `level` and `answerKey` metadata; `answerKey` is used only to validate educational answer distribution when surface endings differ by conjugation.
- Refactored `src/lib/patternContrast.js` to import the JSON bank and support `buildContrastQuiz({ level })`.
- Added Practice setup level chips for Contrast Lab and optional `entryId` guarding in `PatternContrastSession`.
- Added `scripts/validate-contrast-items.mjs` and `npm run validate:contrast`.
- RED evidence: `.omo/evidence/c4-contrast-bank/validate-contrast-items-red.txt` failed on the old 7 groups / 8 items / missing levels.
- GREEN evidence: `.omo/evidence/c4-contrast-bank/validate-contrast-items-green.txt` reports 30 groups / 180 items / A1-A2-B1-B2 distribution.
- Focused test: `npx vitest run src/lib/patternContrast.test.js` passed after adding level filtering and stats coverage.
- Remaining after this C item: C6 Reading Room and C7 Hanja families. Audio-related C1/C8 remain deferred.
