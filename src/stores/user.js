import { defineStore } from 'pinia'
import { authApi } from '@/api'
import { ElMessage } from 'element-plus'

export const useUserStore = defineStore('user', {
  state: () => ({
    token: localStorage.getItem('token') || '',
    user: JSON.parse(localStorage.getItem('user') || 'null'),
    isLoggedIn: !!localStorage.getItem('token')
  }),

  actions: {
    async login(loginForm) {
      try {
        const res = await authApi.login({ account: loginForm.username, password: loginForm.password })
        this.token = res.data.token
        this.user = res.data.user
        this.isLoggedIn = true
        localStorage.setItem('token', this.token)
        localStorage.setItem('user', JSON.stringify(this.user))
        ElMessage.success('登录成功')
        return true
      } catch (error) {
        return false
      }
    },

    async register(registerForm) {
      try {
        const res = await authApi.register({
          username: registerForm.username,
          email: registerForm.email,
          nickname: registerForm.nickname || registerForm.username,
          password: registerForm.password
        })
        this.token = res.data.token
        this.user = res.data.user
        this.isLoggedIn = true
        localStorage.setItem('token', this.token)
        localStorage.setItem('user', JSON.stringify(this.user))
        ElMessage.success('注册成功')
        return true
      } catch (error) {
        return false
      }
    },

    async fetchUser() {
      try {
        const res = await authApi.getMe()
        this.user = res.data
        this.isLoggedIn = true
        localStorage.setItem('user', JSON.stringify(this.user))
      } catch {
        this.logout()
      }
    },

    async initializeAuth() {
      const token = localStorage.getItem('token')
      if (token) {
        this.token = token
        await this.fetchUser()
      }
    },

    logout() {
      this.token = ''
      this.user = null
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
