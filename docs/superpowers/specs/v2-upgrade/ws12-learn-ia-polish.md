# WS12 — Learn 홈 정보구조 재편 + 릴리스 폴리시

우선순위 P2(시점 중요: **C0·C3 착수 전 또는 직후** — 그들이 Learn 목록에 카드를 얹는다). 규모: 소~중.
목표 한 줄: 챕터 65 + 팩 8 + 체크포인트 3 + (후일) 리딩룸이 얹혀도 Learn 홈이 "다음 할 일"을 한눈에 주게 만든다.

## 배경
- 현 Learn 홈 = 미션 패널 + 챕터 65개 세로 목록(레벨 구분선만). C0 팩 8개, C3 체크포인트 3개,
  C6 리딩룸 섹션이 계획대로 들어오면 **80+ 카드의 단일 스크롤** — 초보자가 압도된다
  (이 앱의 출발점이 "어려워 보인다"였음을 기억할 것).
- index.html에 og/description 메타 0개 — 링크 공유 시 제목만 덜렁.

## 구현

### 1. 레벨 아코디언 (핵심)
- 챕터 목록을 레벨 그룹(A1 Foundation / A2 Builder / B1 / B2 / C1)으로 접기:
  - **현재 학습 중인 그룹만 펼침**(첫 미완료 챕터가 속한 레벨). 나머지는 헤더만(그룹명 + 진행률 n/m + 도장 아이콘).
  - 헤더 탭으로 펼치고 접기. 상태는 `kcs.learn-open-v1`(Set)에 저장 — 사용자가 펼쳐둔 건 유지.
  - 그룹 헤더에 트랙 설명 한 줄(course의 curriculumTrack.description 재사용).
- 팩(C0)·체크포인트(C3) 카드는 소속 그룹 안의 제 위치에 그대로(스펙 변경 없음 — 이 WS는 감싸는 틀만).
- "이어서 학습" 카드(WS4)가 최상단 고정 — 접힌 상태에서도 다음 행동이 항상 보이게.
- 검색/점프: 목록 상단에 가벼운 챕터 필터 입력(제목 부분일치, 매치 그룹 자동 펼침) — 65개 스크롤 대체.

### 2. 릴리스 폴리시 (묶음 처리)
- **메타**: index.html에 `<meta name="description">`, og:title/description/image(간단한 정적 카드 이미지
  1장 — Hanmok 색으로 public/og.png 생성), twitter:card. title은 "Korean Core Starter — Learn Korean step by step".
- **접근성 기본기 패스**(전면 감사 아님, 스모크 수준): 탭 이동으로 레슨 플레이어 진행 가능한지,
  버튼에 aria-label 누락 상위 10개 보완, 포커스 링이 Hanmok 토큰에서 죽지 않았는지(`:focus-visible`),
  아코디언에 aria-expanded. 그 이상(스크린리더 전면 대응)은 범위 밖으로 기록만.
- **404 폴백**: gh-pages SPA 딥링크(해시 라우팅이라 대체로 무관하나 /korean-core-starter/learn 같은
  비해시 진입 확인) — 문제 있으면 404.html 리다이렉트 추가.

## 신규 키
- `kcs.learn-open-v1` — WS3 BACKUP_KEYS·00-README 표에 추가(병합: 합집합).

## 테스트
- 아코디언: 기본 펼침 그룹 계산(진도 조합별), 상태 저장·복원, 필터 매치 시 자동 펼침.
- 진행률 집계가 팩·체크포인트를 챕터 수에 섞지 않는지(C0/C3의 카운트 분리 원칙 유지).
- 기존 Learn 테스트 회귀 없음.

## 수용 기준
1. 프리뷰(모바일 375px): 첫 화면에 "이어서 학습 + 현재 레벨 그룹"만 보이고 나머지는 접힘(스크린샷).
2. 65챕터 전부 접근 가능(필터 포함 E2E 1회). 3. og 메타가 렌더된 HTML에 존재.
4. 키보드만으로 레슨 1화면 진행 가능. 5. 전 테스트 green + build.

## 하지 말 것
- 라우팅 구조 변경, 챕터 카드 디자인 개편(Hanmok 확정 디자인 유지 — 감싸는 그룹만 추가).
- 게임화 요소 추가(별·보상 등 — 범위 밖).

## 완료 기록
(실행자가 작성)
2026-07-08 Codex
- 변경 파일:
  - `src/lib/learnGroups.js`, `src/lib/learnGroups.test.js` — curriculumTrack/CEFR 기반 Learn 레벨 그룹, 현재 그룹 기본 펼침, 검색 시 매치 그룹 자동 펼침.
  - `src/lib/stores.js`, `src/lib/stores.test.js` — `kcs.learn-open-v1` 저장/토글/리셋.
  - `src/lib/backup.js`, `src/lib/backup.test.js` — Learn open-group 키 백업/복원 합집합 병합.
  - `src/lib/components/LearnPathView.svelte`, `src/lib/components/LearnLevelGroup.svelte` — 이어 학습, 검색, 레벨 아코디언을 Learn 첫 흐름으로 재배치. 보조 패널은 챕터 그룹 아래로 이동.
  - `index.html`, `public/404.html`, `public/og.png` — description/OG/Twitter 메타, gh-pages 직접 경로 fallback, 1200×630 공유 이미지.
  - `DESIGN.md`, `docs/superpowers/specs/v2-upgrade/00-README.md`, `docs/superpowers/specs/v2-upgrade/ws3-progress-backup.md` — WS12 IA 규칙과 localStorage 키 문서화.
- 검증:
  - RED evidence: `src/lib/learnGroups.test.js`를 먼저 추가해 `src/lib/learnGroups.js` 부재 실패를 확인한 뒤 구현.
  - 타깃 테스트: `npx vitest run src/lib/learnGroups.test.js src/lib/stores.test.js src/lib/backup.test.js src/App.test.js` — 4 files / 23 tests passed.
  - 전체 검증: `npm run preflight` — 48 files / 241 tests passed, production build passed, bundle check passed, content lint passed.
  - 릴리스 메타: `dist/index.html`에서 description/og/twitter 메타 확인, `dist/og.png` 1200×630 확인, `dist/404.html` 생성 확인.
  - Browser visual QA: `.omo/evidence/ws12-visual-qa/visual-qa.json` — mobile 375/tablet 768/desktop 1280 screenshots, group persistence, "reported" filter, direct route fallback, keyboard-only lesson progress all passed. Evidence screenshots:
    `.omo/evidence/ws12-visual-qa/01-mobile-learn-first-screen.png`,
    `.omo/evidence/ws12-visual-qa/02-tablet-learn-first-screen.png`,
    `.omo/evidence/ws12-visual-qa/03-desktop-filter-reported.png`,
    `.omo/evidence/ws12-visual-qa/04-direct-route-fallback.png`,
    `.omo/evidence/ws12-visual-qa/05-keyboard-lesson-progress.png`.
- 남긴 이슈:
  - GitHub Pages 직접 경로 fallback은 로컬 Vite preview가 unknown path에 `index.html`을 반환하므로 Playwright route로 `dist/404.html` 서빙 상황을 모사해 검증했다.
  - 전면 스크린리더 감사와 고품질 오디오는 본 WS 범위 밖.
