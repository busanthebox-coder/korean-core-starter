<script>
  import { tick } from 'svelte';
  import { speak } from '../audio.js';
  import { gradeDictation } from '../listening.js';

  export let items = [];
  export let compact = false;
  export let onDone = () => {};

  let i = 0;
  let typed = '';
  let picked = '';
  let revealed = false;
  let grade = null;
  let score = 0;
  let plays = {};
  let slow = false;
  let wrongIds = new Set();
  let correctIds = new Set();
  let runKey = '';
  let feedbackNode;

  $: current = items[i];
  $: total = items.length;
  $: nextRunKey = items.map((item) => `${item.id}:${item.type}`).join('|');
  $: if (nextRunKey !== runKey) {
    runKey = nextRunKey;
    i = 0;
    typed = '';
    picked = '';
    revealed = false;
    grade = null;
    score = 0;
    plays = {};
    wrongIds = new Set();
    correctIds = new Set();
  }
  $: playCount = plays[i] || 0;
  $: canPlay = playCount < 3;
  $: wasCorrect = grade?.verdict === 'correct' || (current?.type === 'listenChoice' && picked === current.answer);

  function play() {
    if (!current || !canPlay) return;
    if (speak(current.ko, { rate: slow ? 0.8 : 1 })) plays = { ...plays, [i]: playCount + 1 };
  }

  function mark(ok) {
    const ids = current?.entryIds || [];
    if (ok) {
      score += 1;
      correctIds = new Set([...correctIds, ...ids]);
    } else {
      wrongIds = new Set([...wrongIds, ...ids]);
    }
  }

  async function revealResult(ok) {
    revealed = true;
    mark(ok);
    await tick();
    feedbackNode?.scrollIntoView?.({ block: 'center' });
  }

  function checkDictation() {
    if (!typed.trim() || revealed) return;
    grade = gradeDictation(typed, current);
    void revealResult(grade.verdict === 'correct');
  }

  function choose(option) {
    if (revealed) return;
    picked = option;
    void revealResult(option === current.answer);
  }

  function next() {
    if (i + 1 >= total) {
      onDone({ correct: score, total, wrongIds: [...wrongIds], correctIds: [...correctIds] });
      return;
    }
    i += 1;
    typed = '';
    picked = '';
    revealed = false;
    grade = null;
  }
</script>

{#if current}
  <div class="listen-session" class:compact>
    <div class="listen-top">
      <div class="bar"><span style="width:{total ? (i / total) * 100 : 0}%"></span></div>
      <span>{i + 1} / {total}</span>
    </div>

    <div class="listen-card">
      <p class="tag">{current.type === 'dictation' ? 'Dictation' : 'Listen & choose'}</p>
      <h2 class="screen-h ex-prompt">{current.type === 'dictation' ? 'Listen, then type the Korean sentence.' : 'Listen, then choose the meaning.'}</h2>
      <div class="play-row">
        <button class="btn3d play" type="button" disabled={!canPlay} on:click={play}>
          <i class="ti ti-volume" aria-hidden="true"></i>
          {canPlay ? 'Play sentence' : 'Play limit reached'}
        </button>
        <button class="speed" class:on={slow} type="button" on:click={() => (slow = !slow)}>{slow ? '0.8x' : '1x'}</button>
        <span>{Math.max(0, 3 - playCount)} plays left</span>
      </div>
    </div>

    {#if current.type === 'dictation'}
      <form class="dictation" on:submit|preventDefault={checkDictation}>
        <input
          type="text"
          lang="ko"
          autocomplete="off"
          autocapitalize="off"
          autocorrect="off"
          spellcheck="false"
          placeholder="Type what you heard, in Korean…"
          bind:value={typed}
          disabled={revealed}
        />
        {#if !revealed}<button class="check" type="submit" disabled={!typed.trim()}>Check</button>{/if}
      </form>
    {:else}
      <div class="listen-options">
        {#each current.options || [] as option}
          <button
            class="listen-option"
            class:ok={revealed && option === current.answer}
            class:no={revealed && option === picked && option !== current.answer}
            type="button"
            disabled={revealed}
            on:click={() => choose(option)}
          >{option}</button>
        {/each}
      </div>
    {/if}

    {#if revealed}
      <div bind:this={feedbackNode} class="feedback" class:ok={wasCorrect} class:close={grade?.verdict === 'close'}>
        <strong>{wasCorrect ? 'Correct' : grade?.verdict === 'close' ? 'Close' : 'Answer'}</strong>
        <div class="answer-ko">{current.ko}</div>
        {#if current.romanization}<div class="answer-rom">{current.romanization}</div>{/if}
        <div class="answer-en">{current.en}</div>
        {#if grade?.verdict === 'close'}<p>Almost there. Compare the small missing piece, then listen once more.</p>{/if}
        <div class="feedback-actions">
          <button class="ghost" type="button" on:click={() => speak(current.ko, { rate: slow ? 0.8 : 1 })}>
            <i class="ti ti-volume" aria-hidden="true"></i> Listen again
          </button>
          <button class="btn3d" type="button" on:click={next}>{i + 1 >= total ? 'Finish listening' : 'Continue'}</button>
        </div>
      </div>
    {/if}
  </div>
{/if}

<style>
  .listen-session { display: grid; gap: 14px; max-width: 560px; margin: 0 auto; }
  .listen-session.compact { max-width: none; }
  .listen-top { display: grid; grid-template-columns: 1fr auto; gap: 10px; align-items: center; color: var(--ink-3); font-size: 12px; font-weight: 850; }
  .bar { height: 10px; border-radius: 999px; background: var(--surface-2); border: 1px solid var(--border); overflow: hidden; }
  .bar span { display: block; height: 100%; border-radius: 999px; background: var(--green); transition: width .3s var(--bounce); }
  .listen-card { display: grid; gap: 10px; padding: 14px; border-radius: var(--r-1); background: var(--surface-2); border: 1px solid var(--border); }
  .tag { margin: 0; font-size: 11px; font-weight: 850; letter-spacing: .14em; text-transform: uppercase; color: var(--green-dark); }
  .play-row { display: flex; align-items: center; flex-wrap: wrap; gap: 8px; }
  .play { gap: 6px; }
  .speed { min-width: 50px; padding: 9px 12px; border-radius: 999px; border: 1px solid var(--border); background: var(--surface); color: var(--ink-2); font-size: 12px; font-weight: 850; }
  .speed.on { border-color: var(--green); color: var(--green-dark); background: var(--green-soft); }
  .play-row span { color: var(--ink-3); font-size: 12px; font-weight: 750; }
  .dictation { display: grid; gap: 10px; }
  .dictation input { width: 100%; min-width: 0; box-sizing: border-box; padding: 12px 13px; border-radius: var(--r-1); border: 1.5px solid var(--border); background: var(--surface); font: inherit; font-size: 16px; }
  .dictation input:focus { outline: none; border-color: var(--primary); }
  .check { justify-self: start; padding: 10px 20px; border-radius: 999px; background: var(--primary); color: var(--primary-on); font-weight: 850; box-shadow: 0 3px 0 var(--primary-press); }
  .check:disabled, .play:disabled { opacity: .48; box-shadow: none; }
  .listen-options { display: grid; gap: 10px; }
  .listen-option { padding: 14px 15px; border-radius: var(--r-1); border: 1.5px solid var(--border); background: var(--surface); color: var(--ink); font-size: 15px; font-weight: 750; text-align: left; line-height: 1.35; }
  .listen-option:hover:not(:disabled) { border-color: var(--green); transform: translateY(-1px); }
  .listen-option.ok { border-color: var(--green); background: var(--green-soft); color: var(--green-dark); }
  .listen-option.no { border-color: var(--danger); background: var(--danger-soft); color: var(--danger); }
  .feedback { display: grid; gap: 6px; padding: 12px; border-radius: var(--r-1); background: var(--danger-soft); color: var(--ink); border: 1px solid var(--danger-soft); }
  .feedback.ok { background: var(--green-soft); border-color: var(--green-soft); }
  .feedback.close { background: var(--gold-wash); border-color: var(--gold-wash); }
  .feedback strong { font-size: 13px; font-weight: 900; text-transform: uppercase; letter-spacing: .08em; color: var(--green-dark); }
  .feedback:not(.ok) strong { color: var(--danger); }
  .feedback.close strong { color: var(--accent-ink); }
  .answer-ko { font-size: 18px; font-weight: 850; line-height: 1.35; }
  .answer-rom, .answer-en, .feedback p { margin: 0; color: var(--ink-3); font-size: 13px; line-height: 1.45; }
  .feedback-actions { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; margin-top: 4px; }
  .ghost { display: inline-flex; align-items: center; gap: 6px; padding: 9px 13px; border-radius: 999px; border: 1px solid var(--border); background: var(--surface); color: var(--ink-2); font-size: 12px; font-weight: 850; }
  .ghost:hover { border-color: var(--green); color: var(--green-dark); }

  @media (max-width: 520px) {
    .listen-session { padding-bottom: 84px; }
    .feedback-actions .btn3d, .feedback-actions .ghost, .play { width: 100%; justify-content: center; }
  }
</style>
