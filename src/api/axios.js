import axios from 'axios'

const request = axios.create({
  baseURL: 'http://127.0.0.1:8000',
  timeout: 3000, //请求超时时间
  withCredentials: true,
})
// 请求拦截器：统一在请求头中加入 token
request.interceptors.request.use((config) => {
  if (config.url.includes('/shu/register')) {
        return config;  // 直接返回 config，不添加 Authorization
    }
  const token = localStorage.getItem('access_token') // 从localStorage获取 token

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
    console.log('✅ 最终 Authorization 头:', config.headers.Authorization);
  } // 设置Authorization头
  return config
})

// 响应拦截器：可统一处理错误或登出逻辑
request.interceptors.response.use(
  (response) => response, // 直接返回响应数据
  (error) => {
    if (error.response && error.response.status === 401) {
      // 如果是401错误，跳转到登录页
      localStorage.removeItem('access_token') // 清除token
      window.location.href = '1/' // 跳转到登录页
    }
    return Promise.reject(error) // 返回错误
  },
)

//适合大多数API请求，如果需要其他Content-Type可以在单个请求中覆盖这个设置
request.defaults.headers.post['Content-Type'] = 'application/json'

export default request
