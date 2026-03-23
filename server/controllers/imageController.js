import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { callNanoBananaAPI, getBalance } from '../services/apiService.js'
import taskManager from '../services/taskManager.js'
import { saveImage, deleteImage as deleteFromStorage, getStorageType, getStorageStatus } from '../services/storageService.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const METADATA_FILE = path.join(__dirname, '..', 'storage', 'metadata.json')

// 确保存储目录存在
const ensureMetadataDir = () => {
  const dir = path.dirname(METADATA_FILE)
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true })
  }
}
ensureMetadataDir()

// 读取元数据
const readMetadata = () => {
  if (!fs.existsSync(METADATA_FILE)) {
    return []
  }
  const data = fs.readFileSync(METADATA_FILE, 'utf-8')
  const parsed = JSON.parse(data)
  const list = Array.isArray(parsed) ? parsed : []
  return list.map(img => ({ ...img, username: img.username || '匿名' }))
}

// 写入元数据
const writeMetadata = (data) => {
  fs.writeFileSync(METADATA_FILE, JSON.stringify(data, null, 2))
}

// 生成图片（异步，立即返回任务ID）
export const generateImage = async (req, res) => {
  try {
    const { prompt, aspectRatio = 'auto', imageSize = '1K', urls } = req.body
    const username = req.user?.username || '匿名'
    
    if (!prompt) {
      return res.status(400).json({ error: '缺少prompt参数' })
    }

    // 创建任务
    const taskId = `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    const task = taskManager.createTask(taskId, { prompt, aspectRatio, imageSize, urls, username })
    
    console.log('创建任务:', taskId, { prompt: prompt.substring(0, 50), aspectRatio, imageSize, urlsCount: urls?.length || 0 })

    // 立即返回任务ID
    res.json({
      success: true,
      taskId,
      task
    })

    // 异步执行生成
    executeGeneration(taskId, { prompt, aspectRatio, imageSize, urls, username })
    
  } catch (error) {
    console.error('创建任务失败:', error)
    res.status(500).json({ 
      error: '创建任务失败', 
      message: error.message 
    })
  }
}

// 异步执行生成任务
const executeGeneration = async (taskId, params) => {
  try {
    taskManager.updateTask(taskId, { status: 'running', progress: 5 })

    // 进度回调
    const onProgress = (progress, status) => {
      if (taskManager.isTaskCancelled(taskId)) {
        throw new Error('任务已取消')
      }
      taskManager.updateTask(taskId, { progress, status: status || 'running' })
    }

    // 取消检查
    const isCancelled = () => taskManager.isTaskCancelled(taskId)

    console.log('开始执行任务:', taskId)
    const result = await callNanoBananaAPI(params, onProgress, isCancelled)
    console.log('任务完成:', taskId)

    // 保存图片
    const images = []

    for (let i = 0; i < result.images.length; i++) {
      const imageData = result.images[i]
      const id = `${Date.now()}_${i}`
      const filename = `${id}.png`
      let savedUrl = null
      let storageType = 'remote' // 默认使用远程URL

      if (imageData.url) {
        try {
          // 🔧 下载图片：5次重试，60秒超时，递增等待
          const MAX_ATTEMPTS = 5
          const TIMEOUT_MS = 60000
          let attempts = 0
          let buffer = null
          
          while (attempts < MAX_ATTEMPTS && !buffer) {
            try {
              attempts++
              console.log(`📥 下载图片 (${attempts}/${MAX_ATTEMPTS}): ${imageData.url.substring(0, 60)}...`)
              
              const controller = new AbortController()
              const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS)
              
              const response = await fetch(imageData.url, { 
                signal: controller.signal,
                headers: { 
                  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                  'Accept': 'image/*,*/*'
                }
              })
              clearTimeout(timeout)
              
              if (!response.ok) throw new Error(`HTTP ${response.status}`)
              
              buffer = Buffer.from(await response.arrayBuffer())
              
              // 验证图片大小（至少1KB）
              if (buffer.length < 1024) {
                buffer = null
                throw new Error(`图片太小: ${buffer.length} bytes`)
              }
              
              console.log(`✅ 图片下载成功: ${filename} (${(buffer.length/1024).toFixed(1)}KB)`)
            } catch (err) {
              const waitTime = attempts * 2000
              console.warn(`⚠️ 下载尝试 ${attempts}/${MAX_ATTEMPTS} 失败: ${err.message}`)
              if (attempts === MAX_ATTEMPTS) throw err
              console.log(`⏳ ${waitTime/1000}秒后重试...`)
              await new Promise(r => setTimeout(r, waitTime))
            }
          }

          // 🔧 保存到存储（本地或云存储）
          if (buffer) {
            const saveResult = await saveImage(buffer, filename)
            savedUrl = saveResult.url
            storageType = saveResult.storageType
            console.log(`💾 图片已保存 [${storageType}]: ${savedUrl}`)
          }
        } catch (downloadError) {
          console.error('❌ 下载/保存图片失败，使用远程URL:', downloadError.message)
        }
      }

      const imageRecord = {
        id,
        username: params.username || '匿名',
        prompt: params.prompt,
        aspectRatio: params.aspectRatio,
        imageSize: params.imageSize,
        referenceUrls: params.urls || [],
        apiType: result.apiType || 'unknown',
        filename: savedUrl ? filename : null,
        url: savedUrl || imageData.url, // 优先使用保存的URL
        remoteUrl: imageData.url,       // 始终保留远程URL作为备份
        storageType,                    // 记录存储类型
        createdAt: Date.now()
      }

      images.push(imageRecord)
      
      // 每次保存后立即更新metadata
      const metadata = readMetadata()
      metadata.unshift(imageRecord)
      writeMetadata(metadata)
    }

    taskManager.updateTask(taskId, {
      status: 'succeeded',
      progress: 100,
      result: { images }
    })

  } catch (error) {
    console.error('任务执行失败:', taskId, error.message)
    taskManager.updateTask(taskId, {
      status: error.message === '任务已取消' ? 'cancelled' : 'failed',
      progress: 0,
      error: error.message
    })
  }
}

// 获取所有任务
export const getTasks = (req, res) => {
  try {
    const tasks = taskManager.getAllTasks()
    res.json({
      success: true,
      tasks
    })
  } catch (error) {
    console.error('获取任务列表失败:', error)
    res.status(500).json({ error: '获取失败' })
  }
}

// 获取单个任务状态
export const getTaskById = (req, res) => {
  try {
    const { id } = req.params
    const task = taskManager.getTask(id)
    
    if (!task) {
      return res.status(404).json({ error: '任务不存在' })
    }

    res.json({
      success: true,
      task
    })
  } catch (error) {
    console.error('获取任务详情失败:', error)
    res.status(500).json({ error: '获取失败' })
  }
}

// 取消任务
export const cancelTask = (req, res) => {
  try {
    const { id } = req.params
    const success = taskManager.cancelTask(id)
    
    if (!success) {
      return res.status(400).json({ error: '任务无法取消（可能已完成或不存在）' })
    }

    res.json({
      success: true,
      message: '任务已取消'
    })
  } catch (error) {
    console.error('取消任务失败:', error)
    res.status(500).json({ error: '取消失败' })
  }
}

// 删除任务
export const deleteTaskById = (req, res) => {
  try {
    const { id } = req.params
    taskManager.deleteTask(id)
    res.json({ success: true, message: '任务已删除' })
  } catch (error) {
    console.error('删除任务失败:', error)
    res.status(500).json({ error: '删除失败' })
  }
}

// 获取图片列表
export const getImages = (req, res) => {
  try {
    const metadata = readMetadata()
    res.json({
      success: true,
      images: metadata,
      total: metadata.length
    })
  } catch (error) {
    console.error('获取图片列表失败:', error)
    res.status(500).json({ error: '获取失败' })
  }
}

// 获取图片详情
export const getImageById = (req, res) => {
  try {
    const { id } = req.params
    const metadata = readMetadata()
    const image = metadata.find(img => img.id === id)

    if (!image) {
      return res.status(404).json({ error: '图片不存在' })
    }

    res.json({
      success: true,
      image
    })
  } catch (error) {
    console.error('获取图片详情失败:', error)
    res.status(500).json({ error: '获取失败' })
  }
}

// 删除图片
export const deleteImage = (req, res) => {
  try {
    const { id } = req.params
    const metadata = readMetadata()
    const imageIndex = metadata.findIndex(img => img.id === id)

    if (imageIndex === -1) {
      return res.status(404).json({ error: '图片不存在' })
    }

    const image = metadata[imageIndex]
    
    // 从存储中删除（支持本地和云存储）
    if (image.filename) {
      deleteFromStorage(image.filename, image.storageType || 'local')
    }

    metadata.splice(imageIndex, 1)
    writeMetadata(metadata)

    res.json({
      success: true,
      message: '删除成功'
    })
  } catch (error) {
    console.error('删除图片失败:', error)
    res.status(500).json({ error: '删除失败' })
  }
}

// 获取余额
export const getAccountBalance = async (req, res) => {
  try {
    const balanceData = await getBalance()
    res.json({
      success: true,
      balance: balanceData?.credits || 0,
      details: balanceData
    })
  } catch (error) {
    console.error('获取余额失败:', error)
    res.status(500).json({ error: '获取余额失败' })
  }
}

// 获取存储状态（调试用）
export const getStorageInfo = (req, res) => {
  res.json({
    success: true,
    storage: getStorageStatus()
  })
}
