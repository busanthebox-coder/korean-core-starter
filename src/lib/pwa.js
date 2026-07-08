import { writable } from 'svelte/store';

export const pwaStatus = writable({
  offlineReady: false,
  updateReady: false,
  waitingWorker: null,
});

export function serviceWorkerUrl(baseUrl = import.meta.env.BASE_URL || '/') {
  const base = baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`;
  return `${base}sw.js`;
}

export function applyPwaUpdate(worker) {
  worker?.postMessage?.({ type: 'SKIP_WAITING' });
}

export async function registerPwa({
  enabled = import.meta.env.PROD,
  navigatorRef = globalThis.navigator,
  locationRef = globalThis.location,
  baseUrl = import.meta.env.BASE_URL || '/',
} = {}) {
  if (!enabled || !navigatorRef?.serviceWorker) return null;

  const hadController = !!navigatorRef.serviceWorker.controller;
  const registration = await navigatorRef.serviceWorker.register(serviceWorkerUrl(baseUrl));
  const markUpdateReady = (worker) => {
    if (!worker) return;
    pwaStatus.set({ offlineReady: false, updateReady: true, waitingWorker: worker });
  };

  markUpdateReady(registration.waiting);
  registration.addEventListener?.('updatefound', () => {
    const worker = registration.installing;
    worker?.addEventListener?.('statechange', () => {
      if (worker.state !== 'installed') return;
      if (navigatorRef.serviceWorker.controller) {
        markUpdateReady(worker);
      } else {
        pwaStatus.set({ offlineReady: true, updateReady: false, waitingWorker: null });
      }
    });
  });

  let reloadStarted = false;
  navigatorRef.serviceWorker.addEventListener?.('controllerchange', () => {
    if (!hadController) return;
    if (reloadStarted) return;
    reloadStarted = true;
    locationRef?.reload?.();
  });

  return registration;
}
