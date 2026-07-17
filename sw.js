const CACHE_VERSION = 'kcs-pwa-9a37f5476cc2';
const PRECACHE_URLS = [
  ".",
  "404.html",
  "assets/App-DYreoyCZ.css",
  "assets/App-DsaIcWay.js",
  "assets/index-BTmBFApr.js",
  "assets/index-Cd1Exfud.css",
  "assets/vendor-IyN17Iu6.js",
  "data/app-core.465256e9.json",
  "data/app-expressions.87a51151.json",
  "data/app-extended.d9325730.json",
  "data/app-index.f14c5e0d.json",
  "data/app-words.7a0c401a.json",
  "data/manifest.json",
  "favicon.svg",
  "icons/icon-192.png",
  "icons/icon-512.png",
  "icons/icon.svg",
  "index.html",
  "manifest.webmanifest",
  "og.png"
];
const EXTERNAL_STYLESHEETS = [
  'https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable.min.css',
  'https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,500;9..144,600&family=Gowun+Batang:wght@400;700&display=swap',
  'https://cdn.jsdelivr.net/npm/@tabler/icons-webfont@3.31.0/dist/tabler-icons.min.css',
];

function scopeUrl(path) {
  return new URL(path, self.registration.scope).href;
}

function isSameOrigin(requestUrl) {
  return new URL(requestUrl).origin === self.location.origin;
}

async function cacheResponse(cache, request, response, { allowOpaque = false } = {}) {
  if (response?.ok || (allowOpaque && response?.type === 'opaque')) await cache.put(request, response.clone());
  return response;
}

async function networkFirst(request, fallbackPath) {
  const cache = await caches.open(CACHE_VERSION);
  try {
    return await cacheResponse(cache, request, await fetch(request));
  } catch {
    return (await cache.match(request)) || (fallbackPath ? cache.match(scopeUrl(fallbackPath)) : undefined) || Response.error();
  }
}

async function cacheFirst(request) {
  const cache = await caches.open(CACHE_VERSION);
  const cached = await cache.match(request);
  if (cached) return cached;
  return cacheResponse(cache, request, await fetch(request));
}

async function runtimeFirst(request) {
  const cache = await caches.open(CACHE_VERSION);
  try {
    return await cacheResponse(cache, request, await fetch(request), { allowOpaque: true });
  } catch {
    return (await cache.match(request)) || Response.error();
  }
}

function extractCssUrls(cssText, baseUrl) {
  return [...cssText.matchAll(/url\((['"]?)(.*?)\1\)/g)]
    .map((match) => match[2])
    .filter((url) => url && !url.startsWith('data:'))
    .map((url) => new URL(url, baseUrl).href);
}

async function warmExternalAssets(cache) {
  await Promise.allSettled(EXTERNAL_STYLESHEETS.map(async (cssUrl) => {
    const cssRequest = new Request(cssUrl);
    const cssResponse = await fetch(cssRequest);
    await cacheResponse(cache, cssRequest, cssResponse.clone(), { allowOpaque: true });
    if (!cssResponse.ok) return;

    const assetUrls = extractCssUrls(await cssResponse.text(), cssUrl);
    await Promise.allSettled(assetUrls.map(async (assetUrl) => {
      const assetRequest = new Request(assetUrl);
      await cacheResponse(cache, assetRequest, await fetch(assetRequest), { allowOpaque: true });
    }));
  }));
}

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_VERSION).then(async (cache) => {
      await cache.addAll(PRECACHE_URLS.map((path) => scopeUrl(path)));
      await warmExternalAssets(cache);
    })
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((key) => key.startsWith('kcs-pwa-') && key !== CACHE_VERSION).map((key) => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING') self.skipWaiting();
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  if (!isSameOrigin(request.url)) {
    event.respondWith(runtimeFirst(request));
    return;
  }

  const url = new URL(request.url);
  if (url.pathname.endsWith('/sw.js')) return;

  if (request.mode === 'navigate') {
    event.respondWith(networkFirst(request, 'index.html'));
    return;
  }

  if (url.pathname.endsWith('/data/manifest.json')) {
    event.respondWith(networkFirst(request));
    return;
  }

  event.respondWith(cacheFirst(request));
});
