/* Çökme ve analiz. google-services.json yokken sessiz kalır. */
(function (root) {
  'use strict';
  const VERSION = '1.8.1';

  function plugin(name) {
    try {
      if (!root.Capacitor || !root.Capacitor.isNativePlatform || !root.Capacitor.isNativePlatform()) return null;
      if (!root.Capacitor.registerPlugin) return null;
      return root.Capacitor.registerPlugin(name);
    } catch (e) { return null; }
  }

  function crash() { return plugin('FirebaseCrashlytics'); }
  function analytics() { return plugin('FirebaseAnalytics'); }

  function record(err, fatal) {
    const message = (err && err.message) ? String(err.message) : String(err || 'error');
    const stack = (err && err.stack) ? String(err.stack).slice(0, 2000) : '';
    const tool = crash();
    if (!tool) return;
    const job = tool.recordException ? tool.recordException({ message: message + '\n' + stack }) : null;
    if (job && job.catch) job.catch(function () {});
    if (tool.setCustomKey) {
      const key = tool.setCustomKey({ key: 'game_version', value: VERSION, type: 'string' });
      if (key && key.catch) key.catch(function () {});
    }
    if (fatal && tool.crash) {
      const boom = tool.crash({ message: message });
      if (boom && boom.catch) boom.catch(function () {});
    }
  }

  function webAnalytics() {
    const c = root.FIREBASE_CONFIG;
    if (!c || !c.measurementId || typeof document === 'undefined') return;
    if (root.Capacitor && root.Capacitor.isNativePlatform && root.Capacitor.isNativePlatform()) return;
    if (root.__ysGtag) return;
    root.__ysGtag = true;
    root.dataLayer = root.dataLayer || [];
    root.gtag = function () { root.dataLayer.push(arguments); };
    root.gtag('js', new Date());
    root.gtag('config', c.measurementId, { anonymize_ip: true, send_page_view: false });
    const script = document.createElement('script');
    script.async = true;
    script.src = 'https://www.googletagmanager.com/gtag/js?id=' + encodeURIComponent(c.measurementId);
    document.head.appendChild(script);
  }

  function logEvent(name, params) {
    const tool = analytics();
    if (tool && tool.logEvent) {
      const job = tool.logEvent({ name: name, params: params || {} });
      if (job && job.catch) job.catch(function () {});
      return;
    }
    if (typeof root.gtag === 'function') root.gtag('event', name, params || {});
  }

  function install() {
    if (root.__ysTelemetry) return;
    root.__ysTelemetry = true;
    webAnalytics();
    if (typeof root.addEventListener !== 'function') return;
    root.addEventListener('error', function (event) {
      record(event && event.error ? event.error : (event && event.message), false);
    });
    root.addEventListener('unhandledrejection', function (event) {
      record(event && event.reason, false);
    });
  }

  root.YSTelemetry = { version: VERSION, record: record, logEvent: logEvent, install: install };
  if (typeof document !== 'undefined') install();
})(typeof globalThis !== 'undefined' ? globalThis : this);
