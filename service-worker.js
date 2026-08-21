const CACHE_NAME = 'lgs-2027-arena-pwa-v2.2-direct-boot';
const APP_SHELL = [
  './','./launch-v21.html','./launch-v21.html?v=22','./index.html','./styles.css','./mobile-v04.css','./android16-v05.css','./android16-v06.css','./android16-v07.css','./v09-vibrant.css','./v10-zeus-fix.css','./parent-tracking.css','./lgs-scoring.css','./adaptive-v17.css','./weekly-exam-v18.css','./profile-gate-v20.css?v=22',
  './app.js?v=22','./pwa.js?v=22','./profile-gate-v20.js?v=22','./pwa-health-v20.js?v=22','./parent-tracking.js?v=22','./lgs-scoring.js?v=22','./adaptive-engine.js?v=22','./english-integration-v18.js?v=22','./weekly-exam-v18.js?v=22','./manifest.webmanifest?v=22',
  './data/matematik.js','./data/fen.js','./data/turkce.js','./data/inkilap.js','./data/din.js','./data/notes.js','./data/bank-v011.js','./data/adaptive-bank-v17.js','./data/english-v18.js?v=22','./data/english-notes-v18.js?v=22',
  './assets/zeus-real-v09.webp','./assets/icon-192.jpg','./assets/icon-512.webp',
  './assets/zeus-v10/part-1.txt?v=22','./assets/zeus-v10/part-2.txt?v=22','./assets/zeus-v10/part-3a.txt?v=22','./assets/zeus-v10/part-3b.txt?v=22',
  './assets/zeus-v10/part-4.txt?v=22','./assets/zeus-v10/part-5a.txt?v=22','./assets/zeus-v10/part-5b.txt?v=22','./assets/zeus-v10/part-6.txt?v=22'
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
    event.respondWith(fetch(request,{cache:'no-store'}).then(response => {
      const copy = response.clone();
      caches.open(CACHE_NAME).then(cache => cache.put(request, copy));
      return response;
    }).catch(async () => (await caches.match(request)) || caches.match('./index.html') || caches.match('./launch-v21.html')));
    return;
  }
  const url = new URL(request.url);
  const freshAsset = /\.(?:js|css)$/.test(url.pathname) || /manifest\.webmanifest$/.test(url.pathname);
  if (freshAsset) {
    event.respondWith(fetch(request,{cache:'no-store'}).then(response => {
      if (response && response.status === 200) caches.open(CACHE_NAME).then(cache => cache.put(request, response.clone()));
      return response;
    }).catch(() => caches.match(request)));
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
