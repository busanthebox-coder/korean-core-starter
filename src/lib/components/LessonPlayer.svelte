<script>
  import AudioButton from './AudioButton.svelte';
  import RomanizationLine from './RomanizationLine.svelte';
  import ChatBubble from './ChatBubble.svelte';

  // Either pass a `chapter` (Learn builds chapter screens) OR a pre-built `screens`
  // array (generic mode, e.g. Guide). The player chrome — grouped progress, nav,
  // Hanmok styling, dojang completion — is shared.
  export let chapter = null;
  export let screens = null;       // generic mode: [{phase, kind, data}]
  export let kicker = '';          // eyebrow text override
  export let completion = null;    // {goal, bullets, teaser} override
  export let vocab = [];           // core vocab entries (chapter fallback)
  export let grammarFocus = [];    // [{hangul, plainEnglish}] chapter fallback
  export let done = false;
  export let nextChapter = null;   // {number?, title}
  export let onBack = () => {};
  export let onComplete = () => {};
  export let onPractice = () => {};
  export let onOpenChapter = () => {};

  function wordsScreenData(ch) {
    if (ch.extendedVocabulary && ch.extendedVocabulary.length) {
      return ch.extendedVocabulary.map((w) => ({
        ko: w.hangul, romanization: w.romanization, en: w.english,
        pos: w.partOfSpeech, ex: w.exampleSentence || null,
      }));
    }
    return (vocab || []).map((e) => ({
      ko: e.hangul || e.korean || e.ko || '', romanization: e.romanization || '',
      en: e.english || e.meaning || e.en || '', pos: e.partOfSpeech || e.type || '', ex: null,
    })).filter((w) => w.ko);
  }

  function buildChapterScreens(ch) {
    const s = [];
    const words = wordsScreenData(ch);
    const PER = 6; // chunk into focused screens of ~6 so the Words phase never becomes a long scroll
    for (let k = 0; k < words.length; k += PER) {
      s.push({ phase: 'words', kind: 'words', data: words.slice(k, k + PER) });
    }
    if (ch.grammarNotes && ch.grammarNotes.length) {
      ch.grammarNotes.forEach((gn) => s.push({ phase: 'grammar', kind: 'grammar', data: gn }));
    } else if (grammarFocus && grammarFocus.length) {
      s.push({ phase: 'grammar', kind: 'grammarFocus', data: grammarFocus });
    }
    const dlg = (ch.extendedDialogue && ch.extendedDialogue.lines && ch.extendedDialogue.lines.length)
      ? ch.extendedDialogue
      : (ch.dialogue && ch.dialogue.length ? { lines: ch.dialogue } : null);
    if (dlg) s.push({ phase: 'dialogue', kind: 'dialogue', data: dlg });
    if (ch.readingText && ch.readingText.body) s.push({ phase: 'dialogue', kind: 'reading', data: ch.readingText });
    if (ch.culturalNote && ch.culturalNote.body) s.push({ phase: 'dialogue', kind: 'culture', data: ch.culturalNote });
    if (ch.inlineExercises && ch.inlineExercises.length) {
      ch.inlineExercises.forEach((ex) => s.push({ phase: 'practice', kind: 'exercise', data: ex }));
    }
    const writing = (ch.writingTask && ch.writingTask.prompt)
      ? ch.writingTask
      : (ch.exitTask && ch.exitTask.prompt
        ? { prompt: ch.exitTask.prompt, hint: '', model: (ch.exitTask.sampleAnswer || {}).ko, modelEn: (ch.exitTask.sampleAnswer || {}).en }
        : null);
    if (writing) s.push({ phase: 'practice', kind: 'writing', data: writing });
    return s;
  }

  const PHASE = {
    words: { label: 'Words', ko: '단어', icon: 'volume', tone: 'words' },
    grammar: { label: 'Grammar', ko: '문법', icon: 'bulb', tone: 'grammar' },
    dialogue: { label: 'Talk', ko: '대화', icon: 'messages', tone: 'dialogue' },
    practice: { label: 'Practice', ko: '연습', icon: 'pencil', tone: 'practice' },
    // guide phases
    phrases: { label: 'Phrases', ko: '표현', icon: 'message-2', tone: 'words' },
    steps: { label: 'Steps', ko: '순서', icon: 'list-check', tone: 'practice' },
    reference: { label: 'Info', ko: '정보', icon: 'info-circle', tone: 'dialogue' },
  };

  let i = 0;
  let finished = false;
  let answers = {};
  let revealed = {};

  $: resetKey = (chapter && chapter.id) || kicker || (screens && screens.length);
  $: if (resetKey) { void resetKey; i = 0; finished = false; answers = {}; revealed = {}; }

  $: screenList = screens || (chapter ? buildChapterScreens(chapter) : []);
  $: cur = screenList[i] || null;
  $: phaseOrder = [...new Set(screenList.map((s) => s.phase))];
  $: groups = phaseOrder
    .map((p) => ({ p, idxs: screenList.map((s, idx) => (s.phase === p ? idx : -1)).filter((x) => x >= 0) }))
    .filter((g) => g.idxs.length);
  $: curPhase = cur ? cur.phase : null;
  $: curGroup = groups.find((g) => g.p === curPhase);
  $: posInPhase = curGroup ? curGroup.idxs.indexOf(i) + 1 : 0;
  $: phaseLabel = curPhase ? PHASE[curPhase] : null;

  $: eyebrow = kicker || (chapter ? `Chapter ${chapter.number} · ${chapter.title}` : '');
  $: doneGoal = (completion && completion.goal) || (chapter && chapter.goal) || '';
  $: doneBullets = (completion && completion.bullets) || (chapter && chapter.summaryCard && chapter.summaryCard.bullets) || [];
  $: doneTeaser = (completion && completion.teaser) || (chapter && chapter.summaryCard && chapter.summaryCard.nextChapterTeaser) || '';
  // Can-do checklist: prefer hand-authored chapter.canDo, else reuse the chapter's
  // exitTask "I can…" checklist items (every chapter has one) so all lessons close on a self-check.
  $: canDoList = (chapter && chapter.canDo && chapter.canDo.length)
    ? chapter.canDo
    : ((chapter && chapter.exitTask && chapter.exitTask.checklist) || []).filter((x) => /^I can\b/i.test(x));

  function next() {
    if (i < screenList.length - 1) { i += 1; scrollTop(); }
    else { finished = true; scrollTop(); }
  }
  function prev() {
    if (finished) { finished = false; scrollTop(); return; }
    if (i > 0) { i -= 1; scrollTop(); }
  }
  function scrollTop() { try { document.querySelector('.lp')?.scrollIntoView({ block: 'start' }); } catch { /* noop */ } }

  function correctOf(ex) { return String(ex?.correct || ex?.answer || ''); }
  function pick(opt) { if (revealed[i]) return; answers = { ...answers, [i]: opt }; }
  function check() { if (answers[i] == null || answers[i] === '') return; revealed = { ...revealed, [i]: true }; }
  function exCorrect() {
    const ex = cur.data;
    const got = String(answers[i] || '').trim().toLowerCase();
    return correctOf(ex).split('/').map((x) => x.trim().toLowerCase()).includes(got);
  }
</script>

{#if screenList.length}
<section class="lp">
  <div class="lp-top">
    <button class="lp-x" type="button" on:click={onBack} aria-label="Back"><i class="ti ti-x"></i></button>
    <div class="lp-prog" aria-hidden="true">
      {#each groups as g}
        <div class="pg-group" style="flex:{g.idxs.length}">
          {#each g.idxs as idx}
            <span class="pg-cell" class:on={finished || idx <= i} class:cur={!finished && idx === i}></span>
          {/each}
        </div>
      {/each}
    </div>
    <span class="lp-count">{finished ? 'done' : (phaseLabel ? `${phaseLabel.ko} ${posInPhase}/${curGroup.idxs.length}` : '')}</span>
  </div>

  <div class="lp-eyebrow">{eyebrow}</div>

  {#if finished}
    <div class="lp-done">
      <div class="seal-wrap"><span class="seal">독</span></div>
      <h2>Complete</h2>
      {#if doneGoal}<p class="done-goal">{doneGoal}</p>{/if}
      {#if doneBullets.length}<ul class="done-recap">{#each doneBullets as b}<li>{b}</li>{/each}</ul>{/if}
      {#if canDoList.length}
        <div class="cando">
          <span class="cando-cap">I can now…</span>
          <ul>{#each canDoList as c}<li><i class="ti ti-circle-check" aria-hidden="true"></i> {c}</li>{/each}</ul>
        </div>
      {/if}
      {#if doneTeaser}<div class="teaser">▶ {doneTeaser}</div>{/if}
      <div class="done-actions">
        <button class="btn3d" type="button" on:click={onPractice}>Practice this</button>
        <button class="ghost" type="button" aria-pressed={done} on:click={onComplete}>{done ? '✓ Marked done' : 'Mark complete'}</button>
        {#if nextChapter}
          <button class="ghost go" type="button" on:click={() => onOpenChapter(nextChapter)}>Next: {nextChapter.number ? `${nextChapter.number}. ` : ''}{nextChapter.title} →</button>
        {/if}
      </div>
    </div>

  {:else if cur}
    <div class="lp-screen" data-phase={cur.phase}>
      <span class="phase-tag tag-{phaseLabel.tone}"><i class="ti ti-{phaseLabel.icon}"></i> {phaseLabel.label}</span>

      {#if cur.kind === 'words'}
        <h2 class="screen-h">Key words</h2>
        <p class="screen-sub">The pieces you'll combine.</p>
        <div class="word-list">
          {#each cur.data as w}
            <div class="word">
              <div class="word-head">
                <div class="word-id">
                  <span class="word-ko">{w.ko}</span>
                  <RomanizationLine text={w.romanization} />
                </div>
                {#if w.pos}<span class="word-pos">{w.pos}</span>{/if}
                <AudioButton text={w.ko} size={22} />
              </div>
              <div class="word-en">{w.en}</div>
              {#if w.ex}
                <div class="word-ex">
                  <span class="ex-cap">예문 · example</span>
                  <div class="ex-ko">{w.ex.ko}</div>
                  {#if w.ex.en}<div class="ex-en">{w.ex.en}</div>{/if}
                  {#if w.ex.note}<div class="ex-note">↳ {w.ex.note}</div>{/if}
                </div>
              {/if}
            </div>
          {/each}
        </div>

      {:else if cur.kind === 'phrases'}
        <h2 class="screen-h">Key phrases</h2>
        <p class="screen-sub">Say these first — they carry the situation.</p>
        <div class="word-list">
          {#each cur.data as p, pi}
            <div class="word">
              <div class="word-top">
                <span class="kp-n">{pi + 1}</span>
                <span class="word-ko">{p.ko}</span>
                <AudioButton text={p.ko} size={20} />
              </div>
              <RomanizationLine text={p.romanization} />
              <div class="word-en">{p.en}</div>
              {#if p.note}<div class="word-ex"><span>{p.note}</span></div>{/if}
            </div>
          {/each}
        </div>

      {:else if cur.kind === 'grammar'}
        {@const gn = cur.data}
        <div class="g-strip" aria-hidden="true">{gn.title.split('—')[0].trim().split(' ')[0]}</div>
        <h2 class="screen-h grammar">{gn.title.split('—')[0].trim()}</h2>
        {#if gn.func}<p class="g-func">{gn.func}</p>
        {:else if gn.mentalModel}<p class="mm"><i class="ti ti-bulb"></i> {gn.mentalModel}</p>{/if}

        {#if gn.formTable?.length}
          <div class="g-table">
            <span class="g-cap">Form</span>
            {#each gn.formTable as r}
              <div class="gt-row"><div class="gt-when">{r.when}</div><div class="gt-add">{r.add}</div><div class="gt-ex">{r.ex}</div></div>
            {/each}
          </div>
        {/if}

        <div class="g-examples">
          {#each (gn.examples || []).slice(0, 4) as ex}
            <div class="g-ex">
              <div class="g-ko">{ex.ko} <AudioButton text={ex.ko} size={18} /></div>
              <RomanizationLine text={ex.romanization} />
              <div class="g-en">{ex.en}</div>
              {#if ex.note}<div class="g-note">↳ {ex.note}</div>{/if}
            </div>
          {/each}
        </div>

        {#if gn.keyPoint}
          <div class="g-key"><div class="gk-label"><i class="ti ti-key" aria-hidden="true"></i> {gn.keyPoint.label}</div><p>{gn.keyPoint.body}</p></div>
        {/if}

        {#if gn.pronunciation}
          <p class="g-pron"><i class="ti ti-volume" aria-hidden="true"></i> <b>Pronunciation.</b> {gn.pronunciation}</p>
        {/if}

        {#if gn.drill}
          <div class="g-drill">
            <div class="gd-label"><i class="ti ti-pencil" aria-hidden="true"></i> Practice — {gn.drill.instruction}</div>
            {#if gn.drill.model}<div class="gd-model">{gn.drill.model}</div>{/if}
            {#if gn.drill.items?.length}<ul class="gd-items">{#each gn.drill.items as it}<li>{it}</li>{/each}</ul>{/if}
          </div>
        {/if}

        {#if gn.englishSpeakerPitfall}
          <div class="pitfall"><i class="ti ti-alert-triangle"></i> <b>{gn.englishSpeakerPitfall.wrong}</b> → {gn.englishSpeakerPitfall.right}</div>
        {/if}

      {:else if cur.kind === 'grammarFocus'}
        <h2 class="screen-h grammar">Grammar focus</h2>
        <div class="gf-list">{#each cur.data as g}<div class="gf"><strong>{g.hangul}</strong><span>{g.plainEnglish}</span></div>{/each}</div>

      {:else if cur.kind === 'dialogue'}
        <h2 class="screen-h">{cur.data.setting ? 'Now you’ve got the pieces' : 'Dialogue'}</h2>
        {#if cur.data.setting}<p class="screen-sub">{cur.data.setting}</p>{/if}
        <div class="lp-chat">
          {#each cur.data.lines as line, li}
            {@const me = line.speaker === cur.data.lines[0].speaker}
            {@const first = li === 0 || cur.data.lines[li - 1].speaker !== line.speaker}
            <ChatBubble side={me ? 'right' : 'left'} name={line.speaker}
              ko={line.ko} romanization={line.romanization} en={line.en} note={line.grammarNote}
              showName={first} showAvatar={!me && first} audioSize={22} />
          {/each}
        </div>

      {:else if cur.kind === 'reading'}
        <h2 class="screen-h">Reading{cur.data.title ? ` · ${cur.data.title}` : ''}</h2>
        <p class="reading-body">{cur.data.body}</p>
        {#if cur.data.bodyTranslation}<details class="reading-tr"><summary>Show translation</summary><p>{cur.data.bodyTranslation}</p></details>{/if}

      {:else if cur.kind === 'culture'}
        <h2 class="screen-h">Culture · {cur.data.title}</h2>
        <p class="culture-body">{cur.data.body}</p>

      {:else if cur.kind === 'beginner'}
        <h2 class="screen-h">Good to know</h2>
        <div class="bg-list">{#each cur.data as b}<div class="bg-card"><strong>{b.title}</strong><p>{b.body}</p></div>{/each}</div>

      {:else if cur.kind === 'steps'}
        <h2 class="screen-h">Step by step</h2>
        <ol class="steps">{#each cur.data as st}<li>{st}</li>{/each}</ol>

      {:else if cur.kind === 'links'}
        <h2 class="screen-h">Official links</h2>
        <div class="links">{#each cur.data as l}<a class="link" href={l.url} target="_blank" rel="noopener noreferrer">{l.label}{#if l.note} — <em>{l.note}</em>{/if}</a>{/each}</div>

      {:else if cur.kind === 'exercise'}
        {@const ex = cur.data}
        <h2 class="screen-h ex-prompt">{ex.prompt}</h2>
        {#if (ex.options || []).length}
          <div class="ex-opts">
            {#each ex.options as opt}
              <button class="ex-opt"
                class:picked={answers[i] === opt}
                class:ok={revealed[i] && opt === correctOf(ex)}
                class:no={revealed[i] && answers[i] === opt && opt !== correctOf(ex)}
                disabled={revealed[i]} on:click={() => pick(opt)}>{opt}</button>
            {/each}
          </div>
        {:else}
          <input class="ex-input" type="text" bind:value={answers[i]} placeholder="Type your answer…" disabled={revealed[i]} on:keydown={(e) => e.key === 'Enter' && check()} />
          {#if ex.hint && !revealed[i]}<div class="ex-hint"><i class="ti ti-bulb"></i> {ex.hint}</div>{/if}
        {/if}
        {#if !revealed[i]}
          <button class="check" disabled={answers[i] == null || answers[i] === ''} on:click={check}>Check</button>
        {:else}
          <div class="verdict" class:ok={exCorrect()}>{exCorrect() ? '✓ Correct!' : `✗ Answer: ${correctOf(ex)}`}</div>
          {#if ex.explanation}<div class="ex-explain">{ex.explanation}</div>{/if}
        {/if}

      {:else if cur.kind === 'writing'}
        {@const wt = cur.data}
        <h2 class="screen-h">Write it</h2>
        <p class="screen-sub">{wt.prompt}</p>
        {#if wt.hint}<div class="ex-hint"><i class="ti ti-bulb" aria-hidden="true"></i> {wt.hint}</div>{/if}
        <textarea class="w-area" rows="3" placeholder="여기에 써 보세요…" bind:value={answers[i]}></textarea>
        {#if wt.model}
          <details class="w-model">
            <summary>Show a model answer</summary>
            <div class="w-model-body"><div class="w-ko">{wt.model}</div>{#if wt.modelEn}<div class="w-en">{wt.modelEn}</div>{/if}</div>
          </details>
        {/if}
      {/if}
    </div>
  {/if}

  {#if !finished}
    <div class="lp-nav">
      <button class="ghost" type="button" disabled={i === 0} on:click={prev}><i class="ti ti-arrow-left"></i> Prev</button>
      <button class="btn3d" type="button" on:click={next}>
        {i === screenList.length - 1 ? 'Finish' : '다음 · Next'} <i class="ti ti-arrow-right"></i>
      </button>
    </div>
  {/if}
</section>
{/if}

<style>
  .lp { position: relative; max-width: 540px; margin: 0 auto; padding: 18px 20px 28px; display: grid; gap: 16px;
    background:
      repeating-linear-gradient(rgba(140,123,104,.05) 0 1px, transparent 1px 32px),
      repeating-linear-gradient(90deg, rgba(140,123,104,.05) 0 1px, transparent 1px 32px),
      var(--bg); }

  .lp-top { display: flex; align-items: center; gap: 12px; }
  .lp-x { width: 34px; height: 34px; flex: none; display: grid; place-items: center; border-radius: 999px;
    background: var(--surface); border: 1px solid var(--border); color: var(--ink-2); font-size: 18px; }
  .lp-x:hover { border-color: var(--ink-3); }
  .lp-prog { flex: 1; display: flex; gap: 8px; align-items: center; }
  .pg-group { display: flex; gap: 4px; }
  .pg-cell { height: 7px; flex: 1; border-radius: 999px; background: var(--primary-wash); transition: background .25s var(--ease); }
  .pg-cell.on { background: var(--primary); }
  .pg-cell.cur { box-shadow: 0 0 0 2px var(--primary-wash); }
  .lp-count { flex: none; font-size: 12px; font-weight: 800; color: var(--ink-3); white-space: nowrap; min-width: 56px; text-align: right; }

  .lp-eyebrow { font-size: 11px; font-weight: 750; letter-spacing: .12em; text-transform: uppercase; color: var(--ink-3); }

  .lp-screen { background: var(--surface); border: 1px solid var(--border); border-radius: var(--r-2);
    padding: 22px 20px; box-shadow: var(--shadow-1); display: grid; gap: 12px; position: relative; overflow: hidden;
    animation: lp-in .26s var(--ease); }
  @keyframes lp-in { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: none; } }

  .phase-tag { justify-self: start; display: inline-flex; align-items: center; gap: 6px; font-size: 11px; font-weight: 850;
    letter-spacing: .08em; text-transform: uppercase; padding: 5px 11px; border-radius: 999px;
    background: var(--primary-wash); color: var(--accent-ink); }
  .tag-grammar { background: var(--gold-wash); color: #7A5A12; }
  .tag-dialogue { background: var(--surface-2); color: var(--ink-2); }
  .tag-practice { background: var(--green-soft); color: var(--green-dark); }

  .screen-h { margin: 0; font-family: var(--serif-ko); font-size: 24px; font-weight: 600; letter-spacing: -.01em; line-height: 1.15; }
  .screen-h.grammar { font-family: var(--sans); font-weight: 800; font-size: 28px; }
  .screen-h.ex-prompt { font-size: 19px; font-family: var(--sans); font-weight: 800; }
  .screen-sub { margin: -4px 0 2px; color: var(--ink-3); font-size: 14px; }

  .g-strip { position: absolute; right: -8px; bottom: -34px; font-family: var(--serif-ko); font-weight: 700;
    font-size: 150px; line-height: 1; color: var(--ink); opacity: .05; pointer-events: none; }

  .word-list { display: grid; gap: 12px; }
  .word { background: var(--surface-2); border-radius: var(--r-1); padding: 16px; display: grid; gap: 9px; }
  .word-head { display: flex; align-items: flex-start; gap: 10px; }
  .word-top { display: flex; align-items: center; gap: 8px; }
  .word-id { flex: 1; min-width: 0; display: grid; gap: 2px; }
  .word-ko { font-size: 19px; font-weight: 800; }
  .word-id .word-ko { font-size: 25px; line-height: 1.12; }
  .word-pos { flex: none; align-self: center; font-size: 11px; font-weight: 700; color: var(--ink-3); background: var(--surface); padding: 3px 9px; border-radius: 999px; white-space: nowrap; }
  .kp-n { width: 22px; height: 22px; flex: none; display: grid; place-items: center; border-radius: 999px; background: var(--primary-wash); color: var(--accent-ink); font-size: 12px; font-weight: 850; }
  .word-en { font-size: 15px; font-weight: 600; color: var(--ink); }
  .word-ex { background: var(--surface); border-radius: var(--r-1); padding: 10px 12px; display: grid; gap: 3px; }
  .word-ex span { color: var(--ink-3); font-size: 13px; }
  .ex-cap { font-size: 10px; font-weight: 800; letter-spacing: .08em; text-transform: uppercase; color: var(--accent-ink); }
  .ex-ko { font-size: 15px; font-weight: 600; }
  .ex-en { font-size: 13px; color: var(--ink-2); }
  .ex-note { font-size: 12px; color: var(--ink-3); }

  .mm { margin: 0; font-size: 14px; line-height: 1.6; color: var(--ink-2); }
  .mm :global(i), .pitfall :global(i) { color: var(--gold); margin-right: 4px; }
  .g-examples { display: grid; gap: 8px; }
  .g-ex { background: var(--surface-2); border-radius: var(--r-1); padding: 11px 13px; display: grid; gap: 2px; }
  .g-ko { font-size: 18px; font-weight: 730; display: flex; align-items: center; gap: 7px; }
  .g-en { font-size: 14px; color: var(--ink-2); }
  .g-note { font-size: 12px; color: var(--ink-3); }
  .pitfall { font-size: 13px; line-height: 1.6; color: #9a3324; background: var(--danger-soft); border-radius: var(--r-1); padding: 10px 12px; }
  .pitfall :global(i) { color: var(--danger); }

  /* textbook-grade grammar fields */
  .g-func { margin: 0; font-size: 15px; line-height: 1.65; color: var(--ink); }
  .g-cap { font-size: 10px; font-weight: 800; letter-spacing: .1em; text-transform: uppercase; color: var(--ink-3); }
  .g-table { display: grid; gap: 6px; padding: 12px 13px; border: 1px solid var(--border); border-radius: var(--r-1); background: var(--surface); }
  .gt-row { display: grid; grid-template-columns: 1fr auto; gap: 4px 12px; align-items: baseline; padding: 7px 0; border-top: 1px solid var(--border); }
  .gt-row:first-of-type { border-top: 0; }
  .gt-when { font-size: 13px; color: var(--ink-2); }
  .gt-add { font-size: 17px; font-weight: 800; color: var(--accent-ink); }
  .gt-ex { grid-column: 1 / -1; font-size: 14px; color: var(--ink); }
  .g-key { background: var(--primary-wash); border-radius: var(--r-1); padding: 12px 13px; }
  .gk-label { font-size: 12px; font-weight: 850; color: var(--accent-ink); margin-bottom: 5px; }
  .gk-label :global(i) { margin-right: 4px; }
  .g-key p { margin: 0; font-size: 13px; line-height: 1.65; color: var(--ink); }
  .g-pron { margin: 0; font-size: 13px; line-height: 1.6; color: var(--ink-2); }
  .g-pron :global(i) { color: var(--ink-3); margin-right: 4px; }
  .g-drill { background: var(--green-soft); border-radius: var(--r-1); padding: 12px 13px; display: grid; gap: 8px; }
  .gd-label { font-size: 12px; font-weight: 850; color: var(--green-dark); }
  .gd-label :global(i) { margin-right: 4px; }
  .gd-model { font-size: 14px; color: var(--ink); }
  .gd-items { margin: 0; padding-left: 18px; display: grid; gap: 5px; font-size: 14px; color: var(--ink); }

  .gf-list { display: grid; gap: 8px; }
  .gf { padding: 11px 14px; border-radius: var(--r-1); background: var(--surface-2); border-left: 4px solid var(--gold); }
  .gf strong { margin-right: 8px; color: var(--accent-ink); }
  .gf span { color: var(--ink-2); }

  .lp-chat { display: grid; gap: 12px; padding: 14px; border-radius: var(--r-1); background: var(--chat-bg); }

  .reading-body, .culture-body { margin: 0; font-size: 15px; line-height: 1.85; }
  .reading-tr { font-size: 13px; color: var(--ink-2); margin-top: 4px; }
  .reading-tr summary { cursor: pointer; font-weight: 750; }

  .bg-list { display: grid; gap: 10px; }
  .bg-card { background: var(--surface-2); border-radius: var(--r-1); padding: 12px 14px; }
  .bg-card strong { display: block; margin-bottom: 3px; }
  .bg-card p { margin: 0; color: var(--ink-2); font-size: 14px; line-height: 1.55; }
  .steps { margin: 0; padding-left: 20px; display: grid; gap: 8px; font-size: 15px; line-height: 1.55; }
  .links { display: grid; gap: 8px; }
  .link { display: inline-block; padding: 11px 14px; border-radius: var(--r-1); background: var(--accent-soft); color: var(--accent-ink); font-weight: 800; }
  .link em { font-style: normal; font-weight: 600; color: var(--ink-2); }

  .ex-opts { display: flex; flex-wrap: wrap; gap: 8px; }
  .ex-opt { padding: 11px 18px; border-radius: 999px; border: 1.5px solid var(--border); background: var(--surface); font-size: 16px; font-weight: 700; }
  .ex-opt.picked { border-color: var(--primary); background: var(--primary-wash); }
  .ex-opt.ok { border-color: var(--green); background: var(--green-soft); color: var(--green-dark); }
  .ex-opt.no { border-color: #e3b4ab; background: var(--danger-soft); color: #9a3324; }
  .ex-input { width: 100%; padding: 11px 14px; border-radius: var(--r-1); border: 1.5px solid var(--border); background: var(--surface); font: inherit; font-size: 16px; }
  .ex-input:focus { outline: none; border-color: var(--primary); }
  .ex-hint { font-size: 12px; color: var(--ink-3); }
  .check { justify-self: start; padding: 10px 20px; border-radius: 999px; background: var(--primary); color: var(--primary-on); font-weight: 850; box-shadow: 0 3px 0 var(--primary-press); }
  .check:disabled { opacity: .45; box-shadow: none; }
  .verdict { font-size: 14px; font-weight: 800; padding: 8px 12px; border-radius: var(--r-1); background: var(--danger-soft); color: #9a3324; }
  .verdict.ok { background: var(--green-soft); color: var(--green-dark); }
  .ex-explain { font-size: 13px; color: var(--ink-2); line-height: 1.55; }

  .lp-nav { display: flex; align-items: center; justify-content: space-between; gap: 12px; }
  .ghost { padding: 12px 18px; border-radius: 999px; background: var(--surface-2); color: var(--ink-2); font-weight: 800; display: inline-flex; align-items: center; gap: 6px; }
  .ghost:hover { background: var(--border); }
  .ghost:disabled { opacity: .4; pointer-events: none; }

  .lp-done { background: var(--surface); border: 1px solid var(--border); border-radius: var(--r-2); padding: 30px 22px;
    box-shadow: var(--shadow-1); display: grid; justify-items: center; text-align: center; gap: 10px; }
  .seal-wrap { margin-bottom: 4px; }
  .seal { display: inline-flex; align-items: center; justify-content: center; width: 64px; height: 64px; border-radius: var(--r-2);
    background: var(--primary); color: var(--primary-on); font-family: var(--serif-ko); font-weight: 700; font-size: 32px;
    transform: rotate(-4deg); box-shadow: inset 0 0 0 2px rgba(255,248,242,.35); animation: stamp .42s var(--bounce); }
  @keyframes stamp { from { opacity: 0; transform: rotate(-4deg) scale(1.5); } to { opacity: 1; transform: rotate(-4deg) scale(1); } }
  .lp-done h2 { margin: 0; font-family: var(--serif-ko); font-weight: 600; font-size: 26px; }
  .done-goal { margin: 0; color: var(--ink-2); font-size: 14px; max-width: 34ch; }
  .done-recap { text-align: left; margin: 8px 0 0; padding-left: 18px; display: grid; gap: 6px; color: var(--ink); font-size: 14px; line-height: 1.55; }
  .cando { width: 100%; text-align: left; margin-top: 14px; padding: 14px; border-radius: var(--r-1); background: var(--green-soft); }
  .cando-cap { font-size: 11px; font-weight: 850; letter-spacing: .08em; text-transform: uppercase; color: var(--green-dark); }
  .cando ul { margin: 8px 0 0; padding: 0; list-style: none; display: grid; gap: 7px; }
  .cando li { display: grid; grid-template-columns: auto 1fr; gap: 8px; font-size: 13px; line-height: 1.5; color: var(--ink); }
  .cando li :global(i) { color: var(--green); margin-top: 2px; }
  /* writing task */
  .w-area { width: 100%; padding: 12px 13px; border-radius: var(--r-1); border: 1px solid var(--border); background: var(--surface); font: inherit; font-size: 16px; resize: vertical; }
  .w-area:focus { outline: none; border-color: var(--primary); }
  .w-model { border: 1px solid var(--border); border-radius: var(--r-1); background: var(--surface); }
  .w-model > summary { cursor: pointer; list-style: none; padding: 10px 13px; font-size: 13px; font-weight: 800; color: var(--accent-ink); }
  .w-model > summary::-webkit-details-marker { display: none; }
  .w-model-body { padding: 0 13px 13px; display: grid; gap: 3px; }
  .w-ko { font-size: 15px; font-weight: 600; }
  .w-en { font-size: 13px; color: var(--ink-2); }
  .teaser { font-size: 13px; color: var(--ink-3); }
  .done-actions { display: grid; gap: 10px; margin-top: 10px; width: 100%; max-width: 320px; }
  .ghost.go { justify-content: center; }

  @media (prefers-reduced-motion: reduce) { .lp-screen, .seal { animation: none; } }
</style>
