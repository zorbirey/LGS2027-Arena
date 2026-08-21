(() => {
  'use strict';
  const KEY='lgsArenaPwaV02';
  const ADAPT_KEY='lgsArenaAdaptiveV17';
  const NAME='Yabancı Dil';
  const DISPLAY='İngilizce';
  const SHORT='İngilizce';
  const COLOR='#49b982';
  const ICON='EN';
  let scheduled=false;

  function read(key){try{return JSON.parse(localStorage.getItem(key)||'{}')}catch{return {}}}
  function state(){return read(KEY)}
  function adaptive(){return read(ADAPT_KEY)}
  function questions(){return (window.QUESTION_BANK||[]).filter(q=>q.subject===NAME)}
  function seenCount(){const seen=new Set(state().seenIds||[]);return questions().filter(q=>seen.has(q.id)).length}
  function accuracy(){const h=(state().history||[]).filter(x=>x.subject===NAME&&!x.assisted&&x.selected!==null);return h.length?Math.round(h.filter(x=>x.correct).length/h.length*100):0}
  function rankLabel(level=2){return level>=3.5?'Efsane':level>=2.75?'Zor':level>=1.75?'Orta':'Kolay'}

  function ensureSixSubjectLayout(){
    if(document.getElementById('englishSixSubjectLayout'))return;
    const style=document.createElement('style');
    style.id='englishSixSubjectLayout';
    style.textContent=`
      .subject-cards{grid-template-rows:repeat(6,minmax(0,1fr))!important;gap:5px!important}
      .subject-cards .subject-card{min-height:0!important;padding:6px 9px!important;gap:7px!important}
      .subject-cards .subject-icon{width:34px!important;height:34px!important;font-size:18px!important}
      .subject-cards .subject-actions{gap:3px!important}
      .subject-cards .subject-actions button{min-height:30px!important;padding:5px 7px!important;font-size:10px!important}
      .mini-subjects{gap:4px!important}
      @media(max-height:760px){
        .subject-cards{gap:4px!important}
        .subject-cards .subject-card{padding:5px 8px!important}
        .subject-cards .subject-card h3{font-size:15px!important}
        .subject-cards .subject-card p{font-size:9.5px!important;margin:1px 0 3px!important}
        .subject-cards .subject-icon{width:31px!important;height:31px!important;font-size:16px!important}
        .subject-cards .subject-actions button{min-height:27px!important;padding:4px 6px!important;font-size:9.5px!important}
      }
      @media(max-height:660px){
        .subject-cards .subject-card{padding:4px 7px!important;grid-template-columns:32px 1fr auto!important}
        .subject-cards .subject-card h3{font-size:14px!important}
        .subject-cards .subject-card p{font-size:9px!important}
        .subject-cards .subject-icon{width:29px!important;height:29px!important;font-size:15px!important}
        .subject-cards .subject-actions button{min-height:25px!important;padding:3px 5px!important;font-size:9px!important}
      }
    `;
    document.head.appendChild(style);
  }

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
    article.innerHTML=`<div class="subject-icon">${ICON}</div><div><h3>${DISPLAY}</h3><p>Yabancı Dil · ${seen}/${total} görüldü · ${left} yeni</p><div class="tiny-progress"><i style="width:${pct}%"></i></div></div><div class="subject-actions"><button data-english-notes>Akıllı Notlar</button><button data-english-start>10 Soru</button></div>`;
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
    if(document.getElementById('smartNotesSubjectTitle')?.textContent===NAME)b.classList.add('selected');
    b.onclick=()=>proxyClick('[data-note-subject]','noteSubject');box.appendChild(b);
  }

  function addParentCoachRow(){
    const box=document.querySelector('#parentAdaptiveCoach .parent-adaptive-subjects');if(!box||box.querySelector('[data-parent-english]'))return;
    const p=adaptive().profile?.[NAME]||{route:'Kazanım',level:2,lastNet:null};
    const net=p.lastNet==null?'—':Number(p.lastNet).toLocaleString('tr-TR',{minimumFractionDigits:1,maximumFractionDigits:1});
    box.insertAdjacentHTML('beforeend',`<div class="parent-adaptive-row" data-parent-english><span>${SHORT}</span><b>${net} net</b><em class="${p.route==='Yeni Nesil'?'newgen':''}">${p.route||'Kazanım'} · ${rankLabel(p.level||2)}</em></div>`);
  }

  function refreshTitles(){
    const title=document.querySelector('[data-page="subjects"] .page-title h1');
    if(title&&title.textContent!=='6 derslik LGS soru havuzları')title.textContent='6 derslik LGS soru havuzları';
    const total=document.querySelector('[data-page="subjects"] .page-title > b'),value=String((window.QUESTION_BANK||[]).length);
    if(total&&total.textContent!==value)total.textContent=value;
  }

  function render(){ensureSixSubjectLayout();addArenaRow();addSubjectCard();addSolveLauncher();addProgress();addSmartNoteTab();addParentCoachRow();refreshTitles()}
  function schedule(){if(scheduled)return;scheduled=true;requestAnimationFrame(()=>{scheduled=false;render()})}
  function init(){render();new MutationObserver(schedule).observe(document.body,{childList:true,subtree:true});window.addEventListener('storage',schedule)}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
  window.LgsArenaEnglish={render};
})();