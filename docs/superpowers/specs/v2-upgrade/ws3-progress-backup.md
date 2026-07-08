# WS3 — 진도 내보내기/가져오기

우선순위 P1. 규모: 소. 의존성 없음 (WS1과 무관하게 진행 가능).
목표 한 줄: 학습 기록 전체를 JSON 파일로 내보내고, 다른 기기/초기화 후에 **병합** 복원한다.

## 배경
- 모든 진도가 localStorage에만 있다(키 전수는 00-README 표 참조). 캐시 삭제 = 전부 소실.
- 계정/서버 없음(정적 gh-pages) → 파일 기반 백업이 v1의 올바른 해법.

## 구현

### 1. `src/lib/backup.js` 신설
```js
// 백업 대상 키의 단일 소스. 새 키가 생기면 여기 + 00-README 표에 추가.
const BACKUP_KEYS = [
  'kcs.roman', 'kcs.progress', 'kcs.lesson-activity-v1', 'kcs.guide-ready-v1',
  'kcs.shadow-done-v1', 'kcs.packs-v1', 'kcs.orientation-v1', 'kcs.ime-fallback-v1',
  'kcs.roman-nudge-v1', 'kcs.onboarded-v1', 'kcs.start-chapter-v1',
  'kcs.learn-open-v1', 'kcs.checkpoint-v1', 'kcs.readers-v1',
  'ksrs-v1', 'kcs.mistakes-v1', 'kcs.study-v1', 'kcs.streak-v1',
  // 이후 WS가 localStorage 키를 추가하면 BACKUP_KEYS와 00-README 키 표를 함께 갱신한다.
  // 'kcs.learn-open-v1'
];

export function exportProgress(now = Date.now()) // → {version: 1, exportedAt, app: 'korean-core-starter', data: {key: rawString}}
export function importProgress(json, { merge = true } = {}) // → {ok, imported: [...keys], skipped: [...], error?}
export function mergeStrategies(key, mine, theirs) // 키별 병합 규칙 (아래)
```
- export: 존재하는 키만 담는다. 값은 localStorage **raw string 그대로**(재해석 없이) —
  단, version 필드로 미래 마이그레이션 여지 확보.
- import 병합 규칙(덮어쓰기 금지, 원자성 — 전 키 파싱 성공 후에만 일괄 적용):
  | 키 | 규칙 |
  |---|---|
  | Set류(progress/guide/shadow/packs/learn-open) | 합집합 |
  | lesson-activity-v1 | 챕터별 병합, `updatedAt` 큰 쪽 우선 |
  | ksrs-v1 | 카드별: `reps` 큰 쪽 전체 채택(동률이면 `due` 작은=먼저 복습할 쪽) |
  | kcs.mistakes-v1 | 항목별: `misses` 큰 쪽 |
  | kcs.checkpoint-v1 | 트랙별: `best` 큰 쪽, 동률이면 `lastAt` 최신 |
  | kcs.readers-v1 | 리더별: `score` 큰 쪽, 동률이면 `readAt` 최신 |
  | kcs.study-v1 | `goal`은 큰 값, 날짜별 log는 큰 count |
  | 스칼라(roman/onboarded 등) | 가져온 파일 값 채택 |
  | 미지의 키(미래 버전 파일) | skip + `skipped`에 기록(에러 아님) |
- 검증: `version !== 1` → 에러. `data`가 object 아님 → 에러. 개별 값 JSON.parse 실패 → 해당 키만 skip.
- **적용 방식 주의**: stores.js의 스토어들은 자기 키를 구독-저장하므로, localStorage를 직접 쓰면
  메모리 스토어와 어긋난다. import 후 **스토어 리하이드레이트**가 필요:
  가장 단순·안전한 방법 = 적용 성공 후 `location.reload()` (문서화하고 UI에서 "복원 완료, 새로고침합니다" 안내).
  reload 없이 하려면 각 스토어에 `.reload()` 메서드를 추가해야 하는데 v1에서는 과설계 — reload 채택.

### 2. UI — Guide 탭에 "학습 기록 백업" 카드
- 위치: `src/routes/Guide.svelte` 최하단 섹션(기존 카드 스타일 재사용, Hanmok 토큰 준수).
- 내보내기 버튼: `kcs-progress-YYYYMMDD.json` 다운로드(Blob + a[download]).
  완료 시 `kcs.last-backup-at` 기록(이 키는 백업 대상에 넣지 않는다).
- 가져오기: `<input type="file" accept="application/json">` → importProgress →
  성공: "N개 항목 복원 · 새로고침" / 실패: 이유 표시, 상태 무변경.
- 리마인더: 진도 데이터가 있고 마지막 백업 30일 경과(또는 기록 없음)면
  카드에 작은 gold 배지 "Backup is due". 강제 모달 금지.

### 3. 테스트 (`src/lib/backup.test.js`, `src/lib/components/BackupCard.test.js`)
- 라운드트립: 시드 → export → localStorage.clear() → import → 모든 키 원복.
- 병합: 두 기기 시나리오(교집합+각자 고유) → Set 합집합, SRS reps 우선, activity updatedAt 우선 확인.
- 원자성: 손상 JSON/버전 2 파일 → `{ok:false}` + localStorage 무변경.
- 미지 키 skip 동작. 빈 localStorage에서 export → 최소 구조 유효.
- Guide 카드: 리마인더, export 다운로드, import 성공 후 reload, 버전 오류 표시.
- jsdom 환경(vitest 설정 이미 jsdom)이라 localStorage 사용 가능.

## 수용 기준
1. export→clear→import 라운드트립으로 진도·SRS·오답이 완전 복원(테스트 + 수동 1회).
2. 병합이 덮어쓰기가 아님을 테스트로 증명. 3. 손상 파일에 원자적(무변경).
4. 기존 134 + 신규 테스트 green, build 성공. 5. Guide 카드가 모바일 375px에서 깨지지 않음.

## 하지 말 것
- 클라우드 동기화, URL 공유, 암호화(범위 밖). 자동 주기 백업(브라우저 제약, 리마인더로 충분).

## 완료 기록
2026-07-08 Codex
- 변경 파일:
  - `src/lib/backup.js` — `BACKUP_KEYS`, export/import, 키별 병합 전략, 30일 백업 리마인더.
  - `src/lib/backup.test.js` — 라운드트립, 병합, 버전 오류, 미지 키 skip, SRS due 동률, 리마인더 테스트.
  - `src/lib/components/BackupCard.svelte` — Guide에서 쓰는 내보내기/가져오기 카드. 성공 import 후 reload로 스토어 재수화.
  - `src/lib/components/BackupCard.test.js` — export/import UI 동작과 오류 메시지 테스트.
  - `src/routes/Guide.svelte` — Guide 홈 하단에 백업 카드 추가.
  - `docs/superpowers/specs/v2-upgrade/00-README.md` — WS3 상태와 localStorage 키 표 갱신.
- 정책 결정:
  - `kcs.last-backup-at`은 리마인더 메타데이터라 백업 파일에는 넣지 않는다.
  - 현재 존재하는 진행 키 `kcs.packs-v1`, `kcs.orientation-v1`, `kcs.ime-fallback-v1`,
    `kcs.roman-nudge-v1`, `kcs.checkpoint-v1`, `kcs.readers-v1`, `kcs.study-v1`까지 백업 대상으로 포함했다.
  - import는 localStorage에 원자적으로 반영한 뒤 화면을 새로고침한다. Svelte store 직접 재주입은 v1 범위 밖.
- 검증:
  - RED evidence: `.omo/ws3-backup-red.txt`에서 `src/lib/backup.js` 부재 실패 확인 후 구현.
  - `npx vitest run src/lib/backup.test.js src/lib/components/BackupCard.test.js` — 12 tests passed.
  - `npm run preflight` — 40 files / 216 tests passed, build passed, content lint passed.
  - Playwright visual QA — Guide `/guide` at 375/768/1280px, no horizontal overflow or console errors.
    Export downloads `kcs-progress-20260708.json`; import merges progress and reloads. Evidence:
    `.omo/evidence/ws3-visual-qa/visual-qa.json`.
- 남긴 이슈:
  - 이후 WS6 등 새 localStorage 키를 만드는 작업은 `BACKUP_KEYS`와 00-README 키 표를 함께 갱신해야 한다.
