<script>
  import LessonComplete from './lessonPlayer/LessonComplete.svelte';
  import LessonScreen from './lessonPlayer/LessonScreen.svelte';
  import { entries, findEntry } from '../data.js';
  import { correctOf, exerciseAnswerMatches } from '../inlineExercise.js';
  import { maybeInsertSpiralReview, seededRng } from '../checkpoints.js';
  import { recordMissedItems } from '../mistakeReview.js';
  import { grammarSelfCheckItems } from '../lessonPlan.js';
  import { study } from '../progress.js';
  import { recordActivity } from '../streak.js';
  import { saveWriting, writingsByChapter } from '../writings.js';
  import {
    buildConjugationQuiz,
    getChapterConjugationForms,
    rngFromString,
  } from '../conjugationDrill.js';

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
  export let allChapters = [];
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

  function uniqueEntries(items) {
    const seen = new Set();
    return items.filter((entry) => {
      if (!entry || seen.has(entry.id)) return false;
      seen.add(entry.id);
      return true;
    });
  }

  function chapterConjugationPool(ch, forms) {
    const ids = new Set([...(ch.coreVocabularyIds || []), ...(ch.linkedEntryIds || [])]);
    const localWords = [...ids].map(findEntry).filter((entry) => entry?.type === 'word' && entry.forms);
    const levelWords = entries.filter((entry) =>
      entry.type === 'word'
      && entry.forms
      && (!ch.level || entry.level === ch.level)
      && forms.some((form) => entry.forms?.[form])
    );
    return uniqueEntries([...localWords, ...levelWords]);
  }

  function conjugationScreen(ch) {
    const forms = getChapterConjugationForms(ch);
    if (!forms.length) return null;
    const items = buildConjugationQuiz(chapterConjugationPool(ch, forms), {
      forms,
      count: 5,
      rng: rngFromString(`${ch.id}-conjugation`),
      irregularWeight: ch.id === 'chapter-41' ? 3 : 1.5,
    });
    if (!items.length) return null;
    return {
      phase: 'practice',
      kind: 'conjugation',
      data: { items },
    };
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
    const withReview = maybeInsertSpiralReview(s, allChapters, ch, {
      rng: seededRng(`${ch.id}-${new Date().toDateString()}`),
    });
    const conjugation = conjugationScreen(ch);
    if (conjugation) withReview.push(conjugation);
    const writing = (ch.writingTask && ch.writingTask.prompt)
      ? ch.writingTask
      : (ch.exitTask && ch.exitTask.prompt
        ? { prompt: ch.exitTask.prompt, hint: '', model: (ch.exitTask.sampleAnswer || {}).ko, modelEn: (ch.exitTask.sampleAnswer || {}).en }
        : null);
    if (writing) {
      withReview.push({
        phase: 'practice',
        kind: 'writing',
        data: { ...writing, checkItems: grammarSelfCheckItems(ch.grammarNotes || []) },
      });
    }
    return withReview;
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
  let writingChecks = {};

  $: resetKey = (chapter && chapter.id) || kicker || (screens && screens.length);
  $: if (resetKey) { void resetKey; i = 0; finished = false; answers = {}; revealed = {}; writingChecks = {}; }

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
  $: currentWritingState = (writingChecks, writingState(i));
  $: writingLocked = (writingChecks, cur?.kind === 'writing' && !writingPassed(cur, i));
  $: nextLocked = (['match', 'conjugation'].includes(cur?.kind) && !revealed[i]) || writingLocked;
  $: lockLabel = cur?.kind === 'writing' ? 'Check or skip first' : (cur?.kind === 'conjugation' ? 'Finish drill first' : 'Match all first');
  $: nextActionLabel = i === screenList.length - 1 ? 'Finish' : '다음 · Next';

  $: eyebrow = kicker || (chapter ? `Chapter ${chapter.number} · ${chapter.title}` : '');
  $: doneGoal = (completion && completion.goal) || (chapter && chapter.goal) || '';
  $: doneBullets = (completion && completion.bullets) || (chapter && chapter.summaryCard && chapter.summaryCard.bullets) || [];
  $: doneTeaser = (completion && completion.teaser) || (chapter && chapter.summaryCard && chapter.summaryCard.nextChapterTeaser) || '';
  $: chapterWritingEntries = chapter?.id ? ($writingsByChapter[chapter.id] || []) : [];
  // Can-do checklist: prefer hand-authored chapter.canDo, else reuse the chapter's
  // exitTask "I can…" checklist items (every chapter has one) so all lessons close on a self-check.
  $: canDoList = (chapter && chapter.canDo && chapter.canDo.length)
    ? chapter.canDo
    : ((chapter && chapter.exitTask && chapter.exitTask.checklist) || []).filter((x) => /^I can\b/i.test(x));

  function next() {
    persistCurrentWriting();
    if (i < screenList.length - 1) { i += 1; scrollTop(); }
    else { finished = true; scrollTop(); }
  }
  function prev() {
    if (finished) { finished = false; scrollTop(); return; }
    if (i > 0) { i -= 1; scrollTop(); }
  }
  function scrollTop() { document.querySelector('.lp')?.scrollIntoView?.({ block: 'start' }); }

  function pick(opt) { if (revealed[i]) return; answers = { ...answers, [i]: opt }; }
  function check() { if (answers[i] == null || answers[i] === '') return; revealed = { ...revealed, [i]: true }; }
  function setAnswer(value) { answers = { ...answers, [i]: value }; }
  function writingState(index = i) {
    return writingChecks[index] || { checkedIds: [], skipped: false };
  }
  function writingItemIds(screen = cur) {
    return (screen?.data?.checkItems || []).map((item) => item.id);
  }
  function writingPassed(screen = cur, index = i) {
    const ids = writingItemIds(screen);
    if (!ids.length) return true;
    const state = writingState(index);
    return state.skipped || ids.every((id) => state.checkedIds.includes(id));
  }
  function setWritingCheck(id, checked) {
    const state = writingState();
    const checkedIds = new Set(state.checkedIds);
    if (checked) checkedIds.add(id);
    else checkedIds.delete(id);
    writingChecks = {
      ...writingChecks,
      [i]: { checkedIds: [...checkedIds], skipped: false },
    };
  }
  function skipWritingCheck() {
    const state = writingState();
    writingChecks = {
      ...writingChecks,
      [i]: { ...state, skipped: true },
    };
  }
  function persistCurrentWriting() {
    if (cur?.kind !== 'writing') return;
    const ids = writingItemIds(cur);
    const state = writingState();
    const checked = ids.length ? (!state.skipped && ids.every((id) => state.checkedIds.includes(id))) : true;
    if (saveWriting(chapter?.id, answers[i] || '', checked)) recordActivity();
  }
  function finishMatch(result) {
    revealed = { ...revealed, [i]: true };
    if (cur?.data?.onDone) cur.data.onDone(result);
  }
  function finishConjugation(result) {
    revealed = { ...revealed, [i]: true };
    if (result?.total) study.log(result.total);
    if (result?.wrongIds?.length) recordMissedItems(result.wrongIds);
    if (cur?.data?.onDone) cur.data.onDone(result);
  }
  function exCorrect() {
    return exerciseAnswerMatches(cur.data, answers[i]);
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
    <LessonComplete
      {doneGoal}
      {doneBullets}
      {canDoList}
      {doneTeaser}
      {done}
      {nextChapter}
      writingEntries={chapterWritingEntries}
      {onPractice}
      {onComplete}
      {onOpenChapter}
    />

  {:else if cur}
    <LessonScreen
      {cur}
      {phaseLabel}
      answer={answers[i]}
      isRevealed={!!revealed[i]}
      {correctOf}
      isCorrect={exCorrect}
      onPick={pick}
      onCheck={check}
      onInput={setAnswer}
      onMatchDone={finishMatch}
      onConjugationDone={finishConjugation}
      writingState={currentWritingState}
      onWritingCheck={setWritingCheck}
      onWritingSkip={skipWritingCheck}
    />
  {/if}

  {#if !finished}
    <div class="lp-nav">
      <button class="ghost" type="button" disabled={i === 0} on:click={prev}><i class="ti ti-arrow-left"></i> Prev</button>
      <button class="btn3d" type="button" disabled={nextLocked} on:click={next}>
        <span>{nextActionLabel}</span>
        {#if nextLocked}<small>{lockLabel}</small>{/if}
        <i class="ti ti-arrow-right"></i>
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

  .lp-nav { display: flex; align-items: center; justify-content: space-between; gap: 12px; }
  .ghost { padding: 12px 18px; border-radius: 999px; background: var(--surface-2); color: var(--ink-2); font-weight: 800; display: inline-flex; align-items: center; gap: 6px; }
  .ghost:hover { background: var(--border); }
  .ghost:disabled { opacity: .4; pointer-events: none; }
  .btn3d { display: inline-flex; align-items: center; gap: 6px; }
  .btn3d small { font-size: 11px; font-weight: 800; opacity: .75; }
  .btn3d:disabled { opacity: .52; filter: grayscale(.15); box-shadow: none; pointer-events: none; }
</style>
