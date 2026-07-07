<script>
  export let readers = [];
  export let progress = {};
  export let onOpenReader = () => {};

  const LEVELS = ['A1', 'A2', 'B1', 'B2'];
  let activeLevel = 'A1';

  $: levelCounts = Object.fromEntries(LEVELS.map((level) => [
    level,
    readers.filter((item) => item.level === level).length,
  ]));
  $: visibleReaders = readers.filter((item) => item.level === activeLevel);

  function koreanLength(item) {
    return (item.body || []).join('').replace(/\s/g, '').length;
  }
</script>

<section class="reading-room" aria-label="Reading Room">
  <div class="room-head">
    <div>
      <p class="kicker">Reading Room</p>
      <h2>Short graded stories</h2>
      <p>Twenty levelled pieces for slower, real reading practice after the chapter path.</p>
    </div>
    <span>{Object.keys(progress || {}).length}/{readers.length} read</span>
  </div>

  <div class="level-tabs" role="tablist" aria-label="Reader levels">
    {#each LEVELS as level}
      <button type="button" class:on={activeLevel === level} on:click={() => (activeLevel = level)}>
        {level}<span>{levelCounts[level] || 0}</span>
      </button>
    {/each}
  </div>

  <div class="reader-grid">
    {#each visibleReaders as item}
      {@const done = progress?.[item.id]}
      <button class="reader-card" type="button" on:click={() => onOpenReader(item)}>
        <span class="level-mark" class:done={!!done}>{done ? '✓' : item.level}</span>
        <span class="card-main">
          <span>{item.genre} · {koreanLength(item)} chars</span>
          <strong>{item.title}</strong>
          <small>{item.titleEn}</small>
        </span>
        <i class="ti ti-arrow-right"></i>
      </button>
    {/each}
  </div>
</section>

<style>
  .reading-room { display: grid; gap: 14px; }
  .room-head { display: flex; align-items: center; justify-content: space-between; gap: 16px;
    padding: 18px; border-radius: var(--radius); background: var(--surface); border: 1px solid var(--border); box-shadow: var(--shadow-1); }
  .kicker { margin: 0 0 4px; color: var(--accent-ink); font-size: 11px; font-weight: 850; letter-spacing: .12em; text-transform: uppercase; }
  h2 { margin: 0; font-family: var(--serif-ko); font-size: 24px; font-weight: 600; letter-spacing: 0; line-height: 1.08; }
  .room-head p:last-child { margin: 4px 0 0; color: var(--ink-2); }
  .room-head > span { flex: none; padding: 8px 12px; border-radius: 999px; background: var(--surface-2);
    color: var(--ink-2); font-size: 12px; font-weight: 850; }
  .level-tabs { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 8px; }
  .level-tabs button { display: flex; align-items: center; justify-content: center; gap: 7px; min-height: 44px;
    border-radius: var(--r-1); background: var(--surface-2); color: var(--ink-2); border: 1px solid var(--border);
    font-weight: 900; }
  .level-tabs button.on { background: var(--ink); color: var(--bg); border-color: var(--ink); }
  .level-tabs span { opacity: .72; font-size: 11px; }
  .reader-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px; }
  .reader-card { display: flex; align-items: center; gap: 12px; min-width: 0; text-align: left; padding: 14px;
    border-radius: var(--r-1); background: var(--primary-wash); border: 1px dashed var(--border-2); box-shadow: var(--shadow-1);
    transition: transform .12s var(--bounce), border-color .12s, background .12s; }
  .reader-card:hover { transform: translateY(-1px); border-color: var(--accent); background: var(--surface); }
  .level-mark { width: 42px; height: 42px; display: grid; place-items: center; flex: none; border-radius: 999px;
    background: var(--primary-wash); color: var(--accent-ink); border: 1px solid var(--accent-soft); font-weight: 900; }
  .level-mark.done { background: var(--green-soft); color: var(--green-dark); border-color: var(--green-soft); }
  .card-main { display: grid; gap: 1px; flex: 1; min-width: 0; }
  .card-main span { color: var(--accent-ink); font-size: 10px; font-weight: 850; letter-spacing: .08em; text-transform: uppercase; }
  .card-main strong { min-width: 0; font-size: 16px; font-weight: 850; overflow-wrap: anywhere; }
  .card-main small { color: var(--ink-2); font-size: 12px; line-height: 1.35; }
  @media (max-width: 720px) {
    .room-head { align-items: flex-start; flex-direction: column; }
    .reader-grid { grid-template-columns: 1fr; }
  }
  @media (max-width: 520px) {
    .level-tabs { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  }
</style>
