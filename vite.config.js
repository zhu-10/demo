import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import WindiCSS from 'vite-plugin-windicss'

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue(), WindiCSS()],
  server: {
    port: 5173,
    proxy: {
      '/api/': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
      },
      '/shu/daily/': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
      },
      '/api/searchView/': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
      },
      '/shu/username/': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
      },
    },
  },
})
