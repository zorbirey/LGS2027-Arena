(()=>{
  'use strict';
  const config=window.ARENA_CORE_CONFIG?.identity;
  const bridgeApi=window.ArenaAuthBridgeV1;
  if(!config?.enabled||!bridgeApi)return;

  const auth=bridgeApi.createBridge(config);
  let message='Hesabınız varsa giriş yapın. Yeni hesaplarda doğrulama e-postası Spam veya Gereksiz klasörüne düşebilir.';
  let tone='info';
  let busy=false;

  const byId=id=>document.getElementById(id);
  const escapeHtml=value=>String(value??'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
  const friendlyError=error=>{
    const code=String(error?.code||error?.message||'');
    if(code.startsWith('E-posta')||code.startsWith('Parolanız')||code.startsWith('Yeni hesap'))return code;
    if(code.includes('email-already-in-use'))return 'Bu e-posta ile daha önce hesap oluşturulmuş. Giriş yapmayı deneyin.';
    if(code.includes('invalid-email'))return 'Geçerli bir e-posta adresi yazın.';
    if(code.includes('weak-password'))return 'Parolanız en az 12 karakter olmalıdır.';
    if(code.includes('invalid-credential'))return 'E-posta veya parola eşleşmiyor. Yeni hesap açıyorsanız GİRİŞ YAP yerine HESAP OLUŞTUR düğmesini kullanın.';
    if(code.includes('too-many-requests'))return 'Çok fazla deneme yapıldı. Bir süre sonra yeniden deneyin.';
    if(code.includes('network-request-failed'))return 'İnternet bağlantısı kurulamadı.';
    if(code.includes('email_verification_required'))return 'E-posta adresiniz doğrulanmamış. Gelen kutunuzdaki bağlantıya dokunun.';
    return 'İşlem tamamlanamadı. Bilgileri kontrol edip yeniden deneyin.';
  };

  function panelMarkup(){
    const user=auth.currentUser();
    if(user?.emailVerified){
      return `<section id="arenaAuthPanel" class="arena-auth-panel is-signed-in"><div class="arena-auth-head"><div><span>ARENA HESABI</span><h3>Giriş yapıldı</h3></div><b>DOĞRULANDI</b></div><p>${escapeHtml(user.displayName||'Öğrenci')} hesabı bu oturumda güvenli biçimde açık.</p><button id="arenaAuthSignOut" class="arena-auth-secondary" type="button">HESAPTAN ÇIK</button><small>Kimlik belirteci localStorage alanına yazılmaz.</small></section>`;
    }
    return `<section id="arenaAuthPanel" class="arena-auth-panel"><div class="arena-auth-head"><div><span>ARENA HESABI</span><h3>Kayıt ol veya giriş yap</h3></div><b>TEST</b></div><p id="arenaAuthMessage" class="arena-auth-message ${tone}">${escapeHtml(message)}</p><label><span>E-posta</span><input id="arenaAuthEmail" type="email" inputmode="email" autocomplete="email" maxlength="160" placeholder="ornek@eposta.com"></label><label><span>Parola</span><input id="arenaAuthPassword" type="password" autocomplete="current-password" minlength="12" maxlength="64" aria-describedby="arenaAuthPasswordRules" placeholder="12-64 karakter"></label><ul id="arenaAuthPasswordRules" class="arena-auth-password-rules"><li>Yeni hesaplarda 12-64 karakter kullanın.</li><li>Türkçe harf ve boşluk kullanmayın.</li><li>İngilizce harf, rakam ve sembol kullanabilirsiniz.</li></ul><div class="arena-auth-actions"><button id="arenaAuthSignIn" type="button">GİRİŞ YAP</button><button id="arenaAuthSignUp" type="button">HESAP OLUŞTUR</button></div><button id="arenaAuthReset" class="arena-auth-link" type="button">Parolamı unuttum</button><small>Oturum yalnız bu sekmede tutulur; mevcut ilerleme verileriniz silinmez.</small></section>`;
  }

  function setMessage(value,nextTone='info'){
    message=value;tone=nextTone;
    const target=byId('arenaAuthMessage');
    if(target){target.textContent=value;target.className=`arena-auth-message ${nextTone}`}
  }

  function credentials(newAccount=false){
    const email=(byId('arenaAuthEmail')?.value||'').trim();
    const password=byId('arenaAuthPassword')?.value||'';
    if(!email)throw new Error('E-posta adresinizi yazın.');
    if(password.length<12||password.length>64)throw new Error('Parolanız 12-64 karakter arasında olmalıdır.');
    if(newAccount&&!/^[\x21-\x7E]+$/.test(password))throw new Error('Yeni hesap parolasında Türkçe harf veya boşluk kullanmayın; İngilizce harf, rakam ve sembol kullanın.');
    return {email,password};
  }

  async function run(task){
    if(busy)return;busy=true;
    document.querySelectorAll('#arenaAuthPanel button').forEach(button=>button.disabled=true);
    try{await task()}catch(error){setMessage(friendlyError(error),'error')}
    finally{busy=false;document.querySelectorAll('#arenaAuthPanel button').forEach(button=>button.disabled=false)}
  }

  function bindPanel(){
    const panel=byId('arenaAuthPanel');if(!panel||panel.dataset.bound==='1')return;panel.dataset.bound='1';
    const signOut=byId('arenaAuthSignOut');
    if(signOut){signOut.onclick=()=>run(async()=>{await auth.signOut();message='Hesaptan çıkış yapıldı.';tone='success';refreshPanel(true)});return}
    byId('arenaAuthSignIn').onclick=()=>run(async()=>{const data=credentials(false);await auth.signIn(data);message='Giriş başarılı.';tone='success';refreshPanel(true)});
    byId('arenaAuthSignUp').onclick=()=>run(async()=>{const data=credentials(true),displayName=(byId('studentNameInput')?.value||'').trim();await auth.signUp({...data,displayName});await auth.signOut();setMessage('Doğrulama e-postası gönderildi. Gelen kutusunda görünmüyorsa Spam veya Gereksiz klasörünü kontrol edin; bağlantıya dokunduktan sonra giriş yapın.','success')});
    byId('arenaAuthReset').onclick=()=>run(async()=>{const email=(byId('arenaAuthEmail')?.value||'').trim();if(!email)throw new Error('E-posta adresinizi yazın.');await auth.sendPasswordReset(email);setMessage('Parola yenileme bağlantısı e-posta adresinize gönderildi.','success')});
  }

  function refreshPanel(force=false){
    const card=byId('profileCard');if(!card)return;
    let panel=byId('arenaAuthPanel');
    if(!panel||force){
      panel?.remove();
      const system=card.querySelector('.pp-system');
      if(system)system.insertAdjacentHTML('beforebegin',panelMarkup());else card.insertAdjacentHTML('beforeend',panelMarkup());
    }
    bindPanel();
  }

  const observer=new MutationObserver(()=>queueMicrotask(()=>refreshPanel(false)));
  observer.observe(document.body,{childList:true,subtree:true});
  document.addEventListener('click',event=>{if(event.target.closest('#studentProfileChip'))setTimeout(()=>refreshPanel(false),0)},true);
  window.addEventListener('lgsarena:parent-ready',()=>refreshPanel(false));
  auth.onChange(()=>refreshPanel(true));
  auth.init().then(()=>refreshPanel(true)).catch(error=>{message=friendlyError(error);tone='error';refreshPanel(true)});
  Object.defineProperty(window,'LgsArenaAuth',{value:Object.freeze({bridge:auth,refresh:refreshPanel}),configurable:false,writable:false});
})();
