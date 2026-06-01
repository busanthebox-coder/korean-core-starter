<script>
  import { speak } from '../audio.js';
  export let text = '';
  export let size = 30;
</script>

<button class="audio" type="button" aria-label="Play pronunciation" style="--sz:{size}px"
  on:click|stopPropagation={() => speak(text)}>
  <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M11 5 6 9H3v6h3l5 4V5z" fill="currentColor" stroke="none"/><path d="M15.5 8.5a5 5 0 0 1 0 7M18 6a8 8 0 0 1 0 12"/></svg>
</button>

<style>
  .audio { width: var(--sz); height: var(--sz); display: inline-grid; place-items: center; vertical-align: middle;
    border-radius: 999px; background: var(--green-soft); color: var(--green-dark); }
  .audio:hover { background: var(--border); }
  .audio svg { width: 56%; height: 56%; fill: none; stroke: currentColor; stroke-width: 2.2; stroke-linecap: round; stroke-linejoin: round; }
</style>
