import { fileURLToPath } from 'node:url'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'

export default defineConfig({
  base: '/key-event-plus/',
  plugins: [tailwindcss()],
  resolve: {
    alias: {
      // The demo imports the library itself, straight from source.
      'key-event-plus': fileURLToPath(new URL('../src/index.ts', import.meta.url)),
    },
  },
  server: { port: 43110, strictPort: true },
  preview: { port: 43111, strictPort: true },
})
