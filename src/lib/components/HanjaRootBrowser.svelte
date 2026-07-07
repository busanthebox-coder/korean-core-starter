<script>
  import { hanjaRoots, findEntry } from '../data.js';
  import { buildHanjaRootQuiz } from '../hanjaQuiz.js';

  const LEVELS = ['All', 'A2', 'B1'];
  let level = 'All';
  let query = '';
  let openRootId = hanjaRoots[0]?.id || null;
  let answers = {};

  $: roots = hanjaRoots.filter((root) => {
    const text = `${root.reading} ${root.hanja} ${root.gloss} ${root.note} ${(root.members || []).map((member) => member.hangul).join(' ')}`.toLowerCase();
    return (level === 'All' || root.level === level) && text.includes(query.trim().toLowerCase());
  });
  $: selectedRoot = roots.find((root) => root.id === openRootId) || roots[0] || null;
  $: quiz = selectedRoot ? buildHanjaRootQuiz(selectedRoot, hanjaRoots) : [];

  function choose(question, option) {
    answers = { ...answers, [question.id]: option.entryId };
  }
</script>

<section class="root-browser" aria-labelledby="hanja-root-browser-title">
  <div class="rb-head">
    <div>
      <span class="eyebrow">Word network</span>
      <h2 id="hanja-root-browser-title">Hanja Root Families</h2>
      <p>Recognize the sound-and-meaning blocks behind Korean words. No writing or stroke order here.</p>
    </div>
    <span class="rb-count">{hanjaRoots.length} roots</span>
  </div>

  <div class="rb-tools">
    <input type="search" placeholder="Search root or word" bind:value={query} />
    <div class="level-tabs" aria-label="Root level filter">
      {#each LEVELS as item}
        <button class:on={level === item} on:click={() => (level = item)}>{item}</button>
      {/each}
    </div>
  </div>

  <div class="rb-layout">
    <div class="root-grid">
      {#each roots as root}
        <button class:active={selectedRoot?.id === root.id} on:click={() => (openRootId = root.id)}>
          <span class="hanja">{root.hanja}</span>
          <span><strong>{root.reading}</strong><em>{root.gloss}</em></span>
          <small>{root.members.length}</small>
        </button>
      {/each}
    </div>

    {#if selectedRoot}
      <article class="root-panel">
        <header>
          <span class="panel-hanja">{selectedRoot.hanja}</span>
          <div>
            <h3>{selectedRoot.reading} · {selectedRoot.gloss}</h3>
            <p>{selectedRoot.note}</p>
          </div>
        </header>
        <div class="member-list">
          {#each selectedRoot.members as member}
            {@const entry = findEntry(member.entryId)}
            <div class="member-row">
              <strong>{member.hangul}</strong>
              <span>{entry?.english || ''}</span>
              <em>{member.breakdown}</em>
            </div>
          {/each}
        </div>

        <div class="quiz">
          <h4>Mini Quiz</h4>
          {#each quiz as question}
            <div class="q">
              <p>{question.prompt}</p>
              <div class="q-options">
                {#each question.options as option}
                  <button
                    class:chosen={answers[question.id] === option.entryId}
                    class:right={answers[question.id] && option.entryId === question.correctEntryId}
                    class:wrong={answers[question.id] === option.entryId && option.entryId !== question.correctEntryId}
                    on:click={() => choose(question, option)}
                  >
                    {option.hangul}
                  </button>
                {/each}
              </div>
            </div>
          {/each}
        </div>
      </article>
    {:else}
      <p class="empty">No roots match this search.</p>
    {/if}
  </div>
</section>

<style>
  .root-browser { margin-top: 14px; padding-top: 18px; border-top: 1px solid var(--rule); display: grid; gap: 14px; }
  .rb-head { display: flex; justify-content: space-between; gap: 16px; align-items: start; }
  .rb-head h2 { margin: 2px 0 3px; font-family: var(--serif-ko); font-size: 28px; font-weight: 600; letter-spacing: -0.02em; }
  .rb-head p { margin: 0; color: var(--ink-3); max-width: 58ch; }
  .rb-count { padding: 7px 10px; border-radius: 999px; background: var(--surface-2); border: 1px solid var(--border); font-size: 12px; font-weight: 800; color: var(--ink-2); white-space: nowrap; }
  .rb-tools { display: flex; gap: 10px; align-items: center; flex-wrap: wrap; }
  .rb-tools input { flex: 1; min-width: 220px; padding: 11px 13px; border: 1px solid var(--border); border-radius: 9px; background: var(--surface); }
  .level-tabs { display: flex; gap: 6px; }
  .level-tabs button { padding: 7px 11px; border-radius: 999px; border: 1px solid var(--border); background: var(--surface); color: var(--ink-2); font-weight: 800; font-size: 12px; }
  .level-tabs button.on { background: var(--primary); color: var(--primary-on); border-color: var(--primary); }
  .rb-layout { display: grid; grid-template-columns: minmax(240px, 1fr) minmax(320px, 1.4fr); gap: 14px; align-items: start; }
  .root-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(138px, 1fr)); gap: 8px; }
  .root-grid button { display: grid; grid-template-columns: auto 1fr auto; align-items: center; gap: 8px; text-align: left; padding: 10px; border-radius: var(--r-1); border: 1px solid var(--border); background: var(--surface); }
  .root-grid button.active { border-color: var(--accent); background: var(--accent-soft); }
  .hanja { display: grid; place-items: center; width: 34px; height: 34px; border-radius: 9px; background: var(--surface-2); font-family: var(--serif-ko); font-size: 21px; }
  .root-grid strong { display: block; color: var(--ink); }
  .root-grid em { display: block; font-style: normal; color: var(--ink-3); font-size: 11px; line-height: 1.3; }
  .root-grid small { color: var(--ink-3); font-weight: 800; }
  .root-panel { border: 1px solid var(--border); background: var(--surface); border-radius: var(--radius); box-shadow: var(--shadow-1); padding: 16px; display: grid; gap: 14px; }
  .root-panel header { display: flex; gap: 13px; align-items: center; }
  .panel-hanja { display: grid; place-items: center; min-width: 66px; height: 66px; border-radius: 16px; background: var(--surface-2); border: 1px solid var(--border); font-family: var(--serif-ko); font-size: 38px; }
  .root-panel h3 { margin: 0 0 2px; font-size: 18px; }
  .root-panel p { margin: 0; color: var(--ink-2); }
  .member-list { display: grid; gap: 7px; }
  .member-row { display: grid; grid-template-columns: minmax(76px, auto) 1fr; gap: 4px 10px; padding: 9px 0; border-bottom: 1px solid var(--border); }
  .member-row strong { font-size: 16px; }
  .member-row span { color: var(--ink-2); }
  .member-row em { grid-column: 1 / -1; font-style: normal; color: var(--ink-3); font-size: 12px; }
  .quiz { display: grid; gap: 10px; padding-top: 2px; }
  .quiz h4 { margin: 0; font-size: 11px; font-weight: 800; letter-spacing: .14em; text-transform: uppercase; color: var(--ink-3); }
  .q { display: grid; gap: 7px; }
  .q-options { display: flex; flex-wrap: wrap; gap: 7px; }
  .q-options button { padding: 8px 12px; border-radius: 999px; border: 1px solid var(--border); background: var(--surface-2); font-weight: 800; }
  .q-options button.chosen { border-color: var(--ink); }
  .q-options button.right { background: var(--green-soft); border-color: var(--green); color: var(--green-dark); }
  .q-options button.wrong { background: var(--danger-soft); border-color: var(--danger); color: var(--danger); }
  .empty { align-self: start; padding: 18px; border: 1px solid var(--border); border-radius: var(--r-1); background: var(--surface); color: var(--ink-3); }
  @media (max-width: 820px) { .rb-layout { grid-template-columns: 1fr; } }
  @media (max-width: 520px) {
    .rb-head { display: grid; }
    .member-row { grid-template-columns: 1fr; }
  }
</style>
