(() => {
  'use strict';
  const coverAsset='assets/zeus.webp?v=4.7.0';
  const watermarkAsset='assets/zeus.webp?v=4.7.0';
  const style=document.createElement('style');
  style.id='lgs-zeus-visual-fix-v47';
  style.textContent=`
    .cover{background:#020710!important;overflow:hidden!important}
    .cover img{position:absolute!important;inset:0!important;width:100%!important;height:100%!important;object-fit:cover!important;object-position:center 28%!important;display:block!important;z-index:0!important}
    .cover-overlay{position:absolute!important;inset:0!important;z-index:1!important;background:linear-gradient(180deg,rgba(2,7,16,.02),rgba(2,7,16,.05) 58%,rgba(2,7,16,.48))!important;pointer-events:none!important}
    .cover-branding{display:none!important}
    .cover-skip{z-index:4!important;left:9%!important;right:9%!important;width:auto!important;bottom:calc(18px + env(safe-area-inset-bottom))!important;min-height:58px!important;background:rgba(4,16,34,.94)!important;box-shadow:0 0 0 1px rgba(231,184,91,.52),0 12px 35px rgba(0,0,0,.55)!important}
    .model-notice{z-index:4!important;left:7%!important;right:7%!important;bottom:calc(91px + env(safe-area-inset-bottom))!important;max-width:none!important;font-size:9px!important;line-height:1.25!important;padding:7px 10px!important;border-radius:12px!important;background:rgba(2,9,20,.84)!important;color:#dce5ef!important;backdrop-filter:blur(8px)!important}
    .shell,.page-host,.page{isolation:isolate!important}
    .global-zeus-watermark{display:none!important}
    .page{position:relative!important;overflow:hidden!important}
    .page::before{content:""!important;position:absolute!important;inset:4% 2% 3%!important;z-index:-1!important;background-image:url('${watermarkAsset}')!important;background-size:contain!important;background-position:center 38%!important;background-repeat:no-repeat!important;opacity:.075!important;filter:grayscale(.2) saturate(.7) contrast(1.05)!important;pointer-events:none!important;border-radius:24px!important}
    .page::after{content:""!important;position:absolute!important;inset:0!important;z-index:-2!important;background:radial-gradient(circle at 50% 34%,rgba(25,78,130,.13),rgba(3,9,18,.80) 58%,rgba(3,9,18,.97))!important;pointer-events:none!important}
    .arena-hero-card,.zeus-hero{position:relative!important;overflow:hidden!important;border-color:rgba(231,184,91,.34)!important;background:#061426!important}
    .arena-hero-card>img,.zeus-hero>img{content:url('${coverAsset}')!important;position:absolute!important;inset:0!important;width:100%!important;height:100%!important;object-fit:cover!important;object-position:center 24%!important;display:block!important;opacity:.92!important}
    .arena-hero-card::before,.zeus-hero::before{content:""!important;position:absolute!important;inset:0!important;z-index:1!important;background:linear-gradient(180deg,rgba(0,0,0,.02),rgba(1,9,20,.12) 48%,rgba(1,9,20,.88))!important;pointer-events:none!important}
    .arena-hero-copy,.arena-hero-countdown,.zeus-hero>div{position:relative!important;z-index:2!important}
    .zeus-hero{min-height:245px!important}
    .subject-card,.stat,.arena-rank-card,.home-progress-card,.xp-card,.hero-start-btn,.mock-card,.mock-rules>div,.notice,.ranking-card,.weak-card,.plan-card,.smartnote-card,.review-card,.zeus-panel,.zeus-grid button,.option-btn{backdrop-filter:blur(3px)!important;background-color:rgba(6,20,38,.91)!important}
    @media(max-width:480px){
      .cover img{object-position:center 25%!important}
      .model-notice{font-size:8.5px!important;bottom:calc(88px + env(safe-area-inset-bottom))!important}
      .cover-skip{min-height:56px!important}
      .page::before{inset:6% 3% 5%!important;background-position:center 34%!important;opacity:.065!important}
      .zeus-hero{min-height:230px!important}
      .zeus-hero>img,.arena-hero-card>img{object-position:center 22%!important}
    }
    @media(min-width:700px){
      .cover img{object-fit:contain!important;background:#020710!important}
      .page::before{max-width:720px!important;margin:auto!important;opacity:.07!important}
      .zeus-hero>img,.arena-hero-card>img{object-position:center 20%!important}
    }
  `;
  document.head.appendChild(style);
  const apply=()=>{
    const cover=document.querySelector('#cover img');
    if(cover){cover.src=coverAsset;cover.removeAttribute('srcset');}
    document.querySelectorAll('.arena-hero-card img,.zeus-hero img').forEach(img=>{img.src=coverAsset;img.removeAttribute('srcset');});
    const notice=document.querySelector('.model-notice');
    if(notice)notice.textContent='Türkiye Yüzyılı Maarif Modeli dikkate alınmıştır. MEB’in resmî uygulaması değildir; MEB onayı iddiası taşımaz.';
  };
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',apply,{once:true});else apply();
  window.addEventListener('load',apply,{once:true});
})();
