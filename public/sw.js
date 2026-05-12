// Версия кэша инвалидируется при каждом обновлении бэкенд-маршрутизации.
// Старые версии (включая 'nursery-v4-cors-fix') удаляются хендлером 'activate'.
const CACHE_NAME = 'nursery-v6-holiday-fix';
const urlsToCache = [
  '/',
  '/index.html',
  '/manifest.json'
];

self.addEventListener('install', (event) => {
  // Принудительно активируем нового SW сразу, без ожидания закрытия вкладки
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(urlsToCache))
  );
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // НИКОГДА не кэшируем и не обрабатываем API-запросы (локальный бэкенд через Traefik)
  // и не трогаем старые облачные URL (если где-то остались — пробрасываем напрямую)
  if (
    url.pathname.startsWith('/api/') ||
    url.hostname === 'functions.poehali.dev' ||
    url.hostname === 'api.poehali.dev'
  ) {
    event.respondWith(fetch(event.request));
    return;
  }

  // Пропускаем POST/PUT/PATCH/DELETE без кэширования
  if (event.request.method !== 'GET') {
    event.respondWith(fetch(event.request));
    return;
  }

  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        if (response) {
          return response;
        }
        return fetch(event.request).then(
          (response) => {
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }
            const responseToCache = response.clone();
            caches.open(CACHE_NAME)
              .then((cache) => {
                cache.put(event.request, responseToCache);
              });
            return response;
          }
        );
      })
  );
});

self.addEventListener('activate', (event) => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    Promise.all([
      // Удаляем старые версии кэша
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheWhitelist.indexOf(cacheName) === -1) {
              return caches.delete(cacheName);
            }
          })
        );
      }),
      // Берём контроль над всеми вкладками сразу
      self.clients.claim(),
    ])
  );
});