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
  define: {
    // react-draggable's optional debug logger assumes a Node-style process global.
    'process.env.DRAGGABLE_DEBUG': 'false',
  },
})
