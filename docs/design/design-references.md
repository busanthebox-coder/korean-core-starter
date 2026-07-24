# 교육 앱 디자인 수집·적용 파이프라인

> 2026-07-24 실측 검증. 목적: 교육용 앱들의 실제 화면을 모아 패턴을 뽑고,
> 우리 컴포넌트에 적용하는 **반복 가능한** 절차를 만든다.
> 전제: 한목 정체성(크림 `#FAF4EA` · 감 `#E8552E` · Fraunces/Gowun Batang)은 유지한다 —
> 구조와 위계를 훔치는 것이지 남의 브랜드를 입히는 게 아니다.

## 1. 소스 — 어디는 열리고 어디는 막히나 (전부 직접 확인)

| 소스 | 상태 | 쓸모 |
|---|---|---|
| **apps.apple.com** (앱스토어 웹) | ✅ 열림 | **핵심 소스.** 모든 교육 앱의 실제 레슨 화면이 마케팅 스크린샷으로 공개돼 있다. 로그인 벽 우회 |
| **screensdesign.com** | ✅ 열림 | 2,600개 iOS 앱의 스토어 스크린샷 + 온보딩 플로우 영상 |
| **growth.design/case-studies** | ✅ 열림 | UX 분해 사례 공개: Duolingo Retention, Headspace/Blinkist/Trello Onboarding 등 53건 |
| **bunpro.jp** (문법 페이지) | ✅ 열림 | 문법 항목 페이지 구조의 직접 비교 대상 (이미 GrammarScreen 개편에 사용) |
| mobbin.com | ❌ 403 (봇 차단) | — |
| 앱 내부 화면 (Duolingo 웹, LingoDeer 앱) | ❌ 로그인 필요 | 계정 만들지 않기로 함 |
| cooking.nytimes.com | ❌ 정책 차단 | — |
| WebFetch로 앱스토어 긁기 | ❌ 이미지 URL 소실 | 마크다운 변환이 srcset을 버림 — **브라우저 DOM에서 뽑아야 함** |

## 2. 수집 절차 (검증 완료)

1. 브라우저 패널에서 앱스토어 페이지 열기 (`apps.apple.com/us/app/<이름>/<id>`)
2. 콘솔에서 스크린샷 원본 URL 추출:
   ```js
   const urls=new Set();
   document.querySelectorAll('picture source').forEach(e=>{
     (e.srcset||'').split(',').forEach(p=>{
       const u=p.trim().split(' ')[0];
       if(u.includes('mzstatic') && !u.includes('Placeholder')
          && (u.endsWith('.webp')||u.endsWith('.jpg')||u.endsWith('.png'))) urls.add(u);
     });
   });
   // base 경로별 최대 해상도만 남기고, 300px 미만(아이콘)은 버린다
   ```
3. 추출된 `mzstatic.com/...600x1300bb.webp` URL을 직접 열면 **전체 해상도 레슨 화면**이 보인다
4. 관찰한 패턴을 아래 §4 로그에 기록 (앱 / 화면 / 구조적 사실 / 우리 컴포넌트 매핑)

⚠️ 주의: 캐러셀이 **지연 로드**라 첫 방문에 첫 장만 잡히는 앱이 있다(Drops에서 확인).
캐러셀을 가로 스크롤한 뒤 다시 추출하면 나머지가 잡힌다.

## 3. 수집 대상 앱 (앱스토어 URL)

| 앱 | URL | 볼 것 |
|---|---|---|
| Duolingo | apps.apple.com/us/app/id570060128 | 연습 화면, 진행 표시 |
| LingoDeer | apps.apple.com/us/app/id1261193709 | 문법 설명 카드, 한국어 코스 |
| Drops | apps.apple.com/us/app/id939540371 | 단어 덱, 일러스트 위계 |
| Cake | apps.apple.com/us/app/id1350934885 | 짧은 세션, 영상-자막 리듬 |
| Memrise | apps.apple.com/us/app/id635966718 | SRS 복습 화면 |
| Busuu | apps.apple.com/us/app/id379968583 | 레슨 구조, 교정 피드백 |
| Brilliant | apps.apple.com/us/app/id913335252 | 개념 한 화면 원칙, 인터랙티브 도해 |
| TTMIK | apps.apple.com/us/app/id1444364665 | 한국어 특화 — 우리와 같은 도메인 |

### LingoDeer 수집분 (2026-07-24, 7장)
```
https://is1-ssl.mzstatic.com/image/thumb/PurpleSource221/v4/6b/90/f6/6b90f610-9409-8326-a8c0-0012d421c3cc/1.png/600x1300bb.webp
https://is1-ssl.mzstatic.com/image/thumb/PurpleSource221/v4/df/45/cf/df45cfad-5d2a-2d67-720d-d282a070b26b/2.png/600x1300bb.webp
https://is1-ssl.mzstatic.com/image/thumb/PurpleSource221/v4/08/3a/fb/083afb80-a6c0-0319-4ab1-0c9abe37611e/3.png/600x1300bb.webp
https://is1-ssl.mzstatic.com/image/thumb/PurpleSource221/v4/d7/b3/18/d7b31886-76f4-6aab-09cc-687f9c4a4f08/4.png/600x1300bb.webp
https://is1-ssl.mzstatic.com/image/thumb/PurpleSource221/v4/fd/a2/bf/fda2bfe0-32f4-4d1c-0eef-595ac3801e0f/5.png/600x1300bb.webp
https://is1-ssl.mzstatic.com/image/thumb/PurpleSource221/v4/4b/fe/dc/4bfedcc3-2589-b91b-c735-4cc3d0645c08/6.png/600x1300bb.webp
```

## 4. 패턴 로그 (관찰 → 매핑)

기록 규칙: **본 것만 적는다.** 추측이면 추측이라 쓴다.

| # | 출처(실측) | 구조적 사실 | 우리 매핑 | 상태 |
|---|---|---|---|---|
| P1 | Bunpro は 페이지 | 첫 화면 = 위치(3/12) + 문법 + 한 줄 뜻 + 주의 한 줄 (~110자). 깊이는 Details/Examples/Resources 탭 뒤 | GrammarScreen — 형태 우선 + "왜 그런가" 접기로 적용됨 | ✅ 적용 (bc915a3) |
| P2 | Bunpro は 페이지 | 산문 3문장을 넘기기 전에 반드시 예문이 끼어들고, 뉘앙스는 예문 뒤 괄호가 처리 | 콘텐츠 저작 규칙 후보 — 긴 func 문단 리라이트 시 기준 | ⬜ |
| P3 | LingoDeer 레슨 스크린샷 | 그림 선택 2×2 그리드 + 상단 진행바 + 하단 고정 정답 피드백(초록) + CONTINUE. 문항 텍스트는 상단 중앙 한 줄 | PracticeScreen 객관식 — 현재는 세로 리스트. 그림 없는 우리는 2×2 텍스트 그리드 검토 | ⬜ |
| P4 | growth.design 목록 | Duolingo Retention·Headspace Onboarding 등 사례 연구 공개 — 시각 갤러리가 아니라 UX 심리 분해 | 온보딩·복귀 설계 시 정독 | ⬜ |
| P5 | 레이아웃 5종 시안 (자체 제작, 실콘텐츠) | 카드스택/덱/편집물/고정헤더/탭 비교 — 아티팩트: claude.ai/code/artifact/aec3426c-473b-4e13-89eb-00a68022313d | 사용자 방향 결정 대기. 추천: 03(카드 제거)+02(덱) | ⬜ 대기 |

## 5. 적용 규칙

1. **패턴 하나 = 커밋 하나.** 화면 전체를 한 번에 갈지 않는다 (GrammarScreen 전례: 관찰 → 컴포넌트 수정 → 375px 실측 → 수치로 전후 비교).
2. 적용 전후를 **숫자로** 남긴다 (화면 높이 px, 첫 한국어까지 글자수, 스크롤 배수).
3. 콘텐츠는 건드리지 않는다 — 표현 레이어만. 콘텐츠 수정이 필요해지면 별건으로 분리.
4. 참고 앱의 **구조**를 가져오되 색·마스코트·게임화는 가져오지 않는다 (한목 유지, 사용자가 이미 거부).
