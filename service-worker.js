const CACHE_NAME='lgs-2027-arena-pwa-v2.3-stable-core';
const CORE='./core-v23.js?v=23';
const SHELL=[
 './','./index.html','./launch-v21.html','./styles.css',CORE,
 './mobile-v04.css','./android16-v05.css','./android16-v06.css','./android16-v07.css',
 './v09-vibrant.css','./v10-zeus-fix.css','./parent-tracking.css','./lgs-scoring.css','./adaptive-v17.css','./weekly-exam-v18.css','./profile-gate-v20.css',
 './profile-gate-v20.js','./parent-tracking.js','./lgs-scoring.js','./adaptive-engine.js','./weekly-exam-v18.js','./pwa.js',
 './data/matematik.js','./data/fen.js','./data/turkce.js','./data/inkilap.js','./data/din.js','./data/notes.js','./data/english-v18.js','./data/english-notes-v18.js',
 './assets/zeus-real-v09.webp','./assets/icon-192.jpg','./assets/icon-512.webp'
];
self.addEventListener('install',event=>{event.waitUntil(caches.open(CACHE_NAME).then(cache=>cache.addAll(SHELL)).catch(()=>{}).then(()=>self.skipWaiting()))});
self.addEventListener('activate',event=>{event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE_NAME).map(k=>caches.delete(k)))).then(()=>self.clients.claim()))});
self.addEventListener('fetch',event=>{
 const req=event.request;if(req.method!=='GET')return;const url=new URL(req.url);
 if(url.origin===location.origin && /\/app\.js$/.test(url.pathname)){
   event.respondWith(fetch(CORE,{cache:'no-store'}).then(r=>{if(!r.ok)throw new Error('core');const c=r.clone();caches.open(CACHE_NAME).then(cache=>cache.put(CORE,c));return r}).catch(()=>caches.match(CORE)));
   return;
 }
 if(req.mode==='navigate'){
   event.respondWith(fetch(req,{cache:'no-store'}).then(r=>{if(r&&r.ok){const c=r.clone();caches.open(CACHE_NAME).then(cache=>cache.put(req,c))}return r}).catch(async()=>await caches.match(req)||caches.match('./index.html')));
   return;
 }
 const fresh=/\.(?:js|css)$/.test(url.pathname)||/manifest\.webmanifest$/.test(url.pathname);
 if(fresh){
   event.respondWith(fetch(req,{cache:'no-store'}).then(r=>{if(r&&r.ok){const c=r.clone();caches.open(CACHE_NAME).then(cache=>cache.put(req,c))}return r}).catch(()=>caches.match(req)));
   return;
 }
 event.respondWith(caches.match(req).then(hit=>hit||fetch(req).then(r=>{if(r&&r.ok&&r.type!=='opaque'){const c=r.clone();caches.open(CACHE_NAME).then(cache=>cache.put(req,c))}return r})));
});
self.addEventListener('message',event=>{if(event.data==='SKIP_WAITING')self.skipWaiting()});