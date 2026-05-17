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
      '/api/PublicPostListView/': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
      },
      '/api/send/': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
      },
      '/api/conversations/': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
      },
      '/api/chat/<int:user_id>/': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
      },
      '/api/friends/': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
      },
      '/api/mark/': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
      },
      '/shu/friendship/': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
      },

      '/api/remove/': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
      },
      '/shu/chat/': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
      },
      '/api/handle/<int:request_id>/': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
      },
      '/api/friend/': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
      },
      '/api/messages/': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
      },
      '/shu/history/': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
      },
    },
  },
})
