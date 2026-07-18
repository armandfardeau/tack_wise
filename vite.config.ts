import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  define: {
    // react-draggable's optional debug logger assumes a Node-style process global.
    'process.env.DRAGGABLE_DEBUG': 'false',
  },
})
