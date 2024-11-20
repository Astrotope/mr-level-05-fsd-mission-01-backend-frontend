import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    open: true
  },
  css: {
    preprocessorOptions: {
      css: {
        javascriptEnabled: true
      }
    }
  }
})
