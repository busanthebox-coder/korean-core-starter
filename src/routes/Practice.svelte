<script>
  import { entries, chapters, findEntry } from '../lib/data.js';
  import { buildQuiz, makeMatch } from '../lib/quiz.js';
  import ExerciseHost from '../lib/components/ExerciseHost.svelte';
  import MatchGame from '../lib/components/MatchGame.svelte';
  import ReviewSession from '../lib/components/ReviewSession.svelte';
  import { reviews, dueIds } from '../lib/srs.js';

  let stage = 'setup';
  let deck = 'all';
  let questions = [];
  let matchData = null;
  let result = null;
  let sessionCards = [];
  let added = false;

  $: dueCards = dueIds($reviews).map(findEntry).filter(Boolean).slice(0, 40);
  $: deckSize = Object.keys($reviews).length;
  function startReview() { sessionCards = dueCards.slice(); stage = 'review'; window.scrollTo(0, 0); }
  function addSet() { reviews.addMany(pool.map((e) => e.id)); added = true; setTimeout(() => (added = false), 1800); }
  function reviewDone() { stage = 'setup'; window.scrollTo(0, 0); }

  const words = entries.filter((e) => e.type === 'word');
  function poolFor(d) {
    if (d === 'all') return words;
    const ch = chapters.find((c) => c.id === d);
    if (!ch) return words;
    const ids = new Set([...(ch.coreVocabularyIds || []), ...(ch.linkedEntryIds || [])]);
    return [...ids].map(findEntry).filter((e) => e && e.type === 'word');
  }
  $: pool = poolFor(deck);

  function startQuiz() { questions = buildQuiz(pool, { count: 10 }); stage = 'quiz'; window.scrollTo(0, 0); }
  function startMatch() { matchData = makeMatch(pool, Math.random, 5); stage = 'match'; window.scrollTo(0, 0); }
  function finish(r) { result = r; stage = 'results'; window.scrollTo(0, 0); }
  function reset() { stage = 'setup'; result = null; window.scrollTo(0, 0); }
</script>

<section class="practice">
  {#if stage === 'setup'}
    <header class="masthead">
      <span class="eyebrow">Study · 연습</span>
      <h1>Practice</h1>
    </header>

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
        <option value="all">All vocabulary ({words.length})</option>
        {#each chapters as c}<option value={c.id}>Ch {c.number}: {c.title}</option>{/each}
      </select>
    </label>
    <button class="addset" on:click={addSet}>{added ? '✓ Added to review' : '+ Add this set to your review deck'}</button>
    {#if pool.length < 4}
      <p class="warn">This set has only {pool.length} words — pick another set.</p>
    {:else}
      <div class="modes">
        <button class="mode-card" on:click={startQuiz}>
          <span class="m-ico">🎯</span><strong>Quiz</strong><span>10 questions · meaning, reverse & listen</span></button>
        <button class="mode-card" on:click={startMatch}>
          <span class="m-ico">🔗</span><strong>Match</strong><span>Pair 5 Korean words with their meanings</span></button>
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
  .warn { color: #a15c00; }
  .modes { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
  .mode-card { display: grid; gap: 4px; padding: 22px 18px; border-radius: var(--radius); background: var(--surface);
    border: 1px solid var(--border); box-shadow: var(--shadow-1); text-align: center; transition: transform .1s var(--bounce), border-color .1s; }
  .mode-card:hover { transform: translateY(-2px); border-color: var(--green); }
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
