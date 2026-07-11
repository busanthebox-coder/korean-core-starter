import { fireEvent, render, screen, waitFor } from '@testing-library/svelte';
import { beforeEach, expect, test } from 'vitest';
import Speak from './Speak.svelte';

beforeEach(() => {
  window.location.hash = '#/speak';
});

test('Speak keeps the large practice libraries closed until one is selected', async () => {
  render(Speak);

  expect(screen.getByRole('heading', { name: 'Today’s speaking' })).toBeInTheDocument();
  expect(screen.getByText('1 · Say-it')).toBeInTheDocument();
  expect(screen.queryByRole('region', { name: 'Listen and repeat library' })).not.toBeInTheDocument();
  expect(screen.queryByRole('region', { name: 'Roleplay library' })).not.toBeInTheDocument();

  await fireEvent.click(screen.getByRole('button', { name: 'Browse listen and repeat' }));
  expect(await screen.findByRole('region', { name: 'Listen and repeat library' })).toBeInTheDocument();
  expect(screen.queryByRole('region', { name: 'Roleplay library' })).not.toBeInTheDocument();

  await fireEvent.click(screen.getByRole('button', { name: 'Browse roleplays' }));
  expect(await screen.findByRole('region', { name: 'Roleplay library' })).toBeInTheDocument();
  expect(screen.queryByRole('region', { name: 'Listen and repeat library' })).not.toBeInTheDocument();
});

test('Open lesson goes directly to the Say-it activity', async () => {
  render(Speak);

  await fireEvent.click(screen.getByRole('button', { name: 'Open lesson' }));

  await waitFor(() => expect(window.location.hash).toContain('today=sayit'));
});
