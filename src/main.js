import App from './App.vue'
import { createApp } from 'vue'
import { createPinia } from 'pinia'

import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'

import router from './router'
import store from './stores/store' // 引入Vuex store

import * as ElementPlusIconsVue from '@element-plus/icons-vue'

const app = createApp(App)
for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
  app.component(key, component)
}

app.config.errorHandler = (err, instance, info) => {
  console.error('全局捕获错误:', err)
  console.error('出错的组件实例:', instance)
  console.error('错误所属钩子:', info) // 这里会明确显示 "setup function"
  // 可以上报到监控平台
}

app.use(createPinia())
app.use(router)
app.use(store) // 使用Vuex store
app.use(ElementPlus)
app.mount('#app')
