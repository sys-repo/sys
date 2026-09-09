/**
 * Sample: service-worker
 */
declare var self: ServiceWorkerGlobalScope;

/**
 * The moment this file is evaluated in the SW context, it will log:
 */
const disposalTrace: string[] = [];
{
  using resource = { [Symbol.dispose]: () => disposalTrace.push('sw:dispose') };
  void resource;
}
console.info('🐷[sw] Service Worker file loaded', disposalTrace);

/**
 * ⚡️ Installation: (once)
 */
self.addEventListener('install', (event: ExtendableEvent) => {
  console.info('🐷[sw] install event fired');
  // Normally you might do event.waitUntil( …cache… ), but here we leave it empty.
  self.skipWaiting();
});

/**
 * ⚡️ Activation:
 */
self.addEventListener('activate', (event: ExtendableEvent) => {
  console.info('🐷[sw] activate event fired');
  self.clients.claim();
});

/**
 * ⚡️ HTTP/FETCH intercepts:
 */
self.addEventListener('fetch', (event: FetchEvent) => {
  console.info('🐷[sw] fetch request:', event.request.url);
  // Pass-through: just let the network handle it:
  event.respondWith(fetch(event.request));
});
