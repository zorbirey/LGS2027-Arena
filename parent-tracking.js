(() => {
  'use strict';

  const STATE_KEY = 'lgsArenaPwaV02';
  const PARENT_KEY = 'lgsArenaParentPortalV2';
  const DEMO_PAIR_CODE = '202727';
  const defaults = { linked:false, studentName:'LGS 2027 Öğrencisi', linkedAt:'' };
  let parentState = readParent();

  function readParent(){ try{return {...defaults,...JSON.parse(localStorage.getItem(PARENT_KEY)||'{}')}}catch{return {...defaults}} }
  function saveParent(){ localStorage.setItem(PARENT_KEY,JSON.stringify(parentState)); renderAccessCard(); }
  function appState(){ try{return JSON.parse(localStorage.getItem(STATE_KEY)||'{}')}catch{return {}} }
  function esc(v=''){ return String(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }
  function trNum(n,digits=0){ return Number(n||0).toLocaleString('tr-TR',{minimumFractionDigits:digits,maximumFractionDigits:digits}); }

  function todayRows(){
    const s=appState(), history=Array.isArray(s.history)?s.history:[];
    const count=Math.max(0,Number(s.daily?.count||0));
    return count ? history.slice(-Math.min(count,history.length)) : [];
  }
  function usableRows(rows){ return rows.filter(r=>!r.assisted && r.selected!==null); }
  function subjectStats(rows){
    const map={};
    rows.forEach(r=>{
      if(!r.subject) return;
      map[r.subject] ||= {name:r.subject,n:0,c:0,w:0};
      if(!r.assisted && r.selected!==null){ map[r.subject].n++; r.correct?map[r.subject].c++:map[r.subject].w++; }
    });
    return Object.values(map).filter(x=>x.n).map(x=>({...x,pct:Math.round(x.c/x.n*100)}));
  }
  function weakestTopic(rows){
    const map={};
    rows.forEach(r=>{
      if(!r.topic) return;
      map[r.topic] ||= {topic:r.topic,n:0,c:0,w:0,b:0,a:0};
      const x=map[r.topic]; x.n++;
      if(r.assisted)x.a++; else if(r.selected===null)x.b++; else if(r.correct)x.c++; else x.w++;
    });
    const list=Object.values(map).map(x=>({...x,score:x.w*2+x.b+x.a*.7-x.c*.15})).sort((a,b)=>b.score-a.score);
    return list[0] || null;
  }
  function deficiency(d){
    if(!d.total) return 'Bugün çalışma başlamadı';
    if(d.assisted>=2) return 'Yardım almadan çözüm üretme ve kavramı hatırlama';
    if(d.blank>=Math.max(2,d.wrong)) return 'Süre yönetimi ve seçenekler arasında karar verme';
    if(d.accuracy<55) return `${d.weakTopic}: temel kavramları pekiştirme ve soru tipini tanıma`;
    if(d.wrong>=3) return `${d.weakTopic}: yanlış analizi, işlem kontrolü ve dikkat`;
    return `${d.weakTopic}: hız ve kalıcılık için kısa tekrar`;
  }
  function zeusAdvice(d){
    if(!d.total) return 'Bugün 10 soruluk kısa bir çalışma ile başlasın. İlk veriler geldikten sonra hedefi otomatik daraltacağım.';
    if(d.blank>=Math.max(2,d.wrong)) return `Yarın ${d.weakTopic} konusundan 10 soruyu süre tutarak çözsün. Boş bıraktığı soruları test bitince tek tek inceleyelim.`;
    if(d.assisted>=2) return `Yarın ${d.weakTopic} için önce 1 Akıllı Not, ardından yardım almadan 10 hedef soru öneriyorum.`;
    if(d.accuracy<65) return `${d.weakTopic} konusunda 10 hedef soru + yanlış analizi öneriyorum. Amaç önce doğruluğu %75'in üzerine çıkarmak.`;
    return `${d.weakTopic} konusundan 10 pekiştirme sorusu çözüp ardından güçlü olduğu ${d.strongSubject} dersinde temposunu korusun.`;
  }
  function reportData(){
    const s=appState();
    const today=todayRows();
    const fallback=(Array.isArray(s.history)?s.history:[]).slice(-80);
    const basis=today.length?today:fallback;
    const scored=usableRows(today);
    const correct=scored.filter(r=>r.correct).length;
    const wrong=scored.length-correct;
    const assisted=today.filter(r=>r.assisted).length;
    const blank=today.filter(r=>!r.assisted && r.selected===null).length;
    const total=Math.max(Number(s.daily?.count||0),today.length);
    const accuracy=scored.length?Math.round(correct/scored.length*100):0;
    const net=correct-wrong/3;
    const subjects=subjectStats(basis).sort((a,b)=>b.pct-a.pct || b.n-a.n);
    const strongSubject=subjects[0]?.name||'Henüz veri yok';
    const weakSubject=subjects.length?subjects[subjects.length-1].name:'Henüz veri yok';
    const wt=weakestTopic(basis);
    const weakTopic=wt?.topic||'Henüz veri yok';
    const data={total,correct,wrong,blank,assisted,accuracy,net,strongSubject,weakSubject,weakTopic,estimatedMinutes:Math.max(0,Math.round(total*1.25)),streak:Number(s.streak||1),xp:Number(s.xp||0)};
    data.deficiency=deficiency(data);
    data.zeus=zeusAdvice(data);
    return data;
  }

  function toast(msg){
    const el=document.getElementById('toast');
    if(el){el.textContent=msg;el.classList.remove('hidden');clearTimeout(window.__parentPortalToast);window.__parentPortalToast=setTimeout(()=>el.classList.add('hidden'),2800)}
  }

  function ensureCoverEntry(){
    if(document.getElementById('parentCoverEntry')) return;
    const cover=document.getElementById('cover');
    const arenaBtn=document.getElementById('skipCover');
    if(!cover||!arenaBtn) return;
    const btn=document.createElement('button');
    btn.id='parentCoverEntry'; btn.className='parent-cover-entry'; btn.type='button';
    btn.innerHTML='<span>👨‍👩‍👧</span> VELİ GİRİŞİ';
    btn.addEventListener('click',e=>{e.preventDefault();e.stopPropagation();openPortal()});
    cover.appendChild(btn);
  }

  function ensureAccessCard(){
    if(document.getElementById('parentTrackingCard')) return;
    const progress=document.querySelector('[data-page="progress"]');
    if(!progress) return;
    const target=progress.querySelector('.plan-card')||progress.lastElementChild;
    const card=document.createElement('section');
    card.id='parentTrackingCard'; card.className='parent-track-card';
    card.innerHTML=`<div class="parent-card-icon">👨‍👩‍👧</div><div class="parent-card-copy"><span>PREMIUM · VELİ PANELİ</span><b>Öğrenci Karnesi</b><small id="parentCardStatus"></small></div><button id="openParentTracking">Aç</button>`;
    progress.insertBefore(card,target);
    card.querySelector('#openParentTracking').onclick=openPortal;
  }
  function renderAccessCard(){
    ensureAccessCard();
    const el=document.getElementById('parentCardStatus');
    if(el) el.textContent=parentState.linked?'Veli hesabı öğrenciyle eşleştirildi':'Telefon numarası olmadan eşleştir';
  }

  function ensurePortal(){
    if(document.getElementById('parentPortalOverlay')) return;
    const overlay=document.createElement('div');
    overlay.id='parentPortalOverlay'; overlay.className='parent-portal-overlay hidden';
    overlay.innerHTML=`
      <section class="parent-portal" role="dialog" aria-modal="true" aria-label="LGS Arena Veli Paneli">
        <header class="parent-portal-head"><button id="closeParentPortal" aria-label="Kapat">‹</button><div><span>VELİ GİRİŞİ</span><h2>LGS Arena Veli Paneli</h2></div><em>PREMIUM</em></header>
        <div id="parentLoginView" class="parent-login-view">
          <div class="parent-login-mark">👨‍👩‍👧</div>
          <h3>Öğrencinin gelişimini kendi ekranından takip et</h3>
          <p>Telefon numarası ve SMS yok. Gerçek sürümde öğrenci hesabının ürettiği tek kullanımlık eşleştirme kodu ile veli hesabı bağlanacak.</p>
          <label><span>Öğrenci eşleştirme kodu</span><input id="parentPairCode" inputmode="numeric" maxlength="6" placeholder="6 haneli kod"></label>
          <button id="parentPairButton" class="parent-main-btn">Veli Panelini Aç</button>
          <small>Demo eşleştirme kodu: <b>${DEMO_PAIR_CODE}</b></small>
        </div>
        <div id="parentDashboardView" class="parent-dashboard-view hidden">
          <div class="parent-student-strip"><div><span>ÖĞRENCİ</span><b id="parentStudentName">LGS 2027 Öğrencisi</b></div><button id="refreshParentDashboard">↻ Yenile</button></div>
          <section class="parent-today-hero"><div><span>BUGÜN</span><strong id="pTotal">0</strong><small>soru çözdü</small></div><i></i><div><span>LGS NETİ</span><strong id="pNet">0,00</strong><small>3 yanlış = 1 doğru</small></div></section>
          <div class="parent-kpi-grid"><div><span>Doğru</span><b id="pCorrect">0</b></div><div><span>Yanlış</span><b id="pWrong">0</b></div><div><span>Boş</span><b id="pBlank">0</b></div><div><span>Başarı</span><b id="pAccuracy">%0</b></div></div>
          <section class="parent-insight-card"><div class="parent-insight-row"><span>En güçlü ders</span><b id="pStrong">—</b></div><div class="parent-insight-row warn"><span>Zayıf ders</span><b id="pWeakSubject">—</b></div><div class="parent-insight-row danger"><span>Zayıf konu</span><b id="pWeakTopic">—</b></div><div class="parent-insight-row"><span>Eksik yönü</span><b id="pDeficiency">—</b></div></section>
          <div class="parent-mini-grid"><div><span>Çalışma</span><b id="pMinutes">~0 dk</b></div><div><span>Seri</span><b id="pStreak">1 gün</b></div><div><span>XP</span><b id="pXp">0</b></div></div>
          <section class="parent-zeus-coach"><div class="parent-zeus-icon">⚡</div><div><span>ZEUS KOÇLUK ÖNERİSİ</span><p id="pZeusAdvice"></p></div></section>
          <div class="parent-dashboard-actions"><button id="unlinkParent" class="parent-secondary-btn">Eşleştirmeyi Kaldır</button><button id="closeParentDashboard" class="parent-main-btn">Tamam</button></div>
          <p class="parent-demo-note">Demo şu anda aynı cihazdaki öğrenci verilerini gösterir. Üretimde veli hesabı farklı telefondan giriş yapacak ve veriler merkezi hesaptan güvenli biçimde okunacak.</p>
        </div>
      </section>`;
    document.body.appendChild(overlay);
    overlay.querySelector('#closeParentPortal').onclick=closePortal;
    overlay.querySelector('#closeParentDashboard').onclick=closePortal;
    overlay.addEventListener('click',e=>{if(e.target===overlay)closePortal()});
    overlay.querySelector('#parentPairButton').onclick=()=>{
      const code=overlay.querySelector('#parentPairCode').value.trim();
      if(code!==DEMO_PAIR_CODE){toast(`Demo eşleştirme kodu ${DEMO_PAIR_CODE}.`);return}
      parentState={...parentState,linked:true,linkedAt:new Date().toISOString()}; saveParent(); showDashboard(); toast('Veli hesabı öğrenciyle eşleştirildi.');
    };
    overlay.querySelector('#refreshParentDashboard').onclick=()=>{renderDashboard();toast('Karne güncellendi.')};
    overlay.querySelector('#unlinkParent').onclick=()=>{parentState={...defaults};saveParent();showLogin();toast('Veli eşleştirmesi kaldırıldı.')};
  }

  function renderDashboard(){
    const d=reportData();
    const set=(id,val)=>{const el=document.getElementById(id);if(el)el.textContent=val};
    set('parentStudentName',parentState.studentName||'LGS 2027 Öğrencisi');
    set('pTotal',trNum(d.total)); set('pNet',trNum(d.net,2));
    set('pCorrect',trNum(d.correct)); set('pWrong',trNum(d.wrong)); set('pBlank',trNum(d.blank)); set('pAccuracy',`%${d.accuracy}`);
    set('pStrong',d.strongSubject); set('pWeakSubject',d.weakSubject); set('pWeakTopic',d.weakTopic); set('pDeficiency',d.deficiency);
    set('pMinutes',`~${d.estimatedMinutes} dk`); set('pStreak',`${d.streak} gün`); set('pXp',trNum(d.xp)); set('pZeusAdvice',d.zeus);
  }
  function showLogin(){document.getElementById('parentLoginView')?.classList.remove('hidden');document.getElementById('parentDashboardView')?.classList.add('hidden')}
  function showDashboard(){document.getElementById('parentLoginView')?.classList.add('hidden');document.getElementById('parentDashboardView')?.classList.remove('hidden');renderDashboard()}
  function openPortal(){ensurePortal();parentState.linked?showDashboard():showLogin();document.getElementById('parentPortalOverlay').classList.remove('hidden')}
  function closePortal(){document.getElementById('parentPortalOverlay')?.classList.add('hidden')}

  function init(){ensureCoverEntry();ensureAccessCard();ensurePortal();renderAccessCard();if(location.hash==='#parent')setTimeout(openPortal,250)}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
  window.LgsArenaParentPortal={open:openPortal,refresh:renderDashboard};
})();