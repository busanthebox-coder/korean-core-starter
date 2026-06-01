<script>
  import { speak } from '../audio.js';
  import RomanizationLine from './RomanizationLine.svelte';

  export let questions = [];
  export let onDone = () => {};

  let i = 0, score = 0, picked = null, revealed = false, lastPlayed = -1;
  $: current = questions[i];
  $: total = questions.length;
  // Auto-play once when a listen question appears.
  $: if (current && current.type === 'listen' && i !== lastPlayed) { lastPlayed = i; speak(current.audio); }

  function choose(opt) {
    if (revealed) return;
    picked = opt;
    revealed = true;
    if (opt === current.answer) score += 1;
  }
  function next() {
    if (i + 1 >= total) { onDone({ correct: score, total }); return; }
    i += 1; picked = null; revealed = false;
  }
  const isCorrect = (opt) => revealed && opt === current.answer;
  const isWrong = (opt) => revealed && opt === picked && opt !== current.answer;
</script>

{#if current}
  <div class="ex">
    <div class="bar"><span style="width:{(i / total) * 100}%"></span></div>
    <div class="qno">{i + 1} / {total}</div>

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

    {#if revealed}
      <div class="feedback" class:ok={picked === current.answer}>
        <strong>{picked === current.answer ? '✓ Correct!' : `Answer: ${current.answer}`}</strong>
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
  .ask { margin: 4px 0 0; color: var(--ink-2); font-weight: 700; }
  .listen { font-size: 16px; }
  .options { display: grid; gap: 10px; }
  .opt { padding: 15px 16px; border-radius: 14px; background: var(--surface); border: 2px solid var(--border);
    font-size: 17px; font-weight: 750; text-align: center; transition: transform .08s var(--bounce); }
  .opt:hover:not(:disabled) { border-color: var(--green); transform: translateY(-1px); }
  .opt.correct { border-color: var(--green); background: var(--green-soft); color: var(--green-dark); }
  .opt.wrong { border-color: #ff9b9b; background: #ffeaea; color: #c0392b; }
  .feedback { padding: 16px; border-radius: 14px; background: #fff6e8; border: 1px solid #ffe3b8; display: grid; gap: 8px; }
  .feedback.ok { background: var(--green-soft); border-color: #cdebac; }
  .feedback strong { font-size: 16px; }
  .feedback p { margin: 0; color: var(--ink-2); line-height: 1.5; }
  .feedback .btn3d { justify-self: start; }
</style>
