# 작업 지시서 — Opus/Codex 세션에 그대로 붙여넣는 명령 블록

> 사용법: 새 실행 세션을 열고 **[공통 머리말] + [지시 N] 두 블록을 함께 붙여넣는다.**
> 한 세션 = 한 지시. 지시 번호는 식별자일 뿐 — **실행 순서는 00-README의 트랙 표를 따른다**
> (콘텐츠 트랙에서 C9(지시 18)는 C0 직후가 적기). 지시 문서(이 파일)는 수정 금지 — 완료 표시는 00-README와 각 스펙의 완료 기록에.

---

## 공통 머리말 (모든 지시 앞에 붙일 것)

```
너는 korean-core-starter의 실행 엔지니어다. 설계는 이미 끝났다 — 재설계하지 말고 스펙대로 구현하라.
스펙에 모순·불가능이 있을 때만 멈추고 대안 2개와 함께 보고하라.

환경:
- 저장소: /Users/hannam/Downloads/blog app/korean-core-starter, 브랜치 hanmok-redesign
- (Claude Code인 경우) 이 경로는 샌드박스 read-denied라 Bash/python에 dangerouslyDisableSandbox: true 필요
- 먼저 읽어라: docs/superpowers/specs/v2-upgrade/00-README.md (공통 규칙·함정·키 표)

절대 규칙:
1. 커밋·푸시·배포 금지 — 사용자가 요청할 때만. 작업 트리에 변경만 남겨라.
2. WS2 완료 전 node scripts/generate-korean-data.mjs 실행 금지(항목 185개 소실 함정).
3. 착수 전 npx vitest run 으로 기준선 green 확인(134개+). 깨져 있으면 만지지 말고 보고.
4. 완료 조건: 전 테스트 green + npm run build 성공 + 스펙의 수용 기준 전부 충족.
5. 스펙 범위 밖 리팩터·개선 금지. "하지 말 것" 절은 문자 그대로 지켜라.
6. 한국어 콘텐츠는 고빈도 일상 어휘·해요체 기본. 제품 UI 문자열은 영어. 사용자 보고는 한국어.

완료 보고 형식(마지막 메시지):
- 변경 파일 목록(신규/수정 구분) / 수용 기준 항목별 충족 증거(명령 출력 요약) /
  테스트·빌드 결과 / 스펙과 다르게 한 것과 이유(없으면 "없음") / 남긴 이슈.
그리고 00-README의 해당 행을 ✅로, 스펙 파일 하단 "완료 기록"을 채워라.
```

---

## 지시 01 — WS2: 데이터 파이프라인 정합성 복구

```
스펙: docs/superpowers/specs/v2-upgrade/ws2-pipeline-integrity.md 를 정독하고 그대로 구현하라.

순서 강제:
1. generate-korean-data.mjs에 --out <dir> 지원을 먼저 넣어라. korean/data를 덮어쓰는 진단은 금지.
2. 진단 스크립트로 드리프트 리포트(ws2-drift-report.md)를 만들고, 185개 소실의 원인을 (a)시드 부재
   (b)생성 로직 필터 (c)과거 수동 편집으로 분류해 표로 남겨라.
3. 소실분을 recovered-*.json 시드로 복구하라. 시드에는 원료 필드만(generalWordEntry가 파생하는 필드 금지).
4. id 안정화: scripts/id-manifest.json을 HEAD 데이터에서 생성하고, generate가 manifest 조회로 id·sort를
   부여하게 바꿔라. 키 유일성(hangul|kind)을 실데이터로 검증하고 충돌 시 키 설계를 보강해 기록하라.
5. verify-data-integrity.mjs + data-manifest.json 가드를 만들고 generate 말미에 연결하라.
6. 전체 파이프라인 재실행 → git diff가 스펙의 허용 diff 안인지 증명하라(항목 소실 0, 기존 id 변경 0).

검증 의무: 시드 1개 삭제 → verify가 exit 1 / 시드 파일 분할·순서 변경 → id 불변. 두 실험 모두 출력 첨부 후 원복.
금지: korean/data 커밋본을 버리고 재생성본으로 대체 / id 체계 교체 / src·rich-chapters 수정.
```

## 지시 02 — WS11: CI + 콘텐츠 품질 게이트

```
스펙: docs/superpowers/specs/v2-upgrade/ws11-ci-quality-gate.md 를 정독하고 그대로 구현하라.

산출물 3개를 정확히 만들어라:
1. .github/workflows/ci.yml — push/PR에 test-build 잡(npm ci→vitest→build) + content-lint 잡. 배포 스텝 절대 금지.
2. scripts/lint-content.mjs — 스펙 표의 5개 검사(스키마/정답 무결성/레벨 값/id 참조/카운트 위임). 위반 목록 출력 + exit 1.
3. package.json에 "lint:content" 와 "preflight"(vitest+build+lint 묶음) 스크립트.

검증 의무: 정답 누락 1건을 인위 주입 → lint가 잡는 출력 첨부 → 원복. preflight 1커맨드 green 출력 첨부.
주의: WS2가 이미 끝났다면 카운트 검사는 verify-data-integrity 호출로 위임하고 중복 구현하지 마라.
아직이라면 카운트 검사 자리에 TODO 주석 + 스킵 처리하고 보고에 명시하라.
```

## 지시 03 — WS1: 데이터 분할 로딩

```
스펙: docs/superpowers/specs/v2-upgrade/ws1-data-splitting.md 를 정독하고 그대로 구현하라. WS2 완료 확인 후 착수.

구현 순서 강제:
1. build-app-data.mjs가 public/data/에 5파일(core/index/words/expressions/extended) + 해시 파일명 +
   manifest.json을 내게 하라. aliasIds 해석과 tagB1 승격은 빌드 타임에 인덱스에 구워라.
2. src/lib/dataLoader.js(loadBoot/ensureSection/prefetchAll/dataState)를 만들고,
   src/lib/data.js는 façade로 유지해 6개 라우트의 import 문이 한 줄도 안 바뀌게 하라.
3. main.js 부트 게이트 + index.html 인라인 스플래시 + 실패 시 재시도 화면(무한 스피너 금지).
4. grep -rn "context=\"module\"" src/ 로 모듈 스코프에서 data.js를 읽는 곳을 전수 확인하고 결과를 보고에 포함하라.
5. Dictionary/EntryDetail/Practice의 섹션 로딩 처리(스펙의 라우트별 처리 절).
6. scripts/check-bundle-size.mjs(부트 gzip ≤1.3MB 가드)를 build에 연결하라. vite manualChunks의 data 분기 제거.

검증 의무: 빌드 후 부트 대상 gzip 합계 수치 첨부(목표 ≤1.2MB) / 6개 탭 스모크(프리뷰 MCP 가능 시 스크린샷,
불가 시 테스트로 대체) / 로더 단위 테스트(멱등성·재시도·hydrate) 추가.
금지: 라우트 import 대량 변경 / 서비스워커 / IndexedDB.
```

## 지시 04 — WS3: 진도 내보내기/가져오기

```
스펙: docs/superpowers/specs/v2-upgrade/ws3-progress-backup.md 를 정독하고 그대로 구현하라.

핵심 요구:
1. src/lib/backup.js — BACKUP_KEYS는 00-README 키 표와 1:1. exportProgress는 raw string 보존,
   importProgress는 병합(Set 합집합/SRS reps 우선/activity updatedAt 우선/미지 키 skip) + 원자성.
2. 적용 후 location.reload() 방식 채택(스토어 리하이드레이트 과설계 금지 — 스펙 결정 사항).
3. Guide 탭 백업 카드(내보내기 파일명 kcs-progress-YYYYMMDD.json / 가져오기 / 30일 리마인더 배지).

검증 의무: backup.test.js — 라운드트립·병합 2기기 시나리오·손상 파일 원자성·미지 키 skip 전부 테스트로.
모바일 375px 프리뷰 확인(불가 시 보고에 명시).
금지: 클라우드 동기화·암호화·자동 백업.
```

## 지시 05 — WS5: SRS 전면화 + 스트릭

```
스펙: docs/superpowers/specs/v2-upgrade/ws5-srs-daily-review.md 를 정독하고 그대로 구현하라.

핵심 요구:
1. grep으로 오답 기록 지점 전수 조사(mistakes.record 계열) → 각 지점에 reviews.addMany 연결.
   정답은 절대 자동 등록하지 마라. 조사 결과 목록을 보고에 포함하라.
2. srs.js에 dueCount derived 스토어(+1분 tick·포커스 갱신) → BottomNav Practice 뱃지(9+ 표기).
3. LearnMissionPanel에 due>0 시 "복습 N개 비우기" 스텝 → Practice 자동 review 진입(라우팅 방식은
   svelte-spa-router 확인 후 택1, 선택 근거 보고).
4. src/lib/streak.js — lastDay는 'YYYY-MM-DD' 로컬 문자열 비교(타임스탬프 비교 금지). 표시는 Learn 헤더 🔥N.
5. due=0 빈 상태(다음 due 상대시각). kcs.streak-v1을 backup.js BACKUP_KEYS에 추가(WS3 완료 시).

검증 의무: 스트릭 경계 테스트(오늘 2회/어제→오늘/이틀 공백/best 유지) + 오답 유입 테스트 + dueCount 테스트.
수동 E2E: 퀴즈 3개 오답 → 뱃지 3 → 복습 세션에 그 3개.
금지: Leitner 알고리즘 변경 / 알림 / XP·리그 / 챕터 전체 어휘 자동 등록.
```

## 지시 06 — WS4: 온보딩 + 배치 테스트

```
스펙: docs/superpowers/specs/v2-upgrade/ws4-onboarding-placement.md 를 정독하고 그대로 구현하라.
콘텐츠 브리프: 02-CONTENT-BRIEFS.md §B7(선별 기준·판별 우선순위)을 큐레이션 기준으로 그대로 써라.

순서 강제:
1. 콘텐츠 먼저 — 기존 inlineExercises에서 레벨당 5~8문항을 골라 placementBank.json을 만들고,
   선정 이유를 스펙의 "문항 선정 기록"에 남겨라. 신규 창작 금지, 수정은 오탈자만.
2. placement.js 순수 함수(nextRound/placementResult) — 80% 규칙, B2 배치 없음.
   시작점은 curriculumStructure.js에 firstChapterOfLevel 헬퍼를 추가해 도출(하드코딩 금지).
3. Onboarding.svelte 오버레이(라우터 경로 추가 금지) — 환영/테스트/결과 3화면, Hanmok 토큰.
4. "이어서 학습" 카드 + Guide에 "배치 테스트 다시 보기".

검증 의무: 노출 조건 테스트(진도 있으면 절대 안 뜸/onboarded면 안 뜸/이탈 후 재방문 안 뜸) +
placement 경계 테스트(4/5, 3/5) + 뱅크 스키마 테스트(correct 정확히 1개). 어디에도 잠금이 없음을 확인 보고.
```

## 지시 07 — WS12: Learn 홈 아코디언 + 폴리시

```
스펙: docs/superpowers/specs/v2-upgrade/ws12-learn-ia-polish.md 를 정독하고 그대로 구현하라.

핵심 요구:
1. 레벨 아코디언 — 첫 미완료 챕터의 그룹만 기본 펼침, 상태는 kcs.learn-open-v1(백업 키 표 갱신),
   헤더에 진행률 n/m + 트랙 설명(curriculumTrack.description 재사용). 챕터 필터 입력(부분일치, 매치 그룹 자동 펼침).
2. C0 팩·C3 체크포인트 카드가 이미 있으면 그룹 안 제 위치 유지(그 스펙 변경 금지). 없으면 챕터만으로 구현.
3. 메타: description·og:title/description/image(public/og.png 정적 1장 생성)·twitter:card.
4. a11y 스모크: 레슨 키보드 진행 / aria-label 상위 10개 / :focus-visible / 아코디언 aria-expanded.

검증 의무: 모바일 375px 프리뷰 스크린샷(첫 화면 = 이어서 학습 + 현재 그룹만) / 필터로 65챕터 도달 E2E /
빌드 HTML에 og 메타 존재 grep 출력. 기존 Learn 테스트 회귀 없음.
금지: 라우팅 변경 / 챕터 카드 디자인 개편 / 게임화.
```

## 지시 08 — WS6: 쓰기 자기평가

```
스펙: docs/superpowers/specs/v2-upgrade/ws6-writing-self-check.md 를 정독하고 그대로 구현하라.

핵심 요구:
1. grammarFormLabel(title) 유틸(em-dash 분리) + 테스트 — LessonPlayer 쓰기 화면에 체크리스트,
   전부 체크 시 next 활성(작은 "건너뛰기" 우회 필수 — 강제 이탈 방지).
2. kcs.writings-v1 저장(빈 글 저장 금지·2,000자 컷·챕터당 10개 롤링) — writings.js 또는 stores.js, 순환 import 주의.
3. 완료 화면 접이식 "이 챕터에서 쓴 글" + Guide 전체 아카이브(다시 쓰기 버튼).
4. WS3 완료 시 BACKUP_KEYS 추가(병합: concat→정렬→중복 제거→10컷), WS5 완료 시 저장에 recordActivity.

검증 의무: 저장·롤링·라벨 추출 테스트 / 쓰기→체크→완료→아카이브 수동 E2E / grammarNotes 없는 챕터 무에러.
금지: LLM 채점 / 문법 자동 검출 / 유사도 점수.
```

## 지시 09 — WS8: 문법 갭필 3건

```
스펙: docs/superpowers/specs/v2-upgrade/ws8-grammar-gapfill.md 를 정독하고 그대로 구현하라.
콘텐츠 브리프: 02-CONTENT-BRIEFS.md §B2에 노트 3건의 내용 초안(func·formTable·예문 상황·keyPoint·pitfall)이
있다 — 그것을 살을 붙여 스키마로 완성하라. 초안과 다르게 가려면 근거를 보고에 남겨라.

핵심 요구: -지요/죠(chapter-35 또는 chapter-12 — grammarNotes 흐름 보고 판단·근거 보고) /
반말 세트(chapter-33 증설) / -(으)ㅂ시다(chapter-24, -(으)ㄹ까요 대비). 전부 기존 textbook 스키마
(title/func/formTable/examples×4/keyPoint/pronunciation/drill/englishSpeakerPitfall) 그대로.

절차: rich-chapters/*.json 편집 → node scripts/build-app-data.mjs 만 실행(generate 금지, WS2 후라도 이 작업은 build만으로 충분).
콘텐츠는 스스로 초안 작성 후 반드시 별도 검토 패스(서브에이전트 또는 자체 2차 검증)로 활용·발음·로마자를 재검하라.
검증 의무: 노트 수 before/after 카운트 출력 / 해당 챕터 LessonPlayer 화면 수 증가 확인 / 테스트+빌드 green.
```

## 지시 10 — WS7: Roleplay 채점 완화

```
스펙: docs/superpowers/specs/v2-upgrade/ws7-roleplay-grading.md 를 정독하고 그대로 구현하라.

순서 강제:
1. Conversation.svelte의 checkReply(현행: normalizeKo 완전 일치)와 대화 데이터 구조를 정독하고,
   자연스러운 응답이 탈락하는 실사례 10개를 먼저 수집해 테스트 픽스처로 고정하라(구현 전에).
2. src/lib/replyGrader.js — 3단계(핵심 토큰 매칭→부분 점수+힌트→2회 실패 시 따라 쓰기 통과).
   조사 스트립·활용 정규화는 conjugation.js/hangul.js 재사용. C6의 gloss.js가 이미 있으면 그 조사 로직 공유.
3. false-positive 방지: 엉뚱한 답 5개가 여전히 불통과임을 테스트로 증명.

검증 의무: 픽스처 10+5 전부 테스트 통과 출력 / 힌트가 정답을 노출하지 않는지 육안 확인 보고.
금지: LLM/외부 API 채점 / 채점 기준 완화로 아무 답이나 통과.
```

## 지시 11 — C0: 기초 어휘 기반 정비 (콘텐츠 0순위)

```
스펙: docs/superpowers/specs/v2-upgrade/c0-beginner-foundation.md 를 정독하고 그대로 구현하라.
콘텐츠 브리프: 02-CONTENT-BRIEFS.md §B1에 팩 8개의 실제 수록 어휘 목록·tip·위치가 확정돼 있다 —
그대로 쓰되 사전 실존 검증에서 빠지는 항목만 대체하고 대체 내역을 보고하라.

순서 강제:
1. a1-checklist.json(~250개, 스펙 13범주+날씨·교통·의문사) 확정 → audit-a1.mjs를 체크인하고 현재 상태 리포트 출력.
2. 재태깅: 체크리스트 매칭 → A1. words 동사 497개는 배치 리뷰로 3단 분류(A1 핵심 ~80/A2/B1 후보)
   후 적용, 판정 기록을 level-audit/verb-levels.json에. WS2 완료면 시드에 level 명시가 정석,
   미완이면 korean/data 직접 패치 + 시드 이중 기록(어느 쪽인지 보고).
3. 생성기 extendedVocab 기본값 'A2' 제거 — level 누락 시 경고 목록 출력하게.
4. 어휘 팩 8개(vocab-packs.json: 숫자/요일·때/가족/색/몸/음식/집·사물/나라·직업) —
   entryHangul→id 해석은 빌드 타임, 미해석은 빌드 에러. Learn 목록 afterChapterNumber 위치에 카드,
   열면 LessonPlayer Words 화면 재사용 + MatchGame 1판. 완료는 kcs.packs-v1(백업 키 표 갱신).
5. 까만색은 추가+검은색 유의어 연결, 있다/없다 headword는 추가하지 않는다(스펙 결정).

검증 의무: audit-a1 재실행 → A1 커버리지 ≥95% + 품사 분포 개선 리포트 첨부 /
"어느 챕터·팩에서도 못 만나는 필수어 0" 증명 / Dictionary A1 필터에 엄마·하나·월요일 노출 확인 /
팩 E2E 1회. WS2 완료 상태면 generate 재실행에도 재태깅 유지 증명.
금지: 챕터 순서 재편 / 체크리스트 밖 대량 신규 어휘 / B1 이상 재태깅(후보 기록까지만).
```

## 지시 12 — C5: 활용 트레이너

```
스펙: docs/superpowers/specs/v2-upgrade/c5-conjugation-trainer.md 를 정독하고 그대로 구현하라.

순서 강제:
1. 품질 선행 점검 — 불규칙 동사 전수의 politePresent·past를 추출해 교차 검증(서브에이전트 리뷰)하고
   오류 수·수정 내역을 먼저 보고하라. 데이터가 썩은 채로 드릴을 만들지 마라.
2. conjugationDrill.js — FORM_LABELS 15종(forms 키와 1:1 스냅샷 테스트), buildConjugationQuiz
   (불규칙 1.5x·연속 중복 방지·결손 스킵), gradeConjugation.
3. Practice에 Conjugation 모드(stage 추가) + 스펙 매핑 표 기준 챕터 연동 화면(kind:'conjugation').
   매핑은 각 챕터 grammarNotes를 열어 검증하고 추가 발견분을 보고하라.
4. 오답 시 불규칙 설명 한 줄(irregular+pattern 조립). 오답 → mistakes(+WS5 시 SRS).

검증 의무: 495×15 전수 스모크(크래시·빈 answer 0) 출력 / 가중치 rng 고정 테스트 / Practice 10문항 완주 E2E.
금지: conjugation.js로 실시간 활용 생성(forms가 단일 진실) / extendedVocab forms 생성 / 오디오.
```

## 지시 13 — C2: 연습문제 확충

```
스펙: docs/superpowers/specs/v2-upgrade/c2-exercise-expansion.md 를 정독하고 그대로 구현하라.
콘텐츠 브리프: 02-CONTENT-BRIEFS.md §B3(유형별 실물 예시·오답 설계 표·explanation 2문장 규칙)을
생성 스펙에 그대로 포함시켜라 — 배치 에이전트가 이 예시 품질을 기준으로 삼게.

순서 강제(각 단계 사이에 테스트+빌드):
1. 스키마 통일 — errorCorrection/correction→errorCorrect, answer→correct 일괄 변환(건수 출력, 40건 예상).
   LessonPlayer 렌더 분기에서 "조용히 안 그려지던 유형"이 있었는지 확인해 보고하라.
2. 신규 유형 3종(particleChoice/conjugate/orderWords)을 LessonPlayer에 추가. ExerciseHost는 별개
   시스템이다 — 절대 건드리지 마라.
3. scripts/validate-exercises.mjs(정답∈options·중복·필수 필드·type 화이트리스트)를 만들고 build 앞단에 연결.
4. 콘텐츠 생성 — 스펙의 분포 목표로 챕터당 10+. 병렬 배치 생성 → 교차 리뷰(문법 정오·정답 유일성·저빈도어)
   → 수정 적용. 리뷰 없이 직행 금지. 기존 문항은 절대 수정하지 마라(추가만).

검증 의무: 유형×챕터 분포 리포트 / validate 전 챕터 통과 / 신규 유형 채점 테스트 / 프리뷰 스와이프 E2E.
```

## 지시 14 — C3: 체크포인트 + 나선형 복습

```
스펙: docs/superpowers/specs/v2-upgrade/c3-review-checkpoints.md 를 정독하고 그대로 구현하라.

핵심 요구:
1. checkpointSlots(chapters) — 레벨 변화 지점 도출(하드코딩 금지). A1/A2/B1 3개, B2/C1 제외.
2. Learn 목록에 체크포인트 카드(도장 모티프) → 20문항 세션(챕터당 ≤2·type 연속 금지) →
   결과 리포트(약한 챕터 Top3 + 다시 보기). kcs.checkpoint-v1 저장(백업 키 표 갱신). 통과/잠금 개념 금지.
3. 나선형: LessonPlayer 연습에 직전 3챕터 문항 20% 확률 삽입 + "복습 · N과에서" 배지.
   SPIRAL_RATE/COUNT 상수화. 1~3과·ch01 가드.

검증 의무: 슬롯 도출·샘플링·약한 챕터 집계·나선형 rng 테스트 / SPIRAL_RATE=1 임시 확인 후 원복 /
체크포인트 E2E 1회 + 스크린샷.
```

## 지시 15 — C4: 문법 대조 뱅크 확장

```
스펙: docs/superpowers/specs/v2-upgrade/c4-contrast-bank.md 를 정독하고 그대로 구현하라.
콘텐츠 브리프: 02-CONTENT-BRIEFS.md §B4 — "안 vs 못" 완성 예시 1쌍이 품질 기준이고,
나머지 29쌍의 저작 규칙(상황 분산·함정쌍 배합·존대쌍 주의)이 정의돼 있다.

핵심 요구:
1. contrastItems를 src/lib/contrastItems.json으로 분리(허용된 리팩터), level 필드 추가.
2. 스펙 표의 30쌍을 쌍당 6문항으로 생성 — 병렬 배치 → 교차 리뷰. 리뷰 중점: 정답 유일성 /
   정답 좌우 분포 ≥2:4 / 절대 규칙 위반(명령문 앞 -아서, 밖에+긍정 등) 문항 존재 여부.
3. entryId는 korean/data에서 실존 id 검색해 연결(없으면 생략, UI 방어 확인).
4. 검증 스크립트(id 유일성·answer∈options·6문항·분포) + Practice setup에 레벨 필터 칩.

검증 의무: ≥30쌍·~190문항 카운트 출력 / 검증 스크립트 green / contrast 세션 E2E / 리뷰 수정 건수 보고.
금지: PatternContrastSession 대개조 / 4지선다화.
```

## 지시 16 — C6: 읽기 자료실

```
스펙: docs/superpowers/specs/v2-upgrade/c6-reading-room.md 를 정독하고 그대로 구현하라.
콘텐츠 브리프: 02-CONTENT-BRIEFS.md §B5에 20편의 제목·장르·개요 비트·시연 문법이 편별로 확정돼 있다 —
주제를 바꾸지 말고 그대로 집필하라(등장인물 민수·수진·지민 재사용 포함).

순서 강제:
1. 레벨별 허용 문법·어휘 리스트 추출 스크립트 → 생성 스펙에 동봉(콘텐츠보다 먼저).
2. gloss.js(직일치→조사 스트립→forms 역인덱스→실패 무동작)와 check-reader-coverage.mjs(≥85% 게이트)를
   콘텐츠 생성 전에 완성하라 — 커버리지를 못 재면서 글부터 쓰지 마라. WS7의 replyGrader가 있으면 조사 로직 공유.
3. 20편 생성(레벨당 5, 스펙의 주제·길이·스키마) — 레벨별 배치 → 언어 리뷰 + 커버리지 기계 검증 이중 게이트 → 수정.
4. Reading Room UI(Learn 하위) + 글로스 팝오버 + 이해 문항 + 요약 쓰기(WS6 연동) + kcs.readers-v1(키 표 갱신).

검증 의무: 20편 커버리지 로그 전부 첨부 / 글로스 매칭 4단계 테스트 / 리더 E2E 1회 /
이해 문항은 C2 validate 재사용 통과. WS1 완료 상태면 사이즈 가드 통과 확인.
금지: 오디오 낭독 / 실제 저작물 발췌(전부 창작) / 로마자 본문 표시.
```

## 지시 17 — C7: 한자어 어근 패밀리

```
스펙: docs/superpowers/specs/v2-upgrade/c7-hanja-families.md 를 정독하고 그대로 구현하라.
콘텐츠 브리프: 02-CONTENT-BRIEFS.md §B6에 40어근 확정 목록(한자·뜻·파생어 예시·⚠동음이의 표시)이 있다 —
⚠ 어근은 자동 매칭 금지·수동 확정 규칙을 그대로 적용하라.

순서 강제:
1. 후보 자동 추출 스크립트(어근 음절 매칭) → **동음이의 오매칭 제거 리뷰**(사과의 과≠과일의 과 함정,
   순우리말 오포함 주의)를 반드시 별도 패스로. 리뷰 전 데이터를 UI에 연결하지 마라.
2. roots.json 40어근({root, hanja, gloss, entryIds[]}) — entryIds 전부 실존 검증(빌드 에러 게이트).
3. EntryDetail "같은 어근" 접이식 + Dictionary 어근 브라우저 + 미니 퀴즈.

검증 의무: 40어근·어근당 파생어 ≥3 카운트 / 오매칭 리뷰 전후 제거 건수 보고 / EntryDetail 연동 E2E.
금지: 한자 쓰기 교육(읽기 어근 인지만) / 40개 초과 확장.
```

## 지시 18 — C9: Day-1 온램프 (절대 초보 진입 장벽 제거) ※ C0 완료 후 실행

```
스펙: docs/superpowers/specs/v2-upgrade/c9-day1-onramp.md 를 정독하고 그대로 구현하라.
콘텐츠 브리프: 02-CONTENT-BRIEFS.md §B8에 오리엔테이션 10개 개념·생존 팩 2개 수록 목록·
키보드 가이드 아웃라인·앱 사용법 아웃라인이 전부 확정돼 있다 — 재발명 금지.

순서 강제:
1. Part E 먼저(문서·리스크 없음) — Guide 최상단 "How to use this app" 카드 + 저장소 README.md 신설.
   README의 실행 명령은 실제로 실행해 검증하라.
2. Part A 오리엔테이션 10카드 — §B8-1 순서·내용 그대로, "배우는 과" 링크는 표시 번호 기준 실존 검증.
   완료 후 카드가 Guide로 내려가는 이관 로직 포함. kcs.orientation-v1(키 표 갱신).
3. Part B 생존 팩 2개 — C0의 vocab-packs 메커니즘 재사용. expressions 소속 항목이 팩에서 해석되는지
   먼저 확인하고, 안 되면 팩 해석기를 expressions까지 확장하라. 부재 표제어 처리 내역 보고.
4. Part C 키보드 — Guide "Set up Korean typing" 유닛(§B8-3) + KoreanInputFallback.svelte(어절 뱅크,
   quiz.js build 재사용, kcs.ime-fallback-v1 기억). C5/C2가 이미 구현돼 있으면 그 타이핑 문항에 연결하고,
   아직이면 컴포넌트만 완성해 두고 연결 지점을 보고에 명시하라. 자모 가상 키보드 자작 금지.
5. Part D 로마자 넛지 — 3과 완료 시 1회만(kcs.roman-nudge-v1). 강제/자동 off 금지.

검증 의무: 오리엔테이션·팩 E2E / 폴백으로 타이핑 문항 정답 도달 테스트 / 넛지 1회성 테스트 /
README 명령 실사 출력 / 신규 키 3개를 00-README 키 표와 (WS3 완료 시) BACKUP_KEYS에 반영.
금지: 오리엔테이션 필수 관문화 / 로마자 강제 off / 자모 IME 재구현.
```
