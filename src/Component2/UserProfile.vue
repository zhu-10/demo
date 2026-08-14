<template>
  <!-- 用户详情弹出框页面 -->
  <div class="user-prof">
    <div v-loading="loading" element-loading-text="加载中...">
      <el-form
        ref="formRef"
        :model="userInfo"
        :rules="rules"
        label-width="80px"
        style="max-width: 800px"
      >
        <el-descriptions title="用户信息" direction="vertical" :column="4" :size="size" border>
          <!-- 用户名：可切换编辑 -->
          <el-descriptions-item label="用户名">
            <div class="username-wrapper">
              <span v-if="!isEditing" class="username-display">
                {{ userInfo.username || '未设置' }}
              </span>
              <el-form-item v-else prop="username" style="margin-bottom: 0; flex: 1">
                <el-input
                  ref="usernameInputRef"
                  v-model="userInfo.username"
                  style="width: 200px"
                  placeholder="请输入用户名"
                  size="small"
                  @keyup.enter="confirmEdit"
                />
              </el-form-item>
            </div>
          </el-descriptions-item>

          <!-- 性别 -->
          <el-descriptions-item label="性别">
            <el-form-item prop="gender">
              <el-select
                v-model="userInfo.gender"
                placeholder="男/女"
                style="width: 200px; margin-right: -40px"
              >
                <el-option
                  v-for="item in genderOptions"
                  :key="item.value"
                  :label="item.label"
                  :value="item.value"
                />
              </el-select>
            </el-form-item>
          </el-descriptions-item>

          <!-- 电话 -->
          <el-descriptions-item label="电话">
            <el-form-item prop="phone">
              <el-input v-model="userInfo.phone" style="width: 240px" placeholder="请输入电话" />
            </el-form-item>
          </el-descriptions-item>

          <!-- 城市 -->
          <el-descriptions-item label="城市" :span="2">
            <el-form-item prop="city">
              <el-input v-model="userInfo.city" style="width: 240px" placeholder="请输入城市" />
            </el-form-item>
          </el-descriptions-item>

          <!-- 备注 -->
          <el-descriptions-item label="邮箱">
            <el-form-item prop="email">
              <el-input v-model="userInfo.email" style="width: 240px" placeholder="请输入邮箱" />
            </el-form-item>
          </el-descriptions-item>

          <!-- 备注 -->
          <el-descriptions-item label="备注">
            <el-form-item prop="remark">
              <el-input v-model="userInfo.remark" style="width: 240px" placeholder="请输入备注" />
            </el-form-item>
          </el-descriptions-item>

          <!-- 简介 -->
          <el-descriptions-item label="简介" :span="4">
            <el-form-item prop="signature">
              <el-input
                v-model="userInfo.signature"
                type="textarea"
                :rows="3"
                placeholder="请输入简介"
                style="width: 100%"
              />
            </el-form-item>
          </el-descriptions-item>
        </el-descriptions>

        <!-- 操作按钮 -->
        <div style="margin-top: 20px; text-align: right">
          <el-button type="primary" :loading="saving" @click="handleSave"> 保存修改 </el-button>
          <el-button @click="resetForm">重置</el-button
          ><el-button
            type="text"
            :icon="isEditing ? 'Check' : 'Edit'"
            @click="toggleEdit"
            style="margin-left: 20px; margin-right: -30px"
          >
            {{ isEditing ? '确认' : '修改' }}
          </el-button>
        </div>
      </el-form>
    </div>
  </div>
</template>
<script setup lang="ts">
import { ref, reactive, onMounted, nextTick, computed, watch } from 'vue'
import axios from 'axios'
import { ElMessage } from 'element-plus'
import type { FormInstance, FormRules } from 'element-plus'

// ---------- 类型 ----------
interface UserInfo {
  username: string
  phone: string
  city: string
  remark: string
  signature: string
}

const genderOptions = ref([
  { label: '男', value: 'male' },
  { label: '女', value: 'female' },
])

// ---------- 响应式 ----------
const size = ref<'default' | 'large' | 'small'>('default')
const props = defineProps<{
  userId?: number | string // 传入则查看他人，不传则查看自己
}>()
const canEdit = computed(() => !props.userId) // 只有查看自己时可编辑
const loading = ref(false)
const saving = ref(false)
const formRef = ref<FormInstance>()
const usernameInputRef = ref<any>()
const userInfo = reactive<UserInfo>({
  username: '',
  gender: '',
  phone: '',
  city: '',
  remark: '',
  email: '',
  signature: '',
})

interface UserInfo {
  username: string
  gender: string
  phone: string
  city: string
  remark: string
  email: string
  signature: string
}
const isEditing = ref(false) // 用户名编辑状态

// ---------- 校验规则 ----------
const rules = reactive<FormRules<UserInfo>>({
  username: [
    { required: true, message: '用户名不能为空', trigger: 'blur' },
    { min: 2, max: 20, message: '长度在 2 到 20 个字符', trigger: 'blur' },
  ],
  phone: [{ pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号', trigger: 'blur' }],
})

const fetchUsername = async () => {
  console.log('fetchUsername 被调用,userId:', props.userId)
  const token = localStorage.getItem('access_token')
  if (!token) {
    console.warn('未登录，请先登录')
    return
  }
  try {
    const url = props.userId ? `/shu/users/${props.userId}/` : '/shu/users/me/'
    console.log('请求 URL:', url)
    const res = await axios.get(url, {
      headers: { Authorization: `Bearer ${token}` },
    })
    Object.assign(userInfo, res.data)
    console.log('赋值后 userInfo:', userInfo)
  } catch (error) {
    console.error('获取用户信息失败', error)
    ElMessage.error('获取用户信息失败')
  }
}

// ---------- 切换编辑状态 ----------
const toggleEdit = async () => {
  if (isEditing.value) {
    // 点击“确认”：可在此处做即时校验，或仅退出编辑
    // 我们选择退出编辑，保留当前输入
    isEditing.value = false
  } else {
    // 进入编辑
    isEditing.value = true
    // 等待 DOM 更新后聚焦输入框
    await nextTick()
    usernameInputRef.value?.focus?.()
  }
}

// 确认编辑（按回车键触发）
const confirmEdit = () => {
  if (isEditing.value) {
    // 可以触发校验，但为了不打断用户，仅退出
    isEditing.value = false
  }
}

// ---------- 保存修改 ----------
const handleSave = async () => {
  if (!formRef.value) return

  // 如果处于编辑状态，先退出（但保留内容）
  if (isEditing.value) {
    isEditing.value = false
  }

  // 表单校验
  await formRef.value.validate((valid) => {
    if (!valid) {
      ElMessage.warning('请检查表单输入')
      return
    }
  })

  const token = localStorage.getItem('access_token')
  if (!token) {
    ElMessage.error('请先登录')
    return
  }

  saving.value = true
  try {
    await axios.put('/shu/update_user/update_user/', userInfo, {
      headers: { Authorization: `Bearer ${token}` },
    })
    ElMessage.success('保存成功')
  } catch (error: any) {
    console.error('保存失败', error)
    ElMessage.error(error.response?.data?.message || '保存失败，请重试')
  } finally {
    saving.value = false
  }
}

// ---------- 重置 ----------
onMounted(() => {
  fetchUsername()
})
// 监听 userId 变化，重新获取数据
watch(
  () => props.userId,
  () => {
    fetchUsername()
  },
  { immediate: true },
)
// ---------- 生命周期 ----------
// onMounted(
//   () => props.userId,
//   () => {
//     fetchUsername()
//   },
//   { immediate: true },
// )
</script>

<style scoped>
.user-prof {
  padding: 20px;
}
:deep(.el-descriptions__body .el-descriptions__table .el-descriptions__cell) {
  padding: 12px 16px;
}

.el-descriptions {
  margin-top: 20px;
}
.user-prof {
  font-size: 14px;
  width: 200px;
  margin-left: 30px;
}
</style>
