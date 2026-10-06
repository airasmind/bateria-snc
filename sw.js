var VERSION = "snc-bateria-v1";
var CORE = ["./", "index.html", "manifest.webmanifest", "icon-192.png", "icon-512.png", "icon-maskable-512.png", "logo.png", "apple-touch-icon.png"];
var EXT = "snc-bateria-ext";

self.addEventListener("install", function (e) {
  e.waitUntil(caches.open(VERSION).then(function (c) { return c.addAll(CORE); }).then(function () { return self.skipWaiting(); }));
});
self.addEventListener("activate", function (e) {
  e.waitUntil(caches.keys().then(function (ks) {
    return Promise.all(ks.filter(function (k) { return k !== VERSION && k !== EXT; }).map(function (k) { return caches.delete(k); }));
  }).then(function () { return self.clients.claim(); }));
});
self.addEventListener("fetch", function (e) {
  var r = e.request;
  if (r.method !== "GET") return;
  var url = new URL(r.url);
  if (url.origin === location.origin) {
    // Archivos propios: primero la red (para recibir mejoras); sin conexión, lo guardado.
    e.respondWith(fetch(r).then(function (res) {
      if (res && res.ok) { var copy = res.clone(); caches.open(VERSION).then(function (c) { c.put(r, copy); }); }
      return res;
    }).catch(function () { return caches.match(r).then(function (m) { return m || caches.match("index.html"); }); }));
  } else if (/(^|\.)(cdnjs\.cloudflare\.com|fonts\.googleapis\.com|fonts\.gstatic\.com)$/.test(url.hostname)) {
    // Lector de PDF y tipografías: se guardan la primera vez para usarlos sin conexión.
    e.respondWith(caches.open(EXT).then(function (c) {
      return c.match(r).then(function (m) {
        var net = fetch(r).then(function (res) { if (res && (res.ok || res.type === "opaque")) c.put(r, res.clone()); return res; }).catch(function () { return m; });
        return m || net;
      });
    }));
  }
});
