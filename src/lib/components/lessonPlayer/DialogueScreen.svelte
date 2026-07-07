<script>
  import ChatBubble from '../ChatBubble.svelte';

  export let kind = 'dialogue';
  export let data = {};
</script>

{#if kind === 'dialogue'}
  <h2 class="screen-h">{data.setting ? 'Now you’ve got the pieces' : 'Dialogue'}</h2>
  {#if data.setting}<p class="screen-sub">{data.setting}</p>{/if}
  <div class="lp-chat">
    {#each data.lines as line, li}
      {@const me = line.speaker === data.lines[0].speaker}
      {@const first = li === 0 || data.lines[li - 1].speaker !== line.speaker}
      <ChatBubble side={me ? 'right' : 'left'} name={line.speaker}
        ko={line.ko} romanization={line.romanization} en={line.en} note={line.grammarNote}
        showName={first} showAvatar={!me && first} audioSize={22} />
    {/each}
  </div>
{:else if kind === 'reading'}
  <h2 class="screen-h">Reading{data.title ? ` · ${data.title}` : ''}</h2>
  <p class="reading-body">{data.body}</p>
  {#if data.bodyTranslation}<details class="reading-tr"><summary>Show translation</summary><p>{data.bodyTranslation}</p></details>{/if}
{:else if kind === 'culture'}
  <h2 class="screen-h">Culture · {data.title}</h2>
  <p class="culture-body">{data.body}</p>
{:else if kind === 'beginner'}
  <h2 class="screen-h">Good to know</h2>
  <div class="bg-list">{#each data as b}<div class="bg-card"><strong>{b.title}</strong><p>{b.body}</p></div>{/each}</div>
{:else if kind === 'steps'}
  <h2 class="screen-h">Step by step</h2>
  <ol class="steps">{#each data as st}<li>{st}</li>{/each}</ol>
{:else if kind === 'links'}
  <h2 class="screen-h">Official links</h2>
  <div class="links">{#each data as l}<a class="link" href={l.url} target="_blank" rel="noopener noreferrer">{l.label}{#if l.note} — <em>{l.note}</em>{/if}</a>{/each}</div>
{/if}

<style>
  .lp-chat { display: grid; gap: 12px; padding: 14px; border-radius: var(--r-1); background: var(--chat-bg); }
  .reading-body, .culture-body { margin: 0; font-size: 15px; line-height: 1.85; }
  .reading-tr { font-size: 13px; color: var(--ink-2); margin-top: 4px; }
  .reading-tr summary { cursor: pointer; font-weight: 750; }
  .bg-list { display: grid; gap: 10px; }
  .bg-card { background: var(--surface-2); border-radius: var(--r-1); padding: 12px 14px; }
  .bg-card strong { display: block; margin-bottom: 3px; }
  .bg-card p { margin: 0; color: var(--ink-2); font-size: 14px; line-height: 1.55; }
  .steps { margin: 0; padding-left: 20px; display: grid; gap: 8px; font-size: 15px; line-height: 1.55; }
  .links { display: grid; gap: 8px; }
  .link { display: inline-block; padding: 11px 14px; border-radius: var(--r-1); background: var(--accent-soft); color: var(--accent-ink); font-weight: 800; }
  .link em { font-style: normal; font-weight: 600; color: var(--ink-2); }
</style>
