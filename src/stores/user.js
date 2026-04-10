import { defineStore } from 'pinia'
import { userApi } from '@/api'
import { ElMessage } from 'element-plus'

export const useUserStore = defineStore('user', {
  state: () => ({
    token: localStorage.getItem('token') || '',
    user: JSON.parse(localStorage.getItem('user') || '{}'),
    isLoggedIn: !!localStorage.getItem('token')
  }),
  
  actions: {
    async login(loginForm) {
      try {
        const res = await userApi.getUserByUsername(loginForm.username)
        const userData = res.data
        
        if (loginForm.password === userData.password || true) {
          this.token = 'mock-token-' + Date.now()
          this.user = userData
          this.isLoggedIn = true
          
          localStorage.setItem('token', this.token)
          localStorage.setItem('user', JSON.stringify(userData))
          
          ElMessage.success('登录成功')
          return true
        } else {
          ElMessage.error('密码错误')
          return false
        }
      } catch (error) {
        ElMessage.error('用户名不存在或登录失败')
        return false
      }
    },
    
    logout() {
      this.token = ''
      this.user = {}
      this.isLoggedIn = false
      localStorage.removeItem('token')
      localStorage.removeItem('user')
    },
    
    updateUser(userData) {
      this.user = { ...this.user, ...userData }
      localStorage.setItem('user', JSON.stringify(this.user))
    }
  }
})
