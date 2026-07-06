# WS1 — 데이터 분할 로딩 (20MB → 부트 ≤1.2MB gzip)

우선순위 P1. 규모: 대. **의존: WS2 완료 후 착수** (build 스크립트를 손대므로 파이프라인이 안전해야 함).
목표 한 줄: 첫 페인트는 core+index만 블로킹 로드하고, 나머지는 지연/프리페치로 — 초기 데이터 gzip ≤ **1.2MB**.

## 현재 구조 (실측 근거)

- `src/lib/data.js`: `import data from '../../korean/data/app-data.json'` **동기 import** →
  Vite manualChunks가 `data-*.js` 17.6MB(gzip 4.94MB) 단일 청크 생성. 모듈 평가 시 전체 파싱.
- data.js가 export하는 것(전부 동기 값): `entries, findEntry, chapters, levels, curriculumGuide,
  functionTags, grammar, findGrammar, activities, guideTracks, dialogues, conversations` + `tagB1()` 부수효과.
- 소비자: 6개 라우트(Learn/Talk/Practice/Guide/Conversation/Dictionary) + EntryDetail 등 컴포넌트.
- 섹션 크기(raw): extendedVocab 9.0MB / expressions 4.2MB / words 2.8MB / course 1.7MB / 나머지 합 ~1.2MB.
- `main.js`는 즉시 `new App(...)` 마운트. 스플래시 없음.
- gzip 압축률 실측 ≈ 3.8:1 (18.8MB→4.94MB). 이 비율로 목표 역산할 것.

## 분할 설계

`scripts/build-app-data.mjs`가 단일 app-data.json 대신 **public/data/*.json 5개**를 산출:

| 파일 | 내용 | raw 예상 | 로드 시점 |
|---|---|---|---|
| `app-core.json` | course(리치 병합) + grammar + activities + guide + dialogues + conversations + patterns + newcomerVocab | ~3.5MB | **부트 블로킹** |
| `app-index.json` | 전 항목 슬림 인덱스(아래 스키마) | ~0.6MB | **부트 블로킹** |
| `app-words.json` | words 545 | ~2.8MB | 마운트 직후 **프리페치**(논블로킹) |
| `app-expressions.json` | expressions 788 | ~4.2MB | Dictionary 진입 시 |
| `app-extended.json` | extendedVocab 2247 | ~9.0MB | Dictionary 진입 시 |

부트 블로킹 = core+index ≈ 4.1MB raw ≈ **1.1MB gzip** → 목표 충족.
인덱스 스키마(항목당): `{id, hangul, romanization, english, level, type, partOfSpeech, topic, section}`
— `section ∈ 'words'|'expressions'|'extended'|'core'`(newcomer/patterns는 core에 풀 엔트리 포함).
`aliasIds` 해석과 dedupe, `tagB1()` 레벨 승격은 **빌드 타임에 인덱스에 미리 굽는다**(런타임 tagB1 제거).

산출 위치는 `public/data/` (Vite가 dist로 복사, fetch 시 브라우저 캐시 활용).
**캐시 버스팅**: build-app-data가 내용 해시 8자를 파일명에 넣고(`app-core.a1b2c3d4.json`)
`public/data/manifest.json`에 매핑 기록 → 로더는 manifest(작음, `cache: 'no-cache'`)를 먼저 읽는다.
korean/data/app-data.json 산출은 **중단**(하위 호환 필요 시 한 릴리스 동안 병행 산출 후 제거 — 실행자 판단).

## 로더 설계

신규 `src/lib/dataLoader.js`:
```js
import { writable, get } from 'svelte/store';
export const dataState = writable({ core:false, words:false, expressions:false, extended:false });
const BASE = import.meta.env.BASE_URL + 'data/';
let manifest;                       // {name: hashedFilename}
async function fetchJson(name) { ... } // manifest 조회 → fetch → 실패 시 1회 재시도 → throw
export async function loadBoot()    // core+index 병렬 로드, data.js 내부 채움, dataState.core=true
export async function ensureSection(name)  // 'words'|'expressions'|'extended' — 멱등(inflight promise 캐시)
export function prefetchAll()       // words 즉시, expressions/extended는 requestIdleCallback
```

`src/lib/data.js`는 **façade로 유지**(6개 라우트의 import 문 무수정이 목표):
```js
export let chapters = [], grammar = [], ... ;   // loadBoot()이 채우는 live binding
export const entries = [];                       // 시작: 인덱스 슬림 항목 → hydrate로 승격
export function findEntry(id) { ... }            // 슬림/풀 무엇이든 반환 (byId Map)
export function isFull(entry) { return !!entry._full; }
export async function getEntryFull(id) { await ensureSection(...); return findEntry(id); }
```
hydrate 규칙: 섹션 도착 시 슬림 항목을 같은 배열 index에서 **풀 엔트리로 교체**하고 `_full: true` 마킹,
byId Map 갱신. `entries` 배열 정체성은 유지(라우트가 재구독 없이도 동작하게 별도 `entriesVersion` writable 제공,
Dictionary는 `$entriesVersion` 참조로 리렌더 트리거).

### 부트 시퀀스
1. `index.html`에 인라인 스플래시(한 로고 + CSS 스피너, JS 불필요) 추가 — `#app` 비어있는 동안 표시.
2. `main.js`:
   ```js
   import { loadBoot, prefetchAll } from './lib/dataLoader.js';
   loadBoot().then(() => { new App({ target: ... }); prefetchAll(); })
     .catch(() => renderBootError());  // 재시도 버튼 있는 정적 에러 화면
   ```
3. 로드 실패 UI: 무한 스피너 금지. "연결을 확인해 주세요 · 다시 시도" 버튼 → `location.reload()`.

### 라우트별 처리
- **Learn**: 챕터 어휘는 `linkedEntryIds`/`coreVocabularyIds` → 대부분 words 소속.
  챕터 열기 시 `await ensureSection('words')`(프리페치로 보통 이미 완료). LessonPlayer의
  extendedVocabulary는 course에 내장돼 있어 무관.
- **Dictionary**: 목록/검색/필터는 인덱스만으로 즉시 렌더(이미 가능한 필드만 사용하는지
  `src/lib/search.js` 확인 — 부족 필드 있으면 인덱스 스키마에 추가). 진입 시
  `ensureSection('expressions') + ensureSection('extended')` 병렬 + 상단 얇은 로딩 바.
  EntryDetail은 `getEntryFull(id)` await 후 렌더, 로딩 중 스켈레톤.
- **Practice**: 퀴즈 풀이 words/mistakes 기반 — `ensureSection('words')` 선행. SRS due 카드에
  expressions/extended id가 있으면 해당 섹션 로드 후 세션 시작(카드 id의 section은 인덱스에서 판별).
- **Talk/Roleplay/Guide**: core만으로 동작(dialogues/conversations/guide 포함). 검증만.
- `<script context="module">`에서 data.js 값을 읽는 파일이 있는지 `grep -rn "context=\"module\"" src/` 로
  전수 확인 — 있으면 인스턴스 스코프로 이동(모듈 평가 시점엔 데이터가 비어 있으므로).

## vite.config 변경
- `manualChunks`의 `korean/data` 분기 **제거**(이제 JSON을 import하지 않음).
- `chunkSizeWarningLimit: 6000` → 1000으로 낮춰 회귀 감지.

## 사이즈 가드: `scripts/check-bundle-size.mjs`
- `npm run build` 후 실행: dist에서 부트 대상(core+index gzip 합) 계산, **1.3MB 초과 시 exit 1**
  (여유 0.1MB). `package.json`에 `"build": "vite build && node scripts/check-bundle-size.mjs"`.

## 테스트 계획
- 로더 단위: fetch mock으로 loadBoot/ensureSection 멱등성·재시도·실패 전파. hydrate 후 findEntry가
  풀 엔트리 반환. 인덱스→풀 교체 시 배열 길이 불변.
- 기존 134개: data.js 동기 의존 테스트가 깨질 것 — 테스트 setup(`src/test-setup.js`)에서
  fixture로 loadBoot을 동기 완료시키는 헬퍼 제공(실제 JSON 파일을 fs로 읽어 주입).
- 스모크(수동, preview MCP): 6개 탭 각 1동작 + 오프라인 DevTools로 부트 실패 화면 확인.

## 수용 기준
1. 부트 블로킹 gzip ≤ 1.2MB (check-bundle-size 통과 로그 첨부).
2. Learn 챕터 열기·Practice 퀴즈·Dictionary 검색→상세·Guide/Shadow/Roleplay 렌더 정상.
3. 전 테스트 green + build 성공. 4. 네트워크 실패 시 재시도 UI.
5. Dictionary 첫 진입에서 expressions/extended 로딩 중에도 인덱스 기반 목록이 먼저 보인다.

## 하지 말 것
- 라우트 6개의 import 경로 대량 변경(façade 유지가 원칙 — diff 최소화).
- 서비스워커/PWA(WS9 별도). IndexedDB 캐시(브라우저 HTTP 캐시로 충분, v1 범위 밖).

## 완료 기록
(실행자가 작성)
