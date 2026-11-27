/**
 * TLS SECURITY LAB V3.0 - Service Worker (Safe Static Shell Caching)
 * NEVER caches /api/* responses, authenticated data, or private keys.
 */
const CACHE_NAME = 'tls-lab-static-v3';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/style.css',
  '/script.js',
  '/academy-data.js',
  '/quiz-data.js',
  '/challenges-data.js',
  '/career-data.js',
  '/i18n-data.js',
  '/manifest.json',
  '/offline.html',
  '/icons/icon.svg'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  if (event.request.method !== 'GET') return;
  // Security: Never cache backend APIs, SSE streams, or authenticated endpoints
  if (url.pathname.startsWith('/api/')) return;
  if (url.origin !== self.location.origin) return;

  event.respondWith(
    fetch(event.request)
      .then((resp) => {
        if (resp && resp.status === 200) {
          const clone = resp.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
        }
        return resp;
      })
      .catch(() => caches.match(event.request).then((cached) => cached || caches.match('/offline.html')))
  );
});
