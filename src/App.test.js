import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import App from './App.svelte';

describe('App shell', () => {
  it('renders the brand and the default Learn route', async () => {
    render(App);
    expect(screen.getByText('Korean Core Starter')).toBeInTheDocument();
    expect(await screen.findByRole('heading', { name: 'Your lessons' })).toBeInTheDocument();
  });
});
