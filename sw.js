
// CyberGuard Service Worker â€” Versione Ottimizzata
const VERSION = 'cg-v3';
const BASE = 'https://osensei78.github.io/cyberguard/';

self.addEventListener('install', event => {
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(key => key !== VERSION).map(key => caches.delete(key)))
    ).then(() => self.clients.claim())
  );
});

// Network First con fallback sulla cache
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;

  event.respondWith(
    fetch(event.request)
      .then(response => {
        const clone = response.clone();
        caches.open(VERSION).then(cache => cache.put(event.request, clone));
        return response;
      })
      .catch(() => caches.match(event.request))
  );
});

// Gestione Notifiche Interne (Messaggi dall'App)
self.addEventListener('message', event => {
  if (event.data?.type === 'SHOW_NOTIF') {
    const { title, body, tag, url } = event.data;
    const options = {
      body: body || 'Nuovo aggiornamento',
      icon: BASE + 'icon-192.png',
      badge: BASE + 'icon-192.png',
      tag: tag || 'cyberguard-info',
      vibrate: [200, 100, 200],
      data: { url: url || BASE }, // Salviamo l'URL nei metadati
      actions: [
        { action: 'open', title: 'Apri' },
        { action: 'close', title: 'Chiudi' }
      ]
    };
    event.waitUntil(self.registration.showNotification(title, options));
  }
});

// Gestione Notifiche PUSH (Dal Server)
self.addEventListener('push', event => {
  let data = {
    title: 'âš ï¸ CyberGuard Alert',
    body: 'Nuova minaccia rilevata.',
    url: BASE
  };

  if (event.data) {
    try {
      const payload = event.data.json();
      data.title = payload.title || data.title;
      data.body = payload.body || data.body;
      data.url = payload.url || data.url;
    } catch (e) {
      data.body = event.data.text();
    }
  }

  const options = {
    body: data.body,
    icon: BASE + 'icon-192.png',
    badge: BASE + 'icon-192.png',
    vibrate: [300, 100, 300],
    data: { url: data.url }, // Fondamentale per il click
    tag: 'cyberguard-push'
  };

  event.waitUntil(self.registration.showNotification(data.title, options));
});

// Gestione Click sulla Notifica
self.addEventListener('notificationclick', event => {
  event.notification.close();
  
  if (event.action === 'close') return;

  // Recupera l'URL dai dati della notifica o usa la BASE
  const urlToOpen = event.notification.data?.url || BASE;

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then(windowClients => {
        // Se c'Ã¨ giÃ  una finestra aperta con quell'URL, mettila a fuoco
        for (let client of windowClients) {
          if (client.url === urlToOpen && 'focus' in client) {
            return client.focus();
          }
        }
        // Altrimenti apri una nuova finestra
        if (clients.openWindow) {
          return clients.openWindow(urlToOpen);
        }
      })
  );
});
