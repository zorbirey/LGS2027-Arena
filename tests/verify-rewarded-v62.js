'use strict';
const fs=require('fs');
const vm=require('vm');
const assert=require('assert');

const path=require('path');
const root=path.resolve(__dirname,'..');
const appPath=root+'/app.js';
const index=fs.readFileSync(root+'/index.html','utf8');
const profile=fs.readFileSync(root+'/profile-parent-v41.js','utf8');
const pwa=fs.readFileSync(root+'/pwa.js','utf8');
const sw=fs.readFileSync(root+'/service-worker.js','utf8');
const manifest=JSON.parse(fs.readFileSync(root+'/manifest.webmanifest','utf8'));
let source=fs.readFileSync(appPath,'utf8');
const closeMarker='init();\n})();';
assert(source.includes(closeMarker),'app test hook marker missing');
source=source.replace(closeMarker,`globalThis.__arenaTest={
  today:()=>today(),
  setState:value=>{state={...defaults,...value}},
  getState:()=>state,
  freeQuestionTake,
  showRewardedAd
};
})();`);

function classList(){
  const values=new Set(['hidden']);
  return {add:v=>values.add(v),remove:v=>values.delete(v),contains:v=>values.has(v),toggle:(v,on)=>on?values.add(v):values.delete(v)};
}
function element(){
  return {textContent:'',classList:classList(),attrs:{},setAttribute(k,v){this.attrs[k]=v}};
}
const elements={
  quotaOverlay:element(),adOverlay:element(),adCount:element(),adTitle:element(),adMessage:element(),toast:element()
};
let intervalCallback=null;
let intervalCleared=false;
const context={
  console,
  localStorage:{getItem:()=>null,setItem:()=>{}},
  document:{
    getElementById:id=>elements[id]||null,
    querySelector:()=>null,
    querySelectorAll:()=>[],
    body:{classList:classList()}
  },
  window:{dispatchEvent:()=>{},addEventListener:()=>{},__toast:null},
  CustomEvent:function(type,init){this.type=type;this.detail=init?.detail},
  setTimeout:()=>1,
  clearTimeout:()=>{},
  setInterval:fn=>{intervalCallback=fn;return 7},
  clearInterval:()=>{intervalCleared=true},
  URLSearchParams,
  Date,
  Intl,
  Math,
  JSON
};
context.globalThis=context;
vm.createContext(context);
vm.runInContext(source,context,{filename:'app.js'});
const api=context.__arenaTest;
const day=api.today();

api.setState({daily:{date:day,count:40},noteRewards:{date:day,subjects:[]},isPremium:false,timeoutEvents:[],examHistory:[]});
assert.strictEqual(api.freeQuestionTake(),10,'free user should receive next 10-question block');

api.setState({daily:{date:day,count:46},noteRewards:{date:day,subjects:[]},isPremium:false,timeoutEvents:[],examHistory:[]});
assert.strictEqual(api.freeQuestionTake(),4,'free user should stop exactly at 50');

elements.quotaOverlay.classList.add('hidden');
api.setState({daily:{date:day,count:50},noteRewards:{date:day,subjects:[]},isPremium:false,timeoutEvents:[],examHistory:[]});
assert.strictEqual(api.freeQuestionTake(),0,'free quota should lock at 50');
assert(!elements.quotaOverlay.classList.contains('hidden'),'quota gate should be visible at 50');

api.setState({daily:{date:day,count:50},noteRewards:{date:day,subjects:[]},isPremium:true,timeoutEvents:[],examHistory:[]});
assert.strictEqual(api.freeQuestionTake(),10,'Premium should bypass the daily limit');

let rewarded=false;
assert.strictEqual(api.showRewardedAd('10 soru tamamlandı',()=>{rewarded=true}),true,'rewarded gate should open');
assert(!elements.adOverlay.classList.contains('hidden'),'rewarded ad should be visible');
assert.strictEqual(elements.adCount.textContent,8,'rewarded countdown should start at 8');
for(let i=0;i<7;i++)intervalCallback();
assert.strictEqual(rewarded,false,'next stage must remain locked before full countdown');
intervalCallback();
assert.strictEqual(rewarded,true,'next stage should open after full countdown');
assert(intervalCleared,'rewarded timer should stop');
assert(elements.adOverlay.classList.contains('hidden'),'rewarded overlay should close only after completion');

assert(index.includes('PWA-ID 20260824-08'),'visible build ID missing');
assert(index.includes('LGS 2027 Arena')&&index.includes('<span>90</span><small>SORU</small>'),'Arena/90 SORU copy missing');
assert.strictEqual((index.match(/data-written-scenario=/g)||[]).length,4,'four written scenarios required');
assert(index.includes('Günlük soru çözme hakkınız doldu'),'daily quota copy missing');
assert(index.includes('Bu ekran sayaç bitmeden kapatılamaz.'),'non-skippable reward copy missing');
assert(profile.includes("b.textContent='VELİ TAKİP'"),'Veli Takip label missing');
assert(profile.includes("if(!premium())return openMembership()"),'free parent redirect missing');
assert(source.includes("noteIndex===4")&&source.includes("showRewardedAd('5 Akıllı Not tamamlandı'"),'fifth-note reward gate missing');
assert(!/localStorage\.(clear|removeItem)/.test(source+profile),'existing localStorage must not be cleared');
assert(pwa.includes("BUILD_ID = '20260824-08'")&&pwa.includes('gates-v62.css?v=20260824-08'),'PWA build alignment missing');
assert(sw.includes('lgs-2027-arena-pwa-v6.2.0-build-20260824-08')&&sw.includes("'./gates-v62.css'"),'service worker alignment missing');
assert.strictEqual(manifest.start_url,'./index.html?id=20260824-08','manifest build ID mismatch');

console.log(JSON.stringify({ok:true,buildId:'20260824-08',freeDailyLimit:50,rewardSeconds:8,writtenScenarios:4,localStoragePreserved:true}));






