<template>
  <!-- 内容区域 -->
  <div class="search-content">
    <!-- 返回按钮 -->
    <el-button class="button" type="success" @click="goBack">返回</el-button>
    <!-- 有结果时 -->

    <div class="infinite-scroll-container" ref="scrollRef" @scroll="handleScroll">
      <div v-for="item in list" :key="item.id" class="infinite-list-item">
        <img
          v-if="item.image"
          :src="item.image"
          alt="图片"
          preview-src-list="[item.image]"
          z-index="4"
          class="item-image"
        />

        <div>
          <h4>{{ item.theme || '默认主题' }}</h4>
          <p>{{ item.content || '暂无内容' }}</p>

          <h5>{{ item.username || '暂无信息' }}</h5>
        </div>
        <like-button />
      </div>

      <!-- 底部状态提示 -->
      <div v-if="loading" class="loading-tip">加载中...</div>
      <div v-else-if="noMore" class="loading-tip">— 没有更多了 —</div>

      <!-- 无结果时 -->
      <el-empty
        v-if="!loading && list?.length === 0 && keyword"
        :image-size="200"
        description="未找到相关内容"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, watch, computed, onMounted } from 'vue'
const list = ref([]) // 搜索结果列表
import { useRoute } from 'vue-router'
import { useRouter } from 'vue-router'
import axios from 'axios'
import { ElMessage } from 'element-plus'
import LikeButton from '../Component2/LikeButton.vue'

const route = useRoute()
const router = useRouter()

const keyword = ref('')

const page = ref(1)
const loading = ref(false) // 是否正在加载
const noMore = ref(false) // 是否没有更多数据了
// 返回按钮
const goBack = () => {
  // 判断是否有历史记录可回退
  if (window.history.length > 1) {
    router.back() // 或 router.go(-1)
  } else {
    // 无历史记录时，跳转到首页或指定路由
    router.push('MainPage')
  }
}

// ---------- 搜索请求函数 ----------
async function fetchData(kw, pageNum = 1, append = false) {
  loading.value = true
  console.log('实际请求路径:', `/shu/search/`, { keyword: kw, page: pageNum })

  try {
    const res = await axios.get('/shu/search/', {
      params: { keyword: kw, page: pageNum },
      headers: { Authorization: `Bearer ${localStorage.getItem('access_token')}` },
    })
    console.log('后端原始返回:', res.data)

    // ✅ 1. 剥离外层 Result 包装
    const payload = res.data.data !== undefined ? res.data.data : res.data

    // ✅ 2. 提取真正的数组和分页信息（兼容数组或分页对象）
    let records = []
    let hasMore = false

    if (Array.isArray(payload)) {
      // 情况 A：后端直接返回纯数组
      records = payload
      hasMore = false // 一次性返回，没有下一页
    } else if (payload && (payload.records || payload.results)) {
      // 情况 B：标准分页对象（适配你的后端 records，也兼容常见的 results）
      const arr = payload.records || payload.results || []
      records = arr

      // 判断是否还有下一页：你的后端没返回 next，可以通过 total 判断
      // 这里简单通过当前长度和总数对比，或者保留你原本的 data.next 逻辑
      const total = payload.total || 0
      const currentTotal = append ? (list.value?.length || 0) + arr.length : arr.length
      hasMore = currentTotal < total
    }

    // ✅ 3. 赋值给 list，必须保证 list.value 永远是数组
    if (append) {
      list.value = [...(list.value || []), ...records]
    } else {
      list.value = records
    }

    noMore.value = !hasMore

  } catch (err) {
    console.error('搜索请求出错:', err)
    ElMessage.error('搜索失败')
    // ✅ 4. 出错时也要兜底，防止 list 变成 undefined
    if (!append) {
      list.value = []
    }
  } finally {
    loading.value = false
  }
}

// ---------- 加载更多（滚动触发） ----------
const disabled = computed(() => loading.value || noMore.value || list.value.length === 0)
function loadMore() {
  if (disabled.value) return
  page.value++
  fetchData(keyword.value, page.value, true)
}

// ---------- 监听 URL query 变化，执行搜索 ----------
watch(
  () => route.query.q,
  (newKw) => {
    const kw = (newKw || '').trim()
    if (kw) {
      keyword.value = kw
      page.value = 1
      fetchData(kw, 1, false)
    } else {
      keyword.value = ''
      list.value = []
      noMore.value = false
    }
  },
  { immediate: true }, // 页面加载时立刻检查 query 并搜索
)
</script>
<style scoped>
.search-content {
  display: flex;
  background: #d2d1d1;
  width: 99vw;
  height: 98vh;
  justify-content: center;
}
.button {
  height: 30px;
  margin-top: 10px;
}
.infinite-scroll-container {
  display: flex;
  margin-left: 5%; /* 调整左侧边距 */
  margin-top: 10px; /* 调整顶部边距 */
  flex-direction: column; /* 垂直排列 */
  height: 890px; /* 固定高度，产生滚动条 */
  width: 60%;
  overflow-y: auto; /* 只允许垂直滚动 */
  border: 3px solid rgb(234, 175, 108);
  margin-right: 10px;
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
  text-align: center; /* 居中显示 */
  height: 20px;
  margin-left: 260px; /* 调整标题与内容的间距 */
  font-size: 16px;
  font-weight: bold;
  white-space: pre-wrap; /* 保持文本换行 */
}
.infinite-list-item p {
  margin: 0;
  margin-left: 20px;
  width: 520px; /* 固定宽度，保持内容区域一致 */
  height: 120px;
  margin-right: 20px; /* 调整右侧边距 */
  font-size: 14px;
  line-height: 1.2;
  color: #1f1e1e;
}
.infinite-list-item h5 {
  width: 60px;
  margin-top: -17px;
  margin-left: auto;
  margin-right: -150px;
}
.item-image {
  width: 150px;
  height: 130px;
  object-fit: cover; /* 保持图片的宽高比 */
  margin-top: 8px;
  border-radius: 4px; /* 添加圆角边框 */
  margin-left: 10px;
}
.loading-tip {
  text-align: center; /* 居中显示 */
  margin-top: 20px;
  font-size: 16px;
  color: #999;
}
</style>
