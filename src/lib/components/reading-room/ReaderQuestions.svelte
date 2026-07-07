<script>
  export let reader;
  export let answers = {};
  export let answeredCount = 0;
  export let questionCount = 0;
  export let score = 0;
  export let onChoose = () => {};
</script>

<section class="questions" aria-label="Comprehension questions">
  <div class="q-head">
    <div>
      <p class="kicker">Comprehension</p>
      <h2>{answeredCount}/{questionCount} answered</h2>
    </div>
    <span>{answeredCount === questionCount ? `${score}/${questionCount}` : 'in progress'}</span>
  </div>

  {#each reader.comprehensionQuestions as question, index}
    {@const selected = answers[index]}
    <div class="question">
      <p><b>{index + 1}</b>{question.prompt}</p>
      <div class="options">
        {#each question.options as option}
          <button
            type="button"
            class:chosen={selected === option}
            class:right={selected && option === question.correct}
            class:wrong={selected === option && option !== question.correct}
            on:click={() => onChoose(index, option)}
          >
            {option}
          </button>
        {/each}
      </div>
      {#if selected}
        <div class="explain">{question.explanation}</div>
      {/if}
    </div>
  {/each}
</section>

<style>
  .questions { display: grid; gap: 12px; padding: 18px; border-radius: var(--radius); background: var(--surface);
    border: 1px solid var(--border); box-shadow: var(--shadow-1); }
  .kicker { margin: 0 0 4px; color: var(--accent-ink); font-size: 11px; font-weight: 850; letter-spacing: .12em; text-transform: uppercase; }
  h2 { margin: 0; font-family: var(--serif-ko); font-size: 24px; font-weight: 600; letter-spacing: 0; line-height: 1.08; }
  .q-head { display: flex; align-items: center; justify-content: space-between; gap: 12px; flex-wrap: wrap; }
  .q-head > span { color: var(--ink-3); font-size: 12px; font-weight: 850; text-transform: uppercase; letter-spacing: .08em; }
  .question { display: grid; gap: 10px; padding-top: 12px; border-top: 1px solid var(--border); }
  .question p { display: flex; gap: 9px; margin: 0; font-weight: 850; }
  .question b { width: 28px; height: 28px; display: grid; place-items: center; flex: none; border-radius: 999px;
    background: var(--surface-2); color: var(--ink-2); }
  .options { display: flex; flex-wrap: wrap; gap: 8px; }
  .options button { padding: 10px 13px; border-radius: 999px; background: var(--surface-2); color: var(--ink-2);
    border: 1px solid var(--border); font-weight: 850; }
  .options button.chosen { border-color: var(--ink); color: var(--ink); background: var(--surface); }
  .options button.right { border-color: var(--green); background: var(--green-soft); color: var(--green-dark); }
  .options button.wrong { border-color: var(--danger); background: var(--danger-soft); color: var(--danger); }
  .explain { padding: 10px 12px; border-radius: var(--r-1); background: var(--surface-2); color: var(--ink-2); font-size: 13px; line-height: 1.45; }
</style>
