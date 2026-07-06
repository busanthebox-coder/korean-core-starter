# V2 업그레이드 — 실행 스펙 인덱스

> 설계: Fable (2026-07-05). 실행자: Claude Opus 4.8 / Codex(GPT-5.5).
> 상위 개요: [../2026-07-05-v2-upgrade-master-plan.md](../2026-07-05-v2-upgrade-master-plan.md)
> **실행자는 이 README를 먼저 읽고, 자기 WS 파일 하나만 집어서 작업한다. 한 세션 = 한 WS.**
> **세션 시작은 [01-EXECUTION-ORDERS.md](01-EXECUTION-ORDERS.md)의 [공통 머리말]+[지시 N] 블록을
> 그대로 붙여넣는 것으로 한다** — 지시서가 순서·금지·검증 의무·보고 형식을 강제한다.
> 콘텐츠 작업(WS4/WS8/C0/C2/C4/C6/C7/C9)의 실제 내용물(어휘 팩 목록·문법 노트 초안·문항 예시·읽기 20편
> 주제·한자 40어근·오리엔테이션 10개념·생존 팩·키보드/앱 사용법 아웃라인)은
> [02-CONTENT-BRIEFS.md](02-CONTENT-BRIEFS.md)에 확정돼 있다 — 재발명 금지.

## 실행 순서와 파일 (총 18개 활성 + 보류 3)

### 기술 트랙 (WS)
| 순서 | 파일 | 제목 | 상태 |
|---|---|---|---|
| 1 | [ws2-pipeline-integrity.md](ws2-pipeline-integrity.md) | 데이터 파이프라인 정합성 복구 (185개 소실·id 불안정 해결) | ⬜ |
| 2 | [ws11-ci-quality-gate.md](ws11-ci-quality-gate.md) | CI + 콘텐츠 품질 게이트 (Actions·lint-content) | ⬜ |
| 3 | [ws1-data-splitting.md](ws1-data-splitting.md) | 20MB 데이터 분할 로딩 (부트 gzip ≤1.2MB) | ⬜ |
| 4 | [ws3-progress-backup.md](ws3-progress-backup.md) | 진도 내보내기/가져오기 | ⬜ |
| 5 | [ws5-srs-daily-review.md](ws5-srs-daily-review.md) | SRS 전면화 + 스트릭 | ⬜ |
| 6 | [ws4-onboarding-placement.md](ws4-onboarding-placement.md) | 온보딩 + 배치 테스트 | ⬜ |
| 7 | [ws12-learn-ia-polish.md](ws12-learn-ia-polish.md) | Learn 홈 레벨 아코디언 + 메타·a11y 폴리시 (C0/C3 전후 타이밍) | ⬜ |
| 8 | [ws6-writing-self-check.md](ws6-writing-self-check.md) | 쓰기 자기평가 | ⬜ |
| 9 | [ws8-grammar-gapfill.md](ws8-grammar-gapfill.md) | 문법 갭필 3건 (-지요/죠·반말·-(으)ㅂ시다) | ⬜ |
| 10 | [ws7-roleplay-grading.md](ws7-roleplay-grading.md) | Roleplay 채점 완화 (규칙 기반 3단계) | ⬜ |

### 콘텐츠 트랙 (C) — 기술 트랙과 병렬 가능
| 순서 | 파일 | 제목 | 상태 |
|---|---|---|---|
| 1 | [c0-beginner-foundation.md](c0-beginner-foundation.md) | **C0 기초 어휘 기반 정비** (레벨 재태깅 129+·어휘 팩 8개) — 0순위 | ⬜ |
| 2 | [c9-day1-onramp.md](c9-day1-onramp.md) | **C9 Day-1 온램프** (오리엔테이션 10카드·생존 팩 2·키보드 가이드+타이핑 폴백·앱 사용법+README) — C0 직후 | ⬜ |
| 3 | [c5-conjugation-trainer.md](c5-conjugation-trainer.md) | C5 활용 트레이너 (495동사×15형 드릴) | ⬜ |
| 4 | [c2-exercise-expansion.md](c2-exercise-expansion.md) | C2 연습문제 확충 (챕터당 10+, 유형 6종) | ⬜ |
| 5 | [c3-review-checkpoints.md](c3-review-checkpoints.md) | C3 체크포인트 + 나선형 복습 | ⬜ |
| 6 | [c4-contrast-bank.md](c4-contrast-bank.md) | C4 문법 대조 뱅크 8→30쌍 | ⬜ |
| 7 | [c6-reading-room.md](c6-reading-room.md) | C6 읽기 자료실 (장문 20편 + 탭 글로스) | ⬜ |
| 8 | [c7-hanja-families.md](c7-hanja-families.md) | C7 한자어 어근 패밀리 40개 | ⬜ |

### 보류 (착수 조건 명시)
| 파일/항목 | 조건 |
|---|---|
| [09-content-enrichment.md](09-content-enrichment.md) 내 **C1 듣기·C8 발음** | 오디오 단계(WS10)와 함께 — 사용자 결정 |
| WS9 PWA/오프라인 (마스터 플랜 §10) | WS1 완료 후 + 사용자 승인 |
| WS10 고품질 오디오 (마스터 플랜 §10) | 사용자 명시 승인(비용) — "오디오는 가장 마지막" |

### 의존성 요약
- **WS2가 모든 데이터 작업의 선행**(전까지 generate 금지). WS11은 WS2 직후(가드를 CI에 태움).
- WS1은 WS2 후. WS12는 C0/C3가 Learn에 카드를 얹기 전후가 적기.
- WS6·C0·C3·C6·WS12가 새 localStorage 키를 만들면 → WS3 BACKUP_KEYS + 아래 키 표 갱신.
- 콘텐츠 데이터 편집(C0/C2/C4/C6/C7)은 WS2 완료 후가 안전(전이면 build-app-data만).

### 2026-07-05 완결성 점검에서 "추가하지 않기로 확인"한 것 (재감사 불요)
- Shadow 34편·Roleplay 46편 — 회화 콘텐츠 볼륨 충분. 시나리오 확충은 현 라운드 범위 밖.
- 예문 로마자 결측 0(표본 600) — 로마자 품질은 린트(WS11)로 지키면 충분.
- 필수 초급 어휘 커버리지 98% — 신규 어휘 대량 생성 불요(문제는 라벨·연결 → C0가 해결).
- 계정/클라우드 동기화·알림·게임화(XP/리그)·형태소 분석 라이브러리·LLM 채점 — 정적 사이트 원칙과 충돌, 범위 밖.

## 공통 환경 사실 (전 WS 해당 — 반드시 숙지)

- 저장소 루트: `/Users/hannam/Downloads/blog app/korean-core-starter`, 브랜치 `hanmok-redesign`.
- 이 경로는 Claude Code 샌드박스 read-denied 하위라 **Bash/python 실행 시 `dangerouslyDisableSandbox: true` 필요**.
  (Read/Edit/Write 도구는 무관. Codex CLI는 해당 없음.)
- Svelte **4** + Vite + svelte-spa-router. TypeScript 아님 — 전부 plain JS. 스토어는 `svelte/store`.
- 테스트: `npx vitest run` — 현재 **134개 전부 green**이 기준선. 착수 전 1회 돌려 기준선 확인,
  완료 후 green + `npm run build` 성공까지가 "완료"의 정의.
- **커밋·푸시·배포(gh-pages)는 사용자가 명시 요청할 때만.** 작업 완료 후 변경 요약만 보고.
- ⚠️ **WS2가 끝나기 전에는 `node scripts/generate-korean-data.mjs` 절대 실행 금지.**
  2026-07-05 실측: 실행 시 vocab-extended 2247→2059(185개 소실), app-data 3768→3528.
  콘텐츠 작업은 `node scripts/build-app-data.mjs`(rich-chapter 병합)만 안전하다.
- 콘텐츠(한국어) 생성 규칙: 고빈도 일상 어휘만(사용자가 '명함' 같은 저빈도어를 명시적으로 거부),
  기본 해요체, 로마자 표기는 기존 데이터 필드 형식을 따른다. 제품 UI 문자열은 영어.
- 완료 시 이 README의 상태 칸을 ✅로 바꾸고, 자기 WS 파일 맨 아래 `## 완료 기록` 섹션에
  날짜·변경 파일·테스트 결과·남긴 이슈를 적는다.

## 데이터 파이프라인 지도 (요약)

```
scripts/{verb,expr,vocab,pattern}-src/*.json      ← 손편집 시드 (263+ 파일)
  └→ scripts/generate-korean-data.mjs             → korean/data/{words,expressions,vocab-extended,patterns,…}.json
       └→ scripts/apply-curriculum-structure.mjs  → korean/data/course.json  (number = order배열 position)
            └→ scripts/build-app-data.mjs         → korean/data/app-data.json
                 · scripts/rich-chapters/chapter-NN.json 을 chapter.id 로 병합 ({...chapter, ...rich})
                 · STRIP 필드 제거, headword 중복은 richest만 유지(aliasIds 보존)
                 └→ src/lib/data.js 가 동기 import → 6개 라우트 전부 소비
```

- `rich-chapters/chapter-NN.json`의 NN은 **id**(불변)이고 화면 표시 번호(number)와 **다르다**
  (예: chapter-17.json = 표시 12과 Past Tense). 항상 id로 다룰 것.
- 표시 순서 = `curriculumSortValue = curriculumOrder || number` (`src/lib/curriculumStructure.js`).

## 번들/데이터 실측 (2026-07-05, commit 46793a7)

- dist: `data-*.js` 17.6MB(gzip 4.94MB) / `index-*.js` 230KB / css 105KB.
- app-data.json 18.8MB = extendedVocab 9.0 + expressions 4.2 + words 2.8 + course 1.7 + patterns 0.5 + grammar 0.3 + 기타.
- 항목 수: words 545 · newcomerVocab 18 · extendedVocab 2247 · expressions 788(dedupe 후) · patterns → 총 3,768.

## localStorage 키 전수 (2026-07-05 기준)

| 키 | 모듈 | 형태 |
|---|---|---|
| `kcs.roman` | stores.js | '1'/'0' |
| `kcs.progress` | stores.js | JSON array(Set) — 완료 챕터 id |
| `kcs.lesson-activity-v1` | stores.js | JSON object {chapterId: {dialogueSeen, practiceDone, updatedAt}} |
| `kcs.guide-ready-v1` | stores.js | JSON array(Set) |
| `kcs.shadow-done-v1` | stores.js | JSON array(Set) |
| `ksrs-v1` | srs.js | JSON object {entryId: {box, due, reps, lapses}} |
| `kcs.mistakes-v1` | mistakes.js | JSON object {entryId: {misses, lastMissed}} |

계획된 신규 키(해당 WS 완료 시 이 표에서 ⬜→확정으로): `kcs.streak-v1`(WS5) · `kcs.onboarded-v1`,
`kcs.start-chapter-v1`(WS4) · `kcs.writings-v1`(WS6) · `kcs.checkpoint-v1`(C3) · `kcs.packs-v1`(C0) ·
`kcs.readers-v1`(C6) · `kcs.learn-open-v1`(WS12) · `kcs.orientation-v1`, `kcs.ime-fallback-v1`,
`kcs.roman-nudge-v1`(C9) · `kcs.last-backup-at`(WS3, 백업 대상 제외).

(WS에서 키를 새로 만들면 이 표에 추가할 것. WS3 백업 대상의 단일 소스가 이 표다.)
