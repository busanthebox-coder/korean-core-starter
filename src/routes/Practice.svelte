<script>
  import { onMount } from 'svelte';
  import { entries, chapters, findEntry } from '../lib/data.js';
  import { buildQuiz, makeMatch, buildWriteQuiz, buildSentenceQuiz } from '../lib/quiz.js';
  import ExerciseHost from '../lib/components/ExerciseHost.svelte';
  import MatchGame from '../lib/components/MatchGame.svelte';
  import ReviewSession from '../lib/components/ReviewSession.svelte';
  import { reviews, dueIds, summarize } from '../lib/srs.js';
  import { study, streak, todayCount, goalOf } from '../lib/progress.js';

  let stage = 'setup';
  let deck = 'all';
  let questions = [];
  let matchData = null;
  let result = null;
  let sessionCards = [];
  let added = false;

  function syncDeckFromUrl() {
    const query = (window.location.hash.split('?')[1] || '').split('#')[0];
    const requested = new URLSearchParams(query).get('deck');
    if (chapters.some((c) => c.id === requested)) deck = requested;
  }

  onMount(() => {
    syncDeckFromUrl();
    window.addEventListener('hashchange', syncDeckFromUrl);
    return () => window.removeEventListener('hashchange', syncDeckFromUrl);
  });

  $: dueCards = dueIds($reviews).map(findEntry).filter(Boolean).slice(0, 40);
  $: deckSize = Object.keys($reviews).length;
  $: sum = summarize($reviews);
  $: streakDays = streak($study);
  $: todayN = todayCount($study);
  $: goal = goalOf($study);
  function startReview() { sessionCards = dueCards.slice(); stage = 'review'; window.scrollTo(0, 0); }
  function addSet() { reviews.addMany(pool.map((e) => e.id)); added = true; setTimeout(() => (added = false), 1800); }
  // ReviewSession passes {reviewed}; the back button passes a click event (no log).
  function reviewDone(e) { if (e && e.reviewed) study.log(e.reviewed); stage = 'setup'; window.scrollTo(0, 0); }

  // Practice covers ALL learnable items — words, expressions and patterns —
  // not just vocabulary. `kind` narrows the active set by type.
  const KINDS = [['all', 'All'], ['word', 'Words'], ['expression', 'Expressions'], ['pattern', 'Patterns']];
  let kind = 'all';
  function deckItems(d) {
    if (d === 'all') return entries;
    const ch = chapters.find((c) => c.id === d);
    if (!ch) return entries;
    const ids = new Set([...(ch.coreVocabularyIds || []), ...(ch.linkedEntryIds || []), ...(ch.patternIds || [])]);
    return [...ids].map(findEntry).filter(Boolean);
  }
  $: base = deckItems(deck);
  $: pool = kind === 'all' ? base : base.filter((e) => e.type === kind);
  $: kindCounts = {
    all: base.length,
    word: base.filter((e) => e.type === 'word').length,
    expression: base.filter((e) => e.type === 'expression').length,
    pattern: base.filter((e) => e.type === 'pattern').length,
  };

  function startQuiz() { questions = buildQuiz(pool, { count: 10 }); stage = 'quiz'; window.scrollTo(0, 0); }
  function startWrite() { questions = buildWriteQuiz(pool, { count: 8 }); stage = 'quiz'; window.scrollTo(0, 0); }
  function startBuild() { questions = buildSentenceQuiz(pool, { count: 6 }); stage = 'quiz'; window.scrollTo(0, 0); }
  function startMatch() { matchData = makeMatch(pool, Math.random, 5); stage = 'match'; window.scrollTo(0, 0); }
  $: canBuild = pool.some((e) => (e.examples || []).some((x) => x.ko && x.ko.trim().split(/\s+/).length >= 2));
  function finish(r) { result = r; if (r && r.total) study.log(r.total); stage = 'results'; window.scrollTo(0, 0); }
  function reset() { stage = 'setup'; result = null; window.scrollTo(0, 0); }
</script>

<section class="practice">
  {#if stage === 'setup'}
    <header class="masthead">
      <span class="eyebrow">Study · 연습</span>
      <h1>Practice</h1>
    </header>

    <div class="today">
      <div class="t-stat"><span class="t-num">🔥 {streakDays}</span><span class="t-lbl">day streak</span></div>
      <div class="t-stat"><span class="t-num">{sum.learned}</span><span class="t-lbl">mastered</span></div>
      <div class="t-goal" class:met={todayN >= goal}>
        <div class="tg-top"><span class="tg-cap">Today's goal</span><strong>{todayN}/{goal}{#if todayN >= goal} ✓{/if}</strong></div>
        <div class="tg-bar"><span style="width:{Math.min(100, goal ? Math.round((todayN / goal) * 100) : 0)}%"></span></div>
      </div>
    </div>

    <div class="review-bar">
      <div class="rb-text">
        <span class="rb-label">Spaced review</span>
        <strong>{dueCards.length} due{deckSize ? ` · ${deckSize} in your deck` : ''}</strong>
        <span class="rb-sub">Reviews come back on a forgetting-curve schedule so words actually stick.</span>
      </div>
      {#if dueCards.length}
        <button class="btn3d" on:click={startReview}>Review {dueCards.length} →</button>
      {:else if deckSize}
        <span class="caught">All caught up 🎉</span>
      {:else}
        <span class="caught muted">Add a set below ↓</span>
      {/if}
    </div>

    <label class="deck">Set
      <select bind:value={deck}>
        <option value="all">Everything ({entries.length})</option>
        {#each chapters as c}<option value={c.id}>Ch {c.number}: {c.title}</option>{/each}
      </select>
    </label>
    <div class="kinds">
      {#each KINDS as [v, label]}
        <button class="kchip" class:on={kind === v} disabled={kindCounts[v] === 0} on:click={() => (kind = v)}>{label} · {kindCounts[v]}</button>
      {/each}
    </div>
    <button class="addset" on:click={addSet}>{added ? '✓ Added to review' : `+ Add these ${pool.length} to your review deck`}</button>
    {#if pool.length < 4}
      <p class="warn">This set has only {pool.length} item{pool.length === 1 ? '' : 's'} — pick another set or kind.</p>
    {:else}
      <div class="mode-group">
        <span class="group-label">Recognize · 알아보기</span>
        <div class="modes">
          <button class="mode-card" on:click={startQuiz}>
            <span class="m-ico">🎯</span><strong>Quiz</strong><span>10 questions · meaning, reverse & listen</span></button>
          <button class="mode-card" on:click={startMatch}>
            <span class="m-ico">🔗</span><strong>Match</strong><span>Pair 5 Korean words with their meanings</span></button>
        </div>
      </div>
      <div class="mode-group">
        <span class="group-label produce">Produce · 직접 만들기</span>
        <div class="modes">
          <button class="mode-card produce" on:click={startWrite}>
            <span class="m-ico">✍️</span><strong>Write</strong><span>See the meaning, type the Korean word</span></button>
          <button class="mode-card produce" class:disabled={!canBuild} disabled={!canBuild} on:click={startBuild}>
            <span class="m-ico">🧩</span><strong>Build</strong><span>Arrange the words into a real sentence</span></button>
        </div>
      </div>
    {/if}

  {:else if stage === 'quiz'}
    <button class="back" on:click={reset}>← Practice</button>
    <ExerciseHost {questions} onDone={finish} />

  {:else if stage === 'match'}
    <button class="back" on:click={reset}>← Practice</button>
    <p class="match-hint">Tap a Korean word, then its English meaning.</p>
    <MatchGame pairs={matchData.pairs} onDone={finish} />

  {:else if stage === 'review'}
    <button class="back" on:click={reviewDone}>← Practice</button>
    <ReviewSession cards={sessionCards} onDone={reviewDone} />

  {:else if stage === 'results'}
    <div class="results">
      <div class="ring" style="--pct:{Math.round((result.correct / result.total) * 100)}">
        <span>{Math.round((result.correct / result.total) * 100)}%</span>
      </div>
      <h2>{result.correct} / {result.total} correct</h2>
      <p class="sub">{result.correct === result.total ? 'Perfect! 🎉' : 'Nice work — keep going.'}</p>
      <div class="r-actions"><button class="btn3d" on:click={reset}>Practice again</button></div>
    </div>
  {/if}
</section>

<style>
  .practice { max-width: 760px; margin: 0 auto; padding: 32px 28px; display: grid; gap: 16px; }
  .masthead { border-bottom: 1px solid var(--rule); padding-bottom: 16px; }
  .eyebrow { display: block; font-size: 11px; font-weight: 750; letter-spacing: .16em; text-transform: uppercase; color: var(--ink-3); margin-bottom: 8px; }
  h1 { margin: 0; font-size: 42px; font-weight: 850; letter-spacing: -0.03em; line-height: 1.02; }
  .sub { margin: 0; color: var(--ink-3); }

  .today { display: grid; grid-template-columns: auto auto 1fr; gap: 18px; align-items: center;
    padding: 14px 18px; border: 1px solid var(--border); border-radius: 12px; background: var(--surface); }
  .t-stat { display: grid; justify-items: center; gap: 1px; }
  .t-num { font-size: 22px; font-weight: 880; line-height: 1; }
  .t-lbl { font-size: 10px; font-weight: 750; letter-spacing: .08em; text-transform: uppercase; color: var(--ink-3); }
  .t-goal { display: grid; gap: 6px; min-width: 0; }
  .tg-top { display: flex; align-items: baseline; justify-content: space-between; gap: 10px; }
  .tg-cap { font-size: 11px; font-weight: 750; letter-spacing: .1em; text-transform: uppercase; color: var(--ink-3); }
  .tg-top strong { font-size: 15px; font-weight: 850; }
  .t-goal.met .tg-top strong { color: var(--green-dark); }
  .tg-bar { height: 10px; border-radius: 999px; background: var(--surface-2); border: 1px solid var(--border); overflow: hidden; }
  .tg-bar span { display: block; height: 100%; border-radius: 999px; background: var(--green); transition: width .4s var(--bounce); }
  @media (max-width: 520px) { .today { grid-template-columns: 1fr 1fr; } .t-goal { grid-column: 1 / -1; } }

  .review-bar { display: flex; align-items: center; justify-content: space-between; gap: 16px; flex-wrap: wrap;
    padding: 16px 18px; border: 1px solid var(--border); border-left: 4px solid var(--accent); border-radius: 10px; background: var(--surface); }
  .rb-text { display: grid; gap: 2px; }
  .rb-label { font-size: 11px; font-weight: 750; letter-spacing: .14em; text-transform: uppercase; color: var(--accent-ink); }
  .rb-text strong { font-size: 18px; }
  .rb-sub { color: var(--ink-3); font-size: 13px; max-width: 46ch; }
  .caught { font-weight: 800; color: var(--type-word); }
  .caught.muted { color: var(--ink-3); }
  .addset { justify-self: start; padding: 9px 15px; border-radius: 999px; border: 1px solid var(--border);
    background: var(--surface); color: var(--ink-2); font-weight: 750; font-size: 13px; transition: border-color .12s; }
  .addset:hover { border-color: var(--ink); }
  .deck { display: grid; gap: 6px; font-weight: 800; color: var(--ink-2); font-size: 13px; max-width: 420px; }
  .deck select { padding: 11px 13px; border-radius: 12px; border: 1px solid var(--border); background: #fff; font-size: 15px; }
  .kinds { display: flex; flex-wrap: wrap; gap: 6px; }
  .kchip { font-size: 12px; font-weight: 750; padding: 6px 12px; border-radius: 999px; background: transparent;
    color: var(--ink-2); border: 1px solid var(--border); transition: border-color .12s; }
  .kchip:hover:not(:disabled) { border-color: var(--ink-3); }
  .kchip.on { background: var(--ink); color: #fff; border-color: var(--ink); }
  .kchip:disabled { opacity: .35; }
  .warn { color: #a15c00; }
  .mode-group { display: grid; gap: 8px; }
  .group-label { font-size: 11px; font-weight: 800; letter-spacing: .14em; text-transform: uppercase; color: var(--ink-3); }
  .group-label.produce { color: var(--green-dark); }
  .modes { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
  .mode-card { display: grid; gap: 4px; padding: 22px 18px; border-radius: var(--radius); background: var(--surface);
    border: 1px solid var(--border); box-shadow: var(--shadow-1); text-align: center; transition: transform .1s var(--bounce), border-color .1s; }
  .mode-card:hover { transform: translateY(-2px); border-color: var(--green); }
  .mode-card.produce { border-left: 4px solid var(--green); }
  .mode-card.disabled { opacity: .45; pointer-events: none; }
  .m-ico { font-size: 30px; }
  .mode-card strong { font-size: 18px; }
  .mode-card span { color: var(--ink-2); font-size: 13px; }
  .back { justify-self: start; padding: 7px 14px; border-radius: 999px; background: var(--surface-2); color: var(--ink-2); font-weight: 800; }
  .match-hint { text-align: center; color: var(--ink-3); margin: 0; }
  .results { display: grid; justify-items: center; gap: 8px; padding: 24px 0; }
  .ring { width: 140px; height: 140px; border-radius: 999px; display: grid; place-items: center; font-size: 30px; font-weight: 880; color: var(--green-dark);
    background: conic-gradient(var(--green) calc(var(--pct) * 1%), var(--surface-2) 0); }
  .ring span { width: 104px; height: 104px; border-radius: 999px; background: var(--surface); display: grid; place-items: center; }
  .results h2 { margin: 4px 0 0; }
  @media (max-width: 520px) { .modes { grid-template-columns: 1fr; } }
</style>
