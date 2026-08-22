(() => {
  'use strict';

  const uiStyle = document.createElement('link');
  uiStyle.rel = 'stylesheet';
  uiStyle.href = './mobile-v04.css?v=420';
  document.head.appendChild(uiStyle);

  const parentStyle = document.createElement('link');
  parentStyle.rel = 'stylesheet';
  parentStyle.href = './parent-v41.css?v=420';
  document.head.appendChild(parentStyle);

  const parentScript = document.createElement('script');
  parentScript.src = './profile-parent-v41.js?v=420';
  parentScript.defer = true;
  document.head.appendChild(parentScript);

  const foundationStyle = document.createElement('style');
  foundationStyle.textContent = `
    .subject-cards{grid-template-rows:repeat(6,minmax(0,1fr))!important}
    .subject-card{min-height:0}
    .global-zeus-watermark{position:absolute;left:50%;top:54%;width:min(78%,360px);max-height:68%;object-fit:contain;transform:translate(-50%,-50%);opacity:.16;filter:saturate(.72) contrast(1.05);pointer-events:none;user-select:none;z-index:0}
    .app-header,.page-host,.bottom-nav{position:relative;z-index:1}
    .page{position:relative}
    .cover-skip{min-width:min(82vw,340px);min-height:54px;font-size:15px;padding:13px 26px!important}
    .model-notice{position:absolute;left:18px;right:18px;bottom:calc(90px + env(safe-area-inset-bottom));z-index:3;margin:0 auto;max-width:430px;text-align:center;color:#d3deea;font-size:10px;line-height:1.35;text-shadow:0 1px 5px #000;background:#020914aa;border:1px solid #e7b85b2e;border-radius:10px;padding:7px 9px;backdrop-filter:blur(5px)}
    @media (max-height:690px){.model-notice{font-size:8px;bottom:calc(78px + env(safe-area-inset-bottom));padding:5px 7px}.cover-skip{min-height:48px}.subject-card{padding-top:5px!important;padding-bottom:5px!important}}
  `;
  document.head.appendChild(foundationStyle);

  let deferredPrompt = null;
  const params = new URLSearchParams(location.search);
  const bypassServiceWorker = params.get('bypassSW') === '1' || params.get('direct') === '1';
  const allowedHashes = new Set(['arena','zeus','subjects','solve','mock','progress']);
  const pendingHash = allowedHashes.has(location.hash.replace('#','')) ? location.hash.replace('#','') : 'arena';
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

  function ensureBrandLayers() {
    const shell = document.getElementById('shell');
    if (shell && !document.getElementById('globalZeusWatermark')) {
      const img = document.createElement('img');
      img.id = 'globalZeusWatermark';
      img.className = 'global-zeus-watermark';
      img.src = './assets/zeus.webp';
      img.alt = '';
      img.setAttribute('aria-hidden','true');
      shell.prepend(img);
    }
    const cover = document.getElementById('cover');
    if (cover && !cover.querySelector('.model-notice')) {
      const note = document.createElement('p');
      note.className = 'model-notice';
      note.textContent = 'Türkiye Yüzyılı Maarif Modeli esasları dikkate alınarak hazırlanmıştır. Bu uygulama Millî Eğitim Bakanlığının resmî uygulaması değildir ve MEB onayı iddiası taşımaz.';
      cover.appendChild(note);
    }
  }

  function enterArena(event) {
    if (event) {
      if (event.isTrusted === false) return;
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
    const targetName = pendingHash || 'arena';
    const targetButton = document.querySelector(`#bottomNav [data-nav="${targetName}"]`);
    if (targetButton && targetName !== 'arena') targetButton.click();
    else {
      const arena = document.querySelector('.page[data-page="arena"]');
      document.querySelectorAll('.page').forEach(page => page.classList.toggle('active', page === arena));
      document.querySelectorAll('#bottomNav [data-nav]').forEach(button => button.classList.toggle('selected', button.dataset.nav === 'arena'));
    }
  }

  function bindDirectEntry() {
    const button = document.getElementById('skipCover');
    if (!button) return;
    button.textContent = 'ARENAYA GİR';
    button.addEventListener('click', event => {
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

  ensureBrandLayers();
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
    if (!bypassServiceWorker && 'serviceWorker' in navigator && location.protocol !== 'file:') {
      navigator.serviceWorker.register('./service-worker.js?v=420').then(reg => reg.update().catch(() => {})).catch(() => appToast('Çevrimdışı kullanım servisi bu ortamda etkinleştirilemedi.'));
    }
  });
  window.LgsArenaPwa = { installApp, enterArena };
})();
