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

const isDocumentResponse = (response) =>
  (response.headers.get('content-type') || '').includes('text/html')

// Hashed build output (Vite emits it under /assets/) is immutable per deploy.
const isBuildAsset = (url) => url.pathname.startsWith('/assets/')

self.addEventListener('fetch', (event) => {
  const request = event.request
  if (request.method !== 'GET') return

  const url = new URL(request.url)
  if (url.origin !== self.location.origin) return

  if (isBuildAsset(url)) {
    // Go to the network first for hashed chunks so a stale app shell can't pin a
    // client to assets a newer deploy has removed. Never cache — nor let through
    // as an asset — the SPA index.html fallback the host serves (200) for a
    // missing chunk: the browser would parse that HTML as JS and throw a
    // SyntaxError, blanking the app. Fall back to a cached copy only when the
    // network is unavailable.
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response.ok && !isDocumentResponse(response)) {
            const responseCopy = response.clone()
            caches.open(CACHE_NAME).then((cache) => cache.put(request, responseCopy))
          }
          return response
        })
        .catch(() => caches.match(request)),
    )
    return
  }

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
        if (response.ok && !isDocumentResponse(response)) {
          const responseCopy = response.clone()
          caches.open(CACHE_NAME).then((cache) => cache.put(request, responseCopy))
        }
        return response
      })
    }),
  )
})
