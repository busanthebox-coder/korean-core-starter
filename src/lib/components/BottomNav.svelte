<script>
  import { link, location } from 'svelte-spa-router';
  import { NAV } from '../nav.js';
  import { dueCount } from '../srs.js';
</script>

<nav class="bottomnav">
  {#each NAV as item}
    <a use:link href={item.path} class:active={$location.startsWith(item.path)}>
      <i class="ic ti {item.icon}" aria-hidden="true"></i><span class="lb">{item.label}</span>
      {#if item.path === '/practice' && $dueCount}
        <span class="badge">{$dueCount > 9 ? '9+' : $dueCount}</span>
      {/if}
    </a>
  {/each}
</nav>

<style>
  .bottomnav { position: fixed; bottom: 0; left: 0; right: 0; display: flex; background: var(--surface);
    border-top: 1px solid var(--border); padding: 6px 4px env(safe-area-inset-bottom); z-index: 40; }
  .bottomnav a { position: relative; flex: 1; display: flex; flex-direction: column; align-items: center; gap: 2px;
    padding: 6px 0; color: var(--ink-3); font-size: 11px; font-weight: 800; }
  .bottomnav a.active { color: var(--accent); }
  .ic { font-size: 22px; }
  .badge { position: absolute; top: 4px; right: calc(50% - 26px); min-width: 17px; height: 17px; padding: 0 5px; display: grid; place-items: center;
    border-radius: 999px; background: var(--danger); color: #fff; font-size: 10px; line-height: 1; box-sizing: border-box; }
  @media (min-width: 761px) {
    .bottomnav { display: none; }
  }
</style>
