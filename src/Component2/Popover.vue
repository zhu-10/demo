<template>
  <div class="post-actions">
    <!-- 评论入口图标 + 徽章（显示总数） -->
    <div class="action-item" @click.stop="togglePanel">
      <el-badge :value="props.comment" :hidden="props.comment === 0">
        <ChatDotRound class="action-icon" />
      </el-badge>
    </div>

    <!-- 评论面板（点击后展开） -->
    <div class="align-items-center">
      <div v-show="panelVisible" class="comment-panel" @click.stop>
        <el-icon class="close-icon" @click.stop="closePanel"><Close /></el-icon>
        <!-- 评论列表容器（无限滚动） -->
        <div class="comment-list" ref="scrollContainer" @scroll="handleScroll">
          <div v-for="item in commentList" :key="item.id" class="comment-item">
            <div class="comment-content">{{ item.comment || '暂无评论' }}</div>
            <div class="comment-meta">{{ item.user || '用户' }} · {{ item.create_time }}</div>
          </div>
          <div v-if="loading" class="loading-tip">加载中...</div>
          <div v-if="noMore && commentList.length" class="no-more-tip">没有更多了</div>
        </div>
        <!-- 发表评论输入区 -->
        <div class="comment-input-box">
          <el-input
            v-model="comment"
            placeholder="友善评论，文明交流....."
            @keyup.enter="submitComment"
          />
          <el-button type="primary" :icon="ChatLineSquare" @click="submitComment"> 发送 </el-button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, nextTick } from 'vue'
import { ElMessage } from 'element-plus'
import { ChatLineSquare, ChatDotRound } from '@element-plus/icons-vue'
import request from '../api/axios'
import { useRouter } from 'vue-router'
const router = useRouter()
const currentPage = ref(1) // 当前页
// ---------- 类型定义 ----------
interface CommentItem {
  id: number | string
  comment: string
  user: string
  time: string
}
//关闭面板按钮
// 新增关闭面板的方法
const closePanel = () => {
  panelVisible.value = false
}

// ---------- 接收父组件参数 ----------
const props = defineProps<{
  comment: number // 评论总数（由父组件传入）
}>()

const emit = defineEmits<{
  (e: 'update:comment', newCount: number): void
}>()

// ---------- 响应式状态 ----------
const panelVisible = ref(false) // 面板显示/隐藏
const comment = ref('') // 输入框内容
const commentList = ref([]) // 评论列表
const loading = ref(false) // 是否正在加载
const noMore = ref(false) // 是否没有更多数据
const pageSize = 20 // 每页条数
const scrollContainer = ref<HTMLElement | null>(null)

// ---------- 切换面板 ----------
const togglePanel = () => {
  panelVisible.value = !panelVisible.value
  // 首次打开且列表为空时，加载第一页
  if (panelVisible.value && commentList.value.length === 0) {
    loadComments()
  }
}
// ---------- 工具函数：节流 ----------
const throttle = (fn, delay = 200) => {
  let timer = null
  return function (...args) {
    if (timer) return
    timer = setTimeout(() => {
      fn.apply(this, args)
      timer = null
    }, delay)
  }
}

// ---------- 获取评论 ----------
const loadComments = async (reset = false) => {
  if (reset) {
    // 重置列表
    currentPage.value = 1
    commentList.value = []
    noMore.value = false
  }

  // 如果正在加载或已无更多数据，不再请求
  if (loading.value || noMore.value) return

  loading.value = true
  try {
    const res = await request.get('/shu/comment/', {
      params: {
        page: currentPage.value,
        pageSize,
      },
    })

    // 兼容多种返回格式
    let rawList = []
    if (Array.isArray(res.data)) {
      rawList = res.data
    } else if (res.data?.results) {
      rawList = res.data.results
    } else if (res.data?.data) {
      rawList = res.data.data
    } else {
      rawList = []
    }

    // 若返回空数组，则说明没有更多数据
    if (rawList.length === 0) {
      noMore.value = true
      return
    }

    // 转换成统一格式
    const newList = rawList.map((item) => ({
      id: item.id,
      comment: item.comment || '暂无评论',
      user: item.user?.username || '匿名用户',
      create_time: formatTime(item.create_time),
    }))

    // 追加到列表
    commentList.value = [...commentList.value, ...newList]

    // 判断是否还有下一页
    if (rawList.length < pageSize) {
      noMore.value = true
    } else {
      currentPage.value++ // 页码递增，准备请求下一页
    }
  } catch (error) {
    console.error('获取评论列表出错', error)
    ElMessage.error('网络错误，请稍后重试')
  } finally {
    loading.value = false
  }
}
const handleScroll = throttle((e: Event) => {
  const target = e.target as HTMLElement
  const { scrollTop, clientHeight, scrollHeight } = target
  if (scrollHeight - scrollTop - clientHeight < 20) {
    loadComments()
  }
}, 200)

// ---------- 发表评论 ----------
const submitComment = async () => {
  // 登录检查（从 token获取信息）
  const token = localStorage.getItem('access_token') // 从 localStorage 获取 token
  if (!token) {
    ElMessage.error('请先登录')
    router.push('/1')
    return
  }
  const content = comment.value.trim()
  if (!content) {
    ElMessage.warning('评论内容不能为空')
    return
  }
  if (content.length > 300) {
    ElMessage.warning('评论不能超过300字')
    return
  }
  //发送请求
  loading.value = true
  try {
    const res = await request.post('/shu/comment/', {
      comment: content,
    })

    if (res.data.code === 200) {
      ElMessage.success('评论成功')

      // 清空输入框
      comment.value = ''
      // 将新评论添加到列表顶部
      const newComment: CommentItem = {
        id: res.data.data.id,
        comment: res.data.data.comment,
        author: res.data.data.user?.name || `用户${res.data.data.user?.id}`,
        create_time: formatTime(res.data.data.create_time),
      }
      commentList.value.unshift(newComment)

      // 通知父组件更新评论数
      const addComment = () => {
        emit('update:comment', props.comment + 1)
      }

      // 滚动到顶部查看新评论
      nextTick(() => {
        if (scrollContainer.value) {
          scrollContainer.value.scrollTop = 0
        }
      })
    } else {
      // 滚动到顶部查看新评论
      nextTick(() => {
        if (scrollContainer.value) {
          scrollContainer.value.scrollTop = 0
        }
      })
    }
  } catch (error) {
    console.error('评论失败', error)
    ElMessage.error('网络错误，请稍后重试')
  }
}
// ---------- 时间格式化 ----------
const formatTime = (isoString: string): string => {
  const date = new Date(isoString)
  const now = new Date()
  const diff = now.getTime() - date.getTime() // 时间差（毫秒）
  if (diff < 60000) {
    return '刚刚'
  } else if (diff < 3600000) {
    return `${Math.floor(diff / 60000)}分钟前`
  } else if (diff < 86400000) {
    return `${Math.floor(diff / 3600000)}小时前`
  } else {
    return date.toLocaleDateString() // 超过一天显示日期
  }
}
</script>
<style scoped>
.action-item {
  display: flex;
  margin-top: auto; /* 将图标推到列表项的底部 */
  gap: 5px;
  margin-left: 17px;
  cursor: pointer;
  user-select: none;
  transition: all 0.2s;
}
.action-icon {
  font-size: 22px;
  width: 18px;
  color: #000000;
  transition:
    color 0.2s,
    /* 颜色过渡 */ transform 0.1s;
}
.action-item:hover .action-icon {
  transform: scale(1.1);
}
/* 评论悬停颜色 */
.action-item:last-child:hover .action-icon {
  color: #409eff;
}
.align-items-center {
  top: 50px; /* 根据需要调整位置 */
  margin-left: -460px; /*调整输入框右边距 */
}
/* 1. 评论面板：开启 Flex 列布局 */
.comment-panel {
  position: absolute; /* 保持绝对定位（根据你的需求） */
  display: flex; /* ✅ 新增：使 flex 生效 */
  flex-direction: column; /* 纵向排列：列表在上，输入框在下 */
  width: 520px;
  height: 500px; /* 固定高度，便于 80%/20% 计算 */
  max-height: 80vh;
  top: 40px;
  right: 0;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  z-index: 9999;
  overflow: hidden; /* 配合内部滚动，防止溢出 */
}

/* 2. 评论列表：占 80% 高度 */
.comment-list {
  flex: 9; /* 8 / (8+2) = 80% */
  min-height: 0; /* 关键：允许收缩，使 overflow 生效 */
  overflow-y: auto; /* 内容过多时滚动 */
  /* 移除 width: 490px，改为自动宽度 */
  width: 100%;
  padding: 0 12px; /* 可选：左右留白 */
  box-sizing: border-box;
}

/* 3. 输入框区域：占 20% 高度，固定在底部 */
.comment-input-box {
  flex: 1; /* 2 / (9+1) = 10% */
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 5px;
  border-top: 1px solid #eee;
  background: #fafafa;
  box-sizing: border-box;
  /* 移除 width / margin-left 等固定偏移 */
  width: 100%;
  margin-left: 0;
}

.post-actions {
  position: relative; /* 作为绝对定位的参照容器 */
  display: inline-block; /* ✅ 新增：使 flex 生效 */
}

.comment-item {
  padding: 10px 0;
  margin-left: 10px; /* 调整标题左边距 */
  border-bottom: 1px solid #eee;
}
.comment-item:last-child {
  border-bottom: none;
}

.comment-content {
  font-size: 14px;
  line-height: 1.5;
  color: #1f2f3d;
  word-break: break-word;
}

.comment-meta {
  margin-top: 4px;
  font-size: 12px;
  color: #909399;
}

.loading-tip,
.no-more-tip {
  text-align: center;
  font-size: 12px;
  color: #909399;
  padding: 12px 0;
}
/* 4. 关闭按钮样式 */
.close-icon {
  cursor: pointer; /* 鼠标悬停变为手形 */
  width: 1000px;
  padding: 10px 4px;
}
</style>
