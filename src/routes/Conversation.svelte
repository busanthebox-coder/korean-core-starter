<script>
  import { conversations } from '../lib/data.js';
  import { normalizeKo, shuffle } from '../lib/quiz.js';
  import AudioButton from '../lib/components/AudioButton.svelte';
  import RomanizationLine from '../lib/components/RomanizationLine.svelte';
  import ChatBubble from '../lib/components/ChatBubble.svelte';

  const SETTING = {
    texting: { icon: 'ti-device-mobile', label: 'Texting' },
    hangout: { icon: 'ti-users', label: 'Hanging out' },
  };

  let selected = null;
  let mode = 'roleplay'; // 'roleplay' | 'respond'
  let cursor = 0;        // index of the current "you" turn awaiting an answer
  let results = {};      // turnIndex -> the choice shown as your bubble
  // current you-turn local state
  let picked = null;     // roleplay: chosen choice
  let wrong = [];        // roleplay: ko of choices already tried wrong
  let firstTry = true;
  let typed = '';        // respond: user input
  let revealed = false;  // respond: model answer shown
  let graded = false;    // respond: did the user submit for grading (vs. give up)
  let respondOK = false; // respond: was the graded reply correct
  let correctCount = 0;

  const correctOf = (t) => (t.choices || []).find((c) => c.correct) || (t.choices || [])[0];
  const firstYou = (ts) => { const i = ts.findIndex((t) => t.role === 'you'); return i === -1 ? ts.length : i; };
  const nextYou = (ts, from) => { const i = ts.findIndex((t, idx) => idx > from && t.role === 'you'); return i === -1 ? ts.length : i; };

  function openScenario(c) { selected = c; restart(); window.scrollTo(0, 0); }
  function backToList() { selected = null; }
  function setMode(m) { if (m !== mode) { mode = m; restart(); } }
  function restart() {
    cursor = firstYou(selected.turns);
    results = {}; picked = null; wrong = []; firstTry = true; typed = ''; revealed = false; correctCount = 0;
  }
  function clearTurnState() { picked = null; wrong = []; firstTry = true; typed = ''; revealed = false; graded = false; respondOK = false; }

  function advance(answerChoice) {
    results = { ...results, [cursor]: answerChoice };
    cursor = nextYou(selected.turns, cursor);
    clearTurnState();
  }
  function pick(choice) {
    if (picked && picked.correct) return; // already solved
    picked = choice;
    if (choice.correct) { if (firstTry) correctCount += 1; }
    else { firstTry = false; if (!wrong.includes(choice.ko)) wrong = [...wrong, choice.ko]; }
  }
  function reveal() { revealed = true; }   // give up: show the model, no credit
  function checkReply() {
    if (revealed || !typed.trim()) return;
    const model = correctOf(active);
    respondOK = normalizeKo(typed) === normalizeKo(model.ko);
    graded = true; revealed = true;
    if (respondOK) correctCount += 1;
  }

  $: turns = selected ? selected.turns : [];
  $: thread = turns.slice(0, cursor);
  $: active = turns[cursor] || null;
  $: done = !!selected && cursor >= turns.length;
  $: youTotal = turns.filter((t) => t.role === 'you').length;
  // Shuffle choices once per turn so the correct answer isn't always first
  $: shuffledChoices = active?.choices ? shuffle([...active.choices]) : [];
</script>

{#if !selected}
  <section class="convo">
    <div class="hero">
      <div class="eyebrow">Casual conversation · 반말</div>
      <h1>Roleplay</h1>
      <p>Practice real, casual conversations. Pick the natural reply, or type your own and check it.</p>
    </div>
    <div class="cards">
      {#each conversations as c (c.id)}
        <button class="scard" on:click={() => openScenario(c)}>
          <span class="sicon"><i class="ti {(SETTING[c.setting] || {}).icon || 'ti-messages'}" aria-hidden="true"></i></span>
          <span class="smain">
            <strong>{c.title}</strong>
            <span class="ssit">{c.situation}</span>
            <span class="schip">{(SETTING[c.setting] || {}).label || c.setting}</span>
          </span>
          <span class="chev">▸</span>
        </button>
      {:else}
        <p class="empty">No conversations yet.</p>
      {/each}
    </div>
  </section>
{:else}
  <section class="convo player">
    <div class="ptop">
      <button class="back" on:click={backToList}>← Conversations</button>
      <div class="modes" role="tablist">
        <button role="tab" class:on={mode === 'roleplay'} aria-selected={mode === 'roleplay'} on:click={() => setMode('roleplay')}>Roleplay</button>
        <button role="tab" class:on={mode === 'respond'} aria-selected={mode === 'respond'} on:click={() => setMode('respond')}>받아치기</button>
      </div>
    </div>

    <div class="phead">
      <h1 class="ptitle">{selected.title}</h1>
      <p class="psit">{selected.situation}</p>
    </div>

    <div class="thread">
      {#if thread.length}
        <div class="chat">
          {#each thread as t, i}
            {#if t.role === 'partner'}
              <ChatBubble side="left" name={selected.partner || '친구'} ko={t.ko} romanization={t.romanization} en={t.en} />
            {:else if results[i]}
              <ChatBubble side="right" ko={results[i].ko} romanization={results[i].romanization} en={results[i].en} />
            {/if}
          {/each}
        </div>
      {/if}

      {#if active}
        <div class="turn">
          <div class="prompt"><span class="ico">🟢 Your turn</span>{#if active.prompt} — {active.prompt}{/if}</div>

          {#if mode === 'roleplay'}
            <div class="choices">
              {#each shuffledChoices as ch, ci}
                {@const isPicked = picked && picked.ko === ch.ko}
                {@const isWrong = wrong.includes(ch.ko)}
                <button class="choice" class:correct={isPicked && ch.correct} class:bad={isWrong}
                  disabled={picked && picked.correct}
                  on:click={() => pick(ch)}>
                  <span class="cletter">{#if isPicked && ch.correct}✓{:else if isWrong}✗{:else}{String.fromCharCode(65 + ci)}{/if}</span>
                  <span class="ctext">
                    <span class="cko">{ch.ko}</span>
                    <span class="cen">{ch.en}</span>
                    {#if isPicked || isWrong}<span class="fb">{ch.feedback}</span>{/if}
                  </span>
                </button>
              {/each}
            </div>
            {#if picked && picked.correct}
              <button class="cont" on:click={() => advance(picked)}>Continue ▸</button>
            {/if}

          {:else}
            <textarea class="respond" bind:value={typed} rows="2" placeholder="Type your reply in Korean (반말)…" disabled={revealed}></textarea>
            {#if !revealed}
              <div class="respond-actions">
                <button class="cont" disabled={!typed.trim()} on:click={checkReply}>Check · 확인</button>
                <button class="giveup" on:click={reveal}>모르겠어요 · Show answer</button>
              </div>
            {:else}
              {@const model = correctOf(active)}
              {#if graded}
                <div class="verdict" class:ok={respondOK}>
                  {#if respondOK}✓ 자연스러워요! That works.{:else}거의 다 왔어요 — compare with a natural reply below.{/if}
                </div>
              {/if}
              <div class="model">
                <div class="model-label">A natural reply</div>
                <div class="bko">{model.ko}<AudioButton text={model.ko} size={22} /></div>
                <RomanizationLine text={model.romanization} />
                <div class="ben">{model.en}</div>
                <div class="fb ok">{model.feedback}</div>
              </div>
              <button class="cont" on:click={() => advance(correctOf(active))}>Continue ▸</button>
            {/if}
          {/if}
        </div>
      {/if}

      {#if done}
        <div class="finish">
          <div class="fin-emoji">🎉</div>
          <h2>Nice chatting!</h2>
          {#if youTotal}<p class="score">{mode === 'roleplay' ? 'Natural replies on the first try' : 'Correct replies'}: <strong>{correctCount}/{youTotal}</strong></p>{/if}
          {#if selected.tip}<div class="tip"><span class="ico">💡</span><p>{selected.tip}</p></div>{/if}
          <div class="fin-actions">
            <button class="btn3d" on:click={restart}>Try again</button>
            <button class="ghost" on:click={backToList}>Back to list</button>
          </div>
        </div>
      {/if}
    </div>
  </section>
{/if}

<style>
  .convo { max-width: 760px; margin: 0 auto; padding: 28px; display: grid; gap: 16px; }
  .hero { display: grid; gap: 4px; padding-bottom: 16px; border-bottom: 1px solid var(--rule); }
  .eyebrow { font-size: 11px; font-weight: 750; letter-spacing: .16em; text-transform: uppercase; color: var(--ink-3); }
  h1 { margin: 7px 0 3px; font-family: var(--serif-ko); font-size: 34px; font-weight: 600; letter-spacing: -0.02em; line-height: 1.05; }
  .hero p { margin: 0; color: var(--ink-3); }

  .cards { display: grid; gap: 10px; }
  .scard { display: flex; align-items: center; gap: 13px; text-align: left; padding: 15px 17px; border-radius: var(--radius);
    background: var(--surface); border: 1px solid var(--border); box-shadow: var(--shadow-1); transition: transform .1s var(--bounce), border-color .1s; }
  .scard:hover { transform: translateY(-2px); border-color: var(--green); }
  .sicon { width: 44px; height: 44px; display: grid; place-items: center; border-radius: 13px; background: var(--primary-wash); color: var(--accent-ink); font-size: 22px; flex: none; }
  .smain { display: grid; gap: 3px; flex: 1; }
  .smain strong { font-size: 16px; }
  .ssit { color: var(--ink-2); font-size: 13px; }
  .schip { justify-self: start; margin-top: 2px; font-size: 11px; font-weight: 800; padding: 2px 9px; border-radius: 999px; background: var(--surface-2); color: var(--ink-2); }
  .chev { color: var(--ink-3); }
  .empty { color: var(--ink-3); }

  .ptop { display: flex; align-items: center; gap: 10px; }
  .back { padding: 7px 14px; border-radius: 999px; background: var(--surface-2); color: var(--ink-2); font-weight: 800; }
  .back:hover { background: var(--border); }
  .modes { margin-left: auto; display: inline-flex; gap: 4px; padding: 4px; border-radius: 999px; background: var(--surface-2); }
  .modes button { padding: 6px 14px; border-radius: 999px; font-weight: 800; font-size: 13px; color: var(--ink-2); }
  .modes button.on { background: var(--primary); color: var(--primary-on); }

  .phead { display: grid; gap: 2px; }
  .ptitle { font-size: 22px; margin: 0; }
  .psit { margin: 0; color: var(--ink-3); font-size: 14px; }

  .thread { display: grid; gap: 14px; }
  .chat { display: grid; gap: 12px; padding: 18px 14px; border-radius: 20px;
    background: linear-gradient(180deg, var(--chat-bg-2), var(--chat-bg)); box-shadow: inset 0 1px 8px rgba(20,40,70,.12); }

  .turn { display: grid; gap: 10px; padding: 14px; border-radius: 16px; background: var(--surface-2); border: 1px dashed var(--border); }
  .prompt { font-weight: 750; color: var(--ink); }
  .prompt .ico { font-weight: 850; color: var(--green-dark); margin-right: 2px; }
  .choices { display: grid; gap: 9px; }
  .choice { display: grid; grid-template-columns: auto 1fr; gap: 11px; align-items: start; text-align: left;
    padding: 11px 13px; border-radius: 14px; background: var(--surface);
    border: 1.5px solid var(--border); box-shadow: var(--shadow-1); transition: transform .1s var(--bounce), border-color .12s, background .12s; }
  .choice:hover:not(:disabled) { border-color: var(--green); transform: translateY(-1px); }
  .choice:disabled { cursor: default; }
  .cletter { width: 27px; height: 27px; flex: none; display: grid; place-items: center; border-radius: 999px;
    background: var(--surface-2); color: var(--ink-2); font-weight: 850; font-size: 14px; }
  .ctext { display: grid; gap: 2px; min-width: 0; }
  .cko { font-size: 16px; font-weight: 740; }
  .cen { color: var(--ink-2); font-size: 13px; }
  .choice.correct { border-color: var(--green); background: #f1fae6; }
  .choice.correct .cletter { background: var(--green); color: #fff; }
  .choice.bad { border-color: #f0b6b6; background: #fdf0f0; }
  .choice.bad .cletter { background: #e74c3c; color: #fff; }
  .fb { display: block; margin-top: 5px; font-size: 13px; font-weight: 650; color: var(--ink-2); }
  .choice.correct .fb { color: var(--green-dark); }
  .choice.bad .fb { color: #c0392b; }

  .respond { width: 100%; padding: 11px 13px; border-radius: 12px; border: 1.5px solid var(--border); background: var(--surface);
    font: inherit; font-size: 16px; resize: vertical; }
  .respond:focus { border-color: var(--green); outline: none; }
  .respond-actions { display: flex; flex-wrap: wrap; gap: 8px; align-items: center; }
  .giveup { padding: 10px 16px; border-radius: 999px; background: var(--surface-2); color: var(--ink-2); font-weight: 800; font-size: 13px; }
  .giveup:hover { background: var(--border); }
  .verdict { padding: 9px 13px; border-radius: 10px; font-weight: 800; font-size: 14px;
    background: #fdf0f0; color: #c0392b; border: 1px solid #f0b6b6; }
  .verdict.ok { background: #f1fae6; color: var(--green-dark); border-color: #cdebac; }
  .cont:disabled { opacity: .5; pointer-events: none; }
  .model { display: grid; gap: 2px; padding: 12px 14px; border-radius: 13px; background: #f1fae6; border: 1px solid var(--border); }
  .model-label { font-size: 11px; font-weight: 850; text-transform: uppercase; letter-spacing: .05em; color: var(--green-dark); }
  .fb.ok { color: var(--green-dark); margin-top: 4px; }

  .cont { justify-self: start; padding: 10px 18px; border-radius: 999px; background: var(--primary); color: var(--primary-on); font-weight: 850; box-shadow: 0 3px 0 var(--primary-press); }
  .cont:hover { filter: brightness(1.03); }

  .finish { display: grid; justify-items: center; gap: 6px; text-align: center; padding: 20px; border-radius: 18px;
    background: var(--surface-2); border: 1px solid var(--border); }
  .fin-emoji { font-size: 38px; }
  .finish h2 { margin: 0; }
  .score { margin: 0; color: var(--ink-2); }
  .tip { display: flex; gap: 10px; text-align: left; margin-top: 6px; padding: 12px 14px; border-radius: 13px; background: rgba(255,255,255,.7); }
  .tip p { margin: 0; line-height: 1.55; }
  .fin-actions { display: flex; gap: 10px; margin-top: 8px; }
  .ghost { padding: 11px 18px; border-radius: 999px; background: rgba(255,255,255,.8); color: var(--ink-2); font-weight: 800; }
</style>
