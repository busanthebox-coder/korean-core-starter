# Korean Core Starter — UI/UX Rebuild Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild the front end as a Vite + Svelte SPA (Duolingo-style, no game mechanics) reusing the existing JSON content, deployed statically to GitHub Pages — starting with a working, testable scaffold (data layer, design tokens, responsive shell + nav, route stubs).

**Architecture:** New Svelte app lives at the repo root (`package.json`, `src/`); the old `korean/` app stays live until cutover. Vite imports `korean/data/*.json` directly (baked into the build — no runtime fetch). Hash routing via `svelte-spa-router` so GitHub Pages needs no rewrites; `base: '/words/'`. Pure logic (data indexing, Hangul jamo, quiz generators) is TDD'd with Vitest; components get smoke-render tests with @testing-library/svelte.

**Tech Stack:** Vite, Svelte 4, svelte-spa-router, Vitest, @testing-library/svelte, jsdom.

**Spec:** `docs/superpowers/specs/2026-05-30-korean-app-ui-rebuild-design.md`

---

## Phase scope & decomposition

This plan fully details **Phase 1 (Scaffold)**. Each later phase is its own plan (write it when the prior phase is merged), because each produces independently-shippable software:

- **Phase 1 — Scaffold** *(this plan)*: project init, `lib/data`, `lib/stores`, `lib/audio`, `lib/hangul`, tokens, App shell + responsive nav, 5 route stubs, build/test/deploy scripts.
- **Phase 2 — Dictionary**: `EntryCard`, `EntryDetail`, search + filters over `entries`, romanization toggle wired in.
- **Phase 3 — Learn**: lesson-path, chapter view, **interactive Hangul trainer** (uses `lib/hangul`), grammar reference.
- **Phase 4 — Practice**: `lib/quiz` generators + `ExerciseHost` (match, listen, word-bank, dictation, recognition, fill-blank, form-transform, Hangul drills) + feedback.
- **Phase 5 — Talk**: dialogue player + practice mode.
- **Phase 6 — Guide**: newcomer tracks/units.
- **Phase 7 — Polish + cutover**: a11y pass, perf, deploy `dist/` to Pages root, retire `korean/`.

> File-structure note: each `lib/*.js` has one responsibility (data, stores, audio, hangul, quiz). Components are small and route-scoped. Files that change together live together (`src/lib/components/`).

---

## Phase 1 — Scaffold

### Task 1: Initialize the Vite + Svelte project

**Files:**
- Create: `package.json`, `vite.config.js`, `svelte.config.js`, `.gitignore`, `index.html`, `src/main.js`, `src/App.svelte`

- [ ] **Step 1: Create `package.json`**

```json
{
  "name": "korean-core-starter",
  "private": true,
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview",
    "test": "vitest run",
    "test:watch": "vitest",
    "check": "svelte-check --tsconfig ./jsconfig.json || true",
    "deploy": "npm run build && gh-pages -d dist"
  },
  "devDependencies": {
    "@sveltejs/vite-plugin-svelte": "^3.1.2",
    "@testing-library/svelte": "^5.2.1",
    "@testing-library/jest-dom": "^6.4.8",
    "gh-pages": "^6.1.1",
    "jsdom": "^24.1.1",
    "svelte": "^4.2.19",
    "vite": "^5.4.0",
    "vitest": "^2.0.5"
  },
  "dependencies": {
    "svelte-spa-router": "^4.0.1"
  }
}
```

- [ ] **Step 2: Create `vite.config.js`**

```js
import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';

export default defineConfig({
  base: '/words/',
  plugins: [svelte()],
  build: { outDir: 'dist', emptyOutDir: true },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test-setup.js'],
  },
});
```

- [ ] **Step 3: Create `svelte.config.js`**

```js
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';
export default { preprocess: vitePreprocess() };
```

- [ ] **Step 4: Create `.gitignore` (append if exists)**

```
node_modules/
dist/
.vite/
```

- [ ] **Step 5: Create `index.html` (at repo root)**

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Korean Core Starter</title>
    <link rel="preconnect" href="https://cdn.jsdelivr.net" />
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable.min.css" />
  </head>
  <body>
    <div id="app"></div>
    <script type="module" src="/src/main.js"></script>
  </body>
</html>
```

- [ ] **Step 6: Create `src/test-setup.js`**

```js
import '@testing-library/jest-dom/vitest';
```

- [ ] **Step 7: Create `src/main.js`**

```js
import './styles/tokens.css';
import App from './App.svelte';

const app = new App({ target: document.getElementById('app') });
export default app;
```

- [ ] **Step 8: Create a minimal `src/App.svelte` placeholder (replaced in Task 7)**

```svelte
<main><h1>Korean Core Starter</h1></main>
```

- [ ] **Step 9: Install and verify build tooling**

Run: `npm install`
Then: `npm run build`
Expected: build succeeds, `dist/index.html` created. (tokens.css missing will fail — create an empty `src/styles/tokens.css` first if needed; Task 5 fills it.)

- [ ] **Step 10: Commit**

```bash
git add -A && git commit -m "chore: scaffold Vite+Svelte project at repo root"
```

---

### Task 2: Data layer (`lib/data.js`) — TDD

**Files:**
- Create: `src/lib/data.js`
- Test: `src/lib/data.test.js`

- [ ] **Step 1: Write the failing test**

```js
import { describe, it, expect } from 'vitest';
import { entries, findEntry, chapters, dialogues, guideTracks, grammar } from './data.js';

describe('data layer', () => {
  it('loads a large vocabulary pool', () => {
    expect(entries.length).toBeGreaterThan(900);
  });
  it('findEntry resolves a known verb', () => {
    const e = findEntry('word-verb-001');
    expect(e).toBeTruthy();
    expect(e.hangul).toBeTypeOf('string');
  });
  it('every chapter cross-link resolves to an entry or grammar id', () => {
    const grammarIds = new Set(grammar.map((g) => g.id));
    const unresolved = [];
    for (const ch of chapters) {
      for (const id of [...(ch.linkedEntryIds || []), ...(ch.coreVocabularyIds || []), ...(ch.patternIds || [])]) {
        if (!findEntry(id)) unresolved.push(id);
      }
      for (const id of ch.grammarFocus || []) if (!grammarIds.has(id)) unresolved.push(id);
    }
    expect(unresolved).toEqual([]);
  });
  it('exposes dialogues and guide tracks', () => {
    expect(dialogues.length).toBeGreaterThanOrEqual(8);
    expect(guideTracks.length).toBe(4);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/lib/data.test.js`
Expected: FAIL — cannot resolve `./data.js`.

- [ ] **Step 3: Implement `src/lib/data.js`**

```js
import words from '../../korean/data/words.json';
import newcomer from '../../korean/data/newcomer-vocab.json';
import extended from '../../korean/data/vocab-extended.json';
import expressions from '../../korean/data/expressions.json';
import patterns from '../../korean/data/patterns.json';
import course from '../../korean/data/course.json';
import grammarData from '../../korean/data/grammar.json';
import activitiesData from '../../korean/data/activities.json';
import guideData from '../../korean/data/guide.json';
import dialoguesData from '../../korean/data/dialogues.json';

export const entries = [
  ...words.entries,
  ...newcomer.entries,
  ...extended.entries,
  ...expressions.entries,
  ...patterns.entries,
].sort((a, b) => (a.sort ?? 0) - (b.sort ?? 0));

const byId = new Map(entries.map((e) => [e.id, e]));
export const findEntry = (id) => byId.get(id) || null;

export const chapters = (course.chapters || []).slice().sort((a, b) => a.number - b.number);
export const curriculumGuide = course.curriculumGuide || [];
export const functionTags = course.functionTags || [];
export const grammar = [...(grammarData.grammarItems || []), ...(grammarData.endingItems || [])];
export const findGrammar = (id) => grammar.find((g) => g.id === id) || null;
export const activities = activitiesData.chapterActivities || [];
export const guideTracks = guideData.tracks || [];
export const dialogues = dialoguesData.dialogues || [];
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/lib/data.test.js`
Expected: PASS (4 tests).

- [ ] **Step 5: Commit**

```bash
git add src/lib/data.js src/lib/data.test.js && git commit -m "feat(data): import + index JSON content with resolving cross-links"
```

---

### Task 3: Hangul jamo logic (`lib/hangul.js`) — TDD

**Files:**
- Create: `src/lib/hangul.js`
- Test: `src/lib/hangul.test.js`

- [ ] **Step 1: Write the failing test**

```js
import { describe, it, expect } from 'vitest';
import { compose, decompose, LEADS, VOWELS, TAILS } from './hangul.js';

describe('hangul', () => {
  it('composes a syllable from jamo indices', () => {
    // 한 = ㅎ(18) + ㅏ(0) + ㄴ(4)
    expect(compose(18, 0, 4)).toBe('한');
    // 가 = ㄱ(0) + ㅏ(0) + (no tail)
    expect(compose(0, 0, 0)).toBe('가');
  });
  it('decomposes a syllable into jamo', () => {
    expect(decompose('한')).toEqual({ lead: 'ㅎ', vowel: 'ㅏ', tail: 'ㄴ' });
    expect(decompose('가')).toEqual({ lead: 'ㄱ', vowel: 'ㅏ', tail: '' });
  });
  it('exposes jamo tables', () => {
    expect(LEADS.length).toBe(19);
    expect(VOWELS.length).toBe(21);
    expect(TAILS.length).toBe(28);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/lib/hangul.test.js`
Expected: FAIL — cannot resolve `./hangul.js`.

- [ ] **Step 3: Implement `src/lib/hangul.js`**

```js
// Modern Hangul jamo tables (Unicode order for the syllable block algorithm).
export const LEADS = ['ㄱ','ㄲ','ㄴ','ㄷ','ㄸ','ㄹ','ㅁ','ㅂ','ㅃ','ㅅ','ㅆ','ㅇ','ㅈ','ㅉ','ㅊ','ㅋ','ㅌ','ㅍ','ㅎ'];
export const VOWELS = ['ㅏ','ㅐ','ㅑ','ㅒ','ㅓ','ㅔ','ㅕ','ㅖ','ㅗ','ㅘ','ㅙ','ㅚ','ㅛ','ㅜ','ㅝ','ㅞ','ㅟ','ㅠ','ㅡ','ㅢ','ㅣ'];
export const TAILS = ['','ㄱ','ㄲ','ㄳ','ㄴ','ㄵ','ㄶ','ㄷ','ㄹ','ㄺ','ㄻ','ㄼ','ㄽ','ㄾ','ㄿ','ㅀ','ㅁ','ㅂ','ㅄ','ㅅ','ㅆ','ㅇ','ㅈ','ㅊ','ㅋ','ㅌ','ㅍ','ㅎ'];
const BASE = 0xac00;

export function compose(leadIdx, vowelIdx, tailIdx = 0) {
  return String.fromCharCode(BASE + (leadIdx * 21 + vowelIdx) * 28 + tailIdx);
}

export function decompose(syllable) {
  const code = syllable.charCodeAt(0) - BASE;
  if (code < 0 || code > 11171) return { lead: syllable, vowel: '', tail: '' };
  const tailIdx = code % 28;
  const vowelIdx = Math.floor((code % 588) / 28);
  const leadIdx = Math.floor(code / 588);
  return { lead: LEADS[leadIdx], vowel: VOWELS[vowelIdx], tail: TAILS[tailIdx] };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/lib/hangul.test.js`
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add src/lib/hangul.js src/lib/hangul.test.js && git commit -m "feat(hangul): jamo compose/decompose for the alphabet trainer"
```

---

### Task 4: Stores + audio (`lib/stores.js`, `lib/audio.js`) — TDD

**Files:**
- Create: `src/lib/stores.js`, `src/lib/audio.js`
- Test: `src/lib/stores.test.js`

- [ ] **Step 1: Write the failing test**

```js
import { describe, it, expect, beforeEach } from 'vitest';
import { get } from 'svelte/store';
import { romanizationVisible, toggleRomanization, lessonProgress, markLessonDone } from './stores.js';

beforeEach(() => localStorage.clear());

describe('stores', () => {
  it('romanization defaults visible and toggles', () => {
    romanizationVisible.set(true);
    expect(get(romanizationVisible)).toBe(true);
    toggleRomanization();
    expect(get(romanizationVisible)).toBe(false);
  });
  it('marks a lesson done and persists', () => {
    markLessonDone('chapter-01');
    expect(get(lessonProgress).has('chapter-01')).toBe(true);
    expect(JSON.parse(localStorage.getItem('kcs.progress'))).toContain('chapter-01');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/lib/stores.test.js`
Expected: FAIL — cannot resolve `./stores.js`.

- [ ] **Step 3: Implement `src/lib/stores.js`**

```js
import { writable } from 'svelte/store';

function persistedSet(key) {
  let initial = [];
  try { initial = JSON.parse(localStorage.getItem(key)) || []; } catch { initial = []; }
  const store = writable(new Set(initial));
  store.subscribe((set) => {
    try { localStorage.setItem(key, JSON.stringify([...set])); } catch { /* ignore */ }
  });
  return store;
}

function persistedBool(key, fallback) {
  let initial = fallback;
  try { const v = localStorage.getItem(key); if (v !== null) initial = v === '1'; } catch { /* ignore */ }
  const store = writable(initial);
  store.subscribe((v) => { try { localStorage.setItem(key, v ? '1' : '0'); } catch { /* ignore */ } });
  return store;
}

export const romanizationVisible = persistedBool('kcs.roman', true);
export function toggleRomanization() { romanizationVisible.update((v) => !v); }

export const lessonProgress = persistedSet('kcs.progress');
export function markLessonDone(id) { lessonProgress.update((s) => new Set(s).add(id)); }

export const filters = writable({ search: '', type: new Set(), level: new Set(), topic: new Set(), pos: new Set() });
```

- [ ] **Step 4: Implement `src/lib/audio.js`**

```js
export function speak(text) {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
  window.speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.lang = 'ko-KR';
  const voice = window.speechSynthesis.getVoices().find((v) => v.lang && v.lang.startsWith('ko'));
  if (voice) u.voice = voice;
  window.speechSynthesis.speak(u);
}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npx vitest run src/lib/stores.test.js`
Expected: PASS (2 tests).

- [ ] **Step 6: Commit**

```bash
git add src/lib/stores.js src/lib/audio.js src/lib/stores.test.js && git commit -m "feat(state): romanization toggle, lesson progress, filters, TTS"
```

---

### Task 5: Design tokens (`styles/tokens.css`)

**Files:**
- Create/replace: `src/styles/tokens.css`

- [ ] **Step 1: Write `src/styles/tokens.css`**

```css
:root {
  --green: #58cc02; --green-dark: #46a302; --green-soft: #e8f7d4;
  --blue: #1cb0f6; --ink: #3c3c3c; --ink-2: #6b7280; --ink-3: #9aa3ad;
  --bg: #f7faf5; --surface: #ffffff; --surface-2: #f1f5ee;
  --border: #e6e9e2; --radius: 16px; --radius-pill: 999px;
  --shadow-1: 0 2px 0 var(--border), 0 6px 16px rgba(20,30,10,.06);
  --bounce: cubic-bezier(.2,.8,.3,1.2);
  --type-word: #58cc02; --type-expression: #1cb0f6; --type-pattern: #9b6dff; --type-grammar: #ff9600;
}
* { box-sizing: border-box; }
html, body { margin: 0; min-height: 100%; background: var(--bg); color: var(--ink);
  font-family: 'Pretendard Variable', Pretendard, system-ui, sans-serif; line-height: 1.55; }
button { font: inherit; cursor: pointer; border: 0; background: none; color: inherit; }
a { color: inherit; }
.btn3d { display: inline-flex; align-items: center; justify-content: center; gap: 8px;
  padding: 12px 18px; border-radius: var(--radius-pill); background: var(--green);
  color: #fff; font-weight: 800; box-shadow: 0 4px 0 var(--green-dark); transition: transform .08s var(--bounce); }
.btn3d:active { transform: translateY(2px); box-shadow: 0 2px 0 var(--green-dark); }
.card { background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius); box-shadow: var(--shadow-1); }
```

- [ ] **Step 2: Verify build picks it up**

Run: `npm run build`
Expected: build succeeds (tokens.css imported by `src/main.js`).

- [ ] **Step 3: Commit**

```bash
git add src/styles/tokens.css && git commit -m "feat(ui): Duolingo-style design tokens + base"
```

---

### Task 6: Nav data + components (`SideNav`, `BottomNav`)

**Files:**
- Create: `src/lib/nav.js`, `src/lib/components/SideNav.svelte`, `src/lib/components/BottomNav.svelte`
- Test: `src/lib/nav.test.js`

- [ ] **Step 1: Write the failing test**

```js
import { describe, it, expect } from 'vitest';
import { NAV } from './nav.js';
describe('nav', () => {
  it('defines the five destinations with routes and labels', () => {
    expect(NAV.map((n) => n.path)).toEqual(['/learn', '/practice', '/talk', '/dictionary', '/guide']);
    expect(NAV.every((n) => n.label && n.icon)).toBe(true);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/lib/nav.test.js`
Expected: FAIL — cannot resolve `./nav.js`.

- [ ] **Step 3: Implement `src/lib/nav.js`**

```js
export const NAV = [
  { path: '/learn', label: 'Learn', icon: '📚' },
  { path: '/practice', label: 'Practice', icon: '🎯' },
  { path: '/talk', label: 'Talk', icon: '💬' },
  { path: '/dictionary', label: 'Dictionary', icon: '🔎' },
  { path: '/guide', label: 'Guide', icon: '🧭' },
];
```

- [ ] **Step 4: Implement `src/lib/components/SideNav.svelte`**

```svelte
<script>
  import { link, location } from 'svelte-spa-router';
  import { NAV } from '../nav.js';
</script>

<nav class="sidenav">
  {#each NAV as item}
    <a use:link href={item.path} class:active={$location.startsWith(item.path)}>
      <span class="ic">{item.icon}</span><span class="lb">{item.label}</span>
    </a>
  {/each}
</nav>

<style>
  .sidenav { display: flex; flex-direction: column; gap: 4px; padding: 16px 10px; }
  .sidenav a { display: flex; align-items: center; gap: 12px; padding: 12px 14px; border-radius: var(--radius-pill); color: var(--ink-2); font-weight: 800; }
  .sidenav a:hover { background: var(--surface-2); color: var(--ink); }
  .sidenav a.active { background: var(--green-soft); color: var(--green-dark); }
  .ic { font-size: 20px; }
</style>
```

- [ ] **Step 5: Implement `src/lib/components/BottomNav.svelte`**

```svelte
<script>
  import { link, location } from 'svelte-spa-router';
  import { NAV } from '../nav.js';
</script>

<nav class="bottomnav">
  {#each NAV as item}
    <a use:link href={item.path} class:active={$location.startsWith(item.path)}>
      <span class="ic">{item.icon}</span><span class="lb">{item.label}</span>
    </a>
  {/each}
</nav>

<style>
  .bottomnav { position: fixed; bottom: 0; left: 0; right: 0; display: flex; background: var(--surface);
    border-top: 1px solid var(--border); padding: 6px 4px env(safe-area-inset-bottom); z-index: 40; }
  .bottomnav a { flex: 1; display: flex; flex-direction: column; align-items: center; gap: 2px;
    padding: 6px 0; color: var(--ink-3); font-size: 11px; font-weight: 800; }
  .bottomnav a.active { color: var(--green-dark); }
  .ic { font-size: 22px; }
</style>
```

- [ ] **Step 6: Run test to verify it passes**

Run: `npx vitest run src/lib/nav.test.js`
Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add src/lib/nav.js src/lib/nav.test.js src/lib/components/SideNav.svelte src/lib/components/BottomNav.svelte && git commit -m "feat(nav): 5-destination side + bottom navigation"
```

---

### Task 7: App shell + router + route stubs

**Files:**
- Replace: `src/App.svelte`
- Create: `src/routes/Learn.svelte`, `Practice.svelte`, `Talk.svelte`, `Dictionary.svelte`, `Guide.svelte`
- Test: `src/App.test.js`

- [ ] **Step 1: Create the five route stubs** (each identical shape; shown for Learn — repeat with its own name/text for Practice, Talk, Dictionary, Guide)

`src/routes/Learn.svelte`:
```svelte
<section class="route"><h1>Learn</h1><p>Lesson path — coming in Phase 3.</p></section>
<style>.route{max-width:1120px;margin:0 auto;padding:28px;}</style>
```
`src/routes/Practice.svelte`: same with `<h1>Practice</h1><p>Exercises — Phase 4.</p>`
`src/routes/Talk.svelte`: `<h1>Talk</h1><p>Dialogues — Phase 5.</p>`
`src/routes/Dictionary.svelte`: `<h1>Dictionary</h1><p>Search — Phase 2.</p>`
`src/routes/Guide.svelte`: `<h1>Guide</h1><p>Newcomer guide — Phase 6.</p>`

- [ ] **Step 2: Replace `src/App.svelte`**

```svelte
<script>
  import Router, { push, location } from 'svelte-spa-router';
  import SideNav from './lib/components/SideNav.svelte';
  import BottomNav from './lib/components/BottomNav.svelte';
  import Learn from './routes/Learn.svelte';
  import Practice from './routes/Practice.svelte';
  import Talk from './routes/Talk.svelte';
  import Dictionary from './routes/Dictionary.svelte';
  import Guide from './routes/Guide.svelte';

  const routes = {
    '/learn': Learn, '/practice': Practice, '/talk': Talk,
    '/dictionary': Dictionary, '/guide': Guide,
    '*': Learn,
  };
  if (!window.location.hash) push('/learn');
</script>

<div class="shell">
  <header class="topbar"><span class="brand"><span class="mark">한</span> Korean Core Starter</span></header>
  <div class="body">
    <aside class="rail"><SideNav /></aside>
    <main class="content"><Router {routes} /></main>
  </div>
  <BottomNav />
</div>

<style>
  .shell { min-height: 100vh; }
  .topbar { position: sticky; top: 0; z-index: 30; height: 58px; display: flex; align-items: center;
    padding: 0 18px; background: rgba(255,255,255,.94); border-bottom: 1px solid var(--border); backdrop-filter: blur(12px); }
  .brand { font-weight: 900; display: inline-flex; align-items: center; gap: 10px; }
  .mark { width: 32px; height: 32px; display: grid; place-items: center; border-radius: 10px; background: var(--green); color: #fff; }
  .body { display: grid; grid-template-columns: 240px minmax(0, 1fr); }
  .rail { position: sticky; top: 58px; height: calc(100vh - 58px); border-right: 1px solid var(--border); background: var(--surface); }
  .content { min-width: 0; padding-bottom: 72px; }
  /* Mobile: hide sidebar, show bottom nav */
  @media (max-width: 760px) {
    .body { grid-template-columns: 1fr; }
    .rail { display: none; }
  }
  /* Desktop: hide bottom nav */
  @media (min-width: 761px) {
    :global(.bottomnav) { display: none; }
  }
</style>
```

- [ ] **Step 3: Write the smoke test `src/App.test.js`**

```js
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import App from './App.svelte';

describe('App shell', () => {
  it('renders the brand and the default Learn route', () => {
    render(App);
    expect(screen.getByText('Korean Core Starter')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Learn' })).toBeInTheDocument();
  });
});
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npx vitest run src/App.test.js`
Expected: PASS (renders brand + Learn heading).

- [ ] **Step 5: Run full test suite + build**

Run: `npm test && npm run build`
Expected: all tests pass; `dist/` builds.

- [ ] **Step 6: Manual preview sign-off**

Run: `npm run dev`
Open the printed URL. Verify: brand bar, left sidebar (desktop) with 5 items, clicking each swaps the route; narrow the window < 760px → sidebar hides, bottom nav appears. (Author sign-off.)

- [ ] **Step 7: Commit**

```bash
git add src/App.svelte src/routes/ src/App.test.js && git commit -m "feat(shell): responsive app shell + hash router + 5 route stubs"
```

---

### Task 8: Deploy dry-run (no cutover)

**Files:** none (verification only)

- [ ] **Step 1: Build and inspect base path**

Run: `npm run build && grep -o '/words/[^"]*' dist/index.html | head -3`
Expected: asset URLs are prefixed with `/words/` (matches GitHub Pages repo path). Old `korean/` app is untouched and still works.

- [ ] **Step 2: Commit any config fix if the base path is wrong** (only if needed)

```bash
git add vite.config.js && git commit -m "fix(build): correct GitHub Pages base path"
```

---

## Self-review (against the spec)

**Spec coverage (Phase 1 items):** data layer (Task 2 ✓), stores incl. romanization toggle + progress (Task 4 ✓), audio/TTS (Task 4 ✓), Hangul jamo logic for the trainer (Task 3 ✓ — consumed in Phase 3), design tokens (Task 5 ✓), responsive shell + side/bottom nav (Tasks 6–7 ✓), 5 routes + hash routing + `/words/` base (Tasks 1,7,8 ✓), data imported not bundled (Task 2 ✓), old app stays live (no `korean/` edits ✓), Vitest + @testing-library (Tasks 2–7 ✓). Screen bodies (Dictionary/Learn/Practice/Talk/Guide), exercise engine, Hangul trainer UI, EntryDetail → **deferred to Phase 2–6 plans** (intentional decomposition, noted up top).

**Placeholder scan:** route stubs are intentional placeholders labeled with their phase; every code step contains real code; no "TBD/handle errors/similar to" shortcuts. ✓

**Type/name consistency:** `findEntry`, `entries`, `chapters`, `grammar`, `guideTracks`, `dialogues` exported by `data.js` and used consistently; `NAV` paths (`/learn`…`/guide`) match `App.svelte` routes and nav components; `compose/decompose/LEADS/VOWELS/TAILS` consistent between `hangul.js` and its test; `romanizationVisible/toggleRomanization/lessonProgress/markLessonDone/filters` consistent. ✓

---

## Phases 2–7 (follow-on plans — outline)

Write each as its own `docs/superpowers/plans/` doc when the previous phase merges.

- **Phase 2 — Dictionary:** `EntryCard.svelte`, `EntryDetail.svelte` (verb forms panel, usage, examples, conjugation tips, mistakes, cross-links via `findEntry`), `Dictionary.svelte` (search box + filter chips bound to `filters` store + results list + detail `Sheet`), `RomanizationLine.svelte` honoring `romanizationVisible`. Tests: filter logic, EntryDetail renders a verb/pattern/grammar correctly.
- **Phase 3 — Learn:** `LessonPath.svelte` (chapter nodes + Continue + progress via `lessonProgress`), `ChapterView.svelte` (vocab/grammar/practice/dialogue micro-lessons), `HangulTrainer.svelte` (uses `lib/hangul`: letter→sound, sound→letter, syllable build, match-pairs), `GrammarReference.svelte` (grouped grammar cards). Tests: hangul trainer item generation, progress marking.
- **Phase 4 — Practice:** `lib/quiz.js` generators (`makeMatch`, `makeListen`, `makeWordBank`, `makeDictation`, `makeRecognition`, `makeFillBlank`, `makeFormTransform`, `makeHangulDrill`) + `ExerciseHost.svelte` + per-exercise components + feedback (correct answer + reason from grammar). Tests: each generator returns a valid, solvable item; scoring.
- **Phase 5 — Talk:** `DialogueList.svelte` + `DialoguePlayer.svelte` (speaker pills, per-line audio, practice-mode hide-EN via store).
- **Phase 6 — Guide:** `GuideTracks.svelte` + `GuideUnit.svelte` (key phrases, dialogue, vocab links, steps, https deep-links).
- **Phase 7 — Polish + cutover:** keyboard/focus a11y, prefers-reduced-motion, Lighthouse pass, `npm run deploy`, repoint Pages, retire `korean/` (or keep as `/legacy`).
