<script>
  import Router, { push } from 'svelte-spa-router';
  import SideNav from './lib/components/SideNav.svelte';
  import BottomNav from './lib/components/BottomNav.svelte';
  import Learn from './routes/Learn.svelte';
  import Practice from './routes/Practice.svelte';
  import Talk from './routes/Talk.svelte';
  import Conversation from './routes/Conversation.svelte';
  import Dictionary from './routes/Dictionary.svelte';
  import Guide from './routes/Guide.svelte';
  import { romanizationVisible, toggleRomanization } from './lib/stores.js';

  const routes = {
    '/learn': Learn,
    '/practice': Practice,
    '/talk': Talk,
    '/chat': Conversation,
    '/dictionary': Dictionary,
    '/guide': Guide,
    '*': Learn,
  };

  if (!window.location.hash) push('/learn');
</script>

<div class="shell">
  <header class="topbar">
    <span class="brand"><span class="mark">한</span> Korean Core Starter</span>
    <button class="rom-toggle" type="button" on:click={toggleRomanization} aria-pressed={$romanizationVisible}
      title="Show or hide romanization everywhere">
      Romaja: {$romanizationVisible ? 'On' : 'Off'}
    </button>
  </header>
  <div class="body">
    <aside class="rail"><SideNav /></aside>
    <main class="content"><Router {routes} /></main>
  </div>
  <BottomNav />
</div>

<style>
  .shell { min-height: 100vh; }
  .topbar { position: sticky; top: 0; z-index: 30; height: 58px; display: flex; align-items: center;
    padding: 0 18px; background: rgba(255,255,255,.94); border-bottom: 1px solid var(--border); backdrop-filter: blur(12px); }
  .brand { font-weight: 900; display: inline-flex; align-items: center; gap: 10px; }
  .mark { width: 32px; height: 32px; display: grid; place-items: center; border-radius: 10px; background: var(--green); color: #fff; }
  .rom-toggle { margin-left: auto; padding: 7px 14px; border-radius: 999px; background: var(--surface-2); color: var(--ink-2); font-weight: 800; font-size: 13px; }
  .rom-toggle[aria-pressed='true'] { background: var(--green-soft); color: var(--green-dark); }
  .body { display: grid; grid-template-columns: 240px minmax(0, 1fr); }
  .rail { position: sticky; top: 58px; height: calc(100vh - 58px); border-right: 1px solid var(--border); background: var(--surface); }
  .content { min-width: 0; padding-bottom: 72px; }
  @media (max-width: 760px) {
    .body { grid-template-columns: 1fr; }
    .rail { display: none; }
  }
  @media (min-width: 761px) {
    :global(.bottomnav) { display: none; }
  }
</style>
