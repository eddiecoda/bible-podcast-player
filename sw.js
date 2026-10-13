// Service worker: caches the app shell so the page opens offline.
// Episode audio is NOT handled here; the page keeps one download in IndexedDB.
const CACHE = "bpp-20261013080405";
const SHELL = ["./", "./index.html", "./manifest.webmanifest", "./icon-192.png", "./icon-512.png",
               "./icon-maskable-192.png", "./icon-maskable-512.png"];
self.addEventListener("install", e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting())); });
self.addEventListener("activate", e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE && k !== "bpp-art").map(k => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener("fetch", e => {
  const req = e.request, url = new URL(req.url);
  if (req.method !== "GET") return;
  if (url.origin === location.origin) {
    if (req.mode === "navigate") {   // network first so a rebuilt catalog shows up, cache when offline
      e.respondWith(fetch(req).then(r => { const c = r.clone(); caches.open(CACHE).then(x => x.put("./index.html", c)); return r; })
        .catch(() => caches.match("./index.html")));
    } else {
      e.respondWith(caches.match(req).then(r => r || fetch(req)));
    }
  } else if (req.destination === "image") {   // show artwork (any host)
    e.respondWith(caches.open("bpp-art").then(c => c.match(req).then(r => r || fetch(req).then(n => { c.put(req, n.clone()); return n; }))));
  }
});
