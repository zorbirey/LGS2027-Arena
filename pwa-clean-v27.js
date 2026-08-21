(function(){
'use strict';
var deferredPrompt=null;
function toast(msg){var el=document.getElementById('toast');if(!el)return;el.textContent=msg;el.classList.remove('hidden');clearTimeout(window.__cleanPwaToast);window.__cleanPwaToast=setTimeout(function(){el.classList.add('hidden')},3200)}
window.addEventListener('beforeinstallprompt',function(e){e.preventDefault();deferredPrompt=e});
window.addEventListener('appinstalled',function(){deferredPrompt=null;toast('LGS Arena telefona kuruldu.')});
window.addEventListener('offline',function(){toast('Çevrimdışı mod: kayıtlı içerikler kullanılacak.')});
window.addEventListener('online',function(){toast('İnternet bağlantısı geri geldi. Güncellemeler arka planda alınacak.')});
function install(){if(deferredPrompt){deferredPrompt.prompt();deferredPrompt.userChoice.finally(function(){deferredPrompt=null});return}toast('Chrome menüsünden “Uygulamayı yükle” veya “Ana ekrana ekle” seçeneğini kullan.')}
function init(){var menu=document.getElementById('menuBtn');if(menu){menu.title='Uygulamayı yükle';menu.setAttribute('aria-label','LGS Arena uygulamasını yükle');menu.onclick=install}if('serviceWorker' in navigator&&location.protocol!=='file:'){navigator.serviceWorker.register('./service-worker.js?v=28',{scope:'./'}).then(function(reg){reg.update().catch(function(){})}).catch(function(){toast('Çevrimdışı paket bu açılışta tamamlanamadı. İnternet geldiğinde yeniden denenecek.')})}}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
window.LgsArenaPwa={installApp:install};
})();
