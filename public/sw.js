/* SYSTEM — Service worker (Document 1 §7, Document 2 §5)
 * - Cache des pages : l'application s'ouvre hors connexion
 * - Push API : rappels même application fermée
 * - Un tap sur la notification ouvre System sur l'élément concerné
 */

const CACHE = 'system-v1';
const APP_SHELL = ['/', '/work', '/progress', '/citations', '/settings', '/login'];

// Installation : pré-cache de l'app shell
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(APP_SHELL)).catch(() => undefined)
  );
  self.skipWaiting();
});

// Activation : purge des anciens caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Stratégie : network-first pour les pages (données fraîches, repli cache hors
// connexion) ; cache-first pour les assets statiques Next.js.
self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return; // Supabase & push : réseau direct
  if (url.pathname.startsWith('/api/')) return;

  if (url.pathname.startsWith('/_next/static') || url.pathname.startsWith('/icons')) {
    event.respondWith(
      caches.match(request).then(
        (cached) =>
          cached ||
          fetch(request).then((res) => {
            const copy = res.clone();
            caches.open(CACHE).then((c) => c.put(request, copy));
            return res;
          })
      )
    );
    return;
  }

  event.respondWith(
    fetch(request)
      .then((res) => {
        const copy = res.clone();
        caches.open(CACHE).then((c) => c.put(request, copy));
        return res;
      })
      .catch(() => caches.match(request).then((cached) => cached || caches.match('/')))
  );
});

// Réception d'une notification push
self.addEventListener('push', (event) => {
  let data = { title: 'System', body: 'Rappel', url: '/' };
  try {
    if (event.data) data = { ...data, ...event.data.json() };
  } catch (_) { /* corps non JSON : valeurs par défaut */ }

  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: '/icons/icon-192.png',
      badge: '/icons/icon-192.png',
      tag: data.tag || 'system-reminder',
      renotify: true,
      data: { url: data.url },
    })
  );
});

// Tap sur la notification → ouvre System directement sur l'élément concerné
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const target = (event.notification.data && event.notification.data.url) || '/';
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
      for (const client of clients) {
        if ('focus' in client) {
          client.navigate(target);
          return client.focus();
        }
      }
      return self.clients.openWindow(target);
    })
  );
});
