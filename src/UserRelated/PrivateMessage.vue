<template>
  <!-- 获取用户私信列表，并支持点击进入聊天窗口 -->
  <div class="private-message">
    <div class="infinite-scroll-container" ref="scrollRef" @scroll="throttledScroll">
      <!-- 会话列表 -->
      <div
        v-for="conv in conversationList"
        :key="conv.id || conv.user?.id"
        @click="openChatFromList(conv)"
        class="infinite-list-item"
      >
        <img v-if="conv.user?.image" :src="conv.user.image" alt="图片" class="item-image" />
        <div class="message-content">
          <h4>
            {{ conv.user?.username || '匿名用户' }}
            <el-badge
              :value="conv.last_message?.unread_count"
              :hidden="!conv.last_message?.unread_count || conv.last_message.unread_count === 0"
              class="unread-badge"
            />
          </h4>
          <p>{{ conv.last_message?.content || '暂无消息' }}</p>
          <p class="time">{{ formatTime(conv.last_message?.create_time || '') }}</p>
        </div>
      </div>

      <ChatDialog
        v-if="currentChatUser?.id"
        v-model:visible="dialogVisible"
        :user="currentChatUser"
        :currentUserId="currentUserId"
      />
    </div>

    <!-- 加载状态 -->
    <div v-if="loading" class="loading">加载中</div>
    <div v-if="noMore && !conversationList.length" class="no-more">暂时没有私信</div>
  </div>
  <div class="button-row">
    <el-button>Default</el-button>
    <el-button type="primary">Primary</el-button>
    <el-button type="success">Success</el-button>
    <el-button type="info">Info</el-button>
    <el-button type="warning">Warning</el-button>
    <el-button type="danger">Danger</el-button>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onDeactivated } from 'vue'
import { ElMessage } from 'element-plus'
import axios from 'axios'
import ChatDialog from './ChatDialog.vue'
// --- 数据 ---
const conversationList = ref<Conversation[]>([]) // 会话列表
const loading = ref(false)
const noMore = ref(false)
const currentPage = ref(1)
const pageSize = 20
const dialogVisible = ref(false)
const currentChatUser = ref<Conversation['user'] | null>(null) // 当前聊天用户
// const [conversations, setConversations] = useState<Conversation[]>([]);
const currentUserId = ref<number | null>(null) // 当前登录用户的ID

//JSON 数据结构定义
interface Conversation {
  id: string
  user?: {
    id: number
    username: string
    image?: string
    // ...
  }
  unread_count?: number
  last_message?: {
    content: string
    create_time: string
    unread_count?: number
  }
}
// --- 获取当前用户ID ---
const fetchCurrentUserId = async () => {
  const savedId = localStorage.getItem('user_id')
  if (savedId) {
    currentUserId.value = Number(savedId)
    console.log('从 localStorage 获取用户ID:', currentUserId.value)
    return
  }

  // 否则尝试请求（但您的接口返回列表且无 id，所以大概率失败）
  const token = localStorage.getItem('access_token')
  if (!token) return
  try {
    const res = await axios.get('/shu/username/', {
      headers: { Authorization: `Bearer ${token}` },
    })
    // 如果返回的是数组，无法获取当前用户 ID，请改用正确的接口
    currentUserId.value = res.data.id ?? null
  } catch (error) {
    console.error('获取用户ID失败', error)
    currentUserId.value = null
  }
}

// --- 清空未读消息 标记 ---
const openChatFromList = async (conv: Conversation) => {
  if (!conv || !conv.user || !currentUserId.value) return
  currentChatUser.value = conv.user

  // 乐观更新：立即清零
  const originalUnread = conv.unread_count
  conv.unread_count = 0

  try {
    await axios.post(
      `/api/mark/${conv.user.id}/`,
      {},
      { headers: { Authorization: `Bearer ${localStorage.getItem('access_token')}` } },
    )
    // 成功，无需额外操作
  } catch (error) {
    // 失败时恢复未读数
    conv.unread_count = originalUnread
    console.error('标记已读失败', error)
    ElMessage.error('标记已读失败，请重试')
  }

  // 打开弹窗
  currentChatUser.value = conv.user
  dialogVisible.value = true
}
// --- 获取会话列表 ---
const fetchConversations = async (reset = false) => {
  if (reset) {
    currentPage.value = 1
    conversationList.value = []
    noMore.value = false
  }
  if (loading.value || noMore.value) return

  const token = localStorage.getItem('access_token')
  if (!token) {
    ElMessage.error('请先登录')
    return
  }

  loading.value = true
  try {
    const response = await axios.get('/api/conversations/', {
      params: { page: currentPage.value, page_size: pageSize },
      headers: { Authorization: `Bearer ${token}` },
    })
    // 后端直接返回数组
    const list = response.data || []

    // ✅ 直接使用原始数据，不要映射
    if (reset) {
      conversationList.value = list
    } else {
      conversationList.value = [...conversationList.value, ...list]
    }

    // 分页判断
    if (list.length < pageSize) {
      noMore.value = true
    } else {
      currentPage.value++
    }
    console.log('会话列表原始数据:', conversationList.value)
  } catch (error) {
    console.error('加载会话列表失败', error)
    ElMessage.error('加载会话列表失败')
  } finally {
    loading.value = false
  }
}

// --- 滚动加载更多（节流）---
const throttledScroll = (() => {
  let timer: number | null = null
  return (e: Event) => {
    if (timer) return
    timer = window.setTimeout(() => {
      timer = null
      const { scrollTop, scrollHeight, clientHeight } = e.target as HTMLElement
      if (scrollHeight - scrollTop - clientHeight < 50 && !loading.value && !noMore.value) {
        fetchConversations(false)
      }
    }, 200)
  }
})()
// ---------- 时间格式化 ----------
const formatTime = (isoString: string) => {
  if (!isoString) return '无时间' // 处理 null/undefined
  const date = new Date(isoString)
  if (isNaN(date.getTime())) return '无效时间' // 处理无效字符串
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  if (diff < 60000) return '刚刚'
  if (diff < 3600000) return `${Math.floor(diff / 60000)}分钟前`
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}小时前`
  return date.toLocaleDateString('zh-CN') // 超过一天显示日期
}

// --- 刷新方法（供父组件调用）---
const refresh = () => {
  fetchConversations(true)
}
defineExpose({ refresh })

// --- 生命周期 ---
onMounted(() => {
  fetchCurrentUserId()
  fetchConversations(true)
})

// 离开时清理（如果有定时器）
onDeactivated(() => {
  // 可清理节流定时器，但这里用闭包不太好清理，暂不处理
})
</script>

<style scoped>
.private-message {
  width: 100%;
  height: 100%;
  margin-left: -184px;
}
.infinite-scroll-container {
  height: 80px;
  margin-top: 22px;
  width: 20%;
  background-color: rgb(255, 255, 255);
}
.message-content h4 {
  width: 20px;
  height: 8px;
  margin-left: 20px;
  font-size: 14px;
}
.message-content p {
  font-size: 12px;
  color: #666;
  width: 60px;
  height: 8px;
  margin-left: 60px;
}
.message-content .time {
  width: 60px;
  height: 8px;
  margin-left: 75%;
  margin-top: 25px;
}
</style>
