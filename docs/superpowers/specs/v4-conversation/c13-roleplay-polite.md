# C13 — Roleplay 해요체 정렬

규모: 중. 의존 없음. 목표 한 줄: 회화 연습의 본진(Roleplay)을 "지금 배우는 문체(해요체)"로 정렬한다 —
반말 시나리오는 지우지 않고, 해요체 변형과 신규 해요체 시나리오를 추가해 기본 노출을 바꾼다.

## 실측 근거
- Roleplay 46개 중 38개가 반말 위주(어미 휴리스틱 + 표본 정독으로 확인 — "자? / 너 요즘 좀 다운돼 보이더라").
- 사용자 결정: 반말 능동 훈련은 후순위. 그런데 학습자가 Speak 흐름에서 처음 만나는 회화가 반말 —
  배운 적 없는 문체로 연습하게 되는 모순.
- 현실 정합: 외국인 학습자가 새로 사귄 한국 친구·언어교환 상대와는 서로 해요체가 자연스럽다.

## 구현

### Part A. 기존 시나리오 해요체 변형 15개
1. 46개 중 **친구 사이 반말 시나리오에서 "지인/언어교환 상대여도 성립하는" 15개 선별**(위로·약속·근황·추천 등.
   반말이어야만 자연스러운 것 — 아주 절친한 밤샘 카톡 등 — 은 제외하고 선별 이유를 기록).
2. 각각 해요체 변형을 **별도 시나리오 항목**으로 추가(전 턴 ko/romanization/feedback 재작성, en은 대부분 유지):
   - id: 원본 id + `-haeyo`, 원본과 상호 링크 필드 `pairId`.
   - `register: 'haeyo'` 필드 신설, 기존 전 시나리오에도 `register: 'banmal'|'haeyo'|'mixed'` 태깅
     (스크립트 휴리스틱으로 초벌 → 리뷰로 확정).
   - situation/partner 문구를 상대에 맞게 조정(친한 친구 → 언어교환 파트너/새로 사귄 친구/동료).
   - buddyCard도 해요체 상황에 맞게 재작성.
3. 변형 생성은 **생성→교차 리뷰→적용** 파이프라인(리뷰 중점: 존대 일관성 — 반말 잔여 혼입, 부자연한 과공손,
   choices의 correct/오답 feedback이 새 문체에서도 성립하는지).

### Part B. 신규 해요체 시나리오 8개 (해요체가 원래 자연스러운 상황)
카페 사장님과 단골 스몰토크 / 언어교환 첫 만남 / 회사 동료와 점심 / 동네 이웃 엘리베이터 /
미용실 수다 / 택시 기사님과 대화 / 운동 클래스 전후 잡담 / 한국인 친구 부모님께 인사.
- 스키마·품질은 기존 시나리오와 동일(you-turn choices 3개, correct 1개, feedback 전 보기, buddyCard 포함).
- `scripts/convo-src/`에 신규 시드 파일 → generate → `validate-conversations.mjs` 통과.

### Part C. UI — 기본 노출 전환 (잠금 없음)
- Speak/Roleplay 목록에 register 필터 칩 `해요체 · Polite | 반말 · Casual | 전체` — **기본값 해요체**,
  선택은 `kcs.roleplay-register-v1`에 기억(00-README 키 표·백업 규칙 갱신).
- 시나리오 카드에 register 배지. pairId가 있으면 상세 화면에 "반말 버전 보기 ↔ 해요체 버전 보기" 링크.
- Today plan/Speak의 say-it·scene 추천이 해요체 필터를 따르게(반말 시나리오가 기본 추천에 안 뜨게).

## 수용 기준
1. 해요체 시나리오 총 ≥23개(변형 15 + 신규 8), validate-conversations 통과, 전 시나리오 register 태깅.
2. 리뷰 기록(수정 건수 포함) 남김. 존대 혼입 0 — 검증 스크립트로 해요체 시나리오의 반말 어미 잔여 스캔.
3. 신규 사용자(빈 프로필) 기준 Roleplay 첫 화면이 해요체 목록(브라우저 확인 스크린샷).
4. 반말 시나리오는 필터로 전부 접근 가능(삭제·잠금 없음). 5. 테스트 green + build + lint:content.

## 하지 말 것
- 반말 시나리오 삭제·수정(변형 추가만). 반말 신규 훈련 제작(사용자 결정). LLM 채점 도입.
- 46개 전부 변형(선별 15개만 — 나머지는 반말 고유 상황).

## 완료 기록
✅ done 2026-07-17 — Opus 4.8 직접 구현.

- **register 태깅 실측**: 46개 중 banmal 43 / haeyo 3. 결정적 발견 — 기존 haeyo 3개는 전부
  은행원·구청 직원·동료 창구 응대로, **"해요체로 대화하는 또래·지인" 시나리오가 0개**였다.
- **변형 15개**(`scripts/convo-src/x-haeyo-variants.json`): 날씨 스몰토크·커피·점심·디저트·옷 고르기·
  선물·드라마 추천·넷플릭스·취미·등산·부산vs제주·같이 공부·근황·오랜만·취직 축하.
  각 원본의 비트 구조 유지, 상대를 언어교환 파트너/동료/지인으로 재설정, `pairId`로 원본과 상호 링크.
- **신규 8개**(`x-haeyo-new.json`): 단골 카페·언어교환 첫 만남·동료 점심·이웃 엘리베이터·미용실·택시·
  헬스장·친구 부모님 인사. 친구 부모님 편은 해요체 기반 + 고정 합니다체(처음 뵙겠습니다/잘 먹겠습니다)를
  tip·feedback으로 설명.
- 버디카드 23개 추가(46→69), 기존 46개 전부 `register` 태깅.
- UI: `Conversation.svelte`에 register 필터 칩(기본 해요체) + register 배지 + pair 상호 링크,
  `SETTING` 맵을 신규 7종(cafe/restaurant/elevator/salon/taxi/gym/home)+기존 누락 2종까지 확장
  (이전엔 칩에 raw 값이 노출되고 있었음). `Speak.svelte`의 추천 roleplay도 필터를 따름.
- 저장: `kcs.roleplay-register-v1`(persistedString) — backup BACKUP_KEYS·SCALAR_KEYS 양쪽 등록
  (SCALAR 누락 시 import가 JSON 파싱 실패로 조용히 스킵 — 테스트로 발견).

### 검증
- 생성 5배치 → **직접 전수 검증**(에이전트 자체 보고를 신뢰하지 않음): 스키마 0오류,
  종결어미 정밀 스캔으로 **반말 누출 4건 발견·수정**(정답 선택지 1건 포함 — `자주 만났는데` → `만났는데요`.
  종결 `-는데`는 해요체에서 `요`가 필요). 수정 후 재스캔 0건.
- 테스트 63파일 / **322개 green**(신규: register store 3개, 필터 기본값·pair 링크 2개).
  기존 Conversation 테스트 5개는 기본 필터 변경으로 반말 픽스처가 안 보여 실패 → 의도된 동작 변화이므로
  필터 전환 헬퍼로 적응 + 필터 자체 검증 테스트 신규 추가.
- build + bundle guard + lint:content + verify-data-integrity 전부 PASS.
- 브라우저 QA(모바일 375px, 빈 프로필): 기본 해요체 26개 노출·반말 미노출, 칩/아이콘 정상,
  언어교환 첫 만남 대화 품질 확인(정답=자연스러운 해요체+되묻기, 오답=과공손·단답), pair 양방향 전환 동작.

### ⚠️ 발견한 기존 파이프라인 버그 (이번 작업과 무관, 미해결로 남김)
`apply-curriculum-structure.mjs`가 손으로 쓴 `curriculum-grammar-extras.json`(하이픈 로마자
`chingu-ui`)을 `grammar.json`에 덮어쓰는데, **커밋된 grammar.json은 "generate 직후" 상태**(하이픈 없음).
→ 전체 파이프라인(generate→apply→build)을 돌릴 때마다 무관한 grammar diff가 생기고
`verify-data-integrity`가 실패한다. 이번 작업은 챕터 구조를 안 건드리므로 **apply를 건너뛰고
generate→build만 실행**해 회피했다. 근본 수정(둘 중 어느 로마자가 정답인지 결정 후 정합)은 별도 과제.
