<script>
  export let entry = null;
  export let chapter = null;
  export let inDeck = false;
  export let onAddReview = () => {};
  export let onPractice = () => {};
  export let onOpenChapter = () => {};
</script>

<section class="hub" aria-label="Learning actions for {entry?.hangul || 'this item'}">
  <div class="hub-copy">
    <span>Learning hub</span>
    <strong>{entry?.hangul || 'Selected item'}</strong>
  </div>
  <div class="hub-actions">
    <button type="button" on:click={onAddReview} disabled={inDeck}>{inDeck ? 'In review deck' : 'Add to review'}</button>
    <button class="primary" type="button" on:click={onPractice}>Practice this item</button>
    {#if chapter}
      <button type="button" on:click={onOpenChapter}>Open Ch {chapter.number}</button>
    {/if}
  </div>
</section>

<style>
  .hub { display: flex; align-items: center; justify-content: space-between; gap: 12px; flex-wrap: wrap;
    padding: 14px 0 16px; margin-bottom: 4px; border-bottom: 1px solid var(--rule); }
  .hub-copy { display: grid; gap: 2px; }
  .hub-copy span { font-size: 10px; font-weight: 850; letter-spacing: .16em; text-transform: uppercase; color: var(--accent-ink); }
  .hub-copy strong { font-size: 17px; }
  .hub-actions { display: flex; gap: 8px; flex-wrap: wrap; }
  button { padding: 8px 12px; border-radius: 999px; background: var(--surface-2); color: var(--ink-2); border: 1px solid var(--border);
    font-size: 12px; font-weight: 850; }
  button.primary { background: var(--ink); color: #fff; border-color: var(--ink); }
  button:hover:not(:disabled) { border-color: var(--ink); }
  button:disabled { opacity: .6; cursor: not-allowed; }
</style>
