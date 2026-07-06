# WS2 — 데이터 파이프라인 정합성 복구

우선순위 **P1, 가장 먼저 실행**. 규모: 중. 의존성 없음.
목표 한 줄: `generate → apply → build` 전체 재실행이 커밋 데이터와 **항목 수·headword 집합·id가 동일한** 결과를 내게 만든다.

## 문제의 실체 (2026-07-05 실측)

1. **185개 항목 소실**: 커밋된 `korean/data/vocab-extended.json`(2247 entries)에는
   한국어·예약·선물·드라마·환승·붐비다·말씀드리다 등 185개 headword가 있으나,
   `scripts/generate-korean-data.mjs` 재실행 결과(2059개)에는 없다.
   원인 추정: 과거에 시드 없이 생성 데이터에 직접 추가됐거나, 시드 파일이 삭제/이동됨. **실행자가 원인을 실증할 것.**
2. **id가 위치 기반이라 불안정**: `generate-korean-data.mjs` 1060행 부근
   ```js
   const extendedVocab = loadExtendedSeeds().map((o, index) => {
     ...
     entry.id = `word-ext-${String(index + 1).padStart(3, '0')}`;
     entry.sort = 700 + index + 1;
   ```
   시드는 `readdirSync(vocab-src).sort()` 순서로 flatMap되므로, **시드 파일 하나라도 항목이 추가/삭제되면
   그 뒤 모든 항목의 id가 밀린다.** id는 다음에서 참조되므로 밀리면 앱이 조용히 깨진다:
   - 챕터의 `linkedEntryIds`/`coreVocabularyIds` (course.json)
   - 사용자 localStorage: `ksrs-v1`(SRS 카드), `kcs.mistakes-v1`
   - `aliasIds`(build-app-data dedupe)
3. expressions는 반대로 재생성본이 19개 **많다**(857→876) — src에 시드가 이미 추가돼 있는데
   커밋 데이터에 반영이 안 된 것. 이 19개는 "생성돼야 정상"이므로 살리되 내용 검수할 것.

## 구현 단계

### Step 1 — 진단 스크립트 작성: `scripts/diagnose-data-drift.mjs`
- HEAD 커밋의 생성 파일과 "재생성 결과"를 비교하되, **korean/data를 실제로 덮어쓰지 말 것.**
  generate 스크립트를 임시 출력 디렉토리로 돌리도록 하거나(환경변수 `OUT_DIR` 지원 추가),
  git stash/worktree로 안전하게. 권장: generate에 `--out <dir>` 플래그 추가(기본값 기존 경로).
- 출력: 섹션별(words/expressions/vocab-extended/patterns/newcomerVocab)
  (a) HEAD에만 있는 headword 목록, (b) 재생성본에만 있는 headword 목록, (c) headword 동일하나 id가 다른 목록.
- 결과를 `docs/superpowers/specs/v2-upgrade/ws2-drift-report.md`로 저장(사람이 읽을 수 있게).

### Step 2 — 소실 185개 복구 시드 생성
- HEAD의 vocab-extended.json에서 소실 항목 원본을 추출.
- 생성기 시드 형식으로 역변환해 `scripts/vocab-src/recovered-2026-07.json` 저장.
  시드 스키마(1060행 확인): `{kind, hangul, english, topic, chapterIds, grammarIds, usage, examples, nuance, mistakes, level, structuredNuance?}`
  — `usage`/`examples`는 `[ko, en, note]` 삼중 배열.
- 역변환 시 생성기가 다시 만들어내는 파생 필드(forms, romanization 등)는 시드에 넣지 말 것
  — `generalWordEntry()`가 무엇을 파생하는지 코드로 확인하고 **시드에 필요한 원료 필드만** 담는다.
- 항목이 words/expressions 소속이면 각각 `verb-src`/`expr-src`의 스키마를 따라 별도 recovered 파일로.

### Step 3 — id 안정화 (이 WS의 핵심 설계 결정)
위치 기반 id를 **manifest 고정 방식**으로 바꾼다:
- 신규 파일 `scripts/id-manifest.json` (체크인): `{ "extendedVocab": { "<hangul>|<kind>": "word-ext-0001", ... }, "words": {...}, ... }`
  최초 1회 **HEAD 커밋 데이터에서 생성**(현재 사용자들이 가진 id가 정답이므로).
- generate 수정: id 부여 시 manifest 조회 → 있으면 그 id, 없으면(신규 항목) 미사용 다음 번호 발급 후 manifest에 추가 기록.
  `sort`도 manifest에 함께 고정(현행 sort 값 보존). 스크립트가 manifest를 갱신하면 그 diff도 커밋 대상.
- 키 충돌 주의: 같은 hangul이 kind 다르게 존재 가능 → 키는 `hangul|kind`(부족하면 `|english` 첫 단어까지).
  실제 데이터로 키 유일성 검증하고, 유일하지 않으면 키 설계를 보강할 것.

### Step 4 — 무결성 가드: `scripts/verify-data-integrity.mjs`
- 입력: 생성 결과 디렉토리. 검증:
  (a) 섹션별 항목 수 = `scripts/data-manifest.json`(체크인, 이 WS에서 생성)의 기대값
  (b) headword 집합 일치 (추가는 경고+manifest 갱신 안내, 소실은 **에러**)
  (c) id 중복 없음, id-manifest와 일치
- generate-korean-data.mjs 말미에서 자동 호출, 실패 시 exit 1 (생성 파일을 쓰기 전에 검증하거나, 임시로 쓰고 검증 후 이동).
- 의도적 콘텐츠 추가 워크플로: `node scripts/verify-data-integrity.mjs --update-manifest`로 명시 갱신.

### Step 5 — 전체 파이프라인 재실행 + 정합 확인
```bash
node scripts/generate-korean-data.mjs
node scripts/apply-curriculum-structure.mjs
node scripts/build-app-data.mjs
npx vitest run && npm run build
```
- 기대 결과: `git diff korean/data/` 가 **의미적 no-op에 수렴**.
  허용되는 diff: expressions +19(검수 후), 포맷/키순서 차이(가능하면 생성기가 기존 포맷 유지하게).
  **불허**: 항목 소실, 기존 id 변경, 예문 텍스트 변질(38개 예문 패치는 src에 반영돼 있어 유지돼야 함).
- app-data.json 총 항목 수 3,768 이상(expressions 검수분 반영 시 3,787±)인지 확인.

### Step 6 — 문서화
- `scripts/README.md` 신설: 파이프라인 순서, manifest 두 개의 역할, 콘텐츠 추가 절차(시드 추가 → generate →
  verify --update-manifest → build → 테스트), "절대 하지 말 것" 목록.

## 테스트 추가 (vitest)
- `scripts/` 스크립트는 vitest 대상 밖이므로, 검증 로직 중 순수 함수(집합 비교, manifest 조회)는
  `scripts/lib/integrity.mjs`로 분리해 node로 단독 실행 가능한 self-test를 갖추거나,
  `src/lib/data.test.js`에 "app-data 항목 수 ≥ 3768 · id 중복 없음 · word-ext id 형식" 스냅샷성 테스트를 추가.

## 수용 기준 (전부 만족해야 완료)
1. 파이프라인 전체 재실행 후 소실 0, 기존 id 변경 0 (diagnose 스크립트 재실행으로 증명).
2. 인위적으로 시드 1개를 지우고 generate 실행 → verify가 exit 1로 막는다 (확인 후 원복).
3. 인위적으로 시드 순서를 섞어도(파일 분할 변경 등) id가 불변이다.
4. 134개 기존 테스트 + 신규 테스트 green, `npm run build` 성공.
5. ws2-drift-report.md에 185개의 원인 분석과 처리 결과가 기록돼 있다.

## 하지 말 것
- korean/data의 커밋본을 "정답"으로 삼지 않고 재생성본을 그냥 커밋해버리는 것 (185개 증발 — 이번 사고의 재연).
- id 체계 전면 교체(예: hangul 기반 id로 변경) — localStorage 하위호환이 깨진다.
- rich-chapters, src/ UI 코드 수정 (이 WS는 scripts/와 korean/data만).

## 완료 기록
(실행자가 작성)
