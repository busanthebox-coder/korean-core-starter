# V4 작업 지시서 — 세션에 그대로 붙여넣는 명령 블록

> 사용법: 새 실행 세션에 **[공통 머리말] + [지시 N]** 두 블록을 붙여넣는다. 한 세션 = 한 지시. 순서 V4-1 → V4-5.
> 이 파일은 수정 금지 — 완료 표시는 00-README 표와 각 스펙의 완료 기록에.

---

## 공통 머리말 (모든 지시 앞에 붙일 것)

```
너는 korean-core-starter의 실행 엔지니어다. 설계는 끝났다 — 재설계하지 말고 스펙대로 구현하라.
스펙에 모순·불가능이 있을 때만 멈추고 대안 2개와 함께 보고하라.

환경:
- 저장소: /Users/hannam/Downloads/blog app/korean-core-starter, 브랜치 hanmok-redesign
- (Claude Code인 경우) 이 경로는 샌드박스 read-denied라 Bash/python에 dangerouslyDisableSandbox: true 필요
- 먼저 읽어라: docs/superpowers/specs/v4-conversation/00-README.md
  + 공통 규칙·키 표·파이프라인 지도는 docs/superpowers/specs/v2-upgrade/00-README.md

절대 규칙:
1. 커밋·푸시·배포 금지 — 사용자가 요청할 때만.
2. 착수 전 npx vitest run 기준선 green 확인. 완료 조건 = 전 테스트 green + npm run build + npm run lint:content.
3. 신규 한국어 콘텐츠는 반드시 생성→교차 리뷰→적용 3단계. 고빈도 어휘·해요체 기본. UI 문자열은 영어.
4. **반말 신규 훈련 금지**(사용자 결정) — 기존 반말 자료는 삭제도 금지(후순위일 뿐).
5. 객관식류 신규 문항: 오답도 문법적으로 성립해야 하고(비문 오답 금지), 표시 순서는 scrambledOptions 경로를 태워라.
6. 스펙 범위 밖 리팩터 금지. "하지 말 것" 절은 문자 그대로.

완료 보고: 변경 파일 목록 / 수용 기준별 증거 / 테스트·빌드·린트 결과 / 스펙과 달리한 것+이유 / 남긴 이슈.
그리고 00-README 상태 ✅ + 스펙 완료 기록 작성.
```

---

## 지시 V4-1 — C13: Roleplay 해요체 정렬

```
스펙: docs/superpowers/specs/v4-conversation/c13-roleplay-polite.md 정독 후 그대로 구현하라.

순서 강제:
1. 46개 시나리오에 register 태깅부터(휴리스틱 초벌 → 정독 확정, 태깅 근거 기록).
2. 해요체 변형 후보 15개 선별 — "지인/언어교환 상대여도 성립"이 기준. 선별·제외 이유를 표로 보고.
3. 변형 15개 생성(-haeyo id, pairId 링크, buddyCard 포함 재작성) → 교차 리뷰(존대 일관성·반말 잔여·feedback 성립)
   → convo-src 시드 반영 → generate → validate-conversations 통과.
4. 신규 해요체 시나리오 8개(스펙의 상황 목록) — 같은 파이프라인.
5. UI: register 필터 칩(기본 해요체, kcs.roleplay-register-v1 기억 — 00-README 키 표 갱신), 카드 배지,
   pairId 상호 링크, Today/say-it 추천이 필터를 따르게.
6. 검증 스크립트: 해요체 시나리오의 반말 어미 잔여 스캔 0건 증명.

검증 의무: 빈 프로필 브라우저에서 Roleplay 첫 화면=해요체 목록 스크린샷 / 변형 1개 완주 E2E /
리뷰 수정 건수 보고. 금지: 반말 시나리오 삭제·수정, LLM 채점.
```

## 지시 V4-2 — C11: 리액션·맞장구 팩 + reaction 드릴

```
스펙: docs/superpowers/specs/v4-conversation/c11-reactions.md 정독 후 그대로 구현하라.

순서 강제:
1. 표현 시드 ~15개(부재 8 + 보강 후보에서 리뷰로 확정) — nuance에 비슷한 리액션과의 차이 필수 명시.
   generate + 무결성 가드(manifest 갱신 절차 준수).
2. 팩 2개(vocab-packs.json, expressions 팩) + audit-a1 필수 팩 목록 10→12 갱신.
3. reaction-drill.json ~40문항 큐레이션 — Roleplay partner 턴 재활용, 오답은 "문법적으로 멀쩡하되 상황에
   안 맞는" 것만(극성 반전·기능 불일치). 생성→교차 리뷰(정답 유일성·오답 성립성) 필수.
4. Practice에 Reactions 모드(10문항, ChatBubble 재사용, scrambledOptions 적용, 오답→mistakes/SRS).
5. lint-content에 reaction-drill 스키마 검사(options 3·natural true 정확히 1) 추가.

검증 의무: 팩 완주 E2E / Reactions 10문항 완주 E2E(브라우저) / 오답 SRS 유입 테스트 / 리뷰 기록.
금지: 반말 리액션 팩(문체 중립 감탄사 헐·대박은 허용), 40문항 초과.
```

## 지시 V4-3 — C15: 버디 세션 가이드

```
스펙: docs/superpowers/specs/v4-conversation/c15-buddy-guide.md 정독 후 그대로 구현하라.

핵심 요구:
1. Roleplay 시나리오 상세에 buddyCard 접이식 카드("👥 With a Korean friend? · 친구와 함께") —
   instructionKo 큰 글씨 + reactionKo, 기본 접힘, 부재 방어. lint-content에 buddyCard 검사 유무 확인 후 없으면 추가.
2. Speak 탭 "Buddy session · 이번 주 친구와" — ISO 주차 시드 결정론적 추천 3개(같은 주 동일 유지),
   3단계 고정 안내, 완료는 기존 spokenProgress 재사용(신규 키 금지).
3. Guide 매뉴얼에 버디 세션 항목("문법 설명은 앱이 합니다 — 친구는 발음과 실사용 여부만").
4. C13이 완료돼 있으면 추천이 register 필터(해요체 기본)를 따르게.

검증 의무: buddyCard 렌더 + 주간 미션 스크린샷 / 주차 회전·동일 주 유지 테스트(시계 mock) /
모바일 375px 확인. 금지: 친구용 별도 모드 신설, 신규 localStorage 키, 기존 buddyCard 대량 재작성.
```

## 지시 V4-4 — C14: 표현 뉘앙스 비교

```
스펙: docs/superpowers/specs/v4-conversation/c14-expression-nuance.md 정독 후 그대로 구현하라.

순서 강제:
1. expression-clusters.json ~30개 — 스펙의 후보 목록을 기초로 생성→교차 리뷰(rule의 사실 정확성 최우선:
   과단순화 규칙 금지, 예: '너무=부정 전용' 같은 낡은 규칙). members는 빌드 타임 entryId 해석, 미해석=빌드 에러.
2. 부재 짝 항목 시드 추가(미안해요·알았어요 최소 — 검토 후 확장) — 시드 규칙·리뷰 준수.
3. UI: EntryDetail "Similar words · 뭐가 달라요?" 접이식 표(현재 항목 하이라이트, 멤버 사전 링크) +
   WordsScreen 폴드에 초압축 1줄 힌트(클러스터 데이터의 hint 필드) + 전체 비교 링크.
4. lint-content 확장(멤버 실존·3개 이상 클러스터 중복 소속 경고).

검증 의무: 진짜/정말로 EntryDetail 표 + WordsScreen 힌트 브라우저 시연 / 클러스터 ≥30·해석 성공 카운트 /
리뷰 수정 건수 / 모바일에서 표 가독. 금지: 기존 nuance 대량 재작성, 클러스터 퀴즈, 50개 초과.
```

## 지시 V4-5 — C12: 구어 축약 노트

```
스펙: docs/superpowers/specs/v4-conversation/c12-spoken-contractions.md 정독 후 그대로 구현하라.

핵심 요구:
1. chapter-05(또는 03 — grammarNotes 흐름 보고 판단, 근거 기록)에 textbook 스키마 노트 1개 —
   스펙의 축약 표·keyPoint·pitfall·drill 4문항 그대로 살 붙이기. 자체 초안 후 별도 검토 패스 필수.
2. build-app-data만 실행, 노트 수 before/after 카운트.
3. Guide 매뉴얼에 축약 안내 1줄 + 노트 링크.
4. 자동 표기 등가 채점 금지(스펙 Part B) — 콘텐츠 가이드에 accepted 명시 규칙 1줄 추가만.

검증 의무: LessonPlayer에서 노트 표·drill 렌더 스크린샷 / 리뷰 통과 / 테스트+빌드+린트 green.
```
