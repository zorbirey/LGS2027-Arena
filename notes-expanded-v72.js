(() => {
'use strict';
const SUBJECT_GUIDE={
'Matematik':{
connection:'Matematikte bir kuralın anlamı yalnız sembolik işlemle sınırlı değildir. Sözel durum, tablo, şekil, sayı doğrusu ve cebirsel gösterim aynı ilişkinin farklı temsilleridir. Bu nedenle çözüm sırasında hangi büyüklüğün değiştiği, hangisinin sabit kaldığı ve işlemin gerçek hayattaki karşılığı açıkça belirlenmelidir.',
exam:'Yeni nesil sorularda bilgi çoğu zaman doğrudan verilmez; tablo, grafik, geometrik model veya günlük yaşam durumu içine yerleştirilir. Önce verilenleri birim ve türlerine göre sınıflandırmak, ardından problemi daha küçük matematiksel ilişkilere ayırmak gerekir. Sonucun yaklaşık büyüklüğü ve problem koşullarına uygunluğu mutlaka kontrol edilmelidir.'},
'Fen Bilimleri':{
connection:'Fen bilimlerinde kavramlar gözlem, model ve çıkarım arasında kurulan bağla öğrenilir. Bir olayın yalnız sonucunu bilmek yeterli değildir; olayın hangi değişkene bağlı olduğu, değişken arttığında sonucun nasıl değiştiği ve bu ilişkinin tanecik, enerji, kuvvet ya da sistem düzeyinde nasıl açıklandığı düşünülmelidir.',
exam:'Deney ve grafik sorularında bağımsız, bağımlı ve kontrol edilen değişkenleri ayırmak ilk adımdır. Grafik eksenleri, ölçü birimleri ve karşılaştırılan deney düzenekleri okunmadan sonuca gidilmemelidir. Seçeneklerde gözlemle kanıtlanabilen sonuç ile yalnızca tahmin olan ifade birbirinden ayrılmalıdır.'},
'Türkçe':{
connection:'Türkçe sorularında anlam; sözcük, cümle ve metin düzeylerinin birlikte değerlendirilmesiyle kurulur. Bir sözcüğün sözlük anlamı bağlama uymayabilir; bağlaçlar, gönderimler, anlatım biçimi ve yazarın amacı metindeki düşünce akışını belirler. Dil bilgisi de ezberlenmiş ek listesinden çok sözcüğün cümlede üstlendiği görev üzerinden anlaşılmalıdır.',
exam:'Paragraf ve dil bilgisi sorularında seçeneklerin her biri metindeki kanıtla sınanmalıdır. Kapsamı dar, metne ek bilgi getiren veya yalnız bir ayrıntıyı genelleyen seçenekler elenir. Uzun metinlerde soru kökü önce okunabilir; ancak karar verilirken metnin bütünü ve ana düşünce mutlaka korunmalıdır.'},
'İnkılap Tarihi':{
connection:'Tarihsel bilgi olayların yalnız tarihlerini değil; aktörlerini, nedenlerini, meydana geldiği koşulları ve kısa-uzun vadeli sonuçlarını kapsar. Bir gelişme aynı anda askerî, siyasi, toplumsal ve diplomatik etki yaratabilir. Kronoloji, bu etkilerin birbirini nasıl hazırladığını anlamak için kullanılmalıdır.',
exam:'Sorulardaki belge, harita, söz veya gazete parçası önce dönem ve amaç bakımından tanımlanmalıdır. Metinde doğrudan bulunan bilgi ile tarihsel bağlamdan yapılan çıkarım ayrılmalı; olayın sonucu başka bir olayın amacıyla karıştırılmamalıdır. Antlaşma ve kongrelerde karar, gerekçe ve egemenlik anlayışı birlikte değerlendirilmelidir.'},
'Din Kültürü':{
connection:'Din kültürü konuları kavram, davranış ve toplumsal sonuç arasında ilişki kurularak öğrenilir. Bir kavramın tanımı bilindikten sonra hangi tutumu gerektirdiği, insanın sorumluluğunu nasıl etkilediği ve adalet, merhamet, paylaşma, güven veya dayanışma gibi değerlerle nasıl birleştiği açıklanmalıdır.',
exam:'Ayet, hadis ve olay sorularında tek bir kelimeye dayanarak karar verilmemelidir. Metnin ana mesajı belirlenmeli, verilen davranışın hangi ilkeyi örneklediği açıklanmalı ve yakın anlamlı kavramlar arasındaki fark korunmalıdır. Yorum, metnin sınırlarını aşan kişisel bir yargıya dönüştürülmemelidir.'},
'İngilizce':{
connection:'İngilizce öğreniminde vocabulary, grammar, reading ve communicative purpose birlikte çalışır. Bir yapının biçimini bilmek yeterli değildir; konuşanın niyeti, zaman ifadesi, zamirlerin gönderimi ve cümlelerin diyalog içindeki sırası anlamı belirler. Yeni kelimeler tek başına değil eşdizimleri ve örnek bağlamlarıyla öğrenilmelidir.',
exam:'Dialogue ve reading sorularında önce iletişim amacı belirlenir: invitation, request, advice, preference, prediction veya apology. Daha sonra zaman ifadeleri ve anahtar sözcükler incelenir. Dil bilgisi doğru olsa bile bağlama uygun olmayan cevap elenir; metinde kanıtlanmayan kültürel veya kişisel varsayımlar kullanılmaz.'}
};
const notes=window.SMART_NOTES||{};
Object.entries(notes).forEach(([subject,list])=>list.forEach(n=>{
  const g=SUBJECT_GUIDE[subject]||SUBJECT_GUIDE['Türkçe'],schema=n.schema||[],deep=n.deepDive||[];
  n.longSections=[
    {title:'1. Temel Çerçeve ve Kavramın Mantığı',text:`${n.overview||n.concept} Bu başlığın öğrenilmesindeki temel amaç, tanımı yalnızca hatırlamak değil; kavramın neden bu biçimde çalıştığını, hangi koşullarda geçerli olduğunu ve başka bilgilerle nasıl birleştiğini açıklayabilmektir. “${n.title}” ifadesi bu ünitedeki en kritik ayrımı özetler. Konuya başlarken kullanılan her terimin anlamı ayrı ayrı belirlenmeli, ardından bu terimler arasında neden-sonuç ilişkisi kurulmalıdır.`},
    {title:'2. Kavramlar Arası Bağlantı',text:`${g.connection} Bu karttaki öğrenme zinciri “${schema.join(' → ')}” biçimindedir. İlk basamak sonraki basamakların gerekçesini oluşturur; bu nedenle yalnız sonuca odaklanmak yerine her geçişin hangi bilgiye dayandığı açıklanmalıdır. Konuyu kendi cümlelerinle anlatırken bu zinciri bozmadan yeniden kurabilmek, bilginin ezberden kalıcı öğrenmeye geçtiğini gösterir.`},
    {title:'3. Ayrıntılar, Sınırlar ve Sık Karıştırılan Noktalar',text:`${n.attention} Bu uyarı, sorularda en sık yapılan genelleme veya kavram karışıklığını gösterir. Bir kuralın geçerli olduğu durum kadar geçerli olmadığı durum da bilinmelidir. Benzer görünen iki kavramı ayırmak için tanım, işlev, koşul ve sonuç ölçütleriyle küçük bir karşılaştırma tablosu oluşturulabilir. ${deep[0]||''} ${deep[2]||''}`},
    {title:'4. Sınav Sorularında Nasıl Kullanılır?',text:`${g.exam} Soru kökündeki “ulaşılabilir, söylenemez, kesinlikle, öncelikle” gibi karar sözcükleri işaretlenmeli ve seçenekler aynı ölçüte göre karşılaştırılmalıdır. Çözüm bittikten sonra seçilen cevabın yalnız doğru bilgi içerip içermediği değil, sorunun tam olarak istediği yargıyı karşılayıp karşılamadığı da kontrol edilmelidir.`},
    {title:'5. Uygulama, Örnek ve Öğrenme Kontrolü',text:`Örnek durum: ${n.example} Bu örneği inceledikten sonra sayıları, kişileri, kavramları veya koşulları değiştirerek ikinci bir örnek üret. Ardından kurala uymayan bir karşı örnek yaz ve neden uygun olmadığını açıkla. ${deep[3]||'Konuyu kendi cümlelerinle özetle.'} Son adımda öğrenme şemasına bakmadan basamakları sırasıyla yeniden yaz; eksik kalan basamak, tekrar edilmesi gereken bölümü gösterir.`}
  ];
  n.verifiedNote='Konu kapsamı, resmî MEB 8. sınıf öğretim programı ve açık çalışma materyalleri dikkate alınarak hazırlanmıştır.';
}));
})();
