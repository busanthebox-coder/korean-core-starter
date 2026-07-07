# C9 — Day-1 온램프: 절대 초보(한국어 첫날 외국인) 진입 장벽 제거

콘텐츠 트랙. 규모: 중. 의존: C0(팩 메커니즘 재사용 — C0 먼저). 오디오 무관.
목표 한 줄: "한글도 모르고 한국어 키보드도 없는 사람"이 첫 30분을 막힘 없이 통과하게 만든다.

## 감사 결과 (2026-07-05 실측 — 이 스펙의 근거)

| 확인 항목 | 실태 |
|---|---|
| 앱 사용법 문서 | **없음.** Guide 탭은 한국 "생활" 가이드(입국·교통·은행·배민 6트랙)지 앱 매뉴얼이 아님. 저장소 README.md도 없음 |
| 한국어 키보드(IME) 안내 | **전무.** `src/lib/quiz.js:96` 주석("works without a Korean IME")이 문제를 인지하고 회피만 함. 그런데 C5 활용 드릴·C2 conjugate·받아쓰기(C1)·쓰기 과제는 전부 타이핑 필요 |
| 언어 오리엔테이션 | 없음 — 어순(SOV)·조사·높임의 "큰 그림" 선행 설명 없이 2과 문법 직행 |
| 생존 표현 | 20개 표본 중 **19개 사전 실존**(부재: 화장실이 어디예요? — 유사 표현 확인 필요) — 콘텐츠는 있고 묶음이 없음 |
| 한글 트레이너 | 자모 발음(탭 재생)+음절 조립 잘 갖춤. 실단어 읽기 유창성 드릴은 없음(선택 보강) |
| 로마자 의존 | 전역 토글뿐 — "언제 꺼야 하는지" 안내·넛지 없음 |

## 구현 — 5파트

### Part A. "How Korean Works" 오리엔테이션 (10개 개념 카드)
- 위치: Learn 최상단 1과 위에 작은 카드 "Start here — How Korean works (5 min)" + WS4 온보딩 환영 화면에서 링크.
  완료는 `kcs.orientation-v1`('1') — 완료 후 카드는 Guide로 내려가 상시 접근.
- 형식: LessonPlayer류 카드 스와이프 10장(신규 미니 컴포넌트 허용, 레슨 플레이어 재사용 가능하면 재사용).
  각 카드 = 개념 1문장 + 실물 예 1개 + "어느 과에서 제대로 배우는지" 링크. 영어 서술, 한국어 예시.
- **10개 개념은 02-CONTENT-BRIEFS §B8-1에 확정** — 재발명 금지.

### Part B. Day-1 생존 표현 팩 2개 (C0 팩 메커니즘 재사용)
- `pack-survival-basics`(1과 뒤)·`pack-survival-help`(2과 뒤) — 수록 목록은 §B8-2 확정.
- C0의 vocab-packs.json 스키마·카드 UI·MatchGame 마무리 그대로. expressions 항목도 팩에 담을 수 있는지
  확인(팩 해석이 words만 가정하면 expressions 지원 확장 — 사전 실존 19개가 expressions 소속).
- 부재 1건(화장실이 어디예요?)은 유사 표제어(화장실 어디예요? 등) 탐색 후 없으면 expr 시드 추가(WS2 규칙).

### Part C. 한국어 키보드 온보딩 + 타이핑 폴백 (막힘 제거의 핵심)
1. **IME 설치 가이드**: Guide 탭 "Set up Korean typing" 유닛 1개 신설(기존 트랙 카드 형식 재사용).
   내용 아웃라인 §B8-3 확정(iOS/Android/Mac/Windows 4플랫폼 + 두벌식 30초 개념 + 연습은 1과 트레이너로 링크).
2. **타이핑 폴백 컴포넌트** `src/lib/components/KoreanInputFallback.svelte`:
   - 타이핑 채점 문항에서 "키보드가 없어요?" 토글 → **어절 뱅크 모드**(정답을 어절로 쪼개 + 오답 어절 2~3개
     섞어 탭 조립 — quiz.js의 build/scramble 메커니즘 재사용). 채점은 동일 normalizeKo 경로.
   - 적용 대상(각 구현 시 이 컴포넌트를 쓰도록): 쓰기 과제는 제외(자유 작문 — 폴백 무의미, 대신 IME 가이드 링크),
     C5 활용 드릴·C2 conjugate·WS7 따라 쓰기·C1 받아쓰기(후일)에 적용.
   - 토글 상태는 `kcs.ime-fallback-v1`('1') 기억 — 매 문항 다시 묻지 않기.
3. Practice/레슨의 첫 타이핑 문항 진입 시 1회 안내 배너: "한국어 키보드가 없으면 → 탭 입력 / 설치 방법 보기".

### Part D. 로마자 웨이닝 넛지 (1회성, 강요 금지)
- 조건: 표시 3과 완료 시점 & 로마자 On → 1회 토스트/카드 "이제 로마자를 꺼 볼까요? 한글 읽기가 빨리 늘어요.
  [끄기] [나중에]". 다시 묻지 않음(`kcs.roman-nudge-v1`).
- Guide의 앱 사용법(Part E)에 "로마자는 언제 끄나" 항목 포함. 강제 off·자동 off 금지.

### Part E. 앱 사용법 문서화 (in-app + repo)
1. **In-app "How to use this app"**: Guide 탭 최상단 첫 카드(생활 트랙들 위). 내용 아웃라인 §B8-4 확정 —
   6탭 각 1줄 / 권장 데일리 15분 플로우(복습 비우기→새 레슨→섀도 1개) / SRS 작동 1문단 /
   로마자 정책 / 백업 방법(WS3 완료 시) / 배치테스트 재응시 경로. 영어 서술.
2. **저장소 README.md 신설**: 프로젝트 한 줄 소개·라이브 URL·스크린샷 1장 / 로컬 실행(npm i·dev·test·build) /
   데이터 파이프라인 요약 1문단 + scripts/README 링크(WS2 산출) / 배포 방법 / 스펙 문서 위치(v2-upgrade) /
   기여 규칙(00-README 공통 규칙 링크). 실행자·기여자 대상, 영어.

## 신규 키
`kcs.orientation-v1` · `kcs.ime-fallback-v1` · `kcs.roman-nudge-v1` → 00-README 키 표 + WS3 BACKUP_KEYS
(roman-nudge는 백업 제외 가능 — 넛지 재노출이 무해하므로 실행자 판단, 결정 기록).

## 테스트·수용 기준
1. 오리엔테이션 10카드 렌더·완료·Guide 이관 E2E 1회. 개념 카드의 "배우는 과" 링크 전부 유효.
2. 생존 팩 2개: 수록 항목 사전 매칭 100%(부재 1건 처리 내역 보고) + 팩 완주 E2E.
3. 폴백: 타이핑 문항에서 어절 뱅크로 정답 도달 가능(테스트) / 오답 어절이 정답과 시각적으로 구분 불가한
   수준으로 그럴듯한지(같은 챕터 어휘에서 추출) / 토글 기억.
4. IME 가이드 4플랫폼 렌더. 넛지 1회성 테스트(끄기/나중에 후 재노출 없음).
5. README.md로 처음 온 사람이 dev 서버까지 도달 가능(명령 실사 검증). 전 테스트 green + build.

## 하지 말 것
- 자모 단위 가상 키보드 자작(어절 뱅크로 충분 — 자모 조합 IME 재구현은 과설계).
- 로마자 강제/자동 off. 오리엔테이션을 필수 관문화(잠금 금지 원칙). 문법 용어 남발(오리엔테이션은 개념만).

## 완료 기록
2026-07-07 / Codex ULW `content-v2-ulw-20260707`

- 구현:
  - 저장소 `README.md` 신설: live URL, local run, test/build, data pipeline, deploy, v2 spec 위치.
  - Guide 최상단 `App Manual` 트랙 신설: `How to use this app`, `Set up Korean typing`, `How Korean Works`.
  - Learn 최상단 선택형 `How Korean Works` 10카드 오리엔테이션 추가. 완료 키는 `kcs.orientation-v1`; 완료 후 Learn 카드는 숨고 Guide에서 계속 접근 가능.
  - `pack-survival-basics`(1과 뒤)·`pack-survival-help`(2과 뒤) 추가. expressions 전용 팩은 `LessonPlayer`의 phrases 화면 + MatchGame으로 학습.
  - 부재 표현 `화장실이 어디예요?`를 expression seed에 추가하고 생존 도움 팩에 연결.
  - `KoreanInputFallback.svelte`와 `inputFallback.js` 추가. 타이핑 문항에서 "No Korean keyboard? Tap input" 토글로 어절 뱅크 입력을 사용할 수 있고 `kcs.ime-fallback-v1`에 기억.
  - Chapter 3 완료 + Romaja On 조건에서 1회 로마자 웨이닝 넛지 추가. 확인 키는 `kcs.roman-nudge-v1`.
  - 후속 gate 지적 처리:
    - `Learn.svelte`를 `LearnPathView.svelte`/`LearnProgressCard.svelte`로 분리해 route 파일을 188 pure LOC로 낮춤.
    - `Guide.svelte` dead CSS/import와 unused export 경고 제거.
    - `scripts/level-audit/audit-a1.mjs`가 C0 8팩 + C9 생존팩 2개(총 10개)를 필수 팩으로 검사하도록 보강.
    - `src/lib/data.js`가 vocab pack 항목의 결측 entry/related id를 조용히 필터링하지 않고 즉시 throw하도록 변경.
    - `scripts/build-app-data.mjs`가 중복 한글 표제어(`열/팔/천/눈/다리` 등)를 `entryId` 없이 해석하려 하면 즉시 실패하도록 변경. 숫자팩은 `열=ten`, `팔=eight`, `천=thousand`로 고정하고 몸팩은 신체 뜻을 유지.
    - 숫자팩 산수 예문 3건의 Korean/English 불일치(`십이예요` vs ten)를 `십이에요`로 교정하고 회귀 테스트를 추가.
    - `LessonPlayer.svelte`를 화면별 child component(`lessonPlayer/*`)로 분리해 부모를 187 pure LOC로 낮춤. `scripts/generate-korean-data.mjs`는 data-generation pipeline SIZE_OK 예외를 첫 줄에 명시하고 all-touched LOC audit에 포함.
    - 데스크톱 폭에서 `BottomNav`가 완료 버튼을 덮는 레이아웃 회귀를 `BottomNav.svelte` 내부 media rule로 수정.
- 증거:
  - RED baseline: `.omo/ulw-loop/content-v2-ulw-20260707/evidence/C9-red-baseline.txt`
  - 생존팩/표현 매칭: `.omo/ulw-loop/content-v2-ulw-20260707/evidence/C9-survival-pack-audit.txt`
  - 결측 pack entry 가드: `.omo/ulw-loop/content-v2-ulw-20260707/evidence/C9-pack-missing-entry-guard.txt`
  - 애매한 표제어 가드/의미 검증: `.omo/ulw-loop/content-v2-ulw-20260707/evidence/C9-ambiguous-pack-guard.txt`, `C9-pack-numbers-semantic.txt`
  - 숫자 산수 예문 검증: `.omo/ulw-loop/content-v2-ulw-20260707/evidence/C9-numbers-arithmetic-content.txt`
  - 입력 폴백/저장 키 테스트: `.omo/ulw-loop/content-v2-ulw-20260707/evidence/C9-input-fallback-test.txt`
  - 입력 폴백 실사용 QA: `.omo/ulw-loop/content-v2-ulw-20260707/evidence/C9-input-fallback-browser.txt` + `C9-input-fallback-live.png`
  - 로마자 넛지 1회성 QA: `.omo/ulw-loop/content-v2-ulw-20260707/evidence/C9-roman-nudge-browser.txt` + `C9-roman-nudge.png`
  - legacy bundle parity: `.omo/ulw-loop/content-v2-ulw-20260707/evidence/C9-data-bundle-parity.txt`
  - 브라우저 온램프 QA: `.omo/ulw-loop/content-v2-ulw-20260707/evidence/C9-browser-onramp.txt` + `C9-browser-*.png`
  - C0 pack/Dictionary 회귀: `.omo/ulw-loop/content-v2-ulw-20260707/evidence/C9-c0-regression.txt` + `C9-c0-regression-numbers-meaning.png`
  - 수동 QA 매트릭스/런타임 정리: `.omo/ulw-loop/content-v2-ulw-20260707/evidence/C9-manual-qa-matrix.md`, `C9-runtime-cleanup.txt`
  - 후속 refactor/LOC audit: `.omo/ulw-loop/content-v2-ulw-20260707/evidence/C9-post-gate-refactor-audit.txt`, `C9-all-touched-source-loc-slop-audit.txt`
  - LessonPlayer split browser QA: `.omo/ulw-loop/content-v2-ulw-20260707/evidence/C9-lessonplayer-refactor-cdp.txt` + `C9-lessonplayer-refactor-initial.png`, `C9-lessonplayer-refactor-complete.png`
  - 최종 data integrity/A1 audit/git whitespace: `C9-verify-integrity.txt`, `C0-audit-final.txt`, `git-diff-check-final.txt`
- 테스트/빌드:
  - targeted tests: `C9-data-store-tests.txt`, `C9-input-fallback-test.txt`, `C9-data-test-after-gate-fix.txt`
  - full tests/build: `C9-vitest-full.txt` PASS 26 files / 148 tests, `C9-npm-build.txt` PASS.
  - post-refactor full tests/build: `C9-vitest-after-refactor.txt` PASS 26 files / 148 tests, `C9-npm-build-after-refactor.txt` PASS.
  - `npm run build` 최종 상태: Svelte unused export/selector 경고 없음. 남은 경고는 기존 대용량 data chunk 경고 1건.
- 남긴 이슈:
  - 오디오는 사용자 요청대로 마지막 단계로 남김.
  - 대용량 `data-*.js` chunk는 기존 WS1(`ws1-data-splitting.md`) 범위로 남김.
  - `kcs.roman-nudge-v1`은 재노출이 무해한 넛지 상태라 백업 필수 대상에서 제외해도 된다. WS3에서 백업 정책 확정 시 사용자 진행 상태(`progress`, `packs`, `guide-ready`, `srs`, `mistakes`)를 우선 백업 대상으로 삼을 것.
