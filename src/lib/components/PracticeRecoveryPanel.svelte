<script>
  export let result = { correct: 0, total: 0 };
  export let weakItems = [];
  export let dueCount = 0;
  export let deckLabel = 'this set';
  export let onPracticeAgain = () => {};
  export let onPracticeWeak = () => {};
  export let onReviewDue = () => {};
  export let onBackToLearn = () => {};
  export let onStudyItem = () => {};

  $: total = result?.total || 0;
  $: correct = result?.correct || 0;
  $: percent = total ? Math.round((correct / total) * 100) : 0;
  $: missed = Math.max(0, total - correct);
  $: needsRecovery = missed > 0 && weakItems.length > 0;
  $: previewItems = weakItems.slice(0, 3);
  $: primaryLabel = needsRecovery
    ? `Practice weak items (${weakItems.length})`
    : dueCount
      ? `Review ${dueCount} due`
      : 'Practice again';

  function takePrimary() {
    if (needsRecovery) {
      onPracticeWeak();
      return;
    }
    if (dueCount) {
      onReviewDue();
      return;
    }
    onPracticeAgain();
  }
</script>

<div class="results">
  <div class="ring" style="--pct:{percent}">
    <span>{percent}%</span>
  </div>
  <h2>{correct} / {total} correct</h2>
  <p class="sub">{missed ? `${missed} item${missed === 1 ? '' : 's'} need one more pass.` : 'Clean session. Move the memory into review.'}</p>

  <section class="recovery">
    <div class="rec-head">
      <span>Next step</span>
      <strong>{needsRecovery ? 'Fix the missed items first' : 'Lock it in with review'}</strong>
    </div>

    {#if needsRecovery}
      <p>Work the mistake bank before starting new material. These items stay there until you answer them correctly.</p>
      <div class="weak-list" aria-label="Weak items to review">
        {#each previewItems as item}
          <span><b>{item.hangul}</b>{item.english}<button type="button" on:click={() => onStudyItem(item)} aria-label="Study {item.hangul}">Study</button></span>
        {/each}
        {#if weakItems.length > previewItems.length}
          <span class="more">+{weakItems.length - previewItems.length} more</span>
        {/if}
      </div>
    {:else if dueCount}
      <p>No misses here. Review the due cards next so today's correct answers survive the forgetting curve.</p>
    {:else}
      <p>No weak items and no due cards. Repeat {deckLabel}, then go back to Learn and continue the next chapter.</p>
    {/if}

    <div class="rec-steps">
      <div><b>1</b><span>{needsRecovery ? 'Repair weak items' : 'Review due cards'}</span></div>
      <div><b>2</b><span>Repeat once if the score drops</span></div>
      <div><b>3</b><span>Return to Learn for the next chapter</span></div>
    </div>

    <div class="r-actions">
      <button class="btn3d" type="button" on:click={takePrimary}>{primaryLabel}</button>
      <button class="quiet" type="button" on:click={onPracticeAgain}>Practice again</button>
      {#if needsRecovery && dueCount}
        <button class="quiet" type="button" on:click={onReviewDue}>Review {dueCount} due</button>
      {/if}
      <button class="quiet" type="button" on:click={onBackToLearn}>Back to Learn</button>
    </div>
  </section>
</div>

<style>
  .results { display: grid; justify-items: center; gap: 10px; padding: 24px 0; }
  .ring { width: 140px; height: 140px; border-radius: 999px; display: grid; place-items: center; font-size: 30px; font-weight: 880; color: var(--green-dark);
    background: conic-gradient(var(--green) calc(var(--pct) * 1%), var(--surface-2) 0); }
  .ring span { width: 104px; height: 104px; border-radius: 999px; background: var(--surface); display: grid; place-items: center; }
  .results h2 { margin: 4px 0 0; }
  .sub { margin: 0; color: var(--ink-3); text-align: center; }
  .recovery { width: min(100%, 620px); display: grid; gap: 14px; margin-top: 12px; padding: 18px;
    border: 1px solid var(--border); border-left: 4px solid var(--green); border-radius: 12px; background: var(--surface); box-shadow: var(--shadow-1); }
  .rec-head { display: grid; gap: 3px; }
  .rec-head span { font-size: 11px; font-weight: 850; letter-spacing: .14em; text-transform: uppercase; color: var(--green-dark); }
  .rec-head strong { font-size: 22px; line-height: 1.15; }
  .recovery p { margin: 0; color: var(--ink-2); line-height: 1.55; }
  .weak-list { display: flex; flex-wrap: wrap; gap: 8px; }
  .weak-list span { display: inline-flex; align-items: baseline; gap: 6px; padding: 8px 10px; border-radius: 999px;
    border: 1px solid #ffd8c8; background: #fff8f4; color: #8b4b37; font-size: 13px; font-weight: 750; }
  .weak-list b { color: var(--ink); font-size: 16px; }
  .weak-list button { margin-left: 2px; padding: 3px 7px; border-radius: 999px; background: #fff; border: 1px solid #ffd8c8;
    color: #b5411f; font-size: 11px; font-weight: 850; }
  .weak-list .more { color: var(--ink-2); background: var(--surface-2); border-color: var(--border); }
  .rec-steps { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 8px; }
  .rec-steps div { display: grid; grid-template-columns: auto 1fr; align-items: center; gap: 8px; min-height: 48px; padding: 10px;
    border-radius: 10px; background: var(--surface-2); border: 1px solid var(--border); }
  .rec-steps b { width: 26px; height: 26px; border-radius: 999px; display: grid; place-items: center; background: var(--ink); color: #fff; font-size: 13px; }
  .rec-steps span { font-size: 13px; font-weight: 780; line-height: 1.25; }
  .r-actions { display: flex; flex-wrap: wrap; gap: 8px; }
  .quiet { padding: 9px 14px; border-radius: 999px; border: 1px solid var(--border); background: #fff; color: var(--ink-2); font-weight: 800; }
  .quiet:hover { border-color: var(--ink-3); color: var(--ink); }
  @media (max-width: 560px) {
    .rec-steps { grid-template-columns: 1fr; }
    .recovery { padding: 16px; }
  }
</style>
