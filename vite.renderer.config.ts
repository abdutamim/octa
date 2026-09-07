import { resolve } from 'node:path'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  root: resolve('src'),
  plugins: [react(), tailwindcss()],
  server: {
    hmr: false
  },
  resolve: {
    alias: {
      '@': resolve('src')
    }
  }
})
