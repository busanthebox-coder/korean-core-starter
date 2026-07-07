<script>
  export let items = [];
  export let onDone = () => {};

  let i = 0, score = 0, picked = null, revealed = false, runKey = '';
  let wrongIds = new Set(), correctIds = new Set();

  $: current = items[i];
  $: total = items.length;
  $: nextRunKey = items.map((item) => item.id).join('|');
  $: if (nextRunKey !== runKey) {
    runKey = nextRunKey;
    i = 0; score = 0; picked = null; revealed = false;
    wrongIds = new Set(); correctIds = new Set();
  }
  $: wasCorrect = revealed && picked === current?.answer;
  $: solvedSentence = current ? current.sentence.replace('__', current.answer) : '';

  function choose(option) {
    if (revealed) return;
    picked = option;
    revealed = true;
    if (option === current.answer) {
      score += 1;
      if (current.entryId) correctIds = new Set(correctIds).add(current.entryId);
    } else {
      if (current.entryId) wrongIds = new Set(wrongIds).add(current.entryId);
    }
  }

  function next() {
    if (i + 1 >= total) {
      onDone({ correct: score, total, wrongIds: [...wrongIds], correctIds: [...correctIds] });
      return;
    }
    i += 1;
    picked = null;
    revealed = false;
  }

  const isCorrect = (option) => revealed && option === current.answer;
  const isWrong = (option) => revealed && option === picked && option !== current.answer;
</script>

{#if current}
  <div class="contrast">
    <div class="bar"><span style="width:{(i / total) * 100}%"></span></div>
    <div class="meta"><span>{i + 1} / {total}</span><strong>{current.contrast}</strong></div>

    <div class="card">
      <p class="prompt">{current.prompt}</p>
      <div class="sentence">{current.sentence}</div>
      <div class="options">
        {#each current.options as option}
          <button class="opt" class:correct={isCorrect(option)} class:wrong={isWrong(option)} disabled={revealed} on:click={() => choose(option)}>
            {option}
          </button>
        {/each}
      </div>
    </div>

    {#if revealed}
      <div class="feedback" class:ok={wasCorrect}>
        <strong>{wasCorrect ? '✓ Correct' : `Answer: ${current.answer}`}</strong>
        <div class="solved">{solvedSentence}</div>
        <p>{current.explanation}</p>
        <button class="btn3d" type="button" on:click={next}>{i + 1 >= total ? 'See results' : 'Continue'}</button>
      </div>
    {/if}
  </div>
{/if}

<style>
  .contrast { display: grid; gap: 14px; max-width: 640px; margin: 0 auto; }
  .bar { height: 12px; border-radius: 999px; background: var(--surface-2); overflow: hidden; }
  .bar span { display: block; height: 100%; background: var(--type-pattern); border-radius: 999px; transition: width .3s var(--bounce); }
  .meta { display: flex; align-items: center; justify-content: space-between; gap: 10px;
    font-size: 12px; font-weight: 850; color: var(--ink-3); letter-spacing: .06em; }
  .meta strong { color: var(--type-pattern); }
  .card { display: grid; gap: 16px; padding: 22px; border-radius: var(--radius); background: var(--surface);
    border: 1px solid var(--border); box-shadow: var(--shadow-1); }
  .prompt { margin: 0; color: var(--ink-2); font-size: 15px; font-weight: 760; }
  .sentence { padding: 20px; border-radius: 13px; background: #fff; border: 1px solid var(--border);
    font-size: clamp(24px, 4vw, 38px); font-weight: 850; line-height: 1.25; text-align: center; word-break: keep-all; }
  .options { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 10px; }
  .opt { min-height: 54px; padding: 12px; border-radius: 13px; background: #fff; border: 2px solid var(--border);
    color: var(--ink); font-size: 18px; font-weight: 850; transition: transform .08s var(--bounce), border-color .08s; }
  .opt:hover:not(:disabled) { transform: translateY(-1px); border-color: var(--type-pattern); }
  .opt.correct { border-color: var(--green); background: var(--green-soft); color: var(--green-dark); }
  .opt.wrong { border-color: #ff9b9b; background: #ffeaea; color: #c0392b; }
  .feedback { padding: 16px; border-radius: 14px; background: #fff6e8; border: 1px solid #ffe3b8; display: grid; gap: 8px; justify-items: start; }
  .feedback.ok { background: var(--green-soft); border-color: #cdebac; }
  .feedback strong { font-size: 16px; }
  .solved { font-size: 24px; font-weight: 850; }
  .feedback p { margin: 0; color: var(--ink-2); line-height: 1.55; }
  @media (max-width: 520px) {
    .options { grid-template-columns: 1fr; }
    .card { padding: 16px; }
  }
</style>
