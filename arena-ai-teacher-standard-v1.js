(()=>{
  'use strict';
  const core=window.ArenaCoreV1?.DEFAULTS?.ai||{};
  window.ARENA_AI_TEACHER_STANDARD=Object.freeze({marker:'ARENA-AI-TEACHER-V1',schemaVersion:1,status:'reserved-not-live',productBoundary:{visualQuestionSolver:'external-licensed-flow',arenaTeacher:'grounded-text-tutor'},entitlements:{free:{lifetimeDemoQuestions:core.freeLifetime||3},premium:{monthlyDemoQuestions:core.premiumMonthly||5},pro:{dailyQuestions:core.proDaily||10,monthlyQuestions:core.proMonthly||200},proPlus:{policy:'higher-quota-with-human-support'}},runtime:{providerAdapterRequired:true,apiKeyInClient:false,serverEntitlementCheck:true,verifiedArenaContentOnly:true,openWebSearch:false,maxAnswerWords:500,sendDirectIdentifiers:false,providerStateStorage:false,inputOutputModeration:true}});
})();
