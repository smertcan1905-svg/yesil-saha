/* Tek reklam ayarı. Debug derlemesi ve web test kimliğini kullanır.
   Release APK/AAB gerçek kimliği kullanır (ads-mode.js release olur).
   npm run cap:sync uygulama kimliğini AndroidManifest APPLICATION_ID
   alanına, debug ve release için ayrı string olarak yazar. */
(function (root) {
  const test = {
    appId: 'ca-app-pub-3940256099942544~3347511713',
    banner: 'ca-app-pub-3940256099942544/6300978111',
    interstitial: 'ca-app-pub-3940256099942544/1033173712',
    rewarded: 'ca-app-pub-3940256099942544/5224354917',
  };
  const release = {
    appId: 'ca-app-pub-1606934841189653~5186465101',
    banner: 'ca-app-pub-1606934841189653/3873383437',
    interstitial: 'ca-app-pub-1606934841189653/4583829875',
    rewarded: 'ca-app-pub-1606934841189653/8934138428',
    reward: { amount: 1, type: 'coin' },
  };
  const mode = root.YESIL_ADS_MODE === 'release' ? 'release' : 'debug';
  const ids = mode === 'release' ? release : test;
  root.YESIL_ADS = {
    mode: mode,
    testing: mode !== 'release',
    appId: ids.appId,
    banner: ids.banner,
    interstitial: ids.interstitial,
    rewarded: ids.rewarded,
    test: test,
    release: release,
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
