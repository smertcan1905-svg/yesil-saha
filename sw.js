/* Çevrimdışı önbellek. Ağ varsa taze dosya, yoksa kayıt. */
const CACHE = 'yesil-saha-v18';
const ASSETS = [
  './',
  './index.html',
  './style.css',
  './logic.js',
  './leagues.js',
  './extra.js',
  './progress.js',
  './world.js',
  './season.js',
  './world-db.js',
  './i18n.js',
  './crests.js',
  './firebase-config.js',
  './cloud-save.js',
  './telemetry.js',
  './ads-mode.js',
  './ads-config.js',
  './app-ads.txt',
  './ads.js',
  './billing.js',
  './audio.js',
  './notify.js',
  './logo.png',
  './splash.png',
  './hero.png',
  './audio/music.ogg',
  './audio/crowd.ogg',
  './audio/whistle.ogg',
  './audio/kick.ogg',
  './audio/net.ogg',
  './audio/ui.ogg',
  './audio/jingle.ogg',
  './match.js',
  './game.js',
  './manifest.webmanifest',
  './favicon.svg',
  './icon-192.png',
  './icon-512.png',
];

self.addEventListener('install', function (event) {
  event.waitUntil(
    caches.open(CACHE).then(function (cache) {
      return cache.addAll(ASSETS);
    }).then(function () {
      return self.skipWaiting();
    })
  );
});

self.addEventListener('activate', function (event) {
  event.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(keys.filter(function (key) { return key !== CACHE; }).map(function (key) {
        return caches.delete(key);
      }));
    }).then(function () {
      return self.clients.claim();
    })
  );
});

self.addEventListener('fetch', function (event) {
  const req = event.request;
  if (req.method !== 'GET') return;
  let url;
  try { url = new URL(req.url); } catch (e) { return; }
  if (url.origin !== self.location.origin) return;
  event.respondWith(
    fetch(req).then(function (res) {
      if (res && res.status === 200 && res.type === 'basic') {
        const copy = res.clone();
        caches.open(CACHE).then(function (cache) {
          cache.put(req, copy);
        }).catch(function () {});
      }
      return res;
    }).catch(function () {
      return caches.match(req).then(function (cached) {
        if (cached) return cached;
        if (req.mode === 'navigate') return caches.match('./index.html');
        return caches.match('./index.html');
      });
    })
  );
});
