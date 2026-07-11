<script>
  import { onMount } from 'svelte';
  import Router, { location, push } from 'svelte-spa-router';
  import SideNav from './lib/components/SideNav.svelte';
  import BottomNav from './lib/components/BottomNav.svelte';
  import Learn from './routes/Learn.svelte';
  import Practice from './routes/Practice.svelte';
  import RedirectToSpeak from './routes/RedirectToSpeak.svelte';
  import Speak from './routes/Speak.svelte';
  import Dictionary from './routes/Dictionary.svelte';
  import Guide from './routes/Guide.svelte';
  import { applyPwaUpdate, pwaStatus, registerPwa } from './lib/pwa.js';
  import { romanizationVisible, toggleRomanization } from './lib/stores.js';

  const routes = {
    '/learn': Learn,
    '/practice': Practice,
    '/speak': Speak,
    '/talk': RedirectToSpeak,
    '/chat': RedirectToSpeak,
    '/conversation': RedirectToSpeak,
    '/dictionary': Dictionary,
    '/guide': Guide,
    '*': Learn,
  };

  onMount(() => {
    registerPwa();
  });

  $: if ($location) window.scrollTo({ top: 0, left: 0, behavior: 'auto' });

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
  {#if $pwaStatus.updateReady}
    <div class="pwa-toast" role="status" aria-live="polite">
      <span>Update ready</span>
      <button type="button" on:click={() => applyPwaUpdate($pwaStatus.waitingWorker)}>Reload</button>
    </div>
  {:else if $pwaStatus.offlineReady}
    <div class="pwa-toast subtle" role="status" aria-live="polite">Offline ready</div>
  {/if}
</div>

<style>
  .shell { min-height: 100vh; }
  .topbar { position: sticky; top: 0; z-index: 30; height: 60px; display: flex; align-items: center;
    padding: 0 20px; background: rgba(255,255,255,.9); border-top: 3px solid var(--accent);
    border-bottom: 1px solid var(--border); backdrop-filter: saturate(1.4) blur(14px); }
  .brand { font-family: var(--serif); font-weight: 600; font-size: 18.5px; letter-spacing: .01em; display: inline-flex; align-items: center; gap: 11px; }
  .mark { width: 34px; height: 34px; display: grid; place-items: center; border-radius: 9px; background: var(--ink); color: var(--bg); font-family: var(--serif-ko); font-weight: 700; font-size: 19px; }
  .rom-toggle { margin-left: auto; padding: 7px 14px; border-radius: 999px; border: 1px solid var(--border);
    background: transparent; color: var(--ink-2); font-weight: 700; font-size: 12.5px; letter-spacing: .02em;
    transition: border-color var(--dur-1), color var(--dur-1); }
  .rom-toggle:hover { border-color: var(--ink-3); color: var(--ink); }
  .rom-toggle[aria-pressed='true'] { background: var(--ink); color: #fff; border-color: var(--ink); }
  .body { display: grid; grid-template-columns: 240px minmax(0, 1fr); }
  .rail { position: sticky; top: 58px; height: calc(100vh - 58px); border-right: 1px solid var(--border); background: var(--surface); }
  .content { min-width: 0; padding-bottom: 72px; }
  .pwa-toast { position: fixed; right: 18px; bottom: 18px; z-index: 70; display: flex; align-items: center; gap: 10px;
    max-width: min(360px, calc(100vw - 32px)); padding: 11px 12px 11px 15px; border-radius: 14px;
    background: var(--ink); color: var(--primary-on); box-shadow: var(--shadow-3); font-weight: 800; }
  .pwa-toast.subtle { background: var(--surface); color: var(--green-dark); border: 1px solid var(--border); }
  .pwa-toast button { padding: 7px 11px; border-radius: 10px; background: var(--primary); color: var(--primary-on);
    font-size: 13px; font-weight: 850; white-space: nowrap; }
  @media (max-width: 760px) {
    .body { grid-template-columns: 1fr; }
    .rail { display: none; }
    .pwa-toast { left: 12px; right: 12px; bottom: 74px; justify-content: space-between; }
  }
  @media (min-width: 761px) {
    :global(.bottomnav) { display: none; }
  }
</style>
