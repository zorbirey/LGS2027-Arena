const CACHE_NAME = 'lgs-2027-arena-pwa-v1.9-english-native-fix';
const APP_SHELL = [
  './','./index.html','./styles.css','./mobile-v04.css','./android16-v05.css','./android16-v06.css','./android16-v07.css','./v09-vibrant.css','./v10-zeus-fix.css','./parent-tracking.css','./lgs-scoring.css','./adaptive-v17.css','./weekly-exam-v18.css',
  './app.js','./pwa.js','./parent-tracking.js','./lgs-scoring.js','./adaptive-engine.js','./english-integration-v18.js','./weekly-exam-v18.js','./manifest.webmanifest',
  './data/matematik.js','./data/fen.js','./data/turkce.js','./data/inkilap.js','./data/din.js','./data/notes.js','./data/bank-v011.js','./data/adaptive-bank-v17.js','./data/english-v18.js','./data/english-notes-v18.js',
  './assets/zeus-real-v09.webp','./assets/icon-192.jpg','./assets/icon-512.webp',
  './assets/zeus-v10/part-1.txt?v=19','./assets/zeus-v10/part-2.txt?v=19','./assets/zeus-v10/part-3a.txt?v=19','./assets/zeus-v10/part-3b.txt?v=19',
  './assets/zeus-v10/part-4.txt?v=19','./assets/zeus-v10/part-5a.txt?v=19','./assets/zeus-v10/part-5b.txt?v=19','./assets/zeus-v10/part-6.txt?v=19'
];

self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(APP_SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

async function networkFirst(request, fallbackKey = null) {
  try {
    const response = await fetch(request);
    if (response && response.status === 200 && response.type !== 'opaque') {
      const copy = response.clone();
      caches.open(CACHE_NAME).then(cache => cache.put(request, copy));
    }
    return response;
  } catch (error) {
    return (await caches.match(request)) || (fallbackKey ? caches.match(fallbackKey) : Promise.reject(error));
  }
}

self.addEventListener('fetch', event => {
  const request = event.request;
  if (request.method !== 'GET') return;

  if (request.mode === 'navigate') {
    event.respondWith(networkFirst(request, './index.html'));
    return;
  }

  if (request.destination === 'script' || request.destination === 'style') {
    event.respondWith(networkFirst(request));
    return;
  }

  event.respondWith(
    caches.match(request).then(cached => cached || fetch(request).then(response => {
      if (!response || response.status !== 200 || response.type === 'opaque') return response;
      const copy = response.clone();
      caches.open(CACHE_NAME).then(cache => cache.put(request, copy));
      return response;
    }))
  );
});

self.addEventListener('message', event => {
  if (event.data === 'SKIP_WAITING') self.skipWaiting();
});