const BUILD_VERSION = '__TACK_WISE_BUILD_VERSION__'
const CACHE_NAME = `tack-wise-shell-${BUILD_VERSION}`
let shouldClaimClients = false

const APP_SHELL = [
  '/',
  '/index.html',
  '/manifest.webmanifest',
  '/favicon.svg',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
]

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(APP_SHELL)),
  )
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    shouldClaimClients ? self.clients.claim() : Promise.resolve(),
  )
})

self.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING') {
    shouldClaimClients = true
    self.skipWaiting()
  }

  if (event.data?.type === 'CLEAN_OLD_CACHES') {
    event.waitUntil(
      caches.keys()
        .then((keys) => Promise.all(
          keys
            .filter((key) => key.startsWith('tack-wise-shell-') && key !== CACHE_NAME)
            .map((key) => caches.delete(key)),
        )),
    )
  }
})

self.addEventListener('fetch', (event) => {
  const request = event.request
  if (request.method !== 'GET') return

  const url = new URL(request.url)
  if (url.origin !== self.location.origin) return

  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response.ok) {
            const responseCopy = response.clone()
            caches.open(CACHE_NAME).then((cache) => cache.put('/index.html', responseCopy))
          }
          return response
        })
        .catch(() => caches.match('/index.html').then((cached) => cached || caches.match('/'))),
    )
    return
  }

  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached

      return fetch(request).then((response) => {
        if (response.ok) {
          const responseCopy = response.clone()
          caches.open(CACHE_NAME).then((cache) => cache.put(request, responseCopy))
        }
        return response
      })
    }),
  )
})
