# C-시리즈 — 교육 콘텐츠 보강 (더 "교과서다운" 앱으로)

> 기술 WS(1~8)와 별도의 **콘텐츠·교수법 워크스트림**. 설계: Fable (2026-07-05).
> 근거: 서강대/서울대 한국어·Duolingo 대비 갭 분석 + 아래 실측.

## 현재 콘텐츠 실태 (2026-07-05 실측 — 설계의 근거)

| 영역 | 실태 | 판정 |
|---|---|---|
| 문법 노트 | 65과 전부 textbook-grade(형태표·예문4·drill·pitfall) | ✅ 강점 |
| 읽기 | 65과 전부 readingText + 이해 문항 3개 | ✅ 기반 있음 |
| 대화 | 65과 전부 extendedDialogue 4~10턴 | ✅ 기반 있음 |
| 쓰기 | 65과 전부 writingTask + canDo (46793a7) | ✅ 방금 완비 |
| **듣기** | **전용 연습 0개** (Shadow는 발화 모방, 청해 아님) | ❌ 4기능 중 유일 공백 |
| 연습문제 | 챕터당 3~10개(중앙값 5), 341개. 유형: MC 193·빈칸 91·오류교정 40·번역 17 — **70% 객관식 편중**, 오류교정 type 표기 3종 혼재(`errorCorrect/errorCorrection/correction`) | ⚠️ 양·다양성 부족 |
| 문법 대조 | `patternContrast.js` ~8쌍(은는/이가·원인·목적·명사화) + 전용 UI 있음 | ⚠️ 뱅크 빈약 |
| 활용 연습 | 없음. 그러나 **words 495개에 forms 15종**(past/future/want/can/must/pleaseDo…) 데이터 완비 | ❌ 원료만 있음 |
| 누적 복습 | 챕터 단위 연습뿐, 레벨 경계 체크포인트·나선형 복습 없음 | ❌ 없음 |
| 어휘 네트워크 | collocations는 있음. 한자어 어근 패밀리 없음 | ⚠️ B1+ 어휘 확장 장치 부재 |

## 우선순위와 규모

> **사용자 결정(2026-07-05): 듣기·TTS 관련(C1·C8)은 오디오 단계(WS10)와 함께 최후순위.**
> 오디오 없이 되는 6건을 먼저 간다. 굵은 파일명 = 실행자용 상세 스펙 존재.

| 순서 | # | 제목 | 상세 스펙 | 규모 | 신규 콘텐츠? |
|---|---|---|---|---|---|
| 0.5 | C9 | Day-1 온램프(오리엔테이션·생존 팩·키보드·앱 사용법) | **[c9-day1-onramp.md](c9-day1-onramp.md)** | 중 | 일부(브리프 §B8 확정) |
| 1 | C5 | 활용(conjugation) 트레이너 | **[c5-conjugation-trainer.md](c5-conjugation-trainer.md)** | 소~중 | 아니오 — forms 495×15 재활용 |
| 2 | C2 | 연습문제 확충·다양화 | **[c2-exercise-expansion.md](c2-exercise-expansion.md)** | 대 | 예 (~350문항) |
| 3 | C3 | 누적 복습 유닛(체크포인트) | **[c3-review-checkpoints.md](c3-review-checkpoints.md)** | 중 | 거의 아니오 |
| 4 | C4 | 문법 대조 뱅크 8→30쌍 | **[c4-contrast-bank.md](c4-contrast-bank.md)** | 소~중 | 예 (~130문항) |
| 5 | C6 | 읽기 자료실(단계별 장문 20편) | **[c6-reading-room.md](c6-reading-room.md)** | 대 | 예 |
| 6 | C7 | 한자어 어근 패밀리 40개 | **[c7-hanja-families.md](c7-hanja-families.md)** | 중 | 예 |
| 뒤로 | C1 | 듣기 트랙(받아쓰기·청해) | 이 문서 아래 절(오디오 단계에서 상세화) | 중 | 아니오 |
| 뒤로 | C8 | 발음 미니멀 페어 | 이 문서 아래 절(오디오 단계에서 상세화) | 소 | 예 |

콘텐츠 생성(C2/C4/C6/C7)은 writingTask 때 검증된 **병렬 생성→교차 리뷰→수정 적용** 패턴을 쓴다
(스펙 파일 → 배치 에이전트 → 리뷰 에이전트 → 수정. `/tmp/claude/kcs_writingtask_spec.md` 방식 참조).

---

## C1 — 듣기 트랙 (⏸ 오디오 단계로 이관 — WS10과 함께 착수)

**설계 원칙**: 신규 녹음 없이 기존 문장 + Web Speech TTS(`src/lib/audio.js`의 `speak()`)로 시작.
고품질 오디오(WS10)는 사용자 별도 승인 사안 — 이 WS는 TTS 전제.

1. **받아쓰기(Dictation)**: 문장 듣기(텍스트 숨김) → 타이핑 → `normalizeKo` 비교 채점(부분 정답은
   WS7의 `replyGrader` 완성 시 그것을 재사용). 원천 = 해당 챕터 grammarNotes.examples + extendedDialogue 턴
   (짧은 것 우선, 8~20자). 챕터당 5문항 자동 파생 — **빌드 타임이 아닌 런타임 파생**(데이터 추가 없음).
   재생 버튼(최대 3회 카운트 표시), 속도 0.8x 토글(`SpeechSynthesisUtterance.rate`).
2. **듣고 고르기(Listen & choose)**: 문장 듣기 → 뜻(영어) 4지선다. 오답 보기는 같은 챕터의 다른 예문 뜻.
3. **배치**: LessonPlayer의 practice 단계에 `kind:'listening'` 화면 1개(받아쓰기 2 + 듣고고르기 2) 추가 +
   Practice 탭에 "듣기 연습" 독립 모드(챕터 선택 → 세트).
   TTS 불가 브라우저(speechSynthesis 없음/한국어 보이스 없음)면 화면 자체를 숨긴다(graceful).
4. 오답은 SRS·mistakes에 기록(WS5와 동일 규칙).

수용 기준: 챕터 하나에서 듣기 화면 E2E(수동) / 파생 로직·채점 단위 테스트 / 한국어 보이스 없는 환경서 비노출 확인.

## C5 — 활용 트레이너 (원료 완비, 가성비 최고)

✅ done 2026-07-07 — `src/lib/conjugationDrill.js`, Practice Conjugate mode, LessonPlayer mapped conjugation screens, unit tests, 495×15 smoke, browser QA.

- 원천: words 495개의 `forms` 15종. 드릴: "**{dictionary}** 를 `past`로" → 타이핑 → forms.past와
  normalizeKo 비교. 형태 라벨 한/영 병기(past = 과거 -았/었어요).
- 모드: (a) 챕터 연동 — 그 챕터 문법이 요구하는 형태만(예: 12과 Past Tense → past만. 챕터→형태 매핑
  테이블을 `src/lib/conjugationDrill.js`에 정의) (b) 자유 — 레벨·형태 선택.
- 불규칙 동사(entry.irregular 필드 존재 — 확인됨)를 우선 출제 가중치 1.5x.
- 오답 시 정답과 함께 **왜 그 형태인지** 한 줄(불규칙 유형 라벨: ㅂ-irregular 등 — entry.irregular에서).
- 배치: Practice 탭 새 모드 "Conjugation". 오답 → SRS 유입.
- 수용 기준: 챕터 연동 모드가 최소 10개 챕터에 매핑 / 불규칙 가중치 테스트 / 495개 전부 크래시 없이 출제 가능(스모크 스크립트).

## C2 — 연습문제 확충·다양화 (챕터당 5→10, 유형 6종)

✅ done 2026-07-07 — inline exercise schema normalized, LessonPlayer supports `particleChoice`/`conjugate`/`orderWords`, validation is wired into `build-app-data`, and all 65 chapters now have 10+ inline exercises. Total inline exercises: 341→653. This completes C2 only; later C3/C4/C6/C7 records are tracked in their own sections.

1. **선행 정리(코드)**: 오류교정 type 3종 표기를 `errorCorrect`로 통일(rich-chapters 일괄 치환 +
   LessonPlayer의 렌더 분기 확인). 이것만 별도 커밋 가치.
2. **신규 유형 3종**을 LessonPlayer에 추가:
   - `particleChoice`: 문장 빈칸에 조사 고르기(은/는/이/가/을/를/에/에서…) — 한국어 최대 난관 집중 훈련
   - `conjugate`: 괄호 동사를 지시 형태로 변형해 타이핑("어제 친구를 (만나다) → ___")
   - `orderWords`: 어절 배열 → 문장 조립(quiz.js의 scramble 재사용)
3. **콘텐츠 생성**: 각 챕터를 10문항 이상으로. 신규 문항은 그 챕터 문법·어휘만 사용(선행 챕터 것 허용),
   고빈도 어휘, 오답 보기는 실제 학습자 오류 반영. 생성 파이프라인:
   배치 에이전트(8챕터씩)×8 → 교차 리뷰(문법 정오·자연스러움·정답 유일성) → 적용 → `build-app-data`.
   **정답 유일성 검증 스크립트**(객관식 보기 중복·복수정답 탐지) 필수.
4. 수용 기준: 전 챕터 ≥10문항·6유형 분포 리포트 / 리뷰 통과 / LessonPlayer·Practice 렌더 스모크 / 테스트 green.

## C3 — 누적 복습 유닛 (교과서의 "복습과")

✅ done 2026-07-07 — A1/A2/B1 virtual checkpoint cards now render in Learn, each opens a 20-question sampled review from that track's inline exercises, results save to `kcs.checkpoint-v1`, weak chapters link back to lessons, LessonPlayer can inject one prior-chapter spiral review item with a visible source badge, and Guide shows checkpoint progress. This completes C3 only; later C4/C6/C7 records are tracked in their own sections.

- **체크포인트 유닛**: 트랙 경계마다(11과 뒤 A1 체크포인트, 34과 뒤 A2, 56과 뒤 B1) 가상 유닛을
  챕터 목록에 카드로 삽입(신규 챕터 파일 없이 코드 생성 — `curriculumStructure.js`에 경계 정의).
  구성: 해당 트랙 전 챕터에서 뽑은 20문항(문법 노트 drill + inlineExercises 샘플링) + 결과 리포트
  ("약한 챕터: 7과, 9과 — 다시 보기 링크"). 통과 기준 없음 — 진단·복습 목적(잠금 금지 원칙 유지).
- **나선형 섞기**: LessonPlayer 연습 단계에 "이전 챕터 복습 1문항"을 20% 확률로 끼워넣기
  (직전 3챕터의 inlineExercises에서 — interleaving 효과. 출처 챕터 표기).
- 수용 기준: 체크포인트 3개 렌더·결과 리포트 / 약한 챕터 산출 로직 테스트 / 잠금 없음 확인.

## C4 — 문법 대조 뱅크 확장 (8쌍 → 30쌍)

✅ done 2026-07-07 — `src/lib/contrastItems.json` now carries 30 grammar contrast groups with 6 questions each (180 total) across A1/A2/B1/B2. `patternContrast.js` imports the bank, supports level-filtered quiz building, and reports stats for UI/tests. Practice setup has Contrast Lab level chips, `PatternContrastSession` guards optional entry ids, `scripts/validate-contrast-items.mjs` verifies group count, item count, ids, levels, options, and answer distribution, and `npm run validate:contrast` exposes the check. This completes C4 only; later C6/C7 records are tracked in their own sections, while C1/C8 stay deferred to the audio stage.

- 기존 `patternContrast.js` 스키마·`PatternContrastSession.svelte` UI 재사용. 추가할 고전 혼동쌍(레벨 표기):
  A1: 에 vs 에서 / 은·는 vs 이·가(기초) / 안 vs 못 / 하고 vs 와·과 vs (이)랑
  A2: -아서 vs -니까 / -고 vs -아서(순차) / -(으)러 vs -(으)려고 / -지만 vs -는데 / 동안 vs -는 동안 / 부터 vs 에서(시작점) / -(으)ㄹ 수 있다 vs -아도 되다
  B1: -는 것 같다 vs -나 보다 / -거든요 vs -잖아요 / -더라고요 vs -았어요 / -다가 vs -고 나서 / 께서·-시- 사용처 / -게 하다 vs -게 되다
  B2: -았으면 vs -았더라면 / -기 vs -는 것 / 이·가 vs 은·는(담화 층위)
- 쌍당: 판별 규칙 1줄 + 대조 예문 2×2 + 판별 퀴즈 6문항. 생성→교차 리뷰 파이프라인.
- 수용 기준: ≥30쌍, 레벨 필터, 각 쌍 퀴즈 정답 유일성 검증.

## C6 — 읽기 자료실 (단계별 장문 — Graded Reader)

- 신규 탭 아님 — Guide 또는 Learn 하위 "Reading Room" 섹션. 레벨당 텍스트 5편(총 20편)부터:
  A1 100~200자(일기·문자메시지) / A2 200~400자(블로그·후기) / B1 400~700자(수필·기사체) / B2 700~1000자.
- 각 편: 본문 + **탭하면 뜻 뜨는 글로스**(사전 인덱스 연결 — 어절→findEntry 매칭, 실패 어절은 무동작) +
  이해 문항 4개 + 요약 쓰기 프롬프트(WS6 저장 연동).
- 본문은 배운 문법 범위 내로 작성(레벨별 허용 문법 리스트를 챕터에서 도출해 생성 스펙에 명시).
- 데이터: `scripts/readers-src/*.json` → build 파이프라인에 병합(WS1 이후면 core 청크에).
- 수용 기준: 20편 + 글로스 동작 + 리뷰 통과. 어휘 커버리지 리포트(본문 어절 중 사전 매칭률 ≥85%).

✅ done 2026-07-07 — `scripts/readers-src`에 B5 계획 그대로 A1/A2/B1/B2 각 5편(총 20편)을 작성했고, `scripts/validate-readers.mjs` + `scripts/check-reader-coverage.mjs`를 `npm run validate:readers`로 연결했다. `build-app-data.mjs`가 readers를 검증 후 `app-data.json`/`data-bundle.js`에 병합하며, `src/lib/data.js`는 `readers`/`findReader`를 노출한다. Learn 하위 Reading Room은 레벨 탭, 카드 목록, 글로스 팝오버, 문단별 번역 접기, 4문항 이해 확인, 요약 textarea, `kcs.readers-v1` 완료 저장을 지원한다. C7 완료 기록은 아래 섹션에 있다.

## C7 — 한자어 어근 패밀리 (B1+ 어휘 확장 장치)

- 고빈도 한자 어근 40개(학學·생生·식食·국國·일日·시時·간間·인人·대大·소小…)에 대해:
  어근 카드 = 뜻 + 사전 내 파생어 목록(학교·학생·학원·방학·유학…) + 미니 퀴즈("'學'이 든 단어는?").
- 데이터: `scripts/hanja-src/roots.json` `{root, gloss, entryIds[]}` — entryIds는 실제 사전 항목과 매칭
  (스크립트로 후보 자동 추출 → 사람이 아닌 리뷰 에이전트가 오매칭 제거. 동음이의 한자 주의: 사과의 과≠과일의 과 같은 함정).
- 노출: EntryDetail에 "같은 어근" 접이식 + Dictionary에 어근 브라우저.
- 수용 기준: 40어근·오매칭 리뷰 통과·EntryDetail 연동 렌더.

✅ done 2026-07-07 — `scripts/hanja-src/roots.json`에 40개 한자어 어근과 214개 멤버를 작성했고, 각 root/member의 manual review metadata와 `C7-root-review-ledger.md` 전수 검수 기록을 남겼다. `scripts/validate-hanja-roots.mjs`/`npm run validate:hanja`는 entryId·중복·3개 이상 members·동음이의 split뿐 아니라 manual review 40/40 roots, 214/214 members 상태까지 강제한다. `build-app-data.mjs`와 `build-korean-data-bundle.mjs`가 `hanjaRoots`를 검증 후 `app-data.json`/`data-bundle.js`에 병합하며, review-only metadata는 앱 번들에서 제거한다. `src/lib/data.js`는 `hanjaRoots`, `findHanjaRoot`, `hanjaRootsForEntry`를 노출한다. EntryDetail은 Same Root 섹션에서 같은 어근 단어를 같은 시트 안에서 탐색할 수 있고, Guide에는 검색·레벨 필터·멤버 breakdown·고유 선택지 미니 퀴즈를 갖춘 Hanja Root Families 브라우저가 들어갔다. 검증: `npm run validate:hanja`, malformed guard 6종, `npm run test` 196개, `npm run build`, Playwright Chrome 브라우저 QA(Dictionary/Guide/Quiz/Learn/Reading/중(中) 퀴즈 회귀) 통과.

## C8 — 발음 미니멀 페어 (⏸ 오디오 단계로 이관 — 실험적)

- 평음/경음/격음(달·딸·탈, 자다·짜다·차다), 모음(어/오, 애/에) 페어 듣고 고르기. **TTS가 이 대비를
  구분해 발음하는지 먼저 검증**(수동 청취) — 불합격 페어는 제외. 합격분만 출시, ch44와 상호 링크.
- 오디오 품질 한계 명시(사용자 "오디오 최후순위" 원칙과 충돌하지 않게 TTS 범위 내에서만).

---

## 공통 규칙 (C-시리즈 전체)
- 00-README 공통 규칙 + **generate 금지(WS2 전)** 동일 적용. 콘텐츠는 전부 고빈도 어휘·해요체 기본.
- 신규 콘텐츠는 반드시 생성→**교차 리뷰**→적용 3단계(writingTask 전례). 리뷰 없이 직행 금지.
- 새 데이터 파일은 WS1의 분할 체계를 따른다(WS1 완료 후면 어느 청크에 넣을지 스펙에 명시하고 사이즈 가드 통과).
- 각 C 완료 시 이 파일 해당 섹션에 `✅ done` + 산출물 요약.
