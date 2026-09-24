<template>
  <div class="head-wai">
    <div class="head-boke">
      <h2>享 趣</h2>
    </div>

    <!-- 搜索框 -->
    <!-- 当我点击搜索 -->
    <div class="search-container">
      <div class="search">
        <el-input
          class="demo-form-inline"
          v-model="input"
          :prefix-icon="Search"
          placeholder="搜索主题、内容或用户名..."
          clearable
          @clear="onClear"
          @keyup.enter="onSearch"
        />

        <el-button class="button" type="primary" :loading="loading" @click="onSearch"
          >搜索</el-button
        >
      </div>
    </div>
    <el-button class="icon" link @click="openDialog">
      <user />
      <!-- 添加好友图标 -->
    </el-button>
    <!-- 子组件，v-model 控制弹窗 -->
    <AddFAriend v-model="dialogVisible" />

    <!-- 头像 -->
    <el-avatar
      class="demo-type"
      src="https://ss1.bdstatic.com/70cFvXSh_Q1YnxGkpoWK1HF6hhy/it/u=3388129398,1658373097&fm=253&gp=0.jpg"
    />
    <!-- 用户管理 -->
    <el-dropdown v-if="userInfo" trigger="click" @command="handleCommand">
      <div class="el-dropdown-link">
        {{ userInfo.user }}
        <el-icon class="el-icon--right"><arrow-down /></el-icon>
      </div>
      <template #dropdown>
        <el-dropdown-menu>
          <el-dropdown-item command="PersonalInformation">个人信息</el-dropdown-item>
          <el-dropdown-item command="updatePasswordView">修改密码</el-dropdown-item>
          <el-dropdown-item command="LoginView">退出</el-dropdown-item>
        </el-dropdown-menu>
      </template>
    </el-dropdown>
  </div>
</template>
<script lang="ts" setup>
import { ref, watch, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useStore } from 'vuex'
import { ElMessage } from 'element-plus'
import { Search } from '@element-plus/icons-vue'
import user from '../../icon/user.vue'
import AddFAriend from '../../UserRelated/AddFriend.vue'
const loading = ref(false)

interface userInfo {
  username: string
  // 其他字段如 avatar, email 等
}
const userInfo = ref<userInfo | null>(null)
const store = useStore() // 获取用户信息
const router = useRouter() // 获取路由
// 退出登录并跳转
const routerPush = () => {
  store.commit('logout') // 清除用户信息和 token
  loading.value = true // 模拟加载状态

  setTimeout(() => {
    loading.value = false
    router.push('/1')
    ElMessage.success('请登录')
  }, 1000) // 模拟加载时间
}
const props = defineProps({
  keyword: String, // 父组件传入的当前关键词，用于同步输入框
})

const emit = defineEmits(['SearchComponent2'])  // 定义一个事件，用于向父组件传递搜索关键词
const input = ref('')

//添加用户弹出框
const dialogVisible = ref(false) // 控制弹窗显示
// 监听对话框打开，加载数据
const openDialog = () => {
  dialogVisible.value = true
}
// 同步外部 keyword 变化（例如路由变化）
watch(
  () => props.keyword,
  (val) => {
    input.value = val || ''
  },
)

function onSearch() {
  const trimmed = input.value.trim()
  console.log('触发搜索', trimmed)
  if (!trimmed) return
  router.push({ name: 'SearchComponent2', query: { q: trimmed } })
}

function onClear() {
  input.value = ''
  router.push({ name: 'SearchComponent2', query: {} }) // 清空时清除 query
}
const fetchUserInfo = async () => {
  const token = localStorage.getItem('access_token');
  if (!token) {
    router.push('/1');
    return;
  }

  try {
    const res = await fetch('/api/username/', {
      headers: { Authorization: `Bearer ${token}` },
    });

    // 先检查状态码，再决定如何读取
    if (!res.ok) {
      // 错误响应：尝试解析为 JSON，失败则转为文本
      let errorMsg = `请求失败，状态码: ${res.status}`;
      try {
        const errorData = await res.json();
        errorMsg = errorData.msg || errorMsg;
      } catch {
        // 不是 JSON，则获取文本
        const text = await res.text();
        errorMsg = text || errorMsg;
      }
      throw new Error(errorMsg);
    }

    // 成功响应：直接解析 JSON
    const data = await res.json();
    userInfo.value = data;
    console.log('用户信息:', data);
  } catch (error) {
    console.error('获取用户信息失败', error);
    ElMessage.error(error.message || '获取用户信息失败');
    userInfo.value = null;
  } finally {
    loading.value = false;
  }
};
//配置跳转路由
const handleCommand = (command) => {
  switch (command) {
    case 'PersonalInformation':
      router.push('/5')
      break
    case 'updatePasswordView':
      router.push('/3')
      break
    case 'LoginView':
      // 执行退出登录（清除 token 等），然后跳转
      router.push('/1')
      break
  }
}

onMounted(() => {
  fetchUserInfo()
})
</script>
<style scoped>
.head-wai {
  display: flex;
  width: 100%;
  height: 80px;
  text-align: left; /*水平居中 */
  align-items: center; /*水平居中 */
  background: linear-gradient(135deg, #7b8ee2 0%, #9565c5 100%);
}
.search-container {
  display: flex;
  width: 80%;
  margin-right: 70px; /* 调整右侧边距 */
  height: 80px;
  align-items: center; /* 垂直居中 */
}
.button {
  width: 60px;
  margin-left: -10px;
}
.search {
  display: flex;
  margin-left: auto; /* 调整左侧边距 */
  width: 300px;
  align-items: center; /* 垂直居中 */
}
.demo-form-inline {
  margin-right: 10px; /*调整输入框右边距 */
}
.el-dropdown-link {
  height: 20px;
  color: aliceblue;
  margin-right: 50px;
}
.head-boke {
  margin-left: 10px; /* 调整标题左边距 */
  width: 150px;
  color: azure;
}
.demo-type {
  margin-right: 5px; /*调整头像右边距 */
}
.icon {
  margin-right: 60px; /* 调整图标右边距 */
}
</style>
