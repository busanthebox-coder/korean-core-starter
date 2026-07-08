<script>
  import { reviews } from '../srs.js';
  import { recordActivity } from '../streak.js';
  import AudioButton from './AudioButton.svelte';
  import RomanizationLine from './RomanizationLine.svelte';

  export let cards = [];
  export let onDone = () => {};

  let i = 0;
  let revealed = false;
  let reviewed = 0;

  $: card = cards[i];

  function rate(r) {
    reviews.grade(card.id, r);
    recordActivity();
    reviewed += 1;
    revealed = false;
    if (i + 1 >= cards.length) onDone({ reviewed });
    else i += 1;
  }
</script>

{#if card}
  <div class="rev">
    <div class="rprog"><span class="lbl">Review</span><span>{i + 1} / {cards.length}</span></div>

    <div class="rcard">
      <div class="rko">{card.hangul}<AudioButton text={card.hangul} size={30} /></div>
      {#if revealed}
        <RomanizationLine text={card.romanization} />
        <div class="ren">{card.english}</div>
      {:else}
        <div class="hint">Recall the meaning, then check.</div>
      {/if}
    </div>

    {#if revealed}
      <div class="rate">
        <button class="rb again" on:click={() => rate('again')}>Again<small>~10 min</small></button>
        <button class="rb good" on:click={() => rate('good')}>Good<small>spaced out</small></button>
        <button class="rb easy" on:click={() => rate('easy')}>Easy<small>further out</small></button>
      </div>
    {:else}
      <button class="show" on:click={() => (revealed = true)}>Show answer</button>
    {/if}
  </div>
{/if}

<style>
  .rev { display: grid; gap: 18px; max-width: 520px; margin: 0 auto; }
  .rprog { display: flex; align-items: center; justify-content: space-between; font-size: 11px; font-weight: 750;
    letter-spacing: .14em; text-transform: uppercase; color: var(--ink-3); border-bottom: 1px solid var(--border); padding-bottom: 10px; }
  .rcard { min-height: 200px; display: grid; align-content: center; justify-items: center; gap: 8px; text-align: center;
    padding: 36px 20px; border: 1px solid var(--border); border-radius: 12px; background: var(--surface); }
  .rko { font-size: 46px; font-weight: 850; letter-spacing: -.02em; display: flex; align-items: center; gap: 12px; }
  .ren { font-size: 19px; font-weight: 720; color: var(--ink); }
  .hint { color: var(--ink-3); font-size: 14px; }
  .show { justify-self: center; padding: 13px 28px; border-radius: 8px; background: var(--ink); color: #fff; font-weight: 720; }
  .show:hover { opacity: .9; }
  .rate { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; }
  .rb { display: grid; gap: 2px; padding: 13px 10px; border-radius: 9px; border: 1px solid var(--border); background: var(--surface);
    font-weight: 800; font-size: 15px; transition: border-color .12s, background .12s; }
  .rb small { font-weight: 600; font-size: 10px; color: var(--ink-3); letter-spacing: .02em; }
  .rb:hover { border-color: var(--ink); }
  .rb.again:hover { border-color: var(--accent); color: var(--accent-ink); }
  .rb.good:hover { border-color: var(--type-word); color: var(--type-word); }
  .rb.easy:hover { border-color: var(--type-expression); color: var(--type-expression); }
</style>
