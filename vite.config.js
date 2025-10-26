// vite.config.js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist', // <- ВАЖНО! Точка выхода для Vercel
    rollupOptions: {
      input: '/index.html', // Чтобы Vite правильно нашёл корневой HTML
    },
  },
})
