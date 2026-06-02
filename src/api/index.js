import request from '@/utils/request'

export const userApi = {
  login: (data) => request.post('/users/login', data),
  
  getUserInfo: (id) => request.get(`/users/${id}`),
  
  getUserByUsername: (username) => request.get(`/users/username/${username}`),
  
  getAllUsers: () => request.get('/users'),
  
  createUser: (data) => request.post('/users', data),
  
  updateUser: (id, data) => request.put(`/users/${id}`, data),
  
  deleteUser: (id) => request.delete(`/users/${id}`)
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
  create: (data) => request.post('/articles', data),
}

export const topicApi = {
  getAll: () => request.get('/topics'),
}

export const commentApi = {
  getByArticle: (params) => request.get(`/articles/${params.articleId}/comments`),
  create: (data) => request.post(`/articles/${data.articleId}/comments`, { content: data.content, parentId: data.parentId }),
}

export const statisticsApi = {
  getDaily: (days) => request.get('/statistics/daily', { params: { days } }),
  getStreak: () => request.get('/statistics/streak'),
  getCategory: () => request.get('/statistics/category'),
}

export const followApi = {
  follow: (data) => request.post('/follows', data),
  unfollow: (params) => request.delete('/follows', { params }),
  getStatus: (params) => request.get('/follows/status', { params }),
}
