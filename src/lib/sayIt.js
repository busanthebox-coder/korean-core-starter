const MIN_SYLLABLES = 8;
const MAX_SYLLABLES = 20;
const SENTENCE_RE = /[^.!?。！？…]+[.!?。！？…]?/g;

function cleanText(value = '') {
  return String(value)
    .replace(/^[\s"'“”‘’]+|[\s"'“”‘’]+$/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

export function koreanSyllableCount(value = '') {
  return (String(value).match(/[가-힣]/g) || []).length;
}

export function isSayItLength(value = '') {
  const count = koreanSyllableCount(value);
  return count >= MIN_SYLLABLES && count <= MAX_SYLLABLES;
}

export function splitKoreanSentences(value = '') {
  return (String(value).match(SENTENCE_RE) || [])
    .map(cleanText)
    .filter(Boolean);
}

function uniqueByKo(items = []) {
  const seen = new Set();
  return items.filter((item) => {
    const key = cleanText(item.ko);
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function dialogueLines(chapter = {}) {
  if (chapter.extendedDialogue?.lines?.length) return chapter.extendedDialogue.lines;
  return chapter.dialogue || [];
}

function orderedSpeakers(lines = []) {
  return [...new Set(lines.map((line) => line.speaker).filter(Boolean))];
}

function preferredLearnerSpeakers(lines = []) {
  const speakers = orderedSpeakers(lines);
  if (speakers.length <= 1) return new Set(speakers);
  return new Set(speakers.slice(1));
}

function makeCandidate({ chapterId, ko, romanization = '', en = '', speaker = '', source, order }) {
  return {
    id: `${chapterId || 'chapter'}-${source}-${order}`,
    ko: cleanText(ko),
    romanization: cleanText(romanization),
    en: cleanText(en),
    speaker,
    source,
  };
}

function lineCandidates(line, { chapterId, source, order }) {
  const whole = cleanText(line?.ko);
  if (!whole) return [];
  const pieces = isSayItLength(whole) ? [whole] : splitKoreanSentences(whole);
  return pieces
    .filter(isSayItLength)
    .map((ko, index) => makeCandidate({
      chapterId,
      ko,
      romanization: ko === whole ? line.romanization : '',
      en: ko === whole ? line.en : '',
      speaker: line.speaker || '',
      source,
      order: `${order}-${index}`,
    }));
}

function dialogueCandidates(chapter = {}, { learnerOnly = true } = {}) {
  const lines = dialogueLines(chapter);
  const learnerSpeakers = preferredLearnerSpeakers(lines);
  const filtered = learnerOnly && learnerSpeakers.size
    ? lines.filter((line) => learnerSpeakers.has(line.speaker))
    : lines;
  return filtered.flatMap((line, index) => lineCandidates(line, {
    chapterId: chapter.id,
    source: learnerOnly ? 'dialogue-learner' : 'dialogue-any',
    order: index,
  }));
}

function grammarExampleCandidates(chapter = {}) {
  return (chapter.grammarNotes || [])
    .flatMap((note, noteIndex) => (note.examples || []).map((example, exampleIndex) => ({
      example,
      noteIndex,
      exampleIndex,
    })))
    .flatMap(({ example, noteIndex, exampleIndex }) => {
      const whole = cleanText(example.ko);
      const pieces = isSayItLength(whole) ? [whole] : splitKoreanSentences(whole);
      return pieces
        .filter(isSayItLength)
        .map((ko, pieceIndex) => makeCandidate({
          chapterId: chapter.id,
          ko,
          romanization: ko === whole ? example.romanization : '',
          en: ko === whole ? example.en : '',
          source: 'grammar-example',
          order: `${noteIndex}-${exampleIndex}-${pieceIndex}`,
        }));
    });
}

function preferQuestion(items = []) {
  return items.find((item) => /[?？]\s*$/.test(item.ko) || /(요|까)\?$/.test(item.ko));
}

function addFirst(target, pool, predicate = () => true) {
  const item = pool.find((candidate) => predicate(candidate) && !target.some((picked) => picked.ko === candidate.ko));
  if (!item) return false;
  target.push(item);
  return true;
}

export function buildSayItItems(chapter = {}, { count = 3 } = {}) {
  const primary = uniqueByKo([
    ...dialogueCandidates(chapter, { learnerOnly: true }),
    ...grammarExampleCandidates(chapter),
  ]);
  const fallback = uniqueByKo([
    ...primary,
    ...dialogueCandidates(chapter, { learnerOnly: false }),
  ]);
  const selected = [];

  addFirst(selected, primary, (item) => koreanSyllableCount(item.ko) <= 14 && !/[?？]\s*$/.test(item.ko));
  addFirst(selected, primary, (item) => item.source === 'dialogue-learner' && !/[?？]\s*$/.test(item.ko));
  const question = preferQuestion(primary) || preferQuestion(fallback);
  if (question && !selected.some((item) => item.ko === question.ko)) selected.push(question);

  while (selected.length < count) {
    if (!addFirst(selected, primary)) break;
  }
  while (selected.length < count) {
    if (!addFirst(selected, fallback)) break;
  }

  return selected.slice(0, count).map((item, index) => ({
    ...item,
    id: `${chapter.id || 'chapter'}-sayit-${index + 1}`,
  }));
}
