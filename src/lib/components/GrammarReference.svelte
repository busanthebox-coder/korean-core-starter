<script>
  import { grammar } from '../data.js';
  import AudioButton from './AudioButton.svelte';
  import RomanizationLine from './RomanizationLine.svelte';

  const category = (id) => {
    if (id.includes('foundation')) return 'Foundations';
    if (id.includes('sound')) return 'Sounds & pronunciation';
    if (id.includes('numbers') || id.includes('time-date') || id.includes('counter')) return 'Numbers, time & counting';
    if (id.includes('particle')) return 'Particles';
    if (id.includes('connector')) return 'Connectors';
    if (id.includes('modifier') || id.includes('irregular') || id.includes('eu-insertion')) return 'Word forms';
    if (id.includes('tense')) return 'Tense & aspect';
    return 'Sentence endings';
  };
  const ORDER = ['Foundations', 'Sounds & pronunciation', 'Numbers, time & counting', 'Particles', 'Tense & aspect', 'Sentence endings', 'Connectors', 'Word forms'];
  const GOAL = {
    'Foundations': 'Read Hangul and form your first sentences.',
    'Sounds & pronunciation': 'Read words the way they are really said — liaison, nasalization, palatalization, aspiration.',
    'Numbers, time & counting': 'Use both number systems, tell time and dates, and count with the right unit.',
    'Particles': 'Mark who does what — topic, subject, object, place, time.',
    'Tense & aspect': 'Talk about now, the past, the future, and ongoing actions.',
    'Sentence endings': 'Ask, request, want, can, must — everyday speech acts.',
    'Connectors': 'Join ideas: because, and, if, but, while.',
    'Word forms': 'Modifiers, the (으) rule, and irregular stems that reshape words.',
  };
  const groups = ORDER
    .map((name) => ({ name, items: grammar.filter((g) => category(g.id) === name) }))
    .filter((g) => g.items.length);

  let open = null;
  const toggle = (id) => (open = open === id ? null : id);

  // Per-practice-item answer reveal (keyed by `${grammarId}:${index}`).
  let shown = {};
  const reveal = (key) => { shown = { ...shown, [key]: true }; };
</script>

<div class="gref">
  <p class="road-intro">A step-by-step path through Korean grammar. Follow the steps in order and tap any card to study it — each one shows when to use it, what learners get wrong, and quick practice.</p>
  {#each groups as group, gi}
    <section>
      <div class="sec-head">
        <span class="step">{gi + 1}</span>
        <div class="sec-text">
          <span class="sec-name">{group.name} <span class="count">{group.items.length}</span></span>
          {#if GOAL[group.name]}<span class="sec-goal">{GOAL[group.name]}</span>{/if}
        </div>
      </div>
      <div class="cards">
        {#each group.items as g}
          {@const frames = g.sentenceFrames || []}
          {@const mistakes = g.commonMistakes || []}
          {@const practice = g.practiceItems || []}
          {@const steps = g.studyOrder || []}
          <div class="g-card" class:open={open === g.id} role="button" tabindex="0"
            on:click={() => toggle(g.id)}
            on:keydown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggle(g.id); } }}>
            <div class="g-top">
              <strong class="g-ko">{g.hangul}</strong>
              <span class="g-title">{g.title}</span>
              <span class="chev">{open === g.id ? '▾' : '▸'}</span>
            </div>
            <p class="g-plain">{g.plainEnglish}</p>
            {#if open === g.id}
              <div class="g-detail">
                {#if g.beginnerExplanation}<p class="g-explain">{g.beginnerExplanation}</p>{/if}
                {#if g.whenToUse}<div class="g-row"><span class="g-label">When</span><span>{g.whenToUse}</span></div>{/if}
                {#if g.attachmentRule}<div class="g-row"><span class="g-label">Attach</span><span>{g.attachmentRule}</span></div>{/if}

                {#if g.contrastWith}
                  <div class="callout warn"><span class="cap">⚠️ Don't confuse</span><p>{g.contrastWith}</p></div>
                {/if}

                {#if frames.length}
                  <div class="block"><span class="g-label">Try the frame</span>
                    <div class="frames">{#each frames as f}<div class="frame">{f}</div>{/each}</div>
                  </div>
                {/if}

                {#if (g.examples || []).length}
                  <div class="g-ex">
                    {#each g.examples as ex}
                      <div class="ex"><div class="exko">{ex.ko} <AudioButton text={ex.ko} size={22} /></div>
                        <RomanizationLine text={ex.romanization} /><div class="exen">{ex.en}</div></div>
                    {/each}
                  </div>
                {/if}

                {#if mistakes.length}
                  <div class="callout bad"><span class="cap">❌ Common mistakes</span>
                    <ul>{#each mistakes as m}<li>{m}</li>{/each}</ul>
                  </div>
                {/if}

                {#if practice.length}
                  <div class="block"><span class="g-label">Practice</span>
                    <div class="pqs">
                      {#each practice as p, i}
                        {@const key = `${g.id}:${i}`}
                        {@const answer = p.ko || p.answer}
                        <div class="pq">
                          <div class="pq-q">{p.prompt}</div>
                          {#if shown[key]}
                            <div class="pq-a">
                              <span class="pq-ko">{answer}</span>
                              {#if p.answer && p.ko && p.answer !== p.ko}<span class="pq-alt">{p.answer}</span>{/if}
                              <AudioButton text={answer} size={20} />
                            </div>
                          {:else}
                            <button type="button" class="pq-btn" on:click|stopPropagation={() => reveal(key)}>정답 보기 · Show</button>
                          {/if}
                        </div>
                      {/each}
                    </div>
                  </div>
                {/if}

                {#if steps.length}
                  <div class="block"><span class="g-label">Study steps</span>
                    <ol class="steps">{#each steps as s}<li>{s}</li>{/each}</ol>
                  </div>
                {/if}
              </div>
            {/if}
          </div>
        {/each}
      </div>
    </section>
  {/each}
</div>

<style>
  .gref { display: grid; gap: 18px; }
  section { display: grid; gap: 10px; }
  .road-intro { margin: 0 0 2px; color: var(--ink-2); line-height: 1.55; font-size: 14px; }
  .sec-head { display: flex; align-items: center; gap: 11px; }
  .step { width: 30px; height: 30px; flex: none; display: grid; place-items: center; border-radius: 999px;
    background: var(--green); color: #fff; font-weight: 850; font-size: 15px; box-shadow: 0 0 0 4px var(--green-soft); }
  .sec-text { display: grid; gap: 1px; }
  .sec-name { font-size: 15px; font-weight: 850; }
  .sec-goal { font-size: 12.5px; font-weight: 600; color: var(--ink-3); }
  .count { margin-left: 4px; font-size: 11px; font-weight: 800; padding: 1px 8px; border-radius: 999px; background: var(--green-soft); color: var(--green-dark); }
  .cards { display: grid; gap: 8px; }
  .g-card { padding: 13px 15px; border-radius: 13px; background: var(--surface); border: 1px solid var(--border);
    box-shadow: var(--shadow-1); cursor: pointer; transition: border-color .12s; }
  .g-card:hover, .g-card.open { border-color: var(--green); }
  .g-top { display: flex; align-items: baseline; gap: 10px; }
  .g-ko { font-size: 18px; font-weight: 850; }
  .g-title { color: var(--ink-2); font-weight: 700; }
  .chev { margin-left: auto; color: var(--ink-3); font-size: 12px; }
  .g-plain { margin: 6px 0 0; color: var(--ink); line-height: 1.55; }
  .g-detail { margin-top: 10px; padding-top: 10px; border-top: 1px dashed var(--border); display: grid; gap: 12px; }
  .g-row { display: grid; grid-template-columns: 54px 1fr; gap: 8px; }
  .g-label { font-size: 11px; font-weight: 850; text-transform: uppercase; color: var(--green-dark); letter-spacing: .02em; }
  .g-explain { margin: 0; color: var(--ink-2); line-height: 1.6; }
  .g-ex { display: grid; gap: 8px; }
  .ex { padding: 9px 11px; border-radius: 11px; background: var(--surface-2); border-left: 3px solid var(--green); }
  .exko { font-size: 16px; font-weight: 720; display: flex; align-items: center; gap: 7px; }
  .exen { color: var(--ink-2); font-size: 14px; }

  /* callouts */
  .callout { border-radius: 11px; padding: 10px 12px; display: grid; gap: 6px; }
  .callout .cap { font-size: 12px; font-weight: 850; }
  .callout p { margin: 0; line-height: 1.55; }
  .callout ul { margin: 0; padding-left: 18px; display: grid; gap: 4px; line-height: 1.5; }
  .callout.warn { background: #fff7e6; border: 1px solid #ffe1a8; }
  .callout.warn .cap { color: #b8730a; }
  .callout.bad { background: #fdecec; border: 1px solid #f8c9c9; }
  .callout.bad .cap { color: #c0392b; }

  .block { display: grid; gap: 7px; }
  .frames { display: grid; gap: 6px; }
  .frame { font-size: 15px; font-weight: 650; padding: 7px 11px; border-radius: 9px; background: var(--surface-2);
    border: 1px dashed var(--border); }

  /* practice */
  .pqs { display: grid; gap: 7px; }
  .pq { padding: 9px 11px; border-radius: 11px; background: var(--surface-2); display: grid; gap: 6px; }
  .pq-q { font-weight: 650; color: var(--ink); }
  .pq-btn { justify-self: start; font-size: 12px; font-weight: 800; padding: 5px 12px; border-radius: 999px;
    background: var(--green-soft); color: var(--green-dark); }
  .pq-btn:hover { background: var(--border); }
  .pq-a { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
  .pq-ko { font-size: 16px; font-weight: 800; color: var(--green-dark); }
  .pq-alt { font-size: 13px; color: var(--ink-2); }

  .steps { margin: 0; padding-left: 20px; display: grid; gap: 4px; color: var(--ink-2); line-height: 1.5; }
</style>
