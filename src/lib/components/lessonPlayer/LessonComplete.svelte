<script>
  export let doneGoal = '';
  export let doneBullets = [];
  export let canDoList = [];
  export let doneTeaser = '';
  export let done = false;
  export let nextChapter = null;
  export let onPractice = () => {};
  export let onComplete = () => {};
  export let onOpenChapter = () => {};
</script>

<div class="lp-done">
  <div class="seal-wrap"><span class="seal">독</span></div>
  <h2>Complete</h2>
  {#if doneGoal}<p class="done-goal">{doneGoal}</p>{/if}
  {#if doneBullets.length}<ul class="done-recap">{#each doneBullets as b}<li>{b}</li>{/each}</ul>{/if}
  {#if canDoList.length}
    <div class="cando">
      <span class="cando-cap">I can now…</span>
      <ul>{#each canDoList as c}<li><i class="ti ti-circle-check" aria-hidden="true"></i> {c}</li>{/each}</ul>
    </div>
  {/if}
  {#if doneTeaser}<div class="teaser">▶ {doneTeaser}</div>{/if}
  <div class="done-actions">
    <button class="btn3d" type="button" on:click={onPractice}>Practice this</button>
    <button class="ghost" type="button" aria-pressed={done} on:click={onComplete}>{done ? '✓ Marked done' : 'Mark complete'}</button>
    {#if nextChapter}
      <button class="ghost go" type="button" on:click={() => onOpenChapter(nextChapter)}>Next: {nextChapter.number ? `${nextChapter.number}. ` : ''}{nextChapter.title} →</button>
    {/if}
  </div>
</div>

<style>
  .lp-done { background: var(--surface); border: 1px solid var(--border); border-radius: var(--r-2); padding: 30px 22px;
    box-shadow: var(--shadow-1); display: grid; justify-items: center; text-align: center; gap: 10px; }
  .seal-wrap { margin-bottom: 4px; }
  .seal { display: inline-flex; align-items: center; justify-content: center; width: 64px; height: 64px; border-radius: var(--r-2);
    background: var(--primary); color: var(--primary-on); font-family: var(--serif-ko); font-weight: 700; font-size: 32px;
    transform: rotate(-4deg); box-shadow: inset 0 0 0 2px rgba(255,248,242,.35); animation: stamp .42s var(--bounce); }
  @keyframes stamp { from { opacity: 0; transform: rotate(-4deg) scale(1.5); } to { opacity: 1; transform: rotate(-4deg) scale(1); } }
  .lp-done h2 { margin: 0; font-family: var(--serif-ko); font-weight: 600; font-size: 26px; }
  .done-goal { margin: 0; color: var(--ink-2); font-size: 14px; max-width: 34ch; }
  .done-recap { text-align: left; margin: 8px 0 0; padding-left: 18px; display: grid; gap: 6px; color: var(--ink); font-size: 14px; line-height: 1.55; }
  .cando { width: 100%; text-align: left; margin-top: 14px; padding: 14px; border-radius: var(--r-1); background: var(--green-soft); }
  .cando-cap { font-size: 11px; font-weight: 850; letter-spacing: .08em; text-transform: uppercase; color: var(--green-dark); }
  .cando ul { margin: 8px 0 0; padding: 0; list-style: none; display: grid; gap: 7px; }
  .cando li { display: grid; grid-template-columns: auto 1fr; gap: 8px; font-size: 13px; line-height: 1.5; color: var(--ink); }
  .cando li :global(i) { color: var(--green); margin-top: 2px; }
  .teaser { font-size: 13px; color: var(--ink-3); }
  .done-actions { display: grid; gap: 10px; margin-top: 10px; width: 100%; max-width: 320px; }
  .ghost { padding: 12px 18px; border-radius: 999px; background: var(--surface-2); color: var(--ink-2); font-weight: 800; display: inline-flex; align-items: center; justify-content: center; gap: 6px; }
  .ghost:hover { background: var(--border); }
  .ghost.go { justify-content: center; }
  @media (prefers-reduced-motion: reduce) { .seal { animation: none; } }
</style>
