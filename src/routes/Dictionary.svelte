<script>
  import { entries, levels, chapters } from '../lib/data.js';
  import { filters } from '../lib/stores.js';
  import { filterEntries, facetValues } from '../lib/search.js';
  import EntryCard from '../lib/components/EntryCard.svelte';
  import EntryDetail from '../lib/components/EntryDetail.svelte';
  import EntryLearningHub from '../lib/components/EntryLearningHub.svelte';
  import Sheet from '../lib/components/Sheet.svelte';
  import { reviews } from '../lib/srs.js';
  import { chapterForEntry, focusPracticePath, learnChapterPath } from '../lib/studyLinks.js';
  import { push } from 'svelte-spa-router';

  const TYPES = [['word', 'Words'], ['expression', 'Expressions'], ['pattern', 'Patterns']];
  const LEVELS = levels;
  const POS = facetValues(entries, (e) => e.partOfSpeech).map((f) => f.value);
  const TOPICS = facetValues(entries, (e) => e.topic).slice(0, 10).map((f) => f.value);

  let selected = null;

  $: results = filterEntries(entries, $filters);
  $: selectedChapter = selected ? chapterForEntry(chapters, selected.id) : null;

  function toggle(facet, value) {
    filters.update((f) => {
      const set = new Set(f[facet]);
      set.has(value) ? set.delete(value) : set.add(value);
      return { ...f, [facet]: set };
    });
  }
  const isOn = (f, facet, value) => f[facet] && f[facet].has(value);
</script>

<section class="dict">
  <header class="masthead">
    <span class="eyebrow">Reference · 사전</span>
    <h1>Dictionary</h1>
    <p class="sub">Search and filter all {entries.length} words, expressions and patterns.</p>
  </header>

  <input class="search" type="search" placeholder="Search Korean or English" bind:value={$filters.search} />

  <div class="facets">
    <div class="facet-row">{#each TYPES as [v, label]}<button class="chip t-{v}" class:on={isOn($filters, 'type', v)} on:click={() => toggle('type', v)}>{label}</button>{/each}</div>
    <div class="facet-row">{#each LEVELS as v}<button class="chip" class:on={isOn($filters, 'level', v)} on:click={() => toggle('level', v)}>{v}</button>{/each}</div>
    <div class="facet-row">{#each POS as v}<button class="chip" class:on={isOn($filters, 'pos', v)} on:click={() => toggle('pos', v)}>{v}</button>{/each}</div>
    <div class="facet-row">{#each TOPICS as v}<button class="chip soft" class:on={isOn($filters, 'topic', v)} on:click={() => toggle('topic', v)}>{v}</button>{/each}</div>
  </div>

  <p class="count">{results.length} result{results.length === 1 ? '' : 's'}</p>

  {#if results.length}
    <div class="grid">
      {#each results as e (e.id)}<EntryCard entry={e} onOpen={(x) => (selected = x)} />{/each}
    </div>
  {:else}
    <p class="empty">No matches. Try a different word or clear filters.</p>
  {/if}
</section>

<Sheet open={!!selected} onClose={() => (selected = null)}>
  {#if selected}
    <EntryLearningHub
      entry={selected}
      chapter={selectedChapter}
      inDeck={!!$reviews[selected.id]}
      onAddReview={() => reviews.add(selected.id)}
      onPractice={() => push(focusPracticePath([selected.id]))}
      onOpenChapter={() => push(learnChapterPath(selectedChapter?.id))}
    />
    <EntryDetail entry={selected} />
  {/if}
</Sheet>

<style>
  .dict { max-width: 1120px; margin: 0 auto; padding: 32px 28px; }
  .masthead { border-bottom: 1px solid var(--rule); padding-bottom: 18px; margin-bottom: 18px; }
  .eyebrow { display: block; font-size: 11px; font-weight: 750; letter-spacing: .16em; text-transform: uppercase; color: var(--ink-3); margin-bottom: 9px; }
  h1 { margin: 0 0 5px; font-size: 42px; font-weight: 850; letter-spacing: -0.03em; line-height: 1.02; }
  .sub { margin: 0; color: var(--ink-3); }
  .search { width: 100%; padding: 13px 16px; border: 1px solid var(--border); border-radius: 9px;
    background: var(--surface); font-size: 15px; }
  .search:focus { outline: none; border-color: var(--ink); }
  .facets { display: grid; gap: 8px; margin: 14px 0 6px; }
  .facet-row { display: flex; flex-wrap: wrap; gap: 6px; }
  .chip { font-size: 12px; font-weight: 700; letter-spacing: .02em; padding: 6px 13px; border-radius: 999px;
    background: transparent; color: var(--ink-2); border: 1px solid var(--border); transition: border-color .12s; }
  .chip:hover { border-color: var(--ink-3); }
  .chip.on { background: var(--ink); color: #fff; border-color: var(--ink); }
  .chip.soft.on { background: var(--ink); color: #fff; border-color: var(--ink); }
  .chip.t-word.on { background: var(--type-word); border-color: var(--type-word); }
  .chip.t-expression.on { background: var(--type-expression); border-color: var(--type-expression); }
  .chip.t-pattern.on { background: var(--type-pattern); border-color: var(--type-pattern); }
  .count { color: var(--ink-3); font-size: 11px; font-weight: 700; letter-spacing: .1em; text-transform: uppercase; margin: 10px 0 16px; }
  .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); column-gap: 30px; row-gap: 0;
    border-bottom: 1px solid var(--border); }
  .empty { color: var(--ink-3); padding: 30px 0; text-align: center; }
</style>
