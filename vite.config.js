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
      //添加作品
      '/shu/daily/': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
      },
      //获取个人作品列表
      '/shu/list/': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
      },
      //获取搜索结果
      '/shu/search/': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
      },
      //获取用户信息
      '/api/username/': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
      },
      //添加评论
      '/shu/comment/': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
      },
      //获取评论
      '/shu/Obtain/?page=1&pageSize=20': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
      },
      //获取作品
      '/shu/like/': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
      },
      //获取个人
      '/shu/my': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
      },
      //删除作品
      '/shu/${id}': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
      },
      //添加私信
      '/shu/send/': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
      },
      //获取私信
      '/shu/chat/': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
      },
      //获取私信列表
      '/shu/conversations/': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
      },
      //获取用户信息
      '/shu/username/': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
      },
      //添加好友
      '/shu/friends/': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
      },
      //私信已读
      '/shu/mark/': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
      },
      //获取好友申请列表
      '/shu/friendship/': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
      },
      //获取好友列表
      '/shu/friend/': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
      },
      //删除好友
      '/shu/remove/${row.id}/': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
      },
      //同意好友申请
      '/shu/handle/${row.id}/': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
      },
      //拒绝好友申请
      '/shu/refuse/${row.id}/': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
      },
      //发送消息
      '/shu/messages/': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
      },
      //获取消息
      '/shu/messages/${row.id}/': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
      },
      //暂定
      // '/shu/history/': {
      //   target: 'http://127.0.0.1:8000',
      //   changeOrigin: true,
      // },
      //标记已读
      '/shu/isread/': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
      },
      // '/shu': {
      //   target: 'http://127.0.0.1:8000',
      //   changeOrigin: true,
      // },
      '/shu/update_user/update_user/': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
      },
    },
  },
})
