<script>
  import { findEntry } from '../../data.js';
  import { cleanGlossToken, matchGlossToken } from '../../gloss.js';

  export let reader;
  export let glossIndex = null;
  export let activeGlossKey = '';
  export let onToggleGloss = () => {};
  export let onOpenEntry = () => {};

  function partFor(raw, key) {
    if (/^\s+$/.test(raw)) return { key, kind: 'space', text: raw };
    const token = cleanGlossToken(raw);
    const match = /[가-힣]/.test(token) ? matchGlossToken(token, glossIndex) : null;
    return { key, kind: match ? 'gloss' : 'text', text: raw, match };
  }

  function paragraphParts(text, paragraphIndex) {
    return String(text || '')
      .split(/(\s+)/)
      .filter((part) => part.length)
      .map((part, index) => partFor(part, `${paragraphIndex}-${index}`));
  }
</script>

<article class="reader-body">
  {#each reader.body as paragraph, paragraphIndex}
    <section class="paragraph-block">
      <p class="ko-p">
        {#each paragraphParts(paragraph, paragraphIndex) as part (part.key)}
          {#if part.kind === 'gloss'}
            <span class="gloss-wrap">
              <button class="gloss-token" type="button" on:click={() => onToggleGloss(part.key)}>{part.text}</button>
              {#if activeGlossKey === part.key}
                <span class="gloss-pop">
                  <strong>{part.match.entry.hangul}</strong>
                  <span>{part.match.entry.english}</span>
                  {#if part.match.entry.partOfSpeech}<small>{part.match.entry.partOfSpeech}</small>{/if}
                  {#if findEntry(part.match.entry.id)}
                    <button type="button" on:click={() => onOpenEntry(part.match.entry)}>Dictionary</button>
                  {/if}
                </span>
              {/if}
            </span>
          {:else}
            {part.text}
          {/if}
        {/each}
      </p>
      <details class="translation">
        <summary>Translation</summary>
        <p>{reader.bodyTranslation[paragraphIndex]}</p>
      </details>
    </section>
  {/each}
</article>

<style>
  .reader-body { display: grid; gap: 12px; }
  .paragraph-block { display: grid; gap: 8px; padding: 22px; border-radius: var(--radius); background: var(--surface);
    border: 1px solid var(--border); box-shadow: var(--shadow-1); }
  .ko-p { margin: 0; color: var(--ink); font-family: var(--serif-ko); font-size: 22px; line-height: 1.9; word-break: keep-all;
    overflow-wrap: break-word; }
  .gloss-wrap { position: relative; display: inline; }
  .gloss-token { display: inline; padding: 0 1px 2px; border-bottom: 1px dashed var(--accent-ink); color: var(--ink); }
  .gloss-token:hover { color: var(--accent-ink); }
  .gloss-pop { position: absolute; left: 0; bottom: calc(100% + 8px); z-index: 5; width: max-content; max-width: min(270px, 78vw);
    display: grid; gap: 2px; padding: 10px 12px; border-radius: var(--r-1); background: var(--ink); color: var(--bg);
    box-shadow: var(--shadow-3); font-family: var(--sans); font-size: 13px; line-height: 1.35; }
  .gloss-pop strong { font-family: var(--serif-ko); font-size: 18px; }
  .gloss-pop small { color: var(--surface-2); }
  .gloss-pop button { justify-self: start; margin-top: 5px; padding: 4px 8px; border-radius: 999px; background: var(--ink-2);
    color: var(--bg); font-size: 11px; font-weight: 850; }
  .translation { border-top: 1px solid var(--border); padding-top: 8px; color: var(--ink-2); }
  .translation summary { cursor: pointer; font-size: 12px; font-weight: 850; letter-spacing: .08em; text-transform: uppercase; color: var(--ink-3); }
  .translation p { margin: 7px 0 0; line-height: 1.55; }
  @media (max-width: 720px) {
    .ko-p { font-size: 20px; line-height: 1.86; }
    .paragraph-block { padding: 18px; }
  }
</style>
