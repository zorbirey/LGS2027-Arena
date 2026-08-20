# LGS 2027 Arena — Demo v0.1

Zeus temalı, mobil öncelikli LGS çalışma uygulaması demosu.

## İlk çalışan iskelet

- **Inspired from Zeus** kapak / splash ekranı
- 13 Haziran 2027 canlı geri sayım
- Arena ana sayfası
- Zeus koçluk ekranı
- Fen, Matematik, Türkçe, T.C. İnkılap Tarihi ve Din Kültürü
- Akıllı Notlar
- 30 özgün demo sorusu (5 ders × 6 soru)
- İpucu, çözüm yolu ve Zeus yönlendirmesi
- Görülen soruları `localStorage` ile takip edip önce yeni soruları getiren seçim mantığı
- Doğru / yanlış / boş / XP / zayıf konu sonuç ekranı
- Türkiye ve il sıralaması için demo kartları
- HMGS Arena mantığına uygun ücretsiz sürüm reklam simülasyonu ve Premium reklamsız sonuç akışı

## Çalıştırma

Repo dosyalarını indirdikten sonra `index.html` dosyasını doğrudan açabilirsiniz. Yerel sunucu ile çalıştırmak için:

```bash
python -m http.server 8080
```

Sonra tarayıcıdan `http://localhost:8080` adresini açın.

## Çok yıllı yapı

Aktif yıl ve sınav tarihi `app.js` içindeki `CONFIG` alanından yönetilir. Böylece ileride LGS 2028, LGS 2029 gibi sezonlara geçiş tek merkezden yapılabilir; kullanıcıdan sezon seçmesi istenmez.

## Görsel varlık

`assets/zeus-cover.svg` repo içinde çalışan Zeus temalı kapak yedeğidir. Nihai yüksek çözünürlüklü **Inspired from Zeus** kapak görseli `assets/lgs-cover.webp` adıyla kullanılacak şekilde arayüz hazırdır.

## Sıradaki sürüm

- Her ders için 30 soru: toplam 150 soruluk ilk havuz
- Yanlış soruları tek tek tekrar inceleme
- Aynı kazanımdan farklı benzer soru önerisi
- Zeus canlı AI bağlantısı
- Deneme sınavı modülü
- Kullanıcı hesabı ve bulut senkronizasyonu
- Gerçek reklam SDK ve mağaza abonelikleri
