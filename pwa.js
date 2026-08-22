(() => {
  'use strict';

  // V0.4 mobile UI overrides load after the base stylesheet.
  const uiStyle = document.createElement('link');
  uiStyle.rel = 'stylesheet';
  uiStyle.href = './mobile-v04.css';
  document.head.appendChild(uiStyle);

  let deferredPrompt = null;
  const params = new URLSearchParams(location.search);
  const bypassServiceWorker = params.get('bypassSW') === '1' || params.get('direct') === '1';
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

  function enterArena(event) {
    if (event) {
      event.preventDefault();
      event.stopImmediatePropagation();
    }
    const cover = document.getElementById('cover');
    const shell = document.getElementById('shell');
    if (cover) {
      cover.classList.remove('active');
      cover.classList.add('hidden');
    }
    if (shell) shell.classList.remove('hidden');
    const arena = document.querySelector('.page[data-page="arena"]');
    if (arena) arena.classList.add('active');
    document.querySelectorAll('.page').forEach(page => {
      if (page !== arena) page.classList.remove('active');
    });
    document.querySelectorAll('#bottomNav [data-nav]').forEach(button => {
      button.classList.toggle('selected', button.dataset.nav === 'arena');
    });
  }

  function bindDirectEntry() {
    const button = document.getElementById('skipCover');
    if (!button) return;
    button.textContent = 'ARENAYA GİR';
    button.addEventListener('click', event => {
      // app.js V0.4 performs a synthetic .click() after 2.8 s. Android 16 must
      // wait for the user's real tap instead of entering through that legacy path.
      if (event.isTrusted === false) {
        event.preventDefault();
        event.stopImmediatePropagation();
        return;
      }
      enterArena(event);
    }, true);
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
    appToast('Tarayıcı menüsünden “Uygulamayı yükle” veya “Ana ekrana ekle” seçeneğini kullan.');
  }

  bindDirectEntry();
  window.addEventListener('beforeinstallprompt', event => { event.preventDefault(); deferredPrompt = event; });
  window.addEventListener('appinstalled', () => { deferredPrompt = null; appToast('LGS Arena telefona kuruldu.'); });
  window.addEventListener('load', () => {
    const menu = document.getElementById('menuBtn');
    if (menu) {
      menu.title = 'Uygulamayı yükle';
      menu.setAttribute('aria-label', 'LGS Arena uygulamasını yükle');
      menu.addEventListener('click', event => { event.stopImmediatePropagation(); installApp(); }, true);
    }
    // A V3.6 clean launch must stay network-only for this page load. Registering
    // the worker immediately after unregistering it can put Android back under
    // the stale controller before the user reaches the Arena screen.
    if (!bypassServiceWorker && 'serviceWorker' in navigator && location.protocol !== 'file:') {
      navigator.serviceWorker.register('./service-worker.js?v=361').then(reg => reg.update().catch(() => {})).catch(() => appToast('Çevrimdışı kullanım servisi bu ortamda etkinleştirilemedi.'));
    }
    const hash = location.hash.replace('#', '');
    if (['arena','zeus','subjects','solve','mock','progress'].includes(hash)) {
      setTimeout(() => { const target = document.querySelector(`[data-nav="${hash}"]`); if (target) target.click(); }, 3500);
    }
  });
  window.LgsArenaPwa = { installApp, enterArena };
})();
