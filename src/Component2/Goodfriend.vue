<template>
  <!-- 好友聊天弹窗 -->
  <el-dialog
    v-model="dialogVisible"
    :title="props.user?.username || '匿名用户'"
    @close="handleClose"
    destroy-on-close
  >
    <div class="chat-container">
      <div class="message-list" ref="scrollRef" @scroll="handleScroll">
        <!-- 顶部加载状态（可选） -->
        <div v-if="loadingNewer" class="load-tip">加载更新中...</div>

        <div v-for="msg in messages" :key="msg.id" class="message-item">
          <span class="time">{{ formatTime(msg.created_at) }}</span>
          <div class="message-content">
            <span class="sender" v-if="msg.sender?.id !== currentUserId">
              {{ msg.sender?.username || '未知用户' }}
            </span>
            <span class="receiver" v-else style="color: #07c160">我</span>
            <span class="content">{{ msg.content }}</span>
          </div>
        </div>

        <!-- 底部加载状态 -->
        <div v-if="loadingOlder" class="load-tip">加载更早消息中...</div>
      </div>

      <div class="input-area">
        <el-input v-model="handleKeyup" @keyup.enter="sendMessage" placeholder="输入消息...">
          <template #suffix>
            <el-button
              :loading="sendingMessage"
              @click="sendMessage"
              type="primary"
              round
              size="small"
              >发送</el-button
            >
          </template>
        </el-input>
      </div>
    </div>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, nextTick, watch, computed, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { throttle } from 'lodash-es'
import axios from 'axios'
import { useRouter } from 'vue-router'
const sendingMessage = ref(false) // 是否正在发送消息
const router = useRouter()

// 如果确实需要当前登录用户信息（比如显示在别处），可保留：
const currentUser = ref<{ username: string } | null>(null)
// ---------- Props & Emits ----------
const props = defineProps<{
  visible: boolean
  user: { id: number; username: string } | null
  currentUserId: number
}>()
const emit = defineEmits(['update:visible'])

// ---------- 响应式数据 ----------
const messages = ref<any[]>([])
const currentUserId = ref(null)
const newMessage = ref('')
const scrollRef = ref<HTMLElement | null>(null)
const handleKeyup = ref('')
// 分页状态
const currentPage = ref(0)
const pageSize = 20
const loadingOlder = ref(false)
const loadingNewer = ref(false)
const hasOlder = ref(true) //
const hasNewer = ref(true) // 初始设为 true，让首次加载能通过
// ---------- 本地计算：弹窗可见性双向绑定 ----------
const dialogVisible = computed({
  get: () => props.visible,
  set: (val) => emit('update:visible', val),
})

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
// --- 获取当前用户ID ---
const fetchCurrentUser = async () => {
  const savedId = localStorage.getItem('user_id')
  if (savedId) {
    currentUserId.value = Number(savedId)
    return
  }
  const token = localStorage.getItem('access_token')
  if (!token) {
    router.push('/1')
    return
  }
  try {
    const res = await fetch('/shu/username/', {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    })
    const data = await res.json()
    currentUser.value = data // 假设 data 有 username 字段
  } catch (error) {
    console.error('获取用户信息失败', error)
    ElMessage.error('获取用户信息失败')
    console.log('子组件收到的 user:', props.user)
  }
}
// ---------- 核心加载函数 ----------
//获取消息列表
const fetchMessages = async (direction: 'older' | 'newer') => {
  // 防止无用户
  if (!props.user?.id) {
    ElMessage.warning('请先选择聊天对象')
    return
  }

  // 防重复和边界判断
  if (direction === 'older') {
    if (loadingOlder.value || !hasOlder.value) return
    loadingOlder.value = true
  } else {
    if (loadingNewer.value || !hasNewer.value) return
    loadingNewer.value = true
  }

  try {
    let page = currentPage.value
    if (direction === 'older') page += 1
    else page -= 1
    if (page < 1) page = 1

    const res = await axios.get(`/shu/history/`, {
      params: { page, page_size: pageSize },
      headers: { Authorization: `Bearer ${localStorage.getItem('access_token')}` },
    })

    const newData = res.data.results || res.data || []
    const totalPages = res.data.total_pages || 1

    if (direction === 'older') {
      messages.value = [...messages.value, ...newData]
      hasOlder.value = page < totalPages && newData.length > 0
    } else {
      // 如果是首次加载（page===1），直接替换；否则前置插入
      const hasNext = !!res.data.next // 或 res.data.next !== null

      if (page === 1) {
        messages.value = newData
        hasNewer.value = false
        hasOlder.value = hasNext
      } else {
        messages.value = [...newData, ...messages.value]
        hasNewer.value = page > 1 && newData.length > 0
      }
      // 滚动到底部
      await nextTick()
      const container = scrollRef.value
      if (container) container.scrollTop = container.scrollHeight
    }
    currentPage.value = page
  } catch (error) {
    ElMessage.error('加载消息失败')
  } finally {
    if (direction === 'older') loadingOlder.value = false
    else loadingNewer.value = false
  }
}
//发送消息
const sendMessage = async () => {
  if (!handleKeyup.value.trim()) {
    ElMessage.warning('请输入消息内容')
    return
  }

  const userId = props.user?.id
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
      '/shu/chat/',
      {
        receiver: userId,
        content: handleKeyup.value,
      },
      {
        headers: { Authorization: `Bearer ${token}` },
      },
    )
    ElMessage.success('发送成功')
    handleKeyup.value = ''
    await fetchMessages('newer')
  } catch (error: any) {
    const msg = error.response?.data?.detail || '发送失败'
    ElMessage.error(msg)
  } finally {
    sendingMessage.value = false
  }
}

// ---------- 滚动加载 ----------
const handleScroll = throttle((e: Event) => {
  const { scrollTop, scrollHeight, clientHeight } = e.target as HTMLElement
  console.log('scroll:', { scrollTop, scrollHeight, clientHeight })

  if (scrollHeight - scrollTop - clientHeight < 50) {
    console.log('触发底部加载')
    if (!loadingOlder.value && hasOlder.value) {
      fetchMessages('older')
    }
  }
  // 顶部加载可选
}, 200)

// ---------- 关闭弹窗 ----------
const handleClose = () => {
  messages.value = []
  newMessage.value = ''
  // 重置分页状态
  currentPage.value = 0
  hasOlder.value = true
  hasNewer.value = true
  handleKeyup.value = '' // 清空输入框
  // 弹窗隐藏由 v-model 自动处理
}

// ---------- 监听弹窗打开 ----------
watch(
  () => props.visible,
  (newVal) => {
    if (newVal && props.user) {
      // 重置状态，加载最新消息
      currentPage.value = 0
      hasOlder.value = true
      hasNewer.value = true
      messages.value = []
      fetchMessages('newer')
    }
  },
  { immediate: true },
)
onMounted(() => {
  fetchCurrentUser()
})
</script>

<style scoped>
.el-dialog {
  margin-left: 300px;
}
.message-list {
  /* flex-direction: column;  */
  width: 710px;
  height: 630px;
  margin-left: 102px;
  overflow-y: auto; /* 添加这一行，允许垂直滚动 */
  /* 可选：美化滚动条 */
  scrollbar-width: thin;
  scrollbar-color: rgba(0, 0, 0, 0.3) transparent;
}

.time {
  margin-left: 240px; /* 调整时间戳的位置 */
}

.el-input {
  height: 40px;
  width: 500px;
  margin-left: 160px;
}
.message-item {
  width: 700px;
}
.message-content {
  height: 70px;
  margin-top: 40px;
}
.receiver {
  margin-right: -100px;
  margin-left: 600px;
}
/* 消息背景框 */
.content {
  margin-left: 15px;
  margin-bottom: -10px;
  display: inline-block; /* 宽度根据文字内容自适应 */
  max-width: 180px; /* 限制最大宽度，防止太长撑爆布局 */
  background-color: #f0f2f5; /* 浅灰色背景（柔和） */
  padding: 4px 14px; /* 上下左右内边距 */
  border-radius: 5px; /* 圆角，像气泡 */
  cursor: pointer; /* 鼠标移上去变手型 */
  transition: background 0.2s; /* 悬停过渡动画 */
  white-space: nowrap; /* 强制一行显示 */
  overflow: hidden; /* 超出部分隐藏 */
  text-overflow: ellipsis; /* 超出显示省略号 */
  font-size: 13px;
  color: #333;
  border: 1px solid #e4e7ed; /* 加个细边框，更有立体感 */
}
</style>
