# C3 — 누적 복습 유닛 (체크포인트 + 나선형 섞기)

콘텐츠 트랙. 규모: 중(코드 위주 — 신규 콘텐츠 거의 없음). 의존: 없음(C2 완료 후면 문항 풀이 더 풍부).
목표 한 줄: 교과서의 "복습과"처럼 트랙 경계마다 진단형 체크포인트를 두고, 일상 학습에 이전 챕터가 자연히 섞이게 한다.

## 배경
- 현재 복습 장치는 챕터 단위 연습 + SRS뿐. 망각 곡선을 거스르는 **누적·교차(interleaving) 복습이 없다.**
- 원칙(사용자 확정): **잠금 금지** — 체크포인트는 진단·복습용이지 관문이 아니다.

## 설계

### 1. 체크포인트 유닛 (가상 유닛 — 신규 챕터 파일 없음)
- 위치: 트랙 경계 뒤. `src/lib/curriculumStructure.js`에 경계를 **레벨 변화 지점에서 도출**하는 헬퍼 추가
  (하드코딩 금지 — chapters를 순서로 훑어 level이 바뀌는 지점):
  ```js
  export function checkpointSlots(chapters) // → [{afterChapterId, track:'A1', chapterIds:[...트랙 소속]}]
  ```
  현 데이터 기준 결과: A1(1~11과 뒤) / A2(12~34과 뒤) / B1(35~56과 뒤). B2/C1은 챕터 수가 적어 제외(v1).
- Learn 챕터 목록에서 경계 위치에 체크포인트 카드 삽입(디자인: dojang 도장 모티프, 챕터 카드와 구분되는 색).
  라벨: "A1 Checkpoint — 배운 것을 확인해요".
- **세션 구성(20문항)**: 트랙 소속 챕터들의 inlineExercises에서 샘플링.
  - 챕터당 최대 2문항, 유형 다양성 우선(같은 type 연속 금지), rng 시드 고정 없이 매회 새 조합.
  - 문항에 출처 챕터 태그 유지(결과 리포트용).
- **결과 리포트**: 점수 + **챕터별 정오 집계 → "약한 챕터 Top 3"** 카드(각각 "다시 보기" 버튼 → 챕터 열기).
  틀린 문항의 entryIds는 mistakes 기록(+WS5 시 SRS). 결과는 `kcs.checkpoint-v1`에 저장
  `{[track]: {best, last, lastAt, weakChapterIds}}` — 재응시 무제한, best 갱신 표시.
- 체크포인트 카드에 상태 표시: 미응시 / 최근 점수(N/20) / 재응시 버튼. 통과·실패 개념 없음.

### 2. 나선형 섞기 (레슨 내 interleaving)
- LessonPlayer가 연습 단계 화면을 만들 때, **직전 3개 챕터(표시 순서 기준, 완료 여부 무관)의
  inlineExercises에서 1문항**을 20% 확률로 삽입(챕터의 원래 연습 뒤에).
  화면에 작은 배지 "복습 · N과에서" 표시(맥락 없이 튀어나오면 혼란).
- 확률·개수는 상수로 빼두기(`SPIRAL_RATE = 0.2, SPIRAL_COUNT = 1`) — 추후 조정 용이.
- 1~3과(앞 챕터 부족)와 특수 챕터(ch01 한글)는 제외 가드.

### 3. Guide 연동
- Guide 탭 진행률 카드에 체크포인트 상태 요약 한 줄(응시한 트랙/점수) — 과하게 키우지 않는다.

## 신규 localStorage 키
- `kcs.checkpoint-v1` — WS3 BACKUP_KEYS와 00-README 표에 추가(병합: best는 max, last류는 lastAt 최신 쪽).

## 테스트
- checkpointSlots: 레벨 경계 도출(픽스처 chapters로 A1/A2/B1 슬롯 확인, 레벨 순서가 바뀌어도 동작).
- 샘플링: 챕터당 ≤2, 같은 type 연속 없음, 20개 미만 풀일 때 전량 사용.
- 약한 챕터 집계 로직. 나선형 삽입: 확률 rng 고정 테스트 + 앞 챕터 부족 가드.
- 체크포인트 결과 저장·best 갱신.

## 수용 기준
1. Learn 목록에 체크포인트 3개가 올바른 위치에 렌더(프리뷰 스크린샷).
2. 20문항 응시→결과 리포트→약한 챕터 다시 보기 E2E(수동 1회).
3. 레슨에서 복습 문항이 배지와 함께 섞여 나옴(SPIRAL_RATE=1로 임시 올려 확인 후 원복).
4. 어떤 경로에도 잠금이 생기지 않음. 5. 전 테스트 green + build.

## 하지 말 것
- 신규 챕터 파일/course.json 변경(가상 유닛은 전부 코드에서). 통과 기준·잠금. 신규 문항 창작(샘플링만).

## 완료 기록
✅ 2026-07-07 완료 — C3 단위만 완료. 전체 콘텐츠 트랙은 C4/C6/C7이 아직 남아 있다.

- 변경: `src/lib/checkpoints.js`에 체크포인트 슬롯/20문항 샘플링/약한 챕터 집계/나선형 복습 삽입 로직 추가, `src/lib/components/CheckpointSession.svelte` 추가, Learn path에 A1/A2/B1 체크포인트 카드 삽입, LessonPlayer 연습 단계에 prior-chapter 복습 배지 연결, Guide에 체크포인트 진행 요약 추가.
- 상태 저장: `kcs.checkpoint-v1` 추가. 형태는 `{[trackId]: {best, last, total, lastAt, weakChapterIds}}`.
- 실제 데이터 확인: A1 checkpoint after chapter 11, A2 after chapter 34, B1 after chapter 56. 세 슬롯 모두 20문항 샘플링 가능.
- 검증: `node scripts/validate-exercises.mjs` 통과, `npm test` 통과(29 files, 163 tests), `npm run build` 통과.
- 화면 검수: `.omo/evidence/c3-checkpoint-qa/`에 Learn 체크포인트 카드(1280/768), 체크포인트 문항(1280/768), 20문항 결과 화면, spiral review badge, Guide 모바일 요약 캡처와 QA 로그 보관.
- 남긴 이슈: 브라우저 콘솔에 정적 리소스 404 로그 1건이 보였지만 `pageerror`는 없었고 체크포인트 저장/화면 동작에는 영향이 없었다. Vite 대형 data chunk 경고는 기존 데이터 번들 크기 계열 경고다.
