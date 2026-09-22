import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import tailwindcss from '@tailwindcss/vite'


// https://vite.dev/config/
export default defineConfig({
  base: '/open-meteo-greece/',
  plugins: [react(), tailwindcss()],
  server: {
    proxy: {
      // Must NOT be a prefix of `base` (e.g. `/open-meteo` steals `/open-meteo-greece/`).
      '/api/open-meteo': {
        target: 'https://archive-api.open-meteo.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/open-meteo/, ''),
      },
    },
  },
})
