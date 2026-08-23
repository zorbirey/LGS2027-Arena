(() => {
  'use strict';
  window.LGS_ARENA_CONFIG = Object.freeze({
    schemaVersion: 10,
    appVersion: '5.2.4-visible-zeus-layout',
    buildId: '20260823-02',
    season: 2027,
    appName: 'LGS 2027 Arena',
    coverLocked: true,
    coverStandard: 'LGS2027-ZEUS-ARENA-COVER-2026-08-23-V524-20260823-02',
    coverAsset: 'assets/zeus-hero-20260823-02.webp?v=5.2.4',
    coverRule: 'Kapak, Arena hero ve Zeus hero gerçek img elemanlarıyla çalışır; yerel raster arka plan yalnız yükleme fallbackidir.',
    examDate: '2027-06-13T09:30:00+03:00',
    nextSeason: Object.freeze({ season: 2028, appName: 'LGS 2028 Arena', examDate: null }),
    dailyQuestionTarget: 25,
    questionSeconds: 90,
    miniMockDistribution: Object.freeze({'Türkçe':20,'Matematik':20,'Fen Bilimleri':20,'İnkılap Tarihi':10,'Din Kültürü':10,'İngilizce':10}),
    lgsSubjectLimits: Object.freeze({'Türkçe':20,'Matematik':20,'Fen Bilimleri':20,'İnkılap Tarihi':10,'Din Kültürü':10,'İngilizce':10}),
    lgsSubjectWeights: Object.freeze({'Türkçe':4,'Matematik':4,'Fen Bilimleri':4,'İnkılap Tarihi':1,'Din Kültürü':1,'İngilizce':1}),
    legalNotice: 'Türkiye Yüzyılı Maarif Modeli dikkate alınmıştır. MEB’in resmî uygulaması değildir; MEB onayı iddiası taşımaz.'
  });
  const core=document.createElement('link');
  core.rel='stylesheet';
  core.href='./visual-core-v5.css?v=5.2.4';
  core.dataset.arenaVisualCore='5.2.4';
  document.head.appendChild(core);
  const layout=document.createElement('link');
  layout.rel='stylesheet';
  layout.href='./layout-v52.css?v=5.2.4';
  layout.dataset.arenaLayout='5.2.4';
  document.head.appendChild(layout);
})();
