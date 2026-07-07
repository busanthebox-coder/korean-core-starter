<script>
  import { chapters, guideTracks, findEntry } from '../lib/data.js';
  import LessonPlayer from '../lib/components/LessonPlayer.svelte';
  import OrientationPlayer from '../lib/components/OrientationPlayer.svelte';
  import HanjaRootBrowser from '../lib/components/HanjaRootBrowser.svelte';
  import { reviews } from '../lib/srs.js';
  import { checkpointProgress, guideProgress, markOrientationDone, orientationDone, toggleGuideReady } from '../lib/stores.js';
  import { entryIdsForUnit, focusPracticePath } from '../lib/studyLinks.js';
  import { ORIENTATION_CARDS } from '../lib/onramp.js';
  import { checkpointSlots } from '../lib/checkpoints.js';
  import { push } from 'svelte-spa-router';

  let trackId = guideTracks[0]?.id;
  let unit = null;
  $: track = guideTracks.find((t) => t.id === trackId) || guideTracks[0];
  $: totalUnits = guideTracks.reduce((sum, t) => sum + (t.units || []).length, 0);
  $: checkpoints = checkpointSlots(chapters);
  $: completedCheckpoints = checkpoints.filter((slot) => $checkpointProgress[slot.trackId]).length;

  const vocabOf = (u) => [...new Set([...(u.coreVocabularyIds || []), ...(u.linkedEntryIds || [])])].map(findEntry).filter(Boolean);
  function openUnit(u) { unit = u; window.scrollTo(0, 0); }
  function back() { unit = null; window.scrollTo(0, 0); }
  function pickTrack(id) { trackId = id; }
  function openOrientationChapter(id) {
    push(`/learn?chapter=${encodeURIComponent(id)}`);
  }
  $: vocab = unit ? vocabOf(unit) : [];
  $: unitKey = unit ? unit.id || `${track.id}:${unit.title}` : '';
  $: ready = unitKey ? $guideProgress.has(unitKey) : false;

  function practiceGuide() {
    const ids = entryIdsForUnit(unit);
    reviews.addMany(ids);
    push(focusPracticePath(ids));
  }

  // Prev/next pager within the current track so learners move straight to the
  // adjacent unit instead of bouncing back to the unit list.
  $: unitList = track ? (track.units || []) : [];
  $: uIndex = unit ? unitList.indexOf(unit) : -1;
  $: nextUnit = uIndex >= 0 && uIndex < unitList.length - 1 ? unitList[uIndex + 1] : null;

  // Map a guide unit onto the shared LessonPlayer's generic `screens` shape.
  function buildGuideScreens(u, vcb) {
    const s = [];
    if ((u.beginnerGuide || []).length) s.push({ phase: 'reference', kind: 'beginner', data: u.beginnerGuide });
    if ((u.keyPhrases || []).length) s.push({ phase: 'phrases', kind: 'phrases', data: u.keyPhrases });
    if (vcb.length) s.push({ phase: 'phrases', kind: 'words', data: vcb.map((e) => ({
      ko: e.hangul || e.korean || '', romanization: e.romanization || '', en: e.english || e.meaning || '', pos: e.partOfSpeech || e.type || '',
    })).filter((w) => w.ko) });
    if ((u.dialogue || []).length) s.push({ phase: 'dialogue', kind: 'dialogue', data: { lines: u.dialogue } });
    if ((u.steps || []).length) s.push({ phase: 'steps', kind: 'steps', data: u.steps });
    const notes = [];
    if (u.costs) notes.push({ title: 'Cost', body: u.costs });
    if (u.notes) notes.push({ title: 'Good to know', body: u.notes });
    if ((u.checkpoints || []).length) notes.push({ title: 'Before you go', body: u.checkpoints.join(' · ') });
    if (notes.length) s.push({ phase: 'steps', kind: 'beginner', data: notes });
    if ((u.deepLinks || []).length) s.push({ phase: 'steps', kind: 'links', data: u.deepLinks });
    return s;
  }
  $: guideScreens = unit ? buildGuideScreens(unit, vocab) : [];
</script>

{#if !unit}
  <section class="guide">
    <div class="hero">
      <div class="eyebrow">Just arrived in Korea</div>
      <h1>Newcomer Guide</h1>
      <p>Survival Korean by real situation — phrases first, with the practical steps and official links you need.</p>
      <div class="guide-stats">
        <span>{guideTracks.length} tracks</span>
        <span>{totalUnits} situation guides</span>
        <span>{completedCheckpoints}/{checkpoints.length} checkpoints tried</span>
      </div>
    </div>
    <nav class="tracks">
      {#each guideTracks as t}
        <button class:on={t.id === track.id} on:click={() => pickTrack(t.id)}>
          {t.letter} · {t.title}<span>{(t.units || []).length}</span>
        </button>
      {/each}
    </nav>
    <p class="summary">{track.summary}</p>
    <div class="unit-list">
      {#each track.units as u}
        <button class="unit-card" on:click={() => openUnit(u)}>
          <strong>{u.title}</strong><span>{u.situation}</span>
        </button>
      {/each}
    </div>
    <HanjaRootBrowser />
  </section>
{:else if unit?.orientation}
  <OrientationPlayer
    cards={ORIENTATION_CARDS}
    done={$orientationDone}
    onBack={back}
    onComplete={() => { markOrientationDone(); back(); }}
    onOpenChapter={openOrientationChapter}
  />
{:else}
  <LessonPlayer
    screens={guideScreens}
    kicker={`${track.title} · ${unit.title}`}
    completion={{ goal: unit.goal }}
    done={ready}
    nextChapter={nextUnit}
    onBack={back}
    onComplete={() => toggleGuideReady(unitKey)}
    onPractice={practiceGuide}
    onOpenChapter={openUnit}
  />
{/if}

<style>
  .guide { max-width: 820px; margin: 0 auto; padding: 28px; display: grid; gap: 16px; }
  .hero { display: grid; gap: 4px; }
  .eyebrow { font-size: 11px; font-weight: 750; letter-spacing: .14em; text-transform: uppercase; color: var(--ink-3); }
  h1 { margin: 2px 0; font-family: var(--serif-ko); font-size: 32px; font-weight: 600; letter-spacing: -0.02em; }
  .hero p { margin: 0; color: var(--ink-3); }
  .guide-stats { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 6px; }
  .guide-stats span { padding: 5px 9px; border-radius: 999px; background: var(--surface-2); border: 1px solid var(--border);
    color: var(--ink-2); font-size: 12px; font-weight: 800; }
  .tracks { display: flex; flex-wrap: wrap; gap: 8px; }
  .tracks button { display: inline-flex; align-items: center; gap: 7px; padding: 8px 14px; border-radius: 999px; background: var(--surface-2); color: var(--ink-2); font-weight: 800; font-size: 13px; }
  .tracks button.on { background: var(--primary); color: var(--primary-on); }
  .tracks button span { min-width: 22px; height: 22px; display: grid; place-items: center; border-radius: 999px; background: #fff; color: var(--ink-2); font-size: 11px; }
  .tracks button.on span { color: var(--accent-ink); }
  .summary { margin: 0; color: var(--ink-2); }
  .unit-list { display: grid; gap: 10px; }
  .unit-card { display: grid; gap: 2px; text-align: left; padding: 15px 16px; border-radius: var(--radius); background: var(--surface);
    border: 1px solid var(--border); box-shadow: var(--shadow-1); transition: transform .1s var(--bounce), border-color .1s; }
  .unit-card:hover { transform: translateY(-2px); border-color: var(--green); }
  .unit-card strong { font-size: 16px; }
  .unit-card span { color: var(--ink-2); font-size: 13px; }
</style>
