/* AdMob sarmalayıcı. Tarayıcıda ve reklamlar kapalıyken hiçbir şey yapmaz. */
(function (root, factory) {
  const api = factory(root);
  if (typeof module === 'object' && module.exports) module.exports = api;
  root.YSAds = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function (root) {
  'use strict';

  const FLAG = 'yesil-saha-reklamsiz';
  const COUNT = 'yesil-saha-mac-reklam';

  function cfg() { return root.YESIL_ADS || {}; }

  function isNative() {
    try {
      return !!(root.Capacitor && root.Capacitor.isNativePlatform && root.Capacitor.isNativePlatform());
    } catch (e) {
      return false;
    }
  }

  function removed() {
    try { return !!(root.localStorage && root.localStorage.getItem(FLAG) === '1'); } catch (e) { return false; }
  }

  function setRemoved(on) {
    try {
      if (root.localStorage) root.localStorage.setItem(FLAG, on ? '1' : '0');
    } catch (e) {}
    if (!on) return;
    hideBanner();
  }

  function plugin() {
    if (!isNative() || !root.Capacitor || !root.Capacitor.registerPlugin) return null;
    if (!plugin.ref) plugin.ref = root.Capacitor.registerPlugin('AdMob');
    return plugin.ref;
  }

  function listen(name) {
    const admob = plugin();
    return new Promise(function (resolve) {
      if (!admob || !admob.addListener) { resolve(false); return; }
      let done = false;
      const finish = function (value) {
        if (done) return;
        done = true;
        resolve(value);
      };
      admob.addListener(name, function () { finish(true); }).catch(function () { finish(false); });
      setTimeout(function () { finish(false); }, 90000);
    });
  }

  function init() {
    const admob = plugin();
    if (!admob) return Promise.resolve(false);
    const testing = cfg().testing !== false;
    return admob.requestConsentInfo({ tagForUnderAgeOfConsent: false })
      .then(function (info) {
        if (info && info.status === 'REQUIRED' && info.isConsentFormAvailable && admob.showConsentForm) {
          return admob.showConsentForm();
        }
        return info;
      })
      .catch(function () { return null; })
      .then(function () {
        return admob.initialize({
          initializeForTesting: testing,
          tagForUnderAgeOfConsent: false,
          maxAdContentRating: 'Teen',
        });
      })
      .then(function () { return true; })
      .catch(function () { return false; });
  }

  function showBanner() {
    const admob = plugin();
    if (!admob || removed()) return Promise.resolve(false);
    return admob.showBanner({
      adId: cfg().banner,
      adSize: 'BANNER',
      position: 'BOTTOM_CENTER',
      margin: 0,
      isTesting: cfg().testing !== false,
    }).then(function () { return true; }).catch(function () { return false; });
  }

  function hideBanner() {
    const admob = plugin();
    if (!admob || !admob.hideBanner) return Promise.resolve(false);
    return admob.hideBanner().catch(function () { return false; });
  }

  function showInterstitial() {
    const admob = plugin();
    if (!admob || removed()) return Promise.resolve(false);
    return admob.prepareInterstitial({
      adId: cfg().interstitial,
      isTesting: cfg().testing !== false,
    }).then(function () {
      return admob.showInterstitial();
    }).then(function () { return true; }).catch(function () { return false; });
  }

  function showRewarded() {
    const admob = plugin();
    if (!admob) return Promise.resolve(false);
    const earned = listen('onRewardedVideoAdReward');
    return admob.prepareRewardVideoAd({
      adId: cfg().rewarded,
      isTesting: cfg().testing !== false,
    }).then(function () {
      return admob.showRewardVideoAd();
    }).then(function () {
      return earned;
    }).catch(function () { return false; });
  }

  function afterMatch() {
    if (!isNative() || removed()) return Promise.resolve(false);
    let n = 0;
    try { n = Number(root.localStorage.getItem(COUNT) || 0) + 1; root.localStorage.setItem(COUNT, String(n)); } catch (e) { n = 1; }
    const every = Number(cfg().interstitialEvery) || 4;
    if (n % every !== 0) return Promise.resolve(false);
    return showInterstitial();
  }

  return {
    isNative: isNative,
    removed: removed,
    setRemoved: setRemoved,
    init: init,
    showBanner: showBanner,
    hideBanner: hideBanner,
    showInterstitial: showInterstitial,
    showRewarded: showRewarded,
    afterMatch: afterMatch,
  };
});
