<script>
  import { chapters, readers, vocabPacks } from '../data.js';
  import { mistakes } from '../mistakes.js';
  import { study, streak } from '../progress.js';
  import { masteryOf, reviews } from '../srs.js';
  import { checkpointSlots } from '../checkpoints.js';
  import { isTrackStart } from '../curriculumStructure.js';
  import { buildTodayMission, chapterItemIds, packItemIds } from '../studyLinks.js';
  import { checkpointProgress, lessonProgress, orientationDone, packProgress, readerProgress, romanizationVisible, romanNudgeSeen } from '../stores.js';
  import LearnMissionPanel from './LearnMissionPanel.svelte';
  import LearnProgressCard from './LearnProgressCard.svelte';
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
  $: allItemIds = [...new Set(chapters.flatMap(chapterItemIds))];
  $: courseMastery = masteryOf($reviews, allItemIds);
  $: chMastery = (chapter) => masteryOf($reviews, chapterItemIds(chapter));
  $: streakDays = streak($study);
  $: todayMission = buildTodayMission({
    chapters,
    completedIds: $lessonProgress,
    reviews: $reviews,
    mistakeIds: Object.keys($mistakes),
  });
  $: showRomanNudge = !$romanNudgeSeen && $romanizationVisible && $lessonProgress.has('chapter-03');
</script>

<section class="learn">
  <div class="learn-hero">
    <div class="eyebrow">Korean · A1–B1</div>
    <h1>Your lessons</h1>
    <p>Start with Hangul, then work down the chapters. Tap any card to open it.</p>
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

  <div class="path">
    {#each chapters as chapter, i}
      {@const mastery = chMastery(chapter)}
      {#if isTrackStart(chapter, chapters[i - 1])}<div class="path-divider"><span>{chapter.curriculumTrack.label}</span></div>{/if}
      <button class="node" on:click={() => onOpenChapter(chapter)}>
        <span class="num" class:done={$lessonProgress.has(chapter.id)}>{$lessonProgress.has(chapter.id) ? '✓' : chapter.number}</span>
        <span class="node-main"><strong>{chapter.title}</strong><span>{chapter.goal}</span></span>
        {#if mastery.started}
          <span class="node-mast" title="{mastery.mastered} of {mastery.total} mastered">
            <span class="nm-bar"><span style="width:{mastery.pct}%"></span></span>
            <span class="nm-pct">{mastery.pct}%</span>
          </span>
        {/if}
        <span class="chev">▸</span>
      </button>
      {#each packsAfter(chapter) as pack}
        {@const packMastery = masteryOf($reviews, packItemIds(pack))}
        <button class="pack-node" on:click={() => onOpenPack(pack)}>
          <span class="pack-badge" class:done={$packProgress.has(pack.id)}>{$packProgress.has(pack.id) ? '✓' : '+'}</span>
          <span class="pack-main">
            <span class="pack-kicker">Vocab Pack · {pack.items.length} words</span>
            <strong>{pack.title}</strong>
            <span>{pack.goal}</span>
          </span>
          {#if packMastery.started}
            <span class="node-mast" title="{packMastery.mastered} of {packMastery.total} mastered">
              <span class="nm-bar"><span style="width:{packMastery.pct}%"></span></span>
              <span class="nm-pct">{packMastery.pct}%</span>
            </span>
          {/if}
          <span class="chev">▸</span>
        </button>
      {/each}
      {#each checkpointsAfter(chapter) as slot}
        {@const checkpoint = $checkpointProgress[slot.trackId]}
        <button class="checkpoint-node" on:click={() => onOpenCheckpoint(slot)}>
          <span class="checkpoint-badge" class:done={!!checkpoint}>{checkpoint ? '✓' : slot.track}</span>
          <span class="checkpoint-main">
            <span class="checkpoint-kicker">Checkpoint · no lock</span>
            <strong>{slot.title}</strong>
            <span>{checkpoint ? `Last ${checkpoint.last}/${checkpoint.total} · best ${checkpoint.best}/${checkpoint.total}` : slot.subtitle}</span>
          </span>
          <span class="chev">▸</span>
        </button>
      {/each}
    {/each}
  </div>

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
  .pack-node { display: flex; align-items: center; gap: 12px; text-align: left; margin-left: 34px; padding: 12px 14px;
    border-radius: var(--r-1); background: #fffaf4; border: 1px dashed var(--border-2); box-shadow: var(--shadow-1);
    transition: transform .1s var(--bounce), border-color .1s, background .1s; }
  .pack-node:hover { transform: translateY(-1px); border-color: var(--accent); background: #fff; }
  .pack-badge { width: 38px; height: 38px; display: grid; place-items: center; border-radius: 999px;
    background: var(--primary-wash); color: var(--accent-ink); border: 1px solid rgba(232,85,46,.22); font-weight: 900; flex: none; }
  .pack-badge.done { background: var(--green-soft); color: var(--green-dark); border-color: rgba(62,142,78,.26); }
  .pack-main { display: grid; gap: 1px; flex: 1; min-width: 0; }
  .pack-kicker { color: var(--accent-ink); font-size: 10px; font-weight: 850; letter-spacing: .1em; text-transform: uppercase; }
  .pack-main strong { font-size: 16px; font-weight: 850; }
  .pack-main span:last-child { color: var(--ink-2); font-size: 13px; line-height: 1.35; }
  .checkpoint-node { display: flex; align-items: center; gap: 12px; text-align: left; margin: 2px 0 2px 34px; padding: 13px 14px;
    border-radius: var(--r-1); background: #f7fbf8; border: 1px solid rgba(36,119,68,.22); box-shadow: var(--shadow-1);
    transition: transform .1s var(--bounce), border-color .1s, background .1s; }
  .checkpoint-node:hover { transform: translateY(-1px); border-color: var(--green); background: #fff; }
  .checkpoint-badge { width: 42px; height: 42px; display: grid; place-items: center; border-radius: 999px;
    background: var(--green-soft); color: var(--green-dark); border: 1px solid rgba(62,142,78,.26); font-weight: 900; flex: none; }
  .checkpoint-badge.done { background: var(--ink); color: var(--bg); border-color: var(--ink); }
  .checkpoint-main { display: grid; gap: 1px; flex: 1; min-width: 0; }
  .checkpoint-kicker { color: var(--green-dark); font-size: 10px; font-weight: 850; letter-spacing: .1em; text-transform: uppercase; }
  .checkpoint-main strong { font-size: 16px; font-weight: 850; }
  .checkpoint-main span:last-child { color: var(--ink-2); font-size: 13px; line-height: 1.35; }
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
    .pack-node { margin-left: 0; align-items: flex-start; }
    .pack-node .node-mast { display: none; }
    .checkpoint-node { margin-left: 0; align-items: flex-start; }
  }
</style>
