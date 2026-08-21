(() => {
  'use strict';

  const APP_KEY = 'lgsArenaPwaV02';
  const ADAPT_KEY = 'lgsArenaAdaptiveV17';
  const SUBJECTS = {
    'Türkçe': { short:'Türkçe', officialQuestions:20, threshold:13 },
    'Matematik': { short:'Mat', officialQuestions:20, threshold:13 },
    'Fen Bilimleri': { short:'Fen', officialQuestions:20, threshold:13 },
    'İnkılap Tarihi': { short:'İnkılap', officialQuestions:10, threshold:6.5 },
    'Din Kültürü': { short:'Din', officialQuestions:10, threshold:6.5 }
  };
  const MEDIUM_NEW_GEN = new Set([
    'ADP-MAT-001','ADP-MAT-002','ADP-FEN-001','ADP-FEN-002','ADP-TUR-001','ADP-TUR-002',
    'ADP-INK-001','ADP-INK-002','ADP-DIN-001','ADP-DIN-002'
  ]);
  const DIFF_RANK = { Kolay:1, Orta:2, Zor:3, Efsane:4 };
  const RANK_LABEL = n => n >= 3.5 ? 'Efsane' : n >= 2.75 ? 'Zor' : n >= 1.75 ? 'Orta' : 'Kolay';

  function defaultProfile(){
    return Object.fromEntries(Object.keys(SUBJECTS).map(name => [name, { route:'Kazanım', level:2, lastNet:null, lastAccuracy:null }]));
  }
  const defaults = { profile:defaultProfile(), scoreHistory:[], weeklyAttempts:[], lastFingerprint:'', lastLevelChange:null };
  let adaptive = readAdaptive();
  let lastQuestionId = '';

  function readApp(){ try{return JSON.parse(localStorage.getItem(APP_KEY)||'{}')}catch{return {}} }
  function writeApp(s){ localStorage.setItem(APP_KEY,JSON.stringify(s)); }
  function readAdaptive(){
    try{
      const raw=JSON.parse(localStorage.getItem(ADAPT_KEY)||'{}');
      const profile={...defaultProfile(),...(raw.profile||{})};
      return {...defaults,...raw,profile};
    }catch{return {...defaults,profile:defaultProfile()}}
  }
  function saveAdaptive(){ localStorage.setItem(ADAPT_KEY,JSON.stringify(adaptive)); }
  function clamp(n,min,max){ return Math.max(min,Math.min(max,n)); }
  function avg(a){ return a.length ? a.reduce((x,y)=>x+y,0)/a.length : 0; }
  function tr(n,d=1){ return Number(n||0).toLocaleString('tr-TR',{minimumFractionDigits:d,maximumFractionDigits:d}); }
  function qType(q){ return q?.questionType === 'Yeni Nesil' ? 'Yeni Nesil' : 'Kazanım'; }
  function qDifficulty(q){ return MEDIUM_NEW_GEN.has(q?.id) ? 'Orta' : (q?.difficulty || 'Orta'); }
  function qRank(q){ return DIFF_RANK[qDifficulty(q)] || 2; }
  function bank(){ return window.QUESTION_BANK || []; }
  function questionById(id){ return bank().find(q=>q.id===id); }
  function currentQuestion(){
    const text=document.getElementById('questionText')?.textContent?.trim();
    return text ? bank().find(q=>q.question===text) : null;
  }
  function weekKey(date=new Date()){
    const d=new Date(Date.UTC(date.getFullYear(),date.getMonth(),date.getDate()));
    const day=d.getUTCDay()||7; d.setUTCDate(d.getUTCDate()+4-day);
    const y=new Date(Date.UTC(d.getUTCFullYear(),0,1));
    const w=Math.ceil((((d-y)/86400000)+1)/7);
    return `${d.getUTCFullYear()}-W${String(w).padStart(2,'0')}`;
  }

  function annotateBank(){
    bank().forEach(q=>{
      if(!q.questionType) q.questionType='Kazanım';
      if(MEDIUM_NEW_GEN.has(q.id)) q.difficulty='Orta';
      if(q.difficulty==='Efsane') q.questionType='Yeni Nesil';
    });
  }

  function ensureQuestionTags(){
    const text=document.getElementById('questionText');
    if(!text) return null;
    let tags=document.getElementById('adaptiveQuestionTags');
    if(!tags){
      tags=document.createElement('div'); tags.id='adaptiveQuestionTags'; tags.className='adaptive-question-tags';
      text.parentNode.insertBefore(tags,text);
    }
    return tags;
  }
  function renderQuestionTags(){
    const q=currentQuestion(); if(!q) return;
    if(lastQuestionId===q.id && document.getElementById('adaptiveQuestionTags')?.dataset.qid===q.id) return;
    lastQuestionId=q.id;
    const tags=ensureQuestionTags(); if(!tags)return;
    const type=qType(q), diff=qDifficulty(q);
    tags.dataset.qid=q.id;
    tags.innerHTML=`<span class="question-kind ${type==='Yeni Nesil'?'newgen':'gain'}">${type.toUpperCase()}</span><span class="question-level ${diff.toLowerCase().replace('ı','i')}">${diff==='Efsane'?'⚡ EFSANE':diff.toUpperCase()}</span>`;
  }

  function chooseWeeklySubject(name,count=4){
    const app=readApp(); const seen=new Set(app.seenIds||[]); const p=adaptive.profile[name]||{route:'Kazanım',level:2};
    const fresh=bank().filter(q=>q.subject===name&&!seen.has(q.id));
    const desiredType=p.route==='Yeni Nesil'?'Yeni Nesil':'Kazanım';
    const targetRank=p.route==='Yeni Nesil' ? (p.level>=3.5?4:p.level>=2.75?3:2) : (p.level>=1.75?2:1);
    const preferred=fresh.filter(q=>qType(q)===desiredType).sort((a,b)=>Math.abs(qRank(a)-targetRank)-Math.abs(qRank(b)-targetRank));
    const picked=[];
    const add=list=>{ for(const q of list){if(picked.length>=count)break;if(!picked.includes(q))picked.push(q)} };
    add(preferred);
    add(fresh.filter(q=>!picked.includes(q)).sort((a,b)=>Math.abs(qRank(a)-targetRank)-Math.abs(qRank(b)-targetRank)));
    return picked.slice(0,count);
  }

  function prepareWeeklyMock(){
    annotateBank();
    const selected=[];
    for(const name of Object.keys(SUBJECTS)) selected.push(...chooseWeeklySubject(name,4));
    if(selected.length<20) return null;
    const b=bank(), snapshot=[...b];
    b.splice(0,b.length,...selected);
    return ()=>b.splice(0,b.length,...snapshot);
  }

  function wireWeeklyMockFilter(){
    const btn=document.getElementById('startMock'); if(!btn||btn.dataset.adaptiveBound)return;
    btn.dataset.adaptiveBound='1';
    btn.addEventListener('click',()=>{
      const restore=prepareWeeklyMock();
      if(restore) queueMicrotask(restore);
    },true);
  }

  function projectedSubjectStats(rows){
    const out={};
    Object.entries(SUBJECTS).forEach(([name,cfg])=>{
      const r=rows.filter(x=>x.subject===name); if(!r.length)return;
      const correct=r.filter(x=>!x.assisted&&x.selected!==null&&x.correct).length;
      const wrong=r.filter(x=>!x.assisted&&x.selected!==null&&!x.correct).length;
      const blank=r.length-correct-wrong;
      const rawNet=correct-wrong/3;
      const net=rawNet/r.length*cfg.officialQuestions;
      const accuracy=(correct+wrong)?correct/(correct+wrong)*100:0;
      out[name]={asked:r.length,correct,wrong,blank,net,accuracy,threshold:cfg.threshold};
    });
    return out;
  }

  function enrichRows(rows){
    rows.forEach(r=>{
      const q=questionById(r.id); if(!q)return;
      r.difficulty=qDifficulty(q); r.questionType=qType(q);
    });
  }

  function estimatedScore(rows){
    if(window.LgsArenaScoring?.calculate){
      try{return window.LgsArenaScoring.calculate(rows).estimatedScore}catch{}
    }
    const stats=projectedSubjectStats(rows); let earned=0,max=0;
    Object.entries(stats).forEach(([name,s])=>{const c=SUBJECTS[name];const coef=['Türkçe','Matematik','Fen Bilimleri'].includes(name)?4:1;earned+=s.net*coef;max+=c.officialQuestions*coef});
    return 100+400*clamp(max?earned/max:0,0,1);
  }

  function latestExamRows(){
    const page=document.getElementById('resultPage');
    if(!page?.classList.contains('active'))return [];
    if(document.getElementById('quizModeLabel')?.textContent?.trim()!=='DENEME')return [];
    const total=parseInt(document.getElementById('resultTotal')?.textContent||'0',10)||0;
    const app=readApp(), h=Array.isArray(app.history)?app.history:[];
    return total?h.slice(-Math.min(total,h.length)):[];
  }

  function processWeeklyResult(){
    const rows=latestExamRows(); if(!rows.length)return;
    const fingerprint=rows.map(r=>r.id).join('|')+`:${document.getElementById('rCorrect')?.textContent}:${document.getElementById('rWrong')?.textContent}`;
    if(fingerprint===adaptive.lastFingerprint)return;

    const app=readApp(); const h=Array.isArray(app.history)?app.history:[]; const tail=h.slice(-rows.length);
    enrichRows(tail); app.history=h; writeApp(app);

    const score=estimatedScore(tail);
    const prior=adaptive.scoreHistory.slice(-3).map(x=>x.score);
    const baseline=prior.length?avg(prior):score;
    const delta=score-baseline;
    const stats=projectedSubjectStats(tail);
    const beforeGlobal=avg(Object.values(adaptive.profile).map(x=>x.level||2));
    let anyDown=false, anyUp=false;

    Object.entries(SUBJECTS).forEach(([name,cfg])=>{
      const p={route:'Kazanım',level:2,...adaptive.profile[name]}; const s=stats[name]; if(!s)return;
      const old=p.level;
      p.lastNet=s.net; p.lastAccuracy=s.accuracy;
      if(s.net>=cfg.threshold){
        p.route='Yeni Nesil';
        if(delta>=5 || s.net>=cfg.threshold+1.5) p.level=clamp(p.level+.25,1,4);
      }else{
        p.route='Kazanım';
        p.level=clamp(p.level-.25,1,4);
        if(p.level>2.5)p.level=2.5;
      }
      if(delta<=-5) p.level=clamp(p.level-.25,1,4);
      if(p.level<old)anyDown=true; if(p.level>old)anyUp=true;
      adaptive.profile[name]=p;
    });

    const afterGlobal=avg(Object.values(adaptive.profile).map(x=>x.level||2));
    if(anyDown || anyUp){
      adaptive.lastLevelChange={direction:afterGlobal<beforeGlobal?'down':'up',from:beforeGlobal,to:afterGlobal,scoreDelta:delta,date:new Date().toISOString(),reason:afterGlobal<beforeGlobal?'Son deneme puanı/netleri hedefin altında kaldığı için zorluk kademeli azaltıldı.':'Net ve puan eğilimi yükseldiği için zorluk kademeli artırıldı.'};
    }
    adaptive.scoreHistory.push({date:new Date().toISOString(),week:weekKey(),score});
    adaptive.scoreHistory=adaptive.scoreHistory.slice(-20);
    adaptive.weeklyAttempts.push({date:new Date().toISOString(),week:weekKey(),score,baseline,delta,stats,levelBefore:beforeGlobal,levelAfter:afterGlobal});
    adaptive.weeklyAttempts=adaptive.weeklyAttempts.slice(-12);
    adaptive.lastFingerprint=fingerprint;
    saveAdaptive();
    renderWeeklyMock(); renderParentCoach();
  }

  function mockRouteRows(){
    return Object.entries(SUBJECTS).map(([name,cfg])=>{
      const p=adaptive.profile[name]||{route:'Kazanım',level:2,lastNet:null};
      const net=p.lastNet===null?'—':tr(p.lastNet,1);
      return `<div><span>${cfg.short}</span><b class="${p.route==='Yeni Nesil'?'newgen':''}">${p.route}</b><em>${RANK_LABEL(p.level)} · ${net}/${cfg.officialQuestions}</em></div>`;
    }).join('');
  }

  function renderWeeklyMock(){
    const page=document.querySelector('[data-page="mock"]'); if(!page)return;
    const kicker=page.querySelector('.mock-card>div>span'); const title=page.querySelector('.mock-card h2'); const copy=page.querySelector('.mock-card p');
    const ring=page.querySelector('.mock-ring span'); const btn=document.getElementById('startMock');
    if(kicker)kicker.textContent='HAFTALIK ADAPTİF DENEME';
    if(title)title.textContent='Zeus Haftalık Seviye Denemesi';
    if(copy)copy.textContent='5 ders · 20 soru · seviyene göre Kazanım / Yeni Nesil';
    if(ring)ring.textContent='20';
    if(btn)btn.textContent='Bu Haftanın Denemesini Başlat';
    let card=document.getElementById('weeklyAdaptiveStatus');
    if(!card){card=document.createElement('section');card.id='weeklyAdaptiveStatus';card.className='weekly-adaptive-status';const rules=page.querySelector('.mock-rules');rules?.after(card)}
    const last=adaptive.weeklyAttempts.at(-1); const trend=last?(last.delta>=5?'Yükseliş':last.delta<=-5?'Seviye Gerilemesi':'Dengeli'):'Başlangıç';
    card.innerHTML=`<header><div><span>${weekKey()} · ZEUS ROTASI</span><b>${trend}</b></div><em>${RANK_LABEL(avg(Object.values(adaptive.profile).map(x=>x.level||2)))}</em></header><div class="weekly-route-grid">${mockRouteRows()}</div><p>20 soruluk mini deneme tam LGS dağılımına ölçeklenir. 20 soruluk derslerde 13 net; 10 soruluk derslerde 6,5 net eşiği Yeni Nesil rotasını açar.</p>`;
  }

  function difficultyAnalysis(){
    const app=readApp(), rows=(app.history||[]).slice(-100); const mix={Kolay:0,Orta:0,Zor:0,Efsane:0}, topics={};
    rows.forEach(r=>{
      const q=questionById(r.id); const diff=r.difficulty||qDifficulty(q); mix[diff]=(mix[diff]||0)+1;
      const topic=r.topic||q?.topic; if(!topic)return;
      topics[topic]||={n:0,w:0,b:0,hardWrong:0}; const t=topics[topic];t.n++;
      if(r.selected===null)t.b++; else if(!r.correct&&!r.assisted){t.w++;if((DIFF_RANK[diff]||2)>=3)t.hardWrong++}
    });
    const weak=Object.entries(topics).map(([topic,v])=>({topic,...v,score:v.w*2+v.b+v.hardWrong*.7})).sort((a,b)=>b.score-a.score)[0];
    return {mix,weak,total:rows.length};
  }

  function parentMotivation(){
    const last=adaptive.weeklyAttempts.at(-1); const change=adaptive.lastLevelChange; const da=difficultyAnalysis();
    if(change?.direction==='down'){
      return {headline:'Seviye gerilemesi kontrollü biçimde uygulandı',student:`Son denemede puan eğilimi ${tr(Math.abs(change.scoreDelta),1)} puan aşağı geldi. Sistem zorluğu bir anda düşürmek yerine çeyrek kademe geri çekti ve zayıf alanlarda Kazanım sorularına döndü.`,parent:'Çocuğunuza “puan düştü” yerine “hangi konuyu birlikte sağlamlaştıracağımız belli oldu” mesajını verin. Bu hafta hedef, doğru sayısından önce düzenli çalışma ve yanlış analizi olsun.'};
    }
    if(last?.delta>=5){
      return {headline:'Performans yükseliyor, zorluk kontrollü artıyor',student:`Son tahmini puan, önceki ortalamadan ${tr(last.delta,1)} puan yüksek. Sistem güçlü derslerde Yeni Nesil oranını ve zorluk seviyesini çeyrek kademe artırdı.`,parent:'Sonucu değil süreci övün: “Daha zor sorularda çözüm üretmen gelişti.” Yeni Nesil sorularda süre uzasa bile acele ettirmeyin; çözüm yolunu anlatmasını isteyin.'};
    }
    return {headline:'Tempo dengeli, temel ve muhakeme birlikte izleniyor',student:da.weak?`${da.weak.topic} şu an öncelikli gelişim alanı. Yanlışların zorluk seviyesine göre sistem bir sonraki haftanın rotasını ayarlıyor.`:'Henüz ayrıntılı analiz için daha fazla soru çözümü gerekiyor.',parent:'Günlük hedef tamamlandığında kısa ve somut geri bildirim verin. “Bugün planını tamamlaman güzeldi” gibi süreç odaklı cümleler motivasyonu puana bağlamadan güçlendirir.'};
  }

  function ensureParentCoach(){
    const dash=document.getElementById('parentDashboardView'); if(!dash)return null;
    let box=document.getElementById('parentAdaptiveCoach'); if(box)return box;
    box=document.createElement('section');box.id='parentAdaptiveCoach';box.className='parent-adaptive-coach';
    const actions=dash.querySelector('.parent-dashboard-actions'); actions?dash.insertBefore(box,actions):dash.appendChild(box); return box;
  }

  function renderParentCoach(){
    const box=ensureParentCoach(); if(!box)return;
    const m=parentMotivation(), da=difficultyAnalysis(), last=adaptive.weeklyAttempts.at(-1);
    const mixTotal=Math.max(1,Object.values(da.mix).reduce((a,b)=>a+b,0));
    const mixText=Object.entries(da.mix).filter(([,n])=>n).map(([k,n])=>`${k} %${Math.round(n/mixTotal*100)}`).join(' · ')||'Henüz veri yok';
    const subjectRows=Object.entries(SUBJECTS).map(([name,cfg])=>{const p=adaptive.profile[name]||{};return `<div class="parent-adaptive-row"><span>${cfg.short}</span><b>${p.lastNet==null?'—':tr(p.lastNet,1)} net</b><em class="${p.route==='Yeni Nesil'?'newgen':''}">${p.route||'Kazanım'} · ${RANK_LABEL(p.level||2)}</em></div>`}).join('');
    box.innerHTML=`<header><div><span>⚡ ZEUS VELİ KOÇLUĞU</span><b>${m.headline}</b></div><em>${last?`${tr(last.score,1)} puan`:'İlk deneme bekleniyor'}</em></header><div class="parent-adaptive-subjects">${subjectRows}</div><div class="parent-depth-analysis"><p><span>Son 100 sorunun zorluk dağılımı</span><b>${mixText}</b></p><p><span>Öncelikli eksik yön</span><b>${da.weak?.topic||'Henüz veri yok'}</b></p></div><div class="parent-coach-message"><span>ÖĞRENCİ ANALİZİ</span><p>${m.student}</p></div><div class="parent-coach-message parent-tip"><span>VELİYE MOTİVASYON ÖNERİSİ</span><p>${m.parent}</p></div>`;
    const existing=document.getElementById('pZeusAdvice'); if(existing)existing.textContent=m.student;
  }

  function observeResultAndQuestion(){
    const result=document.getElementById('resultPage');
    if(result)new MutationObserver(()=>requestAnimationFrame(()=>{processWeeklyResult();renderParentCoach()})).observe(result,{subtree:true,childList:true,characterData:true,attributes:true,attributeFilter:['class']});
    const qText=document.getElementById('questionText');
    if(qText)new MutationObserver(()=>requestAnimationFrame(renderQuestionTags)).observe(qText,{subtree:true,childList:true,characterData:true});
    const dash=document.getElementById('parentDashboardView');
    if(dash)new MutationObserver(()=>requestAnimationFrame(renderParentCoach)).observe(dash,{subtree:false,attributes:true,attributeFilter:['class']});
  }

  function init(){
    annotateBank(); wireWeeklyMockFilter(); renderWeeklyMock(); ensureQuestionTags(); renderQuestionTags(); ensureParentCoach(); renderParentCoach(); observeResultAndQuestion();
    window.addEventListener('storage',e=>{if(e.key===APP_KEY||e.key===ADAPT_KEY){adaptive=readAdaptive();renderWeeklyMock();renderParentCoach()}});
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
  window.LgsArenaAdaptive={state:()=>adaptive,renderParentCoach,renderWeeklyMock,processWeeklyResult};
})();