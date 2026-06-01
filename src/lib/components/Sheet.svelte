<script>
  export let open = false;
  export let onClose = () => {};

  function onKey(e) { if (e.key === 'Escape') onClose(); }
</script>

<svelte:window on:keydown={onKey} />

{#if open}
  <!-- svelte-ignore a11y-click-events-have-key-events -- click-outside closes; Escape also closes via the window handler above -->
  <div class="overlay" on:click={onClose} role="presentation">
    <div class="sheet" on:click|stopPropagation role="dialog" aria-modal="true">
      <button class="close" type="button" on:click={onClose} aria-label="Close">✕</button>
      <div class="sheet-body"><slot /></div>
    </div>
  </div>
{/if}

<style>
  .overlay { position: fixed; inset: 0; z-index: 60; background: rgba(20,30,10,.45);
    display: grid; place-items: center; padding: 18px; }
  .sheet { position: relative; width: min(680px, 100%); max-height: 88vh; overflow: auto;
    background: var(--surface); border-radius: var(--radius); box-shadow: 0 24px 60px rgba(0,0,0,.25); }
  .close { position: absolute; top: 12px; right: 12px; width: 34px; height: 34px; border-radius: 999px;
    background: var(--surface-2); color: var(--ink-2); font-size: 15px; }
  .close:hover { background: var(--border); }
  .sheet-body { padding: 26px 24px 28px; }
  @media (max-width: 620px) {
    .overlay { padding: 0; place-items: end stretch; }
    .sheet { width: 100%; max-height: 92vh; border-radius: var(--radius) var(--radius) 0 0; }
  }
</style>
