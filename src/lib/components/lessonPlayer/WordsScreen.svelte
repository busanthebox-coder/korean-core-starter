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

  // Color-code by part of speech so a mixed word screen scans at a glance:
  // verbs green, nouns blue, adjectives purple, adverbs amber, the rest neutral.
  function posClass(pos) {
    const p = String(pos || '').toLowerCase();
    if (p.startsWith('verb')) return 'pos-verb';
    if (p.startsWith('noun') || p.startsWith('pronoun')) return 'pos-noun';
    if (p.startsWith('adj')) return 'pos-adj';
    if (p.startsWith('adv')) return 'pos-adv';
    return 'pos-etc';
  }
</script>

{#if kind === 'words'}
  <div class="word-list">
    {#each items as w}
      <div class="word {posClass(w.pos)}">
        <div class="word-head">
          {#if w.pos}<span class="word-pos">{w.pos}</span>{:else}<span></span>{/if}
          <AudioButton text={w.ko} size={34} />
        </div>
        <div class="word-ko">{w.ko}</div>
        <RomanizationLine text={w.romanization} />
        <div class="word-en">{w.en}</div>
        {#if w.ex}
          <div class="word-ex-line">
            <div class="exl-ko">{w.ex.ko}</div>
            {#if w.ex.en}<div class="exl-en">{w.ex.en}</div>{/if}
          </div>
        {/if}
        {#if (w.ex && w.ex.note) || hintFor(w.ko)}
          <details class="word-more">
            <summary>왜 · Why</summary>
            {#if w.ex && w.ex.note}<div class="ex-note">{w.ex.note}</div>{/if}
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
  /* Several words per screen, each a small designed card: colored part-of-speech
     spine, the Korean large, and the example sentence visible by default so the
     card teaches instead of hiding its material behind a disclosure. */
  .word-list { display: grid; gap: 12px; }
  .word { display: grid; justify-items: start; text-align: left; gap: 4px;
    padding: 13px 16px 12px; border-radius: var(--radius); background: var(--surface);
    border: 1px solid var(--border); border-left: 4px solid var(--border-2); box-shadow: var(--shadow-1); }
  .word-head { justify-self: stretch; display: flex; align-items: center; justify-content: space-between; gap: 8px; }
  .word-pos { font-size: 10px; font-weight: 850; letter-spacing: .1em; text-transform: uppercase;
    padding: 3px 10px; border-radius: 999px; background: var(--surface-2); color: var(--ink-3); white-space: nowrap; }
  .word.pos-verb { border-left-color: var(--type-word); }
  .word.pos-verb .word-pos { background: var(--green-soft); color: var(--green-dark); }
  .word.pos-noun { border-left-color: var(--type-expression); }
  .word.pos-noun .word-pos { background: rgba(47,111,176,.12); color: #245A94; }
  .word.pos-adj { border-left-color: var(--type-pattern); }
  .word.pos-adj .word-pos { background: rgba(124,92,255,.12); color: #5B41CF; }
  .word.pos-adv { border-left-color: var(--type-grammar); }
  .word.pos-adv .word-pos { background: rgba(199,123,26,.14); color: #96590F; }
  .word-ko { font-family: var(--serif-ko); font-size: clamp(25px, 7vw, 31px); font-weight: 650;
    line-height: 1.15; letter-spacing: -.01em; word-break: keep-all; margin-top: -3px; }
  .word-en { font-size: 16px; font-weight: 650; color: var(--ink); text-wrap: pretty; }
  .word-ex-line { justify-self: stretch; margin-top: 5px; padding: 9px 12px; border-radius: 10px;
    background: var(--surface-2); display: grid; gap: 1px; }
  .exl-ko { font-size: 15px; font-weight: 600; color: var(--ink); line-height: 1.5; word-break: keep-all; }
  .exl-en { font-size: 12.5px; color: var(--ink-2); line-height: 1.45; }
  .kp-n { width: 22px; height: 22px; flex: none; display: grid; place-items: center; border-radius: 999px; background: var(--primary-wash); color: var(--accent-ink); font-size: 12px; font-weight: 850; }
  .word-top { display: flex; align-items: center; gap: 8px; }
  .word-top .word-ko { font-size: 19px; font-weight: 800; font-family: var(--sans); margin-top: 0; }
  .word-more { padding-top: 5px; justify-self: stretch; text-align: left; }
  .word-more summary { cursor: pointer; color: var(--accent-ink); font-size: 12px; font-weight: 800; }
  .word-more[open] summary { margin-bottom: 6px; }
  .word-ex { padding: 2px 0 0; display: grid; gap: 3px; }
  .word-ex span { color: var(--ink-3); font-size: 13px; }
  .ex-ko { font-size: 15px; font-weight: 600; }
  .ex-en { font-size: 13px; color: var(--ink-2); }
  .ex-note { font-size: 12.5px; color: var(--ink-2); line-height: 1.55; word-break: keep-all; }
  .ex-vs { margin-top: 8px; padding: 8px 10px; border-radius: 8px; background: var(--primary-wash);
    color: var(--accent-ink); font-size: 12.5px; font-weight: 700; line-height: 1.45; word-break: keep-all; }
  .ex-note + .ex-vs { margin-top: 8px; }
</style>
