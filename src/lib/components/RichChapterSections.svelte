<script>
  import AudioButton from './AudioButton.svelte';
  import RomanizationLine from './RomanizationLine.svelte';

  export let chapter;

  // Inline exercise state
  let answers = {};   // exerciseIndex -> chosen answer string
  let revealed = {};  // exerciseIndex -> bool

  function pick(i, option) {
    if (revealed[i]) return;
    answers = { ...answers, [i]: option };
  }
  function check(i) {
    if (!answers[i]) return;
    revealed = { ...revealed, [i]: true };
  }
  function isCorrect(i) {
    const ex = chapter.inlineExercises[i];
    return (answers[i] || '').trim().toLowerCase() === (ex.correct || '').trim().toLowerCase();
  }

  $: hook = chapter.hook || null;
  $: grammarNotes = chapter.grammarNotes || [];
  $: vocab = chapter.extendedVocabulary || [];
  $: dialogue = chapter.extendedDialogue || null;
  $: reading = chapter.readingText || null;
  $: cultural = chapter.culturalNote || null;
  $: exercises = chapter.inlineExercises || [];
  $: summary = chapter.summaryCard || null;
</script>

<!-- ── HOOK ─────────────────────────────────────────────── -->
{#if hook}
  <div class="rich-block hook-block">
    <div class="hook-sit">🎯 {hook.situation}</div>
    <div class="hook-body">
      <div class="hook-col">
        <div class="hook-label">By the end of this chapter you'll be able to:</div>
        <ul class="hook-goals">
          {#each hook.objectives as obj}<li>{obj}</li>{/each}
        </ul>
      </div>
      <div class="hook-col why">
        <div class="hook-label">Why it matters</div>
        <p>{hook.whyItMatters}</p>
      </div>
    </div>
  </div>
{/if}

<!-- ── GRAMMAR NOTES ─────────────────────────────────────── -->
{#each grammarNotes as gn}
  <div class="rich-block">
    <div class="sec-head"><span class="dot g" />Grammar deep dive: <strong>{gn.title}</strong></div>

    <div class="mental-model">
      <span class="mm-icon">💡</span>
      <div><strong>Mental model:</strong> {gn.mentalModel}</div>
    </div>

    <div class="formation-tag">Formation: <code>{gn.formation}</code></div>

    <div class="examples-grid">
      {#each gn.examples as ex}
        <div class="ex-row">
          <div class="ex-ko">{ex.ko} <AudioButton text={ex.ko} size={20} /></div>
          <RomanizationLine text={ex.romanization} />
          <div class="ex-en">{ex.en}</div>
          {#if ex.note}<div class="ex-note">↳ {ex.note}</div>{/if}
        </div>
      {/each}
    </div>

    {#if gn.contrastPairs?.length}
      <div class="contrast-head">에 vs 에서 — side by side</div>
      <div class="contrast-grid">
        {#each gn.contrastPairs as pair}
          <div class="contrast-pair">
            <div class="cp-row a">
              <span class="cp-badge">✓</span>
              <div>
                <div class="cp-ko">{pair.a.ko} <AudioButton text={pair.a.ko} size={18} /></div>
                <div class="cp-en">{pair.a.en}</div>
              </div>
            </div>
            <div class="cp-row b">
              <span class="cp-badge alt">↔</span>
              <div>
                <div class="cp-ko">{pair.b.ko} <AudioButton text={pair.b.ko} size={18} /></div>
                <div class="cp-en">{pair.b.en}</div>
              </div>
            </div>
            <div class="cp-explain">{pair.explanation}</div>
          </div>
        {/each}
      </div>
    {/if}

    {#if gn.englishSpeakerPitfall}
      {@const pit = gn.englishSpeakerPitfall}
      <div class="pitfall">
        <div class="pitfall-head">⚠️ English speaker pitfall</div>
        <div class="pitfall-rows">
          <div class="pf-row wrong"><span class="pf-badge bad">✗</span><span class="pf-ko">{pit.wrong}</span></div>
          <div class="pf-row right"><span class="pf-badge ok">✓</span><span class="pf-ko">{pit.right}</span></div>
        </div>
        <div class="pitfall-explain">{pit.explanation}</div>
      </div>
    {/if}

    {#if gn.exceptions?.length}
      <details class="exceptions">
        <summary>Edge cases &amp; exceptions ({gn.exceptions.length})</summary>
        <ul>{#each gn.exceptions as e}<li>{e}</li>{/each}</ul>
      </details>
    {/if}
  </div>
{/each}

<!-- ── EXTENDED VOCABULARY ───────────────────────────────── -->
{#if vocab.length}
  <div class="rich-block">
    <div class="sec-head"><span class="dot v" />Vocabulary in context <span class="count-tag">{vocab.length} words</span></div>
    <div class="vocab-grid">
      {#each vocab as w}
        <div class="vocab-card">
          <div class="vc-top">
            <span class="vc-ko">{w.hangul}</span>
            <AudioButton text={w.hangul} size={20} />
            <span class="vc-pos">{w.partOfSpeech}</span>
          </div>
          <RomanizationLine text={w.romanization} />
          <div class="vc-en">{w.english}</div>
          {#if w.exampleSentence}
            <div class="vc-ex">
              <div class="vc-ex-ko">{w.exampleSentence.ko}</div>
              <div class="vc-ex-en">{w.exampleSentence.en}</div>
              {#if w.exampleSentence.note}<div class="vc-ex-note">↳ {w.exampleSentence.note}</div>{/if}
            </div>
          {/if}
          {#if w.collocations?.length}
            <div class="vc-collocations">{w.collocations.join(' · ')}</div>
          {/if}
        </div>
      {/each}
    </div>
  </div>
{/if}

<!-- ── EXTENDED DIALOGUE ─────────────────────────────────── -->
{#if dialogue}
  <div class="rich-block">
    <div class="sec-head"><span class="dot" />Extended dialogue</div>
    <div class="dl-setting">📍 {dialogue.setting}</div>
    <div class="dl-chat">
      {#each dialogue.lines as line}
        <div class="dl-line" class:right={line.speaker !== dialogue.lines[0].speaker}>
          <div class="dl-bubble">
            <div class="dl-spk">{line.speaker}</div>
            <div class="dl-ko">{line.ko} <AudioButton text={line.ko} size={20} /></div>
            <RomanizationLine text={line.romanization} />
            <div class="dl-en">{line.en}</div>
          </div>
          {#if line.grammarNote}
            <div class="dl-note">📌 {line.grammarNote}</div>
          {/if}
        </div>
      {/each}
    </div>
  </div>
{/if}

<!-- ── READING TEXT ──────────────────────────────────────── -->
{#if reading}
  <div class="rich-block">
    <div class="sec-head"><span class="dot r" />Reading: {reading.title}</div>
    <div class="reading-body">
      <p class="reading-ko">{reading.body}</p>
      {#if reading.bodyTranslation}
        <details class="reading-tr"><summary>Show translation</summary><p>{reading.bodyTranslation}</p></details>
      {/if}
    </div>
    {#if reading.comprehensionQuestions?.length}
      <div class="cq-head">Comprehension questions</div>
      <div class="cqs">
        {#each reading.comprehensionQuestions as q, qi}
          <details class="cq">
            <summary>{qi + 1}. {q.question}</summary>
            <div class="cq-answer">{q.answer}</div>
          </details>
        {/each}
      </div>
    {/if}
  </div>
{/if}

<!-- ── CULTURAL NOTE ─────────────────────────────────────── -->
{#if cultural}
  <div class="rich-block cultural">
    <div class="sec-head"><span class="dot c" />Cultural note: {cultural.title}</div>
    <p>{cultural.body}</p>
  </div>
{/if}

<!-- ── INLINE EXERCISES ──────────────────────────────────── -->
{#if exercises.length}
  <div class="rich-block">
    <div class="sec-head"><span class="dot e" />Practice — {exercises.length} questions</div>
    <div class="exercises">
      {#each exercises as ex, i}
        <div class="exercise" class:done={revealed[i]} class:correct={revealed[i] && isCorrect(i)} class:wrong={revealed[i] && !isCorrect(i)}>
          <div class="ex-num">{i + 1}</div>
          <div class="ex-body">
            <div class="ex-prompt">{ex.prompt}</div>

            {#if ex.type === 'fillBlank' || ex.type === 'multipleChoice'}
              <div class="ex-options">
                {#each (ex.options || []) as opt}
                  <button
                    class="ex-opt"
                    class:picked={answers[i] === opt}
                    class:opt-correct={revealed[i] && opt === ex.correct}
                    class:opt-wrong={revealed[i] && answers[i] === opt && opt !== ex.correct}
                    disabled={revealed[i]}
                    on:click={() => pick(i, opt)}
                  >{opt}</button>
                {/each}
              </div>

            {:else if ex.type === 'translate' || ex.type === 'errorCorrect'}
              {#if !revealed[i]}
                <input
                  class="ex-input"
                  type="text"
                  placeholder={ex.type === 'translate' ? 'Type in Korean…' : 'Type the corrected sentence…'}
                  bind:value={answers[i]}
                  on:keydown={(e) => e.key === 'Enter' && check(i)}
                />
                {#if ex.hint}<div class="ex-hint">💡 {ex.hint}</div>{/if}
              {:else}
                <div class="ex-typed-answer">{answers[i] || '—'}</div>
              {/if}
            {/if}

            {#if !revealed[i]}
              <button class="ex-check" disabled={!answers[i]} on:click={() => check(i)}>Check</button>
            {:else}
              <div class="ex-verdict" class:ok={isCorrect(i)}>
                {#if isCorrect(i)}✓ Correct!{:else}✗ The answer is: <strong>{ex.correct}</strong>{/if}
              </div>
              <div class="ex-explanation">{ex.explanation}</div>
            {/if}
          </div>
        </div>
      {/each}
    </div>
  </div>
{/if}

<!-- ── SUMMARY CARD ──────────────────────────────────────── -->
{#if summary}
  <div class="rich-block summary-block">
    <div class="sec-head"><span class="dot s" />Chapter summary</div>
    <ul class="summary-bullets">
      {#each summary.bullets as b}<li>{b}</li>{/each}
    </ul>
    {#if summary.nextChapterTeaser}
      <div class="next-teaser">▶ {summary.nextChapterTeaser}</div>
    {/if}
  </div>
{/if}

<style>
  .rich-block { display: grid; gap: 12px; padding: 20px; border-radius: var(--radius); background: var(--surface); border: 1px solid var(--border); }

  /* HOOK */
  .hook-block { background: linear-gradient(135deg, #f0f9f0, #e8f5e9); border-color: var(--green); }
  .hook-sit { font-size: 15px; font-weight: 700; color: var(--ink); line-height: 1.5; padding: 12px 14px; border-radius: 12px; background: rgba(255,255,255,.7); }
  .hook-body { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
  .hook-label { font-size: 11px; font-weight: 850; text-transform: uppercase; letter-spacing: .06em; color: var(--green-dark); margin-bottom: 6px; }
  .hook-goals { margin: 0; padding-left: 18px; display: grid; gap: 5px; }
  .hook-goals li { font-size: 14px; }
  .hook-col.why p { margin: 0; font-size: 14px; color: var(--ink-2); line-height: 1.55; }
  @media (max-width: 560px) { .hook-body { grid-template-columns: 1fr; } }

  /* SECTION HEADERS */
  .sec-head { display: flex; align-items: center; gap: 8px; font-size: 13px; font-weight: 850; flex-wrap: wrap; }
  .dot { width: 14px; height: 4px; border-radius: 2px; background: var(--ink); flex: none; }
  .dot.g { background: #9b59b6; }
  .dot.v { background: var(--green-dark); }
  .dot.r { background: #2980b9; }
  .dot.c { background: #e67e22; }
  .dot.e { background: #e74c3c; }
  .dot.s { background: var(--ink-3); }
  .count-tag { font-size: 11px; font-weight: 700; padding: 2px 8px; border-radius: 999px; background: var(--surface-2); color: var(--ink-3); }

  /* MENTAL MODEL */
  .mental-model { display: flex; gap: 10px; align-items: flex-start; padding: 14px; border-radius: 12px; background: #faf5ff; border: 1px solid #e8d5f5; }
  .mm-icon { font-size: 20px; flex: none; }
  .mental-model div { font-size: 14px; line-height: 1.6; color: var(--ink); }

  .formation-tag { font-size: 13px; color: var(--ink-2); }
  .formation-tag code { background: var(--surface-2); padding: 2px 8px; border-radius: 6px; font-size: 13px; font-weight: 800; }

  /* EXAMPLES */
  .examples-grid { display: grid; gap: 10px; }
  .ex-row { padding: 12px 14px; border-radius: 12px; background: var(--surface-2); border-left: 4px solid #9b59b6; display: grid; gap: 2px; }
  .ex-ko { font-size: 17px; font-weight: 730; display: flex; align-items: center; gap: 7px; }
  .ex-en { color: var(--ink-2); font-size: 14px; }
  .ex-note { font-size: 12px; color: #7f5a99; margin-top: 2px; }

  /* CONTRAST */
  .contrast-head { font-size: 12px; font-weight: 850; text-transform: uppercase; letter-spacing: .06em; color: var(--ink-3); margin-top: 4px; }
  .contrast-grid { display: grid; gap: 12px; }
  .contrast-pair { display: grid; gap: 6px; padding: 14px; border-radius: 12px; background: #f8f9fa; border: 1px solid var(--border); }
  .cp-row { display: flex; gap: 10px; align-items: flex-start; }
  .cp-badge { width: 22px; height: 22px; border-radius: 999px; display: grid; place-items: center; font-size: 12px; font-weight: 850; flex: none; margin-top: 3px; background: var(--green-soft); color: var(--green-dark); }
  .cp-badge.alt { background: #e8f4fd; color: #2980b9; }
  .cp-ko { font-size: 16px; font-weight: 730; display: flex; align-items: center; gap: 6px; }
  .cp-en { font-size: 13px; color: var(--ink-2); }
  .cp-explain { font-size: 13px; color: var(--ink-2); line-height: 1.5; padding: 8px 10px; border-radius: 8px; background: rgba(255,255,255,.8); margin-top: 2px; }

  /* PITFALL */
  .pitfall { padding: 14px; border-radius: 12px; background: #fff8f0; border: 1px solid #f5c89a; }
  .pitfall-head { font-size: 13px; font-weight: 850; color: #c0392b; margin-bottom: 8px; }
  .pitfall-rows { display: grid; gap: 6px; margin-bottom: 8px; }
  .pf-row { display: flex; gap: 10px; align-items: center; }
  .pf-badge { width: 22px; height: 22px; border-radius: 999px; display: grid; place-items: center; font-size: 12px; font-weight: 850; flex: none; }
  .pf-badge.bad { background: #fde8e8; color: #c0392b; }
  .pf-badge.ok { background: var(--green-soft); color: var(--green-dark); }
  .pf-ko { font-size: 16px; font-weight: 730; }
  .pitfall-explain { font-size: 13px; color: var(--ink-2); line-height: 1.55; }

  /* EXCEPTIONS */
  .exceptions { font-size: 13px; color: var(--ink-2); }
  .exceptions summary { cursor: pointer; font-weight: 750; color: var(--ink-3); }
  .exceptions ul { margin: 8px 0 0; padding-left: 18px; display: grid; gap: 4px; }

  /* VOCABULARY */
  .vocab-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); gap: 12px; }
  .vocab-card { padding: 14px; border-radius: 13px; background: var(--surface-2); border: 1px solid var(--border); display: grid; gap: 4px; }
  .vc-top { display: flex; align-items: center; gap: 8px; }
  .vc-ko { font-size: 22px; font-weight: 850; }
  .vc-pos { margin-left: auto; font-size: 11px; font-weight: 700; color: var(--ink-3); background: var(--surface); padding: 2px 8px; border-radius: 999px; }
  .vc-en { font-size: 14px; color: var(--ink-2); }
  .vc-ex { margin-top: 6px; padding: 8px 10px; border-radius: 8px; background: var(--surface); border-left: 3px solid var(--green); display: grid; gap: 2px; }
  .vc-ex-ko { font-size: 14px; font-weight: 700; }
  .vc-ex-en { font-size: 12px; color: var(--ink-2); }
  .vc-ex-note { font-size: 11px; color: var(--green-dark); }
  .vc-collocations { font-size: 11px; color: var(--ink-3); margin-top: 2px; }

  /* DIALOGUE */
  .dl-setting { font-size: 13px; color: var(--ink-3); padding: 8px 12px; border-radius: 8px; background: var(--surface-2); }
  .dl-chat { display: grid; gap: 14px; }
  .dl-line { display: grid; gap: 4px; }
  .dl-line.right .dl-bubble { margin-left: auto; border-left: none; border-right: 4px solid var(--green); text-align: right; }
  .dl-line.right .dl-note { text-align: right; }
  .dl-bubble { max-width: 80%; padding: 12px 14px; border-radius: 14px; background: var(--surface-2); border-left: 4px solid var(--border); display: grid; gap: 2px; }
  .dl-spk { font-size: 11px; font-weight: 850; text-transform: uppercase; letter-spacing: .05em; color: var(--green-dark); }
  .dl-ko { font-size: 17px; font-weight: 730; display: flex; align-items: center; gap: 7px; flex-wrap: wrap; }
  .dl-line.right .dl-ko { justify-content: flex-end; }
  .dl-en { color: var(--ink-2); font-size: 14px; }
  .dl-note { font-size: 12px; color: var(--ink-3); padding: 4px 10px; }

  /* READING */
  .reading-body { display: grid; gap: 8px; }
  .reading-ko { margin: 0; font-size: 16px; line-height: 2; font-weight: 600; padding: 16px 18px; border-radius: 12px; background: var(--surface-2); }
  .reading-tr { font-size: 13px; color: var(--ink-2); }
  .reading-tr summary { cursor: pointer; font-weight: 750; }
  .reading-tr p { margin: 8px 0 0; line-height: 1.6; }
  .cq-head { font-size: 12px; font-weight: 850; text-transform: uppercase; letter-spacing: .06em; color: var(--ink-3); }
  .cqs { display: grid; gap: 8px; }
  .cq { font-size: 14px; padding: 10px 12px; border-radius: 10px; background: var(--surface-2); border: 1px solid var(--border); }
  .cq summary { cursor: pointer; font-weight: 700; }
  .cq-answer { margin-top: 8px; color: var(--green-dark); font-weight: 700; font-size: 14px; padding: 8px 10px; border-radius: 8px; background: var(--green-soft); }

  /* CULTURAL */
  .cultural { background: #fff8f0; border-color: #f5c89a; }
  .cultural p { margin: 0; font-size: 14px; line-height: 1.7; color: var(--ink); }

  /* EXERCISES */
  .exercises { display: grid; gap: 14px; }
  .exercise { display: flex; gap: 12px; padding: 14px; border-radius: 13px; background: var(--surface-2); border: 1.5px solid var(--border); transition: border-color .15s; }
  .exercise.correct { border-color: var(--green); background: #f1fae6; }
  .exercise.wrong { border-color: #f0b6b6; background: #fdf0f0; }
  .ex-num { width: 28px; height: 28px; border-radius: 999px; background: var(--surface); border: 1.5px solid var(--border); display: grid; place-items: center; font-size: 13px; font-weight: 850; flex: none; }
  .ex-body { flex: 1; display: grid; gap: 10px; }
  .ex-prompt { font-size: 15px; font-weight: 700; }
  .ex-options { display: flex; flex-wrap: wrap; gap: 8px; }
  .ex-opt { padding: 8px 16px; border-radius: 999px; border: 1.5px solid var(--border); background: var(--surface); font-size: 15px; font-weight: 700; cursor: pointer; transition: border-color .1s, background .1s; }
  .ex-opt:hover:not(:disabled) { border-color: var(--green); }
  .ex-opt.picked { border-color: var(--green); background: var(--green-soft); }
  .ex-opt.opt-correct { border-color: var(--green); background: #f1fae6; color: var(--green-dark); }
  .ex-opt.opt-wrong { border-color: #f0b6b6; background: #fdf0f0; color: #c0392b; }
  .ex-input { width: 100%; padding: 9px 13px; border-radius: 10px; border: 1.5px solid var(--border); background: var(--surface); font: inherit; font-size: 15px; }
  .ex-input:focus { border-color: var(--green); outline: none; }
  .ex-hint { font-size: 12px; color: var(--ink-3); }
  .ex-typed-answer { font-size: 15px; font-weight: 700; padding: 8px 12px; border-radius: 8px; background: var(--surface); }
  .ex-check { justify-self: start; padding: 8px 18px; border-radius: 999px; background: var(--green); color: #fff; font-weight: 850; font-size: 13px; cursor: pointer; }
  .ex-check:disabled { opacity: .45; pointer-events: none; }
  .ex-verdict { font-size: 14px; font-weight: 800; padding: 6px 10px; border-radius: 8px; background: #fdf0f0; color: #c0392b; }
  .ex-verdict.ok { background: #f1fae6; color: var(--green-dark); }
  .ex-explanation { font-size: 13px; color: var(--ink-2); line-height: 1.55; padding: 8px 10px; border-radius: 8px; background: var(--surface); }

  /* SUMMARY */
  .summary-block { background: var(--surface-2); }
  .summary-bullets { margin: 0; padding-left: 20px; display: grid; gap: 8px; }
  .summary-bullets li { font-size: 14px; line-height: 1.6; }
  .next-teaser { font-size: 13px; color: var(--ink-3); padding: 10px 12px; border-radius: 8px; background: var(--surface); margin-top: 4px; }
</style>
