import { resolve } from 'node:path'
import { defineConfig, externalizeDepsPlugin } from 'electron-vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  main: {
    plugins: [externalizeDepsPlugin()],
    build: {
      rollupOptions: {
        input: {
          main: resolve('electron/main.ts'),
          'mcp-server': resolve('electron/core/octa/mcp-server.ts')
        },
        external: ['better-sqlite3']
      }
    }
  },
  preload: {
    plugins: [externalizeDepsPlugin()],
    build: {
      rollupOptions: {
        input: {
          preload: resolve('electron/preload.ts')
        }
      }
    }
  },
  renderer: {
    root: resolve('src'),
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': resolve('src')
      }
    },
    build: {
      rollupOptions: {
        input: resolve('src/index.html')
      }
    }
  }
})
