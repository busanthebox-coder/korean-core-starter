function clean(value) {
  return typeof value === 'string' ? value.trim() : '';
}

function conversationItems(conversations, errors) {
  const items = Array.isArray(conversations) ? conversations : conversations?.conversations;
  if (!Array.isArray(items)) {
    errors.push('conversations: must contain a conversations array');
    return [];
  }
  return items;
}

function isKoreanHelperText(value) {
  const text = clean(value);
  return Boolean(text) && /[가-힣]/.test(text) && !/[A-Za-z]/.test(text);
}

function sentenceCount(value) {
  return clean(value).split(/[.!?。！？]+/).filter((sentence) => clean(sentence)).length;
}

export function validateConversations(conversations, errors) {
  const seenIds = new Set();
  for (const conversation of conversationItems(conversations, errors)) {
    const label = `conversation:${conversation?.id || 'unknown'}`;
    for (const field of ['id', 'title', 'situation', 'setting', 'partner', 'tip']) {
      if (!clean(conversation?.[field])) errors.push(`${label}: missing ${field}`);
    }
    if (seenIds.has(conversation?.id)) errors.push(`${label}: duplicate id ${conversation.id}`);
    if (clean(conversation?.id)) seenIds.add(conversation.id);
    if (!Array.isArray(conversation?.vocab)
      || !conversation.vocab.every((item) => typeof item === 'string' && clean(item))) {
      errors.push(`${label}: vocab must contain nonempty strings`);
    }
    for (const field of ['instructionKo', 'reactionKo']) {
      if (!isKoreanHelperText(conversation?.buddyCard?.[field])) {
        errors.push(`${label}.buddyCard.${field}: must be Korean-only helper text`);
      }
    }
    const instruction = conversation?.buddyCard?.instructionKo;
    const instructionSentences = sentenceCount(instruction);
    if (instructionSentences < 2 || instructionSentences > 3) {
      errors.push(`${label}.buddyCard.instructionKo: must contain 2-3 sentences`);
    }
    if (isKoreanHelperText(instruction) && !/주세요/.test(instruction)) {
      errors.push(`${label}.buddyCard.instructionKo: must use a polite request ending`);
    }

    const turns = conversation?.turns;
    if (!Array.isArray(turns) || turns.length < 2) {
      errors.push(`${label}: turns must contain at least two items`);
      continue;
    }
    turns.forEach((turn, turnIndex) => {
      const turnLabel = `${label} turn #${turnIndex + 1}`;
      if (turn?.role === 'partner') {
        for (const field of ['ko', 'romanization', 'en']) {
          if (!clean(turn[field])) errors.push(`${turnLabel}: missing ${field}`);
        }
        return;
      }
      if (turn?.role !== 'you') {
        errors.push(`${turnLabel}: invalid role ${turn?.role || ''}`);
        return;
      }
      if (!clean(turn.prompt)) errors.push(`${turnLabel}: missing prompt`);
      const choices = turn.choices || [];
      if (!Array.isArray(choices) || choices.length < 2) {
        errors.push(`${turnLabel}: needs at least two choices`);
        return;
      }
      const correctCount = choices.filter((choice) => choice?.correct === true).length;
      if (correctCount !== 1) errors.push(`${turnLabel}: expected exactly one correct choice, got ${correctCount}`);
      const seen = new Set();
      choices.forEach((choice, choiceIndex) => {
        const choiceLabel = `${turnLabel} choice #${choiceIndex + 1}`;
        for (const field of ['ko', 'romanization', 'en', 'feedback']) {
          if (!clean(choice?.[field])) errors.push(`${choiceLabel}: missing ${field}`);
        }
        const normalized = clean(choice?.ko).replace(/\s+/g, ' ');
        if (normalized && seen.has(normalized)) errors.push(`${turnLabel}: duplicate choice ${normalized}`);
        if (normalized) seen.add(normalized);
      });
    });
  }
}
