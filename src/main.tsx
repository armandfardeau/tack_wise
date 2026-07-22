import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Analytics } from '@vercel/analytics/react'
import { SpeedInsights } from '@vercel/speed-insights/react'
import './index.css'
import App from './App.tsx'
import { SERVICE_WORKER_REGISTERED_EVENT } from './utils/serviceWorker'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
    <Analytics />
    <SpeedInsights />
  </StrictMode>,
)

if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    void navigator.serviceWorker.register('/sw.js')
      .then((registration) => {
        window.dispatchEvent(new CustomEvent(SERVICE_WORKER_REGISTERED_EVENT, { detail: registration }))
        registration.active?.postMessage({ type: 'CLEAN_OLD_CACHES' })
      })
      .catch((error: unknown) => {
        console.warn('Tack Wise could not register its offline app shell.', error)
      })
  })
}
