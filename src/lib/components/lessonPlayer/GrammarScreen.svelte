<script>
  import AudioButton from '../AudioButton.svelte';
  import RomanizationLine from '../RomanizationLine.svelte';

  export let kind = 'grammar';
  export let data = {};

  $: title = data?.title ? data.title.split('—')[0].trim() : '';
  $: strip = title.split(' ')[0] || '';
</script>

{#if kind === 'grammar'}
  <div class="g-strip" aria-hidden="true">{strip}</div>
  <h2 class="screen-h grammar">{title}</h2>
  {#if data.func}<p class="g-func">{data.func}</p>
  {:else if data.mentalModel}<p class="mm"><i class="ti ti-bulb"></i> {data.mentalModel}</p>{/if}

  {#if data.formTable?.length}
    <div class="g-table">
      <span class="g-cap">Form</span>
      {#each data.formTable as r}
        <div class="gt-row"><div class="gt-when">{r.when}</div><div class="gt-add">{r.add}</div><div class="gt-ex">{r.ex}</div></div>
      {/each}
    </div>
  {/if}

  <div class="g-examples">
    {#each (data.examples || []).slice(0, 4) as ex}
      <div class="g-ex">
        <div class="g-ko">{ex.ko} <AudioButton text={ex.ko} size={18} /></div>
        <RomanizationLine text={ex.romanization} />
        <div class="g-en">{ex.en}</div>
        {#if ex.note}<div class="g-note">↳ {ex.note}</div>{/if}
      </div>
    {/each}
  </div>

  {#if data.keyPoint}
    <div class="g-key"><div class="gk-label"><i class="ti ti-key" aria-hidden="true"></i> {data.keyPoint.label}</div><p>{data.keyPoint.body}</p></div>
  {/if}
  {#if data.pronunciation}
    <p class="g-pron"><i class="ti ti-volume" aria-hidden="true"></i> <b>Pronunciation.</b> {data.pronunciation}</p>
  {/if}
  {#if data.drill}
    <div class="g-drill">
      <div class="gd-label"><i class="ti ti-pencil" aria-hidden="true"></i> Practice — {data.drill.instruction}</div>
      {#if data.drill.model}<div class="gd-model">{data.drill.model}</div>{/if}
      {#if data.drill.items?.length}<ul class="gd-items">{#each data.drill.items as it}<li>{it}</li>{/each}</ul>{/if}
    </div>
  {/if}
  {#if data.englishSpeakerPitfall}
    <div class="pitfall"><i class="ti ti-alert-triangle"></i> <b>{data.englishSpeakerPitfall.wrong}</b> → {data.englishSpeakerPitfall.right}</div>
  {/if}
{:else}
  <h2 class="screen-h grammar">Grammar focus</h2>
  <div class="gf-list">{#each data as g}<div class="gf"><strong>{g.hangul}</strong><span>{g.plainEnglish}</span></div>{/each}</div>
{/if}

<style>
  .g-strip { position: absolute; right: -8px; bottom: -34px; font-family: var(--serif-ko); font-weight: 700;
    font-size: 150px; line-height: 1; color: var(--ink); opacity: .05; pointer-events: none; }
  .mm { margin: 0; font-size: 14px; line-height: 1.6; color: var(--ink-2); }
  .mm :global(i), .pitfall :global(i) { color: var(--gold); margin-right: 4px; }
  .g-examples { display: grid; gap: 8px; }
  .g-ex { background: var(--surface-2); border-radius: var(--r-1); padding: 11px 13px; display: grid; gap: 2px; }
  .g-ko { font-size: 18px; font-weight: 730; display: flex; align-items: center; gap: 7px; }
  .g-en { font-size: 14px; color: var(--ink-2); }
  .g-note { font-size: 12px; color: var(--ink-3); }
  .pitfall { font-size: 13px; line-height: 1.6; color: #9a3324; background: var(--danger-soft); border-radius: var(--r-1); padding: 10px 12px; }
  .pitfall :global(i) { color: var(--danger); }
  .g-func { margin: 0; font-size: 15px; line-height: 1.65; color: var(--ink); }
  .g-cap { font-size: 10px; font-weight: 800; letter-spacing: .1em; text-transform: uppercase; color: var(--ink-3); }
  .g-table { display: grid; gap: 6px; padding: 12px 13px; border: 1px solid var(--border); border-radius: var(--r-1); background: var(--surface); }
  .gt-row { display: grid; grid-template-columns: 1fr auto; gap: 4px 12px; align-items: baseline; padding: 7px 0; border-top: 1px solid var(--border); }
  .gt-row:first-of-type { border-top: 0; }
  .gt-when { font-size: 13px; color: var(--ink-2); }
  .gt-add { font-size: 17px; font-weight: 800; color: var(--accent-ink); }
  .gt-ex { grid-column: 1 / -1; font-size: 14px; color: var(--ink); }
  .g-key { background: var(--primary-wash); border-radius: var(--r-1); padding: 12px 13px; }
  .gk-label { font-size: 12px; font-weight: 850; color: var(--accent-ink); margin-bottom: 5px; }
  .gk-label :global(i) { margin-right: 4px; }
  .g-key p { margin: 0; font-size: 13px; line-height: 1.65; color: var(--ink); }
  .g-pron { margin: 0; font-size: 13px; line-height: 1.6; color: var(--ink-2); }
  .g-pron :global(i) { color: var(--ink-3); margin-right: 4px; }
  .g-drill { background: var(--green-soft); border-radius: var(--r-1); padding: 12px 13px; display: grid; gap: 8px; }
  .gd-label { font-size: 12px; font-weight: 850; color: var(--green-dark); }
  .gd-label :global(i) { margin-right: 4px; }
  .gd-model { font-size: 14px; color: var(--ink); }
  .gd-items { margin: 0; padding-left: 18px; display: grid; gap: 5px; font-size: 14px; color: var(--ink); }
  .gf-list { display: grid; gap: 8px; }
  .gf { padding: 11px 14px; border-radius: var(--r-1); background: var(--surface-2); border-left: 4px solid var(--gold); }
  .gf strong { margin-right: 8px; color: var(--accent-ink); }
  .gf span { color: var(--ink-2); }
</style>
