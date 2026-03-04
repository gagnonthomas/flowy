/* ─────────────────────────────────────────────
   Agenda Steph – Service Worker
   Stratégie : Cache-First avec fallback réseau.
   Mise à jour : on vide l'ancien cache à l'activation.
───────────────────────────────────────────── */

const CACHE_NAME = 'agenda-steph-v1';

const ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
];

// ── Install : mise en cache de toutes les ressources ──
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
  );
  // Prendre le contrôle immédiatement sans attendre la fermeture des onglets
  self.skipWaiting();
});

// ── Activate : suppression des anciens caches ──
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

// ── Fetch : Cache-First, fallback réseau ──
self.addEventListener('fetch', (event) => {
  // On ne gère que les requêtes GET
  if (event.request.method !== 'GET') return;

  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;

      // Pas en cache → réseau, puis mise en cache pour la prochaine fois
      return fetch(event.request).then((response) => {
        // On ne met en cache que les réponses valides
        if (!response || response.status !== 200 || response.type === 'opaque') {
          return response;
        }
        const cloned = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, cloned));
        return response;
      });
    }).catch(() => {
      // Offline et pas en cache : renvoyer la page principale comme fallback
      if (event.request.destination === 'document') {
        return caches.match('/index.html');
      }
    })
  );
});
