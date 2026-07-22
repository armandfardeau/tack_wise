import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Analytics } from '@vercel/analytics/react'
import { SpeedInsights } from '@vercel/speed-insights/react'
import './index.css'
import AppWithFeaturebase from './components/AppWithFeaturebase.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AppWithFeaturebase />
    <Analytics />
    <SpeedInsights />
  </StrictMode>,
)

if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch((error: unknown) => {
      console.warn('Tack Wise could not register its offline app shell.', error)
    })
  })
}
