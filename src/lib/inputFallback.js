export function tokenizeAnswer(answer) {
  return String(answer || '').trim().split(/\s+/).filter(Boolean);
}

export function buildFallbackTiles(answer, distractors = []) {
  const answerTokens = tokenizeAnswer(answer);
  const seen = new Set(answerTokens);
  const extra = [];
  for (const item of distractors) {
    const token = String(item || '').trim();
    if (!token || seen.has(token)) continue;
    seen.add(token);
    extra.push(token);
    if (extra.length >= 3) break;
  }
  return [...answerTokens, ...extra]
    .map((t, index) => ({ t, k: `${index}-${t}` }))
    .sort((a, b) => a.t.localeCompare(b.t, 'ko') || a.k.localeCompare(b.k));
}

export function bankAnswerValue(tokens) {
  return (tokens || []).map((item) => item.t).join(' ').trim();
}

