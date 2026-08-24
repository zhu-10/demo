<template>
  <!-- 给作品作者发送私信 -->
  <el-dialog
    :model-value="visible"
    style="width: 650px"
    @update:visible="$emit('update:visible', $event)"
    title="用户详情"
    @close="handleClose"
  >
    <el-tabs v-model="activeTab">
      <!-- 发送私信 -->
      <el-tab-pane label="发送私信" name="message">
        <div v-if="chatList.length" class="chat-history">
          <div v-for="msg in chatList" :key="msg.id" class="chat-item">
            <span class="sender">
              {{ msg.sender_id === currentUserId ? '我' : msg.sender_name }}
            </span>
            <span class="content">{{ msg.content }}</span>
            <span class="time">{{ formatTime(msg.create_time) }}</span>
          </div>
        </div>

        <el-input
          v-model="contentMessage"
          type="textarea"
          :rows="4"
          placeholder="输入私信内容..."
        />
        <el-button
          type="primary"
          :loading="sendingMessage"
          @click="sendMessage"
          style="margin-top: 12px"
        >
          发送
        </el-button>
      </el-tab-pane>

      <!-- 好友操作 -->
      <el-tab-pane label="好友操作" name="friend">
        <el-button
          type="danger"
          plain
          :loading="addingFriend"
          @click="addFriend"
          style="width: 100%"
        >
          添加好友申请
        </el-button>
      </el-tab-pane>

      <!-- 用户详情 -->
      <el-tab-pane label="用户详情" v-if="userInfo" name="profile">
        <p><strong>用户名：</strong>{{ userInfo?.username || '未知' }}</p>
        <p><strong>注册时间：</strong>{{ userInfo?.date_joined || '未知' }}</p>
        <p><strong>个性签名：</strong>{{ userInfo?.signature || '暂无' }}</p>
      </el-tab-pane>
    </el-tabs>
  </el-dialog>
</template>

<script lang="ts" setup>
import { ref, watch, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import axios from 'axios'

const props = defineProps({
  visible: Boolean, // 是否显示对话框
  user: {
    type: Object,
    required: true,
  },
  currentUserId: {
    type: Number,
    default: null,
  },
  // 如果有 visible 就用 v-model 处理
})
const emit = defineEmits<{
  (e: 'update:visible', value: boolean): void
}>()

// --- 状态 ---
const chatList = ref<any[]>([])
const contentMessage = ref('')
const sendingMessage = ref(false)
const addingFriend = ref(false)
const activeTab = ref('message') // 当前激活的标签页
const userInfo = ref<userInfo | null>(null) // 获取用户信息

// --- 格式化时间 ---
const formatTime = (time: string) => {
  if (!time) return ''
  const date = new Date(time)
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

//获取用户信息
const fetchUserInfo = async () => {
  const token = localStorage.getItem('access_token')
  if (!token) {
    ElMessage.error('请先登录')
    return
  }
  try {
    const res = await axios.get('/shu/username/', {
      headers: { Authorization: `Bearer ${token}` },
    })
    userInfo.value = res.data
  } catch (error) {
    console.error('获取用户信息失败', error)
    ElMessage.error('获取用户信息失败')
    userInfo.value = null
  }
}
// 监听用户ID变化，自动加载
watch(
  () => props.user?.id,
  (newId, oldId) => {
    if (newId && newId !== oldId) {
      fetchUserInfo()
    }
  },
  { immediate: true },
) // 组件挂载时立即执行
// --- 发送消息 ---
const sendMessage = async () => {
  if (!contentMessage.value.trim()) {
    ElMessage.warning('请输入消息内容')
    return
  }

  const userId = props.user?.id || props.user
  if (!userId) {
    ElMessage.error('请先选择接收者')
    return
  }

  const token = localStorage.getItem('access_token')
  if (!token) {
    ElMessage.error('请先登录')
    return
  }

  sendingMessage.value = true
  try {
    await axios.post(
      '/api/send/',
      {
        receiver: userId, // 字段名改为 receiver_id
        content: contentMessage.value,
      },
      {
        headers: { Authorization: `Bearer ${token}` },
      },
    )

    ElMessage.success('发送成功')
    contentMessage.value = ''
    await sendMessage(true)
  } catch (error: any) {
    const msg = error.response?.data?.detail || '发送失败'
    console.log('后端错误详情:', error.response?.data)
    console.log('props.user 完整对象:', props.user)
    console.log('提取的 userId:', userId)
    console.log('userId 类型:', typeof userId)
    ElMessage.error(msg)
  } finally {
    sendingMessage.value = false
  }
}

// --- 添加好友 ---
const addFriend = async () => {
  const userId = props.user?.id
  if (!userId) {
    ElMessage.error('用户信息不完整')
    return
  }

  const token = localStorage.getItem('access_token')
  if (!token) {
    ElMessage.error('请先登录')
    return
  }

  addingFriend.value = true
  try {
    await axios.post(
      '/api/friends/',
      {
        to_user_id: userId, // 使用用户ID
      },
      {
        headers: { Authorization: `Bearer ${token}` },
      },
    )
    ElMessage.success('好友请求已发送')
  } catch (error) {
    console.error('添加好友失败:', error)
    console.log('后端错误响应:', error.response?.data) // 打印后端错误响应
    console.log('🔍 准备发送的 userId:', userId)
    ElMessage.error('添加好友失败，请稍后重试')
  } finally {
    addingFriend.value = false
  }
}

// --- 关闭弹窗 ---
const handleClose = () => {
  emit('update:visible', false)
  chatList.value = []
  contentMessage.value = ''
}

// --- 监听弹窗打开 ---
watch(
  () => props.visible,
  (newVal) => {
    if (newVal && props.user?.id) {
      formatTime(true)
    } else {
      chatList.value = []
      contentMessage.value = ''
    }
  },
  { immediate: true },
)
onMounted(() => {
  fetchUserInfo()
})
</script>
<style scoped></style>
