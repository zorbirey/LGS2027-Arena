(() => {
  'use strict';
  const KEY='lgsArenaPwaV02',THREE_DAYS=3*86400000,REPROMPT_DAYS=120*86400000,AD_FREE_MS=8*3600000;
  const REVIEW_DEFAULTS=Object.freeze({firstUseAt:null,completedSessions:0,promptCount:0,lastPromptAt:null,dismissedForever:false,openedStoreAt:null});
  const REWARD_DEFAULTS=Object.freeze({adFree100Granted:false,pendingNotice:false});
  const byId=id=>document.getElementById(id);
  function now(){return window.LgsArenaAccess?.trustedNow?.()||Date.now()}
  function ensure(state){
    state.reviewEngagement={...REVIEW_DEFAULTS,...(state.reviewEngagement||{})};
    state.achievementRewards={...REWARD_DEFAULTS,...(state.achievementRewards||{})};
    if(!state.reviewEngagement.firstUseAt)state.reviewEngagement.firstUseAt=new Date(now()).toISOString();
    return state;
  }
  function config(){return window.LGS_ARENA_CONFIG?.googlePlayReview||{enabled:false,packageName:'',webUrl:''}}
  function demo(){return new URLSearchParams(location.search).get('reviewDemo')==='1'}
  function hasStoreTarget(){const value=config();return !!(value.enabled&&(value.webUrl||value.packageName||window.LgsArenaNativeReview?.requestReview))}
  function isAdFree(state){const until=Date.parse(state?.adFreeUntil||'');return !!window.LgsArenaPlans?.atLeast('premium')||(window.LgsArenaAccess?.clockVerified?.()&&Number.isFinite(until)&&until>now())}
  function recordSession(state,{completed=false}={}){
    ensure(state);if(completed)state.reviewEngagement.completedSessions++;
    const solved=new Set(state.rankedSolvedIds||[]).size,free=!window.LgsArenaPlans?.atLeast('premium');
    if(free&&solved>=100&&!state.achievementRewards.adFree100Granted&&window.LgsArenaAccess?.clockVerified?.()){
      state.achievementRewards.adFree100Granted=true;state.achievementRewards.pendingNotice=true;state.adFreeUntil=new Date(now()+AD_FREE_MS).toISOString();
    }
  }
  function eligible(state){
    ensure(state);if(demo())return true;if(!hasStoreTarget())return false;
    const review=state.reviewEngagement,age=now()-Date.parse(review.firstUseAt||''),last=Date.parse(review.lastPromptAt||'');
    return !review.dismissedForever&&review.promptCount<2&&review.completedSessions>=3&&(state.history||[]).length>=50&&age>=THREE_DAYS&&(!Number.isFinite(last)||now()-last>=REPROMPT_DAYS);
  }
  function maybePrompt(state){
    if(!eligible(state))return false;state.reviewEngagement.promptCount++;state.reviewEngagement.lastPromptAt=new Date(now()).toISOString();
    setTimeout(showPrompt,1300);return true;
  }
  function consumeRewardNotice(state){ensure(state);if(!state.achievementRewards.pendingNotice)return false;state.achievementRewards.pendingNotice=false;return true}
  function read(){try{return ensure(JSON.parse(localStorage.getItem(KEY)||'{}'))}catch{return ensure({})}}
  function write(state){localStorage.setItem(KEY,JSON.stringify(state));window.dispatchEvent(new CustomEvent('lgsarena:review-state-updated'))}
  function close(){const overlay=byId('reviewPrompt');overlay?.classList.add('hidden');overlay?.setAttribute('aria-hidden','true')}
  function showPrompt(){
    const overlay=byId('reviewPrompt');if(!overlay)return;const available=hasStoreTarget(),primary=byId('reviewPromptOpen');
    if(primary){primary.disabled=!available;primary.textContent=available?'GOOGLE PLAY’DE DEĞERLENDİR':'GOOGLE PLAY YAYINI BEKLENİYOR'}
    overlay.classList.remove('hidden');overlay.setAttribute('aria-hidden','false');
  }
  function later(){close()}
  function dismiss(){const state=read();state.reviewEngagement.dismissedForever=true;write(state);close()}
  async function openStore(){
    const value=config(),state=read();state.reviewEngagement.openedStoreAt=new Date(now()).toISOString();write(state);close();
    if(window.LgsArenaNativeReview?.requestReview){try{await window.LgsArenaNativeReview.requestReview();return}catch{}}
    const target=value.webUrl||(value.packageName?`https://play.google.com/store/apps/details?id=${encodeURIComponent(value.packageName)}`:'');if(target)window.open(target,'_blank','noopener,noreferrer');
  }
  function init(){ensure(read());byId('reviewPromptOpen')?.addEventListener('click',openStore);byId('reviewPromptLater')?.addEventListener('click',later);byId('reviewPromptNever')?.addEventListener('click',dismiss);if(demo())setTimeout(showPrompt,900)}
  window.LgsArenaReview=Object.freeze({ensure,recordSession,eligible,maybePrompt,isAdFree,consumeRewardNotice,hasStoreTarget,version:'8.1.0'});
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
