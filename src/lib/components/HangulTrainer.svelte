<script>
  import { LEADS, VOWELS, TAILS, LEAD_ROMAJI, VOWEL_ROMAJI, compose } from '../hangul.js';
  import { romanizeKorean } from '../romanize.js';
  import { speak } from '../audio.js';

  // Build-a-syllable state (indices into LEADS / VOWELS / TAILS)
  let lead = 18; // ㅎ
  let vowel = 0; // ㅏ
  let tail = 4; // ㄴ  →  한
  $: syllable = compose(lead, vowel, tail);
  $: syllableRomaji = romanizeKorean(syllable);
  $: parts = [LEADS[lead], VOWELS[vowel], TAILS[tail]].filter(Boolean).join(' + ');
</script>

<div class="trainer">
  <p class="intro">Korean is written in <b>syllable blocks</b>. Each block = a consonant + a vowel (+ an optional final consonant). Tap any letter to hear it.</p>

  <div class="sec-head"><span class="dot" />Consonants</div>
  <div class="jamo-grid">
    {#each LEADS as c, i}
      <button class="jamo" type="button" on:click={() => speak(compose(i, 0))}>
        <span class="jc">{c}</span><span class="jr">{LEAD_ROMAJI[i]}</span>
      </button>
    {/each}
  </div>

  <div class="sec-head"><span class="dot" />Vowels</div>
  <div class="jamo-grid">
    {#each VOWELS as v, i}
      <button class="jamo vowel" type="button" on:click={() => speak(compose(11, i))}>
        <span class="jc">{v}</span><span class="jr">{VOWEL_ROMAJI[i]}</span>
      </button>
    {/each}
  </div>

  <div class="sec-head"><span class="dot" />Build a syllable</div>
  <div class="builder">
    <div class="result">
      <span class="big">{syllable}</span>
      <span class="rj">{syllableRomaji}</span>
      <span class="formula">{parts}</span>
      <button class="btn3d play" type="button" on:click={() => speak(syllable)}>▶ Listen</button>
    </div>
    <div class="pickers">
      <label>Consonant
        <select bind:value={lead}>{#each LEADS as c, i}<option value={i}>{c} ({LEAD_ROMAJI[i]})</option>{/each}</select>
      </label>
      <label>Vowel
        <select bind:value={vowel}>{#each VOWELS as v, i}<option value={i}>{v} ({VOWEL_ROMAJI[i]})</option>{/each}</select>
      </label>
      <label>Final
        <select bind:value={tail}>{#each TAILS as t, i}<option value={i}>{i === 0 ? '— none' : t}</option>{/each}</select>
      </label>
    </div>
  </div>
</div>

<style>
  .trainer { display: grid; gap: 14px; }
  .intro { margin: 0; color: var(--ink-2); line-height: 1.6; }
  .intro b { color: var(--green-dark); }
  .sec-head { display: flex; align-items: center; gap: 8px; font-size: 13px; font-weight: 850; margin-top: 6px; }
  .dot { width: 14px; height: 4px; border-radius: 2px; background: var(--ink); box-shadow: none; }
  .jamo-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(64px, 1fr)); gap: 8px; }
  .jamo { display: grid; gap: 1px; padding: 10px 6px; border-radius: 12px; background: var(--surface);
    border: 1px solid var(--border); box-shadow: var(--shadow-1); transition: transform .1s var(--bounce), border-color .1s; }
  .jamo:hover { transform: translateY(-2px); border-color: var(--green); }
  .jamo.vowel { background: var(--surface-2); }
  .jc { font-size: 26px; font-weight: 850; }
  .jr { font-size: 12px; color: var(--ink-3); font-weight: 700; }
  .builder { display: grid; grid-template-columns: 1fr; gap: 14px; padding: 18px; border-radius: var(--radius);
    background: var(--surface-2); }
  .result { display: grid; justify-items: center; gap: 4px; }
  .big { font-size: 84px; font-weight: 880; line-height: 1; }
  .rj { font-size: 17px; color: var(--ink-2); font-weight: 750; }
  .formula { font-size: 14px; color: var(--green-dark); font-weight: 700; }
  .play { margin-top: 8px; }
  .pickers { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; }
  .pickers label { display: grid; gap: 4px; font-size: 12px; font-weight: 800; color: var(--ink-2); }
  .pickers select { padding: 9px; border-radius: 10px; border: 1px solid var(--border); background: #fff; font-size: 14px; }
  @media (max-width: 560px) { .pickers { grid-template-columns: 1fr; } .big { font-size: 64px; } }
</style>
