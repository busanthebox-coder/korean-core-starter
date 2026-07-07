<script>
  import PracticeContrastPicker from './PracticeContrastPicker.svelte';

  export let entries = [];
  export let chapters = [];
  export let dueCards = [];
  export let deckSize = 0;
  export let weakItems = [];
  export let deck = 'all';
  export let kind = 'all';
  export let kindOptions = [];
  export let kindCounts = {};
  export let focusCount = 0;
  export let focusLabel = 'Focused items';
  export let poolLength = 0;
  export let learned = 0;
  export let streakDays = 0;
  export let todayN = 0;
  export let goal = 0;
  export let added = false;
  export let canRecognize = false;
  export let canBuild = false;
  export let canConjugate = false;
  export let conjugationFormOptions = [];
  export let conjugationLevelOptions = ['all'];
  export let conjugationCount = 0;
  export let contrastLevelOptions = ['all'];
  export let contrastCount = 0;
  export let conjugationForms = [];
  export let conjugationLevel = 'all';
  export let contrastLevel = 'all';
  export let onStartReview = () => {};
  export let onSelectWeak = () => {};
  export let onClearWeak = () => {};
  export let onAddSet = () => {};
  export let onStartQuiz = () => {};
  export let onStartMatch = () => {};
  export let onStartWrite = () => {};
  export let onStartBuild = () => {};
  export let onStartContrast = () => {};
  export let onStartConjugation = () => {};

  function toggleConjugationForm(key) {
    if (conjugationForms.includes(key)) {
      if (conjugationForms.length === 1) return;
      conjugationForms = conjugationForms.filter((form) => form !== key);
      return;
    }
    conjugationForms = [...conjugationForms, key];
  }

  $: goalPct = Math.min(100, goal ? Math.round((todayN / goal) * 100) : 0);
  // One clear recommendation: clear your due reviews first, otherwise a quick quiz.
  $: rec = dueCards.length
    ? { kind: 'review', label: `Review ${dueCards.length} due`, sub: 'Spaced reviews bring each word back right before you would forget it.', cta: `Review ${dueCards.length}`, run: onStartReview, on: true }
    : { kind: 'quiz', label: 'Quick quiz', sub: deckSize ? 'All caught up on reviews — keep them sharp with a 10-question quiz.' : 'Start with a 10-question quiz, then build your review deck below.', cta: 'Start quiz', run: onStartQuiz, on: canRecognize };
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

<!-- ── ONE recommended action ─────────────────────────────────────────────── -->
<div class="recommend">
  <div class="rec-text">
    <span class="rec-label">Do this now</span>
    <strong>{rec.label}</strong>
    <span class="rec-sub">{rec.sub}</span>
  </div>
  <button class="btn3d rec-go" type="button" disabled={!rec.on} on:click={rec.run}>
    {rec.cta} <i class="ti ti-arrow-right" aria-hidden="true"></i>
  </button>
</div>

{#if weakItems.length}
  <div class="weak-bar">
    <div class="wb-text">
      <span class="wb-label"><i class="ti ti-alert-triangle" aria-hidden="true"></i> Mistake bank</span>
      <strong>{weakItems.length} weak item{weakItems.length === 1 ? '' : 's'}</strong>
      <span class="wb-sub">Missed words stay here until you get them right.</span>
    </div>
    <div class="wb-actions">
      <button class="ghost-btn" type="button" on:click={onSelectWeak}>Practice weak</button>
      <button class="mini-clear" type="button" on:click={onClearWeak}>Clear</button>
    </div>
  </div>
{/if}

<!-- ── everything else, tucked away ───────────────────────────────────────── -->
<details class="more">
  <summary><span><i class="ti ti-adjustments-horizontal" aria-hidden="true"></i> Choose what to practice</span><i class="ti ti-chevron-down chev" aria-hidden="true"></i></summary>

  <div class="more-body">
    <label class="deck">Set
      <select bind:value={deck}>
        <option value="all">Everything ({entries.length})</option>
        {#if focusCount}<option value="__focus">{focusLabel} ({focusCount})</option>{/if}
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

    <button class="addset" type="button" on:click={onAddSet}>{added ? '✓ Added to review' : `Add these ${poolLength} to your review deck`}</button>

    <PracticeContrastPicker {contrastLevelOptions} {contrastCount} bind:contrastLevel />

    <div class="conj-picker">
      <div class="conj-head">
        <strong>Conjugation trainer</strong>
        <span>{conjugationCount} verb{conjugationCount === 1 ? '' : 's'} ready</span>
      </div>
      <div class="conj-row">
        <label class="level-select">Level
          <select bind:value={conjugationLevel}>
            {#each conjugationLevelOptions as level}
              <option value={level}>{level === 'all' ? 'All levels' : level}</option>
            {/each}
          </select>
        </label>
        <div class="formchips" aria-label="Conjugation forms">
          {#each conjugationFormOptions as form}
            <button class="formchip" type="button" class:on={conjugationForms.includes(form.key)} on:click={() => toggleConjugationForm(form.key)}>
              <span>{form.ko}</span><small>{form.en}</small>
            </button>
          {/each}
        </div>
      </div>
    </div>

    {#if !poolLength && !canConjugate}
      <p class="warn">This set has no practice items yet. Pick another set or kind.</p>
    {:else}
      {#if !canRecognize}<p class="warn">Quiz and Match need at least 4 items.</p>{/if}
      <div class="modes-grid">
        <button class="mode-card" type="button" disabled={!canRecognize} on:click={onStartQuiz}>
          <i class="ti ti-list-check" aria-hidden="true"></i><strong>Quiz</strong><span>Meaning, reverse & listen</span>
        </button>
        <button class="mode-card" type="button" disabled={!canRecognize} on:click={onStartMatch}>
          <i class="ti ti-cards" aria-hidden="true"></i><strong>Match</strong><span>Pair words with meanings</span>
        </button>
        <button class="mode-card" type="button" on:click={onStartWrite}>
          <i class="ti ti-pencil" aria-hidden="true"></i><strong>Write</strong><span>Type the Korean word</span>
        </button>
        <button class="mode-card" type="button" disabled={!canBuild} on:click={onStartBuild}>
          <i class="ti ti-puzzle" aria-hidden="true"></i><strong>Build</strong><span>Arrange a sentence</span>
        </button>
        <button class="mode-card wide" type="button" on:click={onStartContrast}>
          <i class="ti ti-arrows-left-right" aria-hidden="true"></i><strong>Contrast Lab</strong><span>Tell similar patterns apart</span>
        </button>
        <button class="mode-card wide" type="button" disabled={!canConjugate} on:click={onStartConjugation}>
          <i class="ti ti-repeat" aria-hidden="true"></i><strong>Conjugate</strong><span>Turn verbs into usable Korean forms</span>
        </button>
      </div>
    {/if}
  </div>
</details>

<style>
  .masthead { min-width: 0; border-bottom: 1px solid var(--rule); padding-bottom: 16px; }
  .eyebrow { display: block; font-size: 11px; font-weight: 750; letter-spacing: .16em; text-transform: uppercase; color: var(--ink-3); margin-bottom: 8px; }
  h1 { margin: 0; font-family: var(--serif-ko); font-size: 38px; font-weight: 600; letter-spacing: -0.02em; line-height: 1.04; }

  .today { min-width: 0; display: grid; grid-template-columns: auto auto 1fr; gap: 18px; align-items: center;
    padding: 14px 18px; border: 1px solid var(--border); border-radius: var(--r-1); background: var(--surface); box-shadow: var(--shadow-1); }
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

  .recommend { min-width: 0; display: flex; align-items: center; justify-content: space-between; gap: 16px; flex-wrap: wrap;
    padding: 18px 20px; border: 1px solid var(--border); border-left: 4px solid var(--primary); border-radius: var(--r-1);
    background: var(--surface); box-shadow: var(--shadow-1); }
  .rec-text { display: grid; gap: 3px; }
  .rec-label { font-size: 11px; font-weight: 750; letter-spacing: .14em; text-transform: uppercase; color: var(--accent-ink); }
  .rec-text strong { font-size: 20px; }
  .rec-sub { color: var(--ink-3); font-size: 13px; max-width: 48ch; }

  .weak-bar { min-width: 0; display: flex; align-items: center; justify-content: space-between; gap: 16px; flex-wrap: wrap;
    padding: 14px 18px; border: 1px solid var(--danger-soft); border-left: 4px solid var(--danger); border-radius: var(--r-1); background: var(--danger-soft); }
  .wb-text { display: grid; gap: 2px; }
  .wb-label { font-size: 11px; font-weight: 750; letter-spacing: .12em; text-transform: uppercase; color: var(--danger); }
  .wb-text strong { font-size: 17px; }
  .wb-sub { color: var(--ink-3); font-size: 13px; }
  .wb-actions { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
  .ghost-btn { padding: 9px 15px; border-radius: 999px; border: 1px solid var(--border-2); background: var(--surface); color: var(--ink); font-size: 13px; font-weight: 800; }
  .ghost-btn:hover { border-color: var(--ink-3); }
  .mini-clear { padding: 8px 12px; border-radius: 999px; border: 1px solid var(--border); background: var(--surface); color: var(--ink-3); font-size: 12px; font-weight: 800; }
  .mini-clear:hover { color: var(--danger); border-color: var(--danger); }

  .more { min-width: 0; border: 1px solid var(--border); border-radius: var(--r-1); background: var(--surface); box-shadow: var(--shadow-1); }
  .more > summary { cursor: pointer; list-style: none; display: flex; align-items: center; justify-content: space-between;
    padding: 15px 18px; font-weight: 800; color: var(--ink); }
  .more > summary::-webkit-details-marker { display: none; }
  .more .chev { color: var(--ink-3); transition: transform .2s; }
  .more[open] .chev { transform: rotate(180deg); }
  .more-body { min-width: 0; display: grid; gap: 12px; padding: 4px 18px 18px; }

  .deck { min-width: 0; display: grid; gap: 6px; font-weight: 800; color: var(--ink-2); font-size: 13px; max-width: 420px; }
  .deck select { width: 100%; min-width: 0; padding: 11px 13px; border-radius: var(--r-1); border: 1px solid var(--border); background: #fff; font: inherit; font-size: 15px; }
  .kinds { display: flex; flex-wrap: wrap; gap: 6px; }
  .kchip { font-size: 12px; font-weight: 750; padding: 6px 12px; border-radius: 999px; background: transparent;
    color: var(--ink-2); border: 1px solid var(--border); transition: border-color .12s; }
  .kchip:hover:not(:disabled) { border-color: var(--ink-3); }
  .kchip.on { background: var(--primary); color: var(--primary-on); border-color: var(--primary); }
  .kchip:disabled { opacity: .35; }
  .addset { justify-self: start; padding: 9px 15px; border-radius: 999px; border: 1px solid var(--border);
    background: var(--surface); color: var(--ink-2); font-weight: 750; font-size: 13px; transition: border-color .12s; }
  .addset:hover { border-color: var(--ink); }
  .warn { color: #a15c00; margin: 0; font-size: 13px; }
  .conj-picker { min-width: 0; display: grid; gap: 10px; padding: 12px; border: 1px solid var(--border); border-radius: var(--r-1); background: var(--surface-2); }
  .conj-head { display: flex; align-items: baseline; justify-content: space-between; gap: 12px; flex-wrap: wrap; }
  .conj-head strong { font-size: 14px; }
  .conj-head span { color: var(--ink-3); font-size: 12px; font-weight: 750; }
  .conj-row { display: grid; gap: 10px; }
  .level-select { display: grid; gap: 5px; font-size: 12px; font-weight: 850; color: var(--ink-2); max-width: 180px; }
  .level-select select { width: 100%; min-width: 0; padding: 8px 10px; border-radius: var(--r-1); border: 1px solid var(--border); background: #fff; font: inherit; font-size: 13px; }
  .formchips { display: flex; flex-wrap: wrap; gap: 6px; }
  .formchip { display: inline-grid; gap: 1px; text-align: left; padding: 7px 10px; border-radius: 999px; border: 1px solid var(--border); background: #fff; color: var(--ink-2); }
  .formchip span { font-size: 12px; font-weight: 850; }
  .formchip small { font-size: 10px; color: var(--ink-3); }
  .formchip.on { background: var(--primary); border-color: var(--primary); color: var(--primary-on); }
  .formchip.on small { color: rgba(255,255,255,.78); }

  .modes-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
  .mode-card { display: grid; gap: 3px; padding: 16px 14px; border-radius: var(--r-1); background: var(--surface);
    border: 1px solid var(--border); text-align: center; justify-items: center; transition: transform .1s var(--bounce), border-color .1s; }
  .mode-card:hover:not(:disabled) { transform: translateY(-2px); border-color: var(--primary); }
  .mode-card:disabled { opacity: .4; pointer-events: none; }
  .mode-card.wide { grid-column: 1 / -1; }
  .mode-card i { font-size: 22px; color: var(--accent-ink); }
  .mode-card strong { font-size: 16px; }
  .mode-card span { color: var(--ink-3); font-size: 12px; }

  @media (max-width: 520px) {
    .today { grid-template-columns: 1fr 1fr; }
    .t-goal { grid-column: 1 / -1; }
    .level-select { max-width: none; }
    .modes-grid { grid-template-columns: 1fr; }
    .mode-card.wide { grid-column: auto; }
  }
</style>
