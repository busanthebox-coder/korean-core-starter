export function getKoreanVoice(win = typeof window === 'undefined' ? null : window) {
  const voices = win?.speechSynthesis?.getVoices?.() || [];
  return voices.find((voice) => voice.lang && voice.lang.toLowerCase().startsWith('ko')) || null;
}

export function canUseKoreanSpeech(win = typeof window === 'undefined' ? null : window) {
  const synth = win?.speechSynthesis;
  if (!synth) return false;
  const voices = synth.getVoices?.() || [];
  return voices.length === 0 || voices.some((voice) => voice.lang && voice.lang.toLowerCase().startsWith('ko'));
}

export function speak(text, { rate = 1 } = {}) {
  if (typeof window === 'undefined' || !canUseKoreanSpeech(window)) return false;
  const Utterance = window.SpeechSynthesisUtterance || globalThis.SpeechSynthesisUtterance;
  if (typeof Utterance !== 'function') return false;
  window.speechSynthesis.cancel();
  const u = new Utterance(text);
  u.lang = 'ko-KR';
  u.rate = rate;
  const voice = getKoreanVoice(window);
  if (voice) u.voice = voice;
  window.speechSynthesis.speak(u);
  return true;
}
