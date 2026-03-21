// CyberGuard Service Worker — Network First + Push Notifications
const VERSION = 'cg-v4';
const BASE = 'https://osensei78.github.io/cyberguard/';

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

// Network first — sempre aggiornato
self.addEventListener('fetch', event => {
  event.respondWith(
    fetch(event.request)
      .then(response => {
        const clone = response.clone();
        caches.open(VERSION).then(cache => {
          if(event.request.method === 'GET') {
            cache.put(event.request, clone);
          }
        });
        return response;
      })
      .catch(() => caches.match(event.request))
  );
});

// Ricevi messaggi dall'app per mostrare notifiche
self.addEventListener('message', event => {
  if(event.data?.type === 'SHOW_NOTIF') {
    const { title, body, tag } = event.data;
    self.registration.showNotification(title, {
      body,
      icon: BASE + 'icon-192.png',
      badge: BASE + 'icon-192.png',
      tag: tag || 'cyberguard',
      renotify: false,
      vibrate: [200, 100, 200],
      actions: [
        { action: 'open', title: 'Vedi alert' },
        { action: 'dismiss', title: 'Ignora' }
      ]
    });
  }
});

// Gestisci il click sulla notifica
self.addEventListener('notificationclick', event => {
  event.notification.close();
  if(event.action === 'dismiss') return;
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then(clientList => {
        for(const client of clientList) {
          if('focus' in client) return client.focus();
        }
        if(clients.openWindow) return clients.openWindow(BASE);
      })
  );
});

// Push dal server
self.addEventListener('push', event => {
  if(!event.data) return;
  let data;
  try { data = event.data.json(); }
  catch(e) { data = { title: '⚠️ Nuovo Alert', body: event.data.text() }; }
  event.waitUntil(
    self.registration.showNotification(data.title || '⚠️ CyberGuard Alert', {
      body: data.body || 'Nuova minaccia rilevata. Apri l\'app per i dettagli.',
      icon: BASE + 'icon-192.png',
      badge: BASE + 'icon-192.png',
      tag: data.tag || 'cyberguard-push',
      vibrate: [200, 100, 200],
      data: { url: data.url || BASE }
    })
  );
});
