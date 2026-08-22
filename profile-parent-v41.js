(() => {
  'use strict';
  const KEY='lgsArenaPwaV02';
  const SUBJECTS=['Türkçe','Matematik','Fen Bilimleri','İnkılap Tarihi','Din Kültürü','İngilizce'];
  const $=s=>document.querySelector(s), byId=id=>document.getElementById(id);

  function read(){try{return JSON.parse(localStorage.getItem(KEY)||'{}')}catch{return {}}}
  function write(state){localStorage.setItem(KEY,JSON.stringify(state));window.dispatchEvent(new CustomEvent('arena:profile-updated',{detail:state}))}
  function ensurePairCode(state){if(!/^\d{6}$/.test(String(state.parentPairCode||''))){state.parentPairCode=String(Math.floor(100000+Math.random()*900000));write(state)}return state.parentPairCode}
  function today(){return new Date().toLocaleDateString('en-CA',{timeZone:'Europe/Istanbul'})}
  function esc(v){return String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
  function open(id){byId(id)?.classList.remove('hidden')}
  function close(id){byId(id)?.classList.add('hidden')}
  function nameOf(state){return (state.studentName||'Öğrenci').trim()||'Öğrenci'}

  function metrics(state){
    const rows=Array.isArray(state.history)?state.history:[];
    const normal=rows.filter(r=>!r.assisted);
    const answered=normal.filter(r=>r.selected!==null&&r.selected!==undefined);
    const correct=answered.filter(r=>r.correct).length;
    const wrong=Math.max(0,answered.length-correct);
    const blank=normal.filter(r=>r.selected===null||r.selected===undefined).length;
    const net=correct-wrong/3;
    const accuracy=answered.length?Math.round(correct/answered.length*100):0;
    const daily=(state.daily&&state.daily.date===today())?Number(state.daily.count||0):0;
    const perSubject=SUBJECTS.map(subject=>{
      const r=normal.filter(x=>x.subject===subject), a=r.filter(x=>x.selected!==null&&x.selected!==undefined), c=a.filter(x=>x.correct).length, w=Math.max(0,a.length-c);
      return {subject,n:r.length,answered:a.length,correct:c,wrong:w,net:c-w/3,accuracy:a.length?Math.round(c/a.length*100):0};
    });
    const active=perSubject.filter(x=>x.answered>0);
    const strong=active.length?[...active].sort((a,b)=>b.accuracy-a.accuracy)[0]:null;
    const weak=active.length?[...active].sort((a,b)=>a.accuracy-b.accuracy)[0]:null;
    const topics={};normal.filter(r=>r.selected!==null&&r.selected!==undefined).forEach(r=>{const k=r.topic||'Konu';topics[k]??={n:0,c:0};topics[k].n++;if(r.correct)topics[k].c++});
    const weakTopics=Object.entries(topics).map(([topic,v])=>({topic,pct:Math.round(v.c/v.n*100),n:v.n})).filter(x=>x.n>=1).sort((a,b)=>a.pct-b.pct).slice(0,4);
    const route=accuracy>=72?'Yeni Nesil ağırlıklı':accuracy>=58?'Dengeli Kazanım + Yeni Nesil':'Kazanım ağırlıklı';
    const difficulty=accuracy>=85?'Zor / Efsane':accuracy>=72?'Orta / Zor':accuracy>=58?'Orta':'Kolay / Orta';
    const studyMinutes=Math.round(rows.length*1.5);
    return {rows,correct,wrong,blank,net,accuracy,daily,perSubject,strong,weak,weakTopics,route,difficulty,studyMinutes};
  }

  function coachText(state,m){
    const timeouts=Number(state.timeoutTerminations||0);
    if(!m.rows.length)return 'Henüz yeterli çözüm verisi yok. İlk hedef, düzenli ve kısa çalışma oturumlarıyla başlangıç verisi oluşturmak.';
    if(timeouts>0)return `Süre nedeniyle ${timeouts} test tamamlanamadı. Bir süre hızdan çok süre farkındalığına odaklanıp kısa zamanlı pratikler yapmak daha sağlıklı olabilir.`;
    if(m.weak&&m.weak.accuracy<55)return `${m.weak.subject} tarafında temel kazanımları kısa tekrarlarla güçlendirmek, ardından benzer sorularla ilerlemek uygun görünüyor.`;
    return 'Genel gidişat dengeli. Günlük hedefi sürdürülebilir tutup zor soruları küçük kademelerle artırmak motivasyonu korur.';
  }

  function panelHtml(state){
    const m=metrics(state), code=ensurePairCode(state);
    return `<img class="pp-zeus-watermark" src="./assets/zeus.webp" alt="" aria-hidden="true"><div class="pp-head"><div><span>VELİ PANELİ · DEMO</span><h2>${esc(nameOf(state))}</h2></div><button class="pp-close" data-pp-close="parentPanel" aria-label="Kapat">×</button></div>
    <p class="pp-copy">Bu demo, yalnızca bu cihazdaki öğrenci verilerini okur. Farklı cihazlardan bağlantı için ileride merkezî hesap/backend sistemi kullanılacaktır.</p>
    <div class="pp-grid">
      <div class="pp-stat"><span>Bugün çözülen</span><b>${m.daily} soru</b></div>
      <div class="pp-stat"><span>Yaklaşık LGS neti</span><b>${m.net.toFixed(2)}</b></div>
      <div class="pp-stat"><span>Doğru / Yanlış / Boş</span><b>${m.correct} / ${m.wrong} / ${m.blank}</b></div>
      <div class="pp-stat"><span>Başarı oranı</span><b>%${m.accuracy}</b></div>
      <div class="pp-stat"><span>Güçlü ders</span><b>${esc(m.strong?.subject||'—')}</b></div>
      <div class="pp-stat"><span>Zayıf ders</span><b>${esc(m.weak?.subject||'—')}</b></div>
      <div class="pp-stat"><span>Seri / XP</span><b>${Number(state.streak||0)} gün / ${Number(state.xp||0)}</b></div>
      <div class="pp-stat"><span>Yaklaşık çalışma</span><b>${m.studyMinutes} dk</b></div>
      <div class="pp-stat"><span>Öğrenme rotası</span><b>${esc(m.route)}</b></div>
      <div class="pp-stat"><span>Zorluk dağılımı</span><b>${esc(m.difficulty)}</b></div>
      <div class="pp-stat wide"><span>Süre dolduğu için sonlanan test</span><b>${Number(state.timeoutTerminations||0)}</b></div>
    </div>
    <div class="pp-section"><h3>Ders bazında netler</h3><div class="pp-subjects">${m.perSubject.map(x=>`<div class="pp-subject"><span>${esc(x.subject)}</span><b>${x.net.toFixed(2)} net</b></div>`).join('')}</div></div>
    <div class="pp-section"><h3>Zayıf konular</h3><div class="pp-weak">${m.weakTopics.length?m.weakTopics.map(x=>`<span>${esc(x.topic)} · %${x.pct}</span>`).join(''):'<span>Henüz yeterli veri yok</span>'}</div></div>
    <div class="pp-section"><h3>Zeus Veli Koçluğu</h3><div class="pp-coach">${esc(coachText(state,m))}</div></div>
    <div class="pp-code"><span>Bu cihazın eşleştirme kodu</span><b>${code}</b></div>`;
  }

  function renderProfile(){
    const state=read(),code=ensurePairCode(state);
    byId('profileCard').innerHTML=`<div class="pp-head"><div><span>ÖĞRENCİ PROFİLİ</span><h2>Profil</h2></div><button class="pp-close" data-pp-close="profileOverlay" aria-label="Kapat">×</button></div>
      <p class="pp-copy">Profil demo aşamasında yalnızca bu cihazda saklanır. Arena'ya giriş için zorunlu değildir.</p>
      <label class="pp-field"><span>Öğrenci adı</span><input id="studentNameInput" maxlength="32" value="${esc(state.studentName||'')}" placeholder="Adını yaz"></label>
      <div class="pp-code"><span>Veli eşleştirme kodu</span><b>${code}</b></div>
      <p class="pp-note">Bu kod yalnızca demo eşleştirmesi içindir ve aynı cihazdaki verileri açar.</p>
      <button id="saveStudentProfile" class="pp-primary">PROFİLİ KAYDET</button>`;
    bindCloseButtons();
    byId('saveStudentProfile').onclick=()=>{const s=read();s.studentName=(byId('studentNameInput').value||'').trim();ensurePairCode(s);write(s);refreshChip();close('profileOverlay')};
  }

  function renderParentLogin(){
    byId('parentLoginCard').innerHTML=`<div class="pp-head"><div><span>VELİ GİRİŞİ</span><h2>Öğrenciyle eşleştir</h2></div><button class="pp-close" data-pp-close="parentLogin" aria-label="Kapat">×</button></div>
      <p class="pp-copy">Öğrenci profilinde görünen 6 haneli demo eşleştirme kodunu gir.</p>
      <label class="pp-field"><span>Eşleştirme kodu</span><input id="parentCodeInput" inputmode="numeric" maxlength="6" autocomplete="one-time-code" placeholder="000000"></label>
      <div id="parentLoginError" class="pp-error"></div>
      <button id="parentLoginBtn" class="pp-primary">VELİ PANELİNİ AÇ</button>`;
    bindCloseButtons();
    const submit=()=>{const s=read(),code=ensurePairCode(s),v=(byId('parentCodeInput').value||'').replace(/\D/g,'');if(v!==code){byId('parentLoginError').textContent='Eşleştirme kodu doğru değil.';return}close('parentLogin');byId('parentPanelCard').innerHTML=panelHtml(s);bindCloseButtons();open('parentPanel')};
    byId('parentLoginBtn').onclick=submit;byId('parentCodeInput').onkeydown=e=>{if(e.key==='Enter')submit()};
  }

  function bindCloseButtons(){document.querySelectorAll('[data-pp-close]').forEach(b=>b.onclick=()=>close(b.dataset.ppClose))}
  function refreshChip(){const s=read(),chip=byId('studentProfileChip');if(chip)chip.textContent=s.studentName?.trim()?s.studentName.trim():'Profil'}

  function installUi(){
    if(byId('parentEntry'))return;
    const cover=byId('cover');
    if(cover){const b=document.createElement('button');b.id='parentEntry';b.className='parent-entry';b.textContent='VELİ GİRİŞİ';b.onclick=()=>{renderParentLogin();open('parentLogin')};cover.appendChild(b)}
    const hero=$('.arena-hero-card');
    if(hero){const b=document.createElement('button');b.id='studentProfileChip';b.className='student-chip';b.textContent='Profil';b.onclick=()=>{renderProfile();open('profileOverlay')};hero.appendChild(b)}
    document.body.insertAdjacentHTML('beforeend',`
      <div id="profileOverlay" class="pp-overlay hidden"><section id="profileCard" class="pp-card" aria-modal="true" role="dialog"></section></div>
      <div id="parentLogin" class="pp-overlay hidden"><section id="parentLoginCard" class="pp-card" aria-modal="true" role="dialog"></section></div>
      <div id="parentPanel" class="pp-overlay hidden"><section id="parentPanelCard" class="pp-card" aria-modal="true" role="dialog"></section></div>`);
    [byId('profileOverlay'),byId('parentLogin'),byId('parentPanel')].forEach(overlay=>overlay?.addEventListener('click',e=>{if(e.target===overlay)overlay.classList.add('hidden')}));
    refreshChip();
    window.addEventListener('arena:profile-updated',refreshChip);
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',installUi,{once:true});else installUi();
  window.LgsArenaParent={openProfile:()=>{renderProfile();open('profileOverlay')},openParentLogin:()=>{renderParentLogin();open('parentLogin')},metrics:()=>metrics(read())};
})();