<template>
  <!-- 删除功能组件 -->
  <div class="data-list-container">
    <!-- 操作栏 -->
    <div class="batch-delete-bar">
      <el-checkbox
        :model-value="isAllSelected"
        :indeterminate="isIndeterminate"
        @change="handleSelectAll"
      >
        全选
      </el-checkbox>

      <el-button
        type="danger"
        size="small"
        :disabled="selectedIds.length === 0"
        @click="handleBatchDelete"
      >
        <el-icon class="icon"><Delete /></el-icon>
        删除选中 ({{ selectedIds.length }})
      </el-button>
    </div>

    <!-- 列表（支持无限滚动） -->
    <div class="infinite-scroll-container" ref="scrollRef" @scroll="handleScroll">
      <div v-for="item in tableData" :key="item.id" class="infinite-list-item">
        <el-checkbox
          class="item-checkbox"
          :model-value="selectedIds.includes(item.id)"
          @change="(val) => toggleSelect(item.id, val)"
        />
        <img v-if="item.image" :src="item.image" alt="图片" class="item-image" />
        <div>
          <h4>{{ item.theme || '默认主题' }}</h4>
          <p>{{ item.content || '暂无内容' }}</p>
          <h5>{{ item.username }}</h5>
        </div>
        <LikeButton />
      </div>
      <div v-if="loading" class="loading">加载中...</div>
      <div v-if="!hasMore && tableData.length === 0" class="no-more">去发布你第一条内容吧</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Delete } from '@element-plus/icons-vue'
import LikeButton from './LikeButton.vue'
import request from '../api/axios'

interface DataItem {
  id?: string
  image?: string
  theme?: string
  image?: string
  content?: string
  username?: string
}

// ---- 数据状态 ----
const tableData = ref<DataItem[]>([])
const selectedIds = ref<string[]>([]) // ✅ 使用本地 ref，不再通过 props
const currentPage = ref(1)
const hasMore = ref(true)
const loading = ref(false)
const scrollRef = ref<HTMLElement | null>(null) // ✅ 使用 ref 获取 DOM 元素

// ---- 全选相关计算属性 ----
const isAllSelected = computed(() => {
  return tableData.value.length > 0 && selectedIds.value.length === tableData.value.length
})
const isIndeterminate = computed(() => {
  const len = selectedIds.value.length
  return len > 0 && len < tableData.value.length
})

// ---- 获取列表数据 ----
const fetchList = async (page: number = 1, append: boolean = false) => {
  if (loading.value) return
  loading.value = true
  try {
    const token = localStorage.getItem('access_token')
    const response = await request.get('/shu/daily/', {
      params: { page, page_size: 20 },
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    })
    const rawData = response.data.results || response.data
    const newData = rawData
      .filter((item) => item.id != null)
      .map((item) => ({ ...item, id: Number(item.id) }))
      .filter((item) => !isNaN(item.id) && item.id > 0)
    if (newData.length !== rawData.length) {
      console.warn(`过滤掉了 ${rawData.length - newData.length} 条缺少有效 id 的数据`)
    }
    if (append) {
      tableData.value.push(...newData)
    } else {
      tableData.value = newData
      selectedIds.value = [] // 刷新时清空选中
    }
    hasMore.value = newData.length > 0 && !!response.data.next
    currentPage.value = page
  } catch (error) {
    ElMessage.error('加载失败')
    console.error(error)
  } finally {
    loading.value = false
  }
}

// ---- 滚动加载更多 ----
const handleScroll = (e: Event) => {
  const target = e.target as HTMLElement
  const { scrollTop, scrollHeight, clientHeight } = target
  if (scrollHeight - scrollTop - clientHeight < 50 && !loading.value && hasMore.value) {
    fetchList(currentPage.value + 1, true)
  }
}

// ---- 单个勾选/取消 ----
const toggleSelect = (id: number, val: boolean) => {
  console.log('toggleSelect', id, val, '当前 selectedIds:', selectedIds.value)
  if (val) {
    if (!selectedIds.value.includes(id)) {
      selectedIds.value.push(id)
    }
  } else {
    selectedIds.value = selectedIds.value.filter((i) => i !== id)
  }
}

// ---- 全选/取消全选 ----
const handleSelectAll = (val: boolean) => {
  if (val) {
    const allIds = tableData.value
      .map((item) => item.id)
      // 兼容数字和字符串 ID
      .filter((id) => id != null && id !== '')
    selectedIds.value = allIds
  } else {
    selectedIds.value = []
  }
}

// ---- 删除单条 API ----
const deleteDaily = async (id: number) => {
  if (!Number.isInteger(id) || id <= 0) throw new Error('无效 ID')
  const token = localStorage.getItem('access_token')
  await request.delete(`/shu/daily/${id}/`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  })
}

// ---- 批量删除 ----
const handleBatchDelete = async () => {
  if (selectedIds.value.length === 0) return

  try {
    await ElMessageBox.confirm(
      `确定删除选中的 ${selectedIds.value.length} 条数据吗？`,
      '批量删除',
      { type: 'warning' },
    )

    const promises = selectedIds.value.map((id) => deleteDaily(id))
    const results = await Promise.allSettled(promises)
    const failed = results.filter((r) => r.status === 'rejected')
    if (failed.length > 0) {
      ElMessage.warning(
        `成功删除 ${selectedIds.value.length - failed.length} 条，失败 ${failed.length} 条`,
      )
    } else {
      ElMessage.success(`成功删除 ${selectedIds.value.length} 条数据`)
    }

    // 刷新列表
    await fetchList(1, false)
  } catch (error) {
    if (error === 'cancel') return
    ElMessage.error('删除失败')
    console.error(error)
  }
}

// ---- 初始化 ----
onMounted(() => {
  fetchList(1, false)
})
</script>

<style scoped>
.data-list-container {
  margin-right: 100px;
  width: 70%;

  display: flex;
  flex-direction: column;
  justify-content: center; /*水平居中 */
}
.batch-delete-bar {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 0;
  margin-left: 5%;

  /*border-bottom: 1px solid #e4e7ed;  底部边框 */
}
.infinite-scroll-container {
  display: flex;
  margin-left: 5%; /* 调整左侧边距 */
  flex-direction: column; /* 垂直排列 */
  height: 570px; /* 固定高度，产生滚动条 */
  width: 900px;
  overflow-y: auto; /* 只允许垂直滚动 */
  border: 3px solid rgb(234, 175, 108);
  margin-right: 10px;
}
.infinite-list-item {
  display: flex;
  gap: 5px; /* 图片与文本的间距 */
  height: 145px;
  border-bottom: 3px solid rgb(174, 174, 174); /* 分割线 */
  margin-right: 0px; /* 调整右侧边距 */
  margin-left: 0px; /* 调整左侧边距 */
  padding: 5px 0px 0px 10px; /* 上下左右 */
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
.infinite-list-item h5 {
  width: 30px;
  margin-top: -29px;
  margin-left: auto;
  margin-right: -110px;
}
.item-image {
  width: 150px;
  height: 135px;
  object-fit: cover; /* 保持图片的宽高比 */
  margin-top: 3px;
  border-radius: 4px; /* 添加圆角 */
  margin-left: 10px;
}
.loading,
.no-more {
  text-align: center;
  padding: 16px;
  color: #999;
}
.delete-icon {
  cursor: pointer;
  color: #f56c6c;
}
</style>
