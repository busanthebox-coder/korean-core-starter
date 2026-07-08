<script>
  export let courseMastery = { mastered: 0, total: 0, pct: 0 };
  export let streakDays = 0;
  export let doneCount = 0;
  export let totalChapters = 0;
  export let onResetCompleted = () => {};
</script>

<div class="progress-card">
  <div class="pc-top">
    <span class="pc-label">Course mastery</span>
    <span class="pc-count">{courseMastery.mastered} / {courseMastery.total} words mastered</span>
  </div>
  <div class="pc-bar"><span class="pc-fill" style="width:{courseMastery.pct}%"></span></div>
  <div class="pc-meta">
    {#if streakDays}<span class="pc-streak"><i class="ti ti-flame" aria-hidden="true"></i>{streakDays}일</span>{/if}
    <span>{doneCount}/{totalChapters} chapters marked done · {courseMastery.pct}% mastered</span>
  </div>
  {#if doneCount}
    <button class="pc-reset" type="button" on:click={onResetCompleted}>Reset completed</button>
  {/if}
</div>

<style>
  .progress-card { display: grid; gap: 9px; padding: 15px 18px; border-radius: var(--radius);
    background: var(--surface); border: 1px solid var(--border); box-shadow: var(--shadow-1); }
  .pc-top { display: flex; justify-content: space-between; align-items: baseline; }
  .pc-label { font-weight: 850; }
  .pc-count { font-weight: 800; color: var(--green-dark); font-size: 14px; }
  .pc-bar { height: 12px; border-radius: 999px; background: #fff; border: 1px solid var(--border); overflow: hidden; }
  .pc-fill { display: block; height: 100%; border-radius: 999px; background: var(--accent); transition: width .4s var(--bounce); }
  .pc-meta { display: flex; flex-wrap: wrap; gap: 6px 16px; font-size: 12px; font-weight: 700; color: var(--ink-3); }
  .pc-streak { display: inline-flex; align-items: center; gap: 4px; color: var(--accent-ink); }
  .pc-reset { justify-self: start; padding: 6px 10px; border-radius: 999px; border: 1px solid var(--border);
    background: #fff; color: var(--ink-3); font-size: 12px; font-weight: 800; }
  .pc-reset:hover { border-color: var(--ink-3); color: var(--ink); }
  @media (max-width: 520px) {
    .pc-top { align-items: flex-start; flex-direction: column; gap: 2px; }
  }
</style>
