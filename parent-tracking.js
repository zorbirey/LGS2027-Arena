(() => {
  'use strict';

  const STATE_KEY = 'lgsArenaPwaV02';
  const PARENT_KEY = 'lgsArenaParentV1';
  const defaultParent = {
    phone: '',
    verified: false,
    dailyEnabled: true,
    weeklyEnabled: true,
    criticalEnabled: true,
    dailyTime: '20:30',
    consent: false,
    lastSent: ''
  };

  let parentState = readParent();

  function readParent(){
    try { return {...defaultParent, ...JSON.parse(localStorage.getItem(PARENT_KEY) || '{}')}; }
    catch { return {...defaultParent}; }
  }
  function saveParent(){ localStorage.setItem(PARENT_KEY, JSON.stringify(parentState)); renderCard(); }
  function appState(){
    try { return JSON.parse(localStorage.getItem(STATE_KEY) || '{}'); }
    catch { return {}; }
  }
  function esc(value=''){ return String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }
  function maskPhone(phone){
    const d = String(phone).replace(/\D/g,'');
    if(d.length < 10) return phone || 'Telefon eklenmedi';
    return `+90 ${d.slice(-10,-7)} *** ** ${d.slice(-2)}`;
  }
  function todayRows(){
    const s = appState();
    const history = Array.isArray(s.history) ? s.history : [];
    const count = Math.max(0, Number(s.daily?.count || 0));
    return count ? history.slice(-Math.min(count, history.length)) : [];
  }
  function reportData(){
    const s = appState();
    const rows = todayRows();
    const scored = rows.filter(r => !r.assisted && r.selected !== null);
    const correct = scored.filter(r => r.correct).length;
    const wrong = scored.length - correct;
    const assisted = rows.filter(r => r.assisted).length;
    const blank = rows.filter(r => !r.assisted && r.selected === null).length;
    const accuracy = scored.length ? Math.round(correct / scored.length * 100) : 0;
    const bySubject = {};
    rows.forEach(r => {
      if(!r.subject) return;
      bySubject[r.subject] ||= {n:0,c:0};
      if(!r.assisted && r.selected !== null){
        bySubject[r.subject].n++;
        if(r.correct) bySubject[r.subject].c++;
      }
    });
    const subjectStats = Object.entries(bySubject).map(([name,v]) => ({name, pct:v.n ? Math.round(v.c/v.n*100) : 0, n:v.n})).filter(x=>x.n);
    subjectStats.sort((a,b)=>b.pct-a.pct);
    const strong = subjectStats[0]?.name || 'Henüz veri yok';
    const weak = subjectStats.length ? subjectStats[subjectStats.length-1].name : 'Henüz veri yok';
    return {
      total: Number(s.daily?.count || 0), correct, wrong, blank, assisted, accuracy,
      xp: Number(s.xp || 0), streak: Number(s.streak || 1), strong, weak,
      estimatedMinutes: Math.max(0, Math.round(Number(s.daily?.count || 0) * 1.25))
    };
  }

  function toast(msg){
    const el = document.getElementById('toast');
    if(el){ el.textContent=msg; el.classList.remove('hidden'); clearTimeout(window.__parentToast); window.__parentToast=setTimeout(()=>el.classList.add('hidden'),3000); }
    else alert(msg);
  }

  function ensureCard(){
    if(document.getElementById('parentTrackingCard')) return;
    const progress = document.querySelector('[data-page="progress"]');
    if(!progress) return;
    const target = progress.querySelector('.plan-card') || progress.lastElementChild;
    const card = document.createElement('section');
    card.id = 'parentTrackingCard';
    card.className = 'parent-track-card';
    card.innerHTML = `
      <div class="parent-card-icon" aria-hidden="true">👨‍👩‍👧</div>
      <div class="parent-card-copy"><span>PREMIUM · VELİ TAKİBİ</span><b>Günlük Karne</b><small id="parentCardStatus">Kurulum yapılmadı</small></div>
      <button id="openParentTracking">Aç</button>`;
    progress.insertBefore(card, target);
    card.querySelector('#openParentTracking').addEventListener('click', openPanel);
  }

  function renderCard(){
    ensureCard();
    const status = document.getElementById('parentCardStatus');
    if(!status) return;
    if(parentState.verified && parentState.dailyEnabled) status.textContent = `${maskPhone(parentState.phone)} · Her gün ${parentState.dailyTime}`;
    else if(parentState.verified) status.textContent = `${maskPhone(parentState.phone)} · Rapor kapalı`;
    else if(parentState.phone) status.textContent = 'Telefon doğrulaması bekleniyor';
    else status.textContent = 'Veli telefonunu ekle';
  }

  function ensurePanel(){
    if(document.getElementById('parentTrackingOverlay')) return;
    const overlay = document.createElement('div');
    overlay.id = 'parentTrackingOverlay';
    overlay.className = 'parent-overlay hidden';
    overlay.innerHTML = `
      <section class="parent-sheet" role="dialog" aria-modal="true" aria-label="Veli Takip Modülü">
        <header class="parent-sheet-head">
          <button id="closeParentTracking" aria-label="Kapat">‹</button>
          <div><span>VELİ TAKİP MODÜLÜ</span><h2>Günlük Karne</h2></div>
          <em>PREMIUM</em>
        </header>
        <div class="parent-tabs">
          <button class="selected" data-parent-tab="setup">Kurulum</button>
          <button data-parent-tab="report">Karne Önizleme</button>
        </div>
        <div class="parent-tab-panel" data-parent-panel="setup">
          <div class="parent-hero-note"><b>Veli, öğrencinin günlük ilerlemesini kendi telefonundan takip eder.</b><span>Gerçek sürümde numara SMS koduyla doğrulanacak. Demo doğrulama kodu: <strong>2027</strong></span></div>
          <label class="parent-field"><span>Veli telefon numarası</span><input id="parentPhone" inputmode="tel" placeholder="05xx xxx xx xx" maxlength="15"></label>
          <div class="parent-verify-row"><button id="sendParentCode">Kod Gönder</button><input id="parentCode" inputmode="numeric" placeholder="Doğrulama kodu" maxlength="4"><button id="verifyParentCode">Doğrula</button></div>
          <div id="parentVerifyStatus" class="parent-verify-status"></div>
          <label class="parent-field"><span>Günlük karne saati</span><input id="parentDailyTime" type="time" value="20:30"></label>
          <div class="parent-switches">
            <label><input id="parentDailyEnabled" type="checkbox"><span><b>Günlük karne</b><small>Çözülen soru, başarı, XP, seri ve zayıf ders</small></span></label>
            <label><input id="parentWeeklyEnabled" type="checkbox"><span><b>Haftalık özet</b><small>7 günlük gelişim özeti</small></span></label>
            <label><input id="parentCriticalEnabled" type="checkbox"><span><b>Kritik düşüş uyarısı</b><small>Başarı veya çalışma belirgin düşerse veliye bildir</small></span></label>
          </div>
          <label class="parent-consent"><input id="parentConsent" type="checkbox"><span>Veli numarasının doğrulanacağını ve öğrenci çalışma özetlerinin bu numaraya gönderileceğini onaylıyorum.</span></label>
          <div class="parent-actions"><button id="saveParentSettings" class="parent-primary">Ayarları Kaydet</button><button id="deleteParentPhone" class="parent-danger">Numarayı Sil</button></div>
          <p class="parent-privacy">Demo sürümünde hiçbir SMS gönderilmez ve telefon numarası yalnızca bu cihazın yerel hafızasında tutulur. Gerçek sürümde KVKK/onay, şifreli saklama ve SMS sağlayıcısı backend üzerinden bağlanacaktır.</p>
        </div>
        <div class="parent-tab-panel hidden" data-parent-panel="report">
          <article id="parentReportCard" class="parent-report-card"></article>
          <div class="parent-message-preview"><span>SMS ÖNİZLEMESİ</span><p id="parentSmsPreview"></p></div>
          <button id="simulateParentSend" class="parent-primary wide">Bugünkü Karneyi Gönder · Demo</button>
          <p class="parent-privacy">Gerçek sürümde bu işlem sunucu tarafından belirlenen saatte otomatik yapılacak; öğrenci uygulamasının açık olması gerekmeyecek.</p>
        </div>
      </section>`;
    document.body.appendChild(overlay);

    overlay.querySelector('#closeParentTracking').onclick = closePanel;
    overlay.addEventListener('click', e => { if(e.target === overlay) closePanel(); });
    overlay.querySelectorAll('[data-parent-tab]').forEach(btn => btn.onclick = () => switchTab(btn.dataset.parentTab));
    overlay.querySelector('#sendParentCode').onclick = () => {
      const phone = overlay.querySelector('#parentPhone').value.trim();
      if(phone.replace(/\D/g,'').length < 10){ toast('Geçerli bir veli telefon numarası gir.'); return; }
      parentState.phone = phone;
      parentState.verified = false;
      saveParent();
      overlay.querySelector('#parentVerifyStatus').textContent = 'Demo doğrulama kodu gönderildi: 2027';
      toast('Demo kodu: 2027');
    };
    overlay.querySelector('#verifyParentCode').onclick = () => {
      if(!parentState.phone){ toast('Önce telefon numarasını girip Kod Gönder’e bas.'); return; }
      if(overlay.querySelector('#parentCode').value.trim() !== '2027'){ toast('Demo doğrulama kodu 2027.'); return; }
      parentState.verified = true;
      saveParent();
      overlay.querySelector('#parentVerifyStatus').textContent = '✓ Veli telefonu doğrulandı';
      overlay.querySelector('#parentVerifyStatus').classList.add('verified');
    };
    overlay.querySelector('#saveParentSettings').onclick = () => {
      const consent = overlay.querySelector('#parentConsent').checked;
      if(!parentState.verified){ toast('Önce veli telefonunu doğrula.'); return; }
      if(!consent){ toast('Veli takip onayını işaretle.'); return; }
      parentState.dailyTime = overlay.querySelector('#parentDailyTime').value || '20:30';
      parentState.dailyEnabled = overlay.querySelector('#parentDailyEnabled').checked;
      parentState.weeklyEnabled = overlay.querySelector('#parentWeeklyEnabled').checked;
      parentState.criticalEnabled = overlay.querySelector('#parentCriticalEnabled').checked;
      parentState.consent = consent;
      saveParent();
      toast('Veli Takibi ayarları kaydedildi.');
      renderSetup();
    };
    overlay.querySelector('#deleteParentPhone').onclick = () => {
      parentState = {...defaultParent}; saveParent(); renderSetup(); toast('Veli telefonu silindi.');
    };
    overlay.querySelector('#simulateParentSend').onclick = () => {
      if(!parentState.verified){ toast('Önce veli telefonunu doğrula.'); switchTab('setup'); return; }
      parentState.lastSent = new Date().toISOString(); saveParent();
      toast(`Demo karne ${maskPhone(parentState.phone)} numarasına gönderildi.`);
    };
  }

  function switchTab(name){
    const overlay = document.getElementById('parentTrackingOverlay');
    overlay.querySelectorAll('[data-parent-tab]').forEach(b=>b.classList.toggle('selected',b.dataset.parentTab===name));
    overlay.querySelectorAll('[data-parent-panel]').forEach(p=>p.classList.toggle('hidden',p.dataset.parentPanel!==name));
    if(name === 'report') renderReport();
  }

  function renderSetup(){
    const overlay = document.getElementById('parentTrackingOverlay');
    if(!overlay) return;
    overlay.querySelector('#parentPhone').value = parentState.phone || '';
    overlay.querySelector('#parentDailyTime').value = parentState.dailyTime || '20:30';
    overlay.querySelector('#parentDailyEnabled').checked = !!parentState.dailyEnabled;
    overlay.querySelector('#parentWeeklyEnabled').checked = !!parentState.weeklyEnabled;
    overlay.querySelector('#parentCriticalEnabled').checked = !!parentState.criticalEnabled;
    overlay.querySelector('#parentConsent').checked = !!parentState.consent;
    const st = overlay.querySelector('#parentVerifyStatus');
    st.classList.toggle('verified', !!parentState.verified);
    st.textContent = parentState.verified ? `✓ Doğrulandı · ${maskPhone(parentState.phone)}` : (parentState.phone ? 'Telefon doğrulaması bekleniyor' : 'Henüz veli telefonu eklenmedi');
  }

  function renderReport(){
    const d = reportData();
    const report = document.getElementById('parentReportCard');
    const sms = document.getElementById('parentSmsPreview');
    if(!report || !sms) return;
    report.innerHTML = `
      <div class="parent-report-head"><div><span>LGS ARENA · GÜNLÜK KARNE</span><b>Bugünkü Performans</b></div><em>${d.accuracy}%</em></div>
      <div class="parent-report-grid">
        <div><span>Soru</span><b>${d.total}</b></div><div><span>Doğru</span><b>${d.correct}</b></div><div><span>Yanlış</span><b>${d.wrong}</b></div><div><span>Boş</span><b>${d.blank}</b></div>
      </div>
      <div class="parent-report-lines"><p><span>Çalışma</span><b>~${d.estimatedMinutes} dk</b></p><p><span>Seri</span><b>${d.streak} gün</b></p><p><span>Güçlü ders</span><b>${esc(d.strong)}</b></p><p><span>Geliştirilmeli</span><b>${esc(d.weak)}</b></p></div>
      <div class="parent-zeus-advice"><span>⚡ ZEUS</span><p>${d.total ? `${esc(d.weak)} için yarın kısa tekrar ve 10 hedef soru öneriyorum.` : 'Bugün henüz soru çözülmedi. İlk 10 soruluk çalışma tamamlandığında veli karnesi otomatik oluşacak.'}</p></div>`;
    sms.textContent = `LGS Arena Günlük Karne: Bugün ${d.total} soru · ${d.correct} doğru · ${d.wrong} yanlış · ${d.blank} boş · Başarı %${d.accuracy} · Seri ${d.streak} gün. Güçlü: ${d.strong}. Geliştirilmeli: ${d.weak}.`;
  }

  function openPanel(){ ensurePanel(); renderSetup(); renderReport(); switchTab(parentState.verified ? 'report' : 'setup'); document.getElementById('parentTrackingOverlay').classList.remove('hidden'); }
  function closePanel(){ document.getElementById('parentTrackingOverlay')?.classList.add('hidden'); }

  function init(){ ensureCard(); ensurePanel(); renderCard(); }
  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
  window.LgsArenaParentTracking = { open:openPanel, refresh:renderReport };
})();
