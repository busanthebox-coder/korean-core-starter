<script>
  export let contrastLevelOptions = ['all'];
  export let contrastCount = 0;
  export let contrastLevel = 'all';
</script>

<div class="contrast-picker">
  <div class="contrast-head">
    <strong>Contrast Lab</strong>
    <span>{contrastCount} question{contrastCount === 1 ? '' : 's'} ready</span>
  </div>
  <div class="levelchips" aria-label="Contrast levels">
    {#each contrastLevelOptions as level}
      <button class="formchip" type="button" class:on={contrastLevel === level} on:click={() => (contrastLevel = level)}>
        <span>{level === 'all' ? 'All' : level}</span>
        <small>{level === 'all' ? '30 pairs' : 'level'}</small>
      </button>
    {/each}
  </div>
</div>

<style>
  .contrast-picker { min-width: 0; display: grid; gap: 10px; padding: 12px; border: 1px solid var(--border); border-radius: var(--r-1); background: var(--surface-2); }
  .contrast-head { display: flex; align-items: baseline; justify-content: space-between; gap: 12px; flex-wrap: wrap; }
  .contrast-head strong { font-size: 14px; }
  .contrast-head span { color: var(--ink-3); font-size: 12px; font-weight: 750; }
  .levelchips { display: flex; flex-wrap: wrap; gap: 6px; }
  .formchip { display: inline-grid; gap: 1px; text-align: left; padding: 7px 10px; border-radius: 999px; border: 1px solid var(--border); background: #fff; color: var(--ink-2); }
  .formchip span { font-size: 12px; font-weight: 850; }
  .formchip small { font-size: 10px; color: var(--ink-3); }
  .formchip.on { background: var(--primary); border-color: var(--primary); color: var(--primary-on); }
  .formchip.on small { color: rgba(255, 255, 255, .78); }
</style>
