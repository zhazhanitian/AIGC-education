import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  timeout: 300000 // 5分钟
})

api.interceptors.request.use(config => {
  try {
    const token = localStorage.getItem('nano-banana-token')
    if (token) {
      config.headers = config.headers || {}
      config.headers.Authorization = `Bearer ${token}`
    }
  } catch {}
  return config
})

api.interceptors.response.use(
  response => response.data,
  error => {
    console.error('API Error:', error)
    return Promise.reject(error)
  }
)

// 图片API
export const imageAPI = {
  generate: (params) => api.post('/generate', params),
  getList: (params) => api.get('/images', { params }),
  getDetail: (id) => api.get(`/images/${id}`),
  delete: (id) => api.delete(`/images/${id}`),
  getBalance: () => api.get('/balance')
}

// 任务API
export const taskAPI = {
  getAll: () => api.get('/tasks'),
  getById: (id) => api.get(`/tasks/${id}`),
  cancel: (id) => api.post(`/tasks/${id}/cancel`),
  delete: (id) => api.delete(`/tasks/${id}`)
}

export const authAPI = {
  register: (params) => api.post('/auth/register', params),
  login: (params) => api.post('/auth/login', params),
  me: () => api.get('/auth/me')
}

// Chat API (Grsai)
// ⚠️ 不要在前端代码里硬编码密钥，使用 Vite 环境变量注入：VITE_CHAT_API_KEY / VITE_CHAT_API_BASE
const CHAT_API_BASE = import.meta.env.VITE_CHAT_API_BASE || 'https://grsaiapi.com/v1'
const CHAT_API_KEY = import.meta.env.VITE_CHAT_API_KEY || ''

export const chatAPI = {
  sendMessage: async (messages, model = 'gemini-3-pro', stream = false) => {
    if (!CHAT_API_KEY) {
      throw new Error('未配置 VITE_CHAT_API_KEY（请在 client/.env 中设置）')
    }

    const response = await fetch(`${CHAT_API_BASE}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${CHAT_API_KEY}`
      },
      body: JSON.stringify({
        model,
        stream,
        messages
      })
    })
    if (!response.ok) {
      throw new Error(`Chat API error: ${response.status}`)
    }
    return stream ? response : response.json()
  }
}

// 联网搜索 API
export const searchAPI = {
  /**
   * 执行联网搜索
   * @param {string} query - 搜索关键词
   * @param {number} num - 返回结果数量，默认 5
   * @returns {Promise<{success: boolean, results: Array, searchTime: number}>}
   */
  search: (query, num = 5) => api.post('/search', { query, num }),
  
  /**
   * 检查搜索服务状态
   * @returns {Promise<{enabled: boolean, provider: string}>}
   */
  getStatus: () => api.get('/search/status')
}

// AI PPT API
export const pptAPI = {
  generate: (params) => api.post('/ppt/generate', params),
  getTasks: () => api.get('/ppt/tasks'),
  getTaskById: (id) => api.get(`/ppt/tasks/${id}`),
  cancel: (id) => api.post(`/ppt/tasks/${id}/cancel`),
  retry: (id) => api.post(`/ppt/tasks/${id}/retry`),
  regenerateSlide: (taskId, slideIndex) => api.post(`/ppt/tasks/${taskId}/slides/${slideIndex}/regenerate`),
  delete: (id) => api.delete(`/ppt/tasks/${id}`)
}
