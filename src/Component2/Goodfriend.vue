<template>
  <!-- 好友聊天弹窗 -->
  <el-dialog
    :model-value="props.visible"
    :title="props.user?.friendName || '匿名用户'"
    @update:model-value="emit('update:visible', $event)"
    @close="handleClose"
    destroy-on-close
  >
    <div class="chat-container">
  <div class="message-list" ref="scrollRef" @scroll="handleScroll">
    <div v-if="loadingNewer" class="load-tip">加载更新中...</div>

    <!-- 加一层防御，如果 messages 为 null 就不循环 -->
    <template v-if="messages && messages.length > 0">
      <div v-for="msg in messages" :key="msg.id" class="message-item">
        <span class="time">{{ formatTime(msg.createTime || msg.updateTime) }}</span>
        <div class="message-content">
          <!-- 判断：如果消息的发送者不是当前用户，就是对方发的 -->
          <span
            v-if="currentUserId !== null && Number(msg.senderId) !== Number(currentUserId)"
            class="sender"
          >
            <!-- 点击直接传对方的 userId (即好友ID) -->
            <el-link @click="goToUserProfile(msg.userId)">
              <!-- 直接显示 friendName -->
              {{ msg.friendName || '未知用户' }}
            </el-link>
          </span>
          <!-- 否则就是自己发的 -->
          <span v-else class="receiver" style="color: #07c160">我</span>

          <span class="content">{{ msg.content }}</span>
        </div>
      </div>
    </template>

      <div v-else class="no-message">暂无聊天记录</div>

      <div v-if="loadingOlder" class="load-tip">加载更早消息中...</div>
      </div>


      <div class="input-area">
        <el-input
          v-model="newMessage"
          @keyup.enter="sendMessage"
          placeholder="输入消息..."
        >
          <template #suffix>
            <el-button
              :loading="sendingMessage"
              @click="sendMessage"
              type="primary"
              round
              size="small"
            >
              发送
            </el-button>
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
import request from '../api/axios'
import { useRouter } from 'vue-router'
const sendingMessage = ref(false) // 是否正在发送消息
const router = useRouter()

// 如果确实需要当前登录用户信息（比如显示在别处），可保留：
const currentUser = ref<{ username: string } | null>(null)
// ---------- Props & Emits ----------
const props = defineProps<{
  visible: boolean
  user: { id: number; friendName?: string; username?: string } | null
  currentUserId: number | null
}>()
const emit = defineEmits(['update:visible'])
// ---------- 响应式数据 ----------
const messages = ref<any[]>([])
const currentUserId = ref<number | null>(null)
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

//跳转到用户详情页
const goToUserProfile = (targetId: number | null) => {
  console.log('【触发点击】 targetId:', targetId)
  if (!targetId) return
  router.push({
    name: 'UserProfile',
    params: { userId: String(targetId) }, // 注意：params 中的值会被转为字符串，但组件中接收为 number 也能兼容
  })
}
// --- 获取当前用户ID ---
const fetchCurrentUser = async () => {
  // 如果 props.currentUserId 已经有值，就不用取
  if (props.currentUserId) return
  const savedId = localStorage.getItem('user_id')
  if (savedId) return
  const token = localStorage.getItem('access_token')
  if (!token) return router.push('/1')
  try {
    const res = await request.get('/shu/username/', {
      headers: { Authorization: `Bearer ${token}` },
    })
    currentUser.value = res.data      // ✅ 不是 res.json()
  } catch (e) {
    console.error('获取用户信息失败', e)
  }
}

// ---------- 核心加载函数 ----------
//获取消息列表
const fetchMessages = async (direction: 'older' | 'newer') => {
  if (!props.user?.id) return ElMessage.warning('请先选择聊天对象')

  try {
    let page = currentPage.value
    page = direction === 'older' ? page + 1 : Math.max(1, page - 1)

    const res = await request.get('/shu/getmessages/', {
      params: {
        page,
        pageSize,
        userId: props.user.id,
      },
      headers: { Authorization: `Bearer ${localStorage.getItem('access_token')}` },
    })
    console.log('接口返回的真正 res 结构:', res)  // ✅ 注意：接口返回的 res.data 本身就是数组！直接赋值，不要再点 .data

    // ✅ 判断 code
    if (res.code === 200) {
      // ✅ 注意：接口返回的 res.data 本身就是数组！直接赋值，不要再点 .data
      const newData = res.data || []
      console.log('获取到真正的消息数组:', newData)

      // 由于你的后端没有返回 total_pages 和 next，我们通过 newData.length 简单判断
      const hasNext = newData.length > 0

    if (direction === 'older') {
        // 加载更早的历史消息：查出的是更旧的N条（DESC），反转后变为（旧->新），拼接到头部
        const olderData = [...newData].reverse()
        messages.value = [...olderData, ...messages.value]
      } else {
        // 首次加载或下拉加载最新：查出的是最新的N条（DESC），反转后变为（旧->新），直接赋值或拼接到尾部
        const latestData = [...newData].reverse()
        if (page === 1) {
          messages.value = latestData
        } else {
          messages.value = [...messages.value, ...latestData]
        }
      }
      currentPage.value = page
    } else {
      ElMessage.error(res.msg || '获取消息失败')
    }
  } catch (error) {
    console.error('加载消息异常:', error) // 如果还有错，这里会打印出准确的报错原因
    ElMessage.error('加载消息失败')
  } finally {
    if (direction === 'older') loadingOlder.value = false
    else loadingNewer.value = false
  }
}
//发送消息
const sendMessage = async () => {
  if (!newMessage.value.trim()) return ElMessage.warning('请输入消息内容')

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
    await request.post(
      '/shu/messages/',
      {
        friend: props.user?.id,
        content: newMessage.value,
      },
      {
        headers: { Authorization: `Bearer ${token}` },
      },
    )
    ElMessage.success('发送成功')
    newMessage.value = ''  // 清空输入框
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
  height: 600px;
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
.no-message{
  margin-left: 300px;
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
.input-area {
  margin-left: -50px;
}
</style>
