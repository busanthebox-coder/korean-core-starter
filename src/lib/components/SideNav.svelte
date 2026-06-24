<script>
  import { link, location } from 'svelte-spa-router';
  import { NAV } from '../nav.js';
</script>

<nav class="sidenav">
  {#each NAV as item}
    <a use:link href={item.path} class:active={$location.startsWith(item.path)}>
      <i class="ic ti {item.icon}" aria-hidden="true"></i><span class="lb">{item.label}</span>
    </a>
  {/each}
</nav>

<style>
  .sidenav { display: flex; flex-direction: column; gap: 4px; padding: 16px 10px; }
  .sidenav a { display: flex; align-items: center; gap: 11px; padding: 11px 13px; border-radius: 8px; color: var(--ink-2);
    font-weight: 750; border-left: 3px solid transparent; transition: background .12s, color .12s; }
  .sidenav a:hover { background: var(--surface-2); color: var(--ink); }
  .sidenav a.active { background: var(--surface-2); color: var(--ink); border-left-color: var(--accent); font-weight: 850; }
  .ic { font-size: 20px; }
</style>
