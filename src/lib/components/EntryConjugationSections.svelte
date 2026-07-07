<script>
  import AudioButton from './AudioButton.svelte';
  import RomanizationLine from './RomanizationLine.svelte';
  import { romanizeKorean } from '../romanize.js';
  import { explainForm, conjugate } from '../conjugation.js';

  export let entry;

  const FORM_ORDER = ['politePresent', 'formalPresent', 'past', 'future', 'negative', 'want', 'can', 'cannot', 'must'];
  const FORM_META = {
    politePresent: { label: 'Polite', gloss: (b) => `${b} (polite present)`, why: 'Everyday polite ending -아/어요. Safe with almost anyone — make this your default form.' },
    formalPresent: { label: 'Formal', gloss: (b) => `${b} (formal)`, why: 'Formal -(스)ㅂ니다 ending: announcements, business, the news, the military.' },
    past: { label: 'Past', gloss: (b) => `${b} (past tense)`, why: 'Past tense -았/었어요. If the last stem vowel is ㅏ or ㅗ use 았, otherwise 었.' },
    future: { label: 'Future', gloss: (b) => `will ${b}`, why: 'Future / intention -(으)ㄹ 거예요: ㄹ 거예요 after a vowel, 을 거예요 after a consonant.' },
    negative: { label: 'Negative', gloss: (b) => `do not ${b}`, why: 'Short negative: put 안 right before the verb. (For 하다 verbs: 공부 안 해요.)' },
    want: { label: 'Want', gloss: (b) => `want to ${b}`, why: 'Desire -고 싶어요: drop 다 from the dictionary form and add 고 싶어요.' },
    can: { label: 'Can', gloss: (b) => `can ${b}`, why: 'Ability -(으)ㄹ 수 있어요: ㄹ 수 있어요 after a vowel, 을 수 있어요 after a consonant.' },
    cannot: { label: 'Cannot', gloss: (b) => `cannot ${b}`, why: 'Inability: 못 before the verb (a real limit). Different from 안, which is "choose not to."' },
    must: { label: 'Must', gloss: (b) => `have to ${b}`, why: 'Obligation -아/어야 해요: attach 야 해요 to the 아/어 stem.' },
  };

  let openForm = null;

  const dictStem = (hangul) => (hangul || '').replace(/다$/, '');
  const sentences = (text) =>
    (text || '').split(/(?<=[.?!])\s+(?=[A-Z가-힣"])/).map((s) => s.trim()).filter(Boolean);
  const splitKo = (text) =>
    text.split(/(\p{sc=Hangul}+)/u).filter((s) => s !== '').map((s) => ({ s, ko: /\p{sc=Hangul}/u.test(s) }));

  function splitForm(form) {
    const baseStem = dictStem(entry.hangul);
    let index = 0;
    while (index < form.length && index < baseStem.length && form[index] === baseStem[index]) index += 1;
    return index > 0 ? { stem: form.slice(0, index), end: form.slice(index) } : { stem: '', end: form };
  }

  $: base = (entry.english || '').replace(/^to /, '');
  $: generated = !entry.forms && /^(verb|adjective)$/.test(entry.partOfSpeech || '') && /다$/.test(entry.hangul || '')
    ? conjugate(entry.hangul, { partOfSpeech: entry.partOfSpeech, irregular: entry.irregular })
    : null;
  $: formsObj = entry.forms || generated || null;
  $: formsGenerated = !entry.forms && !!generated;
  $: formsEntry = formsObj ? { ...entry, forms: formsObj } : entry;
  $: forms = formsObj ? FORM_ORDER.filter((key) => formsObj[key]) : [];
  $: chipKeys = formsObj ? ['politePresent', 'past', 'want', 'can', 'cannot'].filter((key) => formsObj[key]) : [];
</script>

{#if entry.explanation || entry.shortExplanation}
  <details class="callout info" open>
    <summary class="callout-head"><span class="ch-l"><i class="ti ti-bulb" aria-hidden="true"></i> How to use</span><i class="ti ti-chevron-down c-chev" aria-hidden="true"></i></summary>
    <div class="htu">
      {#if chipKeys.length}
        <div class="htu-forms">
          <span class="htu-cap">이렇게 변해요 · forms</span>
          <div class="form-chips">
            {#each chipKeys as key}
              {@const sf = splitForm(formsObj[key])}
              <span class="fchip"><span class="fc-k"><span class="fc-stem">{sf.stem}</span><span class="fc-end">{sf.end}</span></span><span class="fc-l">{FORM_META[key].label}</span></span>
            {/each}
          </div>
        </div>
      {/if}
      <ul class="points">
        {#each sentences(entry.explanation || entry.shortExplanation) as sentence}
          <li>{#each splitKo(sentence) as part}{#if part.ko}<b class="ko-hl">{part.s}</b>{:else}{part.s}{/if}{/each}</li>
        {/each}
      </ul>
    </div>
  </details>
{/if}

{#if forms.length}
  <section>
    <div class="sec-head"><span class="dot" />Forms{#if formsGenerated}<span class="auto-tag" title="Built from regular + irregular conjugation rules">auto</span>{/if}</div>
    <div class="forms">
      {#each forms as key}
        {@const sf = splitForm(formsObj[key])}
        <div class="form-tile" class:open={openForm === key} role="button" tabindex="0"
          on:click={() => (openForm = openForm === key ? null : key)}
          on:keydown={(event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); openForm = openForm === key ? null : key; } }}>
          <div class="ft-top"><span class="flabel">{FORM_META[key].label}</span><span class="chev">{openForm === key ? '▾' : '▸'}</span></div>
          <span class="fko"><span class="fstem">{sf.stem}</span><span class="fend">{sf.end}</span><AudioButton text={formsObj[key]} size={26} /></span>
          <RomanizationLine text={romanizeKorean(formsObj[key])} />
          {#if openForm === key}
            <div class="ft-detail">
              <div class="ft-gloss">"{FORM_META[key].gloss(base)}"</div>
              <p class="ft-why">{explainForm(formsEntry, key) || FORM_META[key].why}</p>
            </div>
          {/if}
        </div>
      {/each}
    </div>
    {#if formsGenerated}<p class="auto-note">These forms are generated from regular and irregular conjugation rules. The polite form is your safe default.</p>{/if}
  </section>
{/if}

<style>
  section { display: grid; gap: 13px; }
  .sec-head { display: flex; align-items: center; gap: 12px; font-size: 11px; font-weight: 750; letter-spacing: .16em; text-transform: uppercase; color: var(--ink-3); }
  .sec-head::after { content: ''; flex: 1; height: 1px; background: var(--border); }
  .dot { display: none; }
  .auto-tag { font-size: 9px; font-weight: 800; letter-spacing: .1em; text-transform: uppercase; color: var(--ink-3); border: 1px solid var(--border); border-radius: 999px; padding: 2px 7px; }
  .auto-note { margin: 4px 0 0; font-size: 12px; color: var(--ink-3); line-height: 1.5; }
  .callout { border: 1px solid var(--border); border-left: 3px solid var(--green); border-radius: var(--r-1); background: var(--surface-2); line-height: 1.62; }
  .callout > summary.callout-head { cursor: pointer; list-style: none; display: flex; align-items: center; justify-content: space-between; gap: 10px; padding: 13px 15px; font-size: 11px; font-weight: 750; letter-spacing: .14em; text-transform: uppercase; color: var(--ink-3); }
  .callout > summary.callout-head::-webkit-details-marker { display: none; }
  .ch-l { display: inline-flex; align-items: center; gap: 8px; }
  .ch-l i { font-size: 15px; color: var(--green); }
  .c-chev { font-size: 13px; color: var(--ink-3); transition: transform .2s; }
  .callout[open] .c-chev { transform: rotate(180deg); }
  .htu { padding: 0 15px 15px; display: grid; gap: 13px; }
  .htu-forms { display: grid; gap: 7px; }
  .htu-cap { font-size: 10px; font-weight: 800; letter-spacing: .08em; text-transform: uppercase; color: var(--ink-3); }
  .form-chips { display: flex; flex-wrap: wrap; gap: 7px; }
  .fchip { background: var(--surface); border: 1px solid var(--border); border-radius: 9px; padding: 6px 10px; display: inline-grid; gap: 1px; }
  .fc-k { font-size: 16px; font-weight: 600; }
  .fc-stem { color: var(--ink); }
  .fc-end { color: var(--accent-ink); font-weight: 700; }
  .fc-l { font-size: 10px; font-weight: 700; letter-spacing: .04em; text-transform: uppercase; color: var(--ink-3); }
  .points { list-style: none; margin: 0; padding: 0; display: grid; gap: 10px; }
  .points li { position: relative; padding-left: 16px; line-height: 1.62; color: var(--ink); }
  .points li::before { content: ''; position: absolute; left: 0; top: 12px; width: 7px; height: 1.5px; background: var(--ink-3); }
  .ko-hl { color: var(--accent-ink); font-weight: 800; }
  .forms { display: grid; grid-template-columns: repeat(auto-fill, minmax(148px, 1fr)); gap: 8px; }
  .form-tile { display: grid; gap: 2px; padding: 11px 13px; border-radius: 8px; background: var(--surface); border: 1px solid var(--border); cursor: pointer; text-align: left; transition: border-color .12s; }
  .form-tile:hover, .form-tile.open { border-color: var(--ink); }
  .ft-top { display: flex; align-items: center; justify-content: space-between; }
  .chev { color: var(--ink-3); font-size: 12px; }
  .flabel { font-size: 10px; font-weight: 750; text-transform: uppercase; letter-spacing: .12em; color: var(--ink-3); }
  .fko { font-size: 19px; font-weight: 780; display: flex; align-items: center; gap: 8px; margin-top: 2px; }
  .fstem { color: var(--ink); }
  .fend { color: var(--accent-ink); }
  .ft-detail { margin-top: 8px; padding-top: 9px; border-top: 1px solid var(--border); display: grid; gap: 4px; }
  .ft-gloss { font-weight: 800; color: var(--ink); }
  .ft-why { margin: 0; font-size: 13px; color: var(--ink-2); line-height: 1.5; }
</style>
