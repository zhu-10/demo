<template>
  <div class="register-container">
    <div class="register-form">
      <h2 class="register-title">修改密码</h2>
      <el-form
        ref="registerFormRef"
        :model="registerForm"
        :rules="rules"
        label-width="0px"
        class="demo-ruleForm"
      >
        <el-form-item prop="password">
          <el-input
            v-model="registerForm.password"
            type="password"
            placeholder="新密码"
            :prefix-icon="Lock"
            size="large"
            show-password
          />
        </el-form-item>
        <el-form-item prop="password_confirm">
          <el-input
            v-model="registerForm.password_confirm"
            type="password"
            placeholder="请确认密码"
            :prefix-icon="Lock"
            size="large"
            show-password
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
            保存
          </el-button>
        </el-form-item>
        <el-form-item>
          <el-link @click="$router.push('/1')">去登录</el-link>
        </el-form-item>
      </el-form>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { User, Lock } from '@element-plus/icons-vue'
import { register } from '../api/auth'

const router = useRouter()
const registerFormRef = ref()
const loading = ref(false)

// 注册表单数据
const registerForm = reactive({
  password: '',
  password_confirm: '',
})

// 表单验证规则
const rules = {
  password: [
    { required: true, message: '请输入新密码', trigger: 'blur' },
    { min: 6, message: '密码长度不能少于6位', trigger: 'blur' },
  ],
  password_confirm: [
    { required: true, message: '请确认密码', trigger: 'blur' },
    {
      validator: (rule, value, callback) => {
        if (value !== registerForm.password) {
          callback(new Error('两次输入密码不一致'))
        } else {
          callback()
        }
      },
      trigger: 'blur',
    },
  ],
}

// 处理修改密码
const handleRegister = async () => {
  try {
    await registerFormRef.value.validate()
    loading.value = true
    const response = await register(registerForm)
    // 保存token到localStorage
    localStorage.setItem('access_token', response.access)
    localStorage.setItem('refresh_token', response.refresh)
    // 提示语
    ElMessage.success('修改密码成功')
    // 跳转到登录页面
    router.push('/1')
    //
  } catch (error) {
    console.error('修改密码失败:', error)
    ElMessage.error('修改密码失败，请检查输入信息')
  } finally {
    loading.value = false //无论成功失败都停止加载
  }
}
</script>

<style scoped>
.register-container {
  display: flex;
  justify-content: center;
  align-items: center;
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
