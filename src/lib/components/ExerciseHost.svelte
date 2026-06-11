<script>
  import { speak } from '../audio.js';
  import { normalizeKo } from '../quiz.js';
  import RomanizationLine from './RomanizationLine.svelte';

  export let questions = [];
  export let onDone = () => {};

  let i = 0, score = 0, picked = null, revealed = false, lastPlayed = -1;
  let wrongIds = new Set(), correctIds = new Set(), runKey = '';
  // production state
  let typed = '';
  let wasCorrect = false;
  let bank = [];   // word-bank tiles not yet used: { t, k }
  let built = [];  // tiles placed into the answer line: { t, k }
  let lastSetup = -1;

  $: current = questions[i];
  $: total = questions.length;
  $: nextRunKey = questions.map((q) => `${q.entryId || ''}:${q.answer || ''}`).join('|');
  $: if (nextRunKey !== runKey) {
    runKey = nextRunKey;
    i = 0; score = 0; picked = null; revealed = false; lastPlayed = -1;
    wrongIds = new Set(); correctIds = new Set();
  }
  // Auto-play once when a listen question appears.
  $: if (current && current.type === 'listen' && i !== lastPlayed) { lastPlayed = i; speak(current.audio); }
  // Reset per-question production state whenever we land on a new question.
  $: if (current && lastSetup !== i) {
    lastSetup = i;
    typed = ''; built = []; revealed = false; picked = null; wasCorrect = false;
    bank = current.type === 'build' ? current.scrambled.map((t, k) => ({ t, k })) : [];
  }

  function choose(opt) {
    if (revealed) return;
    picked = opt; revealed = true; wasCorrect = opt === current.answer;
    if (wasCorrect) score += 1;
    noteResult(wasCorrect);
  }
  function checkType() {
    if (revealed || !typed.trim()) return;
    revealed = true; wasCorrect = normalizeKo(typed) === normalizeKo(current.answer);
    if (wasCorrect) score += 1;
    noteResult(wasCorrect);
  }
  function placeTile(tile) {
    if (revealed) return;
    built = [...built, tile];
    bank = bank.filter((b) => b.k !== tile.k);
  }
  function unplaceTile(tile) {
    if (revealed) return;
    bank = [...bank, tile];
    built = built.filter((b) => b.k !== tile.k);
  }
  function checkBuild() {
    if (revealed || !built.length) return;
    revealed = true;
    wasCorrect = built.map((b) => b.t).join(' ') === current.tokens.join(' ');
    if (wasCorrect) score += 1;
    noteResult(wasCorrect);
  }
  function noteResult(ok) {
    if (!current?.entryId) return;
    if (ok) correctIds = new Set(correctIds).add(current.entryId);
    else wrongIds = new Set(wrongIds).add(current.entryId);
  }
  function next() {
    if (i + 1 >= total) { onDone({ correct: score, total, wrongIds: [...wrongIds], correctIds: [...correctIds] }); return; }
    i += 1;
  }
  const isCorrect = (opt) => revealed && opt === current.answer;
  const isWrong = (opt) => revealed && opt === picked && opt !== current.answer;
</script>

{#if current}
  <div class="ex">
    <div class="bar"><span style="width:{(i / total) * 100}%"></span></div>
    <div class="qno">{i + 1} / {total}</div>

    {#if current.type === 'mc' || current.type === 'listen'}
      <div class="prompt">
        {#if current.type === 'listen'}
          <button class="listen btn3d" type="button" on:click={() => speak(current.audio)}>▶ Play again</button>
          <p class="ask">Which one did you hear?</p>
        {:else}
          <div class="ask-ko">{current.prompt}</div>
          {#if current.promptRomanization}<RomanizationLine text={current.promptRomanization} />{/if}
          <p class="ask">{current.direction === 'enToKo' ? 'Choose the Korean' : 'Choose the meaning'}</p>
        {/if}
      </div>
      <div class="options">
        {#each current.options as opt}
          <button class="opt" class:correct={isCorrect(opt)} class:wrong={isWrong(opt)} disabled={revealed} on:click={() => choose(opt)}>{opt}</button>
        {/each}
      </div>

    {:else if current.type === 'type'}
      <div class="prompt">
        <p class="tag">Type it in Korean</p>
        <div class="ask-en">{current.prompt}</div>
      </div>
      <form class="typer" on:submit|preventDefault={checkType}>
        <input class="tin" type="text" lang="ko" autocomplete="off" autocapitalize="off" autocorrect="off"
          spellcheck="false" placeholder="한국어로 입력…" bind:value={typed} disabled={revealed} />
        {#if !revealed}<button class="btn3d" type="submit" disabled={!typed.trim()}>Check</button>{/if}
      </form>

    {:else if current.type === 'build'}
      <div class="prompt">
        <p class="tag">Build the sentence</p>
        <div class="ask-en">{current.prompt}</div>
      </div>
      <div class="answer-line" class:filled={built.length}>
        {#each built as tile (tile.k)}
          <button class="tile placed" disabled={revealed} on:click={() => unplaceTile(tile)}>{tile.t}</button>
        {:else}
          <span class="ph">Tap the words below in order…</span>
        {/each}
      </div>
      <div class="word-bank">
        {#each bank as tile (tile.k)}
          <button class="tile" disabled={revealed} on:click={() => placeTile(tile)}>{tile.t}</button>
        {/each}
      </div>
      {#if !revealed}<button class="btn3d check" type="button" disabled={!built.length} on:click={checkBuild}>Check</button>{/if}
    {/if}

    {#if revealed}
      <div class="feedback" class:ok={wasCorrect}>
        <strong>
          {#if wasCorrect}✓ Correct!{:else if current.type === 'type'}Answer: {current.answer}{:else if current.type === 'build'}Not quite — correct order:{:else}Answer: {current.answer}{/if}
        </strong>
        {#if !wasCorrect && (current.type === 'build')}<div class="ans-ko">{current.answer}</div>{/if}
        {#if (current.type === 'type') && current.answerRomanization}<RomanizationLine text={current.answerRomanization} />{/if}
        {#if (current.type === 'type' || current.type === 'build')}
          <button class="say" type="button" on:click={() => speak(current.answer)}>🔊 Listen</button>
        {/if}
        <p>{current.reason}</p>
        <button class="btn3d" type="button" on:click={next}>{i + 1 >= total ? 'See results' : 'Continue'}</button>
      </div>
    {/if}
  </div>
{/if}

<style>
  .ex { display: grid; gap: 14px; max-width: 560px; margin: 0 auto; }
  .bar { height: 12px; border-radius: 999px; background: var(--surface-2); overflow: hidden; }
  .bar span { display: block; height: 100%; background: var(--green); border-radius: 999px; transition: width .3s var(--bounce); }
  .qno { color: var(--ink-3); font-weight: 800; font-size: 13px; text-align: center; }
  .prompt { display: grid; justify-items: center; gap: 6px; padding: 20px 0; }
  .ask-ko { font-size: 44px; font-weight: 880; }
  .ask-en { font-size: 26px; font-weight: 820; text-align: center; line-height: 1.2; }
  .ask { margin: 4px 0 0; color: var(--ink-2); font-weight: 700; }
  .tag { margin: 0; font-size: 11px; font-weight: 800; letter-spacing: .14em; text-transform: uppercase; color: var(--green-dark); }
  .listen { font-size: 16px; }
  .options { display: grid; gap: 10px; }
  .opt { padding: 15px 16px; border-radius: 14px; background: var(--surface); border: 2px solid var(--border);
    font-size: 17px; font-weight: 750; text-align: center; transition: transform .08s var(--bounce); }
  .opt:hover:not(:disabled) { border-color: var(--green); transform: translateY(-1px); }
  .opt.correct { border-color: var(--green); background: var(--green-soft); color: var(--green-dark); }
  .opt.wrong { border-color: #ff9b9b; background: #ffeaea; color: #c0392b; }

  /* Type */
  .typer { display: flex; gap: 8px; }
  .tin { flex: 1; padding: 15px 16px; border-radius: 14px; border: 2px solid var(--border); background: var(--surface);
    font-size: 22px; font-weight: 760; }
  .tin:focus { outline: none; border-color: var(--green); }
  .typer .btn3d { white-space: nowrap; }

  /* Build */
  .answer-line { display: flex; flex-wrap: wrap; gap: 8px; min-height: 56px; padding: 12px 14px; align-items: center;
    border-radius: 14px; border: 2px dashed var(--border); background: var(--surface-2); }
  .answer-line.filled { border-style: solid; }
  .ph { color: var(--ink-3); font-size: 14px; }
  .word-bank { display: flex; flex-wrap: wrap; gap: 8px; justify-content: center; }
  .tile { padding: 11px 15px; border-radius: 12px; background: var(--surface); border: 2px solid var(--border);
    font-size: 18px; font-weight: 760; transition: transform .08s var(--bounce); }
  .tile:hover:not(:disabled) { border-color: var(--green); transform: translateY(-1px); }
  .tile.placed { background: var(--green-soft); border-color: var(--green); }
  .check { justify-self: center; }

  .feedback { padding: 16px; border-radius: 14px; background: #fff6e8; border: 1px solid #ffe3b8; display: grid; gap: 8px; justify-items: start; }
  .feedback.ok { background: var(--green-soft); border-color: #cdebac; }
  .feedback strong { font-size: 16px; }
  .ans-ko { font-size: 22px; font-weight: 820; }
  .say { padding: 6px 12px; border-radius: 999px; background: var(--surface); border: 1px solid var(--border); font-weight: 750; font-size: 13px; }
  .feedback p { margin: 0; color: var(--ink-2); line-height: 1.5; }
  .feedback .btn3d { justify-self: start; }
</style>
