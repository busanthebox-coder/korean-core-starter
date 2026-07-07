<script>
  import { createEventDispatcher } from 'svelte';
  import { bankAnswerValue, buildFallbackTiles } from '../inputFallback.js';

  export let answer = '';
  export let distractors = [];
  export let disabled = false;

  const dispatch = createEventDispatcher();
  let bank = [];
  let picked = [];
  let key = '';

  $: nextKey = `${answer}|${(distractors || []).join('|')}`;
  $: if (nextKey !== key) {
    key = nextKey;
    bank = buildFallbackTiles(answer, distractors);
    picked = [];
    emit();
  }

  function emit() {
    dispatch('change', { value: bankAnswerValue(picked) });
  }
  function pick(tile) {
    if (disabled) return;
    picked = [...picked, tile];
    bank = bank.filter((item) => item.k !== tile.k);
    emit();
  }
  function unpick(tile) {
    if (disabled) return;
    bank = [...bank, tile].sort((a, b) => a.t.localeCompare(b.t, 'ko') || a.k.localeCompare(b.k));
    picked = picked.filter((item) => item.k !== tile.k);
    emit();
  }
</script>

<div class="fallback" aria-label="Tap Korean answer">
  <div class="answer-line" class:filled={picked.length}>
    {#each picked as tile (tile.k)}
      <button class="tile placed" type="button" disabled={disabled} on:click={() => unpick(tile)}>{tile.t}</button>
    {:else}
      <span class="ph">Tap the Korean below in order...</span>
    {/each}
  </div>
  <div class="bank">
    {#each bank as tile (tile.k)}
      <button class="tile" type="button" disabled={disabled} on:click={() => pick(tile)}>{tile.t}</button>
    {/each}
  </div>
</div>

<style>
  .fallback { display: grid; gap: 10px; }
  .answer-line { display: flex; flex-wrap: wrap; gap: 8px; min-height: 54px; padding: 11px 13px; align-items: center;
    border-radius: 14px; border: 2px dashed var(--border); background: var(--surface-2); }
  .answer-line.filled { border-style: solid; }
  .ph { color: var(--ink-3); font-size: 14px; }
  .bank { display: flex; flex-wrap: wrap; gap: 8px; justify-content: center; }
  .tile { padding: 10px 14px; border-radius: 12px; background: var(--surface); border: 2px solid var(--border);
    font-size: 18px; font-weight: 760; transition: transform .08s var(--bounce); }
  .tile:hover:not(:disabled) { border-color: var(--green); transform: translateY(-1px); }
  .tile.placed { background: var(--green-soft); border-color: var(--green); }
  .tile:disabled { opacity: .58; }
</style>

