# WS7 — Roleplay 채점 완화

우선순위 P2(사용자 지정 백로그). 규모: 중. 의존성 없음.
목표 한 줄: 자연스러운 응답이 "오답" 처리되는 좌절을 없애되, 엉뚱한 답은 여전히 걸러낸다.

## 현재 사실 (Conversation.svelte 52행 실측)
```js
function checkReply() {
  ...
  respondOK = normalizeKo(typed) === normalizeKo(model.ko);   // 완전 일치만 정답
```
- `normalizeKo`(quiz.js 65행): 소문자화 + 한글/영숫자 외 전부 제거. 즉 **띄어쓰기·문장부호만 관대**하고
  조사 생략, 어순 변화, 동의 표현, 활용 차이(가요/갑니다), 대답 축약은 전부 오답.
- 모드 2개: 선택지(pick — 문제없음) / 직접 입력(respond — 이 WS의 대상). give-up(`reveal`)은 무득점.
- 데이터: 각 you-턴에 정답 choice(`correctOf(active)`)가 있고 `ko` 문자열 1개가 기준.

## 설계 — 규칙 기반 3단계 판정 (LLM/API 금지, 정적 사이트 유지)

신규 `src/lib/replyGrader.js` (순수 함수 — 테스트가 이 WS의 절반이다):
```js
export function gradeReply(typed, modelKo) // → {verdict: 'correct'|'close'|'wrong', missing: [...], matched: [...]}
```

### 1단계 — 정규화 강화
- 기존 normalizeKo 후 추가로: 흔한 종결 변이 통일(`~요/~어요/~아요` 수준은 유지하되
  `요` 유무만 다른 경우를 대비해 어미 처리는 토큰 단계에서), 반복 자모(ㅋㅋ, ㅎㅎ) 제거, 숫자 표기 통일은 범위 밖.

### 2단계 — 핵심 토큰 매칭
- 모범답 `model.ko`를 어절 분리 → 각 어절에서 **조사 스트립**:
  끝의 은/는/이/가/을/를/에/에서/도/만/이요/요/은요 등 접미 조사 목록 기반 제거(2글자 조사 먼저).
  기존 유틸 최대 재사용: `src/lib/hangul.js`(자모 분해)와 `src/lib/conjugation.js`를 먼저 읽고
  겹치는 기능이 있으면 그쪽을 쓴다.
- **스템 매칭**: 용언은 활용이 다를 수 있으므로 어절의 앞 2글자(한글 음절 기준) 프리픽스 일치도 매치로 인정
  (예: 먹었어요/먹어요/먹습니다 → '먹'+1음절 일치). 1글자 스템(가다/오다/자다)은 자모 분해로
  첫 음절 초성+중성 일치까지 확인(가요/갔어요 → 'ㄱㅏ' 일치).
- 핵심 토큰 = 모범답 어절 중 조사 스트립 후 길이 ≥1인 것들. 판정:
  - 매치율 ≥ threshold_high(기본 0.8) → `correct`
  - ≥ threshold_low(기본 0.5) → `close` (missing에 못 찾은 토큰의 **첫 음절+…** 힌트용 마스킹 제공)
  - 미만 → `wrong`
- 입력이 모범답보다 훨씬 길어도(사족) 감점하지 않는다 — 핵심을 말했는지만 본다.

### 3단계 — UX 흐름 (Conversation.svelte)
- `correct` → 현행 정답 처리(첫 시도면 correctCount+1).
- `close` → "거의 다 왔어요!" + 빠진 요소 힌트(`missing` 마스킹: "ㅅ...으로 시작하는 말이 빠졌어요" 수준,
  정답 노출 금지) + 재입력 기회. **같은 턴 2번째 close/wrong**부터는 모범답 공개 + "따라 써 보세요"
  입력란 → 모범답과 correct 판정되면 통과(득점은 안 함, 진행만). 막힘 제거가 목적.
- `wrong` → 현행처럼 오답 표시하되 위 2회 규칙 동일 적용.
- 채점 기준이 바뀌므로 결과 문구도 조정: "Natural replies on the first try" 유지 가능한지 확인.

## 테스트 (`src/lib/replyGrader.test.js`) — 이 표를 그대로 케이스로
모범답 예: `주말에 친구를 만났어요.`
| 입력 | 기대 |
|---|---|
| `주말에 친구를 만났어요` | correct |
| `주말에 친구 만났어요` (조사 생략) | correct |
| `친구를 주말에 만났어요` (어순) | correct |
| `주말에 친구를 만나요` (시제 상이 — 스템 일치) | correct* |
| `친구 만났어` (반말·축약) | correct 또는 close(threshold로) |
| `주말에 만났어요` (핵심 1개 누락) | close + missing에 '친구' |
| `네` | wrong |
| `주말에 학교에 갔어요` | wrong |
| 빈 문자열/공백 | wrong (또는 제출 차단 유지) |
| `주말에 친구를 만났어요 진짜 재미있었어요` (사족) | correct |

\* 시제까지 관대해지는 게 맞는지는 실제 dialogue 데이터의 모범답 성격에 달렸다 —
실행자는 `korean/data`의 conversations를 20턴 이상 샘플링해 threshold와 스템 규칙을 튜닝하고,
**false-positive 테스트 ≥5개**(엉뚱하지만 토큰이 일부 겹치는 답)를 추가해 wrong 유지를 증명할 것.

## 수용 기준
1. 위 테스트 표 + false-positive 5개 이상 green. 2. 2회 실패 → 따라쓰기 통과 흐름 동작(수동 1회).
3. 선택지(pick) 모드는 무변경. 4. 전 테스트 green + build. 5. 힌트가 정답을 직접 노출하지 않는다.

## 하지 말 것
- 외부 API/LLM 채점. 형태소 분석 라이브러리 추가(번들 비대 — 규칙 기반으로만).
- normalizeKo 자체 변경(다른 퀴즈들이 공유 — replyGrader 안에서만 확장).

## 완료 기록
(실행자가 작성)
