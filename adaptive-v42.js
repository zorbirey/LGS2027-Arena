(() => {
  'use strict';

  const SUBJECT_LIMITS = Object.freeze({
    'Türkçe':20,
    'Matematik':20,
    'Fen Bilimleri':20,
    'İnkılap Tarihi':10,
    'Din Kültürü':10,
    'İngilizce':10
  });
  const SUBJECT_WEIGHTS = Object.freeze({
    'Türkçe':4,
    'Matematik':4,
    'Fen Bilimleri':4,
    'İnkılap Tarihi':1,
    'Din Kültürü':1,
    'İngilizce':1
  });
  const LEVELS=['Kolay','Orta','Zor','Efsane'];
  const DIFFICULTY_WEIGHTS=[
    {Kolay:.58,Orta:.32,Zor:.09,Efsane:.01},
    {Kolay:.25,Orta:.48,Zor:.22,Efsane:.05},
    {Kolay:.10,Orta:.34,Zor:.41,Efsane:.15},
    {Kolay:.04,Orta:.18,Zor:.42,Efsane:.36}
  ];
  const NEW_GEN_SHARE=[.20,.40,.62,.78];

  function clamp(v,min,max){return Math.min(max,Math.max(min,v))}
  function net(c,w){return Number(c||0)-Number(w||0)/3}
  function emptySubjectMap(){return Object.fromEntries(Object.keys(SUBJECT_LIMITS).map(s=>[s,{correct:0,wrong:0,blank:0,net:0,projectedNet:0,sample:0}]))}

  function summarizeRows(rows=[]){
    const subjects=emptySubjectMap();
    let correct=0,wrong=0,blank=0,assisted=0;
    for(const row of rows){
      if(row.assisted){assisted++;continue}
      const target=subjects[row.subject]||(subjects[row.subject]={correct:0,wrong:0,blank:0,net:0,projectedNet:0,sample:0});
      target.sample++;
      if(row.selected===null||row.selected===undefined){blank++;target.blank++}
      else if(row.correct){correct++;target.correct++}
      else{wrong++;target.wrong++}
    }
    for(const [subject,v] of Object.entries(subjects)){
      v.net=net(v.correct,v.wrong);
      const limit=SUBJECT_LIMITS[subject]||Math.max(1,v.sample);
      v.projectedNet=v.sample?clamp(v.net*limit/v.sample,-limit/3,limit):0;
    }
    return {correct,wrong,blank,assisted,net:net(correct,wrong),subjects};
  }

  function estimateLgsScore(rows=[]){
    const summary=summarizeRows(rows);
    let weighted=0,maxWeighted=0;
    for(const [subject,limit] of Object.entries(SUBJECT_LIMITS)){
      const weight=SUBJECT_WEIGHTS[subject]||1;
      weighted+=Math.max(0,summary.subjects[subject]?.projectedNet||0)*weight;
      maxWeighted+=limit*weight;
    }
    const ratio=clamp(weighted/Math.max(1,maxWeighted),0,1);
    const score=Math.round((100+400*ratio)*10)/10;
    return {...summary,weightedRatio:ratio,estimatedScore:score};
  }

  function ensureState(state){
    if(!Array.isArray(state.examHistory))state.examHistory=[];
    if(!state.adaptive||typeof state.adaptive!=='object')state.adaptive={level:1,route:'Dengeli Kazanım + Yeni Nesil',reason:'Başlangıç seviyesi. İlk üç deneme temel çizgiyi oluşturacak.',previousAverage:null,currentScore:null,updatedAt:null};
    state.adaptive.level=clamp(Number.isFinite(Number(state.adaptive.level))?Number(state.adaptive.level):1,0,3);
    return state;
  }

  function subjectThresholdState(subjects){
    const entries=Object.entries(subjects).filter(([s,v])=>v.sample>0&&SUBJECT_LIMITS[s]);
    const weak=entries.filter(([s,v])=>v.projectedNet<(SUBJECT_LIMITS[s]*.65)).map(([s])=>s);
    const strong=entries.filter(([s,v])=>v.projectedNet>=(SUBJECT_LIMITS[s]*.75)).map(([s])=>s);
    return {weak,strong};
  }

  function updateAdaptive(state,currentResult){
    ensureState(state);
    const previous=state.examHistory.slice(-3);
    const prevAvg=previous.length===3?previous.reduce((sum,x)=>sum+Number(x.estimatedScore||0),0)/3:null;
    const oldLevel=state.adaptive.level;
    let level=oldLevel;
    const th=subjectThresholdState(currentResult.subjects);
    let route='Dengeli Kazanım + Yeni Nesil';
    let reason='Seviye korunuyor; daha güvenilir rota için deneme verisi birikiyor.';

    if(prevAvg!==null){
      const delta=currentResult.estimatedScore-prevAvg;
      if(delta>=15&&th.weak.length<=1){
        level=clamp(oldLevel+1,0,3);
        route='Yeni Nesil ağırlıklı';
        reason=`Son deneme, önceki üç deneme ortalamasının ${Math.abs(delta).toFixed(1)} puan üzerinde. Zayıf ders sayısı sınırlı olduğu için zorluk yalnızca bir kademe artırıldı.`;
      }else if(delta<=-15||th.weak.length>=3){
        level=clamp(oldLevel-1,0,3);
        route='Kazanım ağırlıklı';
        reason=delta<=-15?`Son deneme, önceki üç deneme ortalamasının ${Math.abs(delta).toFixed(1)} puan altında. Temel kazanımları güçlendirmek için zorluk yalnızca bir kademe düşürüldü.`:`En az üç derste hedeflenen yaklaşık %65 net eşiğinin altında kalındı. Temel kazanımları güçlendirmek için zorluk yalnızca bir kademe düşürüldü.`;
      }else{
        route=level>=2?'Dengeli · Yeni Nesil öncelikli':'Dengeli Kazanım + Yeni Nesil';
        reason=`Son deneme önceki üç deneme ortalamasına yakın. Ani seviye değişimi yapılmadı.`;
      }
    }else{
      reason=`${previous.length+1}/4 deneme verisi oluştu. Adaptif seviye, son deneme ile önceki üç deneme ortalaması birlikte değerlendirilebildiğinde değişecek.`;
    }

    state.adaptive={
      level,
      levelName:LEVELS[level],
      route,
      reason,
      previousAverage:prevAvg===null?null:Math.round(prevAvg*10)/10,
      currentScore:currentResult.estimatedScore,
      weakSubjects:th.weak,
      strongSubjects:th.strong,
      updatedAt:new Date().toISOString()
    };
    return state.adaptive;
  }

  function recordExam(state,rows=[],meta={}){
    ensureState(state);
    const result=estimateLgsScore(rows);
    const adaptive=updateAdaptive(state,result);
    const record={
      at:new Date().toISOString(),
      title:meta.title||'LGS Arena Denemesi',
      questionCount:rows.length,
      endedByTimeout:!!meta.endedByTimeout,
      correct:result.correct,
      wrong:result.wrong,
      blank:result.blank,
      net:Math.round(result.net*100)/100,
      estimatedScore:result.estimatedScore,
      subjects:result.subjects,
      adaptiveLevel:adaptive.level,
      adaptiveRoute:adaptive.route
    };
    state.examHistory=[...state.examHistory,record].slice(-30);
    return {...result,adaptive,record};
  }

  function questionWeight(q,level){
    const diff=DIFFICULTY_WEIGHTS[level]?.[q.difficulty||'Orta']||.1;
    const newGen=(q.kind||'Kazanım')==='Yeni Nesil';
    const kindTarget=NEW_GEN_SHARE[level];
    const kindWeight=newGen?kindTarget:(1-kindTarget);
    return Math.max(.01,diff*kindWeight);
  }

  function pickQuestions(pool,count,state){
    ensureState(state);
    const level=state.adaptive.level;
    const source=[...pool];
    const picked=[];
    while(source.length&&picked.length<count){
      const weights=source.map(q=>questionWeight(q,level));
      const total=weights.reduce((a,b)=>a+b,0);
      let roll=Math.random()*total,index=0;
      for(;index<source.length-1;index++){roll-=weights[index];if(roll<=0)break}
      picked.push(source.splice(index,1)[0]);
    }
    return picked;
  }

  function decorateResultPage(result,mode){
    const page=document.querySelector('.result-page');
    if(!page)return;
    let card=document.getElementById('v42ScoreCard');
    if(!card){
      card=document.createElement('section');
      card.id='v42ScoreCard';
      card.className='v42-score-card';
      const stats=page.querySelector('.result-stats');
      if(stats)stats.insertAdjacentElement('afterend',card);else page.appendChild(card);
    }
    const adaptive=result.adaptive||{};
    const scorePart=mode==='exam'?`<div><span>Arena tahmini LGS puanı</span><b>${Number(result.estimatedScore||0).toFixed(1)}</b></div>`:'';
    card.innerHTML=`${scorePart}<div><span>LGS neti</span><b>${Number(result.net||0).toFixed(2)}</b></div><div class="wide"><span>Adaptif rota</span><b>${adaptive.levelName||LEVELS[adaptive.level||1]} · ${adaptive.route||'Dengeli'}</b><small>${adaptive.reason||''}</small></div>${mode==='exam'?'<p>Bu puan resmî MEB puanı değildir. Denemedeki ders netleri gerçek LGS soru dağılımı ve ders ağırlıklarına projekte edilerek yaklaşık karşılık üretilir; resmî puanlama standart sapma ve Türkiye geneli dağılıma bağlıdır.</p>':''}`;
  }

  function installStyle(){
    if(document.getElementById('v42AdaptiveStyle'))return;
    const style=document.createElement('style');style.id='v42AdaptiveStyle';style.textContent=`.v42-score-card{width:100%;display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:6px}.v42-score-card>div{background:#081a2e;border:1px solid #e7b85b30;border-radius:10px;padding:8px}.v42-score-card span{display:block;font-size:7px;color:#8297ad}.v42-score-card b{display:block;margin-top:2px;color:#f5d88e;font-size:14px}.v42-score-card .wide{grid-column:1/-1}.v42-score-card small{display:block;margin-top:4px;color:#9fb4c9;font-size:7px;line-height:1.35}.v42-score-card p{grid-column:1/-1;margin:0;color:#8297ad;font-size:7px;line-height:1.35}`;document.head.appendChild(style)
  }

  installStyle();
  window.LgsArenaAdaptive={
    levels:LEVELS,
    subjectLimits:SUBJECT_LIMITS,
    subjectWeights:SUBJECT_WEIGHTS,
    ensureState,
    summarizeRows,
    estimateLgsScore,
    recordExam,
    pickQuestions,
    decorateResultPage
  };
})();
