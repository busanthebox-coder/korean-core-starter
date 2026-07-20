<script>
  // A stopping place, not a wall. Everything below the fold is still one tap away —
  // this only tells the learner they have finished something, which a 24-screen
  // chapter never let them feel.
  export let data = {};
  export let onStop = () => {};
</script>

<div class="brk">
  <span class="brk-eyebrow"><i class="ti ti-check" aria-hidden="true"></i> Good place to stop</span>
  <h2>You've covered {data.covered || 'the first part'}.</h2>
  <p>That's the teaching done. {data.remainingCount} screens of practice and speaking are left — do them now while it's fresh, or come back later and pick up right here.</p>
  <button class="brk-stop" type="button" on:click={onStop}>Finish for today</button>
  <span class="brk-hint">Or keep going below.</span>
</div>

<style>
  .brk { display: grid; gap: 10px; padding: 22px 20px; border-radius: var(--r-2);
    background: var(--green-soft); border: 1px solid var(--border); }
  .brk-eyebrow { display: inline-flex; align-items: center; gap: 6px; color: var(--green-dark);
    font-size: 11px; font-weight: 850; letter-spacing: .12em; text-transform: uppercase; }
  h2 { margin: 2px 0 0; font-family: var(--serif-ko); font-size: 23px; font-weight: 600; line-height: 1.25; }
  p { margin: 0; color: var(--ink-2); line-height: 1.55; }
  .brk-stop { justify-self: start; margin-top: 6px; padding: 11px 18px; border-radius: 999px;
    background: var(--ink); color: #fff; font-weight: 800; font-size: 14px; }
  .brk-stop:hover { opacity: .9; }
  .brk-hint { color: var(--ink-3); font-size: 12.5px; }
</style>
