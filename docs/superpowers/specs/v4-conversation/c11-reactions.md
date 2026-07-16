# C11 — 리액션·맞장구 팩 + reaction 드릴 (해요체판)

규모: 중. 의존 없음(C13과 병렬 가능). 목표 한 줄: 친구 대화의 절반인 "맞장구"를 어휘로 채우고,
상대 말에 맞는 리액션을 고르는 훈련을 만든다.

## 실측 근거
- 해요체/중립 리액션 표본 20개 중 부재 8: 그렇군요 · 아 그래요? · 그러니까요 · 아까워요 · 잘됐네요 ·
  저도요 · 아 맞다 · 수고하셨어요. (존재 12: 진짜요?·맞아요·글쎄요·정말요?·어머·대박·헐·부러워요·다행이네요·고생했어요·그런 것 같아요·오랜만이에요)
- 리액션을 훈련하는 연습 유형이 전무 — 사전에 있어도 "언제 어떤 맞장구"인지 배울 길이 없음.
- 기존 시드 파일 `scripts/expr-src/x-reactions-basic.json` 존재 — 증보 지점.

## 구현

### Part A. 표현 시드 ~15개 추가
- 부재 8개 + 보강 후보(에이 설마요 · 헐 진짜요? · 그니까요(구어 표기, 그러니까요와 연결) · 어떡해요 ·
  괜찮았어요? · 완전 부러워요 · 별일 없죠?) 중 리뷰를 거쳐 **15개 내외** 확정.
- `scripts/expr-src/x-reactions-basic.json` 증보(또는 자매 파일 x-reactions-polite.json — 파일 크기 보고 실행자 판단).
  기존 expressions 스키마 그대로(usage/examples 삼중, nuance, commonMistakes — **비슷한 리액션과의 차이를
  nuance에 반드시 명시**: 예. 그렇군요=새 정보 수긍(살짝 격식) vs 아 그래요?=가벼운 놀람+되물음 vs 그러니까요=강한 동의).
- generate 파이프라인 → 무결성 가드 통과(WS2 manifest 갱신 절차 준수).

### Part B. 팩 2개
- `pack-reactions-agree`(공감·동의: 맞아요/그러니까요/그렇군요/저도요/그런 것 같아요/다행이네요 …)
- `pack-reactions-surprise`(놀람·리액션: 진짜요?/정말요?/헐/대박/아 그래요?/설마/어머/아 맞다 …)
- `scripts/vocab-packs.json`에 추가(expressions 팩은 C9 이후 지원됨), 위치는 2과 뒤·7과 뒤 권장(생존 팩과 안 겹치게).
  audit-a1.mjs의 필수 팩 검사 목록 갱신(현 10개→12개).

### Part C. 새 연습 유형 `reaction` (Practice 탭 모드)
- 데이터: `scripts/reaction-drill.json` 체크인 — **~40문항 큐레이션**:
  `{id, partnerKo, partnerEn, options[{ko, natural: true|false, why}], level}`.
  원천: Roleplay partner 턴 재활용(상대 발화는 이미 자연스러운 실문장) + 정답 리액션 1 + "말은 되지만 상황에
  안 맞는" 리액션 2(예: 나쁜 소식에 잘됐네요 — 극성 반전 / 질문에 평서 맞장구 — 기능 불일치).
  **오답도 문법적으로 멀쩡해야 함**(C-시리즈에서 배운 교훈: 비문 오답은 소거법 먹잇감).
- UI: Practice setup에 "Reactions" 모드 카드 → 10문항 세션. 상대 말풍선(ChatBubble 재사용) + 리액션 3택 +
  오답 시 why 표시. 오답 → mistakes/SRS 유입(기존 규칙).
- 문항 순서·보기 순서는 `scrambledOptions` 재사용(정답 위치 편향 재발 방지).

### Part D. 레슨 연계 (가벼운)
- 대화 화면(DialogueScreen) 하단에 "이 대화에 어울리는 맞장구" 칩 1~2개(챕터 무관 공용 리액션에서 랜덤 아님 —
  대화 내용에 맞게 큐레이션한 매핑을 reaction-drill 데이터에 chapterId 태그로).
  범위 부담 크면 v1은 생략 가능(실행자 판단, 결정 기록).

## 수용 기준
1. 시드 ~15개 추가·리뷰 통과(리뷰 중점: 리액션 간 차이 설명 정확성 — 이건 C14와 이어짐), 팩 2개 완주 E2E.
2. reaction 드릴 40문항: 정답 유일성 + 오답이 문법적으로 성립함을 리뷰로 확인, 보기 순서 셔플 적용 확인.
3. Practice에서 Reactions 10문항 완주 E2E(브라우저), 오답 SRS 유입 테스트.
4. 테스트 green + build + lint:content(신규 데이터 스키마 검사 추가: options 3개·natural true 정확히 1개).

## 하지 말 것
- 반말 리액션 팩(그치/맞아 맞아 — 후순위 결정 준수. 단 헐/대박처럼 문체 중립 감탄사는 허용).
- 리액션 자동 생성 무리뷰 적용. 40문항 초과 확장(v1 규모 고정).

## 완료 기록
✅ done 2026-07-17 — Opus 4.8 직접 구현.

- **표현 시드 8개**(`scripts/expr-src/x-reactions-basic.json` 16→24): 그렇군요·아 그래요?·그러니까요·
  잘됐네요·저도요·아 맞다·수고하셨어요·아까워요. 각 항목이 비슷한 리액션과의 차이를 structuredNuance에 명시.
  사실 확인이 특히 중요했던 2건 — **수고하셨어요**: 국립국어원 표준 언어 예절상 윗사람에겐 부적절(현대 직장에선
  광범위하나 연배 있는 윗사람은 인지) + **고생하셨어요도 안전한 대체재가 아님**을 명시. **아까워요 vs 아쉬워요**:
  가졌던 가치를 낭비/상실(아깝다) vs 기대 미달·애초에 못 가짐(아쉽다).
- **팩 2개**(vocab-packs 10→12): pack-reactions-agree(2과 뒤)·pack-reactions-surprise(7과 뒤), 각 10항목.
- **reaction 드릴 40문항**(`src/lib/reactionDrills.json`) + `src/lib/reactions.js` + `ReactionSession.svelte`
  + Practice에 Reactions 모드(10문항). 상대 말풍선(ChatBubble 재사용) → 리액션 3택 → 오답 시 why 설명.

### 검증
- 생성물 **직접 전수 검증**: 스키마 0오류, **partnerKo 40개 전부 원천 시나리오 발화와 verbatim 일치**(대조 확인),
  26개 해요체 시나리오 전부 활용, 반말 종결 0건.
- 보기 순서는 C2에서 만든 `scrambledOptions`를 태움 — 정답 슬롯 편향 회귀 테스트 포함(3슬롯 15~55% 분산).
- 테스트 64파일 / **329개 green**(신규 reactions 7개). build + bundle guard + lint:content +
  verify-data-integrity PASS.
- 브라우저 QA(모바일 375px): Reactions 카드 → 세션 렌더 → 오답 피드백("수고하셨어요는 끝난 노고를 마무리하는 말인데
  아직 십 분 기다려야 함") → 완주 → **mistakes/SRS 3장 유입 확인**.

### 스펙과 다르게 한 것
1. **lint-content에 드릴 스키마 검사 추가 안 함.** lint-content는 생성된 app-data를 검사하는데 드릴은
   `src/lib` 번들 데이터라 대상이 아니다. 이미 작성한 `reactions.test.js`가 동일 검사(+슬롯 분산)를 하고
   같은 CI(test-build 잡)에서 돌아 중복이므로 생략.
2. **Part D(대화 화면 맞장구 칩) 생략** — 스펙이 "부담 크면 v1 생략 가능(결정 기록)"으로 허용한 항목.
3. 팩 항목을 8→**10개**로 늘림 — 기존 `contentData.test.js`가 팩당 ≥10을 강제(테스트가 잡아냄).
4. **entryIds는 40개 중 16개만 부여**. 정답이 바른 표제어가 아니라 자연스러운 문장이라(콘텐츠로는 옳음)
   정확 일치는 0/40이었고, 리액션 표제어를 포함하는 16개만 해석해 붙였다. 나머지 24개는 붙일 표제어가 없어
   SRS 유입이 없다 — 브라우저 QA에서 유입 0인 걸 발견해 추적한 결과. entryId 실존 검증 테스트 추가.

### 파이프라인 메모
표현 8개 추가는 의도된 콘텐츠 증가라 generate가 무결성 가드에 걸린다(정상 동작). 정식 절차대로
`node scripts/generate-korean-data.mjs --accept-manifest-additions` → `node scripts/verify-data-integrity.mjs
--update-manifest` 순으로 처리(expressions 877→885). C13과 동일하게 apply-curriculum-structure는 건너뜀.
