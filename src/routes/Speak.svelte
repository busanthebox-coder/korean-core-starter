<script>
  import { onMount, tick } from 'svelte';
  import { push } from 'svelte-spa-router';
  import { chapters, conversations, dialogues } from '../lib/data.js';
  import { buildSayItItems } from '../lib/sayIt.js';
  import { filterByRegister, lessonProgress, roleplayRegister, shadowProgress, spokenDayCount, spokenProgress } from '../lib/stores.js';
  import { pickBuddyMissions } from '../lib/buddySession.js';
  import AudioButton from '../lib/components/AudioButton.svelte';
  import Talk from './Talk.svelte';
  import Conversation from './Conversation.svelte';

  const sceneKey = (d) => (d && (d.id || d.title)) || '';
  let libraryMode = '';

  function openLessonSayIt() {
    if (currentChapter) push(`/learn?chapter=${encodeURIComponent(currentChapter.id)}&today=sayit`);
  }

  async function showLibrary(mode) {
    libraryMode = mode;
    await tick();
    document.getElementById(`${mode}-library`)?.scrollIntoView?.({ behavior: 'smooth', block: 'start' });
  }

  function startShadow() {
    showLibrary('shadow');
  }

  function openRoleplay() { showLibrary('roleplay'); }

  onMount(() => {
    const query = window.location.hash.split('?')[1] || '';
    const requestedMode = new URLSearchParams(query).get('mode');
    if (requestedMode === 'shadow' || requestedMode === 'roleplay') showLibrary(requestedMode);
  });

  $: currentChapter = chapters.find((chapter) => !$lessonProgress.has(chapter.id)) || chapters[0] || null;
  $: sayItItems = currentChapter ? buildSayItItems(currentChapter) : [];
  $: recommendedShadow = dialogues.find((dialogue) => !$shadowProgress.has(sceneKey(dialogue))) || dialogues[0] || null;
  // Follow the learner's Roleplay register choice (해요체 by default) so the
  // suggested scene matches the speech style they're actually practising.
  $: recommendedRoleplay = filterByRegister(conversations, $roleplayRegister)[0] || conversations[0] || null;
  $: buddyMissions = pickBuddyMissions(filterByRegister(conversations, $roleplayRegister), { spoken: $spokenProgress });
  $: dayCount = spokenDayCount($spokenProgress);
</script>

<section class="speak">
  <div class="hero">
    <div>
      <div class="eyebrow">Speak</div>
      <h1>Today’s speaking</h1>
      <p>Say three lesson lines, repeat one scene, then answer one real conversation prompt.</p>
    </div>
    <div class="metric">
      {#if dayCount > 0}
        <strong>{dayCount}</strong>
        <span>{dayCount === 1 ? 'spoken day' : 'spoken days'}</span>
      {:else}
        <strong>Day 1</strong>
        <span>starts today</span>
      {/if}
    </div>
  </div>

  <div class="today-grid">
    <article class="today-card primary">
      <span class="step">1 · Say-it</span>
      <h2>{currentChapter ? `Chapter ${currentChapter.number}` : 'Next lesson'}</h2>
      <p>{currentChapter?.title || 'Open a lesson and say the final lines out loud.'}</p>
      <div class="say-lines">
        {#each sayItItems as item}
          <div class="say-line">
            <span>{item.ko}</span>
            <AudioButton text={item.ko} size={24} />
          </div>
        {/each}
      </div>
      <button class="btn3d" type="button" on:click={openLessonSayIt}>Open lesson</button>
    </article>

    <article class="today-card">
      <span class="step">2 · Listen &amp; repeat</span>
      <h2>{recommendedShadow?.title || 'Shadow scene'}</h2>
      <p>{recommendedShadow?.situation || 'Repeat a short scene line by line.'}</p>
      <button class="ghost" type="button" on:click={startShadow}>Start shadow</button>
    </article>

    <article class="today-card">
      <span class="step">3 · Respond</span>
      <h2>{recommendedRoleplay?.title || 'Roleplay'}</h2>
      <p>{recommendedRoleplay?.situation || 'Pick or type a natural reply.'}</p>
      <button class="ghost" type="button" on:click={openRoleplay}>Open roleplay</button>
    </article>
  </div>

  {#if buddyMissions.length}
    <section class="buddy-session" aria-labelledby="buddy-session-title">
      <div class="bs-head">
        <span class="bs-eyebrow"><i class="ti ti-users" aria-hidden="true"></i> Buddy session</span>
        <h2 id="buddy-session-title">이번 주 친구와</h2>
        <p>Same three all week, so you can agree on a time and they'll still be here.</p>
      </div>
      <ol class="bs-how">
        <li>Run it once on your own first.</li>
        <li>Open it with your friend — the scenario has a Korean note telling them their part.</li>
        <li>Stuck on a line? Read the “why it's said this way” note together.</li>
      </ol>
      <div class="bs-list">
        {#each buddyMissions as mission (mission.id)}
          <button class="bs-card" class:done={$spokenProgress[mission.id]?.length} type="button" on:click={openRoleplay}>
            <span class="bs-main">
              <strong>{mission.title}</strong>
              <span>{mission.situation}</span>
            </span>
            {#if $spokenProgress[mission.id]?.length}
              <span class="bs-done"><i class="ti ti-check" aria-hidden="true"></i></span>
            {:else}
              <span class="chev">▸</span>
            {/if}
          </button>
        {/each}
      </div>
    </section>
  {/if}

  <section class="library-picker" aria-labelledby="library-picker-title">
    <div>
      <span>More practice</span>
      <h2 id="library-picker-title">Choose one library</h2>
    </div>
    <div class="library-switch" role="group" aria-label="Speaking libraries">
      <button type="button" aria-pressed={libraryMode === 'shadow'} on:click={() => showLibrary('shadow')}>Browse listen and repeat</button>
      <button type="button" aria-pressed={libraryMode === 'roleplay'} on:click={() => showLibrary('roleplay')}>Browse roleplays</button>
    </div>
  </section>

  {#if libraryMode === 'shadow'}
    <section class="library" id="shadow-library" aria-label="Listen and repeat library">
      <Talk />
    </section>
  {:else if libraryMode === 'roleplay'}
    <section class="library" id="roleplay-library" aria-label="Roleplay library">
      <Conversation />
    </section>
  {/if}
</section>

<style>
  .speak { max-width: 1080px; margin: 0 auto; padding: 28px; display: grid; gap: 20px; }
  /* P11 — headline on the background; the day-count reads as a figure, not a widget. */
  .hero { display: flex; align-items: end; justify-content: space-between; gap: 18px;
    padding: 4px 2px 18px; border-bottom: 1px solid var(--border-2); }
  .eyebrow, .step, .library-picker > div > span { color: var(--green-dark); font-size: 11px; font-weight: 850;
    letter-spacing: .14em; text-transform: uppercase; }
  h1, h2 { margin: 0; font-family: var(--serif-ko); font-weight: 600; letter-spacing: 0; }
  h1 { margin-top: 4px; font-size: clamp(31px, 5vw, 48px); line-height: 1.02; }
  .hero p, .today-card p { margin: 5px 0 0; color: var(--ink-3); line-height: 1.5; }
  .metric { min-width: 0; color: var(--green-dark); text-align: right; }
  .metric strong { display: block; font-size: 34px; line-height: 1; }
  .metric span { display: block; margin-top: 3px; font-size: 12px; font-weight: 850; }
  .today-grid { display: grid; grid-template-columns: 1.35fr 1fr 1fr; gap: 12px; align-items: stretch; }
  .today-card { display: grid; align-content: start; gap: 10px; padding: 17px; border-radius: var(--r-2);
    background: var(--surface); border: 1px solid var(--border); box-shadow: var(--shadow-1); }
  .today-card.primary { border-left: 4px solid var(--green); }
  .today-card h2 { font-size: 21px; line-height: 1.15; }
  .say-lines { display: grid; gap: 7px; margin-top: 2px; }
  .say-line { display: flex; align-items: center; justify-content: space-between; gap: 8px; padding: 9px 10px;
    border-radius: 12px; background: var(--surface-2); color: var(--ink); font-weight: 750; }
  .say-line span { min-width: 0; word-break: keep-all; overflow-wrap: break-word; }
  .ghost { justify-self: start; margin-top: 4px; padding: 11px 16px; border-radius: 999px;
    background: var(--surface-2); color: var(--ink-2); font-weight: 850; }
  .ghost:hover { background: var(--border); color: var(--ink); }
  .buddy-session { display: grid; gap: 14px; padding: 2px 0 4px 15px; border-left: 3px solid var(--green); }
  .bs-head { display: grid; gap: 4px; }
  .bs-eyebrow { display: inline-flex; align-items: center; gap: 6px; color: var(--green-dark);
    font-size: 11px; font-weight: 850; letter-spacing: .12em; text-transform: uppercase; }
  .buddy-session h2 { margin: 2px 0 0; font-family: var(--serif-ko); font-size: 23px; font-weight: 600; }
  .buddy-session .bs-head p { margin: 0; color: var(--ink-3); font-size: 12.5px; line-height: 1.5; }
  .bs-how { margin: 0; padding-left: 18px; display: grid; gap: 3px; color: var(--ink-2); font-size: 12.5px; line-height: 1.5; }
  .bs-list { display: grid; gap: 8px; }
  .bs-card { display: flex; align-items: center; gap: 10px; padding: 12px 14px; border-radius: var(--r-1);
    border: 1px solid var(--border); background: var(--surface-2); text-align: left; }
  .bs-card:hover { border-color: var(--green); }
  .bs-card.done { opacity: .62; }
  .bs-main { display: grid; gap: 2px; min-width: 0; flex: 1; }
  .bs-main strong { font-size: 14.5px; }
  .bs-main span { color: var(--ink-2); font-size: 12.5px; line-height: 1.4; }
  .bs-done { flex: none; width: 26px; height: 26px; display: grid; place-items: center; border-radius: 999px;
    background: var(--green-soft); color: var(--green-dark); }
  .bs-card .chev { flex: none; color: var(--ink-3); }
  .library-picker { display: flex; align-items: center; justify-content: space-between; gap: 16px; padding: 16px 0;
    border-top: 1px solid var(--rule); border-bottom: 1px solid var(--border); }
  .library-picker h2 { margin-top: 2px; font-size: 24px; }
  .library-switch { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 4px; padding: 4px;
    border-radius: var(--r-1); background: var(--surface-2); border: 1px solid var(--border); }
  .library-switch button { min-height: 40px; padding: 8px 12px; border-radius: 10px; color: var(--ink-2); font-size: 12px; font-weight: 850; }
  .library-switch button[aria-pressed='true'] { background: var(--green-soft); color: var(--green-dark); box-shadow: inset 0 0 0 1px rgba(46,107,58,.22); }
  .library { display: grid; gap: 10px; padding-top: 8px; }
  :global(.speak .talk), :global(.speak .convo) { max-width: none; padding: 0; }

  @media (max-width: 820px) {
    .speak { padding: 18px; }
    .hero { align-items: stretch; flex-direction: column; }
    .metric { width: 100%; box-sizing: border-box; }
    .today-grid { grid-template-columns: 1fr; }
    .library-picker { align-items: stretch; flex-direction: column; }
    .library-switch { grid-template-columns: 1fr; }
  }
</style>
