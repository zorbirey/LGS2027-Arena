(() => {
  'use strict';

  const cssFiles = [
    './mobile-v04.css?v=14',
    './android16-v05.css?v=14',
    './android16-v06.css?v=14',
    './android16-v07.css?v=14',
    './v09-vibrant.css?v=14',
    './v10-zeus-fix.css?v=14',
    './parent-tracking.css?v=14'
  ];
  cssFiles.forEach(href => {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = href;
    document.head.appendChild(link);
  });

  const parentScript = document.createElement('script');
  parentScript.src = './parent-tracking.js?v=14';
  parentScript.defer = true;
  document.head.appendChild(parentScript);

  const ZEUS_PART_URLS = [
    './assets/zeus-v10/part-1.txt?v=14',
    './assets/zeus-v10/part-2.txt?v=14',
    './assets/zeus-v10/part-3a.txt?v=14',
    './assets/zeus-v10/part-3b.txt?v=14',
    './assets/zeus-v10/part-4.txt?v=14',
    './assets/zeus-v10/part-5a.txt?v=14',
    './assets/zeus-v10/part-5b.txt?v=14',
    './assets/zeus-v10/part-6.txt?v=14'
  ];
  const ZEUS_FALLBACK = './assets/zeus-real-v09.webp?v=14';
  let zeusDataUrl = null;
  let zeusPromise = null;
  let deferredPrompt = null;

  const isIos = () => /iphone|ipad|ipod/i.test(navigator.userAgent) && !window.MSStream;
  const isStandalone = () => window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;

  function appToast(message) {
    const el = document.getElementById('toast');
    if (!el) return;
    el.textContent = message;
    el.classList.remove('hidden');
    clearTimeout(window.__pwaToastTimer);
    window.__pwaToastTimer = window.setTimeout(() => el.classList.add('hidden'), 3600);
  }

  async function loadExpandedBank() {
    if ((window.QUESTION_BANK || []).some(q => q.id === 'MAT-031')) return;
    try {
      const response = await fetch('./data/bank-v011.js?v=14', { cache: 'no-store' });
      if (!response.ok) throw new Error('bank fetch failed');
      let code = await response.text();
      code = code.replace('window.QUESTION_BANK=(window.QUESTION_BANK||[]).concat([', 'window.QUESTION_BANK.push(...[');
      (0, eval)(code);
      const title = document.querySelector('[data-page="subjects"] .page-title h1');
      if (title) title.textContent = "40'ar soruluk genişletilmiş havuzlar";
      const total = document.querySelector('[data-page="subjects"] .page-title > b');
      if (total) total.textContent = String((window.QUESTION_BANK || []).length);
    } catch (error) {
      console.warn('Genişletilmiş soru havuzu yüklenemedi', error);
    }
  }

  async function installApp() {
    if (isStandalone()) { appToast('LGS Arena zaten uygulama olarak çalışıyor.'); return; }
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      if (choice.outcome === 'accepted') appToast('LGS Arena ana ekrana ekleniyor.');
      deferredPrompt = null;
      return;
    }
    if (isIos()) { appToast("iPhone/iPad: Safari'de Paylaş → Ana Ekrana Ekle seçeneğini kullan."); return; }
    appToast('Chrome menüsünden “Uygulamayı yükle” seçeneğini kullan.');
  }

  async function loadZeusData() {
    if (zeusDataUrl) return zeusDataUrl;
    if (zeusPromise) return zeusPromise;
    zeusPromise = Promise.all(ZEUS_PART_URLS.map(async url => {
      const response = await fetch(url, { cache: 'no-store' });
      if (!response.ok) throw new Error(`Zeus görsel parçası yüklenemedi: ${url}`);
      return (await response.text()).trim();
    })).then(parts => {
      const joined = parts.join('');
      if (joined.length !== 87712) throw new Error(`Zeus görsel verisi eksik: ${joined.length}`);
      zeusDataUrl = 'data:image/webp;base64,' + joined;
      return zeusDataUrl;
    }).finally(() => { zeusPromise = null; });
    return zeusPromise;
  }

  function setImage(img, src) {
    if (!img) return;
    img.src = src;
    img.decoding = 'async';
  }

  async function installVerifiedZeus() {
    const zeus = await loadZeusData();
    setImage(document.querySelector('#cover > img'), zeus);
    setImage(document.querySelector('.arena-hero-card > img'), zeus);
    setImage(document.querySelector('.zeus-hero > img'), zeus);

    const shell = document.getElementById('shell');
    let watermark = document.getElementById('globalZeusWatermark');
    if (shell && !watermark) {
      watermark = document.createElement('img');
      watermark.id = 'globalZeusWatermark';
      watermark.className = 'global-zeus-watermark';
      watermark.alt = '';
      watermark.setAttribute('aria-hidden', 'true');
      shell.appendChild(watermark);
    }
    setImage(watermark, zeus);

    const zeusAvatar = document.getElementById('bellBtn');
    if (zeusAvatar) {
      zeusAvatar.classList.add('zeus-avatar-btn');
      if (!zeusAvatar.querySelector('img')) zeusAvatar.innerHTML = '<img alt="Zeus">';
      setImage(zeusAvatar.querySelector('img'), zeus);
      zeusAvatar.title = 'Zeus';
      zeusAvatar.setAttribute('aria-label', 'Zeus sekmesini aç');
      if (!zeusAvatar.dataset.zeusBound) {
        zeusAvatar.dataset.zeusBound = '1';
        zeusAvatar.addEventListener('click', event => {
          event.stopImmediatePropagation();
          document.querySelector('#bottomNav [data-nav="zeus"]')?.click();
        }, true);
      }
    }
  }

  function fallbackZeus() {
    setImage(document.querySelector('#cover > img'), ZEUS_FALLBACK);
    setImage(document.querySelector('.arena-hero-card > img'), ZEUS_FALLBACK);
    setImage(document.querySelector('.zeus-hero > img'), ZEUS_FALLBACK);
    const watermark = document.getElementById('globalZeusWatermark');
    setImage(watermark, ZEUS_FALLBACK);
  }

  function fixMockBadge() {
    const ring = document.querySelector('.mock-ring span');
    const copy = document.querySelector('.mock-card p');
    if (ring) ring.textContent = '30';
    if (copy) copy.textContent = '5 ders · 30 soru · sonuç sonunda açıklanır';
  }

  const coverButton = document.getElementById('skipCover');
  if (coverButton) {
    coverButton.addEventListener('click', event => {
      if (!event.isTrusted) {
        event.preventDefault();
        event.stopImmediatePropagation();
      }
    }, true);
  }

  loadExpandedBank();
  installVerifiedZeus().catch(error => {
    console.error(error);
    fallbackZeus();
  });
  fixMockBadge();

  window.addEventListener('beforeinstallprompt', event => { event.preventDefault(); deferredPrompt = event; });
  window.addEventListener('appinstalled', () => { deferredPrompt = null; appToast('LGS Arena telefona kuruldu.'); });

  window.addEventListener('load', () => {
    loadExpandedBank();
    installVerifiedZeus().catch(error => {
      console.error(error);
      fallbackZeus();
    });
    fixMockBadge();

    const menu = document.getElementById('menuBtn');
    if (menu) {
      menu.title = 'Uygulamayı yükle';
      menu.setAttribute('aria-label', 'LGS Arena uygulamasını yükle');
      menu.addEventListener('click', event => { event.stopImmediatePropagation(); installApp(); }, true);
    }

    if ('serviceWorker' in navigator && location.protocol !== 'file:') {
      navigator.serviceWorker.register('./service-worker.js?v=14')
        .then(reg => {
          reg.update().catch(() => {});
          if (reg.waiting) reg.waiting.postMessage('SKIP_WAITING');
        })
        .catch(() => appToast('Çevrimdışı kullanım servisi bu ortamda etkinleştirilemedi.'));
    }
  });

  window.LgsArenaPwa = { installApp, reloadZeus: installVerifiedZeus };
})();