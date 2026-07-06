# WS11 — CI + 콘텐츠 품질 게이트

우선순위 P1(작지만 전 WS의 안전망 — WS2 직후 권장). 규모: 소. 의존: 없음(사이즈 가드는 WS1 후 활성).
목표 한 줄: "테스트는 있는데 강제 장치가 없다"를 끝낸다 — push마다 기계가 검증한다.

## 배경 (실측)
- `.github/workflows` 없음. vitest 134개·빌드가 전부 수동 — 실제로 2026-07-05 세션에서 테스트 전
  커밋이 발생한 전례 있음(재번호 커밋, 후속 수정으로 해결).
- 배포는 `npm run deploy`(gh-pages) 수동 — **수동 유지가 사용자 방침**(커밋·배포는 명시 요청 시만).
  CI는 검증만 하고 배포하지 않는다.

## 구현

### 1. GitHub Actions: `.github/workflows/ci.yml`
- 트리거: push + pull_request (모든 브랜치).
- 잡 1 `test-build`: checkout → setup-node(LTS, npm cache) → `npm ci` → `npx vitest run` → `npm run build`.
  (WS1 완료 후엔 build가 사이즈 가드 포함 — 별도 스텝 불요.)
- 잡 2 `content-lint`(아래 스크립트): `node scripts/lint-content.mjs`.
- 소요 목표 5분 이내. 캐시로 npm 설치 단축.

### 2. 콘텐츠 린트: `scripts/lint-content.mjs` (신설)
korean/data 산출물 대상 기계 검증(전부 이번 세션 감사에서 실제로 걸린 유형들):
| 검사 | 실패 조건 |
|---|---|
| 스키마 | 예문 dict에 ko/en 결측, romanization 결측(단어·표현 examples) |
| 정답 무결성 | inlineExercises: correct∉options, options 중복, type 화이트리스트 밖(C2의 validate와 통합 — 중복 구현 금지, C2 먼저면 그 스크립트를 흡수) |
| 레벨 | level ∉ {A1,A2,B1,B2,C1} / (C0 완료 후) A1 체크리스트 커버리지 <95% |
| id | 중복 id, 챕터 linkedEntryIds가 실존 entry를 가리키는지 |
| 카운트 | (WS2 완료 후) data-manifest와 일치 — verify-data-integrity 호출로 위임 |
- 출력: 위반 목록 + exit 1. 통과 시 요약 한 줄. `package.json`에 `"lint:content"` 스크립트 등록.

### 3. 로컬 훅(선택, 가벼움)
- `npm run preflight` = vitest + build + lint:content 묶음 스크립트. 실행자 규칙(00-README)에
  "커밋 전 preflight"로 명시. git hook 강제는 하지 않는다(도구 세션 다양성 고려).

## 수용 기준
1. GitHub에서 push 시 CI green 확인(뱃지 README-repo에 추가는 선택).
2. 린트가 인위적 오류(정답 누락 1건 주입)를 잡는 것을 테스트로 증명 후 원복.
3. CI에서 배포가 절대 일어나지 않는다. 4. 로컬 preflight 1커맨드 동작.

## 하지 말 것
- 자동 배포·자동 커밋. 커버리지 리포트 등 과설계. main 브랜치 보호 규칙(사용자 결정 사안 — 제안만).

## 완료 기록
(실행자가 작성)
