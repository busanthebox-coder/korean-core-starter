<script>
  import ChatBubble from './ChatBubble.svelte';
  import { reactionAnswerOf, reactionEntryIds, reactionOptionsFor } from '../reactions.js';

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
  $: shownOptions = current ? reactionOptionsFor(current) : [];
  $: answer = current ? reactionAnswerOf(current) : null;
  $: wasCorrect = revealed && picked?.natural === true;

  function choose(option) {
    if (revealed) return;
    picked = option;
    revealed = true;
    const ids = reactionEntryIds(current);
    if (option.natural) {
      score += 1;
      if (ids.length) correctIds = new Set([...correctIds, ...ids]);
    } else if (ids.length) {
      wrongIds = new Set([...wrongIds, ...ids]);
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
</script>

{#if current}
  <div class="react">
    <div class="bar"><span style="width:{(i / total) * 100}%"></span></div>
    <div class="meta"><span>{i + 1} / {total}</span><strong>They said…</strong></div>

    <div class="card">
      <div class="said">
        <ChatBubble side="left" name="친구" ko={current.partnerKo} en={current.partnerEn} showAvatar={true} />
      </div>
      <p class="prompt">Which reaction fits?</p>
      <div class="options">
        {#each shownOptions as option (option.ko)}
          <button class="opt"
            class:correct={revealed && option.natural}
            class:wrong={revealed && picked === option && !option.natural}
            disabled={revealed} on:click={() => choose(option)}>{option.ko}</button>
        {/each}
      </div>
    </div>

    {#if revealed}
      <div class="feedback" class:ok={wasCorrect}>
        <strong>{wasCorrect ? '✓ Natural' : `A natural reaction: ${answer?.ko}`}</strong>
        {#if !wasCorrect && picked}<p class="miss">{picked.ko} — {picked.why}</p>{/if}
        <p>{answer?.why}</p>
        <button class="btn3d" type="button" on:click={next}>{i + 1 >= total ? 'See results' : 'Continue'}</button>
      </div>
    {/if}
  </div>
{/if}

<style>
  .react { display: grid; gap: 14px; max-width: 640px; margin: 0 auto; }
  .bar { height: 12px; border-radius: 999px; background: var(--surface-2); overflow: hidden; }
  .bar span { display: block; height: 100%; background: var(--green); border-radius: 999px; transition: width .3s var(--bounce); }
  .meta { display: flex; align-items: center; justify-content: space-between; gap: 10px;
    font-size: 12px; font-weight: 850; color: var(--ink-3); letter-spacing: .06em; }
  .meta strong { color: var(--green-dark); }
  .card { display: grid; gap: 16px; padding: 22px; border-radius: var(--radius); background: var(--surface);
    border: 1px solid var(--border); box-shadow: var(--shadow-1); }
  .said { padding: 14px; border-radius: 13px; background: #e9eef5; }
  .prompt { margin: 0; color: var(--ink-2); font-size: 15px; font-weight: 760; }
  .options { display: grid; gap: 10px; }
  .opt { min-height: 54px; padding: 12px 16px; border-radius: 13px; background: #fff; border: 2px solid var(--border);
    color: var(--ink); font-size: 17px; font-weight: 800; text-align: left;
    transition: transform .08s var(--bounce), border-color .08s; }
  .opt:hover:not(:disabled) { transform: translateY(-1px); border-color: var(--green); }
  .opt.correct { border-color: var(--green); background: var(--green-soft); color: var(--green-dark); }
  .opt.wrong { border-color: #ff9b9b; background: #ffeaea; color: #c0392b; }
  .feedback { padding: 16px; border-radius: 14px; background: #fff6e8; border: 1px solid #ffe3b8; display: grid; gap: 8px; justify-items: start; }
  .feedback.ok { background: var(--green-soft); border-color: #cdebac; }
  .feedback strong { font-size: 16px; }
  .feedback p { margin: 0; color: var(--ink-2); line-height: 1.55; }
  .miss { color: #9a3324; }
  @media (max-width: 520px) { .card { padding: 16px; } }
</style>
