<script>
  import LessonComplete from './lessonPlayer/LessonComplete.svelte';
  import LessonScreen from './lessonPlayer/LessonScreen.svelte';
  import { chapters, entries, findEntry } from '../data.js';
  import { entryIdsUpToChapter } from '../studiedScope.js';
  import { withSessionBreak } from '../lessonSessions.js';
  import { withoutTyping } from '../typingScreens.js';
  import { correctOf, exerciseAnswerMatches } from '../inlineExercise.js';
  import { maybeInsertSpiralReview, seededRng } from '../checkpoints.js';
  import { recordMissedItems } from '../mistakeReview.js';
  import { grammarSelfCheckItems } from '../lessonPlan.js';
  import { study } from '../progress.js';
  import { recordActivity } from '../streak.js';
  import { recordSpokenChapter } from '../stores.js';
  import { buildSayItItems } from '../sayIt.js';
  import { saveWriting, writingsByChapter } from '../writings.js';
  import { canUseKoreanSpeech } from '../audio.js';
  import { buildChapterListeningItems } from '../listening.js';
  import { clearLessonPosition, readLessonPosition, writeLessonPosition } from '../lessonPosition.js';
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
  export let startAtKind = '';
  export let journeyActionLabel = '';
  export let onJourneyAction = null;

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

  const MIN_CONJUGATION_POOL = 12;

  // This chapter's own verbs first, then everything taught before it. Widening to the
  // whole CEFR level (the old rule) reached 401 words, most of them from chapters the
  // learner has not opened yet — the drill is meant to test what they have met.
  function chapterConjugationPool(ch, forms) {
    const drillable = (entry) => entry?.type === 'word' && entry.forms && forms.some((form) => entry.forms?.[form]);
    const ids = new Set([...(ch.coreVocabularyIds || []), ...(ch.linkedEntryIds || [])]);
    const localWords = [...ids].map(findEntry).filter(drillable);
    const taughtWords = entryIdsUpToChapter(chapters, ch.id).map(findEntry).filter(drillable);
    const pool = uniqueEntries([...localWords, ...taughtWords]);
    if (pool.length >= MIN_CONJUGATION_POOL) return pool;
    // Early chapters have barely any conjugable verbs yet; fall back to same-level
    // words so the drill still has something to ask.
    const levelWords = entries.filter((entry) => drillable(entry) && (!ch.level || entry.level === ch.level));
    return uniqueEntries([...pool, ...levelWords]);
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

  function listeningScreen(ch) {
    if (!canUseKoreanSpeech()) return null;
    // Chapter 1 teaches the alphabet itself — dictating full sentences before the
    // learner can read or type Hangul is a wall, not practice.
    if (ch.id === 'chapter-01') return null;
    const items = buildChapterListeningItems(ch, { count: 4 });
    return items.length ? { phase: 'practice', kind: 'listening', data: { items } } : null;
  }

  function buildChapterScreens(ch) {
    const s = [];
    const words = wordsScreenData(ch);
    // Four words per screen — one at a time meant a tap for every single word.
    const PER = 4;
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
    const listening = listeningScreen(ch);
    if (listening) withReview.push(listening);
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
    const sayItItems = buildSayItItems(ch);
    if (sayItItems.length) {
      withReview.push({
        phase: 'speak',
        kind: 'sayit',
        data: { chapterId: ch.id, items: sayItItems },
      });
    }
    // Typing is set aside for now — filter the free-text screens out of every
    // chapter before the session break is placed, so the break lands on what's left.
    return withSessionBreak(withoutTyping(withReview));
  }

  const PHASE = {
    words: { label: 'Words', ko: '단어', icon: 'volume', tone: 'words' },
    grammar: { label: 'Grammar', ko: '문법', icon: 'bulb', tone: 'grammar' },
    dialogue: { label: 'Talk', ko: '대화', icon: 'messages', tone: 'dialogue' },
    practice: { label: 'Practice', ko: '연습', icon: 'pencil', tone: 'practice' },
    speak: { label: 'Speak', ko: '말하기', icon: 'microphone-2', tone: 'practice' },
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
  let sayItChecks = {};

  function initialScreenIndex() {
    if (startAtKind) {
      const requestedIndex = screenList.findIndex((screen) => screen.kind === startAtKind);
      return requestedIndex >= 0 ? requestedIndex : 0;
    }
    return chapter?.id ? readLessonPosition(chapter.id, screenList.length) : 0;
  }

  function persistScreenIndex() {
    if (chapter?.id && !startAtKind) writeLessonPosition(chapter.id, i, screenList.length);
  }

  function clearSavedScreenIndex() {
    if (chapter?.id && !startAtKind) clearLessonPosition(chapter.id);
  }


  // Leaving from the break must resume PAST it — coming back to "good place to stop"
  // as your first screen would be telling the learner to quit before they began.
  function stopForToday() {
    if (chapter?.id && !startAtKind) writeLessonPosition(chapter.id, i + 1, screenList.length);
    onBack();
  }
  $: screenList = screens || (chapter ? buildChapterScreens(chapter) : []);
  $: resetKey = `${(chapter && chapter.id) || kicker || (screens && screens.length)}:${startAtKind}`;
  $: if (resetKey) { void resetKey; i = initialScreenIndex(); finished = false; answers = {}; revealed = {}; writingChecks = {}; sayItChecks = {}; }
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
  $: currentSayItCheckedIds = (sayItChecks, sayItState(i));
  $: writingLocked = (writingChecks, cur?.kind === 'writing' && !writingPassed(cur, i));
  $: nextLocked = (['match', 'conjugation', 'listening'].includes(cur?.kind) && !revealed[i]) || writingLocked;
  $: lockLabel = cur?.kind === 'writing'
    ? 'Check or skip first'
    : (cur?.kind === 'match' ? 'Match all first' : 'Finish drill first');
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
    if (i < screenList.length - 1) { i += 1; persistScreenIndex(); scrollTop(); }
    else { clearSavedScreenIndex(); finished = true; scrollTop(); }
  }
  // Drills nudge you to finish, but never trap you: skipping just moves on
  // without marking the drill complete (no lock — same principle as writing's skip).
  function skipDrill() {
    revealed = { ...revealed, [i]: true };
    next();
  }
  function prev() {
    if (finished) { finished = false; persistScreenIndex(); scrollTop(); return; }
    if (i > 0) { i -= 1; persistScreenIndex(); scrollTop(); }
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
  function sayItState(index = i) {
    return sayItChecks[index] || [];
  }
  function setSayItCheck(id, checked) {
    const checkedIds = new Set(sayItState());
    if (checked) checkedIds.add(id);
    else checkedIds.delete(id);
    const nextIds = [...checkedIds];
    sayItChecks = { ...sayItChecks, [i]: nextIds };
    const items = cur?.data?.items || [];
    if (items.length && nextIds.length >= items.length) {
      recordSpokenChapter(cur?.data?.chapterId || chapter?.id);
      recordActivity();
    }
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
  function finishListening(result) {
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
    <span class="lp-count">{finished ? 'done' : (phaseLabel ? `${phaseLabel.label} ${posInPhase}/${curGroup.idxs.length}` : '')}</span>
  </div>

  {#if !finished && cur && (cur.phase === 'practice' || cur.phase === 'speak')}
    <!-- Drill screens: exit + progress only (P6). The chapter line is context
         for reading, noise while answering — every reference app drops it here. -->
  {:else}
    <div class="lp-eyebrow">{eyebrow}</div>
  {/if}

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
      {journeyActionLabel}
      {onJourneyAction}
    />

  {:else if cur}
    <LessonScreen
      {cur}
      onSessionStop={stopForToday}
      {phaseLabel}
      answer={answers[i]}
      isRevealed={!!revealed[i]}
      {correctOf}
      isCorrect={exCorrect}
      onPick={pick}
      onCheck={check}
      onNext={next}
      onInput={setAnswer}
      onMatchDone={finishMatch}
      onConjugationDone={finishConjugation}
      onListeningDone={finishListening}
      writingState={currentWritingState}
      onWritingCheck={setWritingCheck}
      onWritingSkip={skipWritingCheck}
      sayItCheckedIds={currentSayItCheckedIds}
      onSayItToggle={setSayItCheck}
    />
  {/if}

  {#if !finished && !(revealed[i] && cur?.kind === 'exercise')}
    <div class="lp-nav">
      <button class="ghost" type="button" disabled={i === 0} on:click={prev}><i class="ti ti-arrow-left"></i> Prev</button>
      {#if nextLocked && cur?.kind !== 'writing'}
        <button class="skip-drill" type="button" on:click={skipDrill}>Skip for now</button>
      {/if}
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
  .skip-drill { padding: 10px 14px; border-radius: 999px; background: transparent; border: 1px dashed var(--border); color: var(--ink-3); font-size: 12.5px; font-weight: 800; }
  .skip-drill:hover { border-color: var(--ink-3); color: var(--ink-2); }
  .ghost:hover { background: var(--border); }
  .ghost:disabled { opacity: .4; pointer-events: none; }
  .btn3d { display: inline-flex; align-items: center; gap: 6px; }
  /* The lock hint stacks under the label — inline it wrapped into the arrow at 375px. */
  .btn3d small { flex-basis: 100%; order: 3; font-size: 11px; font-weight: 800; opacity: .75; white-space: nowrap; }
  .btn3d:disabled { flex-wrap: wrap; justify-content: center; row-gap: 0; }
  .btn3d:disabled { opacity: .52; filter: grayscale(.15); box-shadow: none; pointer-events: none; }
</style>
