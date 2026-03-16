// CyberGuard Service Worker — Network First (sempre aggiornato)
const VERSION = 'cg-v1';

// Strategia: network first, nessuna cache persistente
// Ogni apertura scarica la versione più recente dal server

self.addEventListener('install', event => {
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.map(key => caches.delete(key)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  // Strategia network-first: prova sempre la rete
  // Se offline, prova la cache come fallback
  event.respondWith(
    fetch(event.request)
      .then(response => {
        // Salva nella cache solo come fallback offline
        const clone = response.clone();
        caches.open(VERSION).then(cache => {
          if(event.request.method === 'GET') {
            cache.put(event.request, clone);
          }
        });
        return response;
      })
      .catch(() => {
        // Offline: usa la cache se disponibile
        return caches.match(event.request);
      })
  );
});
