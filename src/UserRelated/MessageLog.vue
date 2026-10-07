<template>
  <!-- 获取用户好友列表，并支持点击进入聊天窗口 -->
  <div class="private-message">
    <div class="infinite-scroll-container" ref="scrollRef" @scroll="throttledScroll">
      <!-- 会话列表 -->
      <div
        v-for="conv in conversationList"
        :key="conv.id || conv.user?.id"
        @click="openChatFromList(conv)"
      >
        <img v-if="conv.user?.image" :src="conv.user.image" alt="图片" class="item-image" />
        <div class="message-content">
          <h4>
            {{ conv.friendName || '匿名用户' }}
            <el-badge
              :value="conv.unread_count"
              :hidden="conv.unread_count === 0"
              class="unread-badge"
            />
          </h4>
          <!-- <p>{{ conv.last_message?.sender_detail || '暂无好友' }}</p> -->
          <p class="time">{{ formatTime(conv.updateTime) }}</p>
        </div>
      </div>
    </div>

    <!-- 聊天弹窗 -->

    <Goodfriend
      v-model:visible="dialogVisible"
      :user="currentChatUser"
      :currentUserId="currentUserId"
    />

    <!-- 加载状态 -->
    <div v-if="loading" class="loading">加载中...</div>
    <div v-if="noMore && !conversationList.length" class="no-more">还没有好友哦</div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onDeactivated } from 'vue'
import { ElMessage } from 'element-plus'
import request from '../api/axios'
import Goodfriend from '../Component2/Goodfriend.vue'
// --- 数据 ---
const conversationList = ref<any[]>([]) // 会话列表
const loading = ref(false)
const noMore = ref(false)
const currentPage = ref(1)
const pageSize = 20
const dialogVisible = ref(false)
const currentChatUser = ref<any>(null)
const currentUserId = ref(123)

// --- 获取当前用户ID ---
const fetchCurrentUserId = async () => {
  // 优先从 localStorage 读取（登录时保存）
  const savedId = localStorage.getItem('user_id')
  if (savedId) {
    currentUserId.value = Number(savedId)
    console.log('从 localStorage 获取用户ID:', currentUserId.value)
    return currentUserId.value
  }

  // 否则尝试请求（但您的接口返回列表且无 id，所以大概率失败）
  const token = localStorage.getItem('access_token')
  if (!token) return null
  try {
    const res = await request.get('/shu/username/', {
      headers: { Authorization: `Bearer ${token}` },
    })
    // 如果返回的是数组，无法获取当前用户 ID，请改用正确的接口
    console.warn('/shu/username/ 返回数据:', res.data)
    // 如果确实能获取到 id（假设字段是 id），则赋值，否则置 null
    currentUserId.value = res.data.id ?? null
    return currentUserId.value
  } catch (error) {
    console.error('获取用户ID失败', error)
    return null
  }
}

// --- 打开弹出框并清空消息未读消息 标记 ---
const openChatFromList = async (conv: any) => {
  console.log('点击了会话:', conv)

  // 1. 先校验关键字段（用实际存在的字段名）
  if (!conv?.userId) {
    ElMessage.warning('会话数据异常')
    return
  }

  // 2. 设置聊天对象（子组件 props.user 靠这个）
  currentChatUser.value = {
    id: conv.userId,               // ✅ 用 userId，不是 friend_id
    username: conv.friendName,     // ✅ 用 friendName
    friendName: conv.friendName,
  }
  console.log('设置 currentChatUser:', currentChatUser.value)

  // 3. 打开弹窗
  dialogVisible.value = true

  // 4. 标记已读（可选，字段名先对一下）
  try {
    await request.post('/shu/isread/', { userId: conv.userId }, {
      headers: { Authorization: `Bearer ${localStorage.getItem('access_token')}` },
    })
  } catch (e) {
    console.error('标记已读失败', e)
  }
}
// --- 获取好友列表 ---
const fetchConversations = async (reset = false) => {
  if (reset) {
    currentPage.value = 1
    conversationList.value = []
    noMore.value = false
  }

  if (!reset && (loading.value || noMore.value)) return

  const token = localStorage.getItem('access_token')
  if (!token) {
    ElMessage.error('请先登录')
    return
  }

  const currentUserId = localStorage.getItem('user_id')
  loading.value = true

  try {
    const response = await request.get('/shu/friend/', {
      params: {
        currentUserId,
        page: currentPage.value,
        page_size: pageSize.value || pageSize
      },
      headers: { Authorization: `Bearer ${token}` },
    })

    console.log('接口真实返回的 response:', response)

    // 🔥 核心修改：不管响应是什么层级，只要抓出里面的数组
    let list = Array.isArray(response)
  ? response
  : (response?.data?.list || response?.data || [])

    console.log('最终提取出的列表:', list)


    // 赋值逻辑
    if (reset || currentPage.value === 1) {
      conversationList.value = list
    } else {
      conversationList.value = [...conversationList.value, ...list]
    }

    // 分页判断
    if (list.length === 0 || list.length < (pageSize.value || pageSize)) {
      noMore.value = true
    } else {
      currentPage.value++
    }

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
.message-content:hover {
  background-color: #dfdfdf;
}
.message-content {
  height: 80px;
  background-color: #fffefe; /* 未读高亮背景 */
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
  margin-left: 71%;
  margin-top: 50px;
}
</style>
