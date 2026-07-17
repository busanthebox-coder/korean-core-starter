// One-line contrast for the lesson word screen: "vs 정말, 참 — 진짜 is the casual spoken default."
// The full comparison lives in the dictionary; this is just the nudge that the
// word has near-twins, shown where the learner meets it.
export function clusterHintLine(cluster, hangul) {
  if (!cluster || !hangul) return null;
  const me = (cluster.members || []).find((m) => m.hangul === hangul);
  if (!me?.hint) return null;
  const others = cluster.members.filter((m) => m.hangul !== hangul).map((m) => m.hangul);
  if (!others.length) return null;
  return `vs ${others.join(', ')} — ${hangul} is ${me.hint}.`;
}
