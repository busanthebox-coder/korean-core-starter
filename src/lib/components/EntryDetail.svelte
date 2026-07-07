<script>
  import AudioButton from './AudioButton.svelte';
  import EntryConjugationSections from './EntryConjugationSections.svelte';
  import EntryRootFamilies from './EntryRootFamilies.svelte';
  import RomanizationLine from './RomanizationLine.svelte';
  import { findEntry, findGrammar } from '../data.js';
  import { reviews } from '../srs.js';

  export let entry;
  $: inDeck = !!$reviews[entry.id];

  const TYPE_LABEL = { word: 'Word', expression: 'Expression', pattern: 'Pattern' };
  const tipText = (t) => (typeof t === 'string' ? t : [t.title, t.body, t.note].filter(Boolean).join(' — '));

  // Break a long explanation into individual sentences (don't split inside quotes/parens).
  const sentences = (text) =>
    (text || '').split(/(?<=[.?!])\s+(?=[A-Z가-힣"])/).map((s) => s.trim()).filter(Boolean);
  // Split a sentence into Korean / non-Korean runs so Korean can be highlighted.
  const splitKo = (text) =>
    text.split(/(\p{sc=Hangul}+)/u).filter((s) => s !== '').map((s) => ({ s, ko: /\p{sc=Hangul}/u.test(s) }));

  $: usage = entry.usagePhrases || [];
  $: examples = entry.examples || [];
  $: tips = entry.conjugationTips || [];
  $: mistakes = entry.commonMistakes || [];
  $: related = (entry.relatedPatternIds || []).map(findEntry).filter(Boolean);
  $: grammarLinks = (entry.grammarIds || []).map(findGrammar).filter(Boolean);

  // Nuance display: structured facets (핵심/비슷한말/활용/함정 …) when authored,
  // else auto-format the long string into short 2-sentence paragraphs with a lead.
  // Both highlight Korean terms via splitKo so the eye has anchors.
  $: structuredNuance = Array.isArray(entry.structuredNuance) && entry.structuredNuance.length ? entry.structuredNuance : null;
  function nuanceParagraphs(text) {
    const ss = sentences(text);
    const out = [];
    for (let i = 0; i < ss.length; i += 2) out.push(ss.slice(i, i + 2).join(' '));
    return out.length ? out : (text ? [text] : []);
  }
  $: nParas = !structuredNuance && entry.nuance ? nuanceParagraphs(entry.nuance) : [];
</script>

<article class="detail">
  <div class="hero t-{entry.type}">
    <span class="badge">{TYPE_LABEL[entry.type] || entry.type}</span>
    <div class="hero-ko">{entry.hangul}<AudioButton text={entry.hangul} size={44} /></div>
    <RomanizationLine text={entry.romanization} />
    <p class="hero-en">{entry.english}</p>
    <div class="chips">
      {#if entry.level}<span class="chip">{entry.level}</span>{/if}
      {#if entry.partOfSpeech}<span class="chip">{entry.partOfSpeech}</span>{/if}
      {#each entry.topic || [] as t}<span class="chip soft">{t}</span>{/each}
    </div>
    <button class="addrev" class:on={inDeck} on:click={() => reviews.add(entry.id)} disabled={inDeck}>
      {inDeck ? '✓ In your review deck' : '+ Add to review'}
    </button>
  </div>

  <EntryConjugationSections {entry} />

  {#if usage.length}
    <section>
      <div class="sec-head"><span class="dot" />Usage</div>
      <div class="lines">
        {#each usage as p}
          <div class="line-card">
            <div class="lko">{p.ko}<AudioButton text={p.ko} size={26} /></div>
            <RomanizationLine text={p.romanization} />
            <div class="len">{p.en}</div>
            {#if p.note}<div class="note">{p.note}</div>{/if}
          </div>
        {/each}
      </div>
    </section>
  {/if}

  {#if examples.length}
    <section>
      <div class="sec-head"><span class="dot" />Examples</div>
      <div class="lines">
        {#each examples as p}
          <div class="line-card">
            <div class="lko">{p.ko}<AudioButton text={p.ko} size={26} /></div>
            <RomanizationLine text={p.romanization} />
            <div class="len">{p.en}</div>
            {#if p.note}<div class="note">{p.note}</div>{/if}
          </div>
        {/each}
      </div>
    </section>
  {/if}

  {#if tips.length}
    <details class="callout tip">
      <summary class="callout-head"><span class="ch-l"><i class="ti ti-tool" aria-hidden="true"></i> Conjugation tips</span><i class="ti ti-chevron-down c-chev" aria-hidden="true"></i></summary>
      <ul>{#each tips as t}<li>{tipText(t)}</li>{/each}</ul>
    </details>
  {/if}

  {#if structuredNuance || entry.nuance}
    <details class="callout nuance">
      <summary class="callout-head"><span class="ch-l"><i class="ti ti-search" aria-hidden="true"></i> Nuance</span><i class="ti ti-chevron-down c-chev" aria-hidden="true"></i></summary>
      <div class="nz">
        {#if structuredNuance}
          <div class="facets">
            {#each structuredNuance as f}
              <div class="facet">
                <div class="facet-tag"><span class="ft-ko">{f.k}</span>{#if f.e}<span class="ft-en">{f.e}</span>{/if}</div>
                <div class="facet-body">
                  <p>{#each splitKo(f.t) as p}{#if p.ko}<b class="ko-hl">{p.s}</b>{:else}{p.s}{/if}{/each}</p>
                  {#if f.chips && f.chips.length}<div class="cj">{#each f.chips as c}<span class="cjchip">{c}</span>{/each}</div>{/if}
                </div>
              </div>
            {/each}
          </div>
        {:else}
          <div class="nuance-body">
            {#each nParas as para, i}
              <p class:lead={i === 0}>{#each splitKo(para) as p}{#if p.ko}<b class="ko-hl">{p.s}</b>{:else}{p.s}{/if}{/each}</p>
            {/each}
          </div>
        {/if}
      </div>
    </details>
  {/if}

  {#if mistakes.length}
    <details class="callout warn">
      <summary class="callout-head"><span class="ch-l"><i class="ti ti-alert-triangle" aria-hidden="true"></i> Common mistakes</span><i class="ti ti-chevron-down c-chev" aria-hidden="true"></i></summary>
      <ul>{#each mistakes as m}<li>{m}</li>{/each}</ul>
    </details>
  {/if}

  {#if related.length || grammarLinks.length}
    <section>
      <div class="sec-head"><span class="dot" />Connections</div>
      <div class="conn">
        {#each related as r}<span class="conn-chip">{r.hangul}<em>{r.english}</em></span>{/each}
        {#each grammarLinks as g}<span class="conn-chip gram">{g.title || g.hangul}</span>{/each}
      </div>
    </section>
  {/if}

  <EntryRootFamilies {entry} on:openEntry />
</article>

<style>
  .detail { display: grid; gap: 24px; }

  /* Hero — editorial masthead for the entry */
  .hero { position: relative; display: grid; gap: 4px; padding: 22px 2px 22px; border-bottom: 1px solid var(--rule); }
  .hero::before { content: ''; position: absolute; left: 0; top: 0; width: 48px; height: 4px; background: var(--htype, var(--ink)); }
  .hero.t-word { --htype: var(--type-word); }
  .hero.t-expression { --htype: var(--type-expression); }
  .hero.t-pattern { --htype: var(--type-pattern); }
  .badge { justify-self: start; margin-top: 8px; font-size: 10px; font-weight: 750; text-transform: uppercase;
    letter-spacing: .18em; color: var(--htype, var(--ink-2)); }
  .hero-ko { display: flex; align-items: center; gap: 14px; flex-wrap: wrap; margin-top: 8px;
    font-family: var(--serif-ko); font-size: 50px; font-weight: 600; color: var(--ink); line-height: 1.05; letter-spacing: -.01em; }
  .hero-en { margin: 8px 0 0; font-family: var(--serif); font-style: italic; font-weight: 400; font-size: 24px; color: var(--ink); }
  .chips { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 12px; }
  .chip { font-size: 10px; font-weight: 700; letter-spacing: .1em; text-transform: uppercase; padding: 3px 9px;
    border-radius: 999px; border: 1px solid var(--border); color: var(--ink-3); }
  .chip.soft { border-color: transparent; background: var(--surface-2); color: var(--ink-2); }
  .addrev { justify-self: start; margin-top: 14px; padding: 9px 16px; border-radius: 8px; background: var(--ink); color: #fff;
    font-weight: 720; font-size: 13px; transition: opacity .12s; }
  .addrev:hover { opacity: .9; }
  .addrev.on { background: transparent; color: var(--type-word); border: 1px solid var(--type-word); cursor: default; }

  /* Section headers: tracked label + hairline rule */
  section { display: grid; gap: 13px; }
  .sec-head { display: flex; align-items: center; gap: 12px; font-size: 11px; font-weight: 750; letter-spacing: .16em;
    text-transform: uppercase; color: var(--ink-3); }
  .sec-head::after { content: ''; flex: 1; height: 1px; background: var(--border); }
  .dot { display: none; }

  /* Collapsible callouts — essence stays open, deep notes fold away */
  .callout { border: 1px solid var(--border); border-left: 3px solid var(--cl, var(--border-2)); border-radius: var(--r-1); background: var(--surface); line-height: 1.62; }
  .callout.tip { --cl: var(--blue); }
  .callout.nuance { --cl: var(--ink-3); }
  .callout.warn { --cl: var(--accent); }
  .callout > summary.callout-head { cursor: pointer; list-style: none; display: flex; align-items: center; justify-content: space-between; gap: 10px;
    padding: 13px 15px; font-size: 11px; font-weight: 750; letter-spacing: .14em; text-transform: uppercase; color: var(--ink-3); }
  .callout > summary.callout-head::-webkit-details-marker { display: none; }
  .ch-l { display: inline-flex; align-items: center; gap: 8px; }
  .ch-l i { font-size: 15px; color: var(--cl, var(--ink-3)); }
  .c-chev { font-size: 13px; color: var(--ink-3); transition: transform .2s; }
  .callout[open] .c-chev { transform: rotate(180deg); }
  .callout p { margin: 0; color: var(--ink); }
  .ko-hl { color: var(--accent-ink); font-weight: 800; }
  .callout > ul { margin: 0; padding: 0 15px 15px 31px; display: grid; gap: 5px; }
  .callout > .nz { padding: 0 15px 15px; }

  /* Nuance — auto-formatted paragraphs (fallback) */
  .nz { min-width: 0; flex: 1; }
  .nuance-body p { margin: 0 0 9px; line-height: 1.66; color: var(--ink-2); }
  .nuance-body p:last-child { margin-bottom: 0; }
  .nuance-body p.lead { color: var(--ink); font-weight: 500; font-size: 1.02em; line-height: 1.55;
    border-left: 2px solid var(--accent); padding-left: 11px; margin-bottom: 12px; }
  /* Nuance — structured facets */
  .facets { display: grid; gap: 13px; margin-top: 2px; }
  .facet { display: grid; grid-template-columns: 86px 1fr; gap: 13px; }
  .facet + .facet { border-top: 1px solid var(--border); padding-top: 13px; }
  .facet-tag { display: flex; flex-direction: column; gap: 1px; padding-top: 1px; }
  .ft-ko { font-family: var(--serif); font-size: 15px; font-weight: 600; color: var(--ink); line-height: 1.15; }
  .ft-en { font-size: 9px; letter-spacing: .12em; text-transform: uppercase; color: var(--accent-ink); font-weight: 750; }
  .facet-body p { margin: 0; line-height: 1.6; color: var(--ink-2); }
  .cj { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 9px; }
  .cjchip { background: var(--surface); border: 1px solid var(--ink); border-radius: 6px; padding: 4px 9px;
    font-size: 13px; font-weight: 600; color: var(--ink); }
  @media (max-width: 480px) { .facet { grid-template-columns: 1fr; gap: 4px; }
    .facet-tag { flex-direction: row; align-items: baseline; gap: 8px; } }

  /* Usage / examples — list rows, hairline separators (no boxes) */
  .lines { display: grid; }
  .line-card { padding: 13px 2px 14px; border-bottom: 1px solid var(--border); }
  .lines .line-card:last-child { border-bottom: 0; padding-bottom: 0; }
  .lko { font-size: 20px; font-weight: 740; display: flex; align-items: center; gap: 8px; color: var(--ink); }
  .len { color: var(--ink); margin-top: 3px; }
  .note { color: var(--ink-3); font-size: 13px; margin-top: 4px; }

  /* Connections — hairline tags */
  .conn { display: flex; flex-wrap: wrap; gap: 8px; }
  .conn-chip { display: inline-flex; align-items: baseline; gap: 6px; padding: 6px 12px; border-radius: 999px;
    border: 1px solid var(--border); color: var(--ink); font-weight: 750; }
  .conn-chip em { font-style: normal; font-weight: 500; color: var(--ink-3); font-size: 13px; }
  .conn-chip.gram { color: var(--type-grammar); }
</style>
