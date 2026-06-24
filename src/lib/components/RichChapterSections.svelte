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
    const submitted = normalizeAnswer(answers[i]);
    if ((ex.options || []).length) {
      return normalizeAnswer(correctAnswer(ex)) === submitted;
    }
    return correctAnswers(ex).some((answer) => normalizeAnswer(answer) === submitted);
  }

  function correctAnswer(ex) {
    return String(ex?.correct || ex?.answer || '');
  }

  function correctAnswers(ex) {
    const answer = correctAnswer(ex);
    if (!answer.includes('/')) return [answer];
    return answer.split('/').map((part) => part.trim()).filter(Boolean);
  }

  function normalizeAnswer(value) {
    return String(value || '').trim().toLowerCase();
  }

  function isTextExercise(ex) {
    return ex?.type === 'translate'
      || ex?.type === 'errorCorrect'
      || ex?.type === 'errorCorrection'
      || ex?.type === 'correction'
      || (ex?.type === 'fillBlank' && !(ex.options || []).length);
  }

  function textPlaceholder(ex) {
    if (ex?.type === 'translate') return 'Type in Korean…';
    if (ex?.type === 'fillBlank') return 'Type the answer…';
    return 'Type the corrected sentence…';
  }

  function formationSteps(text = '') {
    const normalized = String(text || '').replace(/\s+/g, ' ').trim();
    if (!normalized) return [];
    const protectedText = normalized
      .replace(/e\.g\./g, '__EG__')
      .replace(/i\.e\./g, '__IE__')
      .replace(/Mr\./g, '__MR__')
      .replace(/Ms\./g, '__MS__');
    const restored = (part) => part
      .replace(/__EG__/g, 'e.g.')
      .replace(/__IE__/g, 'i.e.')
      .replace(/__MR__/g, 'Mr.')
      .replace(/__MS__/g, 'Ms.')
      .trim();
    return protectedText
      .split(/(?<=[.!?])\s+(?=[A-Z가-힣'“"(-])/)
      .map(restored)
      .filter(Boolean);
  }

  $: hook = chapter.hook || null;
  $: grammarNotes = chapter.grammarNotes || [];
  $: vocab = chapter.extendedVocabulary || [];
  $: dialogue = chapter.extendedDialogue || null;
  $: reading = chapter.readingText || null;
  $: cultural = chapter.culturalNote || null;
  $: exercises = chapter.inlineExercises || [];
  $: summary = chapter.summaryCard || null;

  // Progressive disclosure — keep the first paint short so the chapter doesn't
  // look like a wall of text. Learners expand the deep explanations on demand.
  const VISIBLE_EXAMPLES = 2;
  let openMore = {};        // grammar note index -> extra examples + contrast + pitfall shown
  let openVocab = false;
  let openDialogue = false;
  let openReading = false;
  let openCultural = false;
  let openExercises = false;
  let allOpen = false;

  function toggleMore(gi) {
    openMore = { ...openMore, [gi]: !openMore[gi] };
  }

  function moreLabel(gn) {
    const extra = Math.max(0, (gn.examples?.length || 0) - VISIBLE_EXAMPLES);
    const bits = [];
    if (extra) bits.push(`${extra} more example${extra > 1 ? 's' : ''}`);
    if (gn.contrastPairs?.length) bits.push('contrast');
    if (gn.englishSpeakerPitfall) bits.push('pitfall');
    return `Show ${bits.join(' · ')}`;
  }

  function setAll(value) {
    allOpen = value;
    openMore = Object.fromEntries((grammarNotes || []).map((_, gi) => [gi, value]));
    openVocab = openDialogue = openReading = openCultural = openExercises = value;
  }

  // When the learner navigates to a different chapter, collapse everything again.
  $: if (chapter) { void chapter.id; resetDisclosure(); }
  function resetDisclosure() {
    openMore = {};
    openVocab = openDialogue = openReading = openCultural = openExercises = false;
    allOpen = false;
  }
</script>

<!-- ── DENSITY TOGGLE ────────────────────────────────────── -->
{#if grammarNotes.length || vocab.length || dialogue || reading || cultural || exercises.length}
  <div class="density-bar">
    <span class="db-hint">Essentials are shown first. Open a section when you want the deeper explanation.</span>
    <button class="db-btn" type="button" on:click={() => setAll(!allOpen)}>
      {allOpen ? 'Collapse all' : 'Expand all'}
    </button>
  </div>
{/if}

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
{#each grammarNotes as gn, gi}
  {@const steps = formationSteps(gn.formation)}
  {@const hasMore = (gn.examples?.length || 0) > VISIBLE_EXAMPLES || gn.contrastPairs?.length || gn.englishSpeakerPitfall}
  <div class="rich-block">
    <div class="sec-head"><span class="dot g" />Grammar deep dive: <strong>{gn.title}</strong></div>

    <div class="mental-model">
      <span class="mm-icon">💡</span>
      <div><strong>Mental model:</strong> {gn.mentalModel}</div>
    </div>

    <div class="formation-card">
      <div class="formation-label">
        <span class="formation-kicker">Build</span>
        <strong>Formation</strong>
      </div>
      <div class="formation-body">
        {#if steps.length > 1}
          <ol class="formation-steps">
            {#each steps as step}
              <li>{step}</li>
            {/each}
          </ol>
        {:else}
          <p>{gn.formation}</p>
        {/if}
      </div>
    </div>

    <div class="examples-grid" class:collapsed={!openMore[gi]}>
      {#each gn.examples as ex, ei}
        <div class="ex-row" class:extra={ei >= VISIBLE_EXAMPLES}>
          <div class="ex-ko">{ex.ko} <AudioButton text={ex.ko} size={20} /></div>
          <RomanizationLine text={ex.romanization} />
          <div class="ex-en">{ex.en}</div>
          {#if ex.note}<div class="ex-note">↳ {ex.note}</div>{/if}
        </div>
      {/each}
    </div>

    {#if hasMore}
      <button class="more-toggle" type="button" aria-expanded={openMore[gi] ? 'true' : 'false'} on:click={() => toggleMore(gi)}>
        {openMore[gi] ? 'Show less' : moreLabel(gn)}
        <span class="mt-chev">{openMore[gi] ? '▲' : '▾'}</span>
      </button>
    {/if}

    {#if openMore[gi] && gn.contrastPairs?.length}
      <div class="contrast-head">{gn.contrastTitle || 'Side-by-side contrast'}</div>
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

    {#if openMore[gi] && gn.englishSpeakerPitfall}
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
  <details class="rich-block collapsible" bind:open={openVocab}>
    <summary class="collapse-head"><span class="dot v" />Vocabulary in context <span class="count-tag">{vocab.length} words</span><span class="ch-line"></span><span class="ch-chev">▸</span></summary>
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
  </details>
{/if}

<!-- ── EXTENDED DIALOGUE ─────────────────────────────────── -->
{#if dialogue}
  <details class="rich-block dialogue-block collapsible" bind:open={openDialogue}>
    <summary class="chat-titlebar">
      <div class="chat-room">
        <span class="chat-avatar">한</span>
        <div>
          <div class="chat-name">Chapter chat</div>
          <div class="chat-subtitle">{dialogue.setting}</div>
        </div>
      </div>
      <span class="chat-status">Practice <span class="ch-chev dark">▸</span></span>
    </summary>
    <div class="dl-chat">
      {#each dialogue.lines as line}
        <div class="dl-line" class:right={line.speaker !== dialogue.lines[0].speaker}>
          <div class="dl-spk">{line.speaker}</div>
          <div class="dl-bubble">
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
  </details>
{/if}

<!-- ── READING TEXT ──────────────────────────────────────── -->
{#if reading}
  <details class="rich-block collapsible" bind:open={openReading}>
    <summary class="collapse-head"><span class="dot r" />Reading: {reading.title}<span class="ch-line"></span><span class="ch-chev">▸</span></summary>
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
  </details>
{/if}

<!-- ── CULTURAL NOTE ─────────────────────────────────────── -->
{#if cultural}
  <details class="rich-block cultural collapsible" bind:open={openCultural}>
    <summary class="collapse-head"><span class="dot c" />Cultural note: {cultural.title}<span class="ch-line"></span><span class="ch-chev">▸</span></summary>
    <p>{cultural.body}</p>
  </details>
{/if}

<!-- ── INLINE EXERCISES ──────────────────────────────────── -->
{#if exercises.length}
  <details class="rich-block collapsible" bind:open={openExercises}>
    <summary class="collapse-head"><span class="dot e" />Practice — {exercises.length} questions<span class="ch-line"></span><span class="ch-chev">▸</span></summary>
    <div class="exercises">
      {#each exercises as ex, i}
        <div class="exercise" class:done={revealed[i]} class:correct={revealed[i] && isCorrect(i)} class:wrong={revealed[i] && !isCorrect(i)}>
          <div class="ex-num">{i + 1}</div>
          <div class="ex-body">
            <div class="ex-prompt">{ex.prompt}</div>

            {#if (ex.type === 'fillBlank' && (ex.options || []).length) || ex.type === 'multipleChoice'}
              <div class="ex-options">
                {#each (ex.options || []) as opt}
                  <button
                    class="ex-opt"
                    class:picked={answers[i] === opt}
                    class:opt-correct={revealed[i] && opt === correctAnswer(ex)}
                    class:opt-wrong={revealed[i] && answers[i] === opt && opt !== correctAnswer(ex)}
                    disabled={revealed[i]}
                    on:click={() => pick(i, opt)}
                  >{opt}</button>
                {/each}
              </div>

            {:else if isTextExercise(ex)}
              {#if !revealed[i]}
                <input
                  class="ex-input"
                  type="text"
                  placeholder={textPlaceholder(ex)}
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
                {#if isCorrect(i)}✓ Correct!{:else}✗ The answer is: <strong>{correctAnswer(ex)}</strong>{/if}
              </div>
              <div class="ex-explanation">{ex.explanation}</div>
            {/if}
          </div>
        </div>
      {/each}
    </div>
  </details>
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

  /* DENSITY TOGGLE */
  .density-bar { display: flex; align-items: center; justify-content: space-between; gap: 12px; flex-wrap: wrap;
    padding: 10px 14px; border-radius: var(--radius); background: var(--surface-2); border: 1px solid var(--border); }
  .db-hint { font-size: 12px; color: var(--ink-3); line-height: 1.4; }
  .db-btn { flex: none; padding: 7px 14px; border-radius: 999px; background: var(--surface); border: 1px solid var(--border-2);
    color: var(--ink); font-size: 12px; font-weight: 850; cursor: pointer; }
  .db-btn:hover { border-color: var(--ink-3); }

  /* COLLAPSIBLE SECTIONS */
  details.collapsible > summary { cursor: pointer; list-style: none; }
  details.collapsible > summary::-webkit-details-marker { display: none; }
  details.collapsible > summary:focus-visible { outline: 2px solid var(--accent); outline-offset: 3px; border-radius: 6px; }
  .collapse-head { display: flex; align-items: center; gap: 10px; font-size: 11px; font-weight: 750;
    letter-spacing: .15em; text-transform: uppercase; color: var(--ink-3); }
  details.collapsible[open] > .collapse-head { margin-bottom: 2px; }
  .ch-line { flex: 1; height: 1px; background: var(--border); }
  .ch-chev { display: inline-block; flex: none; font-size: 12px; color: var(--ink-3); transition: transform .15s; }
  details.collapsible[open] .ch-chev { transform: rotate(90deg); }
  .ch-chev.dark { color: rgba(36,31,10,.6); }
  summary.chat-titlebar { cursor: pointer; list-style: none; }
  summary.chat-titlebar::-webkit-details-marker { display: none; }
  .chat-status { display: inline-flex; align-items: center; gap: 7px; }

  /* GRAMMAR: keep only the first examples until expanded */
  .examples-grid.collapsed .ex-row.extra { display: none; }
  .more-toggle { justify-self: start; display: inline-flex; align-items: center; gap: 7px;
    padding: 8px 15px; border-radius: 999px; background: #faf5ff; border: 1px solid #e1d0f0;
    color: #6b3f92; font-size: 12px; font-weight: 850; cursor: pointer; }
  .more-toggle:hover { border-color: #c9a9e3; background: #f5ecfc; }
  .mt-chev { font-size: 10px; }

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

  .formation-card {
    display: grid;
    grid-template-columns: minmax(96px, 128px) 1fr;
    gap: 14px;
    align-items: start;
    padding: 14px;
    border: 1px solid #d7c7e7;
    border-radius: 12px;
    background: linear-gradient(180deg, #fff, #faf7ff);
  }
  .formation-label {
    display: grid;
    gap: 4px;
    padding: 10px 12px;
    border-radius: 10px;
    background: #f2e8fb;
    color: #5c2f7e;
  }
  .formation-kicker {
    font-size: 10px;
    font-weight: 850;
    letter-spacing: .12em;
    text-transform: uppercase;
    color: #7d55a0;
  }
  .formation-label strong { font-size: 14px; line-height: 1.2; }
  .formation-body {
    min-width: 0;
    color: var(--ink);
    font-size: 14px;
    line-height: 1.68;
  }
  .formation-body p { margin: 0; overflow-wrap: anywhere; }
  .formation-steps {
    margin: 0;
    padding: 0;
    counter-reset: formation;
    display: grid;
    gap: 8px;
    list-style: none;
  }
  .formation-steps li {
    position: relative;
    padding: 9px 12px 9px 42px;
    border-radius: 10px;
    background: rgba(255,255,255,.82);
    border: 1px solid #eee7f5;
    overflow-wrap: anywhere;
  }
  .formation-steps li::before {
    counter-increment: formation;
    content: counter(formation);
    position: absolute;
    left: 12px;
    top: 10px;
    width: 20px;
    height: 20px;
    border-radius: 999px;
    display: grid;
    place-items: center;
    background: #7d55a0;
    color: #fff;
    font-size: 11px;
    font-weight: 850;
  }

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
  .dialogue-block {
    gap: 0;
    padding: 0;
    overflow: hidden;
    background: #b9cfde;
    border-color: #97b3c7;
  }
  .chat-titlebar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    padding: 13px 16px;
    background: #f7df4d;
    border-bottom: 1px solid rgba(120, 104, 0, .18);
    color: #241f0a;
  }
  .chat-room {
    min-width: 0;
    display: flex;
    align-items: center;
    gap: 10px;
  }
  .chat-avatar {
    width: 32px;
    height: 32px;
    flex: none;
    border-radius: 12px;
    display: grid;
    place-items: center;
    background: #2f2b12;
    color: #f7df4d;
    font-family: var(--serif-ko);
    font-size: 16px;
    font-weight: 850;
  }
  .chat-name {
    font-size: 14px;
    font-weight: 850;
    line-height: 1.2;
  }
  .chat-subtitle {
    max-width: 72ch;
    margin-top: 2px;
    color: rgba(36,31,10,.72);
    font-size: 12px;
    line-height: 1.35;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .chat-status {
    flex: none;
    padding: 4px 9px;
    border-radius: 999px;
    background: rgba(255,255,255,.55);
    color: rgba(36,31,10,.72);
    font-size: 11px;
    font-weight: 850;
    letter-spacing: .04em;
    text-transform: uppercase;
  }
  .dl-chat {
    display: grid;
    gap: 12px;
    padding: 18px;
    background:
      linear-gradient(rgba(255,255,255,.16) 1px, transparent 1px),
      linear-gradient(90deg, rgba(255,255,255,.12) 1px, transparent 1px),
      #b9cfde;
    background-size: 28px 28px;
  }
  .dl-line {
    display: grid;
    justify-items: start;
    gap: 5px;
  }
  .dl-line.right {
    justify-items: end;
  }
  .dl-line.right .dl-bubble {
    background: #fee95d;
    border-color: #efcf2f;
    border-top-right-radius: 6px;
  }
  .dl-line.right .dl-note,
  .dl-line.right .dl-spk {
    text-align: right;
  }
  .dl-bubble {
    position: relative;
    max-width: min(78%, 620px);
    padding: 11px 13px 12px;
    border-radius: 15px;
    border-top-left-radius: 6px;
    background: #fff;
    border: 1px solid rgba(70, 91, 105, .12);
    box-shadow: 0 2px 8px rgba(37, 56, 68, .08);
    display: grid;
    gap: 3px;
  }
  .dl-spk {
    max-width: min(78%, 620px);
    padding: 0 4px;
    font-size: 11px;
    font-weight: 850;
    color: rgba(28,45,57,.72);
  }
  .dl-ko {
    font-size: 17px;
    line-height: 1.45;
    font-weight: 760;
    display: flex;
    align-items: center;
    gap: 7px;
    flex-wrap: wrap;
    color: #181818;
  }
  .dl-line.right .dl-ko { justify-content: flex-end; }
  .dl-en {
    color: rgba(24,24,24,.68);
    font-size: 13px;
    line-height: 1.45;
  }
  .dl-note {
    max-width: min(78%, 620px);
    color: rgba(28,45,57,.76);
    font-size: 12px;
    line-height: 1.45;
    padding: 0 4px 2px;
  }

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

  @media (max-width: 640px) {
    .formation-card { grid-template-columns: 1fr; }
    .formation-label { grid-template-columns: auto 1fr; align-items: baseline; }
    .chat-titlebar { align-items: flex-start; }
    .chat-subtitle { white-space: normal; }
    .dl-chat { padding: 14px; }
    .dl-bubble,
    .dl-spk,
    .dl-note { max-width: 92%; }
  }
</style>
