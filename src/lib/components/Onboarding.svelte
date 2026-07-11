<script>
  import { onMount, tick } from 'svelte';
  import bank from '../placementBank.json';
  import { firstChapterOfLevel } from '../curriculumStructure.js';
  import { nextRound, placementResult } from '../placement.js';
  import { markOnboarded, setStartChapterId } from '../stores.js';
  import './Onboarding.css';

  export let chapters = [];
  export let onClose = () => {};
  export let onStartChapter = () => {};
  export let startWithPlacement = false;

  let phase = startWithPlacement ? 'test' : 'welcome';
  let currentLevel = 'A1';
  let index = 0;
  let answers = [];
  let result = null;
  let dialogElement;
  let primaryAction;
  let questionHeading;

  $: firstChapter = chapters[0] || null;
  $: roundItems = bank.filter((item) => item.level === currentLevel);
  $: item = roundItems[index] || null;
  $: currentRoundAnswers = answers.filter((answer) => answer.level === currentLevel);
  $: progressPct = Math.min(100, (currentRoundAnswers.length / Math.max(1, roundItems.length)) * 100);
  $: recommendedChapter = result
    ? firstChapterOfLevel(chapters, result.recommendedLevel) || firstChapter
    : null;
  $: scoreLine = result
    ? ['A1', 'A2', 'B1']
      .map((level) => `${level} ${result.correctByLevel[level]?.correct || 0}/${result.correctByLevel[level]?.total || 0}`)
      .join(' · ')
    : '';

  onMount(async () => {
    if (typeof dialogElement.showModal === 'function') {
      dialogElement.close();
      dialogElement.showModal();
    }
    await tick();
    primaryAction?.focus();
  });

  function startFromBeginning() {
    if (firstChapter) setStartChapterId(firstChapter.id);
    markOnboarded();
    onClose();
  }

  function exitToStart() {
    startFromBeginning();
  }

  function startPlacement() {
    phase = 'test';
    currentLevel = 'A1';
    index = 0;
    answers = [];
    result = null;
    tick().then(() => questionHeading?.focus());
  }

  function choose(choice) {
    if (!item) return;
    const nextAnswers = [...answers, { level: item.level, correct: !!choice.correct }];
    const decision = nextRound({ currentLevel, answers: nextAnswers });
    answers = nextAnswers;

    if (decision.status === 'round') {
      currentLevel = decision.level;
      index = 0;
      tick().then(() => questionHeading?.focus());
      return;
    }

    if (decision.status === 'done') {
      result = placementResult(nextAnswers);
      phase = 'result';
      return;
    }

    index += 1;
    tick().then(() => questionHeading?.focus());
  }

  function startAt(chapter) {
    if (chapter) setStartChapterId(chapter.id);
    markOnboarded();
    onClose();
    if (chapter) onStartChapter(chapter);
  }
</script>

<dialog bind:this={dialogElement} class="onboarding-shell" aria-labelledby="onboarding-title" on:cancel={(event) => event.preventDefault()} open>
  <section class="onboarding-card">
    {#if phase === 'welcome'}
      <div class="welcome">
        <span class="eyebrow">Welcome</span>
        <h2 id="onboarding-title">Choose where to start <small>시작점을 정해요</small></h2>
        <p>New to Korean? Begin with Hangul. Already know some Korean? Take a short test and we’ll recommend a chapter.</p>
        <ol class="study-sequence" aria-label="A short lesson has four steps">
          <li><b>1</b><span><strong>Words</strong><small>핵심 단어</small></span></li>
          <li><b>2</b><span><strong>Pattern</strong><small>문장 틀</small></span></li>
          <li><b>3</b><span><strong>Dialogue</strong><small>실전 대화</small></span></li>
          <li><b>4</b><span><strong>Practice</strong><small>짧은 연습</small></span></li>
        </ol>
        <div class="actions" role="group" aria-label="Choose your starting point">
          <button bind:this={primaryAction} type="button" class="btn3d" on:click={startFromBeginning}>
            Start with Hangul <small>한글부터 시작</small>
          </button>
          <button type="button" class="secondary" on:click={startPlacement}>
            Take the 3-minute placement test <small>3분 배치 테스트</small>
          </button>
        </div>
      </div>
    {:else if phase === 'test' && item}
      <div class="test">
        <div class="test-top">
          <span class="eyebrow">{currentLevel} placement</span>
          <button type="button" class="quiet" on:click={exitToStart}>처음부터 할게요</button>
        </div>
        <h2 bind:this={questionHeading} id="onboarding-title" tabindex="-1">{item.prompt}</h2>
        <div class="meter" role="progressbar" aria-label={`${currentLevel} progress`} aria-valuemin="0" aria-valuemax="100" aria-valuenow={Math.round(progressPct)}>
          <span style={`width:${progressPct}%`}></span>
        </div>
        <div class="choices">
          {#each item.choices as choice}
            <button type="button" on:click={() => choose(choice)}>
              {#if choice.ko}<strong>{choice.ko}</strong>{/if}
              {#if choice.en}<span>{choice.en}</span>{/if}
            </button>
          {/each}
        </div>
      </div>
    {:else if phase === 'result' && recommendedChapter}
      <div class="result">
        <span class="eyebrow">Recommended start</span>
        <h2 id="onboarding-title">{recommendedChapter.number}과 {recommendedChapter.title}</h2>
        <p>{result.recommendedLevel} 시작점이 좋아 보여요. 잠금은 없고, 언제든 앞뒤 챕터를 열 수 있어요.</p>
        <div class="score">{scoreLine}</div>
        <div class="actions">
          <button type="button" class="btn3d" on:click={() => startAt(recommendedChapter)}>여기서 시작</button>
          <button type="button" class="secondary" on:click={() => startAt(firstChapter)}>그래도 1과부터</button>
        </div>
      </div>
    {/if}
  </section>
</dialog>
