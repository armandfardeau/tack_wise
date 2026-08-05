import { readFile, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

function serviceWorkerVersionPlugin() {
  const buildVersion = process.env.VERCEL_GIT_COMMIT_SHA ?? new Date().toISOString()

  return {
    name: 'tack-wise-service-worker-version',
    async writeBundle(options: { dir?: string; file?: string }) {
      const outputDirectory = options.dir ?? (options.file ? resolve(options.file, '..') : 'dist')
      const serviceWorkerPath = resolve(outputDirectory, 'sw.js')
      const serviceWorker = await readFile(serviceWorkerPath, 'utf8')
      await writeFile(
        serviceWorkerPath,
        serviceWorker.replace('__TACK_WISE_BUILD_VERSION__', buildVersion),
      )
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), serviceWorkerVersionPlugin()],
  build: {
    // Pin the transpile target explicitly. Vite's default is a *moving*
    // `baseline-widely-available` floor, so a Vite major bump can silently
    // raise the emitted syntax above what an older browser's parser accepts —
    // which is how Safari 16 hit a parse-time SyntaxError and got a blank app.
    // These versions are Vite 7's baseline floor and still include Safari 16.
    target: ['chrome107', 'edge107', 'firefox104', 'safari16'],
  },
  define: {
    // react-draggable's optional debug logger assumes a Node-style process global.
    'process.env.DRAGGABLE_DEBUG': 'false',
  },
})
