import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 5173,
    // Em dev, /api vai para o Spring Boot; o navegador enxerga uma única origem.
    proxy: {
      '/api': 'http://localhost:8080',
    },
  },
})
