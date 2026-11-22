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

  function nativePlugin(name) {
    try {
      if (!root.Capacitor || !root.Capacitor.isNativePlatform || !root.Capacitor.isNativePlatform()) return null;
      if (!root.Capacitor.registerPlugin) return null;
      return root.Capacitor.registerPlugin(name);
    } catch (e) {
      return null;
    }
  }

  function storePending() {
    return Promise.resolve({
      ok: false,
      available: false,
      reason: 'store_pending',
      owned: [],
      price: '',
    });
  }

  function capgo() { return nativePlugin('NativePurchases'); }

  function legacy() { return nativePlugin('YesilBilling'); }

  function query() {
    const list = ids();
    const modern = capgo();
    if (modern && modern.getProducts) {
      return modern.getProducts({ productIdentifiers: [list.removeAds, list.coinPack], productType: 'inapp' }).then(function (res) {
        const products = (res && (res.products || res)) || [];
        const row = products.filter(function (p) { return p.productIdentifier === list.removeAds || p.id === list.removeAds; })[0];
        return {
          ok: true,
          available: true,
          price: row ? (row.priceString || row.price || '') : '',
          owned: [],
        };
      }).catch(function () { return storePending(); });
    }
    const native = legacy();
    if (!native) return storePending();
    return native.query({ productIds: [list.removeAds, list.coinPack] }).catch(function () { return storePending(); });
  }

  function purchase(productId) {
    const modern = capgo();
    if (modern && modern.purchaseProduct) {
      return modern.purchaseProduct({ productIdentifier: productId, productType: 'inapp' }).then(function (res) {
        const owned = [productId];
        return { ok: true, available: true, owned: owned, transaction: res || null };
      }).catch(function () { return storePending(); });
    }
    const native = legacy();
    if (!native) return storePending();
    return native.purchase({ productId: productId }).catch(function () { return storePending(); });
  }

  function restore() {
    const modern = capgo();
    if (modern && modern.restorePurchases) {
      return modern.restorePurchases().then(function (res) {
        const rows = (res && (res.purchases || res.transactions)) || [];
        const owned = rows.map(function (row) { return row.productIdentifier || row.productId || row.id; }).filter(Boolean);
        return { ok: true, available: true, owned: owned };
      }).catch(function () { return storePending(); });
    }
    const native = legacy();
    if (!native) return storePending();
    return native.restore().catch(function () { return storePending(); });
  }

  return { ids: ids, query: query, purchase: purchase, restore: restore };
});
