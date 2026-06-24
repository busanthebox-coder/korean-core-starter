<script>
  import { push } from 'svelte-spa-router';

  export let mission;
  export let onOpenChapter = () => {};
  // Kept for backward-compat with the caller; the old "Study flow" card was removed
  // (the lesson player now guides the per-chapter flow), so these are no longer rendered.
  export let doneCount = 0;
  export let totalChapters = 0;

  function act(step) {
    if (step.chapter) {
      onOpenChapter(step.chapter);
      return;
    }
    if (step.path) push(step.path);
  }
</script>

<section class="mission-card">
  <div class="mission-head">
    <div>
      <span class="mission-label">Today mission</span>
      <strong>Do these in order</strong>
    </div>
    <span>{mission?.dueCount || 0} due · {mission?.weakCount || 0} weak</span>
  </div>
  <div class="mission-steps">
    {#each mission?.steps || [] as step, i}
      <button type="button" class="mission-step" class:hot={i === 0 && (mission.dueCount || mission.weakCount)} on:click={() => act(step)}>
        <b>{i + 1}</b>
        <span><strong>{step.label}</strong><em>{step.detail}</em></span>
      </button>
    {/each}
  </div>
</section>

<style>
  .mission-card { display: grid; gap: 12px; padding: 16px 18px; border-radius: var(--radius);
    background: var(--surface); border: 1px solid var(--border); border-left: 4px solid var(--green); box-shadow: var(--shadow-1); }
  .mission-head { display: flex; align-items: center; justify-content: space-between; gap: 12px; }
  .mission-head > div { display: grid; gap: 1px; }
  .mission-label { font-size: 11px; font-weight: 850; letter-spacing: .14em; text-transform: uppercase; color: var(--green-dark); }
  .mission-head strong { font-size: 18px; line-height: 1.2; }
  .mission-head > span { color: var(--ink-3); font-size: 12px; font-weight: 800; white-space: nowrap; }
  .mission-steps { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 8px; }
  .mission-step { min-height: 82px; display: grid; grid-template-columns: auto 1fr; gap: 9px; align-items: start; text-align: left;
    padding: 11px; border-radius: 12px; background: var(--surface-2); border: 1px solid var(--border); transition: transform .1s var(--bounce), border-color .12s; }
  .mission-step:hover { transform: translateY(-1px); border-color: var(--green); }
  .mission-step.hot { background: var(--green-soft); border-color: rgba(62,142,78,.34); }
  .mission-step b { display: grid; place-items: center; width: 24px; height: 24px; font-size: 12px; border-radius: 999px; background: var(--ink); color: var(--surface); line-height: 1; }
  .mission-step span { display: grid; gap: 3px; }
  .mission-step strong { font-size: 13px; line-height: 1.2; }
  .mission-step em { color: var(--ink-3); font-style: normal; font-size: 12px; line-height: 1.25; }
  @media (max-width: 720px) { .mission-steps { grid-template-columns: 1fr 1fr; } }
  @media (max-width: 520px) {
    .mission-head { align-items: flex-start; flex-direction: column; }
    .mission-steps { grid-template-columns: 1fr; }
  }
</style>
