<script>
  import MatchGame from '../MatchGame.svelte';
  import ConjugationSession from '../ConjugationSession.svelte';
  import ListeningSession from '../ListeningSession.svelte';
  import { scrambledOrderTokens } from '../../inlineExercise.js';

  export let kind = 'exercise';
  export let data = {};
  export let answer = '';
  export let isRevealed = false;
  export let correctOf = () => '';
  export let isCorrect = () => false;
  export let onPick = () => {};
  export let onCheck = () => {};
  export let onInput = () => {};
  export let onMatchDone = () => {};
  export let onConjugationDone = () => {};
  export let onListeningDone = () => {};
  export let writingState = { checkedIds: [], skipped: false };
  export let onWritingCheck = () => {};
  export let onWritingSkip = () => {};

  let orderKey = '';
  let orderBank = [];
  let orderPicked = [];

  $: isOrderWords = kind === 'exercise' && data?.type === 'orderWords';
  $: nextOrderKey = isOrderWords ? `${(data?.tokens || []).join('|')}|${correctOf(data)}` : '';
  $: if (nextOrderKey !== orderKey) {
    orderKey = nextOrderKey;
    orderBank = isOrderWords
      ? scrambledOrderTokens(data?.tokens || []).map((text, index) => ({ text, key: `${index}-${text}` }))
      : [];
    orderPicked = [];
    if (isOrderWords) onInput('');
  }
  $: hasAnswer = isOrderWords ? orderPicked.length > 0 && orderBank.length === 0 : answer != null && answer !== '';

  function emitOrderAnswer(items) {
    onInput(items.map((item) => item.text).join(' '));
  }

  function pickOrderToken(token) {
    if (isRevealed) return;
    const nextPicked = [...orderPicked, token];
    orderPicked = nextPicked;
    orderBank = orderBank.filter((item) => item.key !== token.key);
    emitOrderAnswer(nextPicked);
  }

  function unpickOrderToken(token) {
    if (isRevealed) return;
    const nextPicked = orderPicked.filter((item) => item.key !== token.key);
    orderPicked = nextPicked;
    orderBank = [...orderBank, token].sort((a, b) => a.key.localeCompare(b.key));
    emitOrderAnswer(nextPicked);
  }
</script>

{#if kind === 'exercise'}
  {#if data.isSpiralReview}
    <div class="review-badge">복습 · Chapter {data.sourceChapterNumber}</div>
  {/if}
  <h2 class="screen-h ex-prompt">{data.prompt}</h2>
  {#if data.type === 'conjugate' && (data.base || data.form)}
    <div class="ex-meta">
      {#if data.base}<span>{data.base}</span>{/if}
      {#if data.form}<span>{data.form}</span>{/if}
    </div>
  {/if}
  {#if isOrderWords}
    <div class="order-build">
      <div class="order-answer" class:filled={orderPicked.length}>
        {#each orderPicked as token (token.key)}
          <button class="word-tile placed" type="button" disabled={isRevealed} on:click={() => unpickOrderToken(token)}>{token.text}</button>
        {:else}
          <span>Tap the words in Korean order.</span>
        {/each}
      </div>
      <div class="order-bank">
        {#each orderBank as token (token.key)}
          <button class="word-tile" type="button" disabled={isRevealed} on:click={() => pickOrderToken(token)}>{token.text}</button>
        {/each}
      </div>
    </div>
  {:else if (data.options || []).length}
    <div class="ex-opts">
      {#each data.options as opt}
        <button class="ex-opt"
          class:picked={answer === opt}
          class:ok={isRevealed && opt === correctOf(data)}
          class:no={isRevealed && answer === opt && opt !== correctOf(data)}
          disabled={isRevealed} on:click={() => onPick(opt)}>{opt}</button>
      {/each}
    </div>
  {:else}
    <input class="ex-input" type="text" value={answer || ''} placeholder="Type your answer…" disabled={isRevealed}
      on:input={(e) => onInput(e.currentTarget.value)}
      on:keydown={(e) => e.key === 'Enter' && onCheck()} />
    {#if data.hint && !isRevealed}<div class="ex-hint"><i class="ti ti-bulb"></i> {data.hint}</div>{/if}
  {/if}
  {#if !isRevealed}
    <button class="check" disabled={!hasAnswer} on:click={onCheck}>Check</button>
  {:else}
    <div class="verdict" class:ok={isCorrect()}>{isCorrect() ? '✓ Correct!' : `✗ Answer: ${correctOf(data)}`}</div>
    {#if data.explanation}<div class="ex-explain">{data.explanation}</div>{/if}
  {/if}
{:else if kind === 'match'}
  <h2 class="screen-h">Match the words</h2>
  {#if data?.hint}<p class="screen-sub">{data.hint}</p>{/if}
  <MatchGame pairs={data?.pairs || []} onDone={onMatchDone} />
  {#if !isRevealed}<div class="ex-hint"><i class="ti ti-bulb"></i> Match every pair to unlock the next step.</div>{/if}
{:else if kind === 'writing'}
  <h2 class="screen-h">Write it</h2>
  <p class="screen-sub">{data.prompt}</p>
  {#if data.hint}<div class="ex-hint"><i class="ti ti-bulb" aria-hidden="true"></i> {data.hint}</div>{/if}
  <textarea class="w-area" rows="3" placeholder="여기에 써 보세요…" value={answer || ''} on:input={(e) => onInput(e.currentTarget.value)}></textarea>
  {#if (data.checkItems || []).length}
    <div class="w-check">
      <div class="w-check-head">
        <strong>쓴 글 점검</strong>
        <span>자동 채점은 아니고, 오늘 목표를 직접 확인하는 단계예요.</span>
      </div>
      <div class="w-check-list">
        {#each data.checkItems as item}
          <label class="w-check-row">
            <input
              type="checkbox"
              checked={(writingState.checkedIds || []).includes(item.id)}
              on:change={(e) => onWritingCheck(item.id, e.currentTarget.checked)}
            />
            <span>{item.label}</span>
          </label>
        {/each}
      </div>
      <div class="w-check-foot">
        <button class="skip-check" type="button" on:click={onWritingSkip}>Skip self-check</button>
        {#if writingState.skipped}<span>이번 글은 점검 없이 넘어갑니다.</span>{/if}
      </div>
    </div>
  {/if}
  {#if data.model}
    <details class="w-model">
      <summary>Show a model answer</summary>
      <div class="w-model-body"><div class="w-ko">{data.model}</div>{#if data.modelEn}<div class="w-en">{data.modelEn}</div>{/if}</div>
    </details>
  {/if}
{:else if kind === 'conjugation'}
  <h2 class="screen-h">Conjugate it</h2>
  <p class="screen-sub">Change each word into the form this chapter is teaching.</p>
  <ConjugationSession items={data?.items || []} onDone={onConjugationDone} compact />
{:else if kind === 'listening'}
  <h2 class="screen-h">Listening practice</h2>
  <p class="screen-sub">Use the audio first. The Korean sentence appears only after you answer.</p>
  <ListeningSession items={data?.items || []} onDone={onListeningDone} compact />
{/if}

<style>
  .ex-opts { display: flex; flex-wrap: wrap; gap: 8px; }
  .review-badge { justify-self: start; margin-bottom: -2px; padding: 5px 9px; border-radius: 999px;
    background: var(--green-soft); color: var(--green-dark); font-size: 11px; font-weight: 850;
    letter-spacing: .08em; text-transform: uppercase; }
  .ex-opt { padding: 11px 18px; border-radius: 999px; border: 1.5px solid var(--border); background: var(--surface); font-size: 16px; font-weight: 700; }
  .ex-opt.picked { border-color: var(--primary); background: var(--primary-wash); }
  .ex-opt.ok { border-color: var(--green); background: var(--green-soft); color: var(--green-dark); }
  .ex-opt.no { border-color: #e3b4ab; background: var(--danger-soft); color: #9a3324; }
  .ex-meta { display: flex; flex-wrap: wrap; gap: 8px; margin-top: -2px; }
  .ex-meta span { padding: 4px 9px; border-radius: 999px; background: var(--surface-2); color: var(--ink-2); font-size: 12px; font-weight: 800; }
  .ex-input { width: 100%; padding: 11px 14px; border-radius: var(--r-1); border: 1.5px solid var(--border); background: var(--surface); font: inherit; font-size: 16px; }
  .ex-input:focus { outline: none; border-color: var(--primary); }
  .order-build { display: grid; gap: 12px; }
  .order-answer { min-height: 58px; display: flex; flex-wrap: wrap; align-items: center; gap: 8px; padding: 11px 13px;
    border-radius: var(--r-1); border: 2px dashed var(--border); background: var(--surface-2); color: var(--ink-3); font-size: 14px; }
  .order-answer.filled { border-style: solid; color: var(--ink); }
  .order-bank { display: flex; flex-wrap: wrap; gap: 8px; }
  .word-tile { padding: 10px 14px; border-radius: 12px; border: 1.5px solid var(--border); background: var(--surface); font-size: 16px; font-weight: 800; }
  .word-tile:hover:not(:disabled) { border-color: var(--green); transform: translateY(-1px); }
  .word-tile.placed { background: var(--green-soft); border-color: var(--green); color: var(--green-dark); }
  .word-tile:disabled { opacity: .62; }
  .ex-hint { font-size: 12px; color: var(--ink-3); }
  .check { justify-self: start; padding: 10px 20px; border-radius: 999px; background: var(--primary); color: var(--primary-on); font-weight: 850; box-shadow: 0 3px 0 var(--primary-press); }
  .check:disabled { opacity: .45; box-shadow: none; }
  .verdict { font-size: 14px; font-weight: 800; padding: 8px 12px; border-radius: var(--r-1); background: var(--danger-soft); color: #9a3324; }
  .verdict.ok { background: var(--green-soft); color: var(--green-dark); }
  .ex-explain { font-size: 13px; color: var(--ink-2); line-height: 1.55; }
  .w-area { width: 100%; padding: 12px 13px; border-radius: var(--r-1); border: 1px solid var(--border); background: var(--surface); font: inherit; font-size: 16px; resize: vertical; }
  .w-area:focus { outline: none; border-color: var(--primary); }
  .w-check { display: grid; gap: 10px; padding: 12px; border-radius: var(--r-1); background: var(--surface-2); border: 1px solid var(--border); }
  .w-check-head { display: grid; gap: 2px; }
  .w-check-head strong { font-size: 13px; font-weight: 850; color: var(--ink); }
  .w-check-head span { font-size: 12px; color: var(--ink-3); line-height: 1.45; }
  .w-check-list { display: grid; gap: 7px; }
  .w-check-row { display: grid; grid-template-columns: 20px 1fr; gap: 8px; align-items: start; padding: 8px 9px; border-radius: 12px; background: var(--surface); border: 1px solid rgba(140,123,104,.18); font-size: 13px; font-weight: 750; line-height: 1.4; color: var(--ink-2); }
  .w-check-row input { width: 17px; height: 17px; margin: 1px 0 0; accent-color: var(--green); }
  .w-check-foot { display: flex; align-items: center; flex-wrap: wrap; gap: 8px; }
  .skip-check { padding: 8px 12px; border-radius: 999px; background: var(--surface); border: 1px solid var(--border); color: var(--ink-2); font-size: 12px; font-weight: 850; }
  .skip-check:hover { border-color: var(--green); color: var(--green-dark); }
  .w-check-foot span { font-size: 12px; color: var(--ink-3); }
  .w-model { border: 1px solid var(--border); border-radius: var(--r-1); background: var(--surface); }
  .w-model > summary { cursor: pointer; list-style: none; padding: 10px 13px; font-size: 13px; font-weight: 800; color: var(--accent-ink); }
  .w-model > summary::-webkit-details-marker { display: none; }
  .w-model-body { padding: 0 13px 13px; display: grid; gap: 3px; }
  .w-ko { font-size: 15px; font-weight: 600; }
  .w-en { font-size: 13px; color: var(--ink-2); }
</style>
