<script>
  export let plan = [];
  export let doneCount = 0;
  export let totalChapters = 0;
  export let courseMastery = { pct: 0 };
  export let streakDays = 0;
  export let orientationPending = false;
  export let onStart = () => {};
  export let onOpenOrientation = () => {};

  $: masteryPct = Number(courseMastery?.pct ?? courseMastery ?? 0);
  $: label = plan.length ? `${plan.length === 3 ? '15' : '10'} minutes for today` : 'Today is complete';
</script>

<section class="today-card" aria-labelledby="today-title">
  <div class="today-top">
    <div>
      <span class="cap">Today</span>
      <h2 id="today-title">{label}</h2>
    </div>
    <div class="stats" aria-label="Course progress">
      <span>{masteryPct}% words mastered</span>
      <span>{doneCount}/{totalChapters} chapters</span>
      <span>{streakDays} day streak</span>
    </div>
  </div>

  {#if orientationPending}
    <button class="orientation-note" type="button" on:click={onOpenOrientation}>
      New here? Take the 2-minute Korean orientation first.
    </button>
  {/if}

  {#if plan.length}
    <ol class="steps">
      {#each plan as step, index}
        <li class:active={index === 0}>
          <span>{index + 1}</span>
          <strong>{step.label}</strong>
        </li>
      {/each}
    </ol>
    <button class="btn3d start" type="button" on:click={onStart}>
      Start <i class="ti ti-arrow-right" aria-hidden="true"></i>
    </button>
  {:else}
    <p class="complete">Nice work. Your next study session will appear here.</p>
  {/if}

  <div class="mastery"><span style={`width:${masteryPct}%`}></span></div>
</section>

<style>
  .today-card { display: grid; gap: 15px; padding: 20px; border-radius: var(--r-2); border: 1px solid rgba(232,85,46,.3); border-left: 5px solid var(--primary); background: linear-gradient(145deg, #fff 0%, #fffaf4 100%); box-shadow: var(--shadow-2); }
  .today-top { display: flex; align-items: start; justify-content: space-between; gap: 14px; }
  .cap { display: block; color: var(--accent-ink); font-size: 11px; font-weight: 850; letter-spacing: .14em; text-transform: uppercase; }
  h2 { margin: 5px 0 0; font-family: var(--serif-ko); font-size: 27px; font-weight: 600; line-height: 1.1; }
  .stats { display: grid; gap: 3px; text-align: right; color: var(--ink-3); font-size: 11px; font-weight: 800; white-space: nowrap; }
  .orientation-note { justify-self: start; padding: 0; color: var(--green-dark); font-size: 12px; font-weight: 800; text-decoration: underline; text-decoration-color: rgba(36,119,68,.35); text-underline-offset: 3px; }
  .steps { margin: 0; padding: 0; list-style: none; display: grid; gap: 8px; }
  .steps li { display: grid; grid-template-columns: 26px minmax(0, 1fr); align-items: center; gap: 9px; color: var(--ink-2); font-size: 14px; }
  .steps li > span { display: grid; place-items: center; width: 25px; height: 25px; border-radius: 999px; background: var(--surface-2); border: 1px solid var(--border); color: var(--ink-3); font-size: 11px; font-weight: 900; }
  .steps li.active { color: var(--ink); }
  .steps li.active > span { background: var(--primary); border-color: var(--primary); color: var(--primary-on); }
  .steps strong { font-size: 14px; line-height: 1.35; }
  .start { width: 100%; justify-content: center; min-height: 48px; }
  .complete { margin: 0; color: var(--ink-2); font-size: 14px; }
  .mastery { height: 5px; overflow: hidden; border-radius: 999px; background: var(--surface-2); border: 1px solid var(--border); }
  .mastery span { display: block; height: 100%; border-radius: inherit; background: var(--green); transition: width .25s var(--ease); }
  @media (max-width: 520px) { .today-top { align-items: start; } .stats { display: none; } }
</style>
