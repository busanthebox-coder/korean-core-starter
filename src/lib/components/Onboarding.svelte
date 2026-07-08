<script>
  import bank from '../placementBank.json';
  import { firstChapterOfLevel } from '../curriculumStructure.js';
  import { nextRound, placementResult } from '../placement.js';
  import { markOnboarded, setStartChapterId } from '../stores.js';

  export let chapters = [];
  export let onClose = () => {};
  export let onStartChapter = () => {};

  let phase = 'welcome';
  let currentLevel = 'A1';
  let index = 0;
  let answers = [];
  let result = null;

  $: firstChapter = chapters[0] || null;
  $: roundItems = bank.filter((item) => item.level === currentLevel);
  $: item = roundItems[index] || null;
  $: currentRoundAnswers = answers.filter((answer) => answer.level === currentLevel);
  $: progressPct = Math.min(100, ((currentRoundAnswers.length + 1) / Math.max(1, roundItems.length)) * 100);
  $: recommendedChapter = result
    ? firstChapterOfLevel(chapters, result.recommendedLevel) || firstChapter
    : null;
  $: scoreLine = result
    ? ['A1', 'A2', 'B1']
      .map((level) => `${level} ${result.correctByLevel[level]?.correct || 0}/${result.correctByLevel[level]?.total || 0}`)
      .join(' · ')
    : '';

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
  }

  function choose(choice) {
    if (!item) return;
    const nextAnswers = [...answers, { level: item.level, correct: !!choice.correct }];
    const decision = nextRound({ currentLevel, answers: nextAnswers });
    answers = nextAnswers;

    if (decision.status === 'round') {
      currentLevel = decision.level;
      index = 0;
      return;
    }

    if (decision.status === 'done') {
      result = placementResult(nextAnswers);
      phase = 'result';
      return;
    }

    index += 1;
  }

  function startAt(chapter) {
    if (chapter) setStartChapterId(chapter.id);
    markOnboarded();
    onClose();
    if (chapter) onStartChapter(chapter);
  }
</script>

<div class="onboarding-shell" role="dialog" aria-modal="true" aria-labelledby="onboarding-title">
  <section class="onboarding-card">
    {#if phase === 'welcome'}
      <div class="welcome">
        <span class="eyebrow">First run</span>
        <h2 id="onboarding-title">어디서 시작할지 먼저 정해요</h2>
        <p>한글부터 차근차근 가도 되고, 이미 아는 내용이 있으면 짧은 테스트로 시작 챕터를 추천받을 수 있어요.</p>
        <div class="flow" aria-label="Learning flow">
          <span><b>단</b> Words</span>
          <span><b>문</b> Pattern</span>
          <span><b>대</b> Dialogue</span>
          <span><b>연</b> Practice</span>
        </div>
        <div class="actions">
          <button type="button" class="btn3d" on:click={startFromBeginning}>처음부터 시작</button>
          <button type="button" class="secondary" on:click={startPlacement}>3분 배치 테스트</button>
        </div>
      </div>
    {:else if phase === 'test' && item}
      <div class="test">
        <div class="test-top">
          <span class="eyebrow">{currentLevel} placement</span>
          <button type="button" class="quiet" on:click={exitToStart}>처음부터 할게요</button>
        </div>
        <h2 id="onboarding-title">{item.prompt}</h2>
        <div class="meter" aria-label={`${currentLevel} progress`}>
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
</div>

<style>
  .onboarding-shell {
    position: fixed;
    inset: 0;
    z-index: 80;
    display: grid; place-items: center;
    padding: 20px;
    background: rgba(43, 38, 34, .38);
    backdrop-filter: blur(6px);
  }
  .onboarding-card {
    width: min(720px, 100%);
    max-height: min(760px, calc(100dvh - 40px));
    overflow: auto;
    border-radius: var(--r-3);
    background: var(--bg); border: 1px solid var(--border);
    box-shadow: var(--shadow-3);
  }
  .welcome, .test, .result {
    display: grid;
    gap: 18px;
    padding: clamp(22px, 4vw, 36px);
  }
  h2 {
    margin: 0;
    font-family: var(--serif-ko);
    font-size: clamp(30px, 5vw, 48px);
    line-height: 1.08; font-weight: 600; letter-spacing: 0;
  }
  p {
    max-width: 56ch;
    margin: 0;
    color: var(--ink-2);
  }
  .flow {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 10px;
  }
  .flow span {
    display: grid;
    gap: 6px;
    min-height: 92px;
    align-content: center;
    padding: 13px;
    border-radius: var(--r-1);
    background: var(--surface); border: 1px solid var(--border);
    color: var(--ink-2);
    font-size: 13px;
    font-weight: 800;
  }
  .flow b {
    width: 34px;
    height: 34px;
    display: grid; place-items: center;
    border-radius: 10px;
    background: var(--ink);
    color: var(--bg);
    font-family: var(--serif-ko);
  }
  .actions, .test-top {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 10px; flex-wrap: wrap;
  }
  .secondary, .quiet {
    min-height: 46px;
    padding: 12px 18px;
    border-radius: var(--r-1);
    background: var(--surface); border: 1px solid var(--border);
    color: var(--ink-2);
    font-weight: 850;
  }
  .quiet {
    min-height: 38px;
    padding: 8px 12px;
    font-size: 12px;
  }
  .meter {
    height: 10px;
    overflow: hidden;
    border-radius: var(--radius-pill);
    background: var(--surface-2); border: 1px solid var(--border);
  }
  .meter span {
    display: block;
    height: 100%;
    border-radius: inherit;
    background: var(--green);
    transition: width var(--dur-2) var(--ease);
  }
  .choices {
    display: grid;
    gap: 10px;
  }
  .choices button {
    display: grid;
    gap: 3px;
    text-align: left;
    padding: 15px 16px;
    border-radius: var(--r-1);
    background: var(--surface); border: 1px solid var(--border);
    box-shadow: var(--shadow-1);
    transition: transform .1s var(--bounce), border-color .1s;
  }
  .choices button:hover {
    transform: translateY(-1px);
    border-color: var(--ink);
  }
  .choices strong {
    font-size: 20px;
    line-height: 1.25;
  }
  .choices span {
    color: var(--ink-2);
    font-size: 13px;
  }
  .score {
    display: inline-flex;
    width: fit-content;
    padding: 9px 12px;
    border-radius: var(--radius-pill);
    background: var(--green-soft);
    color: var(--green-dark);
    font-size: 13px; font-weight: 850;
  }
  @media (max-width: 560px) {
    .onboarding-shell { align-items: end; padding: 10px; }
    .onboarding-card { max-height: calc(100dvh - 20px); border-radius: var(--r-2); }
    .flow { grid-template-columns: repeat(2, minmax(0, 1fr)); }
    .actions button { width: 100%; }
  }
</style>
