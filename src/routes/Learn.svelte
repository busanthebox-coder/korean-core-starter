<script>
  import { chapters, findEntry, findGrammar } from '../lib/data.js';
  import { lessonProgress, markLessonDone } from '../lib/stores.js';
  import { push } from 'svelte-spa-router';
  import EntryCard from '../lib/components/EntryCard.svelte';
  import EntryDetail from '../lib/components/EntryDetail.svelte';
  import Sheet from '../lib/components/Sheet.svelte';
  import AudioButton from '../lib/components/AudioButton.svelte';
  import RomanizationLine from '../lib/components/RomanizationLine.svelte';
  import HangulTrainer from '../lib/components/HangulTrainer.svelte';
  import GrammarReference from '../lib/components/GrammarReference.svelte';

  let view = 'path';
  let chapter = null;
  let selected = null;

  const vocabOf = (ch) => [...new Set([...(ch.coreVocabularyIds || []), ...(ch.linkedEntryIds || [])])].map(findEntry).filter(Boolean);
  const patternsOf = (ch) => (ch.patternIds || []).map(findEntry).filter(Boolean);
  const grammarOf = (ch) => (ch.grammarFocus || []).map(findGrammar).filter(Boolean);

  function openChapter(ch) { chapter = ch; view = 'chapter'; window.scrollTo(0, 0); }
  function back() { view = 'path'; chapter = null; window.scrollTo(0, 0); }

  $: vocab = chapter ? vocabOf(chapter) : [];
  $: pats = chapter ? patternsOf(chapter) : [];
  $: gram = chapter ? grammarOf(chapter) : [];

  $: doneCount = chapters.filter((c) => $lessonProgress.has(c.id)).length;
  $: pct = chapters.length ? Math.round((doneCount / chapters.length) * 100) : 0;
</script>

{#if view === 'path'}
  <section class="learn">
    <div class="learn-hero">
      <div class="eyebrow">Korean · A1–B1</div>
      <h1>Your lessons</h1>
      <p>Start with Hangul, then work down the chapters. Tap any card to open it.</p>
    </div>

    <div class="progress-card">
      <div class="pc-top"><span class="pc-label">Your progress</span><span class="pc-count">{doneCount} / {chapters.length} chapters</span></div>
      <div class="pc-bar"><span class="pc-fill" style="width:{pct}%"></span></div>
    </div>

    <button class="big-card" on:click={() => { view = 'hangul'; window.scrollTo(0, 0); }}>
      <span class="bc-ico">가</span>
      <span class="bc-main"><strong>Start here — Hangul</strong><span>Read the alphabet and build syllables.</span></span>
      <span class="chev">▸</span>
    </button>

    <div class="path">
      {#each chapters as ch}
        {#if ch.number === 12}<div class="path-divider"><span>Intermediate · B1</span></div>{/if}
        <button class="node" on:click={() => openChapter(ch)}>
          <span class="num" class:done={$lessonProgress.has(ch.id)}>{$lessonProgress.has(ch.id) ? '✓' : ch.number}</span>
          <span class="node-main"><strong>{ch.title}</strong><span>{ch.goal}</span></span>
          <span class="chev">▸</span>
        </button>
      {/each}
    </div>

    <button class="big-card" on:click={() => { view = 'grammar'; window.scrollTo(0, 0); }}>
      <span class="bc-ico gram">文</span>
      <span class="bc-main"><strong>Grammar roadmap</strong><span>Learn grammar step by step — particles, tenses, endings, connectors.</span></span>
      <span class="chev">▸</span>
    </button>
  </section>

{:else if view === 'hangul'}
  <section class="learn">
    <button class="back" on:click={back}>← Lessons</button>
    <h1 class="sub-h1">Hangul — the Korean alphabet</h1>
    <HangulTrainer />
  </section>

{:else if view === 'grammar'}
  <section class="learn">
    <button class="back" on:click={back}>← Lessons</button>
    <h1 class="sub-h1">Grammar roadmap</h1>
    <GrammarReference />
  </section>

{:else if view === 'chapter' && chapter}
  <section class="learn">
    <button class="back" on:click={back}>← Lessons</button>
    <div class="ch-head">
      <div class="eyebrow">Chapter {chapter.number}</div>
      <h1>{chapter.title}</h1>
      <p class="goal">{chapter.goal}</p>
      {#if chapter.scenario}<p class="scenario">{chapter.scenario}</p>{/if}
    </div>

    {#if (chapter.dialogue || []).length}
      <div class="block">
        <div class="sec-head"><span class="dot" />Warm-up dialogue</div>
        <div class="dlg">
          {#each chapter.dialogue as line}
            <div class="dline"><span class="spk">{line.speaker}</span>
              <div><div class="dko">{line.ko} <AudioButton text={line.ko} size={24} /></div>
                <RomanizationLine text={line.romanization} /><div class="den">{line.en}</div></div></div>
          {/each}
        </div>
      </div>
    {/if}

    {#if vocab.length}
      <div class="block"><div class="sec-head"><span class="dot v" />Vocabulary</div>
        <div class="grid">{#each vocab as e (e.id)}<EntryCard entry={e} onOpen={(x) => (selected = x)} />{/each}</div></div>
    {/if}

    {#if pats.length}
      <div class="block"><div class="sec-head"><span class="dot p" />Patterns</div>
        <div class="grid">{#each pats as e (e.id)}<EntryCard entry={e} onOpen={(x) => (selected = x)} />{/each}</div></div>
    {/if}

    {#if gram.length}
      <div class="block"><div class="sec-head"><span class="dot g" />Grammar focus</div>
        <div class="gfocus">{#each gram as g}<div class="gf"><strong>{g.hangul}</strong><span>{g.plainEnglish}</span></div>{/each}</div></div>
    {/if}

    <div class="ch-actions">
      <button class="btn3d" on:click={() => push('/practice')}>Practice this chapter</button>
      <button class="ghost" on:click={() => markLessonDone(chapter.id)}>{$lessonProgress.has(chapter.id) ? '✓ Completed' : 'Mark complete'}</button>
    </div>
  </section>
{/if}

<Sheet open={!!selected} onClose={() => (selected = null)}>
  {#if selected}<EntryDetail entry={selected} />{/if}
</Sheet>

<style>
  .learn { max-width: 1120px; margin: 0 auto; padding: 28px; display: grid; gap: 14px; }
  .learn-hero { display: grid; gap: 4px; padding: 6px 2px 16px; border-bottom: 1px solid var(--rule); }
  .eyebrow { font-size: 11px; font-weight: 750; letter-spacing: .16em; text-transform: uppercase; color: var(--ink-3); }
  h1 { margin: 9px 0 4px; font-family: var(--serif-ko); font-size: 44px; font-weight: 600; letter-spacing: -0.01em; line-height: 1.05; }
  .learn-hero p { margin: 0; color: var(--ink-3); }

  .progress-card { display: grid; gap: 9px; padding: 15px 18px; border-radius: var(--radius);
    background: var(--surface); border: 1px solid var(--border); box-shadow: var(--shadow-1); }
  .pc-top { display: flex; justify-content: space-between; align-items: baseline; }
  .pc-label { font-weight: 850; }
  .pc-count { font-weight: 800; color: var(--green-dark); font-size: 14px; }
  .pc-bar { height: 12px; border-radius: 999px; background: #fff; border: 1px solid var(--border); overflow: hidden; }
  .pc-fill { display: block; height: 100%; border-radius: 999px; background: var(--accent); transition: width .4s var(--bounce); }

  .big-card { display: flex; align-items: center; gap: 14px; text-align: left; padding: 16px 18px; border-radius: var(--radius);
    background: var(--surface); border: 1px solid var(--border); box-shadow: var(--shadow-1); }
  .big-card:hover { border-color: var(--ink); box-shadow: var(--shadow-2); transform: translateY(-1px); }
  .bc-ico { width: 50px; height: 50px; display: grid; place-items: center; border-radius: 13px; background: var(--ink); color: var(--bg); font-family: var(--serif-ko); font-size: 25px; font-weight: 700; flex: none; }
  .bc-ico.gram { background: var(--accent); }
  .bc-main { display: grid; gap: 2px; flex: 1; }
  .bc-main strong { font-family: var(--serif-ko); font-size: 18px; font-weight: 600; }
  .bc-main span { color: var(--ink-2); font-size: 14px; }
  .chev { color: var(--ink-3); }

  .path { display: grid; gap: 10px; }
  .path-divider { display: flex; align-items: center; gap: 12px; margin: 10px 2px 4px;
    font-size: 11px; font-weight: 750; letter-spacing: .16em; text-transform: uppercase; color: var(--ink-3); }
  .path-divider::before, .path-divider::after { content: ''; height: 1px; background: var(--border); flex: 1; }
  .node { display: flex; align-items: center; gap: 14px; text-align: left; padding: 14px 16px; border-radius: var(--radius);
    background: var(--surface); border: 1px solid var(--border); box-shadow: var(--shadow-1); transition: transform .1s var(--bounce), border-color .1s; }
  .node:hover { transform: translateY(-2px); border-color: var(--ink); box-shadow: var(--shadow-2); }
  .num { width: 46px; height: 46px; display: grid; place-items: center; border-radius: 999px; background: var(--surface);
    border: 1px solid var(--border-2); color: var(--ink); font-family: var(--serif); font-weight: 600; font-size: 18px; flex: none; }
  .num.done { background: var(--ink); color: var(--bg); border-color: var(--ink); }
  .node-main { display: grid; gap: 2px; flex: 1; }
  .node-main strong { font-family: var(--serif-ko); font-size: 17px; font-weight: 600; }
  .node-main span { color: var(--ink-2); font-size: 13px; }

  .back { align-self: start; padding: 7px 14px; border-radius: 999px; background: var(--surface-2); color: var(--ink-2); font-weight: 800; }
  .back:hover { background: var(--border); }
  .sub-h1 { font-family: var(--serif-ko); font-size: 30px; font-weight: 600; }
  .ch-head { display: grid; gap: 3px; }
  .goal { margin: 2px 0 0; color: var(--ink); font-weight: 600; }
  .scenario { margin: 0; color: var(--ink-3); font-size: 14px; }

  .block { display: grid; gap: 10px; }
  .sec-head { display: flex; align-items: center; gap: 10px; font-size: 11px; font-weight: 750;
    letter-spacing: .15em; text-transform: uppercase; color: var(--ink-3); }
  .sec-head::after { content: ''; flex: 1; height: 1px; background: var(--border); }
  .dot { width: 14px; height: 4px; flex: none; border-radius: 2px; background: var(--ink); box-shadow: none; }
  .dot.v { background: var(--type-word); }
  .dot.p { background: var(--type-pattern); }
  .dot.g { background: var(--type-grammar); }
  .dlg { display: grid; gap: 10px; }
  .dline { display: grid; grid-template-columns: auto 1fr; gap: 10px; align-items: start; }
  .spk { font-size: 11px; font-weight: 800; padding: 3px 9px; border-radius: 999px; background: var(--green-soft); color: var(--green-dark); white-space: nowrap; }
  .dko { font-size: 18px; font-weight: 720; display: flex; align-items: center; gap: 7px; }
  .den { color: var(--ink-2); }
  .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(190px, 1fr)); column-gap: 26px; row-gap: 0;
    border-bottom: 1px solid var(--border); }
  .gfocus { display: grid; gap: 8px; }
  .gf { padding: 11px 14px; border-radius: 12px; background: var(--surface); border: 1px solid var(--border);
    border-left: 4px solid var(--type-grammar); box-shadow: var(--shadow-1); }
  .gf strong { margin-right: 8px; color: #c2710a; }
  .gf span { color: var(--ink-2); }

  .ch-actions { display: flex; flex-wrap: wrap; gap: 10px; margin-top: 6px; }
  .ghost { padding: 12px 18px; border-radius: 999px; background: var(--surface-2); color: var(--ink-2); font-weight: 800; }
</style>
