(() => {
  'use strict';
  const coverAsset='./assets/lgs2027-cover-fixed.webp?v=4.8.0';
  const watermarkAsset='./assets/lgs2027-cover-fixed.webp?v=4.8.0';
  const style=document.createElement('style');
  style.id='lgs-zeus-visual-fix-v48';
  style.textContent=`
    .cover{background:#020710 url('${coverAsset}') center 24%/cover no-repeat!important;overflow:hidden!important}
    .cover img{position:absolute!important;inset:0!important;width:100%!important;height:100%!important;object-fit:cover!important;object-position:center 24%!important;display:block!important;z-index:0!important}
    .cover-overlay{position:absolute!important;inset:0!important;z-index:1!important;background:linear-gradient(180deg,rgba(2,7,16,.01),rgba(2,7,16,.04) 58%,rgba(2,7,16,.44))!important;pointer-events:none!important}
    .cover-branding{display:none!important}
    .cover-skip{position:absolute!important;z-index:5!important;left:7%!important;right:7%!important;width:86%!important;max-width:none!important;transform:none!important;margin:0!important;box-sizing:border-box!important;bottom:calc(18px + env(safe-area-inset-bottom))!important;min-height:58px!important;background:rgba(4,16,34,.95)!important;box-shadow:0 0 0 1px rgba(231,184,91,.60),0 12px 35px rgba(0,0,0,.58)!important}
    .model-notice{position:absolute!important;z-index:5!important;left:7%!important;right:7%!important;width:86%!important;max-width:none!important;transform:none!important;margin:0!important;box-sizing:border-box!important;bottom:calc(92px + env(safe-area-inset-bottom))!important;font-size:9px!important;line-height:1.3!important;padding:8px 10px!important;border-radius:12px!important;background:rgba(2,9,20,.88)!important;color:#dce5ef!important;backdrop-filter:blur(8px)!important}
    .shell,.page-host,.page{isolation:isolate!important}
    .global-zeus-watermark{display:none!important}
    .page{position:relative!important}
    .page::before{content:""!important;position:absolute!important;inset:5% 3% 5%!important;z-index:-1!important;background-image:url('${watermarkAsset}')!important;background-size:contain!important;background-position:center center!important;background-repeat:no-repeat!important;opacity:.055!important;filter:grayscale(.25) saturate(.7) contrast(1.04)!important;pointer-events:none!important}
    .page::after{content:""!important;position:absolute!important;inset:0!important;z-index:-2!important;background:radial-gradient(circle at 50% 34%,rgba(25,78,130,.10),rgba(3,9,18,.84) 58%,rgba(3,9,18,.98))!important;pointer-events:none!important}
    .arena-hero-card,.zeus-hero{position:relative!important;overflow:hidden!important;border-color:rgba(231,184,91,.34)!important;background:#061426!important}
    .arena-hero-card>img,.zeus-hero>img{content:url('${coverAsset}')!important;position:absolute!important;inset:0!important;width:100%!important;height:100%!important;object-fit:cover!important;object-position:center 22%!important;display:block!important;opacity:.92!important}
    .arena-hero-card::before,.zeus-hero::before{content:""!important;position:absolute!important;inset:0!important;z-index:1!important;background:linear-gradient(180deg,rgba(0,0,0,.02),rgba(1,9,20,.14) 48%,rgba(1,9,20,.90))!important;pointer-events:none!important}
    .arena-hero-copy,.arena-hero-countdown,.zeus-hero>div{position:relative!important;z-index:2!important}
    .zeus-hero{min-height:245px!important}
    .subject-card,.stat,.arena-rank-card,.home-progress-card,.xp-card,.hero-start-btn,.mock-card,.mock-rules>div,.notice,.ranking-card,.weak-card,.plan-card,.smartnote-card,.review-card,.zeus-panel,.zeus-grid button,.option-btn{backdrop-filter:blur(3px)!important;background-color:rgba(6,20,38,.93)!important}
    @media(max-width:480px){
      .cover{background-position:center 22%!important}
      .cover img{object-position:center 22%!important}
      .model-notice{font-size:8.5px!important;bottom:calc(90px + env(safe-area-inset-bottom))!important}
      .cover-skip{min-height:56px!important}
      .page::before{inset:7% 4% 6%!important;opacity:.05!important}
      .zeus-hero{min-height:225px!important}
      .zeus-hero>img,.arena-hero-card>img{object-position:center 20%!important}
    }
    @media(min-width:700px){
      .cover{background-size:contain!important;background-position:center center!important}
      .cover img{object-fit:contain!important;object-position:center center!important;background:#020710!important}
      .page::before{max-width:720px!important;margin:auto!important;opacity:.055!important}
    }
  `;
  document.head.appendChild(style);
  const apply=()=>{
    const cover=document.querySelector('#cover img');
    if(cover){
      cover.src=coverAsset;
      cover.removeAttribute('srcset');
      cover.onerror=()=>{cover.style.visibility='hidden';};
    }
    document.querySelectorAll('.arena-hero-card img,.zeus-hero img').forEach(img=>{img.src=coverAsset;img.removeAttribute('srcset');});
    const notice=document.querySelector('.model-notice');
    if(notice)notice.textContent='Türkiye Yüzyılı Maarif Modeli dikkate alınmıştır. MEB’in resmî uygulaması değildir; MEB onayı iddiası taşımaz.';
  };
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',apply,{once:true});else apply();
  window.addEventListener('load',apply,{once:true});
})();
