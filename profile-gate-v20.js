(() => {
  'use strict';
  const PROFILE_KEY='lgsArenaStudentProfileV20';
  const PARENT_KEY='lgsArenaParentPortalV2';
  const $=id=>document.getElementById(id);
  function read(key){try{return JSON.parse(localStorage.getItem(key)||'{}')}catch{return {}}}
  function esc(v=''){return String(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
  function profile(){return read(PROFILE_KEY)}
  function saveProfile(name){
    const p={name:name.trim(),createdAt:profile().createdAt||new Date().toISOString(),updatedAt:new Date().toISOString(),storage:'device-demo'};
    localStorage.setItem(PROFILE_KEY,JSON.stringify(p));
    const parent={...read(PARENT_KEY),studentName:p.name};localStorage.setItem(PARENT_KEY,JSON.stringify(parent));
    return p;
  }
  function ensure(){
    if($('studentProfileOverlay'))return;
    const el=document.createElement('div');el.id='studentProfileOverlay';el.className='student-profile-overlay hidden';
    document.body.appendChild(el);
  }
  function openParentWhenReady(attempt=0){
    if(window.LgsArenaParentPortal?.open){window.LgsArenaParentPortal.open();return}
    if(attempt<20)setTimeout(()=>openParentWhenReady(attempt+1),150);
  }
  function render(){
    ensure();const p=profile(),has=!!p.name;const el=$('studentProfileOverlay');
    el.innerHTML=`<section class="student-profile-card" role="dialog" aria-modal="true" aria-label="Öğrenci girişi">
      <div class="student-profile-mark">⚡</div><span>LGS ARENA</span><h2>${has?`Hoş geldin, ${esc(p.name)}`:'Öğrenci Girişi'}</h2>
      <p>${has?'Bu cihazdaki çalışma geçmişinle devam edebilirsin.':'İlerlemeni kişiselleştirmek için adını veya kullanmak istediğin öğrenci adını gir.'}</p>
      ${has?'':`<label><span>Öğrenci adı</span><input id="studentProfileName" maxlength="24" autocomplete="nickname" placeholder="Örn. Kaan"></label>`}
      <button id="studentProfileContinue" class="student-profile-primary">${has?'ARENAYA DEVAM ET':'PROFİLİ OLUŞTUR VE DEVAM ET'}</button>
      <button id="studentProfileParent" class="student-profile-secondary">VELİ GİRİŞİ</button>
      ${has?'<button id="studentProfileChange" class="student-profile-link">Farklı öğrenci adı kullan</button>':''}
      <small>Demo sürümünde ilerleme bu cihazda saklanır. Gerçek hesap sistemi sunucuya bağlandığında telefon değişse de ilerleme korunacaktır.</small>
    </section>`;
    $('studentProfileContinue').onclick=()=>{
      let current=profile();
      if(!current.name){const input=$('studentProfileName');const name=input?.value.trim()||'';if(name.length<2){input?.focus();return}current=saveProfile(name)}
      enterArena(current.name);
    };
    $('studentProfileParent').onclick=()=>{el.classList.add('hidden');openParentWhenReady()};
    $('studentProfileChange')?.addEventListener('click',()=>{localStorage.removeItem(PROFILE_KEY);render();$('studentProfileName')?.focus()});
  }
  function enterArena(name){
    $('studentProfileOverlay')?.classList.add('hidden');$('cover')?.classList.remove('active');$('cover')?.classList.add('hidden');$('shell')?.classList.remove('hidden');
    let chip=$('studentNameChip');if(!chip){chip=document.createElement('div');chip.id='studentNameChip';chip.className='student-name-chip';const brand=document.querySelector('.brand');brand?.appendChild(chip)}
    if(chip)chip.textContent=name;
    window.dispatchEvent(new CustomEvent('lgsarena:student-enter',{detail:{name}}));
  }
  function openGate(){render();$('studentProfileOverlay')?.classList.remove('hidden');}
  function bind(){
    ensure();const cover=$('skipCover');if(cover&&!cover.dataset.profileGate){cover.dataset.profileGate='1';cover.addEventListener('click',e=>{e.preventDefault();e.stopImmediatePropagation();if(!e.isTrusted)return;openGate()},true)}
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',bind);else bind();
  window.LgsArenaStudentProfile={open:openGate,get:profile,save:saveProfile};
})();