import { defineStore } from 'pinia'
import { authApi } from '@/api'
import { ElMessage } from 'element-plus'

export interface UserInfo {
  id: number
  username: string
  nickname: string
  email: string
  avatarUrl: string
  displayName?: string
  bio?: string
  [key: string]: unknown
}

interface LoginResult {
  token: string
  user: UserInfo
}

interface RegisterResult {
  token: string
  user: UserInfo
}

interface LoginForm {
  username: string
  password: string
}

interface RegisterForm {
  username: string
  email: string
  nickname: string
  password: string
}

interface UserState {
  token: string
  user: UserInfo | null
  isLoggedIn: boolean
}

export const useUserStore = defineStore('user', {
  state: (): UserState => ({
    token: localStorage.getItem('token') || '',
    user: JSON.parse(localStorage.getItem('user') || 'null'),
    isLoggedIn: !!localStorage.getItem('token')
  }),

  actions: {
    async login(loginForm: LoginForm) {
      try {
        const res = await authApi.login({ account: loginForm.username, password: loginForm.password })
        this.token = (res.data as LoginResult).token
        this.user = (res.data as LoginResult).user
        this.isLoggedIn = true
        localStorage.setItem('token', this.token)
        localStorage.setItem('user', JSON.stringify(this.user))
        ElMessage.success('登录成功')
        return true
      } catch {
        return false
      }
    },

    async register(registerForm: RegisterForm) {
      try {
        const res = await authApi.register({
          username: registerForm.username,
          email: registerForm.email,
          nickname: registerForm.nickname || registerForm.username,
          password: registerForm.password
        })
        this.token = (res.data as RegisterResult).token
        this.user = (res.data as RegisterResult).user
        this.isLoggedIn = true
        localStorage.setItem('token', this.token)
        localStorage.setItem('user', JSON.stringify(this.user))
        ElMessage.success('注册成功')
        return true
      } catch {
        return false
      }
    },

    async fetchUser() {
      try {
        const res = await authApi.getMe()
        this.user = res.data as UserInfo
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

    updateUser(userData: Partial<UserInfo>) {
      this.user = { ...this.user!, ...userData }
      localStorage.setItem('user', JSON.stringify(this.user))
    }
  }
})
