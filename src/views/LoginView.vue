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
import request from 'axios'
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
    const response = await request.post('/api/login/', {
      username: form.username,
      password: form.password,
    })
    console.log('完整响应:', response)
    console.log('响应数据:', response.data)

    // ⚠️ 注意：真正的数据在 response.data.data 里
    const resData = response.data.data
    if (!resData) {
        ElMessage.error('登录失败，后端未返回数据')
        return
    }

    // ========== 1. 提取并保存 Token ==========
    const token = resData.token
    if (!token) {
        ElMessage.error('登录异常：未获取到令牌')
        return // 没有 token 直接阻断执行
    }

    // 先清空旧缓存（防止 rooter238 脏数据残留），再存新的
    localStorage.removeItem('access_token')
    localStorage.removeItem('user_id')
    localStorage.setItem('access_token', token)
    console.log('新的Token已覆盖:', token)

    // ========== 2. 提取并保存 用户ID ==========
    // 从 resData 中取，而不是 response.data
    const userId = resData.id
    if (!userId) {
        ElMessage.error('登录异常：未获取到用户ID')
        return
    }
    localStorage.setItem('user_id', String(userId))
    console.log('用户ID已保存:', userId)

    // ========== 3. 登录成功，跳转 ==========
    ElMessage.success('登录成功')
    router.push('/')

  } catch (error) {
    console.error('登录失败:', error)
    if (error.response) {
      // 优先取后端返回的 msg，其次取 detail
      const errorMsg = error.response.data?.msg || error.response.data?.detail || '登录失败，请检查用户名和密码'
      ElMessage.error(errorMsg)
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
