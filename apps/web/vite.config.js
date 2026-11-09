import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  base: process.env.BASE_PATH || '/',
  plugins: [react()],
  server: {
    port: Number(process.env.WEB_PORT) || 5174,
    proxy: {
      '/api': {
        target: `http://localhost:${process.env.API_PORT || 3100}`,
        changeOrigin: true,
      },
    },
  },
})
