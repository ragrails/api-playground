import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { fileURLToPath, URL } from 'node:url'

// https://vite.dev/config/
export default defineConfig({
  base: '/',
  resolve: {
    alias: {
      '@xendr/react': fileURLToPath(new URL('../../packages/react/src/index.ts', import.meta.url)),
      '@': fileURLToPath(new URL('../../packages/react/src', import.meta.url)),
      '@pkg': fileURLToPath(new URL('../../packages/react/src', import.meta.url)),
      '@app': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  plugins: [
    react(),
    tailwindcss()
  ],
  build: {
    outDir: '../../dist-app',
    emptyOutDir: true,
  },
})
