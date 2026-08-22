const CACHE='lgs-2027-arena-v35';
const FALLBACK='./launch-v35.html?app=1&v=35';
self.addEventListener('install',e=>{e.waitUntil(self.skipWaiting())});
self.addEventListener('activate',e=>{e.waitUntil((async()=>{const keys=await caches.keys();await Promise.all(keys.filter(k=>/lgs-2027-arena/i.test(k)&&k!==CACHE).map(k=>caches.delete(k)));await self.clients.claim()})())});
self.addEventListener('fetch',e=>{
  const r=e.request;if(r.method!=='GET')return;
  const u=new URL(r.url);if(u.origin!==self.location.origin)return;
  if(r.mode==='navigate'){
    e.respondWith((async()=>{try{const net=await fetch(r,{cache:'no-store'});if(net&&net.ok){const c=await caches.open(CACHE);await c.put(r,net.clone())}return net}catch(err){const c=await caches.open(CACHE);return (await c.match(r,{ignoreSearch:true}))||(await c.match(FALLBACK,{ignoreSearch:true}))||Response.error()}})());return;
  }
  e.respondWith((async()=>{const c=await caches.open(CACHE);const hit=await c.match(r,{ignoreSearch:true});try{const net=await fetch(r);if(net&&net.ok&&net.type!=='opaque')await c.put(r,net.clone());return net}catch(err){return hit||Response.error()}})());
});