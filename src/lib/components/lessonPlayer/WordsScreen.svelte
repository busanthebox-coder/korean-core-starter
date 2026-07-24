<script>
  import AudioButton from '../AudioButton.svelte';
  import RomanizationLine from '../RomanizationLine.svelte';
  import { clustersForHangul } from '../../data.js';
  import { clusterHintLine } from '../../clusterHint.js';

  export let kind = 'words';
  export let items = [];

  // A word can sit in two clusters; the lesson screen shows the first — the
  // dictionary is where the full comparison lives.
  const hintFor = (ko) => clusterHintLine(clustersForHangul(ko)[0], ko);
</script>

{#if kind === 'words'}
  <h2 class="screen-h">Key words</h2>
  <p class="screen-sub">The pieces you'll combine.</p>
  <div class="word-list">
    {#each items as w}
      <div class="word">
        <div class="word-head">
          <div class="word-id">
            <span class="word-ko">{w.ko}</span>
            <RomanizationLine text={w.romanization} />
          </div>
          {#if w.pos}<span class="word-pos">{w.pos}</span>{/if}
          <AudioButton text={w.ko} size={22} />
        </div>
        <div class="word-en">{w.en}</div>
        {#if w.ex || hintFor(w.ko)}
          <details class="word-more">
            <summary>Example &amp; why</summary>
            {#if w.ex}
              <div class="word-ex">
                <span class="ex-cap">예문 · example</span>
                <div class="ex-ko">{w.ex.ko}</div>
                {#if w.ex.en}<div class="ex-en">{w.ex.en}</div>{/if}
                {#if w.ex.note}<div class="ex-note">{w.ex.note}</div>{/if}
              </div>
            {/if}
            {#if hintFor(w.ko)}
              <div class="ex-vs">{hintFor(w.ko)}</div>
            {/if}
          </details>
        {/if}
      </div>
    {/each}
  </div>
{:else}
  <h2 class="screen-h">Key phrases</h2>
  <p class="screen-sub">Say these first — they carry the situation.</p>
  <div class="word-list">
    {#each items as p, pi}
      <div class="word">
        <div class="word-top">
          <span class="kp-n">{pi + 1}</span>
          <span class="word-ko">{p.ko}</span>
          <AudioButton text={p.ko} size={20} />
        </div>
        <RomanizationLine text={p.romanization} />
        <div class="word-en">{p.en}</div>
        {#if p.note}<div class="word-ex"><span>{p.note}</span></div>{/if}
      </div>
    {/each}
  </div>
{/if}

<style>
  /* P9/P11 — no boxes: each word is a hairline row and the Korean is the
     biggest thing in it (Cake's hierarchy: target language huge, gloss small). */
  .word-list { display: grid; }
  .word { padding: 18px 0; border-top: 1px solid var(--border); display: grid; gap: 8px; }
  .word:first-child { border-top: 0; padding-top: 4px; }
  .word-head { display: flex; align-items: flex-start; gap: 10px; }
  .word-top { display: flex; align-items: center; gap: 8px; }
  .word-id { flex: 1; min-width: 0; display: grid; gap: 2px; }
  .word-ko { font-size: 19px; font-weight: 800; }
  .word-id .word-ko { font-family: var(--serif-ko); font-size: 31px; font-weight: 650; line-height: 1.12; letter-spacing: -.01em; }
  .word-pos { flex: none; align-self: center; font-size: 11px; font-weight: 700; color: var(--ink-3); white-space: nowrap; }
  .kp-n { width: 22px; height: 22px; flex: none; display: grid; place-items: center; border-radius: 999px; background: var(--primary-wash); color: var(--accent-ink); font-size: 12px; font-weight: 850; }
  .word-en { font-size: 15px; font-weight: 600; color: var(--ink); }
  .word-more { padding-top: 2px; }
  .word-more summary { cursor: pointer; color: var(--accent-ink); font-size: 12px; font-weight: 800; }
  .word-more[open] summary { margin-bottom: 8px; }
  .word-ex { padding: 2px 0 0; display: grid; gap: 3px; }
  .word-ex span { color: var(--ink-3); font-size: 13px; }
  .ex-cap { font-size: 10px; font-weight: 800; letter-spacing: .08em; text-transform: uppercase; color: var(--accent-ink); }
  .ex-ko { font-size: 15px; font-weight: 600; }
  .ex-en { font-size: 13px; color: var(--ink-2); }
  .ex-note { font-size: 12px; color: var(--ink-3); }
  .ex-vs { margin-top: 8px; padding: 8px 10px; border-radius: 8px; background: var(--primary-wash);
    color: var(--accent-ink); font-size: 12.5px; font-weight: 700; line-height: 1.45; word-break: keep-all; }
  .word-ex + .ex-vs { margin-top: 10px; }
</style>
