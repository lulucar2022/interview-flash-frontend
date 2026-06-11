import { defineStore } from 'pinia'

interface AppState {
  loading: boolean
  loadingText: string
}

export const useAppStore = defineStore('app', {
  state: (): AppState => ({
    loading: false,
    loadingText: '加载中...'
  }),

  actions: {
    setLoading(loading: boolean, text: string = '加载中...') {
      this.loading = loading
      this.loadingText = text
    }
  }
})
