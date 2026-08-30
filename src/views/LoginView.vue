-- Active: 1767526722355@@127.0.0.1@3306@demo
<template>
  <div class="login">
    <el-form ref="formRef" :rules="rules" :model="form" style="max-width: 600px">
      <h1 class="h1">登录</h1>
      <el-form-item prop="username">
        <el-input
          v-model="form.username"
          style="width: 240px"
          type="username"
          :prefix-icon="User"
          placeholder="账号："
        />
      </el-form-item>
      <el-form-item prop="password">
        <el-input
          v-model="form.password"
          style="width: 240px"
          type="password"
          :prefix-icon="Lock"
          placeholder="密码："
          show-password
        />
      </el-form-item>

      <el-form-item>
        <el-button type="primary" style="width: 240px" :loading="loading" @click="onSubmit"
          >登录</el-button
        >
      </el-form-item>

      <el-form-item>
        <el-link @click="$router.push('/2')">注册</el-link>
      </el-form-item>
    </el-form>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue' //引入图标
import { useStore } from 'vuex'
const store = useStore()
//导入element-plus的图标
import { User, Lock } from '@element-plus/icons-vue'
// 引入element-plus的消息提示组件
import { ElMessage } from 'element-plus'
//引入element-plus的表单组件
import { useRouter } from 'vue-router'
// 引入登录接口
import { login } from '../api/auth.js'
import axios from 'axios'
//路由实列
const router = useRouter()
const formRef = ref() // 表单引用，用于验证

const form = reactive({
  username: '',
  password: '',
})
//表单验证规则
const rules = {
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
    { min: 3, max: 20, message: '用户名长度在 3 到 20 个字符', trigger: 'blur' },
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, message: '密码长度不能少于6位', trigger: 'blur' },
  ],
}
const loading = ref(false) // 登录按钮加载状态

// 提交登录
const onSubmit = async () => {
  try {
    const response = await axios.post('/api/login/', {
      username: form.username,
      password: form.password,
    })
    console.log('完整响应:', response)
    console.log('响应数据:', response.data)

    // 提取 token（根据实际字段名调整）
    const token = response.data.data || response.data.token
    if (token) {
      localStorage.setItem('access_token', token)
      console.log('Token 已保存:', token)
    } else {
  ElMessage.error('登录返回数据异常，未包含 token')
  return
}

    // 提取用户 ID（根据实际结构调整）
  const userId = response.data.user?.id || response.data.id || response.data.user_id
    if (userId) {
      localStorage.setItem('user_id', String(userId))
      console.log('用户ID已保存:', userId)
    }

    // 登录成功提示
    ElMessage.success('登录成功')
    // 跳转到主页
    router.push('/')
  } catch (error) {
    console.error('登录失败:', error)
    if (error.response) {
      ElMessage.error(error.response.data?.detail || '登录失败，请检查用户名和密码')
    } else {
      ElMessage.error('网络错误，请稍后重试')
    }
  }
}
</script>

<style scoped>
.login {
  display: flex;
  height: 97vh;
  width: 99vw;
  background: linear-gradient(180deg, #667eea 0%, #764ba2 100%);
  justify-content: center; /*水平居中 */
  align-items: center; /*垂直居中 */
}
.el-form {
  background: white;
  width: 380px;
  padding: 30px;
  border-radius: 10px;
}
.el-form-item {
  margin-top: 20px; /*间距 */
  align-items: center; /*垂直居中 */
  margin-left: 60px; /*设置左边距 */
}
.h1 {
  text-align: center;
  margin-bottom: 30px;
  color: #333;
}
</style>
