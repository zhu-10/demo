<template>
  <!-- 好友用户详情页面 -->
  <div class="user-prof">
    <div v-loading="loading" element-loading-text="加载中...">
      <!-- 直接展示数据，不需要 el-form -->
      <el-descriptions title="用户信息" direction="vertical" :column="2" border>
        <el-descriptions-item label="用户名">
          {{ userInfo.username || '未设置' }}
        </el-descriptions-item>

        <el-descriptions-item label="性别">
          {{ userInfo.gender === 'male' ? '男' : userInfo.gender === 'female' ? '女' : '未设置' }}
        </el-descriptions-item>

        <el-descriptions-item label="电话">
          {{ userInfo.phone || '暂无' }}
        </el-descriptions-item>

        <el-descriptions-item label="城市">
          {{ userInfo.city || '暂无' }}
        </el-descriptions-item>

        <el-descriptions-item label="备注">
          {{ userInfo.remark || '暂无' }}
        </el-descriptions-item>

        <el-descriptions-item label="邮箱">
          {{ userInfo.email || '暂无' }}
        </el-descriptions-item>

        <!-- 简介占两列（若总列数为2，则 span=2 占一整行） -->
        <el-descriptions-item label="简介" :span="2">
          {{ userInfo.signature || '暂无' }}
        </el-descriptions-item>
      </el-descriptions>
    </div>
  </div>
</template>
<script setup lang="ts">
import { ref, reactive, onMounted, compile, nextTick, watch } from 'vue'
import axios from 'axios'
import { ElMessage } from 'element-plus'

// ---------- 类型 ----------
interface UserInfo {
  username: string
  phone: string
  city: string
  remark: string
  signature: string
}

const genderOptions = ref([
  { label: '男', value: 'male' },
  { label: '女', value: 'female' },
])

// ---------- 响应式 ----------
const size = ref<'default' | 'large' | 'small'>('default')
const props = defineProps<{
  userId?: number | string // 传入则查看他人，不传则查看自己
}>()
const loading = ref(false)
const usernameInputRef = ref<any>()
const userInfo = reactive<UserInfo>({
  username: '',
  gender: '',
  phone: '',
  city: '',
  remark: '',
  email: '',
  signature: '',
})

interface UserInfo {
  username: string
  gender: string
  phone: string
  city: string
  remark: string
  email: string
  signature: string
}

// 获取用户信息
const fetchUsername = async () => {
  console.log('fetchUsername 被调用,userId:', props.userId)
  const token = localStorage.getItem('access_token')
  if (!token) {
    console.warn('未登录，请先登录')
    return
  }
  try {
    const url = props.userId ? `/shu/users/${props.userId}/` : '/shu/users/me/'
    console.log('请求 URL:', url)
    const res = await axios.get(url, {
      headers: { Authorization: `Bearer ${token}` },
    })
    Object.assign(userInfo, res.data)
    console.log('赋值后 userInfo:', userInfo)
  } catch (error) {
    console.error('获取用户信息失败', error)
    ElMessage.error('获取用户信息失败')
  }
}

// ---------- 切换编辑状态 ----------
const toggleEdit = async () => {
  if (isEditing.value) {
    // 点击“确认”：可在此处做即时校验，或仅退出编辑
    // 我们选择退出编辑，保留当前输入
    isEditing.value = false
  } else {
    // 进入编辑
    isEditing.value = true
    // 等待 DOM 更新后聚焦输入框
    await nextTick()
    usernameInputRef.value?.focus?.()
  }
}

// 确认编辑（按回车键触发）
const confirmEdit = () => {
  if (isEditing.value) {
    // 可以触发校验，但为了不打断用户，仅退出
    isEditing.value = false
  }
}

// ---------- 重置 ----------
onMounted(() => {
  fetchUsername()
})
// 监听 userId 变化，重新获取数据
watch(
  () => props.userId,
  () => {
    fetchUsername()
  },
  { immediate: true },
)
// ---------- 生命周期 ----------
// onMounted(
//   () => props.userId,
//   () => {
//     fetchUsername()
//   },
//   { immediate: true },
// )
</script>

<style scoped>
:deep(.el-descriptions__body .el-descriptions__table .el-descriptions__cell) {
  padding: 12px 150px;
}

.el-descriptions {
  margin-top: 20px;
}
.user-prof {
  margin-top: 130px;
  font-size: 14px;
  width: 1000px;
  margin-left: 400px;
}
</style>
