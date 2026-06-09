import { render, fireEvent, screen } from '@testing-library/svelte';
import Conversation from './Conversation.svelte';

test('roleplay: open a scenario and pick the natural reply', async () => {
  const { container } = render(Conversation);

  // Scenario list → open one
  await fireEvent.click(await screen.findByText('Making weekend plans'));

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
  await fireEvent.click(await screen.findByText('Making weekend plans'));
  await fireEvent.click(screen.getByText('받아치기'));        // switch mode
  expect(container.querySelector('textarea.respond')).not.toBeNull();
  await fireEvent.click(screen.getByText(/Show answer/));
  expect(container.querySelector('.model')).not.toBeNull();   // model answer revealed
  expect(container.querySelector('.verdict')).toBeNull();     // not graded → no verdict banner
});

test('respond mode: a correct typed reply is graded ✓', async () => {
  const { container } = render(Conversation);
  await fireEvent.click(await screen.findByText('Making weekend plans'));
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
