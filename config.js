(() => {
  'use strict';
  window.LGS_ARENA_CONFIG = Object.freeze({
    schemaVersion: 1,
    appVersion: '4.0.0-foundation',
    season: 2027,
    appName: 'LGS 2027 Arena',
    examDate: '2027-06-13T09:30:00+03:00',
    nextSeason: Object.freeze({
      season: 2028,
      appName: 'LGS 2028 Arena',
      examDate: null
    }),
    dailyQuestionTarget: 25,
    questionSeconds: 90,
    miniMockDistribution: Object.freeze({
      'Türkçe': 4,
      'Matematik': 4,
      'Fen Bilimleri': 4,
      'İnkılap Tarihi': 3,
      'Din Kültürü': 2,
      'İngilizce': 3
    }),
    legalNotice: 'Türkiye Yüzyılı Maarif Modeli esasları dikkate alınarak hazırlanmıştır. Bu uygulama Millî Eğitim Bakanlığının resmî uygulaması değildir ve MEB onayı iddiası taşımaz.'
  });
})();
