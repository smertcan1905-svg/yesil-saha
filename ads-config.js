/* Tek reklam ayar dosyası.
   Şu an Google'ın resmi TEST kimlikleri duruyor.
   Gerçek reklam için testing değerini false yap ve aşağıdaki kimlikleri
   kendi AdMob uygulama ve birim kimliklerinle değiştir.
   Android uygulama kimliği ayrıca derlemede strings.xml içine kopyalanır
   (scripts/sync-ads.js). Başka dosyada kimlik tutma. */
(function (root) {
root.YESIL_ADS = {
  testing: true,
  appId: 'ca-app-pub-3940256099942544~3347511713',
  banner: 'ca-app-pub-3940256099942544/6300978111',
  interstitial: 'ca-app-pub-3940256099942544/1033173712',
  rewarded: 'ca-app-pub-3940256099942544/5224354917',
  interstitialEvery: 4,
  rewards: {
    energy: 30,
    money: 400,
    coins: 5000,
  },
  products: {
    removeAds: 'remove_ads',
    coinPack: 'coin_pack',
  },
};
})(typeof globalThis !== 'undefined' ? globalThis : this);
