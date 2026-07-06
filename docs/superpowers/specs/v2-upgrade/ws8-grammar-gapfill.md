# WS8 — 문법 갭필 3건 (-지요/죠 · 반말 확장 · -(으)ㅂ시다)

우선순위 P2. 규모: 소(콘텐츠 작업). **의존: WS2 완료 후 권장**(전이라면 build-app-data만 실행, generate 금지).
목표 한 줄: 커리큘럼 감사(2026-07)에서 확인된 진짜 빈틈 3개를 기존 챕터에 노트로 보강한다.

## 반영 위치 (id 기준 — 파일명과 표시 번호가 다름에 주의)

| 갭 | 파일 | 표시 번호/제목 | 작업 |
|---|---|---|---|
| -지요/죠 (확인·동의 구하기) | `scripts/rich-chapters/chapter-35.json` | 42과 Discourse Markers | grammarNote 1개 추가 |
| 반말 4형 세트 (평서·의문·명령·청유) | `scripts/rich-chapters/chapter-33.json` | 40과 Speech Levels | 기존 반말 노트 확인 후 부족분 1~2개 증설 |
| -(으)ㅂ시다 (격식 청유) | `scripts/rich-chapters/chapter-24.json` | 19과 Suggestions and Trying | grammarNote 1개 추가 (-(으)ㄹ까요? 대비) |

착수 전 각 파일의 기존 grammarNotes를 정독하고 **중복 여부 확인** — 예: chapter-33에 반말이 이미
부분적으로 있으면 "빠진 형태만" 채운다. 배치 위치는 기존 노트 흐름상 자연스러운 순서(실행자 판단, 이유 기록).

## 노트 스키마 (기존 textbook-grade 형식 그대로 — chapter-12.json 등에서 실물 확인)

```json
{
  "title": "-지요/죠 — Seeking Agreement and Confirming",
  "func": "무엇을 하는 문법인지 2~3문장 (영어)",
  "formTable": [{ "when": "받침 유무 등 조건", "add": "붙이는 형태", "ex": "예" }],
  "examples": [{ "ko": "...", "romanization": "...", "en": "...", "note": "..." }],   // 정확히 4개
  "keyPoint": { "label": "...", "body": "..." },
  "pronunciation": "발음 팁 (해당 시)",
  "drill": { "instruction": "...", "model": "...", "items": ["...", "...", "..."] },
  "englishSpeakerPitfall": { "wrong": "...", "right": "...", "explanation": "..." }
}
```

## 콘텐츠 요구사항 (전 노트 공통)
- **고빈도 일상 어휘만**(명함류 금지), 예문 4개는 서로 다른 상황, 로마자 정확히(기존 romanize 관례 —
  같은 파일의 기존 예문 로마자 스타일을 따른다).
- 각 갭의 핵심 포인트(이 정도는 반드시 담을 것):
  - **-지요/죠**: (a) 서로 아는 사실 확인("오늘 덥지요?") (b) 부드러운 동의 유도 (c) 축약형 죠가 구어 기본
    (d) pitfall: 영어권이 -지요를 일반 의문문과 혼용 — 몰라서 묻는 질문엔 안 씀.
  - **반말 세트**: 해요체→반말 도출 규칙(요 탈락 기본) + 4형(먹어/먹어?/먹어!/먹자) + 이다·아니다 특례(야/이야)
    + 누구에게 써도 되는지 사회적 맥락. 기존 chapter-33 노트와 중복 없이.
  - **-(으)ㅂ시다**: 격식 청유, -(으)ㄹ까요?(제안·의향 묻기)와의 대비가 핵심. pitfall: 윗사람에게
    -(으)ㅂ시다는 실례가 될 수 있음(같이 가시겠어요?가 안전) — 이 뉘앙스 반드시 포함.

## 작업 절차
1. 대상 3파일 정독(기존 노트·대화와 톤 일치 확인) → 노트 작성 → JSON에 삽입(문법 노트 배열 순서 신중히).
2. `node scripts/build-app-data.mjs` 실행 (**generate 금지** — WS2 미완이면 특히).
3. 검증 python 스니펫: 각 챕터 grammarNotes 수 before/after, 신규 노트 필드 완전성(스키마 키 전부 존재,
   examples 정확히 4개).
4. `npx vitest run` + `npm run build`.
5. 프리뷰(포트 5175, `.claude/launch.json`의 "korean-dev")에서 해당 챕터 열어 새 화면 렌더 확인 —
   LessonPlayer는 grammarNote 1개당 1화면을 만든다. formTable/drill/pitfall 블록이 모두 그려지는지.

## 검토 게이트 (콘텐츠 품질 — 필수)
- 작성 후 **셀프 리뷰 체크리스트**: 로마자 정확? 활용 오류 없음(존재하지 않는 형태 금지)? 예문이 자연스러운
  구어? 레벨 적정(두 챕터 다 B1, chapter-24는 A2 — A2 노트는 더 짧은 문장)? 기존 노트와 용어 일관
  (예: 해요체를 polite -요 form으로 부르는 등 파일 내 관례)?
- 가능하면 별도 세션/에이전트에게 3개 노트만 교차 검증시킨다(문법 오류·부자연스러움·저빈도어).

## 수용 기준
1. 3개 챕터에 노트가 들어가고 화면으로 렌더된다(프리뷰 스크린샷 확인).
2. grammarNotes 수가 의도대로 증가, 기존 노트 무변경(diff로 확인).
3. 전 테스트 green + build. 4. 셀프 리뷰 체크리스트 전 항목 통과 기록.

## 하지 말 것
- 새 챕터 생성(감사 결론: 불필요). course.json/커리큘럼 순서 변경. generate-korean-data 실행.
- 기존 노트 "개선"(범위 밖 — 추가만).

## 완료 기록
(실행자가 작성)
