<script>
  import DialogueScreen from './DialogueScreen.svelte';
  import GrammarScreen from './GrammarScreen.svelte';
  import PracticeScreen from './PracticeScreen.svelte';
  import WordsScreen from './WordsScreen.svelte';

  export let cur;
  export let phaseLabel;
  export let answer = '';
  export let isRevealed = false;
  export let correctOf = () => '';
  export let isCorrect = () => false;
  export let onPick = () => {};
  export let onCheck = () => {};
  export let onInput = () => {};
  export let onMatchDone = () => {};
  export let onConjugationDone = () => {};
  export let writingState = { checkedIds: [], skipped: false };
  export let onWritingCheck = () => {};
  export let onWritingSkip = () => {};
</script>

<div class="lp-screen" data-phase={cur.phase}>
  <span class="phase-tag tag-{phaseLabel?.tone || 'words'}">
    <i class="ti ti-{phaseLabel?.icon || 'circle'}"></i> {phaseLabel?.label || ''}
  </span>

  {#if cur.kind === 'words' || cur.kind === 'phrases'}
    <WordsScreen kind={cur.kind} items={cur.data} />
  {:else if cur.kind === 'grammar' || cur.kind === 'grammarFocus'}
    <GrammarScreen kind={cur.kind} data={cur.data} />
  {:else if ['dialogue', 'reading', 'culture', 'beginner', 'steps', 'links'].includes(cur.kind)}
    <DialogueScreen kind={cur.kind} data={cur.data} />
  {:else if ['exercise', 'match', 'writing', 'conjugation'].includes(cur.kind)}
    <PracticeScreen
      kind={cur.kind}
      data={cur.data}
      {answer}
      {isRevealed}
      {correctOf}
      {isCorrect}
      {onPick}
      {onCheck}
      {onInput}
      {onMatchDone}
      {onConjugationDone}
      {writingState}
      {onWritingCheck}
      {onWritingSkip}
    />
  {/if}
</div>

<style>
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

  :global(.lp-screen .screen-h) { margin: 0; font-family: var(--serif-ko); font-size: 24px; font-weight: 600; letter-spacing: 0; line-height: 1.15; }
  :global(.lp-screen .screen-h.grammar) { font-family: var(--sans); font-weight: 800; font-size: 28px; }
  :global(.lp-screen .screen-h.ex-prompt) { font-size: 19px; font-family: var(--sans); font-weight: 800; word-break: keep-all; overflow-wrap: break-word; }
  :global(.lp-screen .screen-sub) { margin: -4px 0 2px; color: var(--ink-3); font-size: 14px; word-break: keep-all; overflow-wrap: break-word; }

  @media (prefers-reduced-motion: reduce) { .lp-screen { animation: none; } }
</style>
