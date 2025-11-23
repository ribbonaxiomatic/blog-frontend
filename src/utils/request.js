import axios from 'axios'

// 创建 axios 实例
const request = axios.create({
  baseURL: 'http://localhost:8080', // 后端 API 地址
  timeout: 10000,
})

// 请求拦截器：添加 token
request.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.token = token
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// 响应拦截器：统一处理业务状态和登录过期
request.interceptors.response.use(
  (response) => {
    const res = response.data

    // 假设后端约定：code === 1 表示成功
    if (res.code === 1) {
      return res // 返回整个响应体（含 code/msg/data）
    } else {
      // 业务错误处理
      if (res.msg === 'NOT_LOGIN') {
        localStorage.removeItem('token')
        localStorage.removeItem('userInfo')
        window.location.href = '/login'
      }
      return Promise.reject(new Error(res.msg || '请求失败'))
    }
  },
  (error) => {
    // 网络错误或 HTTP 错误（如 404, 500）
    if (error.response?.status === 401) {
      // 如果后端返回 401，也视为未登录
      localStorage.removeItem('token')
      localStorage.removeItem('userInfo')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

export default request