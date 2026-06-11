<script>
  import { onMount } from 'svelte';
  import { entries, chapters, findEntry } from '../lib/data.js';
  import { buildQuiz, makeMatch, buildWriteQuiz, buildSentenceQuiz } from '../lib/quiz.js';
  import ExerciseHost from '../lib/components/ExerciseHost.svelte';
  import MatchGame from '../lib/components/MatchGame.svelte';
  import PatternContrastSession from '../lib/components/PatternContrastSession.svelte';
  import PracticeRecoveryPanel from '../lib/components/PracticeRecoveryPanel.svelte';
  import PracticeSetupPanel from '../lib/components/PracticeSetupPanel.svelte';
  import ReviewSession from '../lib/components/ReviewSession.svelte';
  import { reviews, dueIds, summarize } from '../lib/srs.js';
  import { study, streak, todayCount, goalOf } from '../lib/progress.js';
  import { mistakes, sortedMistakeIds } from '../lib/mistakes.js';
  import { buildContrastQuiz } from '../lib/patternContrast.js';
  import { markLessonPracticed } from '../lib/stores.js';
  import { push } from 'svelte-spa-router';

  const WEAK_DECK = '__weak';

  let stage = 'setup';
  let deck = 'all';
  let questions = [];
  let matchData = null;
  let result = null;
  let sessionCards = [];
  let contrastQuestions = [];
  let added = false;

  function syncDeckFromUrl() {
    const query = (window.location.hash.split('?')[1] || '').split('#')[0];
    const requested = new URLSearchParams(query).get('deck');
    if (requested === WEAK_DECK || chapters.some((c) => c.id === requested)) deck = requested;
  }

  onMount(() => {
    syncDeckFromUrl();
    window.addEventListener('hashchange', syncDeckFromUrl);
    return () => window.removeEventListener('hashchange', syncDeckFromUrl);
  });

  $: dueCards = dueIds($reviews).map(findEntry).filter(Boolean).slice(0, 40);
  $: weakIds = sortedMistakeIds($mistakes);
  $: weakItems = weakIds.map(findEntry).filter(Boolean);
  $: deckSize = Object.keys($reviews).length;
  $: sum = summarize($reviews);
  $: streakDays = streak($study);
  $: todayN = todayCount($study);
  $: goal = goalOf($study);
  function startReview() { sessionCards = dueCards.slice(); stage = 'review'; window.scrollTo(0, 0); }
  function selectWeak() { deck = WEAK_DECK; kind = 'all'; window.scrollTo(0, 0); }
  function clearWeak() { mistakes.clearAll(); if (deck === WEAK_DECK) deck = 'all'; }
  function addSet() { reviews.addMany(pool.map((e) => e.id)); added = true; setTimeout(() => (added = false), 1800); }
  // ReviewSession passes {reviewed}; the back button passes a click event (no log).
  function reviewDone(e) { if (e && e.reviewed) study.log(e.reviewed); stage = 'setup'; window.scrollTo(0, 0); }

  // Practice covers ALL learnable items — words, expressions and patterns —
  // not just vocabulary. `kind` narrows the active set by type.
  const KINDS = [['all', 'All'], ['word', 'Words'], ['expression', 'Expressions'], ['pattern', 'Patterns']];
  let kind = 'all';
  const isChapterDeck = (d) => chapters.some((c) => c.id === d);
  function deckItems(d) {
    if (d === WEAK_DECK) return weakItems;
    if (d === 'all') return entries;
    const ch = chapters.find((c) => c.id === d);
    if (!ch) return entries;
    const ids = new Set([...(ch.coreVocabularyIds || []), ...(ch.linkedEntryIds || []), ...(ch.patternIds || [])]);
    return [...ids].map(findEntry).filter(Boolean);
  }
  $: base = deckItems(deck);
  $: pool = kind === 'all' ? base : base.filter((e) => e.type === kind);
  $: deckLabel = deck === WEAK_DECK
    ? 'weak items'
    : deck === 'all'
      ? 'Everything'
      : `Ch ${chapters.find((c) => c.id === deck)?.number || ''}`.trim();
  $: kindCounts = {
    all: base.length,
    word: base.filter((e) => e.type === 'word').length,
    expression: base.filter((e) => e.type === 'expression').length,
    pattern: base.filter((e) => e.type === 'pattern').length,
  };
  $: canRecognize = pool.length >= 4;

  function startQuiz() { questions = buildQuiz(pool, { count: 10 }); stage = 'quiz'; window.scrollTo(0, 0); }
  function startWrite() { questions = buildWriteQuiz(pool, { count: 8 }); stage = 'quiz'; window.scrollTo(0, 0); }
  function startBuild() { questions = buildSentenceQuiz(pool, { count: 6 }); stage = 'quiz'; window.scrollTo(0, 0); }
  function startMatch() { matchData = makeMatch(pool, Math.random, 5); stage = 'match'; window.scrollTo(0, 0); }
  function startContrast() { contrastQuestions = buildContrastQuiz({ count: 8 }); stage = 'contrast'; window.scrollTo(0, 0); }
  $: canBuild = pool.some((e) => (e.examples || []).some((x) => x.ko && x.ko.trim().split(/\s+/).length >= 2));
  function startWeakPractice() {
    const weakPool = weakItems.slice();
    if (!weakPool.length) { reset(); return; }
    deck = WEAK_DECK;
    kind = 'all';
    questions = weakPool.length >= 4
      ? buildQuiz(weakPool, { count: 10 })
      : buildWriteQuiz(weakPool, { count: Math.min(8, weakPool.length) });
    stage = 'quiz';
    window.scrollTo(0, 0);
  }
  function finish(r) {
    result = r;
    if (r && r.total) study.log(r.total);
    if (r && r.total && isChapterDeck(deck)) markLessonPracticed(deck);
    if (r?.wrongIds?.length) mistakes.record(r.wrongIds);
    if (deck === WEAK_DECK && r?.correctIds?.length) {
      const stillWrong = new Set(r.wrongIds || []);
      mistakes.resolve(r.correctIds.filter((id) => !stillWrong.has(id)));
    }
    stage = 'results';
    window.scrollTo(0, 0);
  }
  function reset() { stage = 'setup'; result = null; window.scrollTo(0, 0); }
</script>

<section class="practice">
  {#if stage === 'setup'}
    <PracticeSetupPanel
      {entries}
      {chapters}
      {dueCards}
      {deckSize}
      {weakItems}
      bind:deck
      bind:kind
      kindOptions={KINDS}
      {kindCounts}
      poolLength={pool.length}
      learned={sum.learned}
      {streakDays}
      {todayN}
      {goal}
      {added}
      {canRecognize}
      {canBuild}
      onStartReview={startReview}
      onSelectWeak={selectWeak}
      onClearWeak={clearWeak}
      onAddSet={addSet}
      onStartQuiz={startQuiz}
      onStartMatch={startMatch}
      onStartWrite={startWrite}
      onStartBuild={startBuild}
      onStartContrast={startContrast}
    />

  {:else if stage === 'quiz'}
    <button class="back" on:click={reset}>← Practice</button>
    <ExerciseHost {questions} onDone={finish} />

  {:else if stage === 'match'}
    <button class="back" on:click={reset}>← Practice</button>
    <p class="match-hint">Tap a Korean word, then its English meaning.</p>
    <MatchGame pairs={matchData.pairs} onDone={finish} />

  {:else if stage === 'contrast'}
    <button class="back" on:click={reset}>← Practice</button>
    <PatternContrastSession items={contrastQuestions} onDone={finish} />

  {:else if stage === 'review'}
    <button class="back" on:click={reviewDone}>← Practice</button>
    <ReviewSession cards={sessionCards} onDone={reviewDone} />

  {:else if stage === 'results'}
    <PracticeRecoveryPanel
      {result}
      {weakItems}
      dueCount={dueCards.length}
      {deckLabel}
      onPracticeAgain={reset}
      onPracticeWeak={startWeakPractice}
      onReviewDue={startReview}
      onBackToLearn={() => push('/learn')}
    />
  {/if}
</section>

<style>
  .practice { max-width: 760px; margin: 0 auto; padding: 32px 28px; display: grid; gap: 16px; }
  .back { justify-self: start; padding: 7px 14px; border-radius: 999px; background: var(--surface-2); color: var(--ink-2); font-weight: 800; }
  .match-hint { text-align: center; color: var(--ink-3); margin: 0; }
</style>
