<script>
  export let onBack = () => {};
</script>

<section class="reader missing">
  <button class="back" type="button" on:click={onBack}><i class="ti ti-arrow-left"></i> Reading Room</button>
  <div class="missing-card">
    <p class="kicker">Reader unavailable</p>
    <h1>That reading piece is not in this build.</h1>
    <p>Choose a reader from the level list and continue there.</p>
  </div>
</section>

<style>
  .reader { display: grid; gap: 14px; }
  .missing { max-width: 720px; margin: 0 auto; padding: 24px; }
  .back { display: inline-flex; align-items: center; gap: 6px; padding: 10px 14px; border-radius: 999px;
    background: var(--surface-2); color: var(--ink-2); font-weight: 850; letter-spacing: 0; text-transform: none; }
  .back:hover { background: var(--border); }
  .missing-card { display: grid; gap: 12px; padding: 18px; border-radius: var(--radius); background: var(--surface);
    border: 1px solid var(--border); box-shadow: var(--shadow-1); }
  .kicker { margin: 0 0 4px; color: var(--accent-ink); font-size: 11px; font-weight: 850; letter-spacing: .12em; text-transform: uppercase; }
  h1 { margin: 0; font-family: var(--serif-ko); font-size: 30px; font-weight: 600; letter-spacing: 0; line-height: 1.08; }
  p { margin: 0; color: var(--ink-2); }
</style>
