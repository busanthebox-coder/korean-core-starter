<script>
  import { layerProgressLabel } from '../curriculumStructure.js';

  export let chapter;
  export let prerequisites = [];

  $: track = chapter?.curriculumTrack || null;
  $: layers = chapter?.learningLayers || [];
  $: exitTask = chapter?.exitTask || null;
  $: naturalWhy = chapter?.naturalWhy || null;
</script>

{#if track || layers.length || exitTask}
  <section class="curriculum-panel">
    {#if track}
      <div class="track">
        <span>{track.cefr}</span>
        <div>
          <strong>{track.label}</strong>
          <p>{track.description}</p>
        </div>
      </div>
    {/if}

    {#if layers.length}
      <div class="layers" aria-label="Chapter learning layers">
        {#each layers as layer}
          <div class="layer l-{layer.id}">
            <span>{layer.label}</span>
            <strong>{layerProgressLabel(layer)}</strong>
            <p>{layer.purpose}</p>
          </div>
        {/each}
      </div>
    {/if}

    {#if prerequisites.length}
      <div class="prereq">
        <span>Prerequisites</span>
        <div>
          {#each prerequisites as item}
            <b>Ch {item.number} · {item.title}</b>
          {/each}
        </div>
      </div>
    {/if}

    {#if exitTask}
      <div class="exit">
        <div class="exit-head">
          <span>Can-do task</span>
          <strong>{exitTask.canDo}</strong>
        </div>
        <p>{exitTask.prompt}</p>
        {#if exitTask.sampleAnswer}
          <div class="sample">
            <span>Sample answer</span>
            <b>{exitTask.sampleAnswer.ko}</b>
            {#if exitTask.sampleAnswer.en}<em>{exitTask.sampleAnswer.en}</em>{/if}
          </div>
        {/if}
        {#if exitTask.checklist?.length}
          <ul>
            {#each exitTask.checklist as item}<li>{item}</li>{/each}
          </ul>
        {/if}
      </div>
    {/if}

    {#if naturalWhy}
      <div class="natural-why">
        <div class="nw-head">
          <span>Natural why</span>
          <strong>{naturalWhy.title}</strong>
          {#if naturalWhy.todayScene}<p>{naturalWhy.todayScene}</p>{/if}
        </div>

        <div class="compare">
          {#if naturalWhy.lessNatural}
            <div class="speech less">
              <span>Less natural</span>
              <b>{naturalWhy.lessNatural.ko}</b>
              {#if naturalWhy.lessNatural.en}<em>{naturalWhy.lessNatural.en}</em>{/if}
            </div>
          {/if}
          {#if naturalWhy.natural}
            <div class="speech better">
              <span>Natural</span>
              <b>{naturalWhy.natural.ko}</b>
              {#if naturalWhy.natural.en}<em>{naturalWhy.natural.en}</em>{/if}
            </div>
          {/if}
        </div>

        {#if naturalWhy.why}<p class="why">{naturalWhy.why}</p>{/if}

        {#if naturalWhy.koreanSense?.length}
          <div class="mini-block">
            <span>Korean sense</span>
            <ul>{#each naturalWhy.koreanSense as item}<li>{item}</li>{/each}</ul>
          </div>
        {/if}

        {#if naturalWhy.nativeCorrections?.length}
          <div class="mini-block">
            <span>Native correction pattern</span>
            <div class="corrections">
              {#each naturalWhy.nativeCorrections as item}
                <div><s>{item.from}</s><b>{item.to}</b></div>
              {/each}
            </div>
          </div>
        {/if}

        {#if naturalWhy.practiceFrame || naturalWhy.practiceExamples?.length}
          <div class="mini-block">
            <span>Make your sentence</span>
            {#if naturalWhy.practiceFrame}<div class="frame">{naturalWhy.practiceFrame}</div>{/if}
            {#if naturalWhy.practiceExamples?.length}
              <div class="examples">{#each naturalWhy.practiceExamples as item}<b>{item}</b>{/each}</div>
            {/if}
          </div>
        {/if}

        {#if naturalWhy.askNative?.length}
          <div class="mini-block ask-native">
            <span>Ask a native</span>
            <div>{#each naturalWhy.askNative as item}<b>{item}</b>{/each}</div>
          </div>
        {/if}
      </div>
    {/if}
  </section>
{/if}

<style>
  .curriculum-panel { display: grid; gap: 12px; padding: 16px; border-radius: var(--radius); background: #fff;
    border: 1px solid var(--border); border-left: 4px solid var(--green); box-shadow: var(--shadow-1); }
  .track { display: grid; grid-template-columns: auto 1fr; gap: 12px; align-items: start; }
  .track > span { width: 42px; height: 42px; display: grid; place-items: center; border-radius: 999px; background: var(--green);
    color: #fff; font-size: 13px; font-weight: 900; }
  .track strong { font-size: 18px; }
  .track p { margin: 2px 0 0; color: var(--ink-2); font-size: 13px; line-height: 1.45; }
  .layers { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 8px; }
  .layer { display: grid; gap: 3px; min-height: 104px; padding: 11px; border-radius: 12px; background: var(--surface-2); border: 1px solid var(--border); }
  .layer span, .prereq > span, .exit-head span, .sample span { font-size: 10px; font-weight: 850; letter-spacing: .14em; text-transform: uppercase; }
  .layer span { color: var(--ink-3); }
  .layer strong { font-size: 13px; }
  .layer p { margin: 0; color: var(--ink-2); font-size: 12px; line-height: 1.35; }
  .l-core { border-left: 3px solid var(--green); }
  .l-expand { border-left: 3px solid var(--accent); }
  .l-reference { border-left: 3px solid var(--type-pattern); }
  .prereq { display: grid; gap: 6px; padding: 12px; border-radius: 12px; background: #f7f5ef; }
  .prereq > span { color: var(--ink-3); }
  .prereq div { display: flex; flex-wrap: wrap; gap: 6px; }
  .prereq b { padding: 5px 9px; border-radius: 999px; background: #fff; border: 1px solid var(--border); font-size: 12px; }
  .exit { display: grid; gap: 8px; padding: 14px; border-radius: 12px; background: #f2f8f4; border: 1px solid rgba(36,119,68,.22); }
  .exit-head { display: grid; gap: 2px; }
  .exit-head span, .sample span { color: var(--green-dark); }
  .exit-head strong { font-size: 15px; line-height: 1.35; }
  .exit p { margin: 0; color: var(--ink-2); line-height: 1.5; }
  .sample { display: grid; gap: 2px; padding: 10px 12px; border-radius: 10px; background: #fff; border: 1px solid var(--border); }
  .sample b { font-size: 17px; }
  .sample em { color: var(--ink-2); font-style: normal; font-size: 13px; }
  .exit ul { margin: 0; padding-left: 18px; display: grid; gap: 4px; color: var(--ink-2); font-size: 13px; line-height: 1.4; }
  .natural-why { display: grid; gap: 12px; padding: 16px; border-radius: 12px; background: #fffaf0;
    border: 1px solid #f0dfbd; border-left: 4px solid #cf7a22; }
  .nw-head { display: grid; gap: 4px; }
  .nw-head span, .mini-block > span, .speech span { font-size: 10px; font-weight: 850; letter-spacing: .14em; text-transform: uppercase; color: #a35b14; }
  .nw-head strong { font-size: 17px; line-height: 1.35; }
  .nw-head p, .why { margin: 0; color: var(--ink-2); line-height: 1.55; }
  .compare { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 8px; }
  .speech { display: grid; gap: 3px; padding: 11px 12px; border-radius: 10px; background: #fff; border: 1px solid var(--border); }
  .speech.less { border-left: 3px solid #cc4b37; }
  .speech.better { border-left: 3px solid var(--green); }
  .speech b { font-size: 17px; }
  .speech em { color: var(--ink-2); font-style: normal; font-size: 13px; }
  .mini-block { display: grid; gap: 7px; }
  .mini-block ul { margin: 0; padding-left: 18px; color: var(--ink-2); line-height: 1.45; }
  .corrections { display: grid; gap: 6px; }
  .corrections div { display: grid; gap: 3px; padding: 9px 11px; border-radius: 9px; background: #fff; border: 1px solid var(--border); }
  .corrections s { color: #9a4a3b; text-decoration-thickness: 2px; }
  .corrections b { color: var(--green-dark); }
  .frame { padding: 9px 11px; border-radius: 9px; background: #fff; border: 1px dashed #d6a35e; font-weight: 850; }
  .examples, .ask-native div { display: flex; flex-wrap: wrap; gap: 6px; }
  .examples b, .ask-native b { padding: 7px 9px; border-radius: 999px; background: #fff; border: 1px solid var(--border); font-size: 12px; }
  @media (max-width: 720px) { .layers { grid-template-columns: 1fr; } }
  @media (max-width: 720px) { .compare { grid-template-columns: 1fr; } }
</style>
