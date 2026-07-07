<script>
  import { entries, findEntry } from '../data.js';
  import { buildGlossIndex } from '../gloss.js';
  import EntryDetail from './EntryDetail.svelte';
  import ReaderArticle from './reading-room/ReaderArticle.svelte';
  import ReaderHeader from './reading-room/ReaderHeader.svelte';
  import ReaderList from './reading-room/ReaderList.svelte';
  import ReaderMissing from './reading-room/ReaderMissing.svelte';
  import ReaderQuestions from './reading-room/ReaderQuestions.svelte';
  import ReaderSummary from './reading-room/ReaderSummary.svelte';
  import Sheet from './Sheet.svelte';

  export let readers = [];
  export let reader = null;
  export let readerId = '';
  export let progress = {};
  export let onOpenReader = () => {};
  export let onBack = () => {};
  export let onComplete = () => {};

  let answers = {};
  let summary = '';
  let activeGlossKey = '';
  let selectedEntry = null;
  let sessionReaderId = '';

  const byId = new Map(entries.map((entry) => [entry.id, entry]));
  const byHangul = new Map(entries.map((entry) => [entry.hangul, entry]));

  function manualEntriesFor(item) {
    return (item?.newWords || []).map((word, index) => {
      const value = String(word || '').trim();
      return byId.get(value) || byHangul.get(value) || {
        id: `${item.id}-reader-word-${index + 1}`,
        hangul: value,
        english: 'reader word',
        partOfSpeech: 'reader word',
      };
    });
  }

  $: currentReaderId = reader?.id || readerId || '';
  $: if (currentReaderId !== sessionReaderId) {
    sessionReaderId = currentReaderId;
    answers = {};
    summary = progress?.[currentReaderId]?.summary || '';
    activeGlossKey = '';
    selectedEntry = null;
  }
  $: glossIndex = reader ? buildGlossIndex([...entries, ...manualEntriesFor(reader)]) : null;
  $: questionCount = reader?.comprehensionQuestions?.length || 0;
  $: answeredCount = Object.keys(answers).filter((key) => answers[key]).length;
  $: score = reader
    ? reader.comprehensionQuestions.filter((question, index) => answers[index] === question.correct).length
    : 0;
  $: completed = reader ? progress?.[reader.id] : null;

  function choose(index, option) {
    answers = { ...answers, [index]: option };
  }

  function completeReader() {
    if (!reader || answeredCount < questionCount) return;
    onComplete({ id: reader.id, score, total: questionCount, summary });
  }

  function toggleGloss(key) {
    activeGlossKey = activeGlossKey === key ? '' : key;
  }

  function openEntry(entry) {
    selectedEntry = findEntry(entry?.id);
  }
</script>

{#if reader}
  <section class="reader">
    <ReaderHeader {reader} {completed} {onBack} />
    <ReaderArticle {reader} {glossIndex} {activeGlossKey} onToggleGloss={toggleGloss} onOpenEntry={openEntry} />
    <ReaderQuestions {reader} {answers} {answeredCount} {questionCount} {score} onChoose={choose} />
    <ReaderSummary
      {reader}
      {summary}
      {completed}
      canComplete={answeredCount === questionCount}
      onSummaryInput={(value) => (summary = value)}
      onComplete={completeReader}
    />
  </section>
{:else if readerId}
  <ReaderMissing {onBack} />
{:else}
  <ReaderList {readers} {progress} {onOpenReader} />
{/if}

<Sheet open={!!selectedEntry} onClose={() => (selectedEntry = null)}>
  {#if selectedEntry}<EntryDetail entry={selectedEntry} />{/if}
</Sheet>

<style>
  .reader { display: grid; gap: 14px; }
</style>
