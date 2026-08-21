(() => {
  'use strict';
  const KEY='lgsArenaPwaV02';
  const NAME='Yabancı Dil';
  const SHORT='İngilizce';
  const COLOR='#49b982';
  const ICON='A';

  function state(){try{return JSON.parse(localStorage.getItem(KEY)||'{}')}catch{return {}}}
  function questions(){return (window.QUESTION_BANK||[]).filter(q=>q.subject===NAME)}
  function seenCount(){const seen=new Set(state().seenIds||[]);return questions().filter(q=>seen.has(q.id)).length}
  function accuracy(){const h=(state().history||[]).filter(x=>x.subject===NAME&&!x.assisted&&x.selected!==null);return h.length?Math.round(h.filter(x=>x.correct).length/h.length*100):0}

  function proxyClick(selector,datasetKey){
    const source=document.querySelector(selector);if(!source)return false;
    const old=source.dataset[datasetKey];source.dataset[datasetKey]=NAME;source.click();source.dataset[datasetKey]=old;return true;
  }

  function addArenaRow(){
    const box=document.getElementById('arenaSubjects');if(!box||box.querySelector('[data-english-mini]'))return;
    const total=Math.max(1,questions().length),seen=seenCount(),pct=Math.round(seen/total*100);
    box.insertAdjacentHTML('beforeend',`<div class="mini-sub" data-english-mini><span style="color:${COLOR}">${ICON}</span><b>${SHORT}</b><div><i style="width:${pct}%;background:${COLOR}"></i></div><em>%${pct}</em></div>`);
  }

  function addSubjectCard(){
    const box=document.getElementById('subjectCards');if(!box||box.querySelector('[data-english-card]'))return;
    const total=questions().length,seen=seenCount(),left=Math.max(0,total-seen),pct=total?seen/total*100:0;
    const article=document.createElement('article');article.className='subject-card';article.dataset.englishCard='1';article.style.setProperty('--c',COLOR);
    article.innerHTML=`<div class="subject-icon">${ICON}</div><div><h3>${NAME}</h3><p>${seen}/${total} görüldü · ${left} yeni</p><div class="tiny-progress"><i style="width:${pct}%"></i></div></div><div class="subject-actions"><button data-english-notes>Akıllı Notlar</button><button data-english-start>10 Soru</button></div>`;
    box.appendChild(article);
    article.querySelector('[data-english-start]').onclick=()=>proxyClick('[data-start]','start');
    article.querySelector('[data-english-notes]').onclick=()=>proxyClick('[data-notes]','notes');
  }

  function addSolveLauncher(){
    const box=document.getElementById('solveSubjects');if(!box||box.querySelector('[data-english-launch]'))return;
    const b=document.createElement('button');b.dataset.englishLaunch='1';b.style.setProperty('--c',COLOR);b.innerHTML=`<b>${ICON}</b><span>${SHORT}</span><small>10 yeni soru</small>`;
    b.onclick=()=>proxyClick('[data-launch]','launch');box.appendChild(b);
  }

  function addProgress(){
    const box=document.getElementById('progressBars');if(!box||box.querySelector('[data-english-progress]'))return;
    const a=accuracy();box.insertAdjacentHTML('beforeend',`<div data-english-progress><span>${SHORT}</span><i><b style="width:${a}%;background:${COLOR}"></b></i><em>%${a}</em></div>`);
  }

  function addSmartNoteTab(){
    const box=document.getElementById('smartNoteSubjectTabs');if(!box||box.querySelector('[data-english-note-tab]'))return;
    const b=document.createElement('button');b.dataset.englishNoteTab='1';b.style.setProperty('--c',COLOR);b.textContent=SHORT;
    b.onclick=()=>proxyClick('[data-note-subject]','noteSubject');box.appendChild(b);
  }

  function refreshTitles(){
    const title=document.querySelector('[data-page="subjects"] .page-title h1');if(title)title.textContent='6 derslik LGS soru havuzları';
    const total=document.querySelector('[data-page="subjects"] .page-title > b');if(total)total.textContent=String((window.QUESTION_BANK||[]).length);
  }

  function render(){addArenaRow();addSubjectCard();addSolveLauncher();addProgress();addSmartNoteTab();refreshTitles()}
  function init(){render();new MutationObserver(()=>requestAnimationFrame(render)).observe(document.body,{childList:true,subtree:true});window.addEventListener('storage',render)}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
  window.LgsArenaEnglish={render};
})();
