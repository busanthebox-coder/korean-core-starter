<script>
  import { createEventDispatcher } from 'svelte';
  import { gradeReply } from '../replyGrader.js';
  import AudioButton from './AudioButton.svelte';
  import RomanizationLine from './RomanizationLine.svelte';

  export let active;
  export let correctOf;

  const dispatch = createEventDispatcher();
  let typed = '';
  let revealed = false;
  let graded = false;
  let respondOK = false;
  let replyGrade = null;
  let replyAttempts = 0;
  let copyMode = false;
  let firstTry = true;
  let activeTurn = null;

  function reset() {
    typed = '';
    revealed = false;
    graded = false;
    respondOK = false;
    replyGrade = null;
    replyAttempts = 0;
    copyMode = false;
    firstTry = true;
  }

  function reveal() {
    revealed = true;
    copyMode = false;
    graded = false;
    respondOK = false;
    replyGrade = null;
  }

  function maskMissingToken(token) {
    const chars = Array.from(token || '');
    if (chars.length <= 1) return 'one short word';
    return `${chars[0]}…`;
  }

  function missingHint(missing) {
    const hints = (missing || []).slice(0, 2).map(maskMissingToken);
    return hints.length ? hints.join(', ') : 'one core idea';
  }

  function advance(model) {
    dispatch('advance', model);
  }

  function checkReply() {
    if ((revealed && !copyMode) || !typed.trim() || !model) return;
    const grade = gradeReply(typed, model.ko);
    replyGrade = grade;
    respondOK = grade.verdict === 'correct';
    graded = true;

    if (copyMode) {
      if (respondOK) advance(model);
      return;
    }

    if (respondOK) {
      revealed = true;
      if (firstTry) dispatch('credit');
      return;
    }

    firstTry = false;
    replyAttempts += 1;
    if (replyAttempts >= 2) {
      revealed = true;
      copyMode = true;
      typed = '';
    } else {
      revealed = false;
    }
  }

  $: model = active ? correctOf(active) : null;
  $: if (active !== activeTurn) {
    activeTurn = active;
    reset();
  }
</script>

{#if model}
  <textarea class="respond" bind:value={typed} rows="2" placeholder={copyMode ? 'Copy the natural reply in Korean…' : 'Type your reply in Korean (반말)…'} disabled={revealed && !copyMode}></textarea>
  {#if !revealed || copyMode}
    <div class="respond-actions">
      <button class="cont" disabled={!typed.trim()} on:click={checkReply}>{copyMode ? 'Check copied reply · 확인' : 'Check · 확인'}</button>
      {#if !copyMode}<button class="giveup" on:click={reveal}>모르겠어요 · Show answer</button>{/if}
    </div>
  {/if}
  {#if graded}
    <div class="verdict" class:ok={respondOK} class:close={replyGrade?.verdict === 'close' && !copyMode} class:copy={copyMode}>
      {#if copyMode}따라 써 보세요 — copy the natural reply to continue.
      {:else if respondOK}✓ 자연스러워요! That works.
      {:else if replyGrade?.verdict === 'close'}거의 다 왔어요!
        <div class="hint">Missing hint: {missingHint(replyGrade.missing)}</div>
      {:else}아직 달라요. Try one more time.
      {/if}
    </div>
  {/if}
  {#if revealed}
    <div class="model">
      <div class="model-label">A natural reply</div>
      <div class="bko">{model.ko}<AudioButton text={model.ko} size={22} /></div>
      <RomanizationLine text={model.romanization} />
      <div class="ben">{model.en}</div>
      <div class="fb ok">{model.feedback}</div>
    </div>
    {#if !copyMode}<button class="cont" on:click={() => advance(model)}>Continue ▸</button>{/if}
  {/if}
{/if}

<style>
  .respond { width: 100%; padding: 11px 13px; border-radius: 12px; border: 1.5px solid var(--border); background: var(--surface);
    font: inherit; font-size: 16px; resize: vertical; }
  .respond:focus { border-color: var(--green); outline: none; }
  .respond-actions { display: flex; flex-wrap: wrap; gap: 8px; align-items: center; }
  .giveup { padding: 10px 16px; border-radius: 999px; background: var(--surface-2); color: var(--ink-2); font-weight: 800; font-size: 13px; }
  .giveup:hover { background: var(--border); }
  .verdict { padding: 9px 13px; border-radius: 10px; font-weight: 800; font-size: 14px;
    background: #fdf0f0; color: #c0392b; border: 1px solid #f0b6b6; }
  .verdict.ok { background: #f1fae6; color: var(--green-dark); border-color: #cdebac; }
  .verdict.close { background: var(--surface); color: var(--ink); border-color: var(--border-2); box-shadow: inset 4px 0 0 var(--primary); }
  .verdict.copy { background: var(--surface); color: var(--ink); border-color: var(--border-2); box-shadow: inset 4px 0 0 var(--green); }
  .hint { margin-top: 4px; color: var(--ink-2); font-size: 13px; font-weight: 650; }
  .cont { justify-self: start; padding: 10px 18px; border-radius: 999px; background: var(--primary); color: var(--primary-on); font-weight: 850; box-shadow: 0 3px 0 var(--primary-press); }
  .cont:hover { filter: brightness(1.03); }
  .cont:disabled { opacity: .5; pointer-events: none; }
  .model { display: grid; gap: 2px; padding: 12px 14px; border-radius: 13px; background: #f1fae6; border: 1px solid var(--border); }
  .model-label { font-size: 11px; font-weight: 850; text-transform: uppercase; letter-spacing: .05em; color: var(--green-dark); }
  .fb.ok { color: var(--green-dark); margin-top: 4px; }
</style>
