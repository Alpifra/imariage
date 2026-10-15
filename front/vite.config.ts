import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    // Served behind Caddy over HTTPS: the HMR websocket must go through it too
    hmr: { clientPort: Number(process.env.VITE_HMR_CLIENT_PORT ?? 443) },
  },
})
