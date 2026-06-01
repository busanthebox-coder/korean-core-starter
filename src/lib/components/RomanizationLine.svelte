<script>
  import { romanizationVisible } from '../stores.js';
  export let text = '';
</script>

{#if $romanizationVisible && text}
  <div class="rom">{text}</div>
{/if}

<style>
  .rom { color: var(--ink-3); font-size: 13px; line-height: 1.3; }
</style>
