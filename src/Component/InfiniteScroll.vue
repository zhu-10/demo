<template>
  <div class="infinite-scroll-container" ref="scrollRef" @scroll="handleScroll">
    <div v-for="item in tableData" :key="item.id" class="infinite-list-item">
      <img v-if="item.image" :src="item.image" alt="图片" class="item-image" />
      <div>
        <h4>{{ item.theme || '默认主题' }}</h4>
        <p>{{ item.content || '暂无内容' }}</p>
        <el-button class="h5" @click="openChatFromList(item)">
          <h5>{{ item.username }}</h5>
        </el-button>
      </div>
      <!-- 点赞按钮 -->
      <LikeButton />
    </div>
    <!-- 弹出框 -->
    <UserDetails
      v-if="selectedUser && selectedUser.id"
      v-model:visible="dialogVisible"
      :user="selectedUser"
      :currentUserId="currentUserId"
    />
    <div v-if="loading" class="loading">加载中...</div>
    <div v-if="noMore && !list.length" class="no-more">没有更多数据了</div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import UserDetails from '../UserRelated/UserDetails.vue'
import LikeButton from '../Component2/LikeButton.vue'
import request from '../api/axios.js'
const currentPage = ref(1) // 当前页码
const tableData = ref([]) // 数据列表
const list = ref([]) // 数据列表
const loading = ref(false)
const noMore = ref(false)
const pageSize = 20 // 每页数据量
const dialogVisible = ref(false) // 控制用户详情对话框的显示
// 必须定义这个函数
const selectedUser = ref(null) // 存储当前点击的用户信息
const currentUserId = ref(null) // 存储当前登录用户 ID
const openChatFromList = async (item: any) => {
  console.log('完整的 item 对象:', item)
  // 1. 获取用户ID（根据实际字段名调整）
  const userId = item.username
  if (!userId) {
    ElMessage.warning('该用户信息缺失')
    return
  }

  const token = localStorage.getItem('access_token')
  if (!token) {
    ElMessage.error('请先登录')
    return
  }

  try {
    // 2. 请求完整的用户信息
    const response = await request.get(`/api/username/`, {
      params: { user_id: userId },
      headers: { Authorization: `Bearer ${token}` },
    })
     // 🟢 1. 先解包外层 Result
    const resData = response.data?.data || response.data
     // 🟢 2. 兼容后端直接返回数组的情况
    const userData = Array.isArray(resData) ? resData[0] : resData
    if (!userData) {
      ElMessage.error('未找到该用户')
      return
    }
    selectedUser.value = {
      id: userData.id,
      username: userData.username, // 明确取出 username
    }
    console.log('🟢 selectedUser 已修正:', selectedUser.value) // 调试验证
    console.log('selectedUser 已赋值:', selectedUser.value) // 调试验证
    dialogVisible.value = true
  } catch (error) {
    console.error('获取用户信息失败:', error)
    ElMessage.error('无法获取用户信息')
  }
}
// 获取数据
// 获取公开作品列表（用于广场/他人主页）
const fetchMergedData = async () => {

  const token = localStorage.getItem('access_token')
  // 如果没登录、正在加载、或已加载完，则停止
  if (!token || loading.value || noMore.value) return

  loading.value = true
  try {
    // 请求公开作品（后端接口需保证只返回 isPublic = 1 的数据）
  const response = await request.get('/shu/list/', {
  params: {
    page: currentPage.value,
    page_size: pageSize,
  },
  headers: {
    Authorization: `Bearer ${token}`,
  },

  })
  console.log('📦 后端返回的完整数据:', response.data) // 调试验证

    // 假设后端返回格式为 { list: [...], total: 0 }
    // 如果直接返回数组，则改成 const newData = response.data
    const newData = response.data.data || []  // ✅ 取的是数组

    // 将新数据追加到表格/列表中（如果是下拉加载更多）
    tableData.value = [...tableData.value, ...newData]

    // 判断是否还有更多数据（分页停止条件）
    const total = response.data.total || 0
    if (tableData.value.length >= total) {
      noMore.value = true // 全部加载完毕
    } else {
      currentPage.value++ // 页码加1，准备加载下一页
    }
  } catch (err) {
    console.error('请求公开作品失败', err)
    // 可以给用户一个轻提示
  } finally {
    loading.value = false
  }
}
// 滚动加载更多
const handleScroll =
  ((e: Event) => {
    const { scrollTop, scrollHeight, clientHeight } = e.target as HTMLElement
    if (scrollHeight - scrollTop - clientHeight < 50 && !loading.value && !noMore.value) {
      fetchMergedData()
    }
  },
  200)

onMounted(() => {
  fetchMergedData()
})
</script>

<style scoped>
.infinite-scroll-container {
  display: flex;
  margin-left: 5%; /* 调整左侧边距 */
  margin-top: 10px; /* 调整顶部边距 */
  flex-direction: column; /* 垂直排列 */
  height: 800px; /* 固定高度，产生滚动条 */
  width: 76%; /* 固定宽度 */
  overflow-y: auto; /* 只允许垂直滚动 */
  border: 3px solid rgb(234, 175, 108);
  margin-right: 100px;
}
.infinite-list-item {
  display: flex;
  gap: 10px; /* 图片与文本的间距 */
  height: 145px;
  border-bottom: 3px solid rgb(174, 174, 174); /* 分割线 */
  margin-right: 0px; /* 调整右侧边距 */
  margin-left: 0px; /* 调整左侧边距 */
  padding: 5px 0px 0px 10px; /* 上右下左 */
}
.infinite-list-item h4 {
  margin: 0;
  height: 20px;
  margin-left: 260px; /* 调整标题与内容的间距 */
  font-size: 16px;
  font-weight: bold;
  white-space: pre-wrap; /* 保持文本换行 */
}
.infinite-list-item p {
  margin: 0;
  padding: 5px;
  width: 520px; /* 固定宽度，保持内容区域一致 */
  height: 120px;
  margin-right: 20px; /* 调整右侧边距 */
  font-size: 14px;
  line-height: 1.2;
  color: #1f1e1e;
}
.h5 {
  background-color: transparent !important;
  border: none !important;
  box-shadow: none !important;
  padding: 0; /* 去除默认内边距，让内容紧贴 */
}
h5 {
  width: 100%;
  margin-bottom: 85px; /*调整用户名的与下方的高度*/
  margin-left: auto; /* 将按钮推到列表项的右侧 */
  margin-right: -650px; /* 调整按钮与列表项右侧的距离 */
}
.item-image {
  width: 150px;
  height: 130px;
  object-fit: cover; /* 保持图片的宽高比 */
  margin-top: 8px; /* 调整图片与列表项顶部的距离 */
  border-radius: 4px; /* 添加圆角 */
}
.no-more {
  text-align: center;
  font-size: 12px; /* 调整字体大小 */
  color: #999;
  padding: 8px;
}
.icon {
  display: flex;
  margin-top: auto; /* 将图标推到列表项的底部 */
}
.icon-wrapp {
  margin-right: 20px; /* 调整评论图标与点赞图标的间距 */
}
</style>
