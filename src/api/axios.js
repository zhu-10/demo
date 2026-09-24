import axios from 'axios'

const request = axios.create({
  baseURL: 'http://127.0.0.1:8000',
  timeout: 3000,
  withCredentials: true,
})

// 请求拦截器：统一处理 token 和 Content-Type
request.interceptors.request.use(
  (config) => {
    // 1. 添加 token（注册接口除外）
    if (!config.url.includes('/shu/register')) {
      const token = localStorage.getItem('access_token')
      if (token) {
        config.headers.Authorization = `Bearer ${token}`

      }
    }

    // 2. 智能处理 Content-Type
    if (config.data instanceof FormData) {
      // 如果是 FormData（文件上传），删除 Content-Type，让浏览器自动生成带 boundary 的完整头
      delete config.headers['Content-Type']
    } else {
      // 非文件请求，如果没有指定 Content-Type，则默认 JSON
      if (!config.headers['Content-Type']) {
        config.headers['Content-Type'] = 'application/json'
      }
    }

    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// 响应拦截器：统一处理 401 等
request.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('access_token')
      window.location.href = '1/' // 跳转到登录页
    }
    return Promise.reject(error)
  }
)

export default request
