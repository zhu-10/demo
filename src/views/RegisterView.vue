<template>
  <div class="register-container">
    <div class="register-form">
      <h2 class="register-title">用户注册</h2>
      <el-form
        ref="registerFormRef"
        :model="registerForm"
        :rules="rules"
        label-width="0px"
        class="demo-ruleForm"
      >
        <el-form-item prop="username">
          <el-input
            v-model="registerForm.username"
            type="username"
            placeholder="请输入用户名"
            prefix-icon="User"
            size="large"
          />
        </el-form-item>
        <el-form-item prop="password">
          <el-input
            v-model="registerForm.password"
            type="password"
            placeholder="输入密码"
            prefix-icon="Lock"
            size="large"
            show-password
          />
        </el-form-item>
        <el-form-item prop="captcha">
          <el-input
            v-model="registerForm.captcha"
            type="captcha"
            placeholder="请输入验证码"
            prefix-icon="Bell"
            size="large"
          />
        </el-form-item>

        <el-form-item>
          <el-button
            type="primary"
            size="large"
            class="register-btn"
            :loading="loading"
            @click="handleRegister"
          >
            注册
          </el-button>
        </el-form-item>
        <el-form-item>
          <el-link @click="$router.push('/1')">已有账号？去登录</el-link>
        </el-form-item>
      </el-form>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { register } from '../api/auth'

const router = useRouter()
const loading = ref(false)

// 注册表单数据
const registerForm = ref({
  username: '',
  password: '',
  captcha: '',
})

// 表单验证规则
const rules = {
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
    { min: 1, max: 20, message: '用户名长度在 1 到 20 个字符', trigger: 'blur' },
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, max: 8, message: '密码长度在 6 到 8 个字符', trigger: 'blur' },
  ],
  captcha: [
    { required: true, message: '请输入验证码', trigger: 'blur' },
    { min: 6, max: 6, message: '验证码长度必须为6位', trigger: 'blur' },
  ],
}

// 处理注册
const registerFormRef = ref(null)
const handleRegister = async () => {

  // 验证表单
  if (!registerFormRef.value) return
  try {
    await registerFormRef.value.validate()
  } catch {
    return
  }

  loading.value = true
  console.log('表单数据:', registerForm.value) // 验证表单
  try {
    const data = await register({
      username: registerForm.value.username,
      password: registerForm.value.password,
      captcha: registerForm.value.captcha,
    })
    localStorage.setItem('access_token', data.access)
    localStorage.setItem('refresh_token', data.refresh)
    ElMessage.success('注册成功')
    router.push('/1')
  } catch (err) {
    ElMessage.error(err.response?.data?.message || '注册失败')
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.register-container {
  display: flex;
  justify-content: center; /* 水平居中 */
  align-items: center; /* 垂直居中 */
  height: 1020px;
  width: 1873px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.register-form {
  background: white;
  padding: 40px;
  border-radius: 10px;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
  width: 380px;
}

.register-title {
  text-align: center;
  margin-bottom: 30px;
  color: #333;
  font-weight: 600;
}

.register-btn {
  width: 100%;
}

.demo-ruleForm {
  margin: 0;
}
</style>
