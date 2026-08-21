(() => {
  'use strict';

  const APP_KEY='lgsArenaPwaV02';
  const ADAPT_KEY='lgsArenaAdaptiveV17';
  const WEEKLY_KEY='lgsArenaWeeklyExamV18';
  const SUBJECTS={
    'Türkçe':{short:'Türkçe',questions:20,coef:4,threshold:13,section:'verbal'},
    'İnkılap Tarihi':{short:'İnkılap',questions:10,coef:1,threshold:6.5,section:'verbal'},
    'Din Kültürü':{short:'Din',questions:10,coef:1,threshold:6.5,section:'verbal'},
    'Yabancı Dil':{short:'Yabancı Dil',questions:10,coef:1,threshold:6.5,section:'verbal'},
    'Matematik':{short:'Matematik',questions:20,coef:4,threshold:13,section:'numeric'},
    'Fen Bilimleri':{short:'Fen',questions:20,coef:4,threshold:13,section:'numeric'}
  };
  const VERBAL_ORDER=['Türkçe','İnkılap Tarihi','Din Kültürü','Yabancı Dil'];
  const NUMERIC_ORDER=['Matematik','Fen Bilimleri'];
  const DIFF_RANK={Kolay:1,Orta:2,Zor:3,Efsane:4};
  const defaults={results:[],weeklySeenIds:[],earnedBadges:[],timeoutTerminations:0,lastResult:null};
  let weekly=readWeekly();
  let exam=null;
  let tickTimer=null;
  let breakTimer=null;
  let entryTimer=null;

  function readJson(key,fallback={}){try{return JSON.parse(localStorage.getItem(key)||'{}')}catch{return fallback}}
  function writeJson(key,value){localStorage.setItem(key,JSON.stringify(value))}
  function readWeekly(){return {...defaults,...readJson(WEEKLY_KEY,{})}}
  function saveWeekly(){writeJson(WEEKLY_KEY,weekly)}
  function bank(){return window.QUESTION_BANK||[]}
  function clamp(n,min,max){return Math.max(min,Math.min(max,n))}
  function avg(a){return a.length?a.reduce((x,y)=>x+y,0)/a.length:0}
  function fmt(n,d=1){return Number(n||0).toLocaleString('tr-TR',{minimumFractionDigits:d,maximumFractionDigits:d})}
  function formatClock(seconds){seconds=Math.max(0,Math.floor(seconds));return `${String(Math.floor(seconds/60)).padStart(2,'0')}:${String(seconds%60).padStart(2,'0')}`}
  function qType(q){return q?.questionType==='Yeni Nesil'?'Yeni Nesil':'Kazanım'}
  function qDiff(q){return q?.difficulty||'Orta'}
  function diffLabel(level){return level>=3.5?'Efsane':level>=2.75?'Zor':level>=1.75?'Orta':'Kolay'}
  function weekKey(date=new Date()){
    const d=new Date(Date.UTC(date.getFullYear(),date.getMonth(),date.getDate()));
    const day=d.getUTCDay()||7;d.setUTCDate(d.getUTCDate()+4-day);
    const y=new Date(Date.UTC(d.getUTCFullYear(),0,1));
    const w=Math.ceil((((d-y)/86400000)+1)/7);
    return `${d.getUTCFullYear()}-W${String(w).padStart(2,'0')}`;
  }

  function adaptiveState(){
    const raw=readJson(ADAPT_KEY,{});
    raw.profile=raw.profile||{};raw.scoreHistory=raw.scoreHistory||[];raw.weeklyAttempts=raw.weeklyAttempts||[];
    return raw;
  }
  function profileFor(name){
    const a=adaptiveState();
    return {route:'Kazanım',level:2,lastNet:null,lastAccuracy:null,...(a.profile[name]||{})};
  }

  function subjectPool(name){return bank().filter(q=>q.subject===name)}
  function ensureFreshPool(name,count){
    const ids=new Set(subjectPool(name).map(q=>q.id));
    let seen=new Set(weekly.weeklySeenIds||[]);
    let fresh=subjectPool(name).filter(q=>!seen.has(q.id));
    if(fresh.length<count&&ids.size>=count){
      weekly.weeklySeenIds=(weekly.weeklySeenIds||[]).filter(id=>!ids.has(id));
      seen=new Set(weekly.weeklySeenIds);
      fresh=subjectPool(name).filter(q=>!seen.has(q.id));
    }
    return fresh;
  }
  function pickSubject(name,count){
    const p=profileFor(name),fresh=ensureFreshPool(name,count);
    if(fresh.length<count)return [];
    const desired=p.route==='Yeni Nesil'?'Yeni Nesil':'Kazanım';
    const target=p.route==='Yeni Nesil'?(p.level>=3.5?4:p.level>=2.75?3:2):(p.level>=1.75?2:1);
    const scored=fresh.map(q=>({q,score:(qType(q)===desired?0:4)+Math.abs((DIFF_RANK[qDiff(q)]||2)-target)+Math.random()*.35})).sort((a,b)=>a.score-b.score);
    return scored.slice(0,count).map(x=>x.q);
  }
  function buildExamQuestions(){
    const verbal=[],numeric=[];
    for(const name of VERBAL_ORDER){const q=pickSubject(name,SUBJECTS[name].questions);if(q.length!==SUBJECTS[name].questions)return null;verbal.push(...q)}
    for(const name of NUMERIC_ORDER){const q=pickSubject(name,SUBJECTS[name].questions);if(q.length!==SUBJECTS[name].questions)return null;numeric.push(...q)}
    return {verbal,numeric};
  }

  function ensureOverlay(){
    let root=document.getElementById('weeklyExamOverlay');if(root)return root;
    root=document.createElement('div');root.id='weeklyExamOverlay';root.className='weekly-exam-overlay hidden';
    root.innerHTML=`<section class="weekly-exam-shell" role="dialog" aria-modal="true" aria-label="Haftalık LGS denemesi">
      <div id="weeklyExamBody"></div>
    </section>`;
    document.body.appendChild(root);return root;
  }
  function body(){return document.getElementById('weeklyExamBody')}
  function showOverlay(){ensureOverlay().classList.remove('hidden')}
  function hideOverlay(){ensureOverlay().classList.add('hidden')}
  function stopAllTimers(){clearInterval(tickTimer);clearInterval(breakTimer);clearInterval(entryTimer);tickTimer=breakTimer=entryTimer=null}

  function renderWarning(){
    showOverlay();stopAllTimers();
    body().innerHTML=`<div class="weekly-warning">
      <header><span>⚡ HAFTALIK LGS PROVASI</span><h2>90 soruluk iki oturumlu sınav</h2><p>Son yayımlanan MEB merkezî sınav formatı esas alınır. 2027 kılavuzu yayımlandığında süreler güncellenecektir.</p></header>
      <div class="weekly-format-grid"><div><b>50</b><span>Sözel soru</span><em>75 dakika</em></div><div><b>45</b><span>Resmî ara</span><em>dakika</em></div><div><b>40</b><span>Sayısal soru</span><em>80 dakika</em></div></div>
      <section class="weekly-critical"><b>Sınav başlamadan önce bilmen gerekenler</b>
        <p>• Sözel sorularda soru başına 90 saniye, sayısal sorularda 120 saniyelik karar sayacı çalışır. Sayaç bittiğinde cevap şıkkı işaretlenmemişse haftalık deneme o anda sona erer.</p>
        <p>• Sözel bölüm bitince mola istemezsen doğrudan sayısal bölüme geçersin. Mola istersen 15, 30 veya son yayımlanan resmî düzene eşdeğer 45 dakika seçebilirsin.</p>
        <p>• Seçtiğin mola bittiğinde sayısal oturuma giriş ekranı 3 dakika açık kalır. Bu sürede giriş yapılmazsa sınav sonlandırılır.</p>
        <p>• Bu haftaki Kazanım / Yeni Nesil rotan, zorluk seviyen ve çalışma planın bu denemenin net ve puan sonucuna göre yeniden düzenlenir.</p>
      </section>
      <label class="weekly-confirm"><input id="weeklyRulesAccepted" type="checkbox"><span>Kuralları okudum ve haftalık denemeyi başlatmak istiyorum.</span></label>
      <div class="weekly-warning-actions"><button id="weeklyWarningCancel" class="weekly-secondary">Vazgeç</button><button id="weeklyWarningStart" class="weekly-primary" disabled>Sınavı Başlat</button></div>
    </div>`;
    const check=document.getElementById('weeklyRulesAccepted'),start=document.getElementById('weeklyWarningStart');
    check.onchange=()=>start.disabled=!check.checked;
    document.getElementById('weeklyWarningCancel').onclick=hideOverlay;
    start.onclick=startWeeklyExam;
  }

  function startWeeklyExam(){
    const qs=buildExamQuestions();
    if(!qs){
      body().innerHTML=`<div class="weekly-warning"><h2>90 soruluk deneme için yeterli soru bulunamadı</h2><p>Demo havuzunda ilgili derslerden yeterli sayıda soru yok. Soru havuzu güncellendiğinde deneme otomatik açılacaktır.</p><button id="weeklyPoolClose" class="weekly-primary">Tamam</button></div>`;
      document.getElementById('weeklyPoolClose').onclick=hideOverlay;return;
    }
    exam={week:weekKey(),status:'running',section:'verbal',verbal:qs.verbal,numeric:qs.numeric,index:0,answers:{},startedAt:new Date().toISOString(),sectionRemaining:75*60,questionRemaining:90,breakMinutes:0,terminationReason:null};
    [...qs.verbal,...qs.numeric].forEach(q=>{if(!weekly.weeklySeenIds.includes(q.id))weekly.weeklySeenIds.push(q.id)});saveWeekly();
    renderQuestion();startQuestionTimers();
  }
  function sectionQuestions(){return exam.section==='verbal'?exam.verbal:exam.numeric}
  function currentQuestion(){return sectionQuestions()[exam.index]}
  function selectedFor(q){return exam.answers[q.id]}
  function sessionNumber(){return exam.section==='verbal'?1:2}

  function renderQuestion(){
    const q=currentQuestion();if(!q)return;
    const selected=selectedFor(q);
    const sectionTotal=exam.section==='verbal'?50:40;
    const sectionName=exam.section==='verbal'?'SÖZEL OTURUM':'SAYISAL OTURUM';
    const qSeconds=exam.section==='verbal'?90:120;
    exam.questionRemaining=qSeconds;
    body().innerHTML=`<div class="weekly-question-screen">
      <header class="weekly-exam-head"><div><span>${sectionName} · ${sessionNumber()}. OTURUM</span><b>${exam.index+1} / ${sectionTotal}</b></div><div class="weekly-timers"><span>Oturum <b id="weeklySectionClock">${formatClock(exam.sectionRemaining)}</b></span><span>Soru <b id="weeklyQuestionClock">${formatClock(exam.questionRemaining)}</b></span></div></header>
      <div class="weekly-progress"><i style="width:${(exam.index+1)/sectionTotal*100}%"></i></div>
      <div class="weekly-question-tags"><span>${q.subject} · ${q.topic}</span><em class="${qType(q)==='Yeni Nesil'?'newgen':'gain'}">${qType(q)}</em><b class="diff-${qDiff(q).toLowerCase()}">${qDiff(q)==='Efsane'?'⚡ Efsane':qDiff(q)}</b></div>
      <h2 class="weekly-question-text"></h2><div id="weeklyOptions" class="weekly-options"></div>
      <div class="weekly-question-actions"><span>Şık işaretlenmeden soru sayacı biterse sınav sona erer.</span><button id="weeklyNext" class="weekly-primary" ${selected===undefined?'disabled':''}>${exam.index===sectionTotal-1?'Oturumu Tamamla':'Sonraki Soru'}</button></div>
    </div>`;
    document.querySelector('.weekly-question-text').textContent=q.question;
    const opts=document.getElementById('weeklyOptions');
    q.options.forEach((text,i)=>{
      const btn=document.createElement('button');btn.className='weekly-option'+(selected===i?' selected':'');
      const letter=document.createElement('span');letter.textContent=String.fromCharCode(65+i);const copy=document.createElement('b');copy.textContent=text;btn.append(letter,copy);
      btn.onclick=()=>{exam.answers[q.id]=i;[...opts.children].forEach((x,n)=>x.classList.toggle('selected',n===i));document.getElementById('weeklyNext').disabled=false};opts.appendChild(btn);
    });
    document.getElementById('weeklyNext').onclick=advanceQuestion;
  }

  function startQuestionTimers(){
    clearInterval(tickTimer);tickTimer=setInterval(()=>{
      if(!exam||exam.status!=='running')return;
      exam.sectionRemaining--;exam.questionRemaining--;
      const s=document.getElementById('weeklySectionClock'),q=document.getElementById('weeklyQuestionClock');if(s)s.textContent=formatClock(exam.sectionRemaining);if(q)q.textContent=formatClock(exam.questionRemaining);
      if(exam.questionRemaining<=10)q?.classList.add('danger');
      const current=currentQuestion();
      if(exam.questionRemaining<=0){
        if(selectedFor(current)===undefined){terminateExam('question-timeout');return}
        advanceQuestion();return;
      }
      if(exam.sectionRemaining<=0){
        if(exam.section==='verbal')completeVerbal();else finishExam('completed');
      }
    },1000);
  }

  function advanceQuestion(){
    const q=currentQuestion();if(selectedFor(q)===undefined)return;
    const list=sectionQuestions();
    if(exam.index<list.length-1){exam.index++;renderQuestion();return}
    if(exam.section==='verbal')completeVerbal();else finishExam('completed');
  }

  function completeVerbal(){
    clearInterval(tickTimer);tickTimer=null;exam.status='break-choice';
    body().innerHTML=`<div class="weekly-break-choice"><span>✓ SÖZEL OTURUM TAMAMLANDI</span><h2>Sayısal bölümden önce mola ister misin?</h2><p>Son yayımlanan LGS düzeninde iki oturum arasında 45 dakika ara vardır. Arena provasında daha kısa mola seçebilir veya doğrudan sayısala geçebilirsin.</p>
      <div class="weekly-break-options"><button data-break="0"><b>0 dk</b><span>Direkt geç</span></button><button data-break="15"><b>15 dk</b><span>Kısa mola</span></button><button data-break="30"><b>30 dk</b><span>Orta mola</span></button><button data-break="45" class="official"><b>45 dk</b><span>MEB formatı</span></button></div>
      <small>Mola seçersen süre bitmeden sayısal bölüm açılmaz. Mola sonunda 3 dakikalık giriş penceresi başlar.</small></div>`;
    document.querySelectorAll('[data-break]').forEach(b=>b.onclick=()=>chooseBreak(Number(b.dataset.break)));
  }
  function chooseBreak(minutes){exam.breakMinutes=minutes;if(minutes===0){startNumeric();return}startBreak(minutes)}
  function startBreak(minutes){
    exam.status='break';let left=minutes*60;
    body().innerHTML=`<div class="weekly-break-screen"><span>☕ MOLA</span><h2>${minutes} dakikalık mola başladı</h2><strong id="weeklyBreakClock">${formatClock(left)}</strong><p>Süre bittiğinde sayısal oturuma giriş ekranı açılacak. Sonrasında 3 dakika içinde giriş yapmalısın.</p><div class="weekly-break-note">Ekranı açık tutman önerilir. Bu sayaç gerçek süreyle çalışır.</div></div>`;
    clearInterval(breakTimer);breakTimer=setInterval(()=>{left--;const el=document.getElementById('weeklyBreakClock');if(el)el.textContent=formatClock(left);if(left<=0){clearInterval(breakTimer);breakTimer=null;startNumericEntryGate()}},1000);
  }
  function startNumericEntryGate(){
    exam.status='entry-gate';let left=180;
    body().innerHTML=`<div class="weekly-entry-gate"><span>⚡ SAYISAL OTURUM HAZIR</span><h2>3 dakika içinde giriş yap</h2><strong id="weeklyEntryClock">03:00</strong><p>Bu süre içinde “Sayısal Oturuma Gir” düğmesine basılmazsa haftalık deneme sona erecek.</p><button id="weeklyEnterNumeric" class="weekly-primary">Sayısal Oturuma Gir</button></div>`;
    document.getElementById('weeklyEnterNumeric').onclick=startNumeric;
    clearInterval(entryTimer);entryTimer=setInterval(()=>{left--;const el=document.getElementById('weeklyEntryClock');if(el)el.textContent=formatClock(left);if(left<=0){clearInterval(entryTimer);entryTimer=null;terminateExam('numeric-entry-timeout')}},1000);
  }
  function startNumeric(){
    clearInterval(breakTimer);clearInterval(entryTimer);breakTimer=entryTimer=null;
    exam.status='running';exam.section='numeric';exam.index=0;exam.sectionRemaining=80*60;exam.questionRemaining=120;renderQuestion();startQuestionTimers();
  }

  function buildRows(){
    return [...exam.verbal,...exam.numeric].map(q=>{
      const selected=exam.answers[q.id];const answered=selected!==undefined;const correct=answered&&selected===q.answer;
      return {id:q.id,subject:q.subject,topic:q.topic,difficulty:qDiff(q),questionType:qType(q),selected:answered?selected:null,answer:q.answer,correct,assisted:false};
    });
  }
  function scoreRows(rows){
    const details={};let weighted=0,maxWeighted=0,totalNet=0,correct=0,wrong=0,blank=0;
    Object.entries(SUBJECTS).forEach(([name,cfg])=>{
      const r=rows.filter(x=>x.subject===name);const c=r.filter(x=>x.selected!==null&&x.correct).length;const w=r.filter(x=>x.selected!==null&&!x.correct).length;const b=r.length-c-w;const net=c-w/3;
      details[name]={correct:c,wrong:w,blank:b,net,questions:cfg.questions,threshold:cfg.threshold};correct+=c;wrong+=w;blank+=b;totalNet+=net;weighted+=net*cfg.coef;maxWeighted+=cfg.questions*cfg.coef;
    });
    const ratio=clamp(maxWeighted?weighted/maxWeighted:0,0,1);return {score:100+400*ratio,totalNet,correct,wrong,blank,details,weightedPercent:ratio*100};
  }
  function progressTitle(score){return score>=480?'Efsane':score>=450?'Usta':score>=400?'Şampiyon Adayı':score>=350?'Yükselen':score>=300?'Gelişen':'Temel Güçlendirme'}
  function badgeCandidates(result,previous){
    if(result.status!=='completed')return [];
    const list=[];if(!previous)list.push('İlk 90');if(result.score>=350)list.push('Bronz Şimşek');if(result.score>=400)list.push('Gümüş Şimşek');if(result.score>=450)list.push('Altın Şimşek');if(result.score>=480)list.push('Zeus Efsanesi');if(previous&&result.score-previous.score>=20)list.push('Büyük Yükseliş');if(result.blank===0)list.push('Tam Odak');
    if(Object.entries(result.details).every(([name,d])=>d.net>=SUBJECTS[name].threshold))list.push('Yeni Nesil Kapısı');return list;
  }
  function updateAdaptive(result){
    const a=adaptiveState(),prevScores=(a.scoreHistory||[]).slice(-3).map(x=>x.score),baseline=prevScores.length?avg(prevScores):result.score,delta=result.score-baseline;
    const before=avg(Object.keys(SUBJECTS).map(name=>(a.profile[name]?.level||2)));
    let up=false,down=false;
    Object.entries(SUBJECTS).forEach(([name,cfg])=>{
      const d=result.details[name],p={route:'Kazanım',level:2,lastNet:null,lastAccuracy:null,...(a.profile[name]||{})},old=p.level;
      p.lastNet=d.net;p.lastAccuracy=(d.correct+d.wrong)?d.correct/(d.correct+d.wrong)*100:0;
      if(d.net>=cfg.threshold){p.route='Yeni Nesil';if(delta>=5||d.net>=cfg.threshold+1.5)p.level=clamp(p.level+.25,1,4)}
      else{p.route='Kazanım';p.level=clamp(p.level-.25,1,4);if(p.level>2.5)p.level=2.5}
      if(delta<=-8)p.level=clamp(p.level-.25,1,4);
      if(p.level>old)up=true;if(p.level<old)down=true;a.profile[name]=p;
    });
    const after=avg(Object.keys(SUBJECTS).map(name=>(a.profile[name]?.level||2)));
    if(up||down)a.lastLevelChange={direction:after<before?'down':'up',from:before,to:after,scoreDelta:delta,date:new Date().toISOString(),reason:after<before?'Haftalık 90 soruluk denemede puan/net eğilimi gerilediği için zorluk kademeli azaltıldı.':'Haftalık 90 soruluk denemede puan/net eğilimi yükseldiği için zorluk kademeli artırıldı.'};
    a.scoreHistory=[...(a.scoreHistory||[]),{date:new Date().toISOString(),week:exam.week,score:result.score}].slice(-24);
    a.weeklyAttempts=[...(a.weeklyAttempts||[]),{date:new Date().toISOString(),week:exam.week,score:result.score,baseline,delta,stats:result.details,levelBefore:before,levelAfter:after,status:result.status}].slice(-16);
    writeJson(ADAPT_KEY,a);result.levelBefore=before;result.levelAfter=after;result.scoreDelta=delta;result.routeSummary=Object.fromEntries(Object.keys(SUBJECTS).map(name=>[name,{route:a.profile[name].route,level:a.profile[name].level}]));
  }

  function finishExam(status,reason=null){
    stopAllTimers();if(!exam)return;exam.status=status;exam.terminationReason=reason;
    const rows=buildRows(),sc=scoreRows(rows),previous=weekly.lastResult;
    const result={id:`${exam.week}-${Date.now()}`,week:exam.week,date:new Date().toISOString(),status,reason,breakMinutes:exam.breakMinutes,...sc,progressTitle:progressTitle(sc.score),progressPercent:clamp((sc.score-100)/4,0,100)};
    updateAdaptive(result);const candidates=badgeCandidates(result,previous);const newBadges=candidates.filter(b=>!weekly.earnedBadges.includes(b));newBadges.forEach(b=>weekly.earnedBadges.push(b));result.badges=candidates;result.newBadges=newBadges;
    if(reason==='question-timeout'||reason==='numeric-entry-timeout')weekly.timeoutTerminations=(weekly.timeoutTerminations||0)+1;
    weekly.lastResult=result;weekly.results=[...(weekly.results||[]),result].slice(-16);saveWeekly();renderResult(result);renderParentSummary();
    window.LgsArenaAdaptive?.renderParentCoach?.();window.LgsArenaAdaptive?.renderWeeklyMock?.();
  }
  function terminateExam(reason){finishExam('terminated',reason)}
  function reasonText(reason){return reason==='question-timeout'?'Bir soruda cevap işaretlenmeden soru süresi doldu.':reason==='numeric-entry-timeout'?'Mola sonrası 3 dakikalık sayısal oturum giriş süresi doldu.':'Sınav süre kuralı nedeniyle sonlandırıldı.'}

  function renderResult(r){
    const delta=r.scoreDelta||0;const trend=delta>4?`+${fmt(delta,1)} puan yükseliş`:delta<-4?`${fmt(delta,1)} puan gerileme`:'Dengeli performans';
    const badges=(r.newBadges?.length?r.newBadges:r.badges||[]).map(b=>`<span>🏅 ${b}</span>`).join('')||'<span>Yeni rozet yok</span>';
    const rows=Object.entries(SUBJECTS).map(([name,cfg])=>{const d=r.details[name],route=r.routeSummary?.[name];return `<div><span>${cfg.short}</span><b>${fmt(d.net,2)} net</b><em>${route?.route||'Kazanım'} · ${diffLabel(route?.level||2)}</em></div>`}).join('');
    body().innerHTML=`<div class="weekly-result ${r.status==='terminated'?'terminated':''}">
      <header><span>${r.status==='completed'?'✓ DENEME SINAVI SONUCU':'⚠ DENEME SONLANDIRILDI'}</span><h2>${fmt(r.score,1)} <small>/ 500</small></h2><p>${r.status==='terminated'?reasonText(r.reason):'90 soruluk haftalık LGS provası tamamlandı.'}</p></header>
      <div class="weekly-result-kpis"><div><span>Toplam net</span><b>${fmt(r.totalNet,2)} / 90</b></div><div><span>Doğru</span><b>${r.correct}</b></div><div><span>Yanlış</span><b>${r.wrong}</b></div><div><span>Boş</span><b>${r.blank}</b></div></div>
      <section class="weekly-progress-result"><div><span>İLERLEME SEVİYESİ</span><b>${r.progressTitle}</b><em>${trend}</em></div><div class="weekly-level-track"><i style="width:${r.progressPercent}%"></i></div></section>
      <section class="weekly-badges"><b>Kazanılan / aktif rozetler</b><div>${badges}</div></section>
      <section class="weekly-subject-result"><b>Yeni haftalık çalışma rotası</b>${rows}</section>
      <p class="weekly-result-note">Bu sonuç, önümüzdeki haftanın Kazanım / Yeni Nesil dağılımını ve zorluk kademesini belirledi. Veli Paneli de aynı sonucu ve varsa seviye değişimini gösterir.</p>
      <button id="weeklyResultClose" class="weekly-primary">Arena'ya Dön</button>
    </div>`;
    document.getElementById('weeklyResultClose').onclick=()=>{hideOverlay();document.querySelector('#bottomNav [data-nav="arena"]')?.click()};
  }

  function renderMockCard(){
    const page=document.querySelector('[data-page="mock"]');if(!page)return;
    const ring=page.querySelector('.mock-ring span'),kicker=page.querySelector('.mock-card>div>span'),title=page.querySelector('.mock-card h2'),copy=page.querySelector('.mock-card p'),btn=document.getElementById('startMock');
    if(ring)ring.textContent='90';if(kicker)kicker.textContent='HAFTALIK GERÇEK SINAV PROVASI';if(title)title.textContent='Zeus 90 Soruluk LGS Denemesi';if(copy)copy.textContent='50 sözel · 40 sayısal · mola seçimi · sonuç haftalık rotanı belirler';if(btn)btn.textContent='90 Soruluk Haftalık Denemeyi Başlat';
    const rules=page.querySelector('.mock-rules');if(rules&&rules.children.length>=3){rules.children[0].innerHTML='<b>75 dk</b><span>Sözel</span>';rules.children[1].innerHTML='<b>45 dk</b><span>Resmî ara</span>';rules.children[2].innerHTML='<b>80 dk</b><span>Sayısal</span>'}
    let note=document.getElementById('weeklyV18FormatNote');if(!note){note=document.createElement('div');note.id='weeklyV18FormatNote';note.className='weekly-format-note';page.querySelector('.mock-rules')?.after(note)}
    note.innerHTML='<b>2026 MEB formatı esas alınmıştır.</b> 2027 resmî kılavuzu yayımlandığında soru/süre yapısı güncellenecektir. Mola seçenekleri: direkt geçiş, 15 dk, 30 dk veya 45 dk.';
  }

  function wireStartButton(){
    const btn=document.getElementById('startMock');if(!btn||btn.dataset.weeklyV18)return;btn.dataset.weeklyV18='1';
    btn.addEventListener('click',e=>{e.preventDefault();e.stopImmediatePropagation();renderWarning()},true);
  }

  function recommendedPractice(name,count=10){
    if(!SUBJECTS[name])return null;const app=readJson(APP_KEY,{}),seen=new Set(app.seenIds||[]),p=profileFor(name),target=p.route==='Yeni Nesil'?(p.level>=3.5?4:p.level>=2.75?3:2):(p.level>=1.75?2:1);
    const fresh=bank().filter(q=>q.subject===name&&!seen.has(q.id));if(fresh.length<count)return null;
    const desired=p.route==='Yeni Nesil'?'Yeni Nesil':'Kazanım';return fresh.map(q=>({q,s:(qType(q)===desired?0:4)+Math.abs((DIFF_RANK[qDiff(q)]||2)-target)+Math.random()*.25})).sort((a,b)=>a.s-b.s).slice(0,count).map(x=>x.q);
  }
  function wireAdaptiveDailyPractice(){
    document.addEventListener('click',e=>{
      const btn=e.target.closest?.('[data-launch],[data-start]');if(!btn)return;const name=btn.dataset.launch||btn.dataset.start;if(!SUBJECTS[name])return;
      const selected=recommendedPractice(name,10);if(!selected)return;const b=bank(),snapshot=[...b];b.splice(0,b.length,...selected);queueMicrotask(()=>b.splice(0,b.length,...snapshot));
    },true);
  }

  function ensureParentSummary(){
    const dash=document.getElementById('parentDashboardView');if(!dash)return null;let box=document.getElementById('parentWeeklyExamSummary');if(box)return box;
    box=document.createElement('section');box.id='parentWeeklyExamSummary';box.className='parent-weekly-exam-summary';const coach=document.getElementById('parentAdaptiveCoach');const actions=dash.querySelector('.parent-dashboard-actions');if(coach)dash.insertBefore(box,coach);else if(actions)dash.insertBefore(box,actions);else dash.appendChild(box);return box;
  }
  function renderParentSummary(){
    const box=ensureParentSummary();if(!box)return;const r=weekly.lastResult;
    if(!r){box.innerHTML='<header><span>DENEME SINAVI SONUCU</span><b>Henüz haftalık 90 soruluk deneme tamamlanmadı</b></header><p>İlk denemeden sonra puan, net, ilerleme seviyesi ve rozetler burada görünecek.</p>';return}
    const delta=r.scoreDelta||0,badges=(r.newBadges?.length?r.newBadges:r.badges||[]).join(' · ')||'Yeni rozet yok';
    box.innerHTML=`<header><div><span>DENEME SINAVI SONUCU · ${r.week}</span><b>${r.status==='completed'?`${fmt(r.score,1)} puan · ${fmt(r.totalNet,2)} net`:'Sınav sonlandırıldı'}</b></div><em>${r.progressTitle}</em></header>
      <div class="parent-weekly-grid"><div><span>İlerleme</span><b>${delta>4?`+${fmt(delta,1)} puan`:delta<-4?`${fmt(delta,1)} puan`:'Dengeli'}</b></div><div><span>Rozet</span><b>${badges}</b></div></div>
      ${r.status==='terminated'?`<p class="parent-weekly-alert">${reasonText(r.reason)}</p>`:''}
      <p>Süre/giriş kuralı nedeniyle sona eren haftalık deneme sayısı: <b>${weekly.timeoutTerminations||0}</b></p>`;
  }

  function observeParent(){
    const root=document.body;new MutationObserver(()=>{if(document.getElementById('parentDashboardView'))renderParentSummary()}).observe(root,{childList:true,subtree:true});
  }

  function init(){ensureOverlay();renderMockCard();wireStartButton();wireAdaptiveDailyPractice();renderParentSummary();observeParent();}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
  window.LgsArenaWeeklyExam={open:renderWarning,renderMockCard,renderParentSummary,state:()=>weekly};
})();
