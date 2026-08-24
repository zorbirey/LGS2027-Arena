(()=>{
  'use strict';
  const VERSION='ARENA-CORE-V1';
  const PLAN_LEVEL=Object.freeze({free:0,premium:1,pro:2,pro_plus:3});
  const PLAN_LABEL=Object.freeze({free:'Ücretsiz',premium:'Arena Premium',pro:'Arena Pro',pro_plus:'Arena Pro+'});
  const FEATURE_PLAN=Object.freeze({basicLessons:'free',practice:'free',weeklyProgram:'free',adFree:'premium',unlimitedPractice:'premium',fullLessons:'premium',smartNotes:'premium',mockExams:'premium',writtenScenarios:'premium',wrongbook:'premium',zeusCoaching:'premium',parentTracking:'premium',preferenceRobot:'premium',manualTransfer:'premium',restDayPlanner:'premium',challenge:'premium',aiTeacher:'pro',photoSolve:'pro',advancedAnalytics:'pro',secureSync:'pro',humanCoach:'pro_plus'});
  const DEFAULTS=Object.freeze({coreVersion:VERSION,free:Object.freeze({questionLimit:50,rewardedAdLimit:6,questionAdMilestones:Object.freeze([10,20,30,40]),unlockHour:8}),review:Object.freeze({minimumAgeDays:3,minimumSessions:3,minimumQuestions:50,laterDays:120,maxAutomaticPrompts:2}),achievement:Object.freeze({uniqueQuestionTarget:100,adFreeHours:8}),referral:Object.freeze({verifiedOnly:true,rewardDays:Object.freeze([1,2,3])}),ai:Object.freeze({marker:'ARENA-AI-TEACHER-V1',freeLifetime:3,premiumMonthly:5,proDaily:10,proMonthly:200}),pwa:Object.freeze({singleServiceWorker:true,forceReloadOnActivation:false,visibleBuildId:true})});
  function validPlan(plan){return Object.prototype.hasOwnProperty.call(PLAN_LEVEL,plan)}
  function normalizePlan(plan){return validPlan(plan)?plan:'free'}
  function atLeast(active,required){return PLAN_LEVEL[normalizePlan(active)]>=PLAN_LEVEL[normalizePlan(required)]}
  function requiredPlan(feature){return FEATURE_PLAN[feature]||'free'}
  function canUse(active,feature){return atLeast(active,requiredPlan(feature))}
  function nextTurkeyEight(nowMs=Date.now()){const parts=new Intl.DateTimeFormat('en-CA',{timeZone:'Europe/Istanbul',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(new Date(nowMs));const get=type=>Number(parts.find(part=>part.type===type)?.value||0),todayEight=Date.UTC(get('year'),get('month')-1,get('day'),5);return nowMs<todayEight?todayEight:todayEight+86400000}
  function validateConfig(config){const errors=[];if(config?.coreVersion!==VERSION)errors.push(`coreVersion ${VERSION} olmalı`);if(!/^[a-z0-9-]+$/.test(config?.appId||''))errors.push('appId geçersiz');if(!/^\d{8}-\d{2}$/.test(config?.buildId||''))errors.push('buildId geçersiz');if(!config?.storageNamespace?.startsWith(config?.appId||'__missing__'))errors.push('storageNamespace geçersiz');if(!Number.isFinite(Number(config?.exam?.questionCount)))errors.push('exam.questionCount eksik');return {ok:errors.length===0,errors}}
  Object.defineProperty(window,'ArenaCoreV1',{value:Object.freeze({VERSION,PLAN_LEVEL,PLAN_LABEL,FEATURE_PLAN,DEFAULTS,validPlan,normalizePlan,atLeast,requiredPlan,canUse,nextTurkeyEight,validateConfig}),configurable:false,writable:false});
  window.dispatchEvent(new CustomEvent('arena-core:ready',{detail:{version:VERSION}}));
})();
