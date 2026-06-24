<script>
  import { guideTracks, findEntry } from '../lib/data.js';
  import AudioButton from '../lib/components/AudioButton.svelte';
  import RomanizationLine from '../lib/components/RomanizationLine.svelte';
  import EntryCard from '../lib/components/EntryCard.svelte';
  import EntryDetail from '../lib/components/EntryDetail.svelte';
  import GuideActionPanel from '../lib/components/GuideActionPanel.svelte';
  import Sheet from '../lib/components/Sheet.svelte';
  import LessonPlayer from '../lib/components/LessonPlayer.svelte';
  import { reviews } from '../lib/srs.js';
  import { guideProgress, toggleGuideReady } from '../lib/stores.js';
  import { entryIdsForUnit, focusPracticePath } from '../lib/studyLinks.js';
  import { push } from 'svelte-spa-router';

  let trackId = guideTracks[0]?.id;
  let unit = null;
  let selected = null;
  $: track = guideTracks.find((t) => t.id === trackId) || guideTracks[0];
  $: totalUnits = guideTracks.reduce((sum, t) => sum + (t.units || []).length, 0);

  const vocabOf = (u) => [...new Set([...(u.coreVocabularyIds || []), ...(u.linkedEntryIds || [])])].map(findEntry).filter(Boolean);
  function openUnit(u) { unit = u; window.scrollTo(0, 0); }
  function back() { unit = null; window.scrollTo(0, 0); }
  function pickTrack(id) { trackId = id; }
  $: vocab = unit ? vocabOf(unit) : [];
  $: unitKey = unit ? unit.id || `${track.id}:${unit.title}` : '';
  $: ready = unitKey ? $guideProgress.has(unitKey) : false;

  function addGuideVocab() {
    reviews.addMany(vocab.map((e) => e.id));
  }
  function practiceGuide() {
    const ids = entryIdsForUnit(unit);
    reviews.addMany(ids);
    push(focusPracticePath(ids));
  }

  // Prev/next pager within the current track so learners move straight to the
  // adjacent unit instead of bouncing back to the unit list.
  $: unitList = track ? (track.units || []) : [];
  $: uIndex = unit ? unitList.indexOf(unit) : -1;
  $: prevUnit = uIndex > 0 ? unitList[uIndex - 1] : null;
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
  </section>
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

<Sheet open={!!selected} onClose={() => (selected = null)}>
  {#if selected}<EntryDetail entry={selected} />{/if}
</Sheet>

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
  .kp { display: grid; grid-template-columns: auto 1fr; gap: 12px; align-items: start; }
  .kp-n { width: 26px; height: 26px; flex: none; display: grid; place-items: center; border-radius: 999px;
    background: var(--green-soft); color: var(--green-dark); font-weight: 850; font-size: 13px; margin-top: 3px; }
  .unit-card span { color: var(--ink-2); font-size: 13px; }
  .back { justify-self: start; padding: 7px 14px; border-radius: 999px; background: var(--surface-2); color: var(--ink-2); font-weight: 800; }
  .u-head h1 { margin: 0; }
  .u-head .sit { margin: 2px 0 0; color: var(--ink-3); font-size: 14px; }
  .u-head .goal { margin: 4px 0 0; font-weight: 600; }
  .bg { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 10px; }
  .bg-card { padding: 14px; border-radius: 13px; background: var(--surface-2); border: 1px solid var(--border); }
  .bg-card strong { display: block; margin-bottom: 4px; }
  .bg-card p { margin: 0; color: var(--ink-2); line-height: 1.5; font-size: 14px; }
  .block { display: grid; gap: 10px; }
  .sec-head { display: flex; align-items: center; gap: 8px; font-size: 13px; font-weight: 850; }
  .dot { width: 14px; height: 4px; border-radius: 2px; background: var(--ink); box-shadow: none; }
  .lines { display: grid; gap: 10px; }
  .lbody { display: grid; gap: 2px; padding: 12px 14px; border-radius: 13px; background: var(--surface); border: 1px solid var(--border); border-left: 4px solid var(--green); }
  .dline { display: grid; grid-template-columns: auto 1fr; gap: 10px; align-items: start; }
  .spk { font-size: 11px; font-weight: 800; padding: 4px 10px; border-radius: 999px; background: var(--green-soft); color: var(--green-dark); white-space: nowrap; }
  .lko { font-size: 18px; font-weight: 730; display: flex; align-items: center; gap: 7px; }
  .len { color: var(--ink-2); }
  .note { color: var(--ink-3); font-size: 13px; }
  .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(170px, 1fr)); gap: 12px; }
  .steps { margin: 0; padding-left: 20px; display: grid; gap: 6px; color: var(--ink); }
  .kv { display: grid; gap: 2px; padding: 12px 14px; border-radius: 12px; background: var(--surface-2); }
  .kv.good { background: var(--surface-2); border: 1px solid var(--border); }
  .kv strong { font-size: 12px; text-transform: uppercase; letter-spacing: .05em; color: var(--ink-3); }
  .checks { padding: 14px 16px; border-radius: 13px; background: var(--surface); border: 1px solid var(--border); }
  .checks ul { margin: 6px 0 0; padding-left: 18px; display: grid; gap: 4px; }
  .links { display: grid; gap: 8px; }
  .link { display: inline-block; padding: 11px 14px; border-radius: 12px; background: var(--accent-soft); color: var(--accent-ink); font-weight: 800; }
  .link em { font-style: normal; font-weight: 600; color: var(--ink-2); }

  .pager { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-top: 6px; padding-top: 18px; border-top: 1px solid var(--border); }
  .pg { display: grid; gap: 3px; text-align: left; padding: 14px 16px; border-radius: var(--radius); background: var(--surface);
    border: 1px solid var(--border); box-shadow: var(--shadow-1); transition: transform .1s var(--bounce), border-color .1s; }
  .pg:hover { transform: translateY(-2px); border-color: var(--green); }
  .pg.next { text-align: right; }
  .pg-dir { font-size: 11px; font-weight: 800; letter-spacing: .1em; text-transform: uppercase; color: var(--green-dark); }
  .pg-title { font-size: 15px; font-weight: 700; color: var(--ink); }
  @media (max-width: 520px) { .pager { grid-template-columns: 1fr; } .pg-spacer { display: none; } }
</style>
