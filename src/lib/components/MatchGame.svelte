<script>
  import { speak } from '../audio.js';
  import { shuffle } from '../quiz.js';

  export let pairs = [];
  export let onDone = () => {};

  let kos = shuffle(pairs.map((p) => ({ id: p.id, t: p.ko })));
  let ens = shuffle(pairs.map((p) => ({ id: p.id, t: p.en })));
  let selKo = null, selEn = null, wrong = null;
  let matched = new Set();
  let wrongIds = new Set();
  $: done = matched.size === pairs.length && pairs.length > 0;

  function check() {
    if (!selKo || !selEn) return;
    if (selKo.id === selEn.id) {
      matched = new Set(matched).add(selKo.id);
      selKo = null; selEn = null;
      if (matched.size === pairs.length) {
        const cleanIds = pairs.map((p) => p.id).filter((id) => !wrongIds.has(id));
        setTimeout(() => onDone({ correct: pairs.length, total: pairs.length, wrongIds: [...wrongIds], correctIds: cleanIds }), 450);
      }
    } else {
      wrongIds = new Set([...wrongIds, selKo.id, selEn.id]);
      wrong = { ko: selKo.id, en: selEn.id };
      setTimeout(() => { wrong = null; selKo = null; selEn = null; }, 650);
    }
  }
  function pickKo(k) { if (matched.has(k.id) || wrong) return; selKo = k; speak(k.t); check(); }
  function pickEn(e) { if (matched.has(e.id) || wrong) return; selEn = e; check(); }
</script>

<div class="match">
  <div class="col">
    {#each kos as k}
      <button class="tile" class:sel={selKo?.id === k.id} class:matched={matched.has(k.id)} class:wrong={wrong?.ko === k.id}
        disabled={matched.has(k.id)} on:click={() => pickKo(k)}>{k.t}</button>
    {/each}
  </div>
  <div class="col">
    {#each ens as e}
      <button class="tile en" class:sel={selEn?.id === e.id} class:matched={matched.has(e.id)} class:wrong={wrong?.en === e.id}
        disabled={matched.has(e.id)} on:click={() => pickEn(e)}>{e.t}</button>
    {/each}
  </div>
</div>
{#if done}<p class="done">All matched! 🎉</p>{/if}

<style>
  .match { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; max-width: 560px; margin: 0 auto; }
  .col { display: grid; gap: 10px; align-content: start; }
  .tile { padding: 14px 12px; border-radius: 14px; background: var(--surface); border: 2px solid var(--border);
    font-size: 17px; font-weight: 760; transition: transform .08s var(--bounce); }
  .tile.en { font-size: 15px; }
  .tile:hover:not(:disabled) { border-color: var(--green); transform: translateY(-1px); }
  .tile.sel { border-color: var(--green); background: var(--green-soft); }
  .tile.wrong { border-color: #ff9b9b; background: #ffeaea; }
  .tile.matched { opacity: .35; border-style: dashed; }
  .done { text-align: center; font-size: 18px; font-weight: 850; color: var(--green-dark); }
</style>
