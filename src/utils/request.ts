import axios, { AxiosError } from 'axios'
import type { InternalAxiosRequestConfig } from 'axios'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useUserStore } from '@/stores/user'
import router from '@/router'

export interface ApiResponse<T = unknown> {
  code: number
  msg: string
  data: T
}

const request = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL as string | undefined,
  timeout: 30000
})

request.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error: Error) => {
    return Promise.reject(error)
  }
)

request.interceptors.response.use(
  (response) => {
    const res = response.data
    // 文件下载类请求（blob）直接返回，不做 JSON 解析
    if (res instanceof Blob) {
      return res
    }
    if (res.code !== 200) {
      console.error('[API Error]', { code: res.code, msg: res.msg })
      ElMessage.error(res.msg || '请求失败')
      return Promise.reject(new Error(res.msg || '请求失败'))
    }
    return res
  },
  (error: Error) => {
    const axiosError = error as AxiosError<ApiResponse>
    console.error('[HTTP Error]', { status: axiosError.response?.status, data: axiosError.response?.data })
    if (axiosError.response) {
      const { status, data } = axiosError.response
      switch (status) {
        case 401:
          ElMessageBox.confirm('登录已过期，请重新登录', '提示', {
            confirmButtonText: '重新登录',
            cancelButtonText: '取消',
            type: 'warning'
          }).then(() => {
            localStorage.removeItem('token')
            localStorage.removeItem('user')
            router.push('/login')
          })
          break
        case 403:
          ElMessage.error(data?.msg || '没有权限')
          break
        case 404:
          ElMessage.error(data?.msg || '资源不存在')
          break
        case 500:
          ElMessage.error(data?.msg || '服务器错误')
          break
        default:
          ElMessage.error(data?.msg || '请求失败')
      }
    } else {
      ElMessage.error('网络错误，请检查网络连接')
    }
    return Promise.reject(error)
  }
)

export default request
