// Версия кэша инвалидируется при каждом обновлении бэкенд-маршрутизации.
// Старые версии (включая 'nursery-v4-cors-fix') удаляются хендлером 'activate'.
const CACHE_NAME = 'nursery-v8-no-cache';

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Все GET запросы — всегда с сети, без кэша
  if (event.request.method !== 'GET') return;

  // API и внешние сервисы — напрямую
  if (
    url.pathname.startsWith('/api/') ||
    url.hostname !== self.location.hostname
  ) {
    return;
  }

  // Всё остальное — network first, без кэширования
  event.respondWith(
    fetch(event.request).catch(() => caches.match(event.request))
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    Promise.all([
      caches.keys().then((names) => Promise.all(names.map((n) => caches.delete(n)))),
      self.clients.claim()
    ])
  );
});