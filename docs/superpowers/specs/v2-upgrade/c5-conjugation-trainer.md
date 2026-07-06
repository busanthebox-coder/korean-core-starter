# C5 — 활용(Conjugation) 트레이너

콘텐츠 트랙 최우선(오디오 불요·원료 완비·가성비 최고). 규모: 소~중. 의존 없음.
목표 한 줄: 사전에 잠들어 있는 **495동사×15활용형** 데이터를 훈련 가능한 드릴로 깨운다.

## 현재 사실 (실측)
- `korean/data/app-data.json`의 words 545개 중 **495개가 `forms` 보유**. 키 15종:
  `dictionary, casualPresent, politePresent, formalPresent, negative, past, future, want, can, cannot,
  must, dontHaveTo, pleaseDo, pleaseDont, shallWe`. extendedVocab에는 forms 없음(대상 아님).
- `entry.irregular` 필드 존재(불규칙 유형). `src/lib/conjugation.js` 유틸 존재 — 착수 시 정독해
  겹치는 로직 재사용(새로 만들지 말 것).
- Practice.svelte는 stage 머신(setup/quiz/match/contrast/review/results) — 새 stage 추가가 자연스러운 구조.

## 설계

### 1. 드릴 엔진: `src/lib/conjugationDrill.js` (순수 함수)
```js
export const FORM_LABELS = {
  past:        { ko: '과거',        en: 'past',              pattern: '-았/었어요' },
  future:      { ko: '미래·의지',   en: 'future',            pattern: '-(으)ㄹ 거예요' },
  want:        { ko: '희망',        en: 'want to',           pattern: '-고 싶어요' },
  // …15종 전부. pattern은 문항 힌트와 해설에 쓰인다.
};
export function buildConjugationQuiz(pool, { forms, count = 10, rng } = {})
// → [{entryId, base:'만나다', form:'past', answer:'만났어요', irregular:'regular'|'ㅂ'|…, english}]
export function gradeConjugation(typed, item)  // normalizeKo 비교 → {ok}
```
- 출제 가중치: `irregular` 항목 **1.5배**(불규칙이 진짜 훈련 대상). 같은 동사 연속 출제 방지.
- `forms[form]`이 비어있는 항목은 스킵(방어).

### 2. 챕터 연동 매핑 (id 기준 — 파일명·표시번호 혼동 주의)
`conjugationDrill.js`에 상수로:
| chapter id | 표시 | 훈련 형태 |
|---|---|---|
| chapter-05 | 5과 Daily Actions | politePresent, negative |
| chapter-08 | 8과 Want/Can/Cannot | want, can, cannot |
| chapter-09 | 9과 Requests | pleaseDo, pleaseDont, must, dontHaveTo |
| chapter-17 | 12과 Past Tense | past |
| chapter-18 | 13과 Future | future |
| chapter-24 | 19과 Suggestions | shallWe |
| chapter-33 | 40과 Speech Levels | formalPresent, casualPresent |
| chapter-41 | 28과 Irregulars | politePresent+past (불규칙 가중 3배) |
| chapter-45 | 32과 Negation | negative |
(착수 시 각 챕터 grammarNotes를 열어 매핑이 실제 내용과 맞는지 검증하고, 맞는 챕터가 더 있으면 추가.)

### 3. UI
- **Practice 탭**: setup 화면에 "Conjugation" 모드 카드 추가 → stage `conjugation`.
  설정: 형태 다중 선택(기본: past+politePresent), 레벨 필터(entry.level), 10문항.
  문항 화면: `만나다 → 과거(-았/었어요)로` + 타이핑 + 채점. 오답 시 정답+로마자+불규칙 유형 한 줄
  ("듣다는 ㄷ-불규칙: ㄷ→ㄹ + 어요 → 들어요" — irregular 필드와 FORM_LABELS.pattern으로 조립).
- **LessonPlayer 연동**: 매핑된 챕터의 practice 단계에 `kind:'conjugation'` 화면 1개(그 챕터 형태로 5문항).
  풀 = 그 챕터 linkedEntryIds ∩ forms 보유 words(부족하면 같은 레벨 words에서 보충).
- 오답 → mistakes 기록 + (WS5 완료 시) SRS 유입 + recordActivity.

### 4. 데이터 품질 선행 점검 (중요)
- 495개 forms가 전부 정확하다고 가정하지 말 것. 착수 시 **불규칙 동사 전수(irregular ≠ regular/absent)의
  politePresent·past를 스크립트로 추출해 리뷰 에이전트 1회 교차 검증**(듣다→들어요, 춥다→추워요, 짓다→지어요,
  모르다→몰라요, 하얗다→하얘요 류). 오류 발견 시 시드 수정(WS2 완료 후) 또는 korean/data 직접 패치(WS2 전례 방식)
  — 어느 쪽인지 WS2 완료 여부로 판단하고 기록.

## 테스트
- buildConjugationQuiz: 가중치 반영(통계적 — rng 고정 시드), 같은 동사 연속 방지, forms 결손 스킵.
- gradeConjugation 정오. FORM_LABELS 15종 완전성(forms 키와 1:1) 스냅샷 테스트.
- 챕터 매핑: 존재하는 chapter id인지, 매핑된 형태가 FORM_LABELS에 있는지.
- 스모크 스크립트: 495개 × 15형 전부 buildConjugationQuiz에 넣어 크래시·빈 answer 없음 확인.

## 수용 기준
1. Practice에서 Conjugation 모드 10문항 완주 E2E(수동 1회). 2. 매핑 챕터에서 활용 화면 렌더.
3. 불규칙 forms 교차 검증 리포트(발견 오류 수와 수정 내역). 4. 전 테스트 green + build.

## 하지 말 것
- 활용형 실시간 생성(conjugation.js로 파생) — 데이터에 있는 forms가 정답 소스다(단일 진실).
- extendedVocab에 forms 생성(범위 밖, 별도 콘텐츠 작업). 오디오.

## 완료 기록
(실행자가 작성)
