const CACHE_NAME='lgs-2027-arena-pwa-v2.7-clean';
const INDEX='./index.html';
const ASSETS=[
  './',INDEX,'./manifest.webmanifest',
  './styles.css','./mobile-v04.css','./android16-v05.css','./android16-v06.css','./android16-v07.css','./v09-vibrant.css','./v10-zeus-fix.css','./parent-tracking.css','./lgs-scoring.css','./weekly-exam-v18.css','./clean-v27.css',
  './data/matematik.js','./data/fen.js','./data/turkce.js','./data/inkilap.js','./data/din.js','./data/notes.js','./data/english-v18.js','./data/english-notes-v18.js','./data/bank-v011.js','./data/adaptive-bank-v17.js',
  './core-v23.js','./entry-clean-v27.js','./parent-tracking.js','./lgs-scoring.js','./weekly-exam-v18.js','./pwa-clean-v27.js',
  './assets/zeus.webp','./assets/zeus-real-v09.webp','./assets/icon-192.jpg','./assets/icon-512.webp'
];

async function cacheAsset(cache,url){
  try{const r=await fetch(url,{cache:'reload'});if(r&&r.ok)await cache.put(url,r.clone())}catch(e){}
}

self.addEventListener('install',event=>{
  event.waitUntil((async()=>{
    const cache=await caches.open(CACHE_NAME);
    await Promise.allSettled(ASSETS.map(url=>cacheAsset(cache,url)));
    await self.skipWaiting();
  })());
});

self.addEventListener('activate',event=>{
  event.waitUntil((async()=>{
    const keys=await caches.keys();
    await Promise.all(keys.filter(k=>k!==CACHE_NAME&&/lgs-2027-arena-pwa/i.test(k)).map(k=>caches.delete(k)));
    await self.clients.claim();
  })());
});

async function backgroundRefresh(request,cacheKey){
  try{const r=await fetch(request,{cache:'no-store'});if(r&&r.ok){const cache=await caches.open(CACHE_NAME);await cache.put(cacheKey||request,r.clone())}}catch(e){}
}

self.addEventListener('fetch',event=>{
  const request=event.request;
  if(request.method!=='GET')return;
  const url=new URL(request.url);
  if(url.origin!==self.location.origin)return;

  if(request.mode==='navigate'){
    event.respondWith((async()=>{
      const cache=await caches.open(CACHE_NAME);
      const cached=await cache.match(INDEX,{ignoreSearch:true});
      if(cached){event.waitUntil(backgroundRefresh(request,INDEX));return cached}
      try{const r=await fetch(request,{cache:'no-store'});if(r&&r.ok)await cache.put(INDEX,r.clone());return r}catch(e){return new Response('<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><body style="background:#020710;color:#fff;font-family:Arial;padding:24px"><h2>LGS Arena</h2><p>İlk çevrimdışı kullanım için uygulamayı internet varken bir kez tamamen aç.</p></body>',{headers:{'Content-Type':'text/html; charset=utf-8'}})}
    })());
    return;
  }

  event.respondWith((async()=>{
    const cache=await caches.open(CACHE_NAME);
    const cached=await cache.match(request,{ignoreSearch:true});
    if(cached){event.waitUntil(backgroundRefresh(request,request));return cached}
    try{const r=await fetch(request);if(r&&r.ok&&r.type!=='opaque')await cache.put(request,r.clone());return r}catch(e){return Response.error()}
  })());
});

self.addEventListener('message',event=>{if(event.data==='SKIP_WAITING')self.skipWaiting()});
