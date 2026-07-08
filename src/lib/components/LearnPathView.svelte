<script>
  import { chapters, readers, vocabPacks } from '../data.js';
  import { mistakes } from '../mistakes.js';
  import { streak } from '../streak.js';
  import { masteryOf, reviews } from '../srs.js';
  import { checkpointSlots } from '../checkpoints.js';
  import { groupsForLearnHome } from '../learnGroups.js';
  import { continueChapter } from '../placement.js';
  import { buildTodayMission, chapterItemIds, packItemIds } from '../studyLinks.js';
  import {
    checkpointProgress,
    learnOpenGroups,
    lessonProgress,
    orientationDone,
    packProgress,
    readerProgress,
    romanizationVisible,
    romanNudgeSeen,
    startChapterId,
    toggleLearnOpenGroup,
  } from '../stores.js';
  import LearnMissionPanel from './LearnMissionPanel.svelte';
  import LearnProgressCard from './LearnProgressCard.svelte';
  import LearnLevelGroup from './LearnLevelGroup.svelte';
  import ReadingRoom from './ReadingRoom.svelte';

  export let onOpenChapter = () => {};
  export let onOpenPack = () => {};
  export let onOpenOrientation = () => {};
  export let onOpenHangul = () => {};
  export let onOpenGrammar = () => {};
  export let onOpenCheckpoint = () => {};
  export let onOpenReader = () => {};
  export let onResetCompleted = () => {};
  export let onDismissRomanNudge = () => {};

  let chapterFilter = '';

  $: packsByChapter = vocabPacks.reduce((acc, item) => {
    const key = item.insertAfterChapter;
    acc[key] ||= [];
    acc[key].push(item);
    return acc;
  }, {});
  const packsAfter = (chapter) => (packsByChapter[chapter.number] || [])
    .slice()
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0) || a.title.localeCompare(b.title));
  $: slotsByChapter = checkpointSlots(chapters).reduce((acc, slot) => {
    acc[slot.afterChapterId] ||= [];
    acc[slot.afterChapterId].push(slot);
    return acc;
  }, {});
  const checkpointsAfter = (chapter) => slotsByChapter[chapter.id] || [];

  $: doneCount = chapters.filter((chapter) => $lessonProgress.has(chapter.id)).length;
  $: continueTarget = continueChapter(chapters, $lessonProgress, $startChapterId);
  $: continueSource = continueTarget && $startChapterId === continueTarget.id ? 'Placement recommendation' : 'Next unfinished chapter';
  $: continuePct = Math.round((doneCount / Math.max(1, chapters.length)) * 100);
  $: allItemIds = [...new Set(chapters.flatMap(chapterItemIds))];
  $: courseMastery = masteryOf($reviews, allItemIds);
  $: streakDays = $streak.current || 0;
  $: todayMission = buildTodayMission({
    chapters,
    completedIds: $lessonProgress,
    reviews: $reviews,
    mistakeIds: Object.keys($mistakes),
  });
  $: levelGroups = groupsForLearnHome({
    chapters,
    completedIds: $lessonProgress,
    openKeys: $learnOpenGroups,
    filterText: chapterFilter,
  });
  $: hasFilter = chapterFilter.trim().length > 0;
  $: showRomanNudge = !$romanNudgeSeen && $romanizationVisible && $lessonProgress.has('chapter-03');
</script>

<section class="learn">
  <div class="learn-hero">
    <div class="eyebrow">Korean · A1–B1</div>
    <h1>Your lessons</h1>
    <p>Start with Hangul, then work down the chapters. Tap any card to open it.</p>
  </div>

  {#if continueTarget}
    <button class="continue-card" on:click={() => onOpenChapter(continueTarget)}>
      <span class="bc-ico cont">{continueTarget.number}</span>
      <span class="bc-main">
        <strong>이어서 학습 · {continueTarget.number}과 {continueTarget.title}</strong>
        <span>{continueSource} · {continuePct}% complete</span>
      </span>
      <span class="chev">▸</span>
    </button>
  {/if}

  <label class="chapter-filter">
    <span>Find a chapter</span>
    <input bind:value={chapterFilter} placeholder="Search title, number, or topic..." aria-label="Filter chapters" />
    {#if hasFilter}
      <button type="button" on:click={() => { chapterFilter = ''; }}>Clear</button>
    {/if}
  </label>

  <div class="path">
    {#each levelGroups as group}
      <LearnLevelGroup
        {group}
        lessonProgress={$lessonProgress}
        reviewsState={$reviews}
        packProgress={$packProgress}
        checkpointProgress={$checkpointProgress}
        {packsAfter}
        {checkpointsAfter}
        {onOpenChapter}
        {onOpenPack}
        {onOpenCheckpoint}
        onToggleGroup={() => toggleLearnOpenGroup(group.key)}
      />
    {/each}
    {#if hasFilter && levelGroups.length === 0}
      <p class="empty-filter">No chapters match that filter.</p>
    {/if}
  </div>

  <LearnProgressCard {courseMastery} {streakDays} {doneCount} totalChapters={chapters.length} {onResetCompleted} />
  <LearnMissionPanel mission={todayMission} onOpenChapter={onOpenChapter} />

  {#if showRomanNudge}
    <div class="roman-nudge">
      <div>
        <span>Hangul check</span>
        <strong>Try one lesson with Romaja off?</strong>
        <p>After Chapter 3, short Romaja-off sessions help Hangul become the first thing your eyes read.</p>
      </div>
      <div class="rn-actions">
        <button type="button" class="primary" on:click={() => onDismissRomanNudge(true)}>Turn off Romaja</button>
        <button type="button" on:click={() => onDismissRomanNudge(false)}>Later</button>
      </div>
    </div>
  {/if}

  {#if !$orientationDone}
    <button class="big-card orientation" on:click={onOpenOrientation}>
      <span class="bc-ico compass">시</span>
      <span class="bc-main"><strong>Start here — How Korean works</strong><span>Ten quick ideas before the first chapter.</span></span>
      <span class="chev">▸</span>
    </button>
  {/if}

  <button class="big-card" on:click={onOpenHangul}>
    <span class="bc-ico">가</span>
    <span class="bc-main"><strong>Start here — Hangul</strong><span>Read the alphabet and build syllables.</span></span>
    <span class="chev">▸</span>
  </button>

  <ReadingRoom readers={readers} progress={$readerProgress} onOpenReader={onOpenReader} />

  <button class="big-card" on:click={onOpenGrammar}>
    <span class="bc-ico gram">文</span>
    <span class="bc-main"><strong>Grammar roadmap</strong><span>Learn grammar step by step — particles, tenses, endings, connectors.</span></span>
    <span class="chev">▸</span>
  </button>
</section>

<style>
  .learn { max-width: 1120px; margin: 0 auto; padding: 28px; display: grid; gap: 14px; }
  .learn-hero { display: grid; gap: 4px; padding: 6px 2px 16px; border-bottom: 1px solid var(--rule); }
  .eyebrow { font-size: 11px; font-weight: 750; letter-spacing: .16em; text-transform: uppercase; color: var(--ink-3); }
  h1 { margin: 9px 0 4px; font-family: var(--serif-ko); font-size: 44px; font-weight: 600; letter-spacing: 0; line-height: 1.05; }
  .learn-hero p { margin: 0; color: var(--ink-3); }
  .big-card { display: flex; align-items: center; gap: 14px; text-align: left; padding: 16px 18px; border-radius: var(--radius);
    background: var(--surface); border: 1px solid var(--border); box-shadow: var(--shadow-1); }
  .big-card:hover { border-color: var(--ink); box-shadow: var(--shadow-2); transform: translateY(-1px); }
  .big-card.orientation { border-color: rgba(36,119,68,.24); background: #f7fbf8; }
  .bc-ico { width: 50px; height: 50px; display: grid; place-items: center; border-radius: 13px; background: var(--ink); color: var(--bg); font-family: var(--serif-ko); font-size: 25px; font-weight: 700; flex: none; }
  .bc-ico.gram { background: var(--accent); }
  .bc-ico.compass { background: var(--green); }
  .bc-ico.cont { background: var(--primary); color: var(--primary-on); }
  .bc-main { display: grid; gap: 2px; flex: 1; }
  .bc-main strong { font-family: var(--serif-ko); font-size: 18px; font-weight: 600; }
  .bc-main span { color: var(--ink-2); font-size: 14px; }
  .chev { color: var(--ink-3); }
  .continue-card { display: flex; align-items: center; gap: 14px; text-align: left; padding: 16px 18px; border-radius: var(--radius);
    background: linear-gradient(180deg, #fff 0%, #fffaf4 100%); border: 1px solid rgba(232,85,46,.28);
    box-shadow: var(--shadow-2); }
  .continue-card:hover { border-color: var(--primary); transform: translateY(-1px); }
  .chapter-filter { display: grid; grid-template-columns: auto 1fr auto; align-items: center; gap: 10px;
    padding: 10px 12px; border-radius: var(--radius); background: var(--surface); border: 1px solid var(--border);
    box-shadow: var(--shadow-1); }
  .chapter-filter span { font-size: 11px; font-weight: 850; letter-spacing: .12em; text-transform: uppercase; color: var(--ink-3); }
  .chapter-filter input { min-width: 0; padding: 9px 10px; border-radius: var(--r-1); border: 1px solid var(--border);
    background: var(--surface-2); color: var(--ink); font: inherit; }
  .chapter-filter button { padding: 8px 10px; border-radius: var(--radius-pill); background: var(--ink); color: var(--bg); font-size: 12px; font-weight: 850; }
  .path { display: grid; gap: 10px; }
  .empty-filter { margin: 0; padding: 15px 16px; border-radius: var(--radius); background: var(--surface); border: 1px solid var(--border); color: var(--ink-2); }
  .roman-nudge { display: flex; justify-content: space-between; align-items: center; gap: 14px; flex-wrap: wrap;
    padding: 14px 16px; border-radius: var(--radius); background: #fff; border: 1px solid rgba(36,119,68,.25);
    border-left: 4px solid var(--green); box-shadow: var(--shadow-1); }
  .roman-nudge span { display: block; font-size: 11px; font-weight: 850; letter-spacing: .12em; text-transform: uppercase; color: var(--green-dark); }
  .roman-nudge strong { font-size: 17px; }
  .roman-nudge p { margin: 3px 0 0; color: var(--ink-2); font-size: 13px; line-height: 1.45; }
  .rn-actions { display: flex; gap: 8px; flex-wrap: wrap; }
  .rn-actions button { padding: 9px 13px; border-radius: 999px; background: var(--surface-2); color: var(--ink-2); border: 1px solid var(--border); font-size: 12px; font-weight: 850; }
  .rn-actions button.primary { background: var(--green); color: #fff; border-color: var(--green); }
  @media (max-width: 520px) {
    .chapter-filter { grid-template-columns: 1fr auto; }
    .chapter-filter span { grid-column: 1 / -1; }
  }
</style>
