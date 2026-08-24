(() => {
  'use strict';
  const notes=window.SMART_NOTES||{};
  const visuals={
    'Matematik':'assets/lesson-v73/matematik-kavram-haritasi.svg',
    'Fen Bilimleri':'assets/lesson-v73/fen-kanit-zinciri.svg',
    'Türkçe':'assets/lesson-v73/turkce-metin-pusulasi.svg',
    'İnkılap Tarihi':'assets/lesson-v73/inkilap-neden-sonuc.svg',
    'Din Kültürü':'assets/lesson-v73/din-kavram-baglantisi.svg',
    'İngilizce':'assets/lesson-v73/ingilizce-baglam-ipuclari.svg'
  };
  const guides={
    'Matematik':{
      types:['Tablo, grafik veya şemadaki veriyi matematiksel modele dönüştürme','Birden fazla işlemi gerektiren günlük yaşam problemi','Hatalı çözüm adımını veya uygun stratejiyi belirleme'],
      traps:['Tek bir anahtar sayıyı görüp diğer koşulları kullanmadan işleme başlamak','Alan–çevre, EBOB–EKOK veya taban–üs gibi yakın kavramları birbirine karıştırmak','Ara sonucu seçeneklerde görünce işlemi tamamlamadan işaretlemek'],
      use:'Verilenleri birim ve koşullarıyla ayır; şekil, tablo ya da cebirsel ifade ile modelle; sonucu tahmin ve ters işlemle kontrol et.'
    },
    'Fen Bilimleri':{
      types:['Deney düzeneğinde bağımsız, bağımlı ve kontrol edilen değişkeni bulma','Grafik veya gözlem verisinden kanıta dayalı sonuç çıkarma','Günlük yaşam olayını bilimsel ilke ile açıklama'],
      traps:['Birlikte değişen iki büyüklüğü doğrudan neden–sonuç sanmak','Deneyde aynı tutulması gereken değişkeni gözden kaçırmak','Bilimsel kavram yerine günlük dilde benzer görünen ifadeyi seçmek'],
      use:'Önce değişkenleri ve karşılaştırılan durumları belirle; yalnız verilen kanıtın desteklediği sonucu seç; genellemeyi sorunun sınırları içinde tut.'
    },
    'Türkçe':{
      types:['Metnin ana düşüncesi, yardımcı düşüncesi veya çıkarımı','Sözcük/cümlenin bağlamdaki anlamı','Görsel, tablo ve metni birlikte yorumlama'],
      traps:['Metinde geçen ayrıntıyı ana düşünce sanmak','Kendi bilgisini metnin söylediğinin önüne geçirmek','Seçenekteki kesinlik bildiren her zaman, yalnızca, mutlaka sözlerini atlamak'],
      use:'Soru kökündeki isteneni işaretle; cevabı metindeki kanıtla eşleştir; kapsamı metinden daha geniş veya daha dar olan seçenekleri ele.'
    },
    'İnkılap Tarihi':{
      types:['Belge, söz veya karardan amaç ve ilke çıkarma','Olayları neden–sonuç ve kronoloji içinde yorumlama','Gelişmeyi millî egemenlik, bağımsızlık veya çağdaşlaşma ile ilişkilendirme'],
      traps:['Dönem ve kronoloji bakımından doğru ama sorulan olayla ilgisiz seçeneğe yönelmek','Sonucu neden, nedeni amaç gibi okumak','Bir ilkenin genel tanımını olayın doğrudan kanıtı sanmak'],
      use:'Belgedeki tarih, kişi, kurum ve anahtar kavramı belirle; olayı dönemine yerleştir; seçeneğin metinle doğrudan kanıtlanıp kanıtlanmadığını kontrol et.'
    },
    'Din Kültürü':{
      types:['Ayet, hadis veya örnek olaydan temel mesaj çıkarma','Yakın kavramları davranış örneği üzerinden ayırt etme','Bireysel davranışın toplumsal sonucunu yorumlama'],
      traps:['Kader–irade, zekât–sadaka gibi yakın kavramların kapsamını karıştırmak','Metnin ana mesajı yerine yalnız bir kelime benzerliğine göre cevap vermek','Doğru bir bilgiyi sorudaki örnekle ilişkili olmasa da seçmek'],
      use:'Metnin vurguladığı davranış ve amacı belirle; kavramın şartlarını kontrol et; cevabı ayet/hadis veya örnek olayın bütünlüğüyle ilişkilendir.'
    },
    'İngilizce':{
      types:['Diyalogda bağlama uygun ifadeyi veya cevabı seçme','Afiş, davetiye, tablo ve kısa mesajdan ayrıntı çıkarma','Kişi tercihini verilen özelliklerle eşleştirme'],
      traps:['Tek bir ortak kelime nedeniyle bağlama uymayan seçeneği işaretlemek','Olumlu–olumsuz ifade, saat, tarih veya sıklık zarfını gözden kaçırmak','Dil bilgisi doğru olsa da iletişim amacına uymayan cevabı seçmek'],
      use:'Who, where, when ve why ipuçlarını belirle; olumsuzluk ve zaman ifadelerini işaretle; cevabın dil bilgisi kadar iletişim amacına da uyduğunu kontrol et.'
    }
  };
  Object.entries(notes).forEach(([subject,list])=>{
    const guide=guides[subject]||guides.Türkçe;
    (list||[]).forEach(note=>{
      note.examQuestionTypes=guide.types.map((text,index)=>`${note.topic} kapsamında ${index===0?'en sık kullanılan':'karşılaşılabilecek'} soru biçimi: ${text}.`);
      note.distractorWarnings=guide.traps;
      note.examUse=`${note.topic} sorularında ${guide.use}`;
      note.lessonVisual=visuals[subject]||visuals.Türkçe;
      note.lessonVisualAlt=`${subject} dersi için ${note.topic} konusunu çözüm adımlarına bağlayan öğrenme görseli`;
    });
  });
})();
