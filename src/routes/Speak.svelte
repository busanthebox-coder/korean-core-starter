<script>
  import { push } from 'svelte-spa-router';
  import { chapters, conversations, dialogues } from '../lib/data.js';
  import { buildSayItItems } from '../lib/sayIt.js';
  import { lessonProgress, shadowProgress, spokenDayCount, spokenProgress } from '../lib/stores.js';
  import AudioButton from '../lib/components/AudioButton.svelte';
  import Talk from './Talk.svelte';
  import Conversation from './Conversation.svelte';

  const sceneKey = (d) => (d && (d.id || d.title)) || '';

  function openLessonSayIt() {
    if (currentChapter) push(`/learn?chapter=${encodeURIComponent(currentChapter.id)}`);
  }

  function startShadow() {
    push('/speak?mode=shadow');
    setTimeout(() => document.getElementById('shadow-library')?.scrollIntoView?.({ behavior: 'smooth', block: 'start' }), 60);
  }

  function openRoleplay() {
    document.getElementById('roleplay-library')?.scrollIntoView?.({ behavior: 'smooth', block: 'start' });
  }

  $: currentChapter = chapters.find((chapter) => !$lessonProgress.has(chapter.id)) || chapters[0] || null;
  $: sayItItems = currentChapter ? buildSayItItems(currentChapter) : [];
  $: recommendedShadow = dialogues.find((dialogue) => !$shadowProgress.has(sceneKey(dialogue))) || dialogues[0] || null;
  $: recommendedRoleplay = conversations[0] || null;
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
      <strong>{dayCount}</strong>
      <span>{dayCount === 1 ? 'spoken day' : 'spoken days'}</span>
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

  <div class="library" id="shadow-library">
    <div class="library-head">
      <span>Library</span>
      <h2>Listen &amp; repeat</h2>
    </div>
    <Talk />
  </div>

  <div class="library" id="roleplay-library">
    <div class="library-head">
      <span>Library</span>
      <h2>Respond</h2>
    </div>
    <Conversation />
  </div>
</section>

<style>
  .speak { max-width: 1080px; margin: 0 auto; padding: 28px; display: grid; gap: 20px; }
  .hero { display: flex; align-items: end; justify-content: space-between; gap: 18px; padding: 20px;
    border-radius: var(--r-2); background: var(--surface); border: 1px solid var(--border); box-shadow: var(--shadow-1); }
  .eyebrow, .step, .library-head span { color: var(--green-dark); font-size: 11px; font-weight: 850;
    letter-spacing: .14em; text-transform: uppercase; }
  h1, h2 { margin: 0; font-family: var(--serif-ko); font-weight: 600; letter-spacing: 0; }
  h1 { margin-top: 4px; font-size: clamp(31px, 5vw, 48px); line-height: 1.02; }
  .hero p, .today-card p { margin: 5px 0 0; color: var(--ink-3); line-height: 1.5; }
  .metric { min-width: 126px; padding: 13px 15px; border-radius: var(--r-1); background: var(--green-soft);
    color: var(--green-dark); text-align: center; }
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
  .library { display: grid; gap: 10px; padding-top: 8px; border-top: 1px solid var(--rule); }
  .library-head { display: grid; gap: 2px; }
  .library-head h2 { font-size: 26px; }
  :global(.speak .talk), :global(.speak .convo) { max-width: none; padding: 0; }

  @media (max-width: 820px) {
    .speak { padding: 18px; }
    .hero { align-items: stretch; flex-direction: column; }
    .metric { width: 100%; box-sizing: border-box; }
    .today-grid { grid-template-columns: 1fr; }
  }
</style>
