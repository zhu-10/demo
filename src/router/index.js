import { createRouter, createWebHashHistory } from 'vue-router'
import AdminPage from '../admin/AdminPage.vue'
const routes = [
  {
    path: '/',
    name: 'AdminPage',
    component: AdminPage, // 布局组件
    // redirect: '/MainPage',
    children: [
      // 子路由
      {
        path: 'MainPage', // 实际路径  // 首页内容
        component: () => import('../admin/components/MainPage.vue'), // 首页内容
      },
      {
        path: 'ManageMent', // 实际路径 /ManageMent // 我的内容
        component: () => import('../Component/ManageMent.vue'), // 我的内容
      },
      {
        path: 'PrivateMessage',
        component: () => import('../UserRelated/PrivateMessage.vue'),
        props: (route) => ({ userId: Number(route.params.userId) }), // 传入 userId
      }, // 私信页面
      { path: 'MessageLog', component: () => import('../UserRelated/MessageLog.vue') }, // 好友消息页面
    ],
  },
  {
    path: '/1',
    name: 'LoginView',
    component: () => import('../views/LoginView.vue'),
  },

  { path: '/2', name: 'RegisterView', component: () => import('../views/RegisterView.vue') },
  {
    path: '/3',
    name: 'updatePasswordView',
    component: () => import('../views/XiugaiMi.vue'),
  },
  {
    path: '/5',
    name: 'PersonalInformation',
    component: () => import('../views/PersonalInformation.vue'), //  个人中心
  },
  {
    path: '/6',
    name: 'SearchComponent2',
    component: () => import('../Component/SearchComponent2.vue'), //搜索显示组件
  },
  {
    path: '/user', // 用户资料页面
    name: 'UserProfile',
    component: () => import('../Component2/UserProfile.vue'), // 用户资料页面
  },
]

const router = createRouter({
  history: createWebHashHistory(), // 改这里
  routes,
})

export default router
