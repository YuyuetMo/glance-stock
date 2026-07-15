import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Standard Vite + React setup for the Glance renderer.
// base './' keeps asset paths relative so the production build works when
// loaded via file:// from Electron.
export default defineConfig({
  base: './',
  plugins: [react()],
  server: {
    port: 5173,
    strictPort: true,
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  },
})
