<script>
  export let reader;
  export let summary = '';
  export let completed = null;
  export let canComplete = false;
  export let onSummaryInput = () => {};
  export let onComplete = () => {};
</script>

<section class="summary">
  <label for="reader-summary">Summary</label>
  <textarea
    id="reader-summary"
    value={summary}
    rows="4"
    placeholder={reader.summaryPrompt}
    on:input={(event) => onSummaryInput(event.currentTarget.value)}
  ></textarea>
  <div class="complete-row">
    <span>{completed ? `Last score ${completed.score}/${completed.total}` : 'Save your reading result'}</span>
    <button class="btn3d" type="button" disabled={!canComplete} on:click={onComplete}>
      {completed ? 'Update result' : 'Mark complete'}
    </button>
  </div>
</section>

<style>
  .summary { display: grid; gap: 12px; padding: 18px; border-radius: var(--radius); background: var(--surface);
    border: 1px solid var(--border); box-shadow: var(--shadow-1); }
  label { font-size: 12px; font-weight: 850; letter-spacing: .1em; text-transform: uppercase; color: var(--accent-ink); }
  textarea { width: 100%; min-height: 112px; resize: vertical; padding: 13px 14px; border-radius: var(--r-1);
    border: 1px solid var(--border); background: var(--surface); font: inherit; line-height: 1.55; }
  textarea:focus { outline: none; border-color: var(--ink); }
  .complete-row { display: flex; align-items: center; justify-content: space-between; gap: 12px; flex-wrap: wrap; }
  .complete-row span { color: var(--ink-3); font-size: 12px; font-weight: 850; text-transform: uppercase; letter-spacing: .08em; }
  .btn3d:disabled { opacity: .48; box-shadow: none; pointer-events: none; }
</style>
