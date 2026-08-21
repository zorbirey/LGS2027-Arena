const CACHE_NAME='lgs-2027-arena-pwa-v2.5-cover-entry';
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

const COVER_BOOTSTRAP=`<script id="arenaCoverBootstrap">(function(){
'use strict';
var PROFILE_KEY='lgsArenaStudentProfileV20',PARENT_KEY='lgsArenaParentPortalV2';
function byId(x){return document.getElementById(x)}
function read(key){try{return JSON.parse(localStorage.getItem(key)||'{}')||{}}catch(e){return {}}}
function saveName(name){var old=read(PROFILE_KEY),p={name:name,createdAt:old.createdAt||new Date().toISOString(),updatedAt:new Date().toISOString(),storage:'device-demo'};try{localStorage.setItem(PROFILE_KEY,JSON.stringify(p));var parent=read(PARENT_KEY);parent.studentName=name;localStorage.setItem(PARENT_KEY,JSON.stringify(parent))}catch(e){}return p}
function enter(name){var cover=byId('cover'),shell=byId('shell');if(cover){cover.classList.remove('active');cover.classList.add('hidden')}if(shell)shell.classList.remove('hidden');var chip=byId('studentNameChip');if(!chip){chip=document.createElement('div');chip.id='studentNameChip';chip.className='student-name-chip';var brand=document.querySelector('.brand');if(brand)brand.appendChild(chip)}if(chip)chip.textContent=name;try{window.dispatchEvent(new CustomEvent('lgsarena:student-enter',{detail:{name:name}}))}catch(e){}}
function open(){if(window.LgsArenaStudentProfile&&typeof window.LgsArenaStudentProfile.open==='function'){window.LgsArenaStudentProfile.open();return}var p=read(PROFILE_KEY),name=String(p.name||'').trim();if(!name){name=String(window.prompt('Öğrenci adını yazın')||'').trim();if(name.length<2)return;saveName(name)}enter(name)}
function bind(){var b=byId('skipCover');if(!b||b.getAttribute('data-cover-bootstrap')==='1')return;b.setAttribute('data-cover-bootstrap','1');b.addEventListener('click',function(e){if(e&&e.isTrusted===false)return;if(e)e.preventDefault();open()},true)}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',bind);else bind();
})();<\/script>`;

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

async function injectCoverBootstrap(response){
  if(!response)return response;
  const type=response.headers.get('content-type')||'';
  if(type&&type.indexOf('text/html')===-1)return response;
  try{
    let html=await response.text();
    if(html.indexOf('arenaCoverBootstrap')===-1){
      html=html.indexOf('</body>')>=0?html.replace('</body>',COVER_BOOTSTRAP+'</body>'):html+COVER_BOOTSTRAP;
    }
    const headers=new Headers(response.headers);
    headers.set('Content-Type','text/html; charset=utf-8');
    headers.set('Cache-Control','no-cache');
    return new Response(html,{status:response.status,statusText:response.statusText,headers});
  }catch(error){
    return response;
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
        return injectCoverBootstrap(fallback);
      }
      try{
        const response=await fetch(request,{cache:'no-store'});
        if(response&&response.ok)await cache.put(INDEX,response.clone());
        return injectCoverBootstrap(response);
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
