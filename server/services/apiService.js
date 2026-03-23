import axios from 'axios'
import dotenv from 'dotenv'

dotenv.config()

// Grsai API配置
const API_CONFIG = {
  host: process.env.NANO_BANANA_HOST || 'https://grsai.dakka.com.cn',
  key: process.env.NANO_BANANA_API_KEY || '',
  model: process.env.NANO_BANANA_MODEL || 'nano-banana-fast'
}

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms))
const MAX_REFERENCE_IMAGES = 14

const normalizeResolution = (requestedSize) => {
  const value = (requestedSize || '1K').toUpperCase()
  return ['1K', '2K', '4K'].includes(value) ? value : '1K'
}

const normalizeAspectRatio = (aspectRatio) => {
  const value = (aspectRatio || 'auto').toString()
  const allowed = ['auto', '1:1', '2:3', '3:2', '3:4', '4:3', '4:5', '5:4', '9:16', '16:9', '21:9']
  return allowed.includes(value) ? value : 'auto'
}

const parseError = (error, fallback = '请求失败') => {
  const data = error?.response?.data
  if (typeof data?.error === 'string' && data.error) return data.error
  if (typeof data?.msg === 'string' && data.msg) return data.msg
  if (typeof data?.message === 'string' && data.message) return data.message
  if (typeof error?.message === 'string' && error.message) return error.message
  return fallback
}

if (!API_CONFIG.key) {
  console.warn('⚠️  NANO_BANANA_API_KEY 未设置！请在 .env 文件中配置。')
}

console.log('🔵 API配置加载:', { host: API_CONFIG.host, model: API_CONFIG.model, key: API_CONFIG.key.slice(0, 10) + '...' })

/**
 * 获取APIKey余额 (grsai暂不支持余额查询)
 */
export const getBalance = async () => {
  // grsai.ai 暂无余额查询接口，返回默认值
  return {
    credits: -1,
    remain_balance: 'unknown',
    used_balance: 'unknown',
    unlimited_quota: false
  }
}

/**
 * 调用 Grsai 生图API
 * @param {Object} params - 生图参数
 * @param {Function} onProgress - 进度回调 (progress, status)
 * @param {Function} isCancelled - 取消检查函数
 * @returns {Promise<Object>} API响应
 */
export const callNanoBananaAPI = async (params, onProgress, isCancelled) => {
  console.log('🔵 Grsai API配置:', { host: API_CONFIG.host, model: API_CONFIG.model })
  
  if (!API_CONFIG.key) {
    throw new Error('API_KEY未配置')
  }

  return await callGrsaiAPI(params, onProgress, isCancelled)
}

/**
 * 调用 Grsai 图像异步任务 API：
 * 1) POST /v1/draw/nano-banana 创建任务 (webHook: "-1" 立即返回ID)
 * 2) POST /v1/draw/result 轮询任务状态
 */
const callGrsaiAPI = async (params, onProgress, isCancelled) => {
  try {
    if (isCancelled && isCancelled()) {
      throw new Error('任务已取消')
    }

    if (onProgress) onProgress(5, 'running')

    const imageSize = normalizeResolution(params.imageSize)
    const aspectRatio = normalizeAspectRatio(params.aspectRatio)
    const imageUrls = Array.isArray(params.urls) ? params.urls.slice(0, MAX_REFERENCE_IMAGES) : []

    // grsai.ai 接口请求体
    const requestBody = {
      model: API_CONFIG.model,
      prompt: params.prompt,
      aspectRatio,
      imageSize,
      urls: imageUrls,
      webHook: '-1',  // 立即返回任务ID
      shutProgress: false
    }

    if (imageUrls.length > 0) {
      console.log(`🔵 添加参考图: ${imageUrls.length} 张`)
    }

    console.log('🔵 提交 Grsai 生图任务:', `${API_CONFIG.host}/v1/draw/nano-banana`, {
      model: API_CONFIG.model,
      aspectRatio,
      imageSize
    })

    // 提交任务
    const submitResp = await axios.post(
      `${API_CONFIG.host}/v1/draw/nano-banana`,
      requestBody,
      {
        headers: {
          'Authorization': `Bearer ${API_CONFIG.key}`,
          'Content-Type': 'application/json'
        },
        timeout: 30000
      }
    )

    const submitData = submitResp.data || {}
    
    // grsai 返回格式: { code: 0, msg: "success", data: { id: "xxx" } }
    if (submitData.code !== 0) {
      throw new Error(submitData.msg || '创建任务失败')
    }

    const taskId = submitData.data?.id
    if (!taskId) {
      throw new Error(`创建任务失败：${JSON.stringify(submitData)}`)
    }
    console.log('🔵 Grsai 任务已创建:', taskId)

    // 轮询任务状态
    const pollIntervalMs = 3000
    const maxAttempts = 200 // 最长约10分钟
    let attempts = 0

    while (attempts < maxAttempts) {
      if (isCancelled && isCancelled()) {
        throw new Error('任务已取消')
      }
      attempts += 1

      // POST /v1/draw/result 查询结果
      const statusResp = await axios.post(
        `${API_CONFIG.host}/v1/draw/result`,
        { id: taskId },
        {
          headers: {
            'Authorization': `Bearer ${API_CONFIG.key}`,
            'Content-Type': 'application/json'
          },
          timeout: 30000
        }
      )

      const respData = statusResp.data || {}
      
      // grsai 返回格式: { code: 0, msg: "success", data: { id, results, progress, status, ... } }
      if (respData.code === -22) {
        throw new Error('任务不存在')
      }

      const taskData = respData.data || {}
      const status = taskData.status
      const progress = Number(taskData.progress || 0)

      if (status === 'succeeded') {
        const results = taskData.results || []
        if (results.length === 0) {
          throw new Error('任务已完成，但未返回可用图片')
        }
        if (onProgress) onProgress(100, 'succeeded')
        return {
          images: results.map(r => ({ url: r.url, content: r.content || '' })),
          apiType: 'grsai',
          taskId
        }
      }

      if (status === 'failed') {
        const failureReason = taskData.failure_reason || taskData.error || '任务失败'
        throw new Error(failureReason)
      }

      if (onProgress) {
        const p = Math.min(Math.max(progress, 5), 99)
        onProgress(p, 'running')
      }
      await sleep(pollIntervalMs)
    }

    throw new Error('任务超时，请稍后重试')
  } catch (error) {
    const message = parseError(error, '生图请求失败')
    console.error('🔵 Grsai请求异常:', message)
    throw new Error(message)
  }
}
