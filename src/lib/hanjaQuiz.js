function uniqueMembers(roots, excludeRoot) {
  const seenEntryIds = new Set();
  const seenHangul = new Set();
  const targetEntryIds = new Set((excludeRoot?.members || []).map((member) => member.entryId).filter(Boolean));
  const targetHangul = new Set((excludeRoot?.members || []).map((member) => member.hangul).filter(Boolean));
  const members = [];
  for (const root of roots) {
    if (root.id === excludeRoot?.id) continue;
    for (const member of root.members || []) {
      if (!member.entryId || !member.hangul) continue;
      if (targetEntryIds.has(member.entryId) || targetHangul.has(member.hangul)) continue;
      if (seenEntryIds.has(member.entryId) || seenHangul.has(member.hangul)) continue;
      seenEntryIds.add(member.entryId);
      seenHangul.add(member.hangul);
      members.push(member);
    }
  }
  return members;
}

function rotate(items, seed) {
  if (!items.length) return [];
  const start = Math.abs(seed) % items.length;
  return [...items.slice(start), ...items.slice(0, start)];
}

export function buildHanjaRootQuiz(root, roots, { count = 3 } = {}) {
  if (!root || !Array.isArray(root.members) || !Array.isArray(roots)) return [];
  const distractors = uniqueMembers(roots, root);
  return root.members.slice(0, count).map((correct, index) => {
    const wrong = rotate(distractors, index * 7)
      .filter((member) => member.entryId !== correct.entryId && member.hangul !== correct.hangul)
      .slice(0, 3);
    const options = [correct, ...wrong].map((member) => ({
      entryId: member.entryId,
      hangul: member.hangul,
    }));
    return {
      id: `${root.id}-quiz-${index + 1}`,
      prompt: `Which word belongs to ${root.reading}(${root.hanja})?`,
      correctEntryId: correct.entryId,
      options: rotate(options, index + root.reading.length),
    };
  });
}
