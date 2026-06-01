export function speak(text) {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
  window.speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.lang = 'ko-KR';
  const voice = window.speechSynthesis.getVoices().find((v) => v.lang && v.lang.startsWith('ko'));
  if (voice) u.voice = voice;
  window.speechSynthesis.speak(u);
}
