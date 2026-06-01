<script>
  import RomanizationLine from './RomanizationLine.svelte';
  export let entry;
  export let onOpen = () => {};
  const TYPE_LABEL = { word: 'Word', expression: 'Expression', pattern: 'Pattern' };
</script>

<button class="entry t-{entry.type}" type="button" on:click={() => onOpen(entry)}>
  <span class="ix">{TYPE_LABEL[entry.type] || entry.type}<span class="arr">→</span></span>
  <strong class="ko">{entry.hangul}</strong>
  <RomanizationLine text={entry.romanization} />
  <span class="en">{entry.english}</span>
</button>

<style>
  /* Borderless editorial glossary entry — no card, hairline rule + typography only */
  .entry { position: relative; display: grid; gap: 2px; text-align: left; padding: 16px 4px 18px;
    background: transparent; border: 0; border-top: 1px solid var(--border); transition: background .12s; --c: var(--ink-3); }
  .entry:hover { background: linear-gradient(180deg, rgba(228,50,43,.03), transparent 60%); }

  .t-word       { --c: var(--type-word); }
  .t-expression { --c: var(--type-expression); }
  .t-pattern    { --c: var(--type-pattern); }

  .ix { display: flex; align-items: center; justify-content: space-between; font-size: 10px; font-weight: 750;
    letter-spacing: .16em; text-transform: uppercase; color: var(--c); }
  .arr { color: var(--accent); font-size: 13px; opacity: 0; transform: translateX(-5px); transition: opacity .14s, transform .14s; }
  .entry:hover .arr { opacity: 1; transform: translateX(0); }

  .ko { font-size: 26px; font-weight: 800; color: var(--ink); letter-spacing: -.015em; line-height: 1.1; margin-top: 7px; transition: color .12s; }
  .entry:hover .ko { color: var(--accent-ink); }
  .en { color: var(--ink-2); font-size: 14px; margin-top: 3px; }
</style>
