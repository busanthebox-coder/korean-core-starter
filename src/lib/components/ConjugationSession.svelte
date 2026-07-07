<script>
  import { gradeConjugation } from '../conjugationDrill.js';

  export let items = [];
  export let onDone = () => {};
  export let compact = false;

  let index = 0;
  let answer = '';
  let revealed = false;
  let verdict = null;
  let correct = 0;
  let wrongIds = [];
  let correctIds = [];
  let done = false;

  $: item = items[index] || null;
  $: progress = items.length ? `${Math.min(index + 1, items.length)}/${items.length}` : '0/0';
  $: typed = answer.trim().length > 0;

  function check() {
    if (!item || !typed || revealed) return;
    verdict = gradeConjugation(answer, item);
    revealed = true;
    if (verdict.ok) {
      correct += 1;
      correctIds = [...correctIds, item.entryId];
    } else {
      wrongIds = [...wrongIds, item.entryId];
    }
  }

  function moveNext() {
    if (!item) return;
    if (index < items.length - 1) {
      index += 1;
      answer = '';
      revealed = false;
      verdict = null;
      return;
    }
    done = true;
    onDone({
      correct,
      total: items.length,
      wrongIds,
      correctIds,
      mode: 'conjugation',
    });
  }
</script>

{#if !items.length}
  <div class="conj-empty">
    <i class="ti ti-forms" aria-hidden="true"></i>
    <strong>No conjugation drills here yet.</strong>
  </div>
{:else if item}
  <section class:compact class="conj-card">
    <div class="conj-top">
      <span class="pill">{progress}</span>
      <span class="pill soft">{item.label?.ko || '활용'} · {item.label?.en || item.form}</span>
    </div>

    <div class="prompt">
      <span class="base">{item.base}</span>
      <span class="arrow">→</span>
      <span class="target">{item.label?.pattern}</span>
    </div>
    <p class="meaning">{item.english}</p>

    <label class="answer-box">
      <span>Type the natural Korean form</span>
      <input
        type="text"
        value={answer}
        disabled={revealed || done}
        placeholder="예: 먹었어요"
        autocomplete="off"
        autocapitalize="off"
        on:input={(event) => (answer = event.currentTarget.value)}
        on:keydown={(event) => event.key === 'Enter' && (revealed ? moveNext() : check())}
      />
    </label>

    {#if revealed}
      <div class="feedback" class:ok={verdict?.ok}>
        <strong>{verdict?.ok ? 'Correct' : `Answer: ${item.answer}`}</strong>
        <span>{item.reason}</span>
      </div>
    {/if}

    <div class="actions">
      {#if !revealed}
        <button class="btn3d" type="button" disabled={!typed} on:click={check}>
          Check <i class="ti ti-check" aria-hidden="true"></i>
        </button>
      {:else}
        <button class="btn3d" type="button" on:click={moveNext}>
          {index === items.length - 1 ? 'Finish' : 'Next'} <i class="ti ti-arrow-right" aria-hidden="true"></i>
        </button>
      {/if}
    </div>
  </section>
{/if}

<style>
  .conj-card { display: grid; gap: 14px; padding: 18px; border: 1px solid var(--border); border-radius: var(--r-1); background: var(--surface); }
  .conj-card.compact { padding: 14px; }
  .conj-top { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
  .pill { display: inline-flex; align-items: center; min-height: 26px; padding: 4px 10px; border-radius: 999px; background: var(--ink); color: #fff; font-size: 12px; font-weight: 850; }
  .pill.soft { background: var(--primary-wash); color: var(--accent-ink); }
  .prompt { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
  .base { font-family: var(--serif-ko); font-size: 36px; line-height: 1.05; font-weight: 650; letter-spacing: 0; }
  .arrow { color: var(--ink-3); font-size: 24px; font-weight: 850; }
  .target { padding: 7px 11px; border-radius: var(--r-1); border: 1px solid var(--border); background: var(--surface-2); color: var(--ink-2); font-size: 14px; font-weight: 850; }
  .meaning { margin: -6px 0 0; color: var(--ink-3); font-size: 14px; }
  .answer-box { display: grid; gap: 6px; font-size: 12px; font-weight: 850; color: var(--ink-2); }
  .answer-box input { width: 100%; min-height: 48px; padding: 11px 13px; border-radius: var(--r-1); border: 1.5px solid var(--border); background: #fff; font: inherit; font-size: 18px; font-weight: 650; }
  .answer-box input:focus { outline: none; border-color: var(--primary); box-shadow: 0 0 0 3px var(--primary-wash); }
  .feedback { display: grid; gap: 5px; padding: 12px 13px; border-radius: var(--r-1); background: var(--danger-soft); color: #8f3626; font-size: 13px; line-height: 1.5; }
  .feedback.ok { background: var(--green-soft); color: var(--green-dark); }
  .feedback strong { font-size: 14px; }
  .actions { display: flex; justify-content: flex-end; }
  .actions .btn3d { min-width: 122px; }
  .actions .btn3d:disabled { opacity: .45; box-shadow: none; pointer-events: none; }
  .conj-empty { padding: 18px; border: 1px dashed var(--border-2); border-radius: var(--r-1); color: var(--ink-3); display: flex; align-items: center; gap: 10px; }

  @media (max-width: 520px) {
    .base { font-size: 30px; }
    .actions { justify-content: stretch; }
    .actions .btn3d { width: 100%; justify-content: center; }
  }
</style>
