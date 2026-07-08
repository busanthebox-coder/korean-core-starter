<script>
  export let archive = {};
  export let chapters = [];
  export let onOpenChapter = () => {};

  function formatDate(date) {
    return new Date(date).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' });
  }

  $: chapterMap = new Map(chapters.map((chapter) => [chapter.id, chapter]));
  $: groups = Object.entries(archive || {})
    .map(([chapterId, entries]) => {
      const items = [...(entries || [])].sort((a, b) => b.date - a.date);
      return {
        chapterId,
        chapter: chapterMap.get(chapterId),
        items,
        latest: items[0]?.date || 0,
      };
    })
    .filter((group) => group.items.length)
    .sort((a, b) => b.latest - a.latest);

  $: total = groups.reduce((sum, group) => sum + group.items.length, 0);
</script>

<section class="writing-archive">
  <div class="archive-head">
    <div>
      <span>Writing archive</span>
      <h2>내가 쓴 글</h2>
    </div>
    <strong>{total}</strong>
  </div>

  {#if groups.length}
    <div class="archive-groups">
      {#each groups as group}
        <article class="archive-group">
          <div class="group-title">
            <div>
              <span>{group.chapter?.number ? `Chapter ${group.chapter.number}` : group.chapterId}</span>
              <h3>{group.chapter?.title || group.chapterId}</h3>
            </div>
            {#if group.chapter}
              <button type="button" on:click={() => onOpenChapter(group.chapter)}>이 챕터 다시 쓰기</button>
            {/if}
          </div>
          <div class="entry-list">
            {#each group.items as item}
              <div class="entry-card">
                <time datetime={new Date(item.date).toISOString()}>{formatDate(item.date)}</time>
                <p>{item.text}</p>
                <span>{item.checked ? '점검 완료' : '점검 건너뜀'}</span>
              </div>
            {/each}
          </div>
        </article>
      {/each}
    </div>
  {:else}
    <p class="empty">아직 저장된 글이 없어요. 챕터 마지막의 Write it에서 짧게 써 보면 여기에 모입니다.</p>
  {/if}
</section>

<style>
  .writing-archive { display: grid; gap: 12px; padding: 16px; border-radius: var(--radius); background: var(--surface);
    border: 1px solid var(--border); box-shadow: var(--shadow-1); }
  .archive-head { display: flex; align-items: center; justify-content: space-between; gap: 12px; }
  .archive-head span, .group-title span { display: block; color: var(--accent-ink); font-size: 10px; font-weight: 850; letter-spacing: .12em; text-transform: uppercase; }
  .archive-head h2, .group-title h3 { margin: 1px 0 0; }
  .archive-head h2 { font-size: 18px; }
  .archive-head strong { min-width: 38px; height: 38px; display: grid; place-items: center; border-radius: 999px;
    background: var(--green-soft); color: var(--green-dark); font-size: 15px; }
  .archive-groups { display: grid; gap: 11px; }
  .archive-group { display: grid; gap: 9px; padding-top: 11px; border-top: 1px solid var(--border); }
  .group-title { display: flex; align-items: center; justify-content: space-between; gap: 12px; }
  .group-title h3 { font-size: 15px; }
  .group-title button { flex: none; padding: 8px 11px; border-radius: 999px; background: var(--surface-2); color: var(--ink-2);
    border: 1px solid var(--border); font-size: 12px; font-weight: 850; }
  .group-title button:hover { border-color: var(--green); color: var(--green-dark); }
  .entry-list { display: grid; gap: 8px; }
  .entry-card { display: grid; gap: 4px; padding: 10px; border-radius: 12px; background: var(--surface-2); border: 1px solid rgba(140,123,104,.18); }
  .entry-card time { font-size: 11px; font-weight: 850; color: var(--accent-ink); }
  .entry-card p { margin: 0; color: var(--ink); font-size: 13px; line-height: 1.5; white-space: pre-wrap; }
  .entry-card span { justify-self: start; font-size: 11px; font-weight: 850; color: var(--ink-3); }
  .empty { margin: 0; padding: 12px; border-radius: var(--r-1); background: var(--surface-2); color: var(--ink-3);
    font-size: 13px; line-height: 1.5; }
  @media (max-width: 560px) {
    .group-title { align-items: stretch; flex-direction: column; }
    .group-title button { width: 100%; }
  }
</style>
