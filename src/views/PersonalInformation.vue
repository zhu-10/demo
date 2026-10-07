<template>
  <!-- 个人用户详情页面 -->
  <div class="user-prof">
    <div v-loading="loading" element-loading-text="加载中...">
      <el-form
        ref="formRef"
        :model="userInfo"
        :rules="rules"
        label-width="50px"
        style="max-width: 200px"
      >
        <el-descriptions title="用户信息" direction="vertical" :column="2" :size="size" border>
          <!-- 用户名：可切换编辑 -->
          <el-descriptions-item label="用户名">
            <div class="username-wrapper">
              <span v-if="!isEditMode" class="username-display">
                {{ userInfo.username || '未设置' }}
              </span>
              <el-form-item
                v-else
                prop="username"
                style="width: 300px; height: 30px; margin-bottom: 0; flex: 1"
              >
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
            <!-- 非编辑模式：显示文本 -->
            <span v-if="!isEditMode">
              {{
                userInfo.gender === 'male' ? '男' : userInfo.gender === 'female' ? '女' : '未设置'
              }}
            </span>
            <!-- 编辑模式：显示下拉框 -->
            <el-form-item v-else prop="gender" style="width: 200px">
              <el-select
                v-model="userInfo.gender"
                placeholder="请选择性别"
                style="width: 200px; margin-right: 20px"
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
            <span v-if="!isEditMode">{{ userInfo.phone || '暂无' }}</span>
            <el-form-item v-else prop="phone" style="margin-bottom: 0">
              <el-input
                v-model="userInfo.phone"
                style="width: 200px; margin-right: 20px"
                placeholder="请输入电话"
              />
            </el-form-item>
          </el-descriptions-item>

          <!-- 城市 -->
          <el-descriptions-item label="城市" :span="2">
            <span v-if="!isEditMode">{{ userInfo.city || '暂无' }}</span>
            <el-form-item v-else prop="city" style="margin-bottom: 0">
              <el-input
                v-model="userInfo.city"
                style="width: 200px; margin-right: 20px"
                placeholder="请输入城市"
              />
            </el-form-item>
          </el-descriptions-item>

          <!-- 备注 -->
          <el-descriptions-item label="备注">
            <span v-if="!isEditMode">{{ userInfo.remark || '暂无' }}</span>
            <el-form-item v-else prop="remark" style="margin-bottom: 0">
              <el-input
                v-model="userInfo.remark"
                style="width: 200px; margin-right: 20px"
                placeholder="请输入备注"
              />
            </el-form-item>
          </el-descriptions-item>

          <!-- 邮箱 -->
          <el-descriptions-item label="邮箱">
            <span v-if="!isEditMode">{{ userInfo.email || '暂无' }}</span>
            <el-form-item v-else prop="email" style="margin-bottom: 0">
              <el-input
                v-model="userInfo.email"
                style="width: 200px; margin-right: 60px"
                placeholder="请输入邮箱"
              />
            </el-form-item>
          </el-descriptions-item>

          <!-- 简介 -->
          <el-descriptions-item label="简介" :span="4">
            <span v-if="!isEditMode">{{ userInfo.signature || '暂无' }}</span>
            <el-form-item v-else prop="signature">
              <el-input
                v-model="userInfo.signature"
                type="textarea"
                :rows="3"
                placeholder="请输入简介"
                style="width: 600px; margin-right: 20px; top: 10px"
              />
            </el-form-item>
          </el-descriptions-item>
        </el-descriptions>

        <!-- 操作按钮 -->
        <div style="margin-top: 30px; width: 200px; margin-right: 600px; text-align: right">
          <el-button type="primary" :loading="saving" @click="handleSave"> 保存修改 </el-button>
          <el-button @click="resetForm">重置</el-button
          ><el-button
            link
            :icon="isEditMode ? 'Check' : 'Edit'"
            @click="toggleEdit"
            style="margin-right: -40px"
          >
            {{ isEditMode ? '确认' : '修改' }}
          </el-button>
        </div>
      </el-form>
    </div>
  </div>
</template>
<script setup lang="ts">
import { ref, reactive, onMounted, nextTick } from 'vue'
import  request  from '../api/axios'
import { ElMessage } from 'element-plus'
import type { FormInstance, FormRules } from 'element-plus'

// ---------- 类型 ----------
interface UserInfo {
  username: string
  gender: string
  phone: string
  city: string
  remark: string
  email: string
  signature: string
}

const genderOptions = ref([
  { label: '男', value: 'male' },
  { label: '女', value: 'female' },
])

// ---------- 响应式 ----------
const size = ref<'default' | 'large' | 'small'>('default')
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

// ---------- 获取用户名 ----------
const fetchUsername = async () => {
  const token = localStorage.getItem('access_token') // 👈 添加这一行
  if (!token) {
    console.warn('未登录，请先登录')
    return // 或者跳转到登录页
  }
  try {
    const res = await request.get('/api/info/', { headers: { Authorization: `Bearer ${token}` } }) // 假设返回数据
    console.log('原始响应数据:', res.data)
    Object.assign(userInfo, res.data)
    // 关键：必须用 Object.assign 更新
    const userData = res.data[0] // 假设返回的数据是一个数组
    Object.assign(userInfo, userData)
    console.log('赋值后 userInfo:', userInfo) // 检查输出
  } catch (error) {
    console.error('获取用户信息失败', error)
  }
}
const isEditMode = ref(false) // 用户名编辑状态

// ---------- 校验规则 ----------
const rules = reactive<FormRules<UserInfo>>({
  username: [
    { required: true, message: '用户名不能为空', trigger: 'blur' },
    { min: 2, max: 20, message: '长度在 2 到 20 个字符', trigger: 'blur' },
  ],
  phone: [{ pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号', trigger: 'blur' }],
})

// ---------- 切换编辑状态 ----------
const toggleEdit = async () => {
  if (isEditMode.value) {
    // 点击“确认”：可在此处做即时校验，或仅退出编辑
    // 我们选择退出编辑，保留当前输入
    isEditMode.value = false
  } else {
    // 进入编辑
    isEditMode.value = true
    // 等待 DOM 更新后聚焦输入框
    await nextTick()
    usernameInputRef.value?.focus?.()
  }
}

// 确认编辑（按回车键触发）
const confirmEdit = () => {
  if (isEditMode.value) {
    // 可以触发校验，但为了不打断用户，仅退出
    isEditMode.value = false
  }
}

// ---------- 保存修改 ----------
const handleSave = async () => {
  if (!formRef.value) return

  // 如果处于编辑状态，先退出（但保留内容）
  if (isEditMode.value) {
    isEditMode.value = false
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
    await request.put('/api/user/', userInfo, {
      headers: { Authorization: `Bearer ${token}` },
    })
    ElMessage.success('保存成功')
  } catch (error: any) {
    console.log('原始用户名:', originalUsername.value)
    console.log('提交的用户名:', userInfo.username)
    console.error('保存失败', error)
    ElMessage.error(error.response?.data?.message || '保存失败，请重试')
  } finally {
    saving.value = false
  }
}

// ---------- 重置 ----------
const resetForm = () => {
  if (!formRef.value) return
  formRef.value.resetFields() // 清空所有字段（包括 username 会变为初始空）
  // 重新获取用户名覆盖
  fetchUsername()
  isEditMode.value = false
}

// ---------- 生命周期 ----------
onMounted(() => {
  fetchUsername()
})
</script>

<style scoped>
:deep(.el-descriptions__body .el-descriptions__table .el-descriptions__cell) {
  padding: 12px 130px;
}

.el-descriptions {
  margin-top: 20px;
}
.user-prof {
  font-size: 14px;
  margin-top: 130px;
  width: 60vw;
  margin-left: 340px;
}
</style>
