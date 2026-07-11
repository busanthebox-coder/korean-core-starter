<script>
  import { onMount } from 'svelte';
  import { push } from 'svelte-spa-router';
  import { chapters, entriesVersion, findEntry, findGrammar, findReader, readers } from '../lib/data.js';
  import { ensureSection } from '../lib/dataLoader.js';
  import {
    lessonProgress,
    markOrientationDone,
    onboarded,
    orientationDone,
    packProgress,
    readerProgress,
    recordReaderResult,
    resetLessonProgress,
    romanizationVisible,
    toggleLessonDone,
    togglePackDone,
    toggleRomanization,
    markRomanNudgeSeen
  } from '../lib/stores.js';
  import { shouldShowOnboarding } from '../lib/placement.js';
  import { reviews } from '../lib/srs.js';
  import { study } from '../lib/progress.js';
  import { recordActivity } from '../lib/streak.js';
  import { focusPracticePath, chapterItemIds, packItemIds } from '../lib/studyLinks.js';
  import { ORIENTATION_CARDS } from '../lib/onramp.js';
  import LearnPathView from '../lib/components/LearnPathView.svelte';
  import HangulTrainer from '../lib/components/HangulTrainer.svelte';
  import GrammarReference from '../lib/components/GrammarReference.svelte';
  import LessonPlayer from '../lib/components/LessonPlayer.svelte';
  import CheckpointSession from '../lib/components/CheckpointSession.svelte';
  import OrientationPlayer from '../lib/components/OrientationPlayer.svelte';
  import ReadingRoom from '../lib/components/ReadingRoom.svelte';
  import Onboarding from '../lib/components/Onboarding.svelte';

  export let params = {};

  let view = 'path';
  let chapter = null;
  let pack = null;
  let checkpoint = null;
  let reader = null;
  let requestedReaderId = '';
  let packLessonScreens = [];
  let packCompletion = null;
  let loadingLessonData = false;
  let forcePlacement = false;
  let todayStage = '';

  const vocabOf = (item) =>
    [...new Set([...(item.coreVocabularyIds || []), ...(item.linkedEntryIds || [])])]
      .map(findEntry)
      .filter((entry) => entry && entry.type !== 'pattern');
  const grammarOf = (item) => (item.grammarFocus || []).map(findGrammar).filter(Boolean);

  function show(nextView) {
    view = nextView;
    window.scrollTo(0, 0);
  }
  function clearSelection() {
    chapter = null;
    pack = null;
    checkpoint = null;
    reader = null;
    requestedReaderId = '';
  }
  async function openChapter(nextChapter) {
    loadingLessonData = true;
    await ensureSection('words');
    clearSelection();
    chapter = nextChapter;
    loadingLessonData = false;
    show('chapter');
  }
  async function openPack(nextPack) {
    loadingLessonData = true;
    await Promise.all([ensureSection('words'), ensureSection('expressions')]);
    clearSelection();
    pack = nextPack;
    loadingLessonData = false;
    show('pack');
  }
  function openCheckpoint(nextCheckpoint) { clearSelection(); checkpoint = nextCheckpoint; show('checkpoint'); }
  function openReader(nextReader) { clearSelection(); reader = nextReader; requestedReaderId = nextReader?.id || ''; show('reader'); }
  function openOrientation() { clearSelection(); show('orientation'); }
  function openHangul() { clearSelection(); show('hangul'); }
  function openGrammar() { clearSelection(); show('grammar'); }
  function back() { clearSelection(); show('path'); }
  function openOrientationChapter(id) {
    const target = chapters.find((item) => item.id === id);
    if (target) openChapter(target);
  }
  function syncFromUrl() {
    const [hashPath, rawQuery = ''] = window.location.hash.split('?');
    const query = rawQuery.split('#')[0];
    const search = new URLSearchParams(query);
    todayStage = search.get('today') || '';
    if (search.get('placement') === '1') {
      clearSelection();
      forcePlacement = true;
      show('path');
      return;
    }
    forcePlacement = false;
    const requestedReader = search.get('reader');
    if (requestedReader) {
      clearSelection();
      requestedReaderId = requestedReader;
      reader = findReader(requestedReader);
      show('reader');
      return;
    }
    const requested = params.chapter || search.get('chapter');
    const target = chapters.find((item) => item.id === requested);
    if (target) openChapter(target);
    else if (hashPath === '#/learn') back();
  }
  function closeOnboarding() {
    forcePlacement = false;
    const [, rawQuery = ''] = window.location.hash.split('?');
    if (new URLSearchParams(rawQuery.split('#')[0]).get('placement') === '1') push('/learn');
  }
  function startOnboardingChapter(item) {
    forcePlacement = false;
    if (item) push(`/learn?chapter=${encodeURIComponent(item.id)}`);
  }
  function resetCompleted() {
    if (confirm('Reset completed chapters?')) resetLessonProgress();
  }
  function practiceChapter(item) { push(`/practice?deck=${encodeURIComponent(item.id)}`); }
  function practicePack(item) { push(focusPracticePath(packItemIds(item))); }
  function completeChapter(item) {
    if (!$lessonProgress.has(item.id)) recordActivity();
    if (!$lessonProgress.has(item.id)) toggleLessonDone(item.id);
  }
  function advanceTodayChapter() {
    completeChapter(chapter);
    push(`/learn?chapter=${encodeURIComponent(chapter.id)}&today=sayit`);
  }
  function finishToday() {
    completeChapter(chapter);
    push('/learn');
  }
  function completePack(item) {
    if (!$packProgress.has(item.id)) {
      recordActivity();
      reviews.addMany(packItemIds(item));
    }
    togglePackDone(item.id);
  }
  function completeReader(result) {
    recordReaderResult(result.id, result);
    study.log(1);
  }
  function dismissRomanNudge(turnOff = false) {
    if (turnOff && $romanizationVisible) toggleRomanization();
    markRomanNudgeSeen();
  }

  onMount(() => {
    syncFromUrl();
    window.addEventListener('hashchange', syncFromUrl);
    return () => window.removeEventListener('hashchange', syncFromUrl);
  });

  $: dataTick = $entriesVersion;
  $: vocab = (dataTick, chapter ? vocabOf(chapter) : []);
  $: gram = chapter ? grammarOf(chapter) : [];
  $: chIndex = chapter ? chapters.findIndex((item) => item.id === chapter.id) : -1;
  $: nextCh = chIndex >= 0 && chIndex < chapters.length - 1 ? chapters[chIndex + 1] : null;
  $: showOnboarding = view === 'path' && shouldShowOnboarding({
    onboarded: $onboarded,
    completedIds: $lessonProgress,
    force: forcePlacement,
  });

  const entryForPackItem = (item) => findEntry(item.entryId);
  function packWords(item) {
    return (item.items || [])
      .map((packItem) => {
        const entry = entryForPackItem(packItem);
        if (!entry) return null;
        return {
          id: entry.id,
          type: entry.type,
          ko: entry.hangul,
          romanization: entry.romanization,
          en: entry.english,
          pos: entry.partOfSpeech,
          ex: entry.examples?.[0] || null,
          note: packItem.note || ''
        };
      })
      .filter(Boolean);
  }
  function buildPackScreens(item) {
    const words = packWords(item);
    const phraseLike = words.length > 0 && words.every((word) => word.type === 'expression');
    const screens = [];
    for (let index = 0; index < words.length; index += 6) {
      screens.push({ phase: phraseLike ? 'phrases' : 'words', kind: phraseLike ? 'phrases' : 'words', data: words.slice(index, index + 6) });
    }
    screens.push({
      phase: 'practice',
      kind: 'match',
      data: {
        hint: `Match ${Math.min(6, words.length)} ${item.shortTitle || item.title} words before marking the pack complete.`,
        pairs: words.slice(0, 6).map((word) => ({ id: word.id, ko: word.ko, en: word.en })),
        onDone: (result) => {
          if (result?.total) study.log(result.total);
          reviews.addMany(packItemIds(item));
        }
      }
    });
    return screens;
  }

  $: packLessonScreens = (dataTick, pack ? buildPackScreens(pack) : []);
  $: packCompletion = pack ? {
    goal: pack.goal,
    bullets: [
      `${pack.items.length} beginner words connected to the course path.`,
      'Review cards were added so these words can come back later.',
      pack.context
    ],
    teaser: 'Use these words inside the next chapters instead of memorizing them as a separate list.'
  } : null;
</script>

{#if showOnboarding}
  <Onboarding {chapters} startWithPlacement={forcePlacement} onClose={closeOnboarding} onStartChapter={startOnboardingChapter} />
{/if}

{#if view === 'path'}
  <LearnPathView
    onOpenChapter={openChapter}
    onOpenPack={openPack}
    onOpenOrientation={openOrientation}
    onOpenHangul={openHangul}
    onOpenGrammar={openGrammar}
    onOpenCheckpoint={openCheckpoint}
    onOpenReader={openReader}
    onDismissRomanNudge={dismissRomanNudge}
  />
{:else if view === 'hangul'}
  <section class="learn">
    <button class="back" on:click={back}>← Lessons</button>
    <h1 class="sub-h1">Hangul — the Korean alphabet</h1>
    <HangulTrainer />
  </section>
{:else if view === 'grammar'}
  <section class="learn">
    <button class="back" on:click={back}>← Lessons</button>
    <h1 class="sub-h1">Grammar roadmap</h1>
    <GrammarReference />
  </section>
{:else if view === 'orientation'}
  <OrientationPlayer
    cards={ORIENTATION_CARDS}
    done={$orientationDone}
    onBack={back}
    onComplete={() => { markOrientationDone(); back(); }}
    onOpenChapter={openOrientationChapter}
  />
{:else if loadingLessonData}
  <section class="learn"><p class="loading">Loading lesson data...</p></section>
{:else if view === 'chapter' && chapter}
  <LessonPlayer
    {chapter}
    {vocab}
    grammarFocus={gram}
    done={$lessonProgress.has(chapter.id)}
    nextChapter={nextCh}
    allChapters={chapters}
    onBack={back}
    onComplete={() => completeChapter(chapter)}
    startAtKind={todayStage === 'sayit' ? 'sayit' : ''}
    journeyActionLabel={todayStage === 'lesson' ? 'Continue to Say-it' : (todayStage === 'sayit' ? 'Complete today' : '')}
    onJourneyAction={todayStage === 'lesson' ? advanceTodayChapter : (todayStage === 'sayit' ? finishToday : null)}
    onPractice={() => practiceChapter(chapter)}
    onOpenChapter={openChapter}
  />
{:else if view === 'pack' && pack}
  <LessonPlayer
    screens={packLessonScreens}
    kicker={`Vocab Pack · ${pack.title}`}
    completion={packCompletion}
    done={$packProgress.has(pack.id)}
    onBack={back}
    onComplete={() => completePack(pack)}
    onPractice={() => practicePack(pack)}
  />
{:else if view === 'checkpoint' && checkpoint}
  <CheckpointSession
    slot={checkpoint}
    {chapters}
    onBack={back}
    onOpenChapter={openChapter}
  />
{:else if view === 'reader'}
  <section class="learn">
    <ReadingRoom
      {readers}
      {reader}
      readerId={requestedReaderId}
      progress={$readerProgress}
      onBack={back}
      onOpenReader={openReader}
      onComplete={completeReader}
    />
  </section>
{/if}

<style>
  .learn { max-width: 1120px; margin: 0 auto; padding: 28px; display: grid; gap: 14px; }
  .back { align-self: start; padding: 7px 14px; border-radius: 999px; background: var(--surface-2); color: var(--ink-2); font-weight: 800; }
  .back:hover { background: var(--border); }
  .sub-h1 { font-family: var(--serif-ko); font-size: 30px; font-weight: 600; }
  .loading { margin: 0; color: var(--ink-3); font-size: 12px; font-weight: 850; letter-spacing: .1em; text-transform: uppercase; }
</style>
