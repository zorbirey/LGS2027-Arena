(() => {
  'use strict';
  window.LGS_ARENA_CONFIG = Object.freeze({
    schemaVersion: 2,
    appVersion: '4.2.0-adaptive-score',
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
    lgsSubjectLimits: Object.freeze({
      'Türkçe': 20,
      'Matematik': 20,
      'Fen Bilimleri': 20,
      'İnkılap Tarihi': 10,
      'Din Kültürü': 10,
      'İngilizce': 10
    }),
    lgsSubjectWeights: Object.freeze({
      'Türkçe': 4,
      'Matematik': 4,
      'Fen Bilimleri': 4,
      'İnkılap Tarihi': 1,
      'Din Kültürü': 1,
      'İngilizce': 1
    }),
    legalNotice: 'Türkiye Yüzyılı Maarif Modeli esasları dikkate alınarak hazırlanmıştır. Bu uygulama Millî Eğitim Bakanlığının resmî uygulaması değildir ve MEB onayı iddiası taşımaz.'
  });
})();
