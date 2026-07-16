# V4 — 해요체 회화 완성 트랙 (친구와의 가벼운 대화 준비)

> 설계: Fable (2026-07-17). 실행: Opus/Codex — 한 세션 = 한 지시.
> 공통 규칙·함정·완료 보고 형식은 [../v2-upgrade/00-README.md](../v2-upgrade/00-README.md)를 그대로 따른다
> (커밋은 사용자 요청 시만, 착수 전 `npx vitest run` 기준선, 완료 = 테스트 green + build + lint:content).
> 세션 시작은 [01-EXECUTION-ORDERS.md](01-EXECUTION-ORDERS.md)의 [공통 머리말]+[지시 N]을 붙여넣는 것으로 한다.

## 배경 — 사용자 결정 2건 (2026-07-17)
1. **반말은 후순위**: "원어민 아닌 사람이 반말 써봤자 어색" — 반말 능동 훈련은 만들지 않는다.
   기존 40과 반말 노트(읽고 알아듣기용)는 유지.
2. **표현 차이 설명 보강**: "비슷한 표현인데 뭐가 다른지" 설명이 부족하게 *느껴진다* — 실측 결과
   데이터(nuance 100%)는 있는데 노출과 비교 화면이 없는 것이 실체(→ C14).

## 실측 근거 (2026-07-17, 이 트랙의 존재 이유)

| 발견 | 수치 | 귀결 |
|---|---|---|
| Roleplay 46개 중 **38개가 반말 위주** | 회화 연습의 본진이 "후순위로 미룬 문체" | C13 |
| 해요체 리액션·맞장구 표본 20개 중 **8개 부재**(그렇군요·아 그래요?·그러니까요·잘됐네요·저도요·아 맞다·수고하셨어요·아까워요) + 맞장구 훈련 장치 전무 | 친구 대화의 절반은 맞장구 | C11 |
| nuance/commonMistakes 커버리지 ~100%, 클러스터 상호참조도 다수 존재. 그러나 사전 상세의 접힌 콜아웃에만 있고 **나란히 비교하는 화면 없음**. 짝 항목 부재도 있음(미안해요·알았어요·괜찮아요↔좋아요 상호참조 없음) | 설명이 "없는" 게 아니라 "안 보이는" 것 | C14 |
| `buddyCard`(시나리오별 친구용 한국어 안내 instructionKo + 모범 리액션 reactionKo)가 **전 시나리오 데이터에 존재하나 UI 렌더 0곳** | 죽은 기능 — 살리기만 하면 됨 | C15 |
| 구어 축약(난/게/뭘/거 같아요) 표기 학습 없음 — 존댓말에서도 그대로 쓰는 것들 | 소형 갭 | C12 |

## 실행 순서

| 순서 | 파일 | 제목 | 규모 | 상태 |
|---|---|---|---|---|
| 1 | [c13-roleplay-polite.md](c13-roleplay-polite.md) | Roleplay 해요체 정렬 (변형 15 + 신규 8) | 중 | ✅ |
| 2 | [c11-reactions.md](c11-reactions.md) | 리액션·맞장구 팩 + reaction 드릴 | 중 | ✅ |
| 3 | [c15-buddy-guide.md](c15-buddy-guide.md) | 버디 세션 가이드 (buddyCard 살리기 + 주간 미션) | 소~중 | ⬜ |
| 4 | [c14-expression-nuance.md](c14-expression-nuance.md) | 표현 뉘앙스 비교 (클러스터 30 + 비교 UI) | 중 | ⬜ |
| 5 | [c12-spoken-contractions.md](c12-spoken-contractions.md) | 구어 축약 노트 | 소 | ⬜ |

의존성: 서로 독립. 단 C11의 리액션 표현 시드가 C14 클러스터(맞장구 계열)와 겹치므로 C11 먼저면 C14가 재사용.

## 데이터 스키마 참조 (실측)
- Roleplay: `korean/data/app-data.json` → `conversations.conversations[]`
  `{id, title, situation, setting, partner, tip, turns[], vocab, buddyCard{instructionKo, reactionKo}}`
  you-turn: `{role:'you', prompt(EN), choices[{ko, romanization, en, correct, feedback}]}` / partner-turn: `{role, ko, romanization, en}`
  소스: `scripts/convo-src/*.json` (16파일) → generate 파이프라인. 검증: `scripts/validate-conversations.mjs`.
- 어휘 팩: `scripts/vocab-packs.json` (expressions 지원됨 — C9에서 확장). 팩 완료 `kcs.packs-v1`.
- 표현 시드: `scripts/expr-src/x-reactions-basic.json` 기존 존재(기초 리액션) — C11은 이 파일 증보 또는 자매 파일.
- ⚠️ v2 공통 함정 유지: 이 저장소는 generate가 안전해졌지만(WS2 완료), 콘텐츠 신규 생성은 반드시
  **생성→교차 리뷰→적용** 3단계(리뷰 없이 직행 금지), 고빈도 어휘·해요체 기본.
