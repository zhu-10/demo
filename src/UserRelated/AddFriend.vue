<template>
  <!-- 好友申请列表 -->
  <el-dialog v-model="visible" width="700px" @close="handleClose">
    <div v-loading="loading" element-loading-text="加载中...">
      <el-table :data="friendList" style="width: 100%" v-if="friendList.length">
        <el-table-column prop="friendName" label="用户名" />
        <el-table-column label="操作" width="120">
          <template #default="{ row }">
            <el-button size="small" type="primary" @click="sendMessage(row)">添加</el-button>
            <el-button
              size="small"
              style="margin-right: -60px"
              type="danger"
              @click="deleteFriend(row)"
              >删除</el-button
            >
          </template>
        </el-table-column>
      </el-table>
      <el-empty v-else description="暂无好友申请" />
    </div>
    <template #footer> </template>
  </el-dialog>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { ElMessage } from 'element-plus'
import request from '../api/axios'

const props = defineProps(['modelValue'])
const emit = defineEmits(['update:modelValue'])

const visible = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val),
})

// 定义响应式数据
const loading = ref(false)
const friendList = ref([])

// 方法
const handleClose = () => {
  visible.value = false
}
const handleCancel = () => {
  visible.value = false
}
const handleConfirm = () => {
  // 业务逻辑
  visible.value = false
}

// 获取好友申请待添加列表的函数（可以在这里实现）
const fetchFriendList = async () => {
  loading.value = true
  try {
    const token = localStorage.getItem('access_token')
    if (!token) {
      ElMessage.error('请先登录')
      return
    }
    const response = await request.get('/shu/friendship/', {
      headers: { Authorization: `Bearer ${token}` },
    })
    const resData = response.data
    friendList.value = Array.isArray(resData) ? resData : (resData.data || [])  // 期望返回 [{id, friendName}, ...]
  } catch (error) {
    console.error('获取好友申请失败:', error)
    ElMessage.error('加载失败')
  } finally {
    loading.value = false
  }
}

//删除好友申请(拒绝添加好友)
const deleteFriend = async (row) => {
  try {
    const token = localStorage.getItem('access_token')
    if (!token) {
      ElMessage.error('请先登录')
      return
    }
    await request.delete(`/shu/refuse/${row.id}/`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    ElMessage.success(`已删除 ${row.friendName} 的申请`)
    // 刷新列表
    await fetchFriendList()
  } catch (error) {
    console.error('删除申请失败:', error)
    ElMessage.error(error.response?.data?.detail || '操作失败')
  }
}
// 同意添加好友
const sendMessage = async (row) => {
  try {
    const token = localStorage.getItem('access_token')
    if (!token) {
      ElMessage.error('请先登录')
      return
    }
    const requestId = row.id
    if (!requestId) {
      ElMessage.error('申请记录 ID 不存在')
      return
    }
    await request.post(
      `/shu/handle/${row.id}/`,
      { action: 'accept' },

      {
        headers: { Authorization: `Bearer ${token}` },
      },
    )
    ElMessage.success(`已同意 ${row.friendName} 的申请`)
    // 刷新列表
    await fetchFriendList()
  } catch (error) {
    console.error('同意申请失败:', error)
    ElMessage.error(error.response?.data?.detail || '操作失败')
  }
}

// 监听对话框打开，加载数据
watch(
  visible,
  (newVal) => {
    if (newVal) fetchFriendList()
  },
  { immediate: true },
)
</script>
