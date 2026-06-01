<script>
  import AudioButton from './AudioButton.svelte';
  import RomanizationLine from './RomanizationLine.svelte';
  import { findEntry, findGrammar } from '../data.js';
  import { romanizeKorean } from '../romanize.js';
  import { explainForm } from '../conjugation.js';
  import { reviews } from '../srs.js';

  export let entry;
  $: inDeck = !!$reviews[entry.id];

  const TYPE_LABEL = { word: 'Word', expression: 'Expression', pattern: 'Pattern' };
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
  const tipText = (t) => (typeof t === 'string' ? t : [t.title, t.body, t.note].filter(Boolean).join(' — '));

  // Korean-Grammar-in-Use style: highlight the conjugation ending (the part that
  // changes from the dictionary stem) in red. Splits a form into stem + ending by
  // longest common prefix with the dictionary form (minus 다).
  const dictStem = (hangul) => (hangul || '').replace(/다$/, '');
  function splitForm(form) {
    const base = dictStem(entry.hangul);
    let i = 0;
    while (i < form.length && i < base.length && form[i] === base[i]) i += 1;
    return i > 0 ? { stem: form.slice(0, i), end: form.slice(i) } : { stem: '', end: form };
  }

  // Break a long explanation into individual sentences (don't split inside quotes/parens).
  const sentences = (text) =>
    (text || '').split(/(?<=[.?!])\s+(?=[A-Z가-힣"])/).map((s) => s.trim()).filter(Boolean);
  // Split a sentence into Korean / non-Korean runs so Korean can be highlighted.
  const splitKo = (text) =>
    text.split(/(\p{sc=Hangul}+)/u).filter((s) => s !== '').map((s) => ({ s, ko: /\p{sc=Hangul}/u.test(s) }));

  $: base = (entry.english || '').replace(/^to /, '');
  $: forms = entry.forms ? FORM_ORDER.filter((k) => entry.forms[k]) : [];
  $: usage = entry.usagePhrases || [];
  $: examples = entry.examples || [];
  $: tips = entry.conjugationTips || [];
  $: mistakes = entry.commonMistakes || [];
  $: related = (entry.relatedPatternIds || []).map(findEntry).filter(Boolean);
  $: grammarLinks = (entry.grammarIds || []).map(findGrammar).filter(Boolean);
</script>

<article class="detail">
  <div class="hero t-{entry.type}">
    <span class="badge">{TYPE_LABEL[entry.type] || entry.type}</span>
    <div class="hero-ko">{entry.hangul}<AudioButton text={entry.hangul} size={44} /></div>
    <RomanizationLine text={entry.romanization} />
    <p class="hero-en">{entry.english}</p>
    <div class="chips">
      {#if entry.level}<span class="chip">{entry.level}</span>{/if}
      {#if entry.partOfSpeech}<span class="chip">{entry.partOfSpeech}</span>{/if}
      {#each entry.topic || [] as t}<span class="chip soft">{t}</span>{/each}
    </div>
    <button class="addrev" class:on={inDeck} on:click={() => reviews.add(entry.id)} disabled={inDeck}>
      {inDeck ? '✓ In your review deck' : '+ Add to review'}
    </button>
  </div>

  {#if entry.explanation || entry.shortExplanation}
    <div class="callout info">
      <div class="callout-label"><span class="ico">💡</span> How to use</div>
      <ul class="points">
        {#each sentences(entry.explanation || entry.shortExplanation) as s}
          <li>{#each splitKo(s) as p}{#if p.ko}<b class="ko-hl">{p.s}</b>{:else}{p.s}{/if}{/each}</li>
        {/each}
      </ul>
    </div>
  {/if}

  {#if forms.length}
    <section>
      <div class="sec-head"><span class="dot" />Forms</div>
      <div class="forms">
        {#each forms as k}
          {@const sf = splitForm(entry.forms[k])}
          <div class="form-tile" class:open={openForm === k} role="button" tabindex="0"
            on:click={() => (openForm = openForm === k ? null : k)}
            on:keydown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openForm = openForm === k ? null : k; } }}>
            <div class="ft-top"><span class="flabel">{FORM_META[k].label}</span><span class="chev">{openForm === k ? '▾' : '▸'}</span></div>
            <span class="fko"><span class="fstem">{sf.stem}</span><span class="fend">{sf.end}</span><AudioButton text={entry.forms[k]} size={26} /></span>
            <RomanizationLine text={romanizeKorean(entry.forms[k])} />
            {#if openForm === k}
              <div class="ft-detail">
                <div class="ft-gloss">"{FORM_META[k].gloss(base)}"</div>
                <p class="ft-why">{explainForm(entry, k) || FORM_META[k].why}</p>
              </div>
            {/if}
          </div>
        {/each}
      </div>
    </section>
  {/if}

  {#if usage.length}
    <section>
      <div class="sec-head"><span class="dot" />Usage</div>
      <div class="lines">
        {#each usage as p}
          <div class="line-card">
            <div class="lko">{p.ko}<AudioButton text={p.ko} size={26} /></div>
            <RomanizationLine text={p.romanization} />
            <div class="len">{p.en}</div>
            {#if p.note}<div class="note">{p.note}</div>{/if}
          </div>
        {/each}
      </div>
    </section>
  {/if}

  {#if examples.length}
    <section>
      <div class="sec-head"><span class="dot" />Examples</div>
      <div class="lines">
        {#each examples as p}
          <div class="line-card">
            <div class="lko">{p.ko}<AudioButton text={p.ko} size={26} /></div>
            <RomanizationLine text={p.romanization} />
            <div class="len">{p.en}</div>
            {#if p.note}<div class="note">{p.note}</div>{/if}
          </div>
        {/each}
      </div>
    </section>
  {/if}

  {#if tips.length}
    <div class="callout tip"><span class="ico">🛠️</span>
      <div><div class="callout-label">Conjugation tips</div><ul>{#each tips as t}<li>{tipText(t)}</li>{/each}</ul></div></div>
  {/if}

  {#if entry.nuance}
    <div class="callout nuance"><span class="ico">🔎</span>
      <div><div class="callout-label">Nuance</div><p>{entry.nuance}</p></div></div>
  {/if}

  {#if mistakes.length}
    <div class="callout warn"><span class="ico">⚠️</span>
      <div><div class="callout-label">Common mistakes</div><ul>{#each mistakes as m}<li>{m}</li>{/each}</ul></div></div>
  {/if}

  {#if related.length || grammarLinks.length}
    <section>
      <div class="sec-head"><span class="dot" />Connections</div>
      <div class="conn">
        {#each related as r}<span class="conn-chip">{r.hangul}<em>{r.english}</em></span>{/each}
        {#each grammarLinks as g}<span class="conn-chip gram">{g.title || g.hangul}</span>{/each}
      </div>
    </section>
  {/if}
</article>

<style>
  .detail { display: grid; gap: 24px; }

  /* Hero — editorial masthead for the entry */
  .hero { position: relative; display: grid; gap: 4px; padding: 22px 2px 22px; border-bottom: 1px solid var(--rule); }
  .hero::before { content: ''; position: absolute; left: 0; top: 0; width: 48px; height: 4px; background: var(--htype, var(--ink)); }
  .hero.t-word { --htype: var(--type-word); }
  .hero.t-expression { --htype: var(--type-expression); }
  .hero.t-pattern { --htype: var(--type-pattern); }
  .badge { justify-self: start; margin-top: 8px; font-size: 10px; font-weight: 750; text-transform: uppercase;
    letter-spacing: .18em; color: var(--htype, var(--ink-2)); }
  .hero-ko { display: flex; align-items: center; gap: 14px; flex-wrap: wrap; margin-top: 6px;
    font-size: 46px; font-weight: 850; color: var(--ink); line-height: 1.04; letter-spacing: -.02em; }
  .hero-en { margin: 5px 0 0; font-family: var(--serif); font-style: italic; font-weight: 400; font-size: 23px; color: var(--ink); }
  .chips { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 12px; }
  .chip { font-size: 10px; font-weight: 700; letter-spacing: .1em; text-transform: uppercase; padding: 3px 9px;
    border-radius: 999px; border: 1px solid var(--border); color: var(--ink-3); }
  .chip.soft { border-color: transparent; background: var(--surface-2); color: var(--ink-2); }
  .addrev { justify-self: start; margin-top: 14px; padding: 9px 16px; border-radius: 8px; background: var(--ink); color: #fff;
    font-weight: 720; font-size: 13px; transition: opacity .12s; }
  .addrev:hover { opacity: .9; }
  .addrev.on { background: transparent; color: var(--type-word); border: 1px solid var(--type-word); cursor: default; }

  /* Section headers: tracked label + hairline rule */
  section { display: grid; gap: 13px; }
  .sec-head { display: flex; align-items: center; gap: 12px; font-size: 11px; font-weight: 750; letter-spacing: .16em;
    text-transform: uppercase; color: var(--ink-3); }
  .sec-head::after { content: ''; flex: 1; height: 1px; background: var(--border); }
  .dot { display: none; }

  /* How to use */
  .callout p { margin: 0; color: var(--ink); }
  .callout-label { font-size: 11px; font-weight: 750; letter-spacing: .14em; text-transform: uppercase; color: var(--ink-3); margin-bottom: 9px; }
  .callout.info { display: block; padding: 16px 18px; background: var(--surface-2); border-radius: var(--radius); line-height: 1.62; }
  .callout.info .callout-label { display: flex; align-items: center; gap: 7px; }
  .callout.info .ico { font-size: 15px; }
  .points { list-style: none; margin: 0; padding: 0; display: grid; gap: 10px; }
  .points li { position: relative; padding-left: 16px; line-height: 1.62; color: var(--ink); }
  .points li::before { content: ''; position: absolute; left: 0; top: 12px; width: 7px; height: 1.5px; background: var(--ink-3); }
  .ko-hl { color: var(--accent-ink); font-weight: 800; }

  /* note callouts (tip / nuance / mistakes) — hairline with colored left rule */
  .callout.tip, .callout.nuance, .callout.warn { display: flex; gap: 11px; padding: 13px 15px 13px 14px;
    border: 1px solid var(--border); border-left: 3px solid var(--cl, var(--ink)); border-radius: 8px; background: var(--surface); line-height: 1.6; }
  .callout.tip { --cl: var(--type-expression); }
  .callout.nuance { --cl: var(--ink); }
  .callout.warn { --cl: var(--accent); }
  .callout .ico { font-size: 16px; line-height: 1.5; flex: none; }
  .callout ul { margin: 4px 0 0; padding-left: 16px; display: grid; gap: 4px; }

  /* Form tiles — flat hairline */
  .forms { display: grid; grid-template-columns: repeat(auto-fill, minmax(148px, 1fr)); gap: 8px; }
  .form-tile { display: grid; gap: 2px; padding: 11px 13px; border-radius: 8px; background: var(--surface);
    border: 1px solid var(--border); cursor: pointer; text-align: left; transition: border-color .12s; }
  .form-tile:hover, .form-tile.open { border-color: var(--ink); }
  .ft-top { display: flex; align-items: center; justify-content: space-between; }
  .chev { color: var(--ink-3); font-size: 12px; }
  .flabel { font-size: 10px; font-weight: 750; text-transform: uppercase; letter-spacing: .12em; color: var(--ink-3); }
  .fko { font-size: 19px; font-weight: 780; display: flex; align-items: center; gap: 8px; margin-top: 2px; }
  .fstem { color: var(--ink); }
  .fend { color: var(--accent-ink); }  /* conjugation ending — KGIU-style red highlight */
  .ft-detail { margin-top: 8px; padding-top: 9px; border-top: 1px solid var(--border); display: grid; gap: 4px; }
  .ft-gloss { font-weight: 800; color: var(--ink); }
  .ft-why { margin: 0; font-size: 13px; color: var(--ink-2); line-height: 1.5; }

  /* Usage / examples — list rows, hairline separators (no boxes) */
  .lines { display: grid; }
  .line-card { padding: 13px 2px 14px; border-bottom: 1px solid var(--border); }
  .lines .line-card:last-child { border-bottom: 0; padding-bottom: 0; }
  .lko { font-size: 20px; font-weight: 740; display: flex; align-items: center; gap: 8px; color: var(--ink); }
  .len { color: var(--ink); margin-top: 3px; }
  .note { color: var(--ink-3); font-size: 13px; margin-top: 4px; }

  /* Connections — hairline tags */
  .conn { display: flex; flex-wrap: wrap; gap: 8px; }
  .conn-chip { display: inline-flex; align-items: baseline; gap: 6px; padding: 6px 12px; border-radius: 999px;
    border: 1px solid var(--border); color: var(--ink); font-weight: 750; }
  .conn-chip em { font-style: normal; font-weight: 500; color: var(--ink-3); font-size: 13px; }
  .conn-chip.gram { color: var(--type-grammar); }
</style>
