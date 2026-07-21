<script>
  import AudioButton from '../AudioButton.svelte';
  import RomanizationLine from '../RomanizationLine.svelte';

  export let kind = 'grammar';
  export let data = {};

  $: title = data?.title ? data.title.split('—')[0].trim() : '';
  $: subtitle = data?.title && data.title.includes('—') ? data.title.split('—').slice(1).join('—').trim() : '';
  $: strip = title.split(' ')[0] || '';
  // The form the learner has to produce is the point of the screen, so it leads.
  // Everything that explains it sits underneath, and the long prose folds away.
  $: forms = data?.formTable || [];
  // A mental model is often a full paragraph. Its opening sentence is the idea;
  // the rest is elaboration, so only the idea gets the lead treatment.
  function splitLead(text) {
    const clean = String(text || '').trim();
    if (!clean) return { lead: '', rest: '' };
    const at = clean.search(/(?<=[.!?])\s/);
    if (at < 0 || at > 160) return { lead: clean, rest: '' };
    return { lead: clean.slice(0, at + 1).trim(), rest: clean.slice(at + 1).trim() };
  }
  $: model = splitLead(data?.mentalModel);
  $: examples = (data?.examples || []).slice(0, 4);
</script>

{#if kind === 'grammar'}
  <div class="g-strip" aria-hidden="true">{strip}</div>

  <header class="g-head">
    <h2 class="g-title">{title}</h2>
    {#if subtitle}<p class="g-sub">{subtitle}</p>{/if}
  </header>

  {#if forms.length}
    <div class="forms">
      {#each forms as r}
        <div class="form">
          <span class="form-when">{r.when}</span>
          <span class="form-add">{r.add}</span>
          {#if r.ex}<p class="form-ex">{r.ex}</p>{/if}
        </div>
      {/each}
    </div>
  {:else if model.lead}
    <p class="lead">{model.lead}</p>
    {#if model.rest}<p class="lead-rest">{model.rest}</p>{/if}
  {/if}

  {#if examples.length}
    <section class="block">
      <span class="cap">예문 · Examples</span>
      <div class="exs">
        {#each examples as ex}
          <div class="ex">
            <div class="ex-ko">{ex.ko}<AudioButton text={ex.ko} size={20} /></div>
            <RomanizationLine text={ex.romanization} />
            <div class="ex-en">{ex.en}</div>
            {#if ex.note}<p class="ex-note">{ex.note}</p>{/if}
          </div>
        {/each}
      </div>
    </section>
  {/if}

  {#if data.drill}
    <section class="drill">
      <span class="cap accent">연습 · Try it</span>
      <p class="drill-inst">{data.drill.instruction}</p>
      {#if data.drill.model}<p class="drill-model">{data.drill.model}</p>{/if}
      {#if data.drill.items?.length}
        <ul class="drill-items">{#each data.drill.items as it}<li>{it}</li>{/each}</ul>
      {/if}
    </section>
  {/if}

  {#if data.englishSpeakerPitfall}
    <section class="trap">
      <span class="cap warn">함정 · Common slip</span>
      <p class="trap-line"><span class="x">✕</span> {data.englishSpeakerPitfall.wrong}</p>
      <p class="trap-line"><span class="o">✓</span> {data.englishSpeakerPitfall.right}</p>
      {#if data.englishSpeakerPitfall.explanation}
        <p class="trap-why">{data.englishSpeakerPitfall.explanation}</p>
      {/if}
    </section>
  {/if}

  {#if data.func || data.keyPoint || data.pronunciation}
    <details class="more">
      <summary><span>왜 그런가 · The full explanation</span><span class="chev" aria-hidden="true">⌄</span></summary>
      <div class="more-body">
        {#if data.func}<p>{data.func}</p>{/if}
        {#if data.keyPoint}
          <div class="kp"><b>{data.keyPoint.label}</b><p>{data.keyPoint.body}</p></div>
        {/if}
        {#if data.pronunciation}
          <div class="kp"><b>발음 · Pronunciation</b><p>{data.pronunciation}</p></div>
        {/if}
      </div>
    </details>
  {/if}
{:else}
  <h2 class="g-title">Grammar focus</h2>
  <div class="gf-list">{#each data as g}<div class="gf"><strong>{g.hangul}</strong><span>{g.plainEnglish}</span></div>{/each}</div>
{/if}

<style>
  .g-strip { position: absolute; right: -8px; bottom: -34px; font-family: var(--serif-ko); font-weight: 700;
    font-size: 150px; line-height: 1; color: var(--ink); opacity: .04; pointer-events: none; }

  .g-head { display: grid; gap: 5px; }
  .g-title { margin: 0; font-family: var(--serif-ko); font-size: clamp(28px, 8vw, 34px); font-weight: 600;
    line-height: 1.12; letter-spacing: -.01em; color: var(--ink); text-wrap: balance; }
  .g-sub { margin: 0; color: var(--ink-2); font-size: 14.5px; line-height: 1.5; }

  /* The forms carry the screen: condition small, the Korean you must produce large. */
  .forms { display: grid; }
  .form { padding: 16px 0; border-top: 1px solid var(--border); display: grid; gap: 4px; }
  .form:first-child { border-top: 0; padding-top: 6px; }
  .form-when { font-size: 11px; font-weight: 800; letter-spacing: .09em; text-transform: uppercase;
    line-height: 1.45; color: var(--ink-3); }
  .form-add { font-family: var(--serif-ko); font-size: clamp(26px, 7.5vw, 32px); font-weight: 650;
    line-height: 1.15; color: var(--accent-ink); letter-spacing: -.01em; word-break: keep-all; }
  .form-ex { margin: 3px 0 0; font-size: 14.5px; line-height: 1.6; color: var(--ink-2); word-break: keep-all; }

  .lead { margin: 0; font-family: var(--serif-ko); font-size: 20px; font-weight: 600; line-height: 1.4;
    color: var(--ink); border-left: 3px solid var(--accent); padding-left: 14px; word-break: keep-all; }
  .lead-rest { margin: 0; font-size: 14.5px; line-height: 1.65; color: var(--ink-2); word-break: keep-all; }

  .block { display: grid; gap: 10px; }
  .cap { font-size: 10px; font-weight: 850; letter-spacing: .14em; text-transform: uppercase; color: var(--ink-3); }
  .cap.accent { color: var(--green-dark); }
  .cap.warn { color: var(--accent-ink); }

  .exs { display: grid; }
  .ex { padding: 13px 0; border-top: 1px solid var(--border); display: grid; gap: 2px; }
  .ex:first-child { border-top: 0; padding-top: 0; }
  .ex-ko { font-family: var(--serif-ko); font-size: 21px; font-weight: 600; line-height: 1.3; color: var(--ink);
    display: flex; align-items: center; gap: 8px; flex-wrap: wrap; word-break: keep-all; }
  .ex-en { font-size: 14.5px; color: var(--ink-2); margin-top: 2px; }
  .ex-note { margin: 5px 0 0; font-size: 13px; line-height: 1.55; color: var(--ink-3); word-break: keep-all; }

  .drill { display: grid; gap: 7px; padding: 15px 16px; border-radius: var(--r-1);
    background: var(--green-soft); border: 1px solid rgba(62,142,78,.16); }
  .drill-inst { margin: 0; font-size: 14.5px; line-height: 1.55; color: var(--ink); }
  .drill-model { margin: 0; font-size: 14px; color: var(--ink-2); }
  .drill-items { margin: 4px 0 0; padding-left: 18px; display: grid; gap: 6px; font-size: 15px; color: var(--ink); }

  .trap { display: grid; gap: 5px; padding-left: 13px; border-left: 3px solid var(--accent); }
  .trap-line { margin: 0; font-size: 14.5px; line-height: 1.5; color: var(--ink); word-break: keep-all; }
  .trap-line .x { color: var(--accent-ink); font-weight: 800; margin-right: 4px; }
  .trap-line .o { color: var(--green-dark); font-weight: 800; margin-right: 4px; }
  .trap-why { margin: 4px 0 0; font-size: 13.5px; line-height: 1.6; color: var(--ink-2); word-break: keep-all; }

  .more { border-top: 1px solid var(--border); }
  .more > summary { cursor: pointer; list-style: none; display: flex; align-items: center; justify-content: space-between;
    gap: 10px; padding: 14px 0 0; font-size: 12px; font-weight: 800; letter-spacing: .06em; color: var(--ink-2); }
  .more > summary::-webkit-details-marker { display: none; }
  .more > summary:focus-visible { outline: 2px solid var(--accent); outline-offset: 3px; border-radius: 4px; }
  .more .chev { color: var(--ink-3); transition: transform .2s var(--ease); }
  .more[open] .chev { transform: rotate(180deg); }
  .more-body { display: grid; gap: 12px; padding-top: 11px; }
  .more-body > p { margin: 0; font-size: 14.5px; line-height: 1.65; color: var(--ink-2); }
  .kp { display: grid; gap: 4px; }
  .kp b { font-size: 13px; color: var(--ink); }
  .kp p { margin: 0; font-size: 13.5px; line-height: 1.65; color: var(--ink-2); }

  .gf-list { display: grid; gap: 8px; }
  .gf { padding: 11px 14px; border-radius: var(--r-1); background: var(--surface-2); border-left: 4px solid var(--gold); }
  .gf strong { margin-right: 8px; color: var(--accent-ink); }
  .gf span { color: var(--ink-2); }

  @media (prefers-reduced-motion: reduce) { .more .chev { transition: none; } }
</style>
