// MovieLand service worker. The asset list and version are filled in at build time.
// Strategy: precache the app shell, cache-first for built assets, network-first for pages (with an offline fallback).
const VERSION = '78e533187d'
const CACHE = `movieland-${VERSION}`
const PRECACHE = JSON.parse('["./","index.html","manifest.json","favicon.svg","favicon.ico","logo192.png","logo512.png","assets/index-DSlw_rcP.js","assets/index-MviR-A01.css"]')

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      .then((cache) => cache.addAll(PRECACHE.map((p) => new URL(p, self.registration.scope).href)))
      .then(() => self.skipWaiting()),
  )
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k.startsWith('movieland-') && k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  )
})

self.addEventListener('fetch', (event) => {
  const req = event.request
  if (req.method !== 'GET') return
  const url = new URL(req.url)
  if (url.origin !== self.location.origin) return // OMDb and poster hosts always go to the network

  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req)
        .then((res) => {
          const copy = res.clone()
          caches.open(CACHE).then((c) => c.put(new URL('./index.html', self.registration.scope).href, copy))
          return res
        })
        .catch(() => caches.match(new URL('./index.html', self.registration.scope).href)),
    )
    return
  }

  event.respondWith(
    caches.match(req).then(
      (hit) =>
        hit ||
        fetch(req).then((res) => {
          if (res.ok) {
            const copy = res.clone()
            caches.open(CACHE).then((c) => c.put(req, copy))
          }
          return res
        }),
    ),
  )
})
