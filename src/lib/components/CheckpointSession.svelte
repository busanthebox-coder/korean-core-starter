<script>
  import PracticeScreen from './lessonPlayer/PracticeScreen.svelte';
  import { sampleCheckpointExercises, seededRng, weakChapterSummary } from '../checkpoints.js';
  import { correctOf, exerciseAnswerMatches } from '../inlineExercise.js';
  import { mistakes } from '../mistakes.js';
  import { study } from '../progress.js';
  import { recordCheckpointResult } from '../stores.js';

  export let slot;
  export let chapters = [];
  export let onBack = () => {};
  export let onOpenChapter = () => {};

  let sessionKey = '';
  let questions = [];
  let index = 0;
  let answer = '';
  let revealed = false;
  let results = [];
  let savedResultKey = '';

  $: nextSessionKey = slot ? slot.id : '';
  $: if (nextSessionKey !== sessionKey) {
    sessionKey = nextSessionKey;
    questions = slot
      ? sampleCheckpointExercises(chapters, slot, { rng: seededRng(`${slot.id}-${Date.now()}`) })
      : [];
    index = 0;
    answer = '';
    revealed = false;
    results = [];
    savedResultKey = '';
  }

  $: current = questions[index] || null;
  $: finished = questions.length > 0 && index >= questions.length;
  $: score = results.filter((result) => result.correct).length;
  $: weakChapters = weakChapterSummary(results).slice(0, 3);
  $: savedCandidate = finished && slot ? `${slot.id}:${results.length}:${score}` : '';
  $: if (savedCandidate && savedCandidate !== savedResultKey) {
    savedResultKey = savedCandidate;
    recordCheckpointResult(slot.trackId, {
      score,
      total: questions.length,
      weakChapterIds: weakChapters.map((chapter) => chapter.chapterId),
    });
  }

  function pick(value) {
    if (revealed) return;
    answer = value;
  }

  function input(value) {
    if (revealed) return;
    answer = value;
  }

  function check() {
    if (!current || revealed || answer == null || answer === '') return;
    const correct = exerciseAnswerMatches(current, answer);
    results = [
      ...results,
      {
        questionId: current.checkpointExerciseId,
        sourceChapterId: current.sourceChapterId,
        sourceChapterNumber: current.sourceChapterNumber,
        sourceChapterTitle: current.sourceChapterTitle,
        correct,
      },
    ];
    study.log(1);
    if (!correct && current.entryIds?.length) mistakes.record(current.entryIds);
    revealed = true;
  }

  function next() {
    if (!revealed) return;
    index += 1;
    answer = '';
    revealed = false;
  }

  function restart() {
    sessionKey = '';
  }
</script>

<section class="checkpoint">
  <div class="cp-top">
    <button class="back" type="button" on:click={onBack}><i class="ti ti-arrow-left"></i> Lessons</button>
    <span>{slot?.track || ''} review</span>
  </div>

  {#if finished}
    <div class="result">
      <div class="stamp">{score}/{questions.length}</div>
      <div>
        <p class="kicker">Checkpoint complete</p>
        <h1>{slot?.title}</h1>
        <p class="lead">This is a diagnosis, not a gate. Use the weak chapters below for the next short review session.</p>
      </div>
    </div>

    {#if weakChapters.length}
      <div class="weak-list">
        <h2>Review these first</h2>
        {#each weakChapters as weak}
          <button class="weak-card" type="button" on:click={() => {
            const target = chapters.find((chapter) => chapter.id === weak.chapterId);
            if (target) onOpenChapter(target);
          }}>
            <span class="weak-num">{weak.number}</span>
            <span><strong>{weak.title}</strong><small>{weak.wrong} missed · {weak.accuracy}% accuracy in this checkpoint</small></span>
            <i class="ti ti-arrow-right"></i>
          </button>
        {/each}
      </div>
    {:else}
      <div class="clean">
        <strong>No weak chapter this round.</strong>
        <span>You answered every sampled chapter cleanly. Re-take later for a fresh mix.</span>
      </div>
    {/if}

    <div class="actions">
      <button type="button" class="ghost" on:click={restart}>Try another mix</button>
      <button type="button" class="btn3d" on:click={onBack}>Back to lessons</button>
    </div>
  {:else if current}
    <div class="progress" aria-label="Checkpoint progress">
      <span style="width:{((index + (revealed ? 1 : 0)) / questions.length) * 100}%"></span>
    </div>
    <div class="source">Review · Chapter {current.sourceChapterNumber} · {current.sourceChapterTitle}</div>
    <div class="question-shell">
      <PracticeScreen
        kind="exercise"
        data={current}
        {answer}
        isRevealed={revealed}
        {correctOf}
        isCorrect={() => exerciseAnswerMatches(current, answer)}
        onPick={pick}
        onCheck={check}
        onInput={input}
      />
    </div>
    <div class="cp-nav">
      <span>{index + 1}/{questions.length}</span>
      {#if revealed}
        <button class="btn3d" type="button" on:click={next}>{index === questions.length - 1 ? 'See result' : 'Next question'} <i class="ti ti-arrow-right"></i></button>
      {/if}
    </div>
  {:else}
    <div class="clean">
      <strong>No checkpoint questions found.</strong>
      <span>This track needs inline exercises before a checkpoint can run.</span>
    </div>
  {/if}
</section>

<style>
  .checkpoint { max-width: 600px; margin: 0 auto; padding: 22px 20px 34px; display: grid; gap: 16px; }
  .cp-top { display: flex; justify-content: space-between; align-items: center; gap: 12px; color: var(--ink-3);
    font-size: 12px; font-weight: 850; letter-spacing: .1em; text-transform: uppercase; }
  .back, .ghost { display: inline-flex; align-items: center; gap: 6px; padding: 10px 14px; border-radius: 999px;
    background: var(--surface-2); color: var(--ink-2); font-weight: 850; letter-spacing: 0; text-transform: none; }
  .back:hover, .ghost:hover { background: var(--border); }
  .progress { height: 8px; border-radius: 999px; background: var(--surface-2); border: 1px solid var(--border); overflow: hidden; }
  .progress span { display: block; height: 100%; background: var(--green); border-radius: inherit; transition: width .18s var(--ease); }
  .source { justify-self: start; padding: 6px 10px; border-radius: 999px; background: var(--green-soft); color: var(--green-dark);
    font-size: 12px; font-weight: 850; word-break: keep-all; overflow-wrap: break-word; }
  .question-shell { background: var(--surface); border: 1px solid var(--border); border-radius: var(--r-2); padding: 20px;
    box-shadow: var(--shadow-1); }
  .cp-nav { display: flex; justify-content: space-between; align-items: center; gap: 12px; color: var(--ink-3); font-weight: 850; }
  .result { display: flex; gap: 18px; align-items: center; padding: 20px; border-radius: var(--r-2); background: var(--surface);
    border: 1px solid var(--border); box-shadow: var(--shadow-1); }
  .stamp { width: 88px; height: 88px; border-radius: 999px; display: grid; place-items: center; flex: none;
    background: var(--ink); color: var(--bg); font-family: var(--serif); font-size: 26px; font-weight: 700; }
  .kicker { margin: 0 0 4px; color: var(--green-dark); font-size: 12px; font-weight: 850; letter-spacing: .12em; text-transform: uppercase; }
  h1 { margin: 0; font-family: var(--serif-ko); font-size: 30px; font-weight: 600; letter-spacing: 0; line-height: 1.08; }
  .lead { margin: 6px 0 0; color: var(--ink-2); line-height: 1.45; }
  .weak-list { display: grid; gap: 10px; }
  .weak-list h2 { margin: 0; font-size: 13px; font-weight: 900; letter-spacing: .12em; text-transform: uppercase; color: var(--ink-3); }
  .weak-card { display: flex; align-items: center; gap: 12px; text-align: left; padding: 13px 14px; border-radius: var(--radius);
    background: var(--surface); border: 1px solid var(--border); box-shadow: var(--shadow-1); }
  .weak-card:hover { border-color: var(--green); transform: translateY(-1px); }
  .weak-num { width: 38px; height: 38px; display: grid; place-items: center; border-radius: 999px; background: var(--surface-2);
    border: 1px solid var(--border); font-family: var(--serif); font-weight: 700; flex: none; }
  .weak-card span:nth-child(2) { flex: 1; min-width: 0; display: grid; gap: 2px; }
  .weak-card strong { font-size: 15px; }
  .weak-card small { color: var(--ink-3); font-size: 12px; }
  .clean { display: grid; gap: 3px; padding: 16px; border-radius: var(--radius); background: var(--green-soft); color: var(--green-dark); }
  .clean span { color: var(--ink-2); }
  .actions { display: flex; justify-content: space-between; gap: 10px; flex-wrap: wrap; }

  @media (max-width: 520px) {
    .checkpoint { padding: 18px 14px 28px; }
    .result { align-items: flex-start; }
    .stamp { width: 70px; height: 70px; font-size: 21px; }
    .question-shell { padding: 16px; }
  }
</style>
