<template>
  <!-- 获取用户私信列表，并支持点击进入聊天窗口 -->
  <div class="private-message">
    <div class="infinite-scroll-container" ref="scrollRef" @scroll="throttledScroll">
      <div
        v-for="conv in validConversationList"
        :key="conv?.id"
        v-show="conv"
        @click="conv && openChatFromList(conv)"
        class="infinite-list-item"
      >
        <img v-if="conv.user?.image" :src="conv.user.image" alt="图片" class="item-image" />
        <div class="message-content">
          <h4>
            {{ conv.receiverName || '匿名用户' }}
            <el-badge
              :value="conv.unread_count"
              :hidden="!conv.unread_count || conv.last_message.unread_count === 0"
              class="unread-badge"
            />
          </h4>
          <p>{{ conv.content || '暂无消息' }}</p>
          <p class="time">{{ formatTime(conv.createTime || '时间') }}</p>
        </div>
      </div>

      <ChatDialog
        v-if="currentChatUser?.username"
        v-model:visible="dialogVisible"
        :user="currentChatUser"
        :currentUserId="currentUserId"
      />
    </div>

    <!-- 加载状态 -->
    <div v-if="loading" class="loading">加载中...</div>
    <div v-if="noMore && !conversationList.length" class="no-more">暂时没有私信</div>
  </div>
</template>

<script setup lang="ts">
import { ref,computed, onMounted, onDeactivated,isRef } from 'vue'
import { ElMessage } from 'element-plus'
import request from 'axios'
import ChatDialog from './ChatDialog.vue'
// --- 数据 ---
const loading = ref(false)
const noMore = ref(false)
const currentPage = ref(1)
const pageSize = 20
const conversationList = ref([])
const dialogVisible = ref(false)
const messages = ref([]) // 声明为响应式数组
const openChat = (user) => {
  console.log('openChat', user)
  currentChatUser.value = user
  dialogVisible.value = true
  console.log('after set, dialogVisible =', dialogVisible.value)
}
const currentChatUser = ref<Conversation['user'] | null>(null) // 当前聊天用户
// const [conversations, setConversations] = useState<Conversation[]>([]);
const currentUserId = ref<number | null>(null) // 当前登录用户的ID
const validConversationList = computed(() => {
    return conversationList.value.filter(conv => conv !== null && conv !== undefined) // 过滤掉 null 或 undefined的元素
})
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
    createTime: string
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
    const res = await request.get('/api/username/', {
      headers: { Authorization: `Bearer ${token}` },
    })
    // 如果返回的是数组，无法获取当前用户 ID，请改用正确的接口
    if (res.code === 200 && res.data) {
      currentUserId.value = res.data.id
      console.log('从后端获取的真实用户ID:', currentUserId.value)
    }
  } catch (error) {
    console.error('获取用户ID失败', error)
    currentUserId.value = null
  }
}

// --- 清空未读消息 标记 ---
const openChatFromList = async (conv: Conversation) => {
  const targetUserId = conv.id
  if (!targetUserId) {
    console.error('无法获取目标用户的 ID', conv)
    return
  }
  console.log('[openChatFromList]', {
  conv,
  user: conv?.user,
  username: conv?.user?.userId,
  currentUserId: currentUserId.value,
  dialogVisibleIsRef: isRef(dialogVisible),
})
  if (!conv || !currentUserId.value) return
  currentChatUser.value = {username: conv.receiverName, id: conv.id, image: conv.user?.image,content: conv.last_message?.content, createTime: conv.last_message?.createTime}
  // 打开弹窗
  dialogVisible.value = true
  // 乐观更新：立即清零
  const originalUnread = conv.unread_count
  conv.unread_count = 0
  try {
    await request.post(`/shu/mark/`,null, {
      params: { userId: targetUserId }, // 这里应该是当前用户 ID
      headers: { Authorization: `Bearer ${localStorage.getItem('access_token')}` }
    })
  } catch (error) {
    conv.unread_count = originalUnread
    console.error('标记已读失败', error)
    ElMessage.error('标记已读失败，请重试')
  }

  // 打开弹窗
  // currentChatUser.value = conv.user
  // dialogVisible.value = true
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
    const response = await request.get('/shu/conversations/', {
      params: { page: currentPage.value, page_size: pageSize },
      headers: { Authorization: `Bearer ${token}` },
    })

    // 1. 根据后端实际返回格式，提取数组
    let list = []
    if (Array.isArray(response.data)) {
        list = response.data
    } else if (Array.isArray(response.data?.data)) {
        list = response.data.data
    }

    // 2. 在这里过滤掉 null 和 undefined（真正生效的过滤）
    list = list.filter(item => item != null)

    // 3. 更新列表数据
    if (reset) {
      conversationList.value = list
    } else {
      conversationList.value = [...conversationList.value, ...list]
    }

    // 4. 分页判断
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
.infinite-list-item {
  padding: 8px;
  border-bottom: 1px solid #eee;
  height: 80px;
  transition: background 0.2s;
  cursor: pointer;
}
.infinite-list-item {
  background-color: #fffefe; /* 未读高亮背景 */
}
.infinite-list-item:hover {
  background-color: #dfdfdf;
}
.infinite-scroll-container {
  height: 30px;
  margin-top: 22px;
  width: 20%;
}
.message-content h4 {
  width: 20px;
  margin-top: -5px;
  margin-left: 10px;
  font-size: 14px;
}
.message-content p {
  font-size: 12px;
  color: #666;
  width: 60px;
  margin-top: -20px;
  height: 4px;
  margin-left: 60px;
}
.message-content .time {
  width: 60px;
  height: 8px;
  margin-left: 75%;
  margin-top: 25px;
}
</style>
