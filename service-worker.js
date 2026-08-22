const CACHE_NAME = 'lgs-2027-arena-pwa-v4.0.0-foundation';
const APP_SHELL = [
  './',
  './index.html',
  './styles.css',
  './mobile-v04.css',
  './app.js',
  './pwa.js',
  './config.js',
  './manifest.webmanifest',
  './data/matematik.js',
  './data/fen.js',
  './data/turkce.js',
  './data/inkilap.js',
  './data/din.js',
  './data/ingilizce.js',
  './data/notes.js',
  './assets/zeus.webp',
  './assets/zeus-cover.svg',
  './assets/app-icon.svg'
];

self.addEventListener('install', event => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE_NAME);
    await cache.addAll(APP_SHELL);
    const checks = await Promise.all(APP_SHELL.map(url => cache.match(url)));
    if (checks.some(item => !item)) throw new Error('Critical app shell file missing');
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key)));
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', event => {
  const request = event.request;
  if (request.method !== 'GET') return;

  if (request.mode === 'navigate') {
    event.respondWith((async () => {
      try {
        const response = await fetch(request);
        if (response && response.ok) {
          const cache = await caches.open(CACHE_NAME);
          await cache.put('./index.html', response.clone());
        }
        return response;
      } catch {
        return (await caches.match('./index.html')) || Response.error();
      }
    })());
    return;
  }

  event.respondWith((async () => {
    const cached = await caches.match(request);
    if (cached) return cached;
    try {
      const response = await fetch(request);
      if (response && response.status === 200 && response.type !== 'opaque') {
        const cache = await caches.open(CACHE_NAME);
        await cache.put(request, response.clone());
      }
      return response;
    } catch {
      return Response.error();
    }
  })());
});

self.addEventListener('message', event => {
  if (event.data === 'SKIP_WAITING') self.skipWaiting();
});
