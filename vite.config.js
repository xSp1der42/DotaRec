import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Для корректной работы Vite + React Router
export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist'
  }
})
