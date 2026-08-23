(() => {
  'use strict';
  const asset=(window.LGS_ARENA_CONFIG&&window.LGS_ARENA_CONFIG.coverAsset)||'assets/zeus-cover.svg?v=4.5.0';
  const style=document.createElement('style');
  style.id='lgs-zeus-visual-fix-v45';
  style.textContent=`
    .cover{background:#020710!important;overflow:hidden!important}
    .cover img{position:absolute!important;inset:0!important;width:100%!important;height:100%!important;object-fit:cover!important;object-position:center center!important;display:block!important;z-index:0!important}
    .cover-overlay{position:absolute!important;inset:0!important;z-index:1!important;background:linear-gradient(180deg,rgba(2,7,16,.04),rgba(2,7,16,.12) 58%,rgba(2,7,16,.44))!important;pointer-events:none!important}
    .cover-branding{display:none!important}
    .cover-skip{z-index:3!important;bottom:calc(22px + env(safe-area-inset-bottom))!important;background:rgba(4,16,34,.90)!important;box-shadow:0 0 0 1px rgba(231,184,91,.32),0 12px 35px rgba(0,0,0,.55)!important}
    .shell,.page-host,.page{isolation:isolate!important}
    .page{position:relative!important}
    .page::before{content:""!important;position:absolute!important;inset:5% 3% 4%!important;z-index:-1!important;background-image:url('${asset}')!important;background-size:cover!important;background-position:center 42%!important;background-repeat:no-repeat!important;opacity:.13!important;filter:grayscale(.18) saturate(.8) contrast(1.06)!important;pointer-events:none!important;border-radius:24px!important}
    .page::after{content:""!important;position:absolute!important;inset:0!important;z-index:-2!important;background:radial-gradient(circle at 50% 34%,rgba(25,78,130,.18),rgba(3,9,18,.70) 56%,rgba(3,9,18,.95))!important;pointer-events:none!important}
    .arena-hero-card,.zeus-hero{position:relative!important;overflow:hidden!important;border-color:rgba(231,184,91,.34)!important}
    .arena-hero-card>img,.zeus-hero>img{content:url('${asset}')!important;width:100%!important;height:100%!important;object-fit:cover!important;object-position:center 40%!important;display:block!important;opacity:.95!important}
    .arena-hero-card::before,.zeus-hero::before{content:""!important;position:absolute!important;inset:0!important;z-index:1!important;background:linear-gradient(180deg,rgba(0,0,0,.02),rgba(1,9,20,.10) 45%,rgba(1,9,20,.82))!important;pointer-events:none!important}
    .arena-hero-copy,.arena-hero-countdown,.zeus-hero>div{position:relative!important;z-index:2!important}
    .subject-card,.stat,.arena-rank-card,.home-progress-card,.xp-card,.hero-start-btn,.mock-card,.mock-rules>div,.notice,.ranking-card,.weak-card,.plan-card,.smartnote-card,.review-card,.zeus-panel,.zeus-grid button,.option-btn{backdrop-filter:blur(2px)!important;background-color:rgba(6,20,38,.80)!important}
    @media(max-width:480px){.page::before{inset:7% 2% 5%!important;background-position:center 38%!important;opacity:.12!important}}
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
