<script>
  import { masteryOf } from '../srs.js';
  import { chapterItemIds, packItemIds } from '../studyLinks.js';

  export let group;
  export let lessonProgress = new Set();
  export let reviewsState = {};
  export let packProgress = new Set();
  export let checkpointProgress = {};
  export let packsAfter = () => [];
  export let checkpointsAfter = () => [];
  export let onOpenChapter = () => {};
  export let onOpenPack = () => {};
  export let onOpenCheckpoint = () => {};
  export let onToggleGroup = () => {};

  const chapterMastery = (chapter) => masteryOf(reviewsState, chapterItemIds(chapter));
  const packMastery = (pack) => masteryOf(reviewsState, packItemIds(pack));
</script>

<section class="level-group">
  <button
    type="button"
    class="level-head"
    aria-expanded={group.open}
    aria-controls={`learn-group-${group.key}`}
    on:click={onToggleGroup}
  >
    <span class="seal" class:done={group.doneCount === group.totalCount}>{group.doneCount === group.totalCount ? '완' : group.key}</span>
    <span class="level-main">
      <strong>{group.label}</strong>
      <span>{group.description}</span>
    </span>
    <span class="level-progress">{group.doneCount}/{group.totalCount}</span>
    <span class="chev" aria-hidden="true">{group.open ? '⌃' : '⌄'}</span>
  </button>
  {#if group.open}
    <div class="level-body" id={`learn-group-${group.key}`}>
      {#each group.chapters as chapter}
        {@const mastery = chapterMastery(chapter)}
        <button class="node" on:click={() => onOpenChapter(chapter)}>
          <span class="num" class:done={lessonProgress.has(chapter.id)}>{lessonProgress.has(chapter.id) ? '✓' : chapter.number}</span>
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
          {@const packStats = packMastery(pack)}
          <button class="pack-node" on:click={() => onOpenPack(pack)}>
            <span class="pack-badge" class:done={packProgress.has(pack.id)}>{packProgress.has(pack.id) ? '✓' : '+'}</span>
            <span class="pack-main">
              <span class="pack-kicker">Vocab Pack · {pack.items.length} words</span>
              <strong>{pack.title}</strong>
              <span>{pack.goal}</span>
            </span>
            {#if packStats.started}
              <span class="node-mast" title="{packStats.mastered} of {packStats.total} mastered">
                <span class="nm-bar"><span style="width:{packStats.pct}%"></span></span>
                <span class="nm-pct">{packStats.pct}%</span>
              </span>
            {/if}
            <span class="chev">▸</span>
          </button>
        {/each}
        {#each checkpointsAfter(chapter) as slot}
          {@const checkpoint = checkpointProgress[slot.trackId]}
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
  {/if}
</section>

<style>
  .level-group, .level-body { display: grid; gap: 8px; }
  .level-body { gap: 10px; }
  .level-head, .node, .pack-node, .checkpoint-node { display: flex; align-items: center; text-align: left; box-shadow: var(--shadow-1); }
  .level-head { gap: 12px; padding: 14px 16px; border-radius: var(--radius); background: var(--surface); border: 1px solid var(--border); }
  .level-head:hover { border-color: var(--ink); transform: translateY(-1px); box-shadow: var(--shadow-2); }
  .seal { width: 44px; height: 44px; display: grid; place-items: center; border-radius: 12px; background: var(--surface-2);
    color: var(--ink); border: 1px solid var(--border-2); font-family: var(--serif); font-weight: 850; flex: none; }
  .seal.done { background: var(--green); color: var(--primary-on); border-color: var(--green); }
  .level-main, .node-main, .pack-main, .checkpoint-main { display: grid; flex: 1; min-width: 0; }
  .level-main { gap: 1px; }
  .level-main strong { font-family: var(--serif-ko); font-size: 18px; font-weight: 650; }
  .level-main span { color: var(--ink-2); font-size: 13px; line-height: 1.35; }
  .level-progress { padding: 5px 9px; border-radius: var(--radius-pill); background: var(--surface-2);
    color: var(--ink-2); font-size: 12px; font-weight: 900; white-space: nowrap; }
  .chev { color: var(--ink-3); }
  .node { gap: 14px; padding: 14px 16px; border-radius: var(--radius); background: var(--surface);
    border: 1px solid var(--border); transition: transform .1s var(--bounce), border-color .1s; }
  .node:hover { transform: translateY(-2px); border-color: var(--ink); box-shadow: var(--shadow-2); }
  .num { width: 46px; height: 46px; display: grid; place-items: center; border-radius: 999px; background: var(--surface);
    border: 1px solid var(--border-2); color: var(--ink); font-family: var(--serif); font-weight: 600; font-size: 18px; flex: none; }
  .num.done { background: var(--ink); color: var(--bg); border-color: var(--ink); }
  .node-main { gap: 2px; }
  .node-main strong { font-family: var(--serif-ko); font-size: 17px; font-weight: 600; }
  .node-main span { color: var(--ink-2); font-size: 13px; }
  .node-mast { display: grid; justify-items: end; gap: 3px; flex: none; width: 64px; }
  .nm-bar { width: 100%; height: 6px; border-radius: 999px; background: var(--surface-2); border: 1px solid var(--border); overflow: hidden; }
  .nm-bar span { display: block; height: 100%; border-radius: 999px; background: var(--type-word); }
  .nm-pct { font-size: 11px; font-weight: 800; color: var(--ink-3); }
  .pack-node { gap: 12px; margin-left: 34px; padding: 12px 14px; border-radius: var(--r-1);
    background: #fffaf4; border: 1px dashed var(--border-2); transition: transform .1s var(--bounce), border-color .1s, background .1s; }
  .pack-node:hover { transform: translateY(-1px); border-color: var(--accent); background: var(--surface); }
  .pack-badge { width: 38px; height: 38px; display: grid; place-items: center; border-radius: 999px;
    background: var(--primary-wash); color: var(--accent-ink); border: 1px solid rgba(232,85,46,.22); font-weight: 900; flex: none; }
  .pack-badge.done { background: var(--green-soft); color: var(--green-dark); border-color: rgba(62,142,78,.26); }
  .pack-main { gap: 1px; }
  .pack-kicker, .checkpoint-kicker { font-size: 10px; font-weight: 850; letter-spacing: .1em; text-transform: uppercase; }
  .pack-kicker { color: var(--accent-ink); }
  .pack-main strong, .checkpoint-main strong { font-size: 16px; font-weight: 850; }
  .pack-main span:last-child, .checkpoint-main span:last-child { color: var(--ink-2); font-size: 13px; line-height: 1.35; }
  .checkpoint-node { gap: 12px; margin: 2px 0 2px 34px; padding: 13px 14px; border-radius: var(--r-1);
    background: #f7fbf8; border: 1px solid rgba(36,119,68,.22); transition: transform .1s var(--bounce), border-color .1s, background .1s; }
  .checkpoint-node:hover { transform: translateY(-1px); border-color: var(--green); background: var(--surface); }
  .checkpoint-badge { width: 42px; height: 42px; display: grid; place-items: center; border-radius: 999px;
    background: var(--green-soft); color: var(--green-dark); border: 1px solid rgba(62,142,78,.26); font-weight: 900; flex: none; }
  .checkpoint-badge.done { background: var(--ink); color: var(--bg); border-color: var(--ink); }
  .checkpoint-main { gap: 1px; }
  .checkpoint-kicker { color: var(--green-dark); }
  @media (max-width: 520px) {
    .level-head, .pack-node, .checkpoint-node { align-items: flex-start; }
    .level-progress, .pack-node .node-mast { display: none; }
    .pack-node, .checkpoint-node { margin-left: 0; }
  }
</style>
