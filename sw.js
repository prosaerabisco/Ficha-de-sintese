const CACHE_NAME = 'prosa-sintese-v3';
const ASSETS = ['./', './index.html', './manifest.json'];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE_NAME).then((c) => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;
  const url = e.request.url || '';
  // Nunca fazer cache de chamadas de banco de dados, login ou fotos dinâmicas do Supabase
  if (url.indexOf('supabase.co') !== -1 || url.indexOf('/auth/v1') !== -1 || url.indexOf('/rest/v1') !== -1) {
    return;
  }
  e.respondWith(
    fetch(e.request)
      .then((res) => {
        if (res && res.status === 200) {
          const copy = res.clone();
          caches.open(CACHE_NAME).then((c) => c.put(e.request, copy)).catch(() => {});
        }
        return res;
      })
      .catch(() => caches.match(e.request).then((r) => r || (e.request.mode === 'navigate' ? caches.match('./index.html') : undefined)))
  );
});
