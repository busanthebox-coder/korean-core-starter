# C2 — 연습문제 확충·다양화 (챕터당 5→10+, 유형 6종)

콘텐츠 트랙. 규모: 대. 의존: WS2 완료 후 권장(전이면 build-app-data만). 오디오 무관.
목표 한 줄: 모든 챕터가 **다양한 유형의 문항 10개 이상**을 갖고, 조사·활용·어순이라는 한국어의 진짜 난관을 정면으로 훈련시킨다.

## 현재 사실 (2026-07-05 실측)

- inlineExercises: 챕터당 3~10개(중앙값 5), 총 341개. 유형 분포: multipleChoice 193 / fillBlank 91 /
  오류교정 40(표기 3종!) / translate 17 → **70%가 고르기형**.
- **스키마 불일치(선행 정리 대상)**:
  - 오류교정 type이 `errorCorrect` / `errorCorrection` / `correction` 3종 혼재
  - 정답 필드가 `correct`(errorCorrect·MC·fillBlank·translate)와 `answer`(errorCorrection·correction) 혼용
- 실물 스키마(유지할 기준형):
  ```json
  {"type":"multipleChoice","prompt":"...","options":["..."],"correct":"...","explanation":"..."}
  {"type":"fillBlank","prompt":"저는 학생___ (...)","options":["이에요","예요"],"correct":"이에요","explanation":"..."}
  {"type":"errorCorrect","prompt":"다음 문장에서 틀린 것을 찾아보세요: '...'","correct":"...","explanation":"..."}
  {"type":"translate","prompt":"Translate: '...'","correct":"...","hint":"..."}
  ```
- **렌더러가 두 개다**: inlineExercises는 `LessonPlayer.svelte`가 `kind:'exercise'` 화면으로 직접 렌더.
  `ExerciseHost.svelte`는 별개 시스템(type: mc/listen/type/build — lessonPlan.js 계열). **혼동 금지.**
  착수 시 LessonPlayer의 exercise 렌더 분기를 정독해 현재 처리 가능한 type 집합을 확정할 것.

## Step 1 — 스키마 통일 (코드+데이터, 독립 커밋 가치)

1. rich-chapters 65파일에서 `errorCorrection`/`correction` → `errorCorrect`로, `answer` → `correct`로
   일괄 변환(python 스크립트, 변환 건수 출력 40건 예상).
2. LessonPlayer의 exercise 렌더 분기에서 두 필드/세 표기를 지원하던 방어 코드가 있으면 단순화,
   없으면(= 일부 유형이 조용히 안 그려지고 있었다면) 이번에 통일 스키마로 정상화.
3. `node scripts/build-app-data.mjs` + 테스트 + 프리뷰에서 오류교정 문항 렌더 확인.

## Step 2 — 신규 유형 3종 (LessonPlayer 렌더 추가)

| type | 스키마 | 채점 |
|---|---|---|
| `particleChoice` | `{type,prompt:"문장 with __",options:["은","이","을",...],correct,explanation}` | 고르기(fillBlank와 동일 UI 재사용 가능 — 별도 type을 두는 이유는 통계·복습 분류) |
| `conjugate` | `{type,prompt:"어제 친구를 ___ (만나다 → past)",base:"만나다",form:"past",correct:"만났어요",explanation}` | 타이핑, normalizeKo 비교 |
| `orderWords` | `{type,prompt:"영어 뜻",tokens:["주말에","친구를","만났어요"],correct:"주말에 친구를 만났어요",explanation}` | 토큰 탭 조립(quiz.js의 scramble 재사용, ExerciseHost의 build UI 참고 가능) |

- 타이핑 채점 시 오답이면 정답+로마자 표시(RomanizationLine 재사용).
- 오답 → mistakes 기록(+WS5 완료 시 SRS 유입). 관련 entryId를 문항에 optional `entryIds[]`로 달아
  기록 대상을 명확히(신규 문항부터, 기존 문항 소급은 범위 밖).

## Step 3 — 콘텐츠 생성 (챕터당 10문항 이상으로)

- **목표 분포(챕터당)**: multipleChoice ≤3 / fillBlank 2 / particleChoice 1~2 / conjugate 1~2 /
  orderWords 1 / errorCorrect 1 / translate 1. 문법 챕터가 아닌 특수 챕터(ch01 한글, ch65 종합)는 예외 설계.
- 생성 규칙(전 문항):
  1. **그 챕터의 문법·어휘만** 사용(선행 챕터 것 허용, 후행 금지 — 표시 번호 기준 선후).
  2. 고빈도 일상 어휘만. 해요체 기본(챕터가 다른 체를 가르치면 그 체).
  3. 오답 보기(options)는 실제 학습자 오류를 반영(무작위 아무 말 금지): 조사 혼동, 받침 규칙 위반,
     활용 오류, 시제 혼동. explanation은 **왜 오답이 틀렸는지**까지 짚는다(기존 문항의 설명 수준 유지).
  4. 정답 유일성: options 중 정답이 되는 것이 정확히 1개(한국어는 복수 정답이 흔하니 리뷰에서 집중 검증).
- **파이프라인**(writingTask 전례: 스펙파일 → 병렬 배치 → 교차 리뷰 → 수정 적용):
  1. 생성 스펙을 `/tmp/.../c2_gen_spec.md`로 작성(이 문서의 규칙 + 스키마 + 챕터 컨텍스트 번들).
  2. 배치 에이전트 8개(8~9챕터씩): 기존 문항과 중복되지 않게 기존 문항 목록을 컨텍스트로 제공.
  3. 리뷰 에이전트 8개(교차 배치): 문법 정오·자연스러움·정답 유일성·저빈도어·분포 준수를 JSON 판정으로.
  4. 수정 적용 → **정답 유일성 자동 검증 스크립트** `scripts/validate-exercises.mjs`:
     (a) options 중복 제거 확인 (b) correct가 options에 존재 (c) 스키마 필수 필드 (d) type 화이트리스트.
     이 스크립트는 체크인하고 build-app-data 앞단에서 항상 실행되게 한다.
- 총 신규 ~350문항 예상(65과 × 평균 5~6개 추가).

## Step 4 — Practice 탭 연동
- Practice의 챕터 풀 기반 퀴즈(buildQuiz)가 신규 유형도 뽑도록 확장할지 확인 —
  inlineExercises와 Practice 퀴즈는 원천이 다르므로(사전 entry 기반), **이번 범위는 LessonPlayer만**.
  Practice 연동은 C3(체크포인트)에서 inlineExercises 샘플링으로 해결된다. 여기선 손대지 않는다.

## 테스트·수용 기준
1. 표기 통일 후: `grep -r "errorCorrection\|\"correction\"" scripts/rich-chapters/` 0건, `"answer":` 0건.
2. validate-exercises.mjs 전 챕터 통과. 분포 리포트(유형×챕터 표) 출력해 목표 분포 확인.
3. 신규 유형 3종 렌더+채점 컴포넌트 테스트(정답/오답/빈 입력). orderWords 토큰 재조립 로직 테스트.
4. 프리뷰: 문항이 늘어난 챕터에서 연습 화면들 스와이프 E2E. 5. 전 테스트 green + build.

## 하지 말 것
- ExerciseHost 개조(별개 시스템). 듣기 유형(오디오 후순위 — C1로 이관됨). 기존 문항 텍스트 "개선"(추가만).

## 완료 기록
✅ 2026-07-07 완료 — C2 단위만 완료. 전체 콘텐츠 트랙은 C3/C4/C6/C7이 아직 남아 있다.

- 변경: `scripts/rich-chapters/chapter-01.json`~`chapter-65.json` inline exercises 확충, `scripts/validate-exercises.mjs` 추가, `scripts/build-app-data.mjs`에 검증 연결, `src/lib/inlineExercise.js`/테스트 추가, LessonPlayer/PracticeScreen/LessonScreen에서 신규 유형 렌더·채점 지원.
- 결과: inline exercises 341→653. 전 챕터 10개 이상. 유형 합계: multipleChoice 225, fillBlank 149, errorCorrect 80, translate 18, particleChoice 64, conjugate 52, orderWords 65.
- 검증: `node scripts/validate-exercises.mjs` 통과, `node scripts/build-app-data.mjs` 통과, `npm test` 통과(158 tests), `npm run build` 통과.
- 화면 검수: `.omo/evidence/c2-exercise-expansion-visual-qa/`에 chapter-05 신규 유형 3종 정답 흐름, chapter-59/orderWords mobile, chapter-64/errorCorrect mobile CJK 줄바꿈 수정 후 캡처, chapter-65/orderWords desktop 캡처 보관.
- 남긴 이슈: Vite build의 대형 chunk 경고는 데이터 번들 크기에서 오는 기존 계열 경고이며 C2 기능 실패는 아니다. 다음 콘텐츠 순서는 C3 체크포인트/나선형 복습이다.
