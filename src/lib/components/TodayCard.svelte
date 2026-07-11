<script>
  export let plan = [];
  export let doneCount = 0;
  export let totalChapters = 0;
  export let courseMastery = { pct: 0 };
  export let orientationPending = false;
  export let onStart = () => {};
  export let onOpenOrientation = () => {};

  $: masteryPct = Number(courseMastery?.pct ?? courseMastery ?? 0);
  $: label = plan.length ? `${plan.length === 3 ? '15' : '10'} minutes for today` : 'Today is complete';
  $: currentStep = plan[0] || null;
</script>

<section class="today-card" aria-labelledby="today-title">
  <div class="today-top">
    <div>
      <span class="cap">Today</span>
      <h2 id="today-title">{label}</h2>
    </div>
    <span class="chapter-progress" aria-label="Course progress">{doneCount}/{totalChapters} chapters</span>
  </div>

  {#if orientationPending}
    <button class="orientation-note" type="button" on:click={onOpenOrientation}>
      New here? Take the 5-minute Korean orientation first.
    </button>
  {/if}

  {#if currentStep}
    <div class="current-task">
      <span>Next up</span>
      <strong>{currentStep.label}</strong>
    </div>
    <button class="btn3d start" type="button" on:click={onStart}>
      Start now <i class="ti ti-arrow-right" aria-hidden="true"></i>
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
  .chapter-progress { color: var(--ink-2); font-size: 12px; font-weight: 800; white-space: nowrap; }
  .orientation-note { justify-self: start; padding: 0; color: var(--green-dark); font-size: 12px; font-weight: 800; text-decoration: underline; text-decoration-color: rgba(36,119,68,.35); text-underline-offset: 3px; }
  .current-task { display: grid; gap: 2px; padding: 13px 14px; border-left: 3px solid var(--primary); background: var(--primary-wash); }
  .current-task span { color: var(--accent-ink); font-size: 10px; font-weight: 850; letter-spacing: .12em; text-transform: uppercase; }
  .current-task strong { font-size: 15px; line-height: 1.35; }
  .start { width: 100%; justify-content: center; min-height: 48px; }
  .complete { margin: 0; color: var(--ink-2); font-size: 14px; }
  .mastery { height: 5px; overflow: hidden; border-radius: 999px; background: var(--surface-2); border: 1px solid var(--border); }
  .mastery span { display: block; height: 100%; border-radius: inherit; background: var(--green); transition: width .25s var(--ease); }
  @media (max-width: 520px) { .today-top { align-items: start; } }
</style>
