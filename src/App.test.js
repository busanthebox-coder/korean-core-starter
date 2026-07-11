import { beforeEach, describe, it, expect, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/svelte';
import App from './App.svelte';
import { pwaStatus } from './lib/pwa.js';

describe('App shell', () => {
  beforeEach(() => {
    window.location.hash = '';
    pwaStatus.set({ offlineReady: false, updateReady: false, waitingWorker: null });
  });

  it('renders the brand and the default Learn route', async () => {
    render(App);
    expect(screen.getByText('Korean Core Starter')).toBeInTheDocument();
    expect(await screen.findByRole('heading', { name: /minutes for today|today is complete/i })).toBeInTheDocument();
  });

  it('renders the PWA update toast when a waiting worker is ready', async () => {
    render(App);
    pwaStatus.set({ offlineReady: false, updateReady: true, waitingWorker: { postMessage: () => {} } });

    expect(await screen.findByText('Update ready')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Reload' })).toBeInTheDocument();
  });

  it('redirects old speaking routes to Speak', async () => {
    window.location.hash = '#/talk';
    render(App);

    await waitFor(() => expect(window.location.hash).toBe('#/speak'));
  });

  it('starts each destination route at the top of the page', async () => {
    const scrollTo = vi.fn();
    Object.defineProperty(window, 'scrollTo', { value: scrollTo, writable: true });
    render(App);

    await screen.findByRole('heading', { name: /minutes for today|today is complete/i });
    scrollTo.mockClear();
    await fireEvent.click(screen.getAllByRole('link', { name: 'Guide' })[0]);

    await waitFor(() => expect(scrollTo).toHaveBeenCalledWith({ top: 0, left: 0, behavior: 'auto' }));
  });
});
