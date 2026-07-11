<script>
  import AudioButton from '../AudioButton.svelte';
  import RomanizationLine from '../RomanizationLine.svelte';

  export let data = { items: [] };
  export let checkedIds = [];
  export let onToggle = () => {};

  let hidden = {};

  $: items = data?.items || [];
  $: checked = new Set(checkedIds || []);
  $: doneCount = items.filter((item) => checked.has(item.id)).length;
</script>

<h2 class="screen-h">Say it out loud</h2>
<p class="screen-sub">Hide a line, say it from memory, then mark the ones you actually said.</p>

<div class="say-progress" aria-live="polite">
  <span>{doneCount}/{items.length} spoken</span>
  <div class="bar" aria-hidden="true"><i style="width:{items.length ? (doneCount / items.length) * 100 : 0}%"></i></div>
</div>

<div class="say-list">
  {#each items as item, index}
    {@const isHidden = !!hidden[item.id]}
    {@const isChecked = checked.has(item.id)}
    <article class="say-card" class:done={isChecked}>
      <div class="say-top">
        <span>Line {index + 1}</span>
        <AudioButton text={item.ko} size={28} />
      </div>
      <button class="memory" type="button" on:click={() => (hidden = { ...hidden, [item.id]: !isHidden })}>
        {isHidden ? 'Show line' : 'Hide line'}
      </button>
      {#if isHidden}
        <div class="covered">Say it without looking.</div>
      {:else}
        <div class="ko">{item.ko}</div>
        {#if item.romanization}<RomanizationLine text={item.romanization} />{/if}
        {#if item.en}<div class="en">{item.en}</div>{/if}
      {/if}
      <button class="said" class:on={isChecked} type="button" on:click={() => onToggle(item.id, !isChecked)}>
        {isChecked ? 'Said out loud' : 'I said it'}
      </button>
    </article>
  {/each}
</div>

<p class="skip-note">You can still continue if you are in a quiet place. This step is here to build the speaking habit.</p>

<style>
  .say-progress { display: flex; align-items: center; gap: 10px; color: var(--green-dark); font-size: 12px; font-weight: 850; }
  .bar { flex: 1; height: 8px; border-radius: 999px; background: var(--surface-2); border: 1px solid var(--border); overflow: hidden; }
  .bar i { display: block; height: 100%; border-radius: inherit; background: var(--green); transition: width .22s var(--ease); }
  .say-list { display: grid; gap: 10px; }
  .say-card { display: grid; gap: 10px; padding: 13px; border-radius: var(--r-1); border: 1px solid var(--border);
    background: var(--surface-2); }
  .say-card.done { border-color: var(--green); background: var(--green-soft); }
  .say-top { display: flex; align-items: center; justify-content: space-between; gap: 10px; }
  .say-top span { color: var(--ink-3); font-size: 11px; font-weight: 850; letter-spacing: .1em; text-transform: uppercase; }
  .memory { justify-self: start; padding: 7px 12px; border-radius: 999px; background: var(--surface); border: 1px solid var(--border);
    color: var(--ink-2); font-size: 12px; font-weight: 850; }
  .memory:hover { border-color: var(--green); color: var(--green-dark); }
  .ko { font-family: var(--serif-ko); font-size: clamp(24px, 6vw, 36px); font-weight: 750; line-height: 1.2; word-break: keep-all; }
  .en { color: var(--ink-2); font-size: 13px; line-height: 1.45; }
  .covered { min-height: 58px; display: grid; place-items: center; border-radius: var(--r-1); border: 1px dashed var(--border);
    color: var(--ink-3); font-size: 13px; font-weight: 800; background: rgba(255,255,255,.55); }
  .said { justify-self: start; padding: 10px 16px; border-radius: 999px; background: var(--surface); color: var(--ink-2);
    border: 1px solid var(--border); font-weight: 850; }
  .said.on { background: var(--green); border-color: var(--green); color: #fff; }
  .skip-note { margin: 0; color: var(--ink-3); font-size: 12px; line-height: 1.5; }
</style>
