// KPSS Panel - servis çalışanı (service worker)
//
// Strateji: "Network-first, cache olarak yedek" (network-first with cache fallback).
// Bu sayede GitHub'daki dosya her güncellendiğinde, internet olduğu sürece
// uygulama HER ZAMAN otomatik olarak en güncel içeriği gösterir — sürüm
// numarasını elle artırmaya hiç gerek kalmaz. Sadece internet yokken
// (offline), en son başarıyla indirilen kopya gösterilir.

const CACHE_NAME = "kpss-panel-cache";
const APP_SHELL = [
  "./",
  "./index.html",
  "./manifest.json",
  "./icon-192.png",
  "./icon-512.png",
  "./icon-192-maskable.png",
  "./icon-512-maskable.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Ağdan taze bir kopya geldi: hem kullanıcıya bunu göster,
        // hem de offline yedek olarak önbelleğe güncelle.
        const copy = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
        return response;
      })
      .catch(() => {
        // İnternet yok / istek başarısız: elimizdeki en güncel yedeği göster.
        return caches.match(event.request).then((cached) => {
          return cached || caches.match("./index.html");
        });
      })
  );
});
