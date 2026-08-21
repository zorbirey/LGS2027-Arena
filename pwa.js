(() => {
  'use strict';

  const cssFiles = [
    './mobile-v04.css?v=10',
    './android16-v05.css?v=10',
    './android16-v06.css?v=10',
    './android16-v07.css?v=10',
    './v09-vibrant.css?v=10'
  ];
  cssFiles.forEach(href => {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = href;
    document.head.appendChild(link);
  });

  const ZEUS = './assets/zeus-real-v09.webp?v=10';
  let deferredPrompt = null;
  const isIos = () => /iphone|ipad|ipod/i.test(navigator.userAgent) && !window.MSStream;
  const isStandalone = () => window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;

  function appToast(message) {
    const el = document.getElementById('toast');
    if (!el) return;
    el.textContent = message;
    el.classList.remove('hidden');
    clearTimeout(window.__pwaToastTimer);
    window.__pwaToastTimer = setTimeout(() => el.classList.add('hidden'), 3600);
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

  function installVerifiedZeus() {
    document.querySelectorAll('img').forEach(img => {
      const src = img.getAttribute('src') || '';
      if (src.includes('zeus.webp') || src.includes('zeus-full.webp') || src.includes('zeus-watermark.webp') || src.includes('zeus-real-v09.webp')) {
        if (img.src !== new URL(ZEUS, document.baseURI).href) img.src = ZEUS;
      }
    });

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
    if (watermark) watermark.src = ZEUS;

    const zeusAvatar = document.getElementById('bellBtn');
    if (zeusAvatar && !zeusAvatar.dataset.zeusBound) {
      zeusAvatar.dataset.zeusBound = '1';
      zeusAvatar.classList.add('zeus-avatar-btn');
      zeusAvatar.innerHTML = `<img src="${ZEUS}" alt="Zeus">`;
      zeusAvatar.title = 'Zeus';
      zeusAvatar.setAttribute('aria-label', 'Zeus sekmesini aç');
      zeusAvatar.addEventListener('click', event => {
        event.stopImmediatePropagation();
        document.querySelector('#bottomNav [data-nav="zeus"]')?.click();
      }, true);
    }
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

  installVerifiedZeus();
  fixMockBadge();

  window.addEventListener('beforeinstallprompt', event => { event.preventDefault(); deferredPrompt = event; });
  window.addEventListener('appinstalled', () => { deferredPrompt = null; appToast('LGS Arena telefona kuruldu.'); });

  window.addEventListener('load', () => {
    installVerifiedZeus();
    fixMockBadge();

    const menu = document.getElementById('menuBtn');
    if (menu) {
      menu.title = 'Uygulamayı yükle';
      menu.setAttribute('aria-label', 'LGS Arena uygulamasını yükle');
      menu.addEventListener('click', event => { event.stopImmediatePropagation(); installApp(); }, true);
    }

    if ('serviceWorker' in navigator && location.protocol !== 'file:') {
      navigator.serviceWorker.register('./service-worker.js?v=10')
        .then(reg => {
          reg.update().catch(() => {});
          if (reg.waiting) reg.waiting.postMessage('SKIP_WAITING');
        })
        .catch(() => appToast('Çevrimdışı kullanım servisi bu ortamda etkinleştirilemedi.'));
    }
  });

  window.LgsArenaPwa = { installApp };
})();
