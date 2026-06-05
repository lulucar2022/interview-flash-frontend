import request from '@/utils/request'

export const userApi = {
  login: (data) => request.post('/users/login', data),
  
  getUserInfo: (id) => request.get(`/users/${id}`),
  
  getUserByUsername: (username) => request.get(`/users/username/${username}`),
  
  getAllUsers: () => request.get('/users'),
  
  createUser: (data) => request.post('/users', data),
  
  updateUser: (id, data) => request.put(`/users/${id}`, data),
  
  deleteUser: (id) => request.delete(`/users/${id}`),
  getAuthorProfile: (id) => request.get(`/users/${id}/profile`),
  getAuthorArticles: (id, params) => request.get(`/users/${id}/articles`, { params }),
}

export const categoryApi = {
  getAll: () => request.get('/categories'),
  
  getById: (id) => request.get(`/categories/${id}`),
  
  create: (data) => request.post('/categories', data),
  
  update: (id, data) => request.put(`/categories/${id}`, data),
  
  delete: (id) => request.delete(`/categories/${id}`)
}

export const questionApi = {
  getList: (params) => request.get('/questions', { params }),
  
  getById: (id) => request.get(`/questions/${id}`),
  
  getCount: () => request.get('/questions/count'),
  
  getHot: (params) => request.get('/questions/hot', { params }),
  
  getRandom: (params) => request.get('/questions/random', { params }),
  
  getRandomBatch: (params) => request.get('/questions/random/batch', { params }),
  
  search: (params) => request.get('/questions/search', { params }),
  
  create: (data) => request.post('/admin/questions', data),

  importFile: (file) => {
    const formData = new FormData()
    formData.append('file', file)
    return request.post('/admin/questions/import', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
  },

  downloadTemplate: () => request.get('/admin/questions/import/template', { responseType: 'blob' }),

  update: (id, data) => request.put(`/admin/questions/${id}`, data),
  
  delete: (id) => request.delete(`/admin/questions/${id}`)
}

export const progressApi = {
  getProgress: () => request.get('/progress'),
  
  getProgressByQuestion: (questionId) => request.get('/progress/question', { params: { questionId } }),
  
  getWrongQuestions: () => request.get('/progress/wrong'),
  
  getFavorites: () => request.get('/progress/favorites'),
  
  getStatistics: () => request.get('/progress/statistics'),
  
  updateProgress: (data) => request.post('/progress', data),
  
  resetProgress: (questionId) => request.delete('/progress/reset', { params: { questionId } })
}

export const wrongApi = {
  getList: () => request.get('/wrong'),
  
  getCount: () => request.get('/wrong/count'),
  
  recordAnswer: (params) => request.post('/wrong/record', null, { params }),
  
  removeWrong: (params) => request.delete('/wrong', { params })
}

export const authApi = {
  login: (data) => request.post('/auth/login', data),
  register: (data) => request.post('/auth/register', data),
  getMe: () => request.get('/auth/me'),
  updateProfile: (data) => request.put('/auth/profile', data),
  changePassword: (data) => request.put('/auth/password', data),
}

export const articleApi = {
  getList: (params) => request.get('/articles', { params }),
  getById: (id) => request.get(`/articles/${id}`),
  getHot: (params) => request.get('/articles/hot', { params }),
  search: (params) => request.get('/articles/search', { params }),
  create: (data) => request.post('/articles', data),
  update: (id, data) => request.put(`/articles/${id}`, data),
  delete: (id) => request.delete(`/articles/${id}`),
  getMyList: (params) => request.get('/articles/my', { params }),
  getMyDrafts: (params) => request.get('/articles/my/drafts', { params }),
}

export const topicApi = {
  getAll: () => request.get('/topics'),
}

export const commentApi = {
  getByArticle: (articleId, params) => request.get(`/articles/${articleId}/comments`, { params }),
  create: (data) => request.post(`/articles/${data.articleId}/comments`, { content: data.content, parentId: data.parentId }),
  update: (articleId, commentId, data) => request.put(`/articles/${articleId}/comments/${commentId}`, data),
  delete: (articleId, commentId) => request.delete(`/articles/${articleId}/comments/${commentId}`),
  toggleLike: (articleId, commentId) => request.post(`/articles/${articleId}/comments/${commentId}/like`),
}

export const statisticsApi = {
  getDaily: (days) => request.get('/statistics/daily', { params: { days } }),
  getStreak: () => request.get('/statistics/streak'),
  getCategory: () => request.get('/statistics/category'),
}

export const followApi = {
  toggle: (userId) => request.post(`/follow/${userId}`),
  getStatus: (userId) => request.get(`/follow/${userId}/status`),
  getFollowers: (userId) => request.get(`/follow/${userId}/followers`),
  getFollowing: (userId) => request.get(`/follow/${userId}/following`),
}

export const likeApi = {
  toggle: (articleId) => request.post(`/articles/${articleId}/like`),
  getStatus: (articleId) => request.get(`/articles/${articleId}/like-status`),
}

export const notificationApi = {
  getList: (params) => request.get('/notifications', { params }),
  getUnreadCount: () => request.get('/notifications/unread-count'),
  markRead: (id) => request.put(`/notifications/${id}/read`),
  markAllRead: () => request.put('/notifications/read-all'),
}
