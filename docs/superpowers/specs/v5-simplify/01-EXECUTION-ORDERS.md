# V5 실행 지시서 — 세션에 붙여넣는 순서

## [공통 머리말] (모든 지시 앞에 붙임)
너는 이 저장소의 실행자다. `docs/superpowers/specs/v5-simplify/00-README.md`를 먼저 읽고
공통 규칙(v2-upgrade/00-README 상속)을 따른다. 착수 전 `npx vitest run`으로 기준선을 확인하고,
완료 = 테스트 green + build + lint:content + 브라우저 QA(375px) + 해당 스펙 완료 기록 작성.
커밋은 사용자가 요청할 때만 한다. 콘텐츠 신규 생성이 있으면 반드시 생성→교차 리뷰→적용.

## [지시 1] S1 — 한 줄 경로
`s1-level-path.md`를 구현하라. 핵심: `scripts/curriculum-path.json`(65개 챕터 id 명시 순서) 신설 →
검증 스크립트 → `curriculumSortValue()`가 pathOrder를 1순위로. 챕터 번호·id는 절대 건드리지 않는다.
A2/B1 내부 순서는 스펙의 제안을 grammarNotes 실측으로 검증 후 확정하고 근거를 완료 기록에 남겨라.
수용 기준 4개 전부 증빙(E2E 포함).

## [지시 2] S2 — 레벨 게이트
`s2-level-gate.md`를 구현하라. 순서: Part A(learnerLevel, TDD) → B(Practice 기본 덱 recommended +
levelCap + distractor 게이트) → C(Speak 추천 3종 필터) → D(Dictionary 기본 필터+가상 스크롤) →
E(사전 미등재 21개 마감 — 시드 추가분은 교차 리뷰 필수). 신규 저장 키 0개.
"신규 사용자 Practice에 B1+ 0개" 테스트로 고정.

## [지시 3] S3 — 화면당 결정 1개
`s3-one-decision.md`를 구현하라. S2 완료 확인 후 착수. Practice 히어로+폴드 → Speak 재배치 →
Guide 점진 노출. 측정 스크립트로 before/after(탭 요소 수·화면 높이)를 완료 기록에 표로 남겨라.
기능 삭제 금지 — 전부 폴드 안에서 접근 가능해야 하며 딥링크 회귀 없음을 E2E로.
