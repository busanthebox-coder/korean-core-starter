import { render, fireEvent, screen } from '@testing-library/svelte';
import GrammarReference from './GrammarReference.svelte';

// Section C (roadmap) + Section A (deep teaching fields + interactive practice),
// verified in one render to avoid cross-test DOM bleed.
test('grammar view is a roadmap and cards reveal deep self-study fields', async () => {
  const { container } = render(GrammarReference);

  // Section C — step-by-step roadmap with milestone goals
  expect(await screen.findByText(/step-by-step path/i)).toBeTruthy();
  expect(screen.getByText(/Mark who does what/i)).toBeTruthy();

  // Section A — open a fully-populated card; check surfaced teaching fields
  await fireEvent.click(screen.getByText('Past Tense')); // grammar-tense-past has every field
  const body = () => document.body.textContent;
  expect(body()).toContain("Don't confuse");   // contrastWith
  expect(body()).toContain('Common mistakes'); // commonMistakes
  expect(body()).toContain('Study steps');     // studyOrder heading
  expect(body()).toContain('Find the stem by dropping'); // a studyOrder step rendered

  // Interactive practice — clicking the reveal button shows an answer block
  const showBtn = container.querySelector('.pq-btn');
  expect(showBtn).not.toBeNull();
  expect(container.querySelector('.pq-a')).toBeNull();
  await fireEvent.click(showBtn);
  expect(container.querySelector('.pq-a')).not.toBeNull(); // card stays open, answer revealed
});
