import { describe, expect, it, vi } from 'vitest';
import { applyPwaUpdate, registerPwa, serviceWorkerUrl } from './pwa.js';

describe('pwa helpers', () => {
  it('resolves the service worker inside the configured base path', () => {
    expect(serviceWorkerUrl('/korean-core-starter/')).toBe('/korean-core-starter/sw.js');
    expect(serviceWorkerUrl('/korean-core-starter')).toBe('/korean-core-starter/sw.js');
  });

  it('does nothing when service workers are unavailable or disabled', async () => {
    expect(await registerPwa({ enabled: false, navigatorRef: {} })).toBeNull();
    expect(await registerPwa({ enabled: true, navigatorRef: {} })).toBeNull();
  });

  it('registers the scoped worker and can ask a waiting worker to activate', async () => {
    const postMessage = vi.fn();
    const register = vi.fn().mockResolvedValue({
      waiting: { postMessage },
      addEventListener: vi.fn(),
    });
    const navigatorRef = {
      serviceWorker: {
        register,
        addEventListener: vi.fn(),
      },
    };

    const registration = await registerPwa({
      enabled: true,
      navigatorRef,
      locationRef: { reload: vi.fn() },
      baseUrl: '/korean-core-starter/',
    });
    applyPwaUpdate(registration.waiting);

    expect(register).toHaveBeenCalledWith('/korean-core-starter/sw.js');
    expect(postMessage).toHaveBeenCalledWith({ type: 'SKIP_WAITING' });
  });

  it('does not reload the first time a worker claims the page', async () => {
    let controllerChange;
    const reload = vi.fn();
    const navigatorRef = {
      serviceWorker: {
        register: vi.fn().mockResolvedValue({ waiting: null, addEventListener: vi.fn() }),
        addEventListener: vi.fn((event, callback) => {
          if (event === 'controllerchange') controllerChange = callback;
        }),
      },
    };

    await registerPwa({
      enabled: true,
      navigatorRef,
      locationRef: { reload },
      baseUrl: '/korean-core-starter/',
    });
    controllerChange();

    expect(reload).not.toHaveBeenCalled();
  });
});
