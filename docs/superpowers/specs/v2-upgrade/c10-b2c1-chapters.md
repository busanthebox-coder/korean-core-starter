# C10 — B2·C1 챕터 신설 (66~72과, 1차 슬라이스)

콘텐츠 트랙. 규모: 대. 의존: 없음(기존 18지시 큐와 독립 — 단, WS2 완료 후면 시드 반영이 더 안전).
실행 모델: **오퍼스/소넷이 저작·감사를 나눠 맡는다** (저작 모델 ≠ 감사 모델 — 아래 프로토콜).
산출 소비처: 이 사이트 + 한입(hanip) 반입(한입 `docs/harness/orders/25`가 대기 중).

## 왜 (2026-08-07 실측)

레벨 분포 A1 11 · A2 23 · B1 22 · **B2 7 · C1 2**. 상위 레벨은 코스라기보다 맛보기다.
현 B2(57~63)·C1(64~65)이 다루는 것: 사동(57), -겠-(58), 가정·후회(59), 명사화(60),
발견 감탄(61), 이/가vs은/는 정보구조(62), 병원·배달 실용(63), 인터넷 언어(64), 중고거래·택배(65).

**표준 시라버스(TOPIK II·세종 중급) 대비 부재가 확인된 슬롯** — 이것이 1차 7개 챕터다:

| # | 레벨 | 슬롯(문법 초점) | 근거 |
|---|---|---|---|
| 66 | B2 | **피동** -이/히/리/기 + -아/어지다 + -게 되다 | 사동(57)만 있고 피동 챕터가 없음 — 최대 갭 |
| 67 | B2 | **간접화법 축약** -대요/-래요/-냬요/-재요 (+ -다던데) | B1의 -다고 하다 원형만 존재, 축약형 부재 |
| 68 | B2 | **이유·핑계·회상 인과** -느라고 / -는 바람에 / -더니 / -았더니 | 전부 부재 |
| 69 | B2 | **완료·아쉬움·미수** -아/어 버리다 / -고 말다 / -(으)ㄹ 뻔하다 / -(으)ㄴ 척하다 | 전부 부재 |
| 70 | C1 | **문어 연결어미·명사화** -(으)며 / -(으)나 / -(으)므로 / -고자 / 명사형 -음 | (재설계 2026-08-07) 원안 "격식 문어체"는 기존 id chapter-63(Advanced Written Korean — 접속부사·문어 종결)과 부분 중복으로 실측 확인 → 문장 *내부* 결합 계층으로 확정, 63과의 대비를 keyPoint에 명시 |
| 71 | C1 | **뉴스·공지 독해** 피동+한자어 접사(-적/-화/-성) 문체 | 66과를 딛고 실전 독해로 |
| 72 | C1 | **관용구·속담 상위 20** (손이 크다, 발이 넓다, 눈이 높다…) | 표현 자산에 관용구 계열 없음 |

번호는 **append-only**(66부터). 레벨은 번호 구간이 아니라 각 챕터의 `level` 필드가 진실이다
(course.json 항목에 level 존재 ✓ — 2차 슬라이스에서 B2를 더 추가해도 번호·레벨 비단조 허용).

## 스키마 계약 (chapter-59 실측 — 이 형태를 그대로)

`scripts/rich-chapters/chapter-NN.json` 1파일 = 1챕터. 필수 필드와 규모:

- `id`("chapter-66"), `hook`, `canDo`(3~4), `culturalNote`, `summaryCard`, `writingTask`
- `grammarNotes` **3~5개**: title(패턴 표기 규칙: `V-아/어 버리다 — meaning` 형식) · func ·
  formTable(받침 유/무·품사별 행, `ex`는 `밥 → 밥을` 결합형) · examples **4개 이상**
  ({ko, en, romanization, note}) · keyPoint · pronunciation · drill · **englishSpeakerPitfall**
  ({wrong, right, explanation} — 영어 화자가 실제로 저지르는 오류만)
- `extendedVocabulary` **15~20개**: hangul/romanization/english/partOfSpeech/
  exampleSentence{ko,en}/collocations/nuance — 예문은 그 챕터 문법을 최소 절반 이상 재사용
- `extendedDialogue` 6~8줄(화자 2명, 챕터 문법 3회 이상 자연 출현), `readingText` 본문 250~350자
  + bodyTranslation + comprehensionQuestions 2~3
- `inlineExercises` **8~12개**(multipleChoice·orderWords 혼합; orderWords는 부사어 자유어순이면
  프롬프트에 `(Start with X.)` 고정 — 54과 사고 전례)

C1 두 챕터(71 독해·72 관용구)는 grammarNotes가 "문형"이 아닐 수 있다 — 그래도 같은 스키마에
담아라(관용구 1개 = grammarNote 1개, formTable은 리터럴/변형형, examples는 사용례).

## 저작 프로토콜 (챕터당, 순서 고정)

1. **저작**(모델 A): 슬롯 표의 문법 초점 + 스키마 계약으로 chapter-NN.json 저작.
   기존 65챕터와 문법 제목·예문 중복 금지(체크 스크립트가 잡는다). 어휘는 기존 표제어
   재사용 우선, 신규 표제어는 챕터당 8개 이하.
2. **기계 게이트**(신설 `scripts/validate-rich-chapter.mjs` — 이 지시에서 함께 작성):
   스키마 필드·규모 검증, 기존 챕터와 grammarNotes.title 중복 0, 예문 ko 완전 중복 0,
   orderWords 토큰 재조립 일치. 레드면 1로 복귀.
3. **감사**(모델 B ≠ 모델 A): 별도 컨텍스트에서 챕터 전문을 한입 감사 프로토콜
   (`hanip/docs/harness/audit-protocol.md`) 기준으로 판정 — 비문·부자연 문장, 사실 오류,
   정답 모호(둘 다 맞는 선택지), 로마자 오기, 번역 불일치. **blocker 0**까지 1↔3 반복.
   발견·수정 내역은 `docs/superpowers/specs/v2-upgrade/audit/c10-chapter-NN.json`에 기록.
4. **등록**: `korean/data/course.json`의 `chapters`에 항목 append(id/number/title/level/goal/
   grammarFocus/linkedEntryIds 최소 + curriculumOrder는 말미). 기존 65항목 무수정.
5. **빌드 게이트**: `node scripts/build-app-data.mjs` → 사이트 기존 테스트/린트 그린 →
   dev에서 새 챕터 열어 문법·대화·읽기 렌더 확인.
6. 커밋 `[c10] chapter-NN — <슬롯>` (1챕터 = 1커밋). 7챕터 완료 후 이 파일 하단 진행표 갱신,
   한입 반입 신호(한입 지시 25 발동 가능 상태임을 커밋 메시지에 명시).

## 언어 품질의 한계와 책임 (정직하게)

원어민 감수 단계가 없다. 대신: 저작·감사 모델 분리(1↔3), blocker 0 강제, 그리고 **사용자
스팟체크 — 챕터당 대화 2줄+예문 3문장을 배포 전에 직접 읽는다**(총 7챕터 × 5문장 = 35문장).
이 스팟체크에서 부자연 판정이 1챕터 2건 이상이면 그 챕터는 전면 재저작한다.

## 진행표

| 챕터 | 슬롯 | 저작 | 감사 | 등록·빌드 | 특이사항 |
|---|---|---|---|---|---|
| 66 | 피동 | ⬜ | ⬜ | ⬜ | |
| 67 | 간접화법 축약 | ⬜ | ⬜ | ⬜ | |
| 68 | 이유·회상 인과 | ⬜ | ⬜ | ⬜ | |
| 69 | 완료·아쉬움·미수 | ⬜ | ⬜ | ⬜ | |
| 70 | 격식 문어체 | ⬜ | ⬜ | ⬜ | |
| 71 | 뉴스·공지 독해 | ⬜ | ⬜ | ⬜ | |
| 72 | 관용구·속담 | ⬜ | ⬜ | ⬜ | |
