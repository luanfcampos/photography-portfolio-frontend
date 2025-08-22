import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'   // 👈 importa o plugin
import path from 'node:path'

export default defineConfig({
  plugins: [react(), tailwindcss()],          // 👈 adiciona o plugin
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    assetsDir: 'assets',
    rollupOptions: {
      output: {
        manualChunks: undefined,
      }
    }
  },
  server: {
    host: true,
    port: process.env.PORT || 3000
  },
  preview: {
    host: true,
    port: process.env.PORT || 3000
  }
})
