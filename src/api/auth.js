import axios from './axios.js'

// 认证相关 API（使用后端 DRF + SimpleJWT）
// 在本项目中，token 路由位于 student.urls：/student/api/token/ 和 /student/api/token/refresh/
export function login(data) {
  // 获取 JWT（POST /xq/api/login/），返回 access 和 refresh
  return axios.post('/shu/login/', data)
}

export function register(data) {
  // 用户注册
  return axios.post('/shu/register/', data)
}

export function refresh(refresh) {
  // 刷新 access
  return axios.post('/shu/token/refresh/', { refresh })
}
export function updatePassword(data) {
  // 修改密码
  return axios.post('/shu/token/', data)
}

// 导出认证API对象
export default {
  login,
  register,
  refresh,
  updatePassword,
}
