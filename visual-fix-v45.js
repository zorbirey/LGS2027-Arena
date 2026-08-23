(() => {
  'use strict';
  const asset='assets/lgs2027-cover-fixed.webp?v=4.5.0';
  const style=document.createElement('style');
  style.id='lgs-zeus-visual-fix-v45';
  style.textContent=`
    .cover{background:#020710!important;overflow:hidden!important}
    .cover img{position:absolute!important;inset:0!important;width:100%!important;height:100%!important;object-fit:cover!important;object-position:center center!important;display:block!important;z-index:0!important}
    .cover-overlay{position:absolute!important;inset:0!important;z-index:1!important;background:linear-gradient(180deg,rgba(2,7,16,.05),rgba(2,7,16,.16) 58%,rgba(2,7,16,.42))!important;pointer-events:none!important}
    .cover-branding{display:none!important}
    .cover-skip{z-index:3!important;bottom:calc(22px + env(safe-area-inset-bottom))!important;background:rgba(4,16,34,.88)!important;box-shadow:0 0 0 1px rgba(231,184,91,.3),0 12px 35px rgba(0,0,0,.55)!important}
    .shell{isolation:isolate!important}
    .page-host{isolation:isolate!important}
    .page{position:relative!important;isolation:isolate!important}
    .page::before{content:""!important;position:absolute!important;inset:8% 6% 7%!important;z-index:-1!important;background-image:url('${asset}')!important;background-size:cover!important;background-position:center 42%!important;background-repeat:no-repeat!important;opacity:.095!important;filter:grayscale(.15) saturate(.82) contrast(1.08)!important;pointer-events:none!important;border-radius:28px!important}
    .page::after{content:""!important;position:absolute!important;inset:0!important;z-index:-2!important;background:radial-gradient(circle at 50% 38%,rgba(18,65,112,.20),rgba(3,9,18,.76) 58%,rgba(3,9,18,.96))!important;pointer-events:none!important}
    .arena-hero-card,.zeus-hero{position:relative!important;overflow:hidden!important}
    .arena-hero-card>img,.zeus-hero>img{content:url('${asset}')!important;width:100%!important;height:100%!important;object-fit:cover!important;object-position:center 38%!important;display:block!important;opacity:.92!important}
    .arena-hero-card::before,.zeus-hero::before{content:""!important;position:absolute!important;inset:0!important;z-index:1!important;background:linear-gradient(180deg,rgba(0,0,0,.03),rgba(1,9,20,.12) 45%,rgba(1,9,20,.78))!important;pointer-events:none!important}
    .arena-hero-copy,.arena-hero-countdown,.zeus-hero>div{z-index:2!important}
    .subject-card,.stat,.arena-rank-card,.home-progress-card,.xp-card,.hero-start-btn,.mock-card,.mock-rules>div,.notice,.ranking-card,.weak-card,.plan-card,.smartnote-card,.review-card,.zeus-panel,.zeus-grid button,.option-btn{backdrop-filter:blur(2px)!important;background-color:rgba(6,20,38,.82)!important}
    @media(max-width:480px){.page::before{inset:10% 4% 8%!important;background-position:center 36%!important;opacity:.085!important}}
  `;
  document.head.appendChild(style);
  const apply=()=>{
    const cover=document.querySelector('#cover img');
    if(cover){cover.src=asset;cover.removeAttribute('srcset');}
    document.querySelectorAll('.arena-hero-card img,.zeus-hero img').forEach(img=>{img.src=asset;img.removeAttribute('srcset');});
  };
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',apply,{once:true});else apply();
  window.addEventListener('load',apply,{once:true});
})();
