import { beforeEach, describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import App from './App.svelte';
import { pwaStatus } from './lib/pwa.js';

describe('App shell', () => {
  beforeEach(() => {
    pwaStatus.set({ offlineReady: false, updateReady: false, waitingWorker: null });
  });

  it('renders the brand and the default Learn route', async () => {
    render(App);
    expect(screen.getByText('Korean Core Starter')).toBeInTheDocument();
    expect(await screen.findByRole('heading', { name: 'Your lessons' })).toBeInTheDocument();
  });

  it('renders the PWA update toast when a waiting worker is ready', async () => {
    render(App);
    pwaStatus.set({ offlineReady: false, updateReady: true, waitingWorker: { postMessage: () => {} } });

    expect(await screen.findByText('Update ready')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Reload' })).toBeInTheDocument();
  });
});
