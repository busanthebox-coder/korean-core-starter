<script>
  export let reader;
  export let completed = null;
  export let onBack = () => {};

  $: characterCount = (reader?.body || []).join('').replace(/\s/g, '').length;
</script>

<div class="reader-top">
  <button class="back" type="button" on:click={onBack}><i class="ti ti-arrow-left"></i> Reading Room</button>
  <span>{reader.level} · {reader.genre} · {characterCount} chars</span>
</div>

<header class="reader-head">
  <div>
    <p class="kicker">Graded reader</p>
    <h1>{reader.title}</h1>
    <p>{reader.titleEn}</p>
  </div>
  {#if completed}
    <div class="reader-stamp">
      <strong>{completed.score}/{completed.total}</strong>
      <span>completed</span>
    </div>
  {/if}
</header>

<style>
  .reader-top { display: flex; align-items: center; justify-content: space-between; gap: 12px; color: var(--ink-3);
    font-size: 12px; font-weight: 850; letter-spacing: .08em; text-transform: uppercase; }
  .back { display: inline-flex; align-items: center; gap: 6px; padding: 10px 14px; border-radius: 999px;
    background: var(--surface-2); color: var(--ink-2); font-weight: 850; letter-spacing: 0; text-transform: none; }
  .back:hover { background: var(--border); }
  .reader-head { display: flex; align-items: center; justify-content: space-between; gap: 16px; padding: 18px;
    border-radius: var(--radius); background: var(--surface); border: 1px solid var(--border); box-shadow: var(--shadow-1); }
  .kicker { margin: 0 0 4px; color: var(--accent-ink); font-size: 11px; font-weight: 850; letter-spacing: .12em; text-transform: uppercase; }
  h1 { margin: 0; font-family: var(--serif-ko); font-size: 36px; font-weight: 600; letter-spacing: 0; line-height: 1.08; }
  .reader-head p:last-child { margin: 4px 0 0; color: var(--ink-2); }
  .reader-stamp { width: 92px; height: 92px; flex: none; display: grid; place-items: center; align-content: center;
    border-radius: 999px; background: var(--green-soft); color: var(--green-dark); border: 1px solid var(--green-soft); }
  .reader-stamp strong { font-family: var(--serif); font-size: 24px; line-height: 1; }
  .reader-stamp span { font-size: 10px; font-weight: 850; letter-spacing: .08em; text-transform: uppercase; }
  @media (max-width: 720px) {
    .reader-head { align-items: flex-start; flex-direction: column; }
    h1 { font-size: 31px; }
  }
  @media (max-width: 520px) {
    .reader-top { align-items: flex-start; flex-direction: column; }
    .reader-stamp { width: 76px; height: 76px; }
  }
</style>
