const CACHE_NAME = 'lgs-2027-arena-pwa-v0.9-verified-zeus';
const APP_SHELL = [
  './','./index.html','./styles.css','./mobile-v04.css','./android16-v05.css','./android16-v06.css','./android16-v07.css','./v09-vibrant.css','./app.js','./pwa.js','./manifest.webmanifest',
  './data/matematik.js','./data/fen.js','./data/turkce.js','./data/inkilap.js','./data/din.js','./data/notes.js',
  './assets/zeus-real-v09.webp','./assets/icon-192.jpg','./assets/icon-512.webp'
];
self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(APP_SHELL)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', event => {
  const request = event.request;
  if (request.method !== 'GET') return;
  if (request.mode === 'navigate') {
    event.respondWith(fetch(request).then(response => {
      const copy = response.clone();
      caches.open(CACHE_NAME).then(cache => cache.put('./index.html', copy));
      return response;
    }).catch(() => caches.match('./index.html')));
    return;
  }
  event.respondWith(caches.match(request).then(cached => cached || fetch(request).then(response => {
    if (!response || response.status !== 200 || response.type === 'opaque') return response;
    const copy = response.clone();
    caches.open(CACHE_NAME).then(cache => cache.put(request, copy));
    return response;
  })));
});
self.addEventListener('message', event => { if (event.data === 'SKIP_WAITING') self.skipWaiting(); });
