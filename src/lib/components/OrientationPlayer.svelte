<script>
  import AudioButton from './AudioButton.svelte';
  import RomanizationLine from './RomanizationLine.svelte';

  export let cards = [];
  export let done = false;
  export let onBack = () => {};
  export let onComplete = () => {};
  export let onOpenChapter = () => {};

  let i = 0;
  $: card = cards[i] || null;
  $: isLast = i >= cards.length - 1;

  function prev() { if (i > 0) i -= 1; }
  function next() {
    if (!isLast) i += 1;
    else onComplete();
  }
</script>

{#if card}
<section class="orient">
  <div class="top">
    <button class="x" type="button" on:click={onBack} aria-label="Back"><i class="ti ti-x"></i></button>
    <div class="prog" aria-hidden="true">
      {#each cards as _, idx}<span class:on={idx <= i}></span>{/each}
    </div>
    <span class="count">{i + 1}/{cards.length}</span>
  </div>

  <div class="eyebrow">How Korean Works · 5 min</div>
  <article class="card">
    <span class="n">{i + 1}</span>
    <h1>{card.title}</h1>
    <p class="body">{card.body}</p>
    <div class="example">
      <div class="ko">{card.exampleKo}<AudioButton text={card.exampleKo} size={20} /></div>
      <RomanizationLine text={card.romanization} />
      <div class="en">{card.exampleEn}</div>
    </div>
    <button class="chapter-link" type="button" on:click={() => onOpenChapter(card.chapterId)}>
      Learn this in Chapter {card.chapterNumber}
    </button>
  </article>

  <div class="nav">
    <button class="ghost" type="button" disabled={i === 0} on:click={prev}>Prev</button>
    <button class="btn3d" type="button" on:click={next}>{isLast ? (done ? 'Done' : 'Mark complete') : 'Next'}</button>
  </div>
</section>
{/if}

<style>
  .orient { max-width: 620px; margin: 0 auto; padding: 20px; display: grid; gap: 16px; }
  .top { display: flex; align-items: center; gap: 12px; }
  .x { width: 34px; height: 34px; flex: none; display: grid; place-items: center; border-radius: 999px;
    background: var(--surface); border: 1px solid var(--border); color: var(--ink-2); }
  .prog { flex: 1; display: grid; grid-template-columns: repeat(10, 1fr); gap: 4px; }
  .prog span { height: 7px; border-radius: 999px; background: var(--primary-wash); }
  .prog span.on { background: var(--primary); }
  .count { font-size: 12px; font-weight: 850; color: var(--ink-3); }
  .eyebrow { font-size: 11px; font-weight: 850; letter-spacing: .14em; text-transform: uppercase; color: var(--ink-3); }
  .card { display: grid; gap: 14px; padding: 24px; border-radius: var(--r-2); background: var(--surface);
    border: 1px solid var(--border); box-shadow: var(--shadow-1); position: relative; overflow: hidden; }
  .n { width: 32px; height: 32px; display: grid; place-items: center; border-radius: 999px;
    background: var(--primary); color: var(--primary-on); font-weight: 900; }
  h1 { margin: 0; font-family: var(--serif-ko); font-size: 34px; font-weight: 600; line-height: 1.08; letter-spacing: 0; }
  .body { margin: 0; color: var(--ink-2); font-size: 16px; line-height: 1.7; }
  .example { display: grid; gap: 4px; padding: 16px; border-radius: var(--r-1); background: var(--surface-2); }
  .ko { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; font-size: 24px; font-weight: 850; }
  .en { color: var(--ink-2); font-size: 14px; }
  .chapter-link { justify-self: start; padding: 10px 14px; border-radius: 999px; background: var(--green-soft);
    color: var(--green-dark); border: 1px solid rgba(36,119,68,.24); font-weight: 850; }
  .nav { display: flex; justify-content: space-between; gap: 10px; }
  .ghost { padding: 12px 18px; border-radius: 999px; background: var(--surface-2); color: var(--ink-2); font-weight: 800; }
  .ghost:disabled { opacity: .45; }
  @media (max-width: 520px) {
    .orient { padding: 16px; }
    h1 { font-size: 28px; }
    .ko { font-size: 21px; }
  }
</style>

