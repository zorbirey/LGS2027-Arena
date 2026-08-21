(() => {
  'use strict';
  const FLAG='lgsArenaPwaRecoveryV20';
  function coreReady(){
    const quick=document.getElementById('quickStart');
    const nav=document.querySelector('#bottomNav [data-nav="subjects"]');
    return typeof quick?.onclick==='function' && typeof nav?.onclick==='function';
  }
  async function recover(){
    if(coreReady()){sessionStorage.removeItem(FLAG);return}
    if(sessionStorage.getItem(FLAG)==='1'){
      const t=document.getElementById('toast');if(t){t.textContent='Uygulama çekirdeği yüklenemedi. İnternet bağlantısını kontrol edip uygulamayı yeniden aç.';t.classList.remove('hidden')}
      return;
    }
    sessionStorage.setItem(FLAG,'1');
    try{if('caches'in window){const keys=await caches.keys();await Promise.all(keys.filter(k=>/lgs-2027-arena-pwa/i.test(k)).map(k=>caches.delete(k)))}}catch{}
    try{if('serviceWorker'in navigator){const regs=await navigator.serviceWorker.getRegistrations();await Promise.all(regs.map(r=>r.update().catch(()=>{})))}}catch{}
    const u=new URL(location.href);u.searchParams.set('v','20');u.searchParams.set('recover',Date.now().toString());location.replace(u.toString());
  }
  window.addEventListener('load',()=>setTimeout(recover,900));
})();