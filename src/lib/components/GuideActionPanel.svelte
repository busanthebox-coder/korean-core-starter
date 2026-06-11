<script>
  export let unit = null;
  export let vocab = [];
  export let ready = false;
  export let onAddReview = () => {};
  export let onPractice = () => {};
  export let onToggleReady = () => {};

  let added = false;

  function addReview() {
    onAddReview();
    added = true;
    setTimeout(() => (added = false), 1600);
  }
</script>

<section class="guide-actions" aria-label="Study actions for {unit?.title || 'this guide'}">
  <div class="ga-copy">
    <span>Study this situation</span>
    <strong>{vocab.length} linked item{vocab.length === 1 ? '' : 's'}</strong>
  </div>
  <div class="ga-buttons">
    <button type="button" on:click={addReview} disabled={!vocab.length}>
      {added ? 'Added' : `Add ${vocab.length} guide items`}
    </button>
    <button class="primary" type="button" on:click={onPractice} disabled={!vocab.length}>Practice this situation</button>
    <button class:ready type="button" on:click={onToggleReady}>{ready ? 'Ready' : 'Mark ready'}</button>
  </div>
</section>

<style>
  .guide-actions { display: flex; align-items: center; justify-content: space-between; gap: 14px; flex-wrap: wrap;
    padding: 14px 16px; border-radius: 13px; background: #fff; border: 1px solid var(--border); border-left: 4px solid var(--green);
    box-shadow: var(--shadow-1); }
  .ga-copy { display: grid; gap: 2px; }
  .ga-copy span { font-size: 11px; font-weight: 850; letter-spacing: .14em; text-transform: uppercase; color: var(--green-dark); }
  .ga-copy strong { font-size: 17px; }
  .ga-buttons { display: flex; gap: 8px; flex-wrap: wrap; }
  button { padding: 9px 13px; border-radius: 999px; background: var(--surface-2); color: var(--ink-2); border: 1px solid var(--border);
    font-size: 12px; font-weight: 850; }
  button:hover:not(:disabled) { border-color: var(--green); color: var(--green-dark); }
  button.primary { background: var(--green); color: #fff; border-color: var(--green); }
  button.ready { background: #ecf7f1; color: var(--green-dark); border-color: rgba(36,119,68,.32); }
  button:disabled { opacity: .45; cursor: not-allowed; }
</style>
