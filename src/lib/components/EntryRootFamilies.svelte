<script>
  import { createEventDispatcher } from 'svelte';
  import { findEntry, hanjaRootsForEntry } from '../data.js';

  export let entry;

  const dispatch = createEventDispatcher();

  $: rootLinks = hanjaRootsForEntry(entry.id);
</script>

{#if rootLinks.length}
  <section class="root-families">
    <div class="sec-head"><span class="dot" />Same Root</div>
    <div class="roots">
      {#each rootLinks as root}
        <details class="root-card">
          <summary>
            <span class="root-mark">{root.reading}<b>{root.hanja}</b></span>
            <span class="root-copy"><strong>{root.gloss}</strong><em>{root.members.length} words</em></span>
            <i class="ti ti-chevron-down root-chev" aria-hidden="true"></i>
          </summary>
          <p>{root.note}</p>
          <div class="root-members">
            {#each root.members as member}
              {@const memberEntry = findEntry(member.entryId)}
              {#if member.entryId === entry.id}
                <span class="root-member current">
                  <b>{member.hangul}</b>
                  <em>{member.breakdown}</em>
                </span>
              {:else if memberEntry}
                <button class="root-member link" type="button" on:click={() => dispatch('openEntry', memberEntry)}>
                  <b>{member.hangul}</b>
                  <em>{member.breakdown}</em>
                </button>
              {:else}
                <span class="root-member">
                  <b>{member.hangul}</b>
                  <em>{member.breakdown}</em>
                </span>
              {/if}
            {/each}
          </div>
        </details>
      {/each}
    </div>
  </section>
{/if}

<style>
  .root-families { display: grid; gap: 13px; }
  .sec-head { display: flex; align-items: center; gap: 12px; font-size: 11px; font-weight: 750; letter-spacing: .16em;
    text-transform: uppercase; color: var(--ink-3); }
  .sec-head::after { content: ''; flex: 1; height: 1px; background: var(--border); }
  .dot { display: none; }
  .roots { display: grid; gap: 8px; }
  .root-card { border: 1px solid var(--border); border-radius: var(--r-1); background: var(--surface); }
  .root-card > summary { list-style: none; cursor: pointer; display: grid; grid-template-columns: auto 1fr auto; align-items: center; gap: 12px; padding: 12px 14px; }
  .root-card > summary::-webkit-details-marker { display: none; }
  .root-mark { display: inline-grid; place-items: center; min-width: 54px; height: 54px; border-radius: 12px; background: var(--surface-2); border: 1px solid var(--border); color: var(--ink); font-weight: 800; line-height: 1.05; }
  .root-mark b { display: block; font-family: var(--serif-ko); font-size: 23px; }
  .root-copy { display: grid; gap: 1px; min-width: 0; }
  .root-copy strong { font-size: 14px; color: var(--ink); }
  .root-copy em { font-style: normal; font-size: 12px; color: var(--ink-3); }
  .root-chev { color: var(--ink-3); transition: transform .2s; }
  .root-card[open] .root-chev { transform: rotate(180deg); }
  .root-card p { margin: 0; padding: 0 14px 11px 80px; color: var(--ink-2); line-height: 1.5; }
  .root-members { display: flex; flex-wrap: wrap; gap: 7px; padding: 0 14px 14px 80px; }
  .root-member { display: inline-grid; gap: 1px; padding: 6px 10px; border-radius: 9px; border: 1px solid var(--border); background: var(--surface-2); text-align: left; }
  .root-member.current { border-color: var(--accent); background: var(--accent-soft); }
  .root-member.link { cursor: pointer; transition: border-color .12s, background .12s; }
  .root-member.link:hover, .root-member.link:focus-visible { border-color: var(--ink); background: var(--surface); }
  .root-member b { font-size: 14px; color: var(--ink); }
  .root-member em { font-style: normal; font-size: 11px; color: var(--ink-3); }
  @media (max-width: 520px) {
    .root-card > summary { grid-template-columns: auto 1fr; }
    .root-chev { display: none; }
    .root-card p, .root-members { padding-left: 14px; }
  }
</style>
