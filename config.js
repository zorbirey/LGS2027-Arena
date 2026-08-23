(() => {
  'use strict';
  window.LGS_ARENA_CONFIG = Object.freeze({
    schemaVersion: 7,
    appVersion: '4.8.0-browser-consistency',
    season: 2027,
    appName: 'LGS 2027 Arena',
    coverLocked: true,
    coverStandard: 'LGS2027-ZEUS-ARENA-COVER-2026-08-23-V3',
    coverAsset: 'assets/lgs2027-cover-fixed.webp?v=4.8.0',
    coverRule: 'Bu kapak görseli LGS 2027 Arena için sabittir; kullanıcı açıkça değiştirmedikçe başka kapak kullanılmaz.',
    examDate: '2027-06-13T09:30:00+03:00',
    nextSeason: Object.freeze({ season: 2028, appName: 'LGS 2028 Arena', examDate: null }),
    dailyQuestionTarget: 25,
    questionSeconds: 90,
    miniMockDistribution: Object.freeze({'Türkçe':20,'Matematik':20,'Fen Bilimleri':20,'İnkılap Tarihi':10,'Din Kültürü':10,'İngilizce':10}),
    lgsSubjectLimits: Object.freeze({'Türkçe':20,'Matematik':20,'Fen Bilimleri':20,'İnkılap Tarihi':10,'Din Kültürü':10,'İngilizce':10}),
    lgsSubjectWeights: Object.freeze({'Türkçe':4,'Matematik':4,'Fen Bilimleri':4,'İnkılap Tarihi':1,'Din Kültürü':1,'İngilizce':1}),
    legalNotice: 'Türkiye Yüzyılı Maarif Modeli dikkate alınmıştır. MEB’in resmî uygulaması değildir; MEB onayı iddiası taşımaz.'
  });
  const visualFix=document.createElement('script');
  visualFix.src='./visual-fix-v45.js?v=4.8.0';
  visualFix.dataset.arenaVisualFix='4.8.0';
  document.head.appendChild(visualFix);
})();
