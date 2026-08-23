(() => {
  'use strict';

  const PREF_KEY = 'lgsArenaPreferenceV1';
  const ARENA_KEY = 'lgsArenaPwaV02';
  const DATA = Array.isArray(window.LGS_SCHOOL_DATA_2026) ? window.LGS_SCHOOL_DATA_2026 : [];
  const IDX = Object.freeze({code:0, city:1, district:2, name:3, type:4, teaching:5, score:6, percentile:7, quota:8, duration:9, boarding:10});
  const EOKUL_URL = 'https://e-okul.meb.gov.tr/logineOkul.aspx';
  const MEB_REPORT_URL = 'https://meb.gov.tr/lgs-kapsamindaki-ilk-yerlestirme-sonuclarinin-raporu-yayimlandi//haber/41560/tr';
  const DATA_SOURCE_URL = 'https://www.matematikmerkezi.com/lgs-tercih-robotu';
  const $ = selector => document.querySelector(selector);
  const $$ = selector => [...document.querySelectorAll(selector)];
  let previousPage = 'progress';
  let latestResult = null;
  let membershipOrigin = '';
  let pref = readPreference();

  function readJson(key) {
    try { return JSON.parse(localStorage.getItem(key) || '{}'); } catch { return {}; }
  }

  function readPreference() {
    const saved = readJson(PREF_KEY);
    const arena = readJson(ARENA_KEY);
    return {
      province: saved.province || upperTr(arena.province || 'İstanbul'),
      district: saved.district || '',
      score: saved.score || '',
      percentile: saved.percentile || '',
      y6: saved.y6 || '',
      y7: saved.y7 || '',
      y8: saved.y8 || '',
      tab: saved.tab === 'obp' ? 'obp' : 'exam'
    };
  }

  function savePreference() {
    try { localStorage.setItem(PREF_KEY, JSON.stringify(pref)); } catch {}
  }

  function isPremium() { return !!readJson(ARENA_KEY).isPremium; }

  function openMembership(origin='progress') {
    const active = $('.page.active');
    if (active && active.dataset.page !== 'membership') previousPage = active.dataset.page || 'progress';
    membershipOrigin = origin || 'progress';
    $('#cover')?.classList.remove('active');
    $('#cover')?.classList.add('hidden');
    $('#shell')?.classList.remove('hidden');
    updateMembership();
    activatePage('membership');
  }

  function upperTr(value) { return String(value || '').trim().toLocaleUpperCase('tr-TR'); }
  function displayName(value) { return String(value || '').toLocaleLowerCase('tr-TR').replace(/(^|[\s/()-])\p{L}/gu, m => m.toLocaleUpperCase('tr-TR')); }
  function escapeHtml(value) { return String(value ?? '').replace(/[&<>'"]/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[char])); }
  function number(value) { const parsed = Number(String(value ?? '').replace(',', '.')); return Number.isFinite(parsed) ? parsed : null; }
  function trNumber(value, digits=2) { return Number(value).toLocaleString('tr-TR', {minimumFractionDigits:digits, maximumFractionDigits:digits}); }

  function activatePage(name) {
    $$('.page').forEach(page => page.classList.toggle('active', page.dataset.page === name));
    $$('#bottomNav [data-nav]').forEach(button => button.classList.toggle('selected', button.dataset.nav === name));
    $('#bottomNav')?.classList.toggle('hidden', ['result','review','smartnotes','preference'].includes(name));
  }

  function open(tab='exam', score=null, percentile=null) {
    if (!isPremium()) { openMembership(tab); return; }
    const active = $('.page.active');
    if (active && active.dataset.page !== 'preference') previousPage = active.dataset.page || 'progress';
    pref.tab = tab === 'obp' ? 'obp' : 'exam';
    if (number(score) !== null) pref.score = String(Number(score).toFixed(1));
    if (number(percentile) !== null) pref.percentile = String(percentile);
    syncForm();
    setTab(pref.tab);
    activatePage('preference');
    savePreference();
    if (pref.tab === 'exam' && number(pref.score) !== null) renderRecommendations();
  }

  function close() {
    const target = previousPage === 'result' && latestResult ? 'result' : 'progress';
    activatePage(target);
  }

  function cities() {
    return [...new Set(DATA.map(row => row[IDX.city]).filter(Boolean))].sort((a,b) => a.localeCompare(b, 'tr'));
  }

  function districts(city) {
    return [...new Set(DATA.filter(row => row[IDX.city] === city).map(row => row[IDX.district]).filter(Boolean))].sort((a,b) => a.localeCompare(b, 'tr'));
  }

  function populateProvince(select) {
    if (!select) return;
    const list = cities();
    select.innerHTML = list.map(city => `<option value="${escapeHtml(city)}">${escapeHtml(displayName(city))}</option>`).join('');
    const selected = list.includes(upperTr(pref.province)) ? upperTr(pref.province) : (list.includes('İSTANBUL') ? 'İSTANBUL' : list[0]);
    select.value = selected;
  }

  function populateDistrict(provinceSelect, districtSelect) {
    if (!provinceSelect || !districtSelect) return;
    const list = districts(provinceSelect.value);
    districtSelect.innerHTML = '<option value="">Tüm ilçeler</option>' + list.map(district => `<option value="${escapeHtml(district)}">${escapeHtml(displayName(district))}</option>`).join('');
    districtSelect.value = list.includes(upperTr(pref.district)) ? upperTr(pref.district) : '';
  }

  function syncForm() {
    const score = $('#prefScore'); if (score) score.value = pref.score;
    const percentile = $('#prefPercentile'); if (percentile) percentile.value = pref.percentile;
    ['6','7','8'].forEach(year => { const input = $(`#obpY${year}`); if (input) input.value = pref[`y${year}`]; });
    populateProvince($('#prefProvince'));
    populateDistrict($('#prefProvince'), $('#prefDistrict'));
    populateProvince($('#obpProvince'));
    populateDistrict($('#obpProvince'), $('#obpDistrict'));
  }

  function setTab(tab) {
    pref.tab = tab;
    $$('.preference-tab').forEach(button => button.classList.toggle('selected', button.dataset.preferenceTab === tab));
    $('#examPreferencePanel')?.classList.toggle('hidden', tab !== 'exam');
    $('#obpPreferencePanel')?.classList.toggle('hidden', tab !== 'obp');
    savePreference();
  }

  function schoolKind(row) {
    const text = upperTr(`${row[IDX.name]} ${row[IDX.type]}`);
    if (text.includes('FEN LİSESİ') || text.includes('FEN LİS.')) return 'Fen Lisesi';
    if (text.includes('SOSYAL BİLİMLER')) return 'Sosyal Bilimler';
    if (text.includes('İMAM HATİP')) return 'Anadolu İmam Hatip';
    if (text.includes('MESLEKİ') || text.includes('TEKNİK')) return 'Mesleki ve Teknik';
    return 'Anadolu Lisesi';
  }

  function assess(row, score, percentile) {
    const schoolScore = number(row[IDX.score]);
    const schoolPercentile = number(row[IDX.percentile]);
    if (percentile !== null && schoolPercentile !== null) {
      const ratio = percentile / Math.max(.01, schoolPercentile);
      if (ratio <= .80) return {key:'safe', label:'Daha güvenli', gap:Math.abs(schoolPercentile-percentile)};
      if (ratio <= 1) return {key:'close', label:'Yakın eşleşme', gap:Math.abs(schoolPercentile-percentile)};
      if (ratio <= 1.22 || percentile-schoolPercentile <= 2) return {key:'reach', label:'İddialı hedef', gap:Math.abs(schoolPercentile-percentile)};
      return null;
    }
    if (score === null || schoolScore === null) return null;
    const margin = score - schoolScore;
    if (margin >= 10) return {key:'safe', label:'Daha güvenli', gap:Math.abs(margin)};
    if (margin >= 0) return {key:'close', label:'Yakın eşleşme', gap:Math.abs(margin)};
    if (margin >= -15) return {key:'reach', label:'İddialı hedef', gap:Math.abs(margin)};
    return null;
  }

  function schoolCard(item) {
    const row = item.row;
    const detail = [schoolKind(row), row[IDX.teaching], row[IDX.duration]].filter(Boolean).join(' · ');
    return `<article class="preference-school ${item.assessment.key}">
      <div class="school-status"><span>${escapeHtml(item.assessment.label)}</span><small>${escapeHtml(displayName(row[IDX.district]))}</small></div>
      <h3>${escapeHtml(row[IDX.name])}</h3>
      <p>${escapeHtml(detail)}</p>
      <div class="school-numbers"><div><span>2026 puanı</span><b>${trNumber(row[IDX.score], 3)}</b></div><div><span>2026 yüzdelik</span><b>%${trNumber(row[IDX.percentile], 2)}</b></div><div><span>Kontenjan</span><b>${escapeHtml(row[IDX.quota] ?? '—')}</b></div></div>
    </article>`;
  }

  function renderRecommendations() {
    const score = number($('#prefScore')?.value);
    const percentile = number($('#prefPercentile')?.value);
    const province = $('#prefProvince')?.value || '';
    const district = $('#prefDistrict')?.value || '';
    const output = $('#schoolRecommendations');
    if (!output) return;
    if (score === null && percentile === null) {
      output.innerHTML = '<div class="preference-empty"><b>Puan veya yüzdelik gir</b><p>Deneme sonucundan gelen tahmini puanı kullanabilir ya da resmî LGS yüzdeliğini elle yazabilirsin.</p></div>';
      return;
    }
    if (score !== null && (score < 100 || score > 500)) { output.innerHTML = '<div class="preference-empty error">Puan 100–500 arasında olmalı.</div>'; return; }
    if (percentile !== null && (percentile <= 0 || percentile > 100)) { output.innerHTML = '<div class="preference-empty error">Yüzdelik 0’dan büyük ve 100’e eşit ya da küçük olmalı.</div>'; return; }
    pref.score = score === null ? '' : String(score);
    pref.percentile = percentile === null ? '' : String(percentile);
    pref.province = province;
    pref.district = district;
    savePreference();
    const pool = DATA.filter(row => row[IDX.city] === province && (!district || row[IDX.district] === district) && number(row[IDX.score]) !== null && number(row[IDX.percentile]) !== null);
    let matches = pool.map(row => ({row, assessment:assess(row, score, percentile)})).filter(item => item.assessment);
    const order = {reach:0, close:1, safe:2};
    matches.sort((a,b) => order[a.assessment.key]-order[b.assessment.key] || a.assessment.gap-b.assessment.gap || b.row[IDX.score]-a.row[IDX.score]);
    matches = matches.slice(0, 18);
    const basis = percentile !== null ? `Resmî yüzdelik %${trNumber(percentile,2)} temel alındı.` : `Arena tahmini ${trNumber(score,1)} puan temel alındı.`;
    if (!matches.length) {
      output.innerHTML = `<div class="preference-empty"><b>Yakın eşleşme bulunamadı</b><p>${escapeHtml(displayName(province))}${district ? ` / ${escapeHtml(displayName(district))}` : ''} filtresini genişlet veya resmî e-Okul ekranını kontrol et.</p></div>`;
      updateMatchSummary(0, basis);
      return;
    }
    output.innerHTML = matches.map(schoolCard).join('');
    updateMatchSummary(matches.length, basis);
  }

  function updateMatchSummary(count, basis) {
    const el = $('#preferenceMatchSummary');
    if (el) el.innerHTML = `<b>${count} yakın seçenek</b><span>${escapeHtml(basis)} 2026 taban değerleri gelecekteki yerleşmeyi garanti etmez.</span>`;
  }

  function calculateObp() {
    if (!isPremium()) { openMembership('obp'); return; }
    const values = ['6','7','8'].map(year => number($(`#obpY${year}`)?.value));
    const result = $('#obpResult');
    if (!result) return;
    if (values.some(value => value === null || value < 0 || value > 100)) {
      result.innerHTML = '<b>—</b><span>6, 7 ve 8. sınıf yıl sonu puanlarını 0–100 arasında gir.</span>';
      return;
    }
    const obp = values.reduce((sum,value) => sum+value,0)/3;
    const band = obp >= 90 ? 'Çok güçlü OBP' : obp >= 80 ? 'Güçlü OBP' : obp >= 70 ? 'Gelişen OBP' : 'OBP’yi güçlendirme alanı';
    pref.y6 = String(values[0]); pref.y7 = String(values[1]); pref.y8 = String(values[2]);
    pref.province = $('#obpProvince')?.value || pref.province;
    pref.district = $('#obpDistrict')?.value || '';
    savePreference();
    result.innerHTML = `<b>${trNumber(obp,4)}</b><span>${escapeHtml(band)}</span>`;
    renderLocalGuide(obp);
  }

  function renderLocalGuide(obp=null) {
    const province = $('#obpProvince')?.value || pref.province;
    const district = $('#obpDistrict')?.value || '';
    const count = DATA.filter(row => row[IDX.city] === province && (!district || row[IDX.district] === district)).length;
    const area = `${displayName(province)}${district ? ` / ${displayName(district)}` : ''}`;
    const el = $('#localPlacementGuide');
    if (!el) return;
    el.innerHTML = `<div class="local-guide-head"><b>${escapeHtml(area)}</b><span>${count} sınavla alan program</span></div>
      <p>${obp === null ? 'OBP’ni hesapladığında' : `<strong>${trNumber(obp,4)} OBP ile</strong>`} yerel yerleştirmede adres kayıt alanın, OBP ve özürsüz devamsızlığın birlikte değerlendirilir. Bu nedenle yalnız OBP’ye bakarak kesin okul adı vermek doğru değildir.</p>
      <ol><li>En fazla 5 yerel tercih yapılır; ilk 3 tercih kayıt alanından seçilir.</li><li>Aynı okul türünden en fazla 3 okul seçilebilir.</li><li>Sınavla alan yukarıdaki ${count} program için merkezi LGS puanı gerekir; OBP eşitlik durumunda devreye girer.</li></ol>`;
  }

  function updateMembership() {
    const paid = isPremium();
    const status = $('#membershipStatus');
    if (status) { status.textContent = paid ? 'PREMIUM' : 'ÜCRETSİZ'; status.classList.toggle('active', paid); }
    const enable = $('#membershipEnable');
    if (enable) enable.textContent = paid ? 'Premium Özelliklerini Aç' : 'Premium Akışı Etkinleştir · Demo';
    $('#membershipDisable')?.classList.toggle('hidden', !paid);
  }

  function closeMembership() {
    if (membershipOrigin === 'result') {
      membershipOrigin = '';
      window.dispatchEvent(new CustomEvent('lgsarena:continue-free-result'));
      return;
    }
    activatePage(previousPage === 'membership' ? 'progress' : previousPage);
  }

  function enableMembership() {
    if (!isPremium()) window.dispatchEvent(new CustomEvent('lgsarena:premium-set', {detail:{isPremium:true}}));
    updateMembership();
    const origin = membershipOrigin;
    membershipOrigin = '';
    if (origin === 'result') window.dispatchEvent(new CustomEvent('lgsarena:continue-free-result'));
    else if (origin === 'obp') open('obp');
    else open('exam');
  }

  function disableMembership() {
    window.dispatchEvent(new CustomEvent('lgsarena:premium-set', {detail:{isPremium:false}}));
    updateMembership();
  }

  function wire() {
    $('#preferenceBack')?.addEventListener('click', close);
    $$('.preference-tab').forEach(button => button.addEventListener('click', () => setTab(button.dataset.preferenceTab)));
    $('#findSchools')?.addEventListener('click', renderRecommendations);
    $('#calculateObp')?.addEventListener('click', calculateObp);
    $('#openPreferenceFromProgress')?.addEventListener('click', () => open('exam'));
    $('#openObpFromProgress')?.addEventListener('click', () => open('obp'));
    $('#resultPreferenceBtn')?.addEventListener('click', () => open('exam', latestResult?.estimatedScore, latestResult?.percentile));
    $('#membershipBack')?.addEventListener('click', closeMembership);
    $('#membershipContinueFree')?.addEventListener('click', closeMembership);
    $('#membershipEnable')?.addEventListener('click', enableMembership);
    $('#membershipDisable')?.addEventListener('click', disableMembership);
    $('#prefProvince')?.addEventListener('change', event => { pref.province=event.target.value; pref.district=''; populateDistrict($('#prefProvince'), $('#prefDistrict')); savePreference(); });
    $('#prefDistrict')?.addEventListener('change', event => { pref.district=event.target.value; savePreference(); });
    $('#obpProvince')?.addEventListener('change', event => { pref.province=event.target.value; pref.district=''; populateDistrict($('#obpProvince'), $('#obpDistrict')); savePreference(); renderLocalGuide(); });
    $('#obpDistrict')?.addEventListener('change', event => { pref.district=event.target.value; savePreference(); renderLocalGuide(); });
    window.addEventListener('lgsarena:result', event => {
      latestResult = event.detail || null;
      const button = $('#resultPreferenceBtn');
      if (button) button.classList.toggle('hidden', !isPremium() || latestResult?.mode !== 'exam' || number(latestResult?.estimatedScore) === null);
    });
    window.addEventListener('lgsarena:open-membership', event => openMembership(event.detail?.origin || 'progress'));
    window.addEventListener('lgsarena:premium-changed', updateMembership);
  }

  function init() {
    if (!DATA.length) return;
    updateMembership();
    syncForm();
    setTab(pref.tab);
    renderLocalGuide();
    wire();
    $$('.preference-source-link').forEach(link => {
      const source = link.dataset.source;
      link.href = source === 'meb' ? MEB_REPORT_URL : source === 'data' ? DATA_SOURCE_URL : EOKUL_URL;
    });
    window.LgsArenaPreference = Object.freeze({open, openMembership, calculateObp, dataCount:DATA.length, version:'6.1.0'});
    window.dispatchEvent(new CustomEvent('lgsarena:preference-ready', {detail:{schools:DATA.length, cities:cities().length}}));
  }

  init();
})();



