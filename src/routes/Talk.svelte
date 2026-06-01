<script>
  import { dialogues } from '../lib/data.js';
  import ChatBubble from '../lib/components/ChatBubble.svelte';
  import { speak } from '../lib/audio.js';

  let current = null;
  let hideEn = false;

  function open(d) { current = d; hideEn = false; window.scrollTo(0, 0); }
  function back() { current = null; window.scrollTo(0, 0); }
  function playAll() {
    const lines = current.lines || [];
    let k = 0;
    const go = () => { if (k < lines.length) { speak(lines[k].ko); k += 1; setTimeout(go, 1700); } };
    go();
  }

  // The first speaker is treated as "me" (right side); everyone else sits on the left.
  $: meSpeaker = current && current.lines && current.lines.length ? current.lines[0].speaker : null;
</script>

{#if !current}
  <section class="talk">
    <div class="hero">
      <div class="eyebrow">Real conversations</div>
      <h1>Talk</h1>
      <p>Situational dialogues. Tap a scene, listen, then hide the English and rehearse your lines.</p>
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
    </div>
    <div class="chat">
      {#each current.lines as line, i}
        {@const me = line.speaker === meSpeaker}
        {@const first = i === 0 || current.lines[i - 1].speaker !== line.speaker}
        <ChatBubble side={me ? 'right' : 'left'} name={line.speaker}
          ko={line.ko} romanization={line.romanization} en={line.en} note={line.note}
          showName={!me && first} showAvatar={!me && first} hideEn={hideEn} audioSize={24} />
      {/each}
    </div>
    {#if current.tip}<div class="tip"><span class="ico">💡</span><p>{current.tip}</p></div>{/if}
  </section>
{/if}

<style>
  .talk { max-width: 760px; margin: 0 auto; padding: 28px; display: grid; gap: 16px; }
  .hero { display: grid; gap: 4px; }
  .eyebrow { font-size: 12px; font-weight: 850; letter-spacing: .06em; text-transform: uppercase; color: var(--green-dark); }
  h1 { margin: 2px 0; font-size: 30px; letter-spacing: -0.02em; }
  .hero p { margin: 0; color: var(--ink-3); }
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
  .chat { display: grid; gap: 12px; padding: 18px 14px; border-radius: 20px;
    background: linear-gradient(180deg, var(--chat-bg-2), var(--chat-bg)); box-shadow: inset 0 1px 8px rgba(20,40,70,.12); }
  .tip { display: flex; gap: 10px; padding: 14px 16px; border-radius: 14px; background: var(--surface-2); border: 1px solid var(--border); }
  .tip p { margin: 0; line-height: 1.6; }
  .ico { font-size: 18px; }
</style>
