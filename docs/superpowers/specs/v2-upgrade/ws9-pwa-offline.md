# WS9 — PWA/오프라인

우선순위 P3. 착수 조건: WS1 데이터 분할 완료 + 사용자 진행 승인.
목표 한 줄: 설치 가능한 정적 PWA로 만들고, 한 번 열린 앱은 앱 셸과 학습 데이터가 오프라인에서도 다시 열린다.

## 요구 범위

- `manifest.webmanifest`와 앱 아이콘을 추가한다.
- service worker가 앱 셸, Vite 해시 asset, `public/data/*.json`, manifest, icon을 캐시한다.
- 데이터 loader의 `data/manifest.json` 요청은 오프라인에서 캐시 fallback을 쓴다.
- 새 버전 service worker가 waiting 상태가 되면 앱 안에서 업데이트 토스트를 보여 주고, 사용자가 reload를 누르면 활성화한다.
- 기존 정적 사이트 원칙을 유지한다. 계정/클라우드 동기화/IndexedDB는 범위 밖.

## 완료 기록

- 날짜: 2026-07-08
- 변경 파일:
  - `index.html`
  - `package.json`
  - `public/manifest.webmanifest`
  - `public/sw.js`
  - `public/icons/icon.svg`
  - `public/icons/icon-192.png`
  - `public/icons/icon-512.png`
  - `scripts/finalize-pwa.mjs`
  - `scripts/finalize-pwa.test.js`
  - `src/App.svelte`
  - `src/App.test.js`
  - `src/lib/pwa.js`
  - `src/lib/pwa.test.js`
  - `docs/superpowers/specs/v2-upgrade/00-README.md`
  - `docs/superpowers/specs/v2-upgrade/ws9-pwa-offline.md`
- 구현:
  - Vite build 후 `scripts/finalize-pwa.mjs`가 `dist/sw.js`에 실제 해시 asset/data 목록을 주입한다.
  - service worker는 앱 셸, data split 파일, manifest/icon, Vite asset을 pre-cache하고, 외부 font/icon CSS와 연결 font 파일을 runtime cache로 warm한다.
  - navigation과 `data/manifest.json`은 network-first + cache fallback, 해시 asset/data는 cache-first로 처리한다.
  - `src/lib/pwa.js`는 production에서만 service worker를 등록하고, waiting worker가 있으면 update toast 상태를 노출한다. 첫 설치 시 controller claim으로 인한 불필요한 reload는 막았다.
  - App shell은 `Update ready` toast와 reload 버튼을 렌더한다.
- 테스트/검증:
  - `src/lib/pwa.test.js` 4개: base path worker URL, 비지원/disabled no-op, waiting worker activation message, 첫 설치 controllerchange no-reload.
  - `scripts/finalize-pwa.test.js` 1개: app shell/asset/data/icon precache URL 수집.
  - `src/App.test.js` 2개: 기본 shell + update toast 렌더.
  - `npm run build`: `Finalized PWA service worker with 20 precached URLs.` 확인, boot data gzip 1,102,180 bytes PASS.
  - Playwright production preview QA: `http://127.0.0.1:5196/korean-core-starter/`에서 service worker 설치, cache 220 requests, offline reload 후 Learn 로드, offline 상태에서 Dictionary 이동 + `학교` 검색 성공, console error/requestfailed 0.
  - 증거: `.omo/evidence/ws9-pwa-offline/qa-result.json`, `mobile-offline-learn.png`, `mobile-offline-dictionary.png`.
- 남긴 이슈:
  - 없음.
