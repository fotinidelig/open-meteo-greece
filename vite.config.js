import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import tailwindcss from '@tailwindcss/vite'


// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    proxy: {
      // Same-origin in the browser; Vite forwards to Open-Meteo.
      // Avoids Firefox tracking protection treating the API as a third-party request.
      '/open-meteo': {
        target: 'https://archive-api.open-meteo.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/open-meteo/, ''),
      },
    },
  },
})
