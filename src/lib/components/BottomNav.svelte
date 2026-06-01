<script>
  import { link, location } from 'svelte-spa-router';
  import { NAV } from '../nav.js';
</script>

<nav class="bottomnav">
  {#each NAV as item}
    <a use:link href={item.path} class:active={$location.startsWith(item.path)}>
      <span class="ic">{item.icon}</span><span class="lb">{item.label}</span>
    </a>
  {/each}
</nav>

<style>
  .bottomnav { position: fixed; bottom: 0; left: 0; right: 0; display: flex; background: var(--surface);
    border-top: 1px solid var(--border); padding: 6px 4px env(safe-area-inset-bottom); z-index: 40; }
  .bottomnav a { flex: 1; display: flex; flex-direction: column; align-items: center; gap: 2px;
    padding: 6px 0; color: var(--ink-3); font-size: 11px; font-weight: 800; }
  .bottomnav a.active { color: var(--accent); }
  .ic { font-size: 22px; }
</style>
