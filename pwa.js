(() => {
  'use strict';

  const uiStyle = document.createElement('link');
  uiStyle.rel = 'stylesheet';
  uiStyle.href = './mobile-v04.css?v=08';
  document.head.appendChild(uiStyle);

  const androidStyle = document.createElement('link');
  androidStyle.rel = 'stylesheet';
  androidStyle.href = './android16-v05.css?v=08';
  document.head.appendChild(androidStyle);

  const watermarkStyle = document.createElement('link');
  watermarkStyle.rel = 'stylesheet';
  watermarkStyle.href = './android16-v06.css?v=08';
  document.head.appendChild(watermarkStyle);

  const coverStyle = document.createElement('link');
  coverStyle.rel = 'stylesheet';
  coverStyle.href = './android16-v07.css?v=08';
  document.head.appendChild(coverStyle);

  const coverButton = document.getElementById('skipCover');
  if (coverButton) {
    coverButton.addEventListener('click', event => {
      if (!event.isTrusted) {
        event.preventDefault();
        event.stopImmediatePropagation();
      }
    }, true);
  }

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

  function installPersistentZeus() {
    const shell = document.getElementById('shell');
    if (shell && !document.getElementById('globalZeusWatermark')) {
      const watermark = document.createElement('img');
      watermark.id = 'globalZeusWatermark';
      watermark.className = 'global-zeus-watermark';
      watermark.src = './assets/zeus-watermark.webp?v=08';
      watermark.alt = '';
      watermark.setAttribute('aria-hidden', 'true');
      watermark.decoding = 'async';
      shell.appendChild(watermark);
    }

    const zeusAvatar = document.getElementById('bellBtn');
    if (zeusAvatar) {
      zeusAvatar.classList.add('zeus-avatar-btn');
      zeusAvatar.innerHTML = '<img src="./assets/zeus-full.webp?v=08" alt="Zeus">';
      zeusAvatar.title = 'Zeus';
      zeusAvatar.setAttribute('aria-label', 'Zeus sekmesini aç');
      zeusAvatar.addEventListener('click', event => {
        event.stopImmediatePropagation();
        const z = document.querySelector('#bottomNav [data-nav="zeus"]');
        if (z) z.click();
      }, true);
    }
  }

  function enlargeMockBadge() {
    const ringNumber = document.querySelector('.mock-ring span');
    if (ringNumber) ringNumber.textContent = '30';
  }

  window.addEventListener('beforeinstallprompt', event => { event.preventDefault(); deferredPrompt = event; });
  window.addEventListener('appinstalled', () => { deferredPrompt = null; appToast('LGS Arena telefona kuruldu.'); });

  window.addEventListener('load', () => {
    installPersistentZeus();
    enlargeMockBadge();

    const menu = document.getElementById('menuBtn');
    if (menu) {
      menu.title = 'Uygulamayı yükle';
      menu.setAttribute('aria-label', 'LGS Arena uygulamasını yükle');
      menu.addEventListener('click', event => { event.stopImmediatePropagation(); installApp(); }, true);
    }

    if ('serviceWorker' in navigator && location.protocol !== 'file:') {
      navigator.serviceWorker.register('./service-worker.js?v=08')
        .then(reg => {
          reg.update().catch(() => {});
          if (reg.waiting) reg.waiting.postMessage('SKIP_WAITING');
        })
        .catch(() => appToast('Çevrimdışı kullanım servisi bu ortamda etkinleştirilemedi.'));
    }
  });

  window.LgsArenaPwa = { installApp };
})();
