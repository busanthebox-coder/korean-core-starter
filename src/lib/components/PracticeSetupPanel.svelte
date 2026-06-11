<script>
  export let entries = [];
  export let chapters = [];
  export let dueCards = [];
  export let deckSize = 0;
  export let weakItems = [];
  export let deck = 'all';
  export let kind = 'all';
  export let kindOptions = [];
  export let kindCounts = {};
  export let poolLength = 0;
  export let learned = 0;
  export let streakDays = 0;
  export let todayN = 0;
  export let goal = 0;
  export let added = false;
  export let canRecognize = false;
  export let canBuild = false;
  export let onStartReview = () => {};
  export let onSelectWeak = () => {};
  export let onClearWeak = () => {};
  export let onAddSet = () => {};
  export let onStartQuiz = () => {};
  export let onStartMatch = () => {};
  export let onStartWrite = () => {};
  export let onStartBuild = () => {};
  export let onStartContrast = () => {};

  $: goalPct = Math.min(100, goal ? Math.round((todayN / goal) * 100) : 0);
</script>

<header class="masthead">
  <span class="eyebrow">Study · 연습</span>
  <h1>Practice</h1>
</header>

<div class="today">
  <div class="t-stat"><span class="t-num">{streakDays}</span><span class="t-lbl">day streak</span></div>
  <div class="t-stat"><span class="t-num">{learned}</span><span class="t-lbl">mastered</span></div>
  <div class="t-goal" class:met={todayN >= goal}>
    <div class="tg-top"><span class="tg-cap">Today's goal</span><strong>{todayN}/{goal}{#if todayN >= goal} done{/if}</strong></div>
    <div class="tg-bar"><span style="width:{goalPct}%"></span></div>
  </div>
</div>

<div class="review-bar">
  <div class="rb-text">
    <span class="rb-label">Spaced review</span>
    <strong>{dueCards.length} due{deckSize ? ` · ${deckSize} in your deck` : ''}</strong>
    <span class="rb-sub">Reviews come back on a forgetting-curve schedule so words actually stick.</span>
  </div>
  {#if dueCards.length}
    <button class="btn3d" type="button" on:click={onStartReview}>Review {dueCards.length}</button>
  {:else if deckSize}
    <span class="caught">All caught up</span>
  {:else}
    <span class="caught muted">Add a set below</span>
  {/if}
</div>

{#if weakItems.length}
  <div class="weak-bar">
    <div class="wb-text">
      <span class="wb-label">Mistake bank</span>
      <strong>{weakItems.length} weak item{weakItems.length === 1 ? '' : 's'}</strong>
      <span class="wb-sub">Missed words and patterns stay here until you practice them correctly.</span>
    </div>
    <div class="wb-actions">
      <button class="btn3d" type="button" on:click={onSelectWeak}>Practice weak items</button>
      <button class="mini-clear" type="button" on:click={onClearWeak}>Clear</button>
    </div>
  </div>
{/if}

<label class="deck">Set
  <select bind:value={deck}>
    <option value="all">Everything ({entries.length})</option>
    {#if weakItems.length}<option value="__weak">Weak items ({weakItems.length})</option>{/if}
    {#each chapters as chapter}<option value={chapter.id}>Ch {chapter.number}: {chapter.title}</option>{/each}
  </select>
</label>

<div class="kinds">
  {#each kindOptions as [value, label]}
    <button class="kchip" type="button" class:on={kind === value} disabled={kindCounts[value] === 0} on:click={() => (kind = value)}>
      {label} · {kindCounts[value]}
    </button>
  {/each}
</div>

<button class="addset" type="button" on:click={onAddSet}>{added ? 'Added to review' : `Add these ${poolLength} to your review deck`}</button>

{#if !poolLength}
  <p class="warn">This set has no practice items yet. Pick another set or kind.</p>
{:else}
  {#if !canRecognize}
    <p class="warn">Quiz and Match need at least 4 items. Use Write or add more missed items.</p>
  {/if}

  <div class="mode-group">
    <span class="group-label">Recognize · 알아보기</span>
    <div class="modes">
      <button class="mode-card" type="button" class:disabled={!canRecognize} disabled={!canRecognize} on:click={onStartQuiz}>
        <span class="m-ico">Target</span><strong>Quiz</strong><span>10 questions · meaning, reverse and listen</span>
      </button>
      <button class="mode-card" type="button" class:disabled={!canRecognize} disabled={!canRecognize} on:click={onStartMatch}>
        <span class="m-ico">Pair</span><strong>Match</strong><span>Pair 5 Korean words with their meanings</span>
      </button>
    </div>
  </div>

  <div class="mode-group">
    <span class="group-label produce">Produce · 직접 만들기</span>
    <div class="modes">
      <button class="mode-card produce" type="button" on:click={onStartWrite}>
        <span class="m-ico">Write</span><strong>Write</strong><span>See the meaning, type the Korean word</span>
      </button>
      <button class="mode-card produce" type="button" class:disabled={!canBuild} disabled={!canBuild} on:click={onStartBuild}>
        <span class="m-ico">Build</span><strong>Build</strong><span>Arrange the words into a real sentence</span>
      </button>
    </div>
  </div>

  <div class="mode-group">
    <span class="group-label contrast">Pattern Lab · 문법 구분</span>
    <div class="modes single">
      <button class="mode-card contrast" type="button" on:click={onStartContrast}>
        <span class="m-ico">Lab</span><strong>Contrast Lab</strong><span>Choose between similar Korean patterns and learn why</span>
      </button>
    </div>
  </div>
{/if}

<style>
  .masthead { border-bottom: 1px solid var(--rule); padding-bottom: 16px; }
  .eyebrow { display: block; font-size: 11px; font-weight: 750; letter-spacing: .16em; text-transform: uppercase; color: var(--ink-3); margin-bottom: 8px; }
  h1 { margin: 0; font-size: 42px; font-weight: 850; letter-spacing: -0.03em; line-height: 1.02; }
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
  .review-bar { display: flex; align-items: center; justify-content: space-between; gap: 16px; flex-wrap: wrap;
    padding: 16px 18px; border: 1px solid var(--border); border-left: 4px solid var(--accent); border-radius: 10px; background: var(--surface); }
  .rb-text { display: grid; gap: 2px; }
  .rb-label { font-size: 11px; font-weight: 750; letter-spacing: .14em; text-transform: uppercase; color: var(--accent-ink); }
  .rb-text strong { font-size: 18px; }
  .rb-sub { color: var(--ink-3); font-size: 13px; max-width: 46ch; }
  .caught { font-weight: 800; color: var(--type-word); }
  .caught.muted { color: var(--ink-3); }
  .weak-bar { display: flex; align-items: center; justify-content: space-between; gap: 16px; flex-wrap: wrap;
    padding: 16px 18px; border: 1px solid #ffd8c8; border-left: 4px solid #e45f35; border-radius: 10px; background: #fff8f4; }
  .wb-text { display: grid; gap: 2px; }
  .wb-label { font-size: 11px; font-weight: 750; letter-spacing: .14em; text-transform: uppercase; color: #b5411f; }
  .wb-text strong { font-size: 18px; }
  .wb-sub { color: var(--ink-3); font-size: 13px; max-width: 46ch; }
  .wb-actions { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
  .mini-clear { padding: 8px 12px; border-radius: 999px; border: 1px solid #ffd8c8; background: #fff; color: #8b4b37; font-size: 12px; font-weight: 800; }
  .mini-clear:hover { border-color: #e45f35; color: #b5411f; }
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
  .group-label.contrast { color: var(--type-pattern); }
  .modes { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
  .modes.single { grid-template-columns: 1fr; }
  .mode-card { display: grid; gap: 4px; padding: 22px 18px; border-radius: var(--radius); background: var(--surface);
    border: 1px solid var(--border); box-shadow: var(--shadow-1); text-align: center; transition: transform .1s var(--bounce), border-color .1s; }
  .mode-card:hover { transform: translateY(-2px); border-color: var(--green); }
  .mode-card.produce { border-left: 4px solid var(--green); }
  .mode-card.contrast { border-left: 4px solid var(--type-pattern); }
  .mode-card.contrast:hover { border-color: var(--type-pattern); }
  .mode-card.disabled { opacity: .45; pointer-events: none; }
  .m-ico { font-size: 13px; font-weight: 850; letter-spacing: .08em; text-transform: uppercase; color: var(--ink-3); }
  .mode-card strong { font-size: 18px; }
  .mode-card span { color: var(--ink-2); font-size: 13px; }
  @media (max-width: 520px) {
    .today { grid-template-columns: 1fr 1fr; }
    .t-goal { grid-column: 1 / -1; }
    .modes { grid-template-columns: 1fr; }
  }
</style>
