# Legend Striker

Tek oyunculu, telefonda oynanan bir futbol kariyeri. Menajerlik yok: sahaya sen çıkarsın. Kulüpler ve ligler kurgusaldır.

16 yaşında amatör bir takımda başlarsın. Hafta içinde antrenman yapar ya da dinlenirsin, sonra maça çıkarsın. Şutta topa basılı tutup kaleye kaydırırsın; kaydırmanın yönü isabeti, uzunluğu gücü belirler. Pas pozisyonunda beyaz formalı arkadaşa kaydırır ya da üzerine dokunursun. Sezon sonunda tablo, terfi ve transfer teklifleri gelir. Maaşınla krampon, enerji içeceği, araba ve ev alırsın.

Kayıt tarayıcının `localStorage` alanında durur. Kurulum adımı ve sunucu kodu yok; düz HTML, CSS ve JavaScript. Arayüz Türkçe açılır. Ayarlar’dan İngilizceye geçilir. Kulüp adları şehir ve renk biçimindedir: İstanbul Kırmızı, Londra Kırmızı, Madrid Beyaz. Gerçek kulüp adı ve arma kullanılmaz.

Kupalar da uydurmadır. Ülke kupaları: Anadolu Kupası, Crown Trophy, Copa Sol, Coppa Aurora, Adler Pokal, Coupe Lumière, Tulp Beker, Taça Atlântico. Sezon açılışı Açılış Kalkanı (Season Shield). Kıta: Elmas Kupa (Diamond Cup), Altın Yol Kupası (Golden Road Cup), Yıldız Serisi (Star Series). Kıta açılışı Kıtal Kalkan (Continental Shield). Uluslararası: Uluslar Turnuvası (Nations Trophy). Ödüller: Gol Kralı Ödülü ve Yılın Oyuncusu.

## Çalıştırma

Herhangi bir statik sunucu yeter. Örneğin:

```bash
python3 -m http.server 8741
```

Sonra tarayıcıda [http://127.0.0.1:8741](http://127.0.0.1:8741) adresini aç. Telefonda en iyi dikey ekranda durur. Dosyayı doğrudan `file://` ile açmak da oyunu çalıştırır; çevrimdışı önbellek (service worker) için `http` gerekir.

GitHub Pages gibi bir alt klasörde de göreli yollar sayesinde açılır.

## Test

```bash
node tests/career.test.js
```

## Dil

Ayarlar ekranında Türkçe ve English arasında geçilir. Seçim bu cihazda kalır. Oyun metinleri `i18n.js` tablosundadır.

30 yaşından sonra hız düşer; vizyon ve bitiricilik daha geç zirve yapabilir. 29 yaşından itibaren hoca ve menajer mevki değişimi önerir (kanattan santrfor veya on numara). Alışkanlık maç maç ve sezon sonunda artar, düşükken pas ve çalım biraz zorlaşır.

33 yaşından sonra merkezde **Kariyeri bitir** çıkar. Veda maçı, kariyer özeti, onur köşesi ve sonra dört yol: hoca, televizyon yorumcusu, sportif direktör, akademi.

Ödül gecesinde Altın Yıldız Ödülü için ilk 30, senin sıran ve kazananın açılması durur. Antrenmanda haftalık odak (bitiricilik, hız, pas, çalım, fizik, mental) deneyim çubuğu doldurur. Form ekranında yorgunluk, sakatlık riski, kalan gün ve doktor veya fizyoterapist seçimi vardır.

## Kayıt kodu

Ayarlar’da kariyer bir koda dönüşür. Kodu kopyalayabilir, `yesil-saha.ysave` olarak indirebilir ya da telefonun paylaşım sayfasıyla gönderebilirsin. Yeni telefonda aynı ekrana yapıştır veya dosyayı seç. Eski kayıtlar açılmaya devam eder; kulüp kimlikleri değişmedi.

## Bulut kayıt

Bulut kayıt proje `legend-striker` ile açıktır. Anonim oturum ve Firestore belgesi `users/{uid}/career/current` kullanılır. Ayarlar son eşitleme saatini gösterir. `google-services.json` Android paketindedir; Crashlytics ve Analytics eklentileri native derlemede durur. Tarayıcıda kayıt REST ile gider, Analytics ölçüm kimliği varsa sayfa olayları gider.

Açmak için sahibinin Firebase ve Play konsolunda yapması gerekenler:

1. [Firebase console](https://console.firebase.google.com/) içinde bir proje oluştur. Android uygulamasını `com.respawnmert.yesilsaha` paket adıyla ekle.
2. İndirilen `google-services.json` dosyasını `android/app/google-services.json` yoluna koy. Bu dosya repoda yok; olmadan derleme yine biter.
3. Authentication bölümünde **Anonymous** oturumunu aç. Google ile bağlama sonra eklenebilir; şu an anonim hesap yeter.
4. Firestore Database oluştur. `firestore.rules` dosyasındaki kuralları yapıştır. Yalnızca oturum açmış kullanıcı `users/{kendi uid}/career` belgesini okuyup yazabilir.
5. Proje ayarlarından bir Web uygulaması ekle. `apiKey` ve `projectId` değerlerini `firebase-config.js` içine yaz:

```js
window.FIREBASE_CONFIG = {
  apiKey: 'BURAYA_WEB_API_KEY',
  projectId: 'BURAYA_PROJECT_ID',
};
```

6. İsteğe bağlı native çökme ve analiz için, json durduktan sonra:

```bash
npm install @capacitor-firebase/authentication @capacitor-firebase/firestore @capacitor-firebase/crashlytics @capacitor-firebase/analytics
npm run cap:sync
```

Android Gradle dosyasına Google services eklentisi ancak `google-services.json` varken eklenmelidir. Json yokken bu paketler kurulmaz; `telemetry.js` eklentiyi bulamazsa hiçbir şey yapmaz.

Kayıt `users/{uid}/career/current` belgesindedir. Maç bitince ve uygulama arka plana geçince yazılır. Ağ yoksa kuyruğa alınır, ağ gelince gider. İki taraf da son eşitlemeden sonra değiştiyse oyuncu sorulur; yoksa en yeni zaman damgası kazanır. Ayarlar son eşitleme saatini gösterir. Reklamsız satın alma da bu belgeye yazılır.

## Reklamsız sürüm

Ürün kimliği `remove_ads` (tek seferlik, tüketilmez). Fiyat Play Console’dan gelir, kodda sabit değildir. Banner ve maç arası reklam kapanır; ödüllü reklam durur. Ayarlar’daki **Satın alımları geri yükle** hakkı yerelde ve bulutta tutar. Play Console’da ürün yokken düğme “Mağazada yayınlanınca aktif olacak” der.

Play Console’da oluşturulacak ürün: `remove_ads`. İsteğe bağlı jeton ürünü `coin_pack` aynı yerde durur.

## Ses

Müzik ve efektler bu proje için üretildi. Üçüncü taraf parça veya lisanslı kayıt yok. Dosyalar `audio/` altında kısa Ogg Vorbis döngüleridir: `music.ogg` menü müziği, `crowd.ogg` maç kalabalığı, `whistle.ogg`, `kick.ogg`, `net.ogg`, `ui.ogg`, `jingle.ogg`. Lisans: eser bu depoya aittir, ek kısıtlama yoktur. Ayarlar’da müzik ve efekt sesi ayrı kaydırılır. Bildirimler yalnız Android uygulamasındadır; öğreticiden sonra izin istenir, web’de sessizce atlanır.

## Android uygulaması

Sürüm 1.7.3 (versionCode 12). Bulut kayıt, Crashlytics ve Analytics açık. Paket kimliği ve imza aynı kaldı.

Sürüm 1.6 notu: Maç akışı, hoca, aile, menajer, hayal kulübü ve uydurma kupalar.

Sürüm 1.5 notu: Android adı Legend Striker.

Sürüm 1.4 notu: Android sürümünde Google’ın test reklam kimlikleri `ads-config.js` içindedir. Gerçek kimlikler yalnız o dosyada değişir. Tarayıcıda reklam ve satın alma sessizce kapalıdır. Yayın adımları `store-listing/PUBLISH.md` dosyasındadır.

Sürüm 1.3 notu: İlk açılışta öğretici kartı durur; Ayarlar’dan tekrar açılır. Günlük ödül ve görevler cihazın tarihini kullanır. Saç, ten, sakal ve krampon rengi berberde değişir. Rekor kartı paylaşılır. Arkadaş sıralaması Firebase dolunca açılır; boşken Yakında yazar. Reklam ve uygulama içi satın alma yok.

Sıralama için Firestore kuralına şunu da ekle:

```
match /leaderboard/{userId} {
  allow read: if request.auth != null;
  allow create, update: if request.auth != null && request.auth.uid == userId;
}
```

Sürüm 1.2 notu: Türkiye’de dört lig vardır; Yıldız Lig yalnız Türk kulüplerindendir. İngiltere, İspanya, İtalya, Almanya, Fransa, Hollanda ve Portekiz’in kendi ligleri vardır. Form tutunca yurt dışından teklif gelir. Maaş her ülkede ₺ olarak görünür. Milli takım Türkiye’dir. Eski kayıt, kulüp kimliği durduğu için açılır; karışık üst ligdeki kariyer Türkiye yıldız ligine alınır.

Oyun Capacitor ile Android paketine sarılır. Uygulama adı **Legend Striker**, paket kimliği `com.respawnmert.yesilsaha`. Eski kurulumun üstüne aynı imzayla güncellenir. Kayıt anahtarı değişmedi. Ekran dikey kilitli ve tam ekrandır. Geri tuşu açık sayfayı kapatır; ana menüde uygulamadan çıkar. Maç sırasında geri tuşu maçı yarıda bırakmaz. Titreşim ve WebAudio kabuk içinde çalışır.

### Telefona kurma (APK)

1. `yesil-saha.apk` dosyasını telefona kopyala.
2. Ayarlar → Güvenlik bölümünden bu kaynaktan yüklemeye izin ver.
3. Dosyaya dokunup **Yükle** de.
4. Ana ekrandan Legend Striker’ı aç.

Güncellemede aynı imzayla üretilmiş yeni APK’yı üstüne kurman yeter. Veriler telefonda kalır.

### Google Play (AAB)

Play Console’da yeni uygulama aç. Paket adı `com.respawnmert.yesilsaha` olmalı. Üretim kanalına `yesil-saha.aab` dosyasını yükle. İlk yüklemeden sonra her güncelleme aşağıdaki anahtarla imzalanmalıdır. Anahtarı kaybedersen Play’deki uygulamayı güncelleyemezsin.

### Yayın anahtarı

Anahtar depoda durur: `android/keystore/yesil-saha-release.keystore`

| | |
|---|---|
| Takma ad (alias) | `yesilsaha` |
| Anahtar deposu parolası | `YesilSahaRelease2026` |
| Anahtar parolası | `YesilSahaRelease2026` |
| Geçerlilik | 10000 gün |
| Sertifika | CN=Yesil Saha, O=Respawn Mert, İstanbul, TR |

Ayarlar `android/keystore/keystore.properties` içindedir. Yayın APK ve AAB:

```bash
export ANDROID_HOME="$HOME/android-sdk"
npm run cap:sync
cd android && ./gradlew assembleRelease bundleRelease
```

Çıktılar: `android/app/build/outputs/apk/release/app-release.apk` ve `android/app/build/outputs/bundle/release/app-release.aab`.

## Dosyalar

- `index.html` — sayfa
- `style.css` — telefon düzeni
- `logic.js` — kariyer, lig, şut ve pas kuralları
- `extra.js` — pazarlık, hayat, kupa
- `i18n.js` — Türkçe ve İngilizce
- `crests.js` — kurgusal armalar
- `cloud-save.js`, `firebase-config.js` — kayıt kodu ve isteğe bağlı bulut
- `match.js` — saha ve kaydırma
- `game.js` — menüler ve kayıt
- `manifest.webmanifest`, `sw.js` — PWA ve çevrimdışı önbellek
- `favicon.svg`, `icon-192.png`, `icon-512.png` — simgeler
