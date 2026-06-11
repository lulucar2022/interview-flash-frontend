import request from '@/utils/request'
import type { ApiResponse } from '@/utils/request'

type ApiResult<T = unknown> = Promise<ApiResponse<T>>

interface LoginData {
  account: string
  password: string
}

interface RegisterData {
  username: string
  email: string
  nickname: string
  password: string
}

export const userApi = {
  login: (data: LoginData): ApiResult => request.post('/users/login', data),
  getUserInfo: (id: number): ApiResult => request.get(`/users/${id}`),
  getUserByUsername: (username: string): ApiResult => request.get(`/users/username/${username}`),
  getAllUsers: (): ApiResult => request.get('/users'),
  createUser: (data: unknown): ApiResult => request.post('/users', data),
  updateUser: (id: number, data: unknown): ApiResult => request.put(`/users/${id}`, data),
  deleteUser: (id: number): ApiResult => request.delete(`/users/${id}`),
  getAuthorProfile: (id: number): ApiResult => request.get(`/users/${id}/profile`),
  getAuthorArticles: (id: number, params: Record<string, unknown>): ApiResult => request.get(`/users/${id}/articles`, { params }),
}

export const categoryApi = {
  getAll: (): ApiResult => request.get('/categories'),
  getById: (id: number): ApiResult => request.get(`/categories/${id}`),
  create: (data: unknown): ApiResult => request.post('/categories', data),
  update: (id: number, data: unknown): ApiResult => request.put(`/categories/${id}`, data),
  delete: (id: number): ApiResult => request.delete(`/categories/${id}`)
}

export const questionApi = {
  getList: (params: Record<string, unknown>): ApiResult => request.get('/questions', { params }),
  getById: (id: number): ApiResult => request.get(`/questions/${id}`),
  getCount: (): ApiResult => request.get('/questions/count'),
  getHot: (params: Record<string, unknown>): ApiResult => request.get('/questions/hot', { params }),
  getRandom: (params: Record<string, unknown>): ApiResult => request.get('/questions/random', { params }),
  getRandomBatch: (params: Record<string, unknown>): ApiResult => request.get('/questions/random/batch', { params }),
  search: (params: Record<string, unknown>): ApiResult => request.get('/questions/search', { params }),
  create: (data: unknown): ApiResult => request.post('/admin/questions', data),
  importFile: (file: File): ApiResult => {
    const formData = new FormData()
    formData.append('file', file)
    return request.post('/admin/questions/import', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
  },
  downloadTemplate: (): ApiResult => request.get('/admin/questions/import/template', { responseType: 'blob' }),
  update: (id: number, data: unknown): ApiResult => request.put(`/admin/questions/${id}`, data),
  delete: (id: number): ApiResult => request.delete(`/admin/questions/${id}`)
}

export const progressApi = {
  getProgress: (): ApiResult => request.get('/progress'),
  getProgressByQuestion: (questionId: number): ApiResult => request.get('/progress/question', { params: { questionId } }),
  getWrongQuestions: (): ApiResult => request.get('/progress/wrong'),
  getFavorites: (): ApiResult => request.get('/progress/favorites'),
  getStatistics: (): ApiResult => request.get('/progress/statistics'),
  updateProgress: (data: unknown): ApiResult => request.post('/progress', data),
  resetProgress: (questionId: number): ApiResult => request.delete('/progress/reset', { params: { questionId } })
}

export const wrongApi = {
  getList: (): ApiResult => request.get('/wrong'),
  getCount: (): ApiResult => request.get('/wrong/count'),
  recordAnswer: (params: Record<string, unknown>): ApiResult => request.post('/wrong/record', null, { params }),
  removeWrong: (params: Record<string, unknown>): ApiResult => request.delete('/wrong', { params })
}

export const authApi = {
  login: (data: LoginData): ApiResult => request.post('/auth/login', data),
  register: (data: RegisterData): ApiResult => request.post('/auth/register', data),
  getMe: (): ApiResult => request.get('/auth/me'),
  updateProfile: (data: unknown): ApiResult => request.put('/auth/profile', data),
  changePassword: (data: unknown): ApiResult => request.put('/auth/password', data),
}

export const articleApi = {
  getList: (params: Record<string, unknown>): ApiResult => request.get('/articles', { params }),
  getById: (id: number): ApiResult => request.get(`/articles/${id}`),
  getHot: (params: Record<string, unknown>): ApiResult => request.get('/articles/hot', { params }),
  search: (params: Record<string, unknown>): ApiResult => request.get('/articles/search', { params }),
  create: (data: unknown): ApiResult => request.post('/articles', data),
  update: (id: number, data: unknown): ApiResult => request.put(`/articles/${id}`, data),
  delete: (id: number): ApiResult => request.delete(`/articles/${id}`),
  getMyList: (params: Record<string, unknown>): ApiResult => request.get('/articles/my', { params }),
  getMyDrafts: (params: Record<string, unknown>): ApiResult => request.get('/articles/my/drafts', { params }),
}

export const topicApi = {
  getAll: (): ApiResult => request.get('/topics'),
}

export const commentApi = {
  getByArticle: (articleId: number, params: Record<string, unknown>): ApiResult => request.get(`/articles/${articleId}/comments`, { params }),
  create: (data: { articleId: number; content: string; parentId?: number | null }): ApiResult => request.post(`/articles/${data.articleId}/comments`, { content: data.content, parentId: data.parentId }),
  update: (articleId: number, commentId: number, data: unknown): ApiResult => request.put(`/articles/${articleId}/comments/${commentId}`, data),
  delete: (articleId: number, commentId: number): ApiResult => request.delete(`/articles/${articleId}/comments/${commentId}`),
  toggleLike: (articleId: number, commentId: number): ApiResult => request.post(`/articles/${articleId}/comments/${commentId}/like`),
}

export const statisticsApi = {
  getDaily: (days: number): ApiResult => request.get('/statistics/daily', { params: { days } }),
  getStreak: (): ApiResult => request.get('/statistics/streak'),
  getCategory: (): ApiResult => request.get('/statistics/category'),
  getArticleViewsTrend: (days: number): ApiResult => request.get('/statistics/article-views', { params: { days } }),
  getArticleViewTotal: (): ApiResult => request.get('/statistics/article-views/total'),
  getFollowerTrend: (days: number): ApiResult => request.get('/statistics/follower-trend', { params: { days } }),
}

export const followApi = {
  toggle: (userId: number): ApiResult => request.post(`/follow/${userId}`),
  getStatus: (userId: number): ApiResult => request.get(`/follow/${userId}/status`),
  getFollowers: (userId: number): ApiResult => request.get(`/follow/${userId}/followers`),
  getFollowing: (userId: number): ApiResult => request.get(`/follow/${userId}/following`),
}

export const likeApi = {
  toggle: (articleId: number): ApiResult => request.post(`/articles/${articleId}/like`),
  getStatus: (articleId: number): ApiResult => request.get(`/articles/${articleId}/like-status`),
}

export const bookmarkApi = {
  toggle: (articleId: number): ApiResult => request.post(`/bookmarks/${articleId}`),
  getList: (params: Record<string, unknown>): ApiResult => request.get('/bookmarks', { params }),
  getStatus: (articleId: number): ApiResult => request.get(`/bookmarks/${articleId}/status`),
}

export const blockApi = {
  toggle: (userId: number): ApiResult => request.post(`/block/${userId}`),
  getStatus: (userId: number): ApiResult => request.get(`/block/${userId}/status`),
  getList: (): ApiResult => request.get('/block/list'),
}

export const seriesApi = {
  getList: (params: Record<string, unknown>): ApiResult => request.get('/series', { params }),
  getById: (id: number): ApiResult => request.get(`/series/${id}`),
  create: (data: unknown): ApiResult => request.post('/series', data),
  update: (id: number, data: unknown): ApiResult => request.put(`/series/${id}`, data),
  delete: (id: number): ApiResult => request.delete(`/series/${id}`),
  assignArticle: (articleId: number, data: unknown): ApiResult => request.put(`/series/articles/${articleId}`, data),
}

export const notificationApi = {
  getList: (params: Record<string, unknown>): ApiResult => request.get('/notifications', { params }),
  getUnreadCount: (): ApiResult => request.get('/notifications/unread-count'),
  markRead: (id: number): ApiResult => request.put(`/notifications/${id}/read`),
  markAllRead: (): ApiResult => request.put('/notifications/read-all'),
}
