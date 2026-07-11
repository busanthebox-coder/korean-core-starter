<script>
  import AudioButton from './AudioButton.svelte';
  import RomanizationLine from './RomanizationLine.svelte';

  export let side = 'left';      // 'left' (partner) | 'right' (me)
  export let name = '';          // shown above left bubbles
  export let ko = '';
  export let romanization = '';
  export let en = '';
  export let note = '';
  export let showName = true;    // false to hide the name on stacked same-speaker bubbles
  export let showAvatar = true;
  export let hideEn = false;
  export let audioSize = 22;

  $: initial = (name || '').trim().charAt(0) || '·';
</script>

<div class="row {side}">
  {#if side === 'left'}
    <div class="avatar" class:ghost={!showAvatar} aria-hidden="true">{showAvatar ? initial : ''}</div>
  {/if}
  <div class="col">
    {#if side === 'left' && showName && name}<span class="name">{name}</span>{/if}
    <div class="bubble {side}">
      <div class="ko"><span>{ko}</span><AudioButton text={ko} size={audioSize} /></div>
      <div class="sub"><RomanizationLine text={romanization} /></div>
      {#if en}<div class="en" class:hidden={hideEn}>{en}</div>{/if}
      {#if note}
        <details class="note-fold">
          <summary>Why it's said this way</summary>
          <div class="note">{note}</div>
        </details>
      {/if}
    </div>
  </div>
</div>

<style>
  .row { display: flex; align-items: flex-end; gap: 8px; max-width: 100%; }
  .row.right { flex-direction: row-reverse; }

  .avatar { width: 36px; height: 36px; flex: none; margin-bottom: 2px; border-radius: 14px; display: grid; place-items: center;
    background: #dfe6ef; color: #56657a; font-weight: 850; font-size: 16px; }
  .avatar.ghost { background: transparent; }

  .col { display: grid; gap: 4px; max-width: 80%; min-width: 0; }
  .row.right .col { justify-items: end; }
  .name { font-size: 12px; font-weight: 750; color: #46566b; padding: 0 4px; }

  .bubble { position: relative; padding: 9px 13px; border-radius: 18px; box-shadow: 0 1px 1.5px rgba(20,30,50,.12); }
  .bubble.left { background: #fff; color: var(--ink); border-top-left-radius: 5px; }
  .bubble.right { background: #fae100; color: #1b1a17; border-top-right-radius: 5px; }

  .ko { font-size: 16.5px; font-weight: 600; line-height: 1.45; display: flex; align-items: center; gap: 6px; }
  .ko span { min-width: 0; word-break: keep-all; overflow-wrap: break-word; }
  .row.right .ko { flex-direction: row-reverse; }
  .sub { margin-top: 2px; }
  .en { margin-top: 3px; font-size: 13px; line-height: 1.4; color: var(--ink-2); }
  .bubble.right .en { color: #6a6320; }
  .en.hidden { visibility: hidden; }
  .note-fold { margin-top: 5px; }
  .note-fold summary { cursor: pointer; list-style: none; display: inline-flex; align-items: center; gap: 4px;
    font-size: 11.5px; font-weight: 800; color: var(--accent-ink); }
  .note-fold summary::-webkit-details-marker { display: none; }
  .note-fold summary::before { content: '▸'; font-size: 10px; transition: transform .15s; }
  .note-fold[open] summary::before { transform: rotate(90deg); }
  .bubble.right .note-fold summary { color: #7a7330; }
  .note { margin-top: 4px; font-size: 12px; line-height: 1.4; color: var(--ink-3); }
  .bubble.right .note { color: #7a7330; }

  /* romanization line sits muted inside the bubble */
  .bubble :global(.rom) { font-size: 12.5px; }
  .bubble.right :global(.rom) { color: #7a7330; }
</style>
