# Lise tercih robotu veri notu

Bu sürüm, 23 Ağustos 2026 tarihinde erişilen 2026 yerleştirme kapanış verilerinden 81 ilde 3.098 sınavla öğrenci alan programı çevrimdışı PWA paketine alır.

- Okul veri görünümü: https://www.matematikmerkezi.com/lgs-tercih-robotu
- Resmî doğrulama ekranı: https://e-okul.meb.gov.tr/logineOkul.aspx
- MEB 2026 yerleştirme raporu: https://meb.gov.tr/lgs-kapsamindaki-ilk-yerlestirme-sonuclarinin-raporu-yayimlandi//haber/41560/tr

Uygulamadaki eşleşmeler yalnız 2026 taban puan ve yüzdelik değerlerini karşılaştırır; gelecek yıl yerleşme garantisi vermez. Yerel yerleştirmede adres kayıt alanı, OBP ve özürsüz devamsızlık birlikte değerlendirilir. OBP tek başına kesin okul listesi üretmek için kullanılmaz.

Tercih aracının girdileri ayrı `lgsArenaPreferenceV1` anahtarında tutulur. Mevcut öğrenci ilerleme verisinin `lgsArenaPwaV02` anahtarı değiştirilmez veya silinmez.


Premium erişim kuralı: OBP hesaplama, okul eşleştirme ve Veli Takip Paneli yalnız `isPremium=true` olan akışta açılır. Ücretsiz deneme sonucunda puan gösterilmeden önce Premium bilgilendirme kutusu sunulur; kullanıcı ücretsiz devamı seçerse sade sonuç gösterilir.


