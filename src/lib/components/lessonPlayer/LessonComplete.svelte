<script>
  export let doneGoal = '';
  export let doneBullets = [];
  export let canDoList = [];
  export let doneTeaser = '';
  export let done = false;
  export let nextChapter = null;
  export let writingEntries = [];
  export let onPractice = () => {};
  export let onComplete = () => {};
  export let onOpenChapter = () => {};

  function formatDate(date) {
    return new Date(date).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' });
  }

  $: latestWriting = [...writingEntries].sort((a, b) => b.date - a.date);
</script>

<div class="lp-done">
  <div class="seal-wrap"><span class="seal">독</span></div>
  <h2>Complete</h2>
  {#if doneGoal}<p class="done-goal">{doneGoal}</p>{/if}
  {#if doneBullets.length}<ul class="done-recap">{#each doneBullets as b}<li>{b}</li>{/each}</ul>{/if}
  {#if canDoList.length}
    <div class="cando">
      <span class="cando-cap">I can now…</span>
      <ul>{#each canDoList as c}<li><i class="ti ti-circle-check" aria-hidden="true"></i> {c}</li>{/each}</ul>
    </div>
  {/if}
  {#if doneTeaser}<div class="teaser">▶ {doneTeaser}</div>{/if}
  {#if latestWriting.length}
    <details class="writing-done">
      <summary>이 챕터에서 쓴 글 {latestWriting.length}개</summary>
      <div class="writing-list">
        {#each latestWriting as item}
          <article>
            <time datetime={new Date(item.date).toISOString()}>{formatDate(item.date)}</time>
            <p>{item.text}</p>
            <span>{item.checked ? '점검 완료' : '점검 건너뜀'}</span>
          </article>
        {/each}
      </div>
    </details>
  {/if}
  <div class="done-actions">
    <button class="btn3d" type="button" on:click={onPractice}>Practice this</button>
    <button class="ghost" type="button" aria-pressed={done} on:click={onComplete}>{done ? '✓ Marked done' : 'Mark complete'}</button>
    {#if nextChapter}
      <button class="ghost go" type="button" on:click={() => onOpenChapter(nextChapter)}>Next: {nextChapter.number ? `${nextChapter.number}. ` : ''}{nextChapter.title} →</button>
    {/if}
  </div>
</div>

<style>
  .lp-done { background: var(--surface); border: 1px solid var(--border); border-radius: var(--r-2); padding: 30px 22px;
    box-shadow: var(--shadow-1); display: grid; justify-items: center; text-align: center; gap: 10px; }
  .seal-wrap { margin-bottom: 4px; }
  .seal { display: inline-flex; align-items: center; justify-content: center; width: 64px; height: 64px; border-radius: var(--r-2);
    background: var(--primary); color: var(--primary-on); font-family: var(--serif-ko); font-weight: 700; font-size: 32px;
    transform: rotate(-4deg); box-shadow: inset 0 0 0 2px rgba(255,248,242,.35); animation: stamp .42s var(--bounce); }
  @keyframes stamp { from { opacity: 0; transform: rotate(-4deg) scale(1.5); } to { opacity: 1; transform: rotate(-4deg) scale(1); } }
  .lp-done h2 { margin: 0; font-family: var(--serif-ko); font-weight: 600; font-size: 26px; }
  .done-goal { margin: 0; color: var(--ink-2); font-size: 14px; max-width: 34ch; }
  .done-recap { text-align: left; margin: 8px 0 0; padding-left: 18px; display: grid; gap: 6px; color: var(--ink); font-size: 14px; line-height: 1.55; }
  .cando { width: 100%; text-align: left; margin-top: 14px; padding: 14px; border-radius: var(--r-1); background: var(--green-soft); }
  .cando-cap { font-size: 11px; font-weight: 850; letter-spacing: .08em; text-transform: uppercase; color: var(--green-dark); }
  .cando ul { margin: 8px 0 0; padding: 0; list-style: none; display: grid; gap: 7px; }
  .cando li { display: grid; grid-template-columns: auto 1fr; gap: 8px; font-size: 13px; line-height: 1.5; color: var(--ink); }
  .cando li :global(i) { color: var(--green); margin-top: 2px; }
  .teaser { font-size: 13px; color: var(--ink-3); }
  .writing-done { width: 100%; text-align: left; border: 1px solid var(--border); border-radius: var(--r-1); background: var(--surface-2); }
  .writing-done summary { cursor: pointer; list-style: none; padding: 11px 13px; font-size: 13px; font-weight: 850; color: var(--ink); }
  .writing-done summary::-webkit-details-marker { display: none; }
  .writing-list { display: grid; gap: 8px; padding: 0 12px 12px; }
  .writing-list article { display: grid; gap: 4px; padding: 10px; border-radius: 12px; background: var(--surface); border: 1px solid rgba(140,123,104,.18); }
  .writing-list time { font-size: 11px; font-weight: 850; color: var(--accent-ink); }
  .writing-list p { margin: 0; color: var(--ink); font-size: 13px; line-height: 1.5; white-space: pre-wrap; }
  .writing-list span { justify-self: start; font-size: 11px; font-weight: 850; color: var(--ink-3); }
  .done-actions { display: grid; gap: 10px; margin-top: 10px; width: 100%; max-width: 320px; }
  .ghost { padding: 12px 18px; border-radius: 999px; background: var(--surface-2); color: var(--ink-2); font-weight: 800; display: inline-flex; align-items: center; justify-content: center; gap: 6px; }
  .ghost:hover { background: var(--border); }
  .ghost.go { justify-content: center; }
  @media (prefers-reduced-motion: reduce) { .seal { animation: none; } }
</style>
