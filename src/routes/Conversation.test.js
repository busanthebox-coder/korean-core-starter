import { render, fireEvent, screen } from '@testing-library/svelte';
import Conversation from './Conversation.svelte';
import { setRoleplayRegister } from '../lib/stores.js';

// The scenario list defaults to 해요체 now, so the 반말 fixtures these mechanics
// tests rely on need one filter tap first.
async function openCasualScenario(title = 'Making weekend plans') {
  await fireEvent.click(await screen.findByText('반말 · Casual'));
  await fireEvent.click(await screen.findByText(title));
}

beforeEach(() => {
  localStorage.clear();
  setRoleplayRegister('haeyo');
});

test('scenario list defaults to 해요체 and switches on demand', async () => {
  render(Conversation);

  // Polite-first: a 반말 scenario is not offered until you ask for it.
  expect(await screen.findByText('Language Exchange: First Meeting')).toBeTruthy();
  expect(screen.queryByText('Making weekend plans')).toBeNull();

  await fireEvent.click(screen.getByText('반말 · Casual'));
  expect(await screen.findByText('Making weekend plans')).toBeTruthy();
  expect(screen.queryByText('Language Exchange: First Meeting')).toBeNull();

  await fireEvent.click(screen.getByText('All'));
  expect(await screen.findByText('Making weekend plans')).toBeTruthy();
  expect(screen.getByText('Language Exchange: First Meeting')).toBeTruthy();
});

test('a paired scenario links to its other-register twin', async () => {
  render(Conversation);
  await fireEvent.click(await screen.findByText('Weather and small talk (polite)'));

  // The 해요체 variant offers the 반말 original.
  const link = await screen.findByText(/See the 반말 version/);
  await fireEvent.click(link);
  expect(await screen.findByText(/See the 해요체 version/)).toBeTruthy();
});

test('roleplay: open a scenario and pick the natural reply', async () => {
  const { container } = render(Conversation);

  await openCasualScenario();

  // Partner's opening line is shown, and the first "you" turn offers choices
  expect(screen.getByText('주말에 뭐 해?')).toBeTruthy();

  // Partner's line renders as a KakaoTalk-style left bubble with an avatar
  expect(container.querySelector('.chat .row.left .avatar')).not.toBeNull();

  // Pick the natural casual reply → it is marked correct and a Continue button appears
  await fireEvent.click(screen.getByText('별거 없는데, 왜?'));
  expect(container.querySelector('.choice.correct')).not.toBeNull();
  expect(screen.getByText(/Continue/)).toBeTruthy();

  // Continue posts my reply as a right-side (sent) bubble in the chat thread
  await fireEvent.click(screen.getByText(/Continue/));
  expect(container.querySelector('.chat .row.right')).not.toBeNull();
});

test('respond mode: giving up reveals the model answer (no credit)', async () => {
  const { container } = render(Conversation);
  await openCasualScenario();
  await fireEvent.click(screen.getByText('받아치기'));        // switch mode
  expect(container.querySelector('textarea.respond')).not.toBeNull();
  await fireEvent.click(screen.getByText(/Show answer/));
  expect(container.querySelector('.model')).not.toBeNull();   // model answer revealed
  expect(container.querySelector('.verdict')).toBeNull();     // not graded → no verdict banner
});

test('respond mode: a correct typed reply is graded ✓', async () => {
  const { container } = render(Conversation);
  await openCasualScenario();
  await fireEvent.click(screen.getByText('받아치기'));

  // The model (correct) reply for the first you-turn, typed verbatim, should grade as correct.
  const model = container.querySelector('textarea.respond');
  // Mirror the app's first model reply; spacing/punctuation are normalized away.
  await fireEvent.input(model, { target: { value: ' 별거 없는데, 왜? ' } });
  await fireEvent.click(screen.getByText(/Check/));
  const verdict = container.querySelector('.verdict');
  expect(verdict).not.toBeNull();
  expect(verdict.classList.contains('ok')).toBe(true);
});

test('respond mode: a close typed reply gives a hidden-answer hint first', async () => {
  const { container } = render(Conversation);
  await openCasualScenario();
  await fireEvent.click(screen.getByText('받아치기'));

  const input = container.querySelector('textarea.respond');
  await fireEvent.input(input, { target: { value: '별거 없는데' } });
  await fireEvent.click(screen.getByText(/Check/));

  expect(screen.getByText(/거의 다 왔어요/)).toBeTruthy();
  expect(screen.getByText(/Missing hint/)).toBeTruthy();
  expect(screen.queryByText('A natural reply')).toBeNull();
  expect(screen.queryByText('별거 없는데, 왜?')).toBeNull();
  expect(input.disabled).toBe(false);
});

test('respond mode: repeated misses open copy-the-model flow before advancing', async () => {
  const { container } = render(Conversation);
  await openCasualScenario();
  await fireEvent.click(screen.getByText('받아치기'));

  const input = container.querySelector('textarea.respond');
  await fireEvent.input(input, { target: { value: '별거 없는데' } });
  await fireEvent.click(screen.getByText(/Check/));
  await fireEvent.click(screen.getByText(/Check/));

  expect(screen.getByText(/따라 써 보세요/)).toBeTruthy();
  expect(screen.getByText('A natural reply')).toBeTruthy();
  expect(screen.getByText('별거 없는데, 왜?')).toBeTruthy();
  expect(container.querySelector('.chat .row.right')).toBeNull();

  await fireEvent.input(input, { target: { value: '별거 없는데, 왜?' } });
  await fireEvent.click(screen.getByText(/Check/));

  expect(container.querySelector('.chat .row.right')).not.toBeNull();
});
