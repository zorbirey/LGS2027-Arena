const CACHE_NAME='lgs-2027-arena-pwa-v2.4-offline-first';
const CORE='./core-v23.js?v=23';
const INDEX='./index.html';

const CRITICAL=[
  './',INDEX,'./launch-v21.html','./styles.css',CORE,'./pwa.js',
  './mobile-v04.css','./android16-v05.css','./android16-v06.css','./android16-v07.css','./v09-vibrant.css','./v10-zeus-fix.css','./profile-gate-v20.css','./profile-gate-v20.js',
  './data/matematik.js','./data/fen.js','./data/turkce.js','./data/inkilap.js','./data/din.js','./data/notes.js','./data/english-v18.js','./data/english-notes-v18.js',
  './assets/zeus.webp','./assets/zeus-real-v09.webp','./assets/icon-192.jpg','./assets/icon-512.webp','./manifest.webmanifest'
];

const EXTENDED=[
  './parent-tracking.css','./parent-tracking.js','./lgs-scoring.css','./lgs-scoring.js','./adaptive-v17.css','./adaptive-engine.js','./weekly-exam-v18.css','./weekly-exam-v18.js','./english-integration-v18.js','./pwa-health-v20.js',
  './data/bank-v011.js','./data/adaptive-bank-v17.js',
  './assets/zeus-v10/part-1.txt','./assets/zeus-v10/part-2.txt','./assets/zeus-v10/part-3a.txt','./assets/zeus-v10/part-3b.txt','./assets/zeus-v10/part-4.txt','./assets/zeus-v10/part-5a.txt','./assets/zeus-v10/part-5b.txt','./assets/zeus-v10/part-6.txt'
];

const sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms));

async function fetchRetry(url,attempts=3){
  let lastError;
  for(let i=0;i<attempts;i++){
    try{
      const response=await fetch(url,{cache:'reload'});
      if(!response.ok)throw new Error('HTTP '+response.status+' '+url);
      return response;
    }catch(error){
      lastError=error;
      if(i<attempts-1)await sleep(300+(i*450));
    }
  }
  throw lastError;
}

async function cacheOne(cache,url,required){
  try{
    const response=await fetchRetry(url,required?3:2);
    await cache.put(url,response.clone());
    return true;
  }catch(error){
    if(required)throw error;
    return false;
  }
}

self.addEventListener('install',event=>{
  event.waitUntil((async()=>{
    const cache=await caches.open(CACHE_NAME);
    await Promise.all(CRITICAL.map(url=>cacheOne(cache,url,true)));
    await Promise.allSettled(EXTENDED.map(url=>cacheOne(cache,url,false)));
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

async function refreshInBackground(request,cacheKey){
  try{
    const response=await fetch(request,{cache:'no-store'});
    if(response&&response.ok){
      const cache=await caches.open(CACHE_NAME);
      await cache.put(cacheKey||request,response.clone());
    }
  }catch(error){}
}

self.addEventListener('fetch',event=>{
  const request=event.request;
  if(request.method!=='GET')return;
  const url=new URL(request.url);
  if(url.origin!==self.location.origin)return;

  if(/\/app\.js$/.test(url.pathname)){
    event.respondWith((async()=>{
      const cached=await caches.match(CORE,{ignoreSearch:true});
      if(cached){event.waitUntil(refreshInBackground(CORE,CORE));return cached;}
      try{return await fetch(CORE,{cache:'no-store'});}catch(error){return new Response('/* LGS Arena core offline cache missing */',{headers:{'Content-Type':'application/javascript'}});}
    })());
    return;
  }

  if(request.mode==='navigate'){
    event.respondWith((async()=>{
      const cache=await caches.open(CACHE_NAME);
      const requested=await cache.match(request,{ignoreSearch:true});
      const fallback=requested||await cache.match(INDEX,{ignoreSearch:true});
      if(fallback){
        event.waitUntil(refreshInBackground(request,request));
        return fallback;
      }
      try{
        const response=await fetch(request,{cache:'no-store'});
        if(response&&response.ok)await cache.put(INDEX,response.clone());
        return response;
      }catch(error){
        return new Response('<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><body style="background:#020710;color:white;font-family:Arial;padding:24px"><h2>LGS Arena</h2><p>İlk çevrimdışı kullanım için uygulamanın en az bir kez internet bağlantısıyla tamamen açılması gerekiyor.</p></body>',{headers:{'Content-Type':'text/html; charset=utf-8'}});
      }
    })());
    return;
  }

  event.respondWith((async()=>{
    const cache=await caches.open(CACHE_NAME);
    const cached=await cache.match(request,{ignoreSearch:true});
    if(cached){
      event.waitUntil(refreshInBackground(request,request));
      return cached;
    }
    try{
      const response=await fetch(request);
      if(response&&response.ok&&response.type!=='opaque')await cache.put(request,response.clone());
      return response;
    }catch(error){
      return Response.error();
    }
  })());
});

self.addEventListener('message',event=>{
  if(event.data==='SKIP_WAITING')self.skipWaiting();
});
