<script>
  import { push } from 'svelte-spa-router';

  export let mission;
  export let doneCount = 0;
  export let totalChapters = 0;
  export let onOpenChapter = () => {};

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

<section class="flow-card">
  <div class="flow-head">
    <div>
      <span class="flow-label">Study flow</span>
      <strong>Use each chapter in this order</strong>
    </div>
    <span>{doneCount}/{totalChapters} complete</span>
  </div>
  <div class="flow-steps">
    <div><b>1</b><span>Read the dialogue</span></div>
    <div><b>2</b><span>Add the chapter deck</span></div>
    <div><b>3</b><span>Practice until checked</span></div>
    <div><b>4</b><span>Review due and weak items</span></div>
    <div><b>5</b><span>Use Guide, Talk, and Chat</span></div>
  </div>
</section>

<style>
  .mission-card, .flow-card { display: grid; gap: 12px; padding: 16px 18px; border-radius: var(--radius);
    background: #fff; border: 1px solid var(--border); box-shadow: var(--shadow-1); }
  .mission-card { border-left: 4px solid #247744; }
  .flow-card { border-left: 4px solid var(--accent); }
  .mission-head, .flow-head { display: flex; align-items: center; justify-content: space-between; gap: 12px; }
  .mission-head > div, .flow-head > div { display: grid; gap: 1px; }
  .mission-label, .flow-label { font-size: 11px; font-weight: 850; letter-spacing: .14em; text-transform: uppercase; }
  .mission-label { color: #146443; }
  .flow-label { color: var(--accent-ink); }
  .mission-head strong, .flow-head strong { font-size: 18px; line-height: 1.2; }
  .mission-head > span, .flow-head > span { color: var(--ink-3); font-size: 12px; font-weight: 800; white-space: nowrap; }
  .mission-steps { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 8px; }
  .mission-step { min-height: 82px; display: grid; grid-template-columns: auto 1fr; gap: 9px; align-items: start; text-align: left;
    padding: 11px; border-radius: 12px; background: var(--surface-2); border: 1px solid var(--border); transition: transform .1s var(--bounce), border-color .12s; }
  .mission-step:hover { transform: translateY(-1px); border-color: #247744; }
  .mission-step.hot { background: #ecf7f1; border-color: rgba(36,119,68,.32); }
  .mission-step b, .flow-steps b { display: grid; place-items: center; border-radius: 999px; background: var(--ink); color: #fff; line-height: 1; }
  .mission-step b { width: 24px; height: 24px; font-size: 12px; }
  .mission-step span { display: grid; gap: 3px; }
  .mission-step strong { font-size: 13px; line-height: 1.2; }
  .mission-step em { color: var(--ink-3); font-style: normal; font-size: 12px; line-height: 1.25; }
  .flow-steps { display: grid; grid-template-columns: repeat(5, minmax(0, 1fr)); gap: 8px; }
  .flow-steps div { display: grid; grid-template-columns: auto 1fr; align-items: center; gap: 8px;
    min-height: 52px; padding: 10px; border-radius: 11px; background: var(--surface-2); border: 1px solid var(--border); }
  .flow-steps b { width: 22px; height: 22px; font-size: 12px; }
  .flow-steps span { color: var(--ink-2); font-size: 12px; font-weight: 800; line-height: 1.25; }
  @media (max-width: 720px) {
    .mission-steps { grid-template-columns: 1fr 1fr; }
    .flow-steps { grid-template-columns: 1fr; }
  }
  @media (max-width: 520px) {
    .mission-head, .flow-head { align-items: flex-start; flex-direction: column; }
    .mission-steps { grid-template-columns: 1fr; }
  }
</style>
