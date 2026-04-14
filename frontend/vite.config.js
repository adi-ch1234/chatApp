import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    /**
     * Proxy /api requests to the Express backend in development.
     * This eliminates the hardcoded backend URL in client code and ensures
     * cookies are sent on the same origin, matching production behaviour.
     */
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        // Required for OAuth redirects: Let the browser follow the 302 from Google
        followRedirects: false,
      },
    },
  },
})
