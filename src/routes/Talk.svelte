<script>
  import { onMount } from 'svelte';
  import { dialogues } from '../lib/data.js';
  import ChatBubble from '../lib/components/ChatBubble.svelte';
  import AudioButton from '../lib/components/AudioButton.svelte';
  import RomanizationLine from '../lib/components/RomanizationLine.svelte';
  import { speak } from '../lib/audio.js';

  let current = null;
  let hideEn = false;
  let shadowMode = false;
  let shadowIndex = 0;
  let shadowSaid = false;

  function open(d, shadow = false) {
    current = d;
    hideEn = false;
    shadowMode = shadow;
    shadowIndex = 0;
    shadowSaid = false;
    window.scrollTo(0, 0);
  }
  function startShadow(d = dialogues[0]) { if (d) open(d, true); }
  function back() { current = null; shadowMode = false; window.scrollTo(0, 0); }
  function playAll() {
    const lines = current.lines || [];
    let k = 0;
    const go = () => { if (k < lines.length) { speak(lines[k].ko); k += 1; setTimeout(go, 1700); } };
    go();
  }
  function nextShadow() {
    if (!current?.lines?.length) return;
    shadowIndex = Math.min(shadowIndex + 1, current.lines.length - 1);
    shadowSaid = false;
  }

  function syncFromUrl() {
    const query = (window.location.hash.split('?')[1] || '').split('#')[0];
    if (new URLSearchParams(query).get('mode') === 'shadow' && !current) startShadow();
  }

  onMount(() => {
    syncFromUrl();
    window.addEventListener('hashchange', syncFromUrl);
    return () => window.removeEventListener('hashchange', syncFromUrl);
  });

  // The first speaker is treated as "me" (right side); everyone else sits on the left.
  $: meSpeaker = current && current.lines && current.lines.length ? current.lines[0].speaker : null;
  $: shadowLine = shadowMode && current?.lines?.length ? current.lines[shadowIndex] : null;
</script>

{#if !current}
  <section class="talk">
    <div class="hero">
      <div class="eyebrow">Real conversations</div>
      <h1>Talk</h1>
      <p>Situational dialogues. Tap a scene, listen, then hide the English and rehearse your lines.</p>
      <button class="start-shadow" type="button" on:click={() => startShadow()}>Start shadow</button>
    </div>
    <div class="scene-grid">
      {#each dialogues as d}
        <button class="scene" on:click={() => open(d)}>
          <span class="lvl">{d.level || 'A1'}</span>
          <strong>{d.title}</strong>
          <span class="sit">{d.situation}</span>
        </button>
      {/each}
    </div>
  </section>
{:else}
  <section class="talk">
    <button class="back" on:click={back}>← All scenes</button>
    <div class="d-head"><h1>{current.title}</h1><p>{current.situation}</p></div>
    <div class="toolbar">
      <button class="btn3d" on:click={playAll}>▶ Play all</button>
      <button class="ghost" on:click={() => (hideEn = !hideEn)}>{hideEn ? 'Show English' : 'Practice mode · hide English'}</button>
      <button class="ghost" class:on={shadowMode} on:click={() => { shadowMode = !shadowMode; shadowIndex = 0; shadowSaid = false; }}>
        {shadowMode ? 'Exit shadow' : 'Shadow mode'}
      </button>
    </div>
    {#if shadowLine}
      <div class="shadow">
        <div class="shadow-top"><span>Shadow Mode</span><strong>Line {shadowIndex + 1}</strong><em>{shadowIndex + 1}/{current.lines.length}</em></div>
        <div class="shadow-ko">{shadowLine.ko}<AudioButton text={shadowLine.ko} size={30} /></div>
        <RomanizationLine text={shadowLine.romanization} />
        <div class="shadow-en">{shadowLine.en}</div>
        <div class="shadow-actions">
          <button class="btn3d" type="button" on:click={() => speak(shadowLine.ko)}>Listen</button>
          <button class="ghost" class:on={shadowSaid} type="button" on:click={() => (shadowSaid = true)}>I said it</button>
          {#if shadowSaid}
            <button class="ghost" type="button" disabled={shadowIndex + 1 >= current.lines.length} on:click={nextShadow}>Next line</button>
          {/if}
        </div>
      </div>
    {:else}
      <div class="chat">
        {#each current.lines as line, i}
          {@const me = line.speaker === meSpeaker}
          {@const first = i === 0 || current.lines[i - 1].speaker !== line.speaker}
          <ChatBubble side={me ? 'right' : 'left'} name={line.speaker}
            ko={line.ko} romanization={line.romanization} en={line.en} note={line.note}
            showName={!me && first} showAvatar={!me && first} hideEn={hideEn} audioSize={24} />
        {/each}
      </div>
    {/if}
    {#if current.tip}<div class="tip"><span class="ico">💡</span><p>{current.tip}</p></div>{/if}
  </section>
{/if}

<style>
  .talk { max-width: 760px; margin: 0 auto; padding: 28px; display: grid; gap: 16px; }
  .hero { display: grid; gap: 4px; }
  .eyebrow { font-size: 12px; font-weight: 850; letter-spacing: .06em; text-transform: uppercase; color: var(--green-dark); }
  h1 { margin: 2px 0; font-size: 30px; letter-spacing: -0.02em; }
  .hero p { margin: 0; color: var(--ink-3); }
  .start-shadow { justify-self: start; margin-top: 8px; padding: 10px 16px; border-radius: 999px; background: var(--ink); color: #fff; font-weight: 850; }
  .scene-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 12px; }
  .scene { display: grid; gap: 4px; text-align: left; padding: 16px; border-radius: var(--radius); background: var(--surface);
    border: 1px solid var(--border); box-shadow: var(--shadow-1); transition: transform .1s var(--bounce), border-color .1s; }
  .scene:hover { transform: translateY(-2px); border-color: var(--green); }
  .lvl { justify-self: start; font-size: 11px; font-weight: 800; padding: 2px 9px; border-radius: 999px; background: #dbf1ff; color: #0a6aa6; }
  .scene strong { font-size: 16px; margin-top: 2px; }
  .scene .sit { color: var(--ink-2); font-size: 13px; }
  .back { justify-self: start; padding: 7px 14px; border-radius: 999px; background: var(--surface-2); color: var(--ink-2); font-weight: 800; }
  .d-head h1 { margin: 0; }
  .d-head p { margin: 2px 0 0; color: var(--ink-3); }
  .toolbar { display: flex; flex-wrap: wrap; gap: 10px; }
  .ghost { padding: 12px 16px; border-radius: 999px; background: var(--surface-2); color: var(--ink-2); font-weight: 800; }
  .ghost.on { background: var(--ink); color: #fff; }
  .chat { display: grid; gap: 12px; padding: 18px 14px; border-radius: 20px;
    background: linear-gradient(180deg, var(--chat-bg-2), var(--chat-bg)); box-shadow: inset 0 1px 8px rgba(20,40,70,.12); }
  .shadow { display: grid; gap: 10px; padding: 18px; border-radius: 18px; background: #fff; border: 1px solid var(--border);
    border-left: 4px solid var(--green); box-shadow: var(--shadow-1); }
  .shadow-top { display: flex; align-items: baseline; gap: 10px; color: var(--ink-3); font-size: 12px; font-weight: 850; }
  .shadow-top span { color: var(--green-dark); letter-spacing: .12em; text-transform: uppercase; }
  .shadow-top strong { color: var(--ink); font-size: 16px; }
  .shadow-top em { margin-left: auto; font-style: normal; }
  .shadow-ko { display: flex; align-items: center; gap: 9px; flex-wrap: wrap; font-size: clamp(28px, 5vw, 44px); font-weight: 850; line-height: 1.2; }
  .shadow-en { color: var(--ink-2); font-size: 16px; }
  .shadow-actions { display: flex; flex-wrap: wrap; gap: 8px; }
  .shadow-actions button:disabled { opacity: .45; pointer-events: none; }
  .tip { display: flex; gap: 10px; padding: 14px 16px; border-radius: 14px; background: var(--surface-2); border: 1px solid var(--border); }
  .tip p { margin: 0; line-height: 1.6; }
  .ico { font-size: 18px; }
</style>
