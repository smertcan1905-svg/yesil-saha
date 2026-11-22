/* Google Play Billing. Ürün Play Console'da yoksa available:false döner. */
(function (root, factory) {
  const api = factory(root);
  if (typeof module === 'object' && module.exports) module.exports = api;
  root.YSBilling = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function (root) {
  'use strict';

  function ids() {
    const cfg = root.YESIL_ADS || {};
    const products = cfg.products || {};
    return {
      removeAds: products.removeAds || 'remove_ads',
      coinPack: products.coinPack || 'coin_pack',
    };
  }

  function plugin() {
    try {
      if (!root.Capacitor || !root.Capacitor.isNativePlatform || !root.Capacitor.isNativePlatform()) return null;
      if (!root.Capacitor.registerPlugin) return null;
      if (!plugin.ref) plugin.ref = root.Capacitor.registerPlugin('YesilBilling');
      return plugin.ref;
    } catch (e) {
      return null;
    }
  }

  function unavailable() {
    return Promise.resolve({ ok: false, available: false, reason: 'not_available', owned: [] });
  }

  function query() {
    const native = plugin();
    if (!native) return unavailable();
    const list = ids();
    return native.query({ productIds: [list.removeAds, list.coinPack] }).catch(function () { return unavailable(); });
  }

  function purchase(productId) {
    const native = plugin();
    if (!native) return unavailable();
    return native.purchase({ productId: productId }).catch(function () {
      return { ok: false, available: false, reason: 'not_available' };
    });
  }

  function restore() {
    const native = plugin();
    if (!native) return unavailable();
    return native.restore().catch(function () { return unavailable(); });
  }

  return { ids: ids, query: query, purchase: purchase, restore: restore };
});
