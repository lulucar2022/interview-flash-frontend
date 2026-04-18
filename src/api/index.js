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
  
  getRandom: (params) => request.get('/questions/random', { params }),
  
  search: (params) => request.get('/questions/search', { params }),
  
  create: (data) => request.post('/questions', data),
  
  update: (id, data) => request.put(`/questions/${id}`, data),
  
  delete: (id) => request.delete(`/questions/${id}`)
}

export const progressApi = {
  getProgress: (params) => request.get('/progress', { params }),
  
  getProgressByQuestion: (params) => request.get('/progress/question', { params }),
  
  getWrongQuestions: (params) => request.get('/progress/wrong', { params }),
  
  getFavorites: (params) => request.get('/progress/favorites', { params }),
  
  getStatistics: (params) => request.get('/progress/statistics', { params }),
  
  updateProgress: (params, data) => request.post('/progress', data, { params }),
  
  resetProgress: (params) => request.delete('/progress/reset', { params })
}

export const wrongApi = {
  getList: (params) => request.get('/wrong', { params }),
  
  getCount: (params) => request.get('/wrong/count', { params }),
  
  recordAnswer: (params) => request.post('/wrong/record', null, { params }),
  
  removeWrong: (params) => request.delete('/wrong', { params })
}
