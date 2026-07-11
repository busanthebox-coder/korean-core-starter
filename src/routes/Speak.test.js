import { render, screen } from '@testing-library/svelte';
import Speak from './Speak.svelte';

test('Speak shows the daily speaking card and both speaking libraries', async () => {
  render(Speak);

  expect(screen.getByRole('heading', { name: 'Today’s speaking' })).toBeInTheDocument();
  expect(screen.getByText('1 · Say-it')).toBeInTheDocument();
  expect(screen.getByRole('heading', { name: 'Listen & repeat' })).toBeInTheDocument();
  expect(screen.getByRole('heading', { name: 'Respond' })).toBeInTheDocument();
  expect((await screen.findAllByText('Start shadow')).length).toBeGreaterThan(0);
});
