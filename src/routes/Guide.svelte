<script>
  import { guideTracks, findEntry } from '../lib/data.js';
  import AudioButton from '../lib/components/AudioButton.svelte';
  import RomanizationLine from '../lib/components/RomanizationLine.svelte';
  import EntryCard from '../lib/components/EntryCard.svelte';
  import EntryDetail from '../lib/components/EntryDetail.svelte';
  import Sheet from '../lib/components/Sheet.svelte';

  let trackId = guideTracks[0]?.id;
  let unit = null;
  let selected = null;
  $: track = guideTracks.find((t) => t.id === trackId) || guideTracks[0];

  const vocabOf = (u) => [...new Set([...(u.coreVocabularyIds || []), ...(u.linkedEntryIds || [])])].map(findEntry).filter(Boolean);
  function openUnit(u) { unit = u; window.scrollTo(0, 0); }
  function back() { unit = null; window.scrollTo(0, 0); }
  function pickTrack(id) { trackId = id; }
  $: vocab = unit ? vocabOf(unit) : [];
</script>

{#if !unit}
  <section class="guide">
    <div class="hero">
      <div class="eyebrow">Just arrived in Korea</div>
      <h1>Newcomer Guide</h1>
      <p>Survival Korean by real situation — phrases first, with the practical steps and official links you need.</p>
    </div>
    <nav class="tracks">
      {#each guideTracks as t}
        <button class:on={t.id === track.id} on:click={() => pickTrack(t.id)}>{t.letter} · {t.title}</button>
      {/each}
    </nav>
    <p class="summary">{track.summary}</p>
    <div class="unit-list">
      {#each track.units as u}
        <button class="unit-card" on:click={() => openUnit(u)}>
          <strong>{u.title}</strong><span>{u.situation}</span>
        </button>
      {/each}
    </div>
  </section>
{:else}
  <section class="guide">
    <button class="back" on:click={back}>← {track.title}</button>
    <div class="u-head"><h1>{unit.title}</h1><p class="sit">{unit.situation}</p><p class="goal">{unit.goal}</p></div>

    {#if (unit.beginnerGuide || []).length}
      <div class="bg">{#each unit.beginnerGuide as b}<div class="bg-card"><strong>{b.title}</strong><p>{b.body}</p></div>{/each}</div>
    {/if}

    {#if (unit.keyPhrases || []).length}
      <div class="block"><div class="sec-head"><span class="dot" />Key phrases</div>
        <div class="lines">{#each unit.keyPhrases as p, i}
          <div class="kp"><span class="kp-n">{i + 1}</span>
            <div class="lbody"><div class="lko">{p.ko} <AudioButton text={p.ko} size={26} /></div>
              <RomanizationLine text={p.romanization} /><div class="len">{p.en}</div>
              {#if p.note}<div class="note">{p.note}</div>{/if}</div></div>
        {/each}</div></div>
    {/if}

    {#if (unit.dialogue || []).length}
      <div class="block"><div class="sec-head"><span class="dot" />Dialogue</div>
        <div class="lines">{#each unit.dialogue as l}
          <div class="dline"><span class="spk">{l.speaker}</span>
            <div class="lbody"><div class="lko">{l.ko} <AudioButton text={l.ko} size={24} /></div>
              <RomanizationLine text={l.romanization} /><div class="len">{l.en}</div></div></div>
        {/each}</div></div>
    {/if}

    {#if vocab.length}
      <div class="block"><div class="sec-head"><span class="dot" />Vocabulary</div>
        <div class="grid">{#each vocab as e (e.id)}<EntryCard entry={e} onOpen={(x) => (selected = x)} />{/each}</div></div>
    {/if}

    {#if (unit.steps || []).length}
      <div class="block"><div class="sec-head"><span class="dot" />Steps</div>
        <ol class="steps">{#each unit.steps as s}<li>{s}</li>{/each}</ol></div>
    {/if}

    {#if unit.costs}<div class="kv"><strong>Cost</strong><span>{unit.costs}</span></div>{/if}
    {#if unit.notes}<div class="kv good"><strong>Good to know</strong><span>{unit.notes}</span></div>{/if}

    {#if (unit.checkpoints || []).length}
      <div class="checks"><strong>Before you go</strong><ul>{#each unit.checkpoints as c}<li>{c}</li>{/each}</ul></div>
    {/if}

    {#if (unit.deepLinks || []).length}
      <div class="block"><div class="sec-head"><span class="dot" />Official links</div>
        <div class="links">{#each unit.deepLinks as l}
          <a class="link" href={l.url} target="_blank" rel="noopener noreferrer">{l.label}{#if l.note} — <em>{l.note}</em>{/if}</a>
        {/each}</div></div>
    {/if}
  </section>
{/if}

<Sheet open={!!selected} onClose={() => (selected = null)}>
  {#if selected}<EntryDetail entry={selected} />{/if}
</Sheet>

<style>
  .guide { max-width: 820px; margin: 0 auto; padding: 28px; display: grid; gap: 16px; }
  .hero { display: grid; gap: 4px; }
  .eyebrow { font-size: 12px; font-weight: 850; letter-spacing: .06em; text-transform: uppercase; color: var(--green-dark); }
  h1 { margin: 2px 0; font-size: 30px; letter-spacing: -0.02em; }
  .hero p { margin: 0; color: var(--ink-3); }
  .tracks { display: flex; flex-wrap: wrap; gap: 8px; }
  .tracks button { padding: 8px 14px; border-radius: 999px; background: var(--surface-2); color: var(--ink-2); font-weight: 800; font-size: 13px; }
  .tracks button.on { background: var(--green); color: #fff; }
  .summary { margin: 0; color: var(--ink-2); }
  .unit-list { display: grid; gap: 10px; }
  .unit-card { display: grid; gap: 2px; text-align: left; padding: 15px 16px; border-radius: var(--radius); background: var(--surface);
    border: 1px solid var(--border); box-shadow: var(--shadow-1); transition: transform .1s var(--bounce), border-color .1s; }
  .unit-card:hover { transform: translateY(-2px); border-color: var(--green); }
  .unit-card strong { font-size: 16px; }
  .kp { display: grid; grid-template-columns: auto 1fr; gap: 12px; align-items: start; }
  .kp-n { width: 26px; height: 26px; flex: none; display: grid; place-items: center; border-radius: 999px;
    background: var(--green-soft); color: var(--green-dark); font-weight: 850; font-size: 13px; margin-top: 3px; }
  .unit-card span { color: var(--ink-2); font-size: 13px; }
  .back { justify-self: start; padding: 7px 14px; border-radius: 999px; background: var(--surface-2); color: var(--ink-2); font-weight: 800; }
  .u-head h1 { margin: 0; }
  .u-head .sit { margin: 2px 0 0; color: var(--ink-3); font-size: 14px; }
  .u-head .goal { margin: 4px 0 0; font-weight: 600; }
  .bg { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 10px; }
  .bg-card { padding: 14px; border-radius: 13px; background: var(--surface-2); border: 1px solid var(--border); }
  .bg-card strong { display: block; margin-bottom: 4px; }
  .bg-card p { margin: 0; color: var(--ink-2); line-height: 1.5; font-size: 14px; }
  .block { display: grid; gap: 10px; }
  .sec-head { display: flex; align-items: center; gap: 8px; font-size: 13px; font-weight: 850; }
  .dot { width: 14px; height: 4px; border-radius: 2px; background: var(--ink); box-shadow: none; }
  .lines { display: grid; gap: 10px; }
  .lbody { display: grid; gap: 2px; padding: 12px 14px; border-radius: 13px; background: var(--surface); border: 1px solid var(--border); border-left: 4px solid var(--green); }
  .dline { display: grid; grid-template-columns: auto 1fr; gap: 10px; align-items: start; }
  .spk { font-size: 11px; font-weight: 800; padding: 4px 10px; border-radius: 999px; background: var(--green-soft); color: var(--green-dark); white-space: nowrap; }
  .lko { font-size: 18px; font-weight: 730; display: flex; align-items: center; gap: 7px; }
  .len { color: var(--ink-2); }
  .note { color: var(--ink-3); font-size: 13px; }
  .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(170px, 1fr)); gap: 12px; }
  .steps { margin: 0; padding-left: 20px; display: grid; gap: 6px; color: var(--ink); }
  .kv { display: grid; gap: 2px; padding: 12px 14px; border-radius: 12px; background: var(--surface-2); }
  .kv.good { background: var(--surface-2); border: 1px solid var(--border); }
  .kv strong { font-size: 12px; text-transform: uppercase; letter-spacing: .05em; color: var(--ink-3); }
  .checks { padding: 14px 16px; border-radius: 13px; background: var(--surface); border: 1px solid var(--border); }
  .checks ul { margin: 6px 0 0; padding-left: 18px; display: grid; gap: 4px; }
  .links { display: grid; gap: 8px; }
  .link { display: inline-block; padding: 11px 14px; border-radius: 12px; background: var(--green-soft); color: var(--green-dark); font-weight: 800; }
  .link em { font-style: normal; font-weight: 600; color: var(--ink-2); }
</style>
