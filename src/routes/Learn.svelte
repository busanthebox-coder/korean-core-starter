<script>
  import { onMount } from 'svelte';
  import { chapters, findEntry, findGrammar } from '../lib/data.js';
  import { lessonActivity, lessonProgress, markDialogueSeen, resetLessonProgress, toggleLessonDone } from '../lib/stores.js';
  import { lessonPlanState } from '../lib/lessonPlan.js';
  import { dueIds, reviews, masteryOf } from '../lib/srs.js';
  import { study, streak } from '../lib/progress.js';
  import { mistakes } from '../lib/mistakes.js';
  import { buildTodayMission, chapterItemIds } from '../lib/studyLinks.js';
  import { push } from 'svelte-spa-router';
  import EntryCard from '../lib/components/EntryCard.svelte';
  import EntryDetail from '../lib/components/EntryDetail.svelte';
  import Sheet from '../lib/components/Sheet.svelte';
  import LearnMissionPanel from '../lib/components/LearnMissionPanel.svelte';
  import AudioButton from '../lib/components/AudioButton.svelte';
  import RomanizationLine from '../lib/components/RomanizationLine.svelte';
  import HangulTrainer from '../lib/components/HangulTrainer.svelte';
  import GrammarReference from '../lib/components/GrammarReference.svelte';
  import RichChapterSections from '../lib/components/RichChapterSections.svelte';

  export let params = {};

  let view = 'path';
  let chapter = null;
  let selected = null;

  const vocabOf = (ch) =>
    [...new Set([...(ch.coreVocabularyIds || []), ...(ch.linkedEntryIds || [])])]
      .map(findEntry)
      .filter((entry) => entry && entry.type !== 'pattern');
  const patternsOf = (ch) => (ch.patternIds || []).map(findEntry).filter(Boolean);
  const grammarOf = (ch) => (ch.grammarFocus || []).map(findGrammar).filter(Boolean);

  function openChapter(ch) { chapter = ch; view = 'chapter'; window.scrollTo(0, 0); }
  function back() { view = 'path'; chapter = null; window.scrollTo(0, 0); }
  function syncChapterFromUrl() {
    const query = (window.location.hash.split('?')[1] || '').split('#')[0];
    const requested = params.chapter || new URLSearchParams(query).get('chapter');
    const target = chapters.find((c) => c.id === requested);
    if (target) openChapter(target);
  }
  function resetCompleted() {
    if (confirm('Reset completed chapters?')) resetLessonProgress();
  }
  function practiceChapter(ch) { push(`/practice?deck=${encodeURIComponent(ch.id)}`); }
  function addChapterDeck(ch) { reviews.addMany(chapterItemIds(ch)); }
  function scrollToDialogue() {
    if (chapter) markDialogueSeen(chapter.id);
    document.querySelector('.dlg')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  onMount(() => {
    syncChapterFromUrl();
    window.addEventListener('hashchange', syncChapterFromUrl);
    return () => window.removeEventListener('hashchange', syncChapterFromUrl);
  });

  $: vocab = chapter ? vocabOf(chapter) : [];
  $: pats = chapter ? patternsOf(chapter) : [];
  $: gram = chapter ? grammarOf(chapter) : [];

  // Prev/next pager so learners advance straight to the adjacent chapter instead
  // of bouncing back to the top of the lesson list.
  $: chIndex = chapter ? chapters.findIndex((c) => c.id === chapter.id) : -1;
  $: prevCh = chIndex > 0 ? chapters[chIndex - 1] : null;
  $: nextCh = chIndex >= 0 && chIndex < chapters.length - 1 ? chapters[chIndex + 1] : null;

  $: doneCount = chapters.filter((c) => $lessonProgress.has(c.id)).length;
  $: pct = chapters.length ? Math.round((doneCount / chapters.length) * 100) : 0;
  // Real mastery, derived from spaced-repetition boxes (not self-reported).
  $: allItemIds = [...new Set(chapters.flatMap(chapterItemIds))];
  $: courseMastery = masteryOf($reviews, allItemIds);
  $: chMastery = (ch) => masteryOf($reviews, chapterItemIds(ch));
  $: currentIds = chapter ? chapterItemIds(chapter) : [];
  $: currentMastery = chapter ? masteryOf($reviews, currentIds) : { total: 0, started: 0, mastered: 0, pct: 0 };
  $: allDueIds = dueIds($reviews);
  $: dueSet = new Set(allDueIds);
  $: currentDue = chapter ? currentIds.filter((id) => dueSet.has(id)).length : 0;
  $: currentDeckReady = currentIds.length > 0 && currentIds.every((id) => $reviews[id]);
  $: currentPlan = chapter ? lessonPlanState({
    chapter,
    itemIds: currentIds,
    reviews: $reviews,
    activity: $lessonActivity,
    lessonDone: $lessonProgress.has(chapter.id),
    deckReady: currentDeckReady,
  }) : null;
  $: currentPlanStatus = currentDue
    ? `${currentDue} due now`
    : currentPlan?.active
      ? `Next: ${currentPlan.nextLabel}`
      : 'Plan complete';
  $: streakDays = streak($study);
  $: todayMission = buildTodayMission({
    chapters,
    completedIds: $lessonProgress,
    reviews: $reviews,
    mistakeIds: Object.keys($mistakes),
  });
</script>

{#if view === 'path'}
  <section class="learn">
    <div class="learn-hero">
      <div class="eyebrow">Korean · A1–B1</div>
      <h1>Your lessons</h1>
      <p>Start with Hangul, then work down the chapters. Tap any card to open it.</p>
    </div>

    <div class="progress-card">
      <div class="pc-top"><span class="pc-label">Course mastery</span><span class="pc-count">{courseMastery.mastered} / {courseMastery.total} words mastered</span></div>
      <div class="pc-bar"><span class="pc-fill" style="width:{courseMastery.pct}%"></span></div>
      <div class="pc-meta">
        <span>🔥 {streakDays}-day streak</span>
        <span>{doneCount}/{chapters.length} chapters marked done · {courseMastery.pct}% mastered</span>
      </div>
      {#if doneCount}
        <button class="pc-reset" type="button" on:click={resetCompleted}>Reset completed</button>
      {/if}
    </div>

    <LearnMissionPanel mission={todayMission} {doneCount} totalChapters={chapters.length} onOpenChapter={openChapter} />

    <button class="big-card" on:click={() => { view = 'hangul'; window.scrollTo(0, 0); }}>
      <span class="bc-ico">가</span>
      <span class="bc-main"><strong>Start here — Hangul</strong><span>Read the alphabet and build syllables.</span></span>
      <span class="chev">▸</span>
    </button>

    <div class="path">
      {#each chapters as ch}
        {@const m = chMastery(ch)}
        {#if ch.number === 12}<div class="path-divider"><span>Intermediate · B1</span></div>{/if}
        <button class="node" on:click={() => openChapter(ch)}>
          <span class="num" class:done={$lessonProgress.has(ch.id)}>{$lessonProgress.has(ch.id) ? '✓' : ch.number}</span>
          <span class="node-main"><strong>{ch.title}</strong><span>{ch.goal}</span></span>
          {#if m.started}
            <span class="node-mast" title="{m.mastered} of {m.total} mastered">
              <span class="nm-bar"><span style="width:{m.pct}%"></span></span>
              <span class="nm-pct">{m.pct}%</span>
            </span>
          {/if}
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

    <div class="today-plan">
      <div class="tp-top">
        <div>
          <span class="tp-label">Today plan</span>
          <strong>{currentMastery.mastered}/{currentMastery.total} mastered</strong>
        </div>
        <span class="tp-progress">{currentPlan?.doneCount || 0}/{currentPlan?.total || 4} steps</span>
        <span class="tp-due">{currentPlanStatus}</span>
      </div>
      <div class="tp-steps">
        <button class="tp-step" type="button" class:primary={currentPlan?.active === 'dialogue'} class:done={currentPlan?.dialogueDone} aria-current={currentPlan?.active === 'dialogue' ? 'step' : undefined} on:click={scrollToDialogue}>
          <span class="tp-num">{currentPlan?.dialogueDone ? '✓' : '1'}</span><span>Dialogue</span>
        </button>
        <button class="tp-step" type="button" class:primary={currentPlan?.active === 'deck'} class:done={currentPlan?.deckDone} aria-current={currentPlan?.active === 'deck' ? 'step' : undefined} on:click={() => addChapterDeck(chapter)}>
          <span class="tp-num">{currentPlan?.deckDone ? '✓' : '2'}</span><span>{currentPlan?.deckDone ? 'Deck ready' : `Add ${currentIds.length}`}</span>
        </button>
        <button class="tp-step" type="button" class:primary={currentPlan?.active === 'practice'} class:done={currentPlan?.practiceDone} aria-current={currentPlan?.active === 'practice' ? 'step' : undefined} on:click={() => practiceChapter(chapter)}>
          <span class="tp-num">{currentPlan?.practiceDone ? '✓' : '3'}</span><span>Practice</span>
        </button>
        <button class="tp-step" type="button" class:primary={currentPlan?.active === 'complete'} class:done={currentPlan?.completeDone} aria-current={currentPlan?.active === 'complete' ? 'step' : undefined} aria-pressed={$lessonProgress.has(chapter.id)} on:click={() => toggleLessonDone(chapter.id)}>
          <span class="tp-num">{currentPlan?.completeDone ? '✓' : '4'}</span><span>{currentPlan?.completeDone ? 'Completed' : 'Complete'}</span>
        </button>
      </div>
    </div>

    {#if (chapter.dialogue || []).length}
      <div class="block">
        <div class="sec-head"><span class="dot" />Warm-up dialogue</div>
        <div class="dlg">
          {#each chapter.dialogue as line}
            <div class="dline" class:right={line.speaker !== chapter.dialogue[0].speaker}>
              <span class="spk">{line.speaker}</span>
              <div class="dbubble">
                <div class="dko">{line.ko} <AudioButton text={line.ko} size={24} /></div>
                <RomanizationLine text={line.romanization} />
                <div class="den">{line.en}</div>
              </div>
            </div>
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

    {#if chapter.hook || chapter.grammarNotes?.length || chapter.extendedVocabulary?.length}
      <RichChapterSections {chapter} />
    {/if}

    <div class="ch-actions">
      <button class="btn3d" on:click={() => practiceChapter(chapter)}>Practice this chapter</button>
      <button class="ghost" aria-pressed={$lessonProgress.has(chapter.id)} on:click={() => toggleLessonDone(chapter.id)}>{$lessonProgress.has(chapter.id) ? '✓ Completed' : 'Mark complete'}</button>
    </div>

    <nav class="pager">
      {#if prevCh}
        <button class="pg" on:click={() => openChapter(prevCh)}>
          <span class="pg-dir">← Previous</span>
          <span class="pg-title">{prevCh.number}. {prevCh.title}</span>
        </button>
      {:else}<span class="pg-spacer"></span>{/if}
      {#if nextCh}
        <button class="pg next" on:click={() => openChapter(nextCh)}>
          <span class="pg-dir">Next →</span>
          <span class="pg-title">{nextCh.number}. {nextCh.title}</span>
        </button>
      {:else}<span class="pg-spacer"></span>{/if}
    </nav>
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
  .pc-meta { display: flex; flex-wrap: wrap; gap: 6px 16px; font-size: 12px; font-weight: 700; color: var(--ink-3); }
  .pc-reset { justify-self: start; padding: 6px 10px; border-radius: 999px; border: 1px solid var(--border);
    background: #fff; color: var(--ink-3); font-size: 12px; font-weight: 800; }
  .pc-reset:hover { border-color: var(--ink-3); color: var(--ink); }

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
  .node-mast { display: grid; justify-items: end; gap: 3px; flex: none; width: 64px; }
  .nm-bar { width: 100%; height: 6px; border-radius: 999px; background: var(--surface-2); border: 1px solid var(--border); overflow: hidden; }
  .nm-bar span { display: block; height: 100%; border-radius: 999px; background: var(--type-word); }
  .nm-pct { font-size: 11px; font-weight: 800; color: var(--ink-3); }

  .back { align-self: start; padding: 7px 14px; border-radius: 999px; background: var(--surface-2); color: var(--ink-2); font-weight: 800; }
  .back:hover { background: var(--border); }
  .sub-h1 { font-family: var(--serif-ko); font-size: 30px; font-weight: 600; }
  .ch-head { display: grid; gap: 3px; }
  .goal { margin: 2px 0 0; color: var(--ink); font-weight: 600; }
  .scenario { margin: 0; color: var(--ink-3); font-size: 14px; }

  .today-plan { display: grid; gap: 12px; padding: 14px; border-radius: var(--radius); background: var(--surface);
    border: 1px solid var(--border); border-left: 4px solid #247744; box-shadow: var(--shadow-1); }
  .tp-top { display: flex; align-items: center; justify-content: space-between; gap: 12px; }
  .tp-top > div { display: grid; gap: 2px; }
  .tp-label { font-size: 11px; font-weight: 850; letter-spacing: .14em; text-transform: uppercase; color: #146443; }
  .tp-top strong { font-size: 18px; line-height: 1.1; }
  .tp-progress { margin-left: auto; color: #146443; font-size: 12px; font-weight: 850; white-space: nowrap; }
  .tp-due { padding: 6px 10px; border-radius: 999px; background: var(--surface-2); color: var(--ink-2); font-size: 12px; font-weight: 850; white-space: nowrap; }
  .tp-steps { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 8px; }
  .tp-step { min-height: 56px; display: flex; align-items: center; justify-content: center; gap: 8px;
    padding: 10px; border-radius: 11px; border: 1px solid var(--border); background: #fff; color: var(--ink);
    font-size: 13px; font-weight: 850; transition: transform .1s var(--bounce), border-color .1s, background .1s; }
  .tp-step:hover { transform: translateY(-1px); border-color: var(--ink-3); }
  .tp-step.primary {
    background: #ecf7f1;
    color: #146443;
    border-color: rgba(36, 119, 68, .34);
    box-shadow: inset 0 0 0 1px rgba(36, 119, 68, .14);
  }
  .tp-step.done {
    background: #f7fbf8;
    border-color: rgba(36, 119, 68, .22);
    color: #146443;
  }
  .tp-num { width: 23px; height: 23px; display: grid; place-items: center; border-radius: 999px; background: var(--surface-2);
    color: var(--ink-2); font-size: 12px; font-weight: 900; flex: none; }
  .tp-step.primary .tp-num,
  .tp-step.done .tp-num { background: #247744; color: #fff; }

  .block { display: grid; gap: 10px; }
  .sec-head { display: flex; align-items: center; gap: 10px; font-size: 11px; font-weight: 750;
    letter-spacing: .15em; text-transform: uppercase; color: var(--ink-3); }
  .sec-head::after { content: ''; flex: 1; height: 1px; background: var(--border); }
  .dot { width: 14px; height: 4px; flex: none; border-radius: 2px; background: var(--ink); box-shadow: none; }
  .dot.v { background: var(--type-word); }
  .dot.p { background: var(--type-pattern); }
  .dot.g { background: var(--type-grammar); }
  .dlg {
    display: grid;
    gap: 12px;
    padding: 16px;
    border: 1px solid #97b3c7;
    border-radius: var(--radius);
    background:
      linear-gradient(rgba(255,255,255,.16) 1px, transparent 1px),
      linear-gradient(90deg, rgba(255,255,255,.12) 1px, transparent 1px),
      #b9cfde;
    background-size: 28px 28px;
  }
  .dline {
    display: grid;
    justify-items: start;
    gap: 5px;
  }
  .dline.right { justify-items: end; }
  .spk {
    max-width: min(78%, 620px);
    padding: 0 4px;
    color: rgba(28,45,57,.72);
    font-size: 11px;
    font-weight: 850;
    white-space: nowrap;
  }
  .dline.right .spk { text-align: right; }
  .dbubble {
    max-width: min(78%, 620px);
    display: grid;
    gap: 3px;
    padding: 11px 13px 12px;
    border-radius: 15px;
    border-top-left-radius: 6px;
    background: #fff;
    border: 1px solid rgba(70, 91, 105, .12);
    box-shadow: 0 2px 8px rgba(37, 56, 68, .08);
  }
  .dline.right .dbubble {
    background: #fee95d;
    border-color: #efcf2f;
    border-top-left-radius: 15px;
    border-top-right-radius: 6px;
  }
  .dko {
    color: #181818;
    font-size: 18px;
    line-height: 1.45;
    font-weight: 760;
    display: flex;
    align-items: center;
    gap: 7px;
    flex-wrap: wrap;
  }
  .dline.right .dko { justify-content: flex-end; }
  .den { color: rgba(24,24,24,.68); font-size: 13px; line-height: 1.45; }
  .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(190px, 1fr)); column-gap: 26px; row-gap: 0;
    border-bottom: 1px solid var(--border); }
  .gfocus { display: grid; gap: 8px; }
  .gf { padding: 11px 14px; border-radius: 12px; background: var(--surface); border: 1px solid var(--border);
    border-left: 4px solid var(--type-grammar); box-shadow: var(--shadow-1); }
  .gf strong { margin-right: 8px; color: #c2710a; }
  .gf span { color: var(--ink-2); }

  .ch-actions { display: flex; flex-wrap: wrap; gap: 10px; margin-top: 6px; }
  .ghost { padding: 12px 18px; border-radius: 999px; background: var(--surface-2); color: var(--ink-2); font-weight: 800; }
  .ghost[aria-pressed='true'] { background: var(--ink); color: #fff; }

  .pager { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-top: 18px; padding-top: 18px; border-top: 1px solid var(--rule); }
  .pg { display: grid; gap: 3px; text-align: left; padding: 14px 16px; border-radius: var(--radius); background: var(--surface);
    border: 1px solid var(--border); box-shadow: var(--shadow-1); transition: transform .1s var(--bounce), border-color .1s; }
  .pg:hover { transform: translateY(-2px); border-color: var(--ink); box-shadow: var(--shadow-2); }
  .pg.next { text-align: right; }
  .pg-dir { font-size: 11px; font-weight: 800; letter-spacing: .1em; text-transform: uppercase; color: var(--accent-ink); }
  .pg-title { font-family: var(--serif-ko); font-size: 15px; font-weight: 600; color: var(--ink); }
  @media (max-width: 520px) {
    .tp-top { align-items: flex-start; flex-direction: column; }
    .tp-progress { margin-left: 0; }
    .tp-steps { grid-template-columns: 1fr 1fr; }
    .pager { grid-template-columns: 1fr; }
    .pg-spacer { display: none; }
    .dbubble,
    .spk { max-width: 92%; }
  }
</style>
