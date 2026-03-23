import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { callNanoBananaAPI } from '../services/apiService.js'
import pptTaskManager from '../services/pptTaskManager.js'
import { saveImage } from '../services/storageService.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const METADATA_FILE = path.join(__dirname, '..', 'storage', 'metadata.json')

const ensureMetadataDir = () => {
  const dir = path.dirname(METADATA_FILE)
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
}
ensureMetadataDir()

const readMetadata = () => {
  if (!fs.existsSync(METADATA_FILE)) return []
  const raw = fs.readFileSync(METADATA_FILE, 'utf-8')
  const parsed = JSON.parse(raw)
  return Array.isArray(parsed) ? parsed : []
}

const writeMetadata = (data) => {
  fs.writeFileSync(METADATA_FILE, JSON.stringify(data, null, 2))
}

const sleep = (ms) => new Promise(r => setTimeout(r, ms))

async function downloadImageBuffer(url) {
  const MAX_ATTEMPTS = 5
  const TIMEOUT_MS = 60000

  let attempts = 0
  while (attempts < MAX_ATTEMPTS) {
    attempts++
    try {
      const controller = new AbortController()
      const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS)
      const resp = await fetch(url, {
        signal: controller.signal,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Accept': 'image/*,*/*'
        }
      })
      clearTimeout(timeout)
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`)
      const buf = Buffer.from(await resp.arrayBuffer())
      if (buf.length < 1024) throw new Error(`图片太小: ${buf.length} bytes`)
      return buf
    } catch (err) {
      if (attempts === MAX_ATTEMPTS) throw err
      await sleep(attempts * 1500)
    }
  }
  throw new Error('下载失败')
}

function buildSlidePrompt(stylePrompt, slideScript, hasStyleRef) {
  const presetHint = hasStyleRef
    ? '\n\n【风格参考图】\n请严格参考上传的风格参考图的视觉风格（色彩、字体气质、构图、质感），保持整套 PPT 风格一致。'
    : ''

  return `${stylePrompt || ''}${presetHint}\n\n【PPT页脚本】\n${slideScript || ''}`.trim()
}

export const generatePpt = async (req, res) => {
  try {
    const { stylePrompt = '', aspectRatio = '16:9', slides = [], styleUrls = [] } = req.body
    const username = req.user?.username || '匿名'

    if (!Array.isArray(slides) || slides.length === 0) {
      return res.status(400).json({ success: false, error: '缺少 slides（至少 1 页）' })
    }

    const normalizedSlides = slides.map((s, i) => ({
      index: typeof s?.index === 'number' ? s.index : i,
      script: (s?.script || '').toString()
    }))

    const taskId = `ppt_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`
    // 验证 aspectRatio
    const validRatios = ['16:9', '21:9', '9:16']
    const finalAspectRatio = validRatios.includes(aspectRatio) ? aspectRatio : '16:9'

    const task = pptTaskManager.createTask(taskId, {
      username,
      stylePrompt,
      aspectRatio: finalAspectRatio,
      styleUrls: Array.isArray(styleUrls) ? styleUrls : [],
      slides: normalizedSlides
    })

    res.json({ success: true, pptTaskId: taskId, task })

    executePptGeneration(taskId, {
      username,
      stylePrompt,
      aspectRatio: finalAspectRatio,
      styleUrls: Array.isArray(styleUrls) ? styleUrls : [],
      slides: normalizedSlides
    })
  } catch (error) {
    console.error('创建 PPT 任务失败:', error)
    res.status(500).json({ success: false, error: '创建 PPT 任务失败', message: error.message })
  }
}

async function executePptGeneration(taskId, params) {
  try {
    const total = params.slides.length
    pptTaskManager.updateTask(taskId, { status: 'running', progress: 1, error: null })

    const hasStyleRef = !!(params.styleUrls && params.styleUrls.length > 0)
    
    // 用于统计完成数量的计数器（线程安全）
    let completedCount = 0
    const results = []
    const failedSlides = []
    
    // 用于 metadata 写入的锁
    let metadataLock = Promise.resolve()

    console.log(`[PPT] 任务 ${taskId} 开始并行生成 ${total} 页`)

    // 为每一页创建生成任务
    const generateSlide = async (slide, slideIndex) => {
      // 检查任务是否已取消
      if (pptTaskManager.isTaskCancelled(taskId)) {
        throw new Error('任务已取消')
      }

      pptTaskManager.updateSlide(taskId, slide.index, { status: 'running', error: null })

      try {
        const prompt = buildSlidePrompt(params.stylePrompt, slide.script, hasStyleRef)
        console.log(`[PPT] 并行生成第 ${slide.index + 1}/${total} 页，提示词: ${prompt.substring(0, 50)}...`)

        const apiParams = {
          prompt,
          aspectRatio: params.aspectRatio || '16:9',
          imageSize: '4K',
          urls: params.styleUrls || [],
          username: params.username
        }

        // 进度回调（并行模式下简化处理）
        const onProgress = (pageProgress) => {
          // 并行模式下，进度基于完成的页数
          const overall = Math.min(99, Math.round(((completedCount + (pageProgress / 100)) / total) * 100))
          pptTaskManager.updateTask(taskId, { progress: overall, status: 'running' })
        }

        const isCancelled = () => pptTaskManager.isTaskCancelled(taskId)

        const gen = await callNanoBananaAPI(apiParams, onProgress, isCancelled)
        const imageData = gen.images?.[0]
        
        if (!imageData?.url) {
          throw new Error('API 返回成功但未找到图片 URL')
        }

        console.log(`[PPT] 第 ${slide.index + 1} 页生成成功，图片URL: ${imageData.url.substring(0, 60)}...`)

        // 下载 + 保存
        let savedUrl = imageData.url
        let storageType = 'remote'
        let filename = null
        let imageId = `${Date.now()}_${slideIndex}_${Math.random().toString(36).slice(2, 6)}`

        try {
          const buf = await downloadImageBuffer(imageData.url)
          filename = `${imageId}.png`
          const saved = await saveImage(buf, filename)
          savedUrl = saved.url
          storageType = saved.storageType
          console.log(`[PPT] 第 ${slide.index + 1} 页图片已保存: ${savedUrl}`)
        } catch (err) {
          console.warn(`[PPT] 第 ${slide.index + 1} 页图片下载/保存失败，使用远程 URL:`, err.message)
        }

        const imageRecord = {
          id: imageId,
          username: params.username || '匿名',
          prompt,
          aspectRatio: params.aspectRatio || '16:9',
          imageSize: '4K',
          referenceUrls: params.styleUrls || [],
          apiType: gen.apiType || 'unknown',
          filename: filename,
          url: savedUrl,
          remoteUrl: imageData.url,
          storageType,
          createdAt: Date.now(),
          // PPT 扩展字段
          pptTaskId: taskId,
          pptSlideIndex: slide.index,
          pptStylePrompt: params.stylePrompt || '',
          pptSlideScript: slide.script || ''
        }

        // 写入 metadata（使用锁避免并发写入冲突）
        metadataLock = metadataLock.then(() => {
          try {
            const metadata = readMetadata()
            metadata.unshift(imageRecord)
            writeMetadata(metadata)
          } catch (err) {
            console.error(`[PPT] 写入 metadata 失败 (第 ${slide.index + 1} 页):`, err.message)
          }
        })

        results.push(imageRecord)
        pptTaskManager.updateSlide(taskId, slide.index, {
          status: 'succeeded',
          imageId,
          imageUrl: savedUrl,
          error: null
        })

        // 更新完成计数和进度
        completedCount++
        const overall = Math.min(99, Math.round((completedCount / total) * 100))
        pptTaskManager.updateTask(taskId, { progress: overall, status: 'running' })

        return { success: true, slide, imageRecord }
        
      } catch (slideError) {
        // 单页生成失败
        const errorMessage = slideError.message || '生成失败'
        console.error(`[PPT] 第 ${slide.index + 1}/${total} 页生成失败:`, errorMessage)
        
        // 检查是否是内容审核错误
        const isModerationError = errorMessage.includes('违规内容') || 
                                  errorMessage.includes('安全拦截') ||
                                  errorMessage.includes('output_moderation') ||
                                  errorMessage.includes('content_filter')
        
        const finalErrorMsg = isModerationError 
          ? '内容审核未通过：生成的图片包含违规内容，请修改提示词后重试'
          : errorMessage

        pptTaskManager.updateSlide(taskId, slide.index, {
          status: 'failed',
          error: finalErrorMsg,
          imageId: null,
          imageUrl: null
        })
        
        failedSlides.push({ index: slide.index, error: finalErrorMsg })
        
        // 更新完成计数和进度
        completedCount++
        const overall = Math.min(99, Math.round((completedCount / total) * 100))
        pptTaskManager.updateTask(taskId, { progress: overall, status: 'running' })

        return { success: false, slide, error: finalErrorMsg }
      }
    }

    // 所有页面全并发生成
    const allPromises = params.slides.map((slide, index) => generateSlide(slide, index))
    const results_promises = await Promise.all(allPromises)
    
    // 等待所有 metadata 写入完成
    await metadataLock

    // 判断最终状态
    const succeededCount = results.length
    const failedCount = failedSlides.length
    
    if (succeededCount === 0) {
      // 全部失败
      const errorSummary = failedSlides.map(s => `第${s.index + 1}页: ${s.error}`).join('; ')
      pptTaskManager.updateTask(taskId, {
        status: 'failed',
        progress: 100,
        error: `所有页面生成失败。${errorSummary}`,
        result: { images: results }
      })
      console.error(`[PPT] 任务 ${taskId} 全部失败:`, errorSummary)
    } else if (failedCount > 0) {
      // 部分成功
      const errorSummary = failedSlides.map(s => `第${s.index + 1}页: ${s.error}`).join('; ')
      pptTaskManager.updateTask(taskId, {
        status: 'succeeded',
        progress: 100,
        error: `部分页面生成失败 (${failedCount}/${total})。${errorSummary}`,
        result: { images: results }
      })
      console.warn(`[PPT] 任务 ${taskId} 部分成功: ${succeededCount} 成功, ${failedCount} 失败`)
    } else {
      // 全部成功
      pptTaskManager.updateTask(taskId, {
        status: 'succeeded',
        progress: 100,
        error: null,
        result: { images: results }
      })
      console.log(`[PPT] 任务 ${taskId} 全部成功: ${succeededCount} 页`)
    }
    
  } catch (error) {
    // 任务级别的错误（如取消、网络中断等）
    const isCancelled = error.message === '任务已取消'
    const errorMsg = error.message || '任务执行异常'
    
    console.error(`[PPT] 任务 ${taskId} 执行异常:`, errorMsg)
    console.error(`[PPT] 错误堆栈:`, error.stack)
    
    pptTaskManager.updateTask(taskId, {
      status: isCancelled ? 'cancelled' : 'failed',
      progress: 0,
      error: errorMsg
    })
  }
}

export const getPptTasks = (req, res) => {
  try {
    const tasks = pptTaskManager.getAllTasks()
    res.json({ success: true, tasks })
  } catch (error) {
    res.status(500).json({ success: false, error: '获取 PPT 任务失败' })
  }
}

export const getPptTaskById = (req, res) => {
  try {
    const task = pptTaskManager.getTask(req.params.id)
    if (!task) return res.status(404).json({ success: false, error: '任务不存在' })
    res.json({ success: true, task })
  } catch (error) {
    res.status(500).json({ success: false, error: '获取 PPT 任务失败' })
  }
}

export const cancelPptTask = (req, res) => {
  try {
    const ok = pptTaskManager.cancelTask(req.params.id)
    res.json({ success: true, cancelled: ok })
  } catch (error) {
    res.status(500).json({ success: false, error: '取消失败' })
  }
}

export const retryPptTask = async (req, res) => {
  try {
    const taskId = req.params.id
    const task = pptTaskManager.retryTask(taskId)
    if (!task) {
      return res.status(400).json({ success: false, error: '任务不存在或不可重试' })
    }

    res.json({ success: true, task })

    // 只重新生成失败/待处理的页面
    const slidesToRetry = task.slides.filter(s => s.status === 'pending')
    if (slidesToRetry.length > 0) {
      executePptGeneration(taskId, {
        username: task.username,
        stylePrompt: task.stylePrompt,
        styleUrls: task.styleUrls || [],
        slides: slidesToRetry
      })
    }
  } catch (error) {
    console.error('重试 PPT 任务失败:', error)
    res.status(500).json({ success: false, error: '重试失败', message: error.message })
  }
}

// 单页重新生成
export const regenerateSlide = async (req, res) => {
  try {
    const taskId = req.params.id
    const slideIndex = parseInt(req.params.slideIndex, 10)

    const task = pptTaskManager.getTask(taskId)
    if (!task) {
      return res.status(404).json({ success: false, error: '任务不存在' })
    }

    const slide = task.slides.find(s => s.index === slideIndex)
    if (!slide) {
      return res.status(400).json({ success: false, error: `第 ${slideIndex + 1} 页不存在` })
    }

    // 标记为 running
    pptTaskManager.updateSlide(taskId, slideIndex, { status: 'running', error: null, imageId: null, imageUrl: null })
    // 任务整体也标记为 running
    pptTaskManager.updateTask(taskId, { status: 'running', progress: 99, error: null })

    res.json({ success: true, task: pptTaskManager.getTask(taskId) })

    // 异步执行单页生成
    executeSlideRegeneration(taskId, slide, task)
  } catch (error) {
    console.error('单页重新生成失败:', error)
    res.status(500).json({ success: false, error: '重新生成失败', message: error.message })
  }
}

async function executeSlideRegeneration(taskId, slide, task) {
  const hasStyleRef = !!(task.styleUrls && task.styleUrls.length > 0)

  try {
    const prompt = buildSlidePrompt(task.stylePrompt, slide.script, hasStyleRef)
    console.log(`[PPT] 单页重新生成: 任务 ${taskId}, 第 ${slide.index + 1} 页`)

    const apiParams = {
      prompt,
      aspectRatio: task.aspectRatio || '16:9',
      imageSize: '4K',
      urls: task.styleUrls || [],
      username: task.username
    }

    const onProgress = () => {} // 单页无需更新整体进度
    const isCancelled = () => pptTaskManager.isTaskCancelled(taskId)

    const gen = await callNanoBananaAPI(apiParams, onProgress, isCancelled)
    const imageData = gen.images?.[0]

    if (!imageData?.url) {
      throw new Error('API 返回成功但未找到图片 URL')
    }

    // 下载 + 保存
    let savedUrl = imageData.url
    let storageType = 'remote'
    let filename = null
    let imageId = `${Date.now()}_${slide.index}_${Math.random().toString(36).slice(2, 6)}`

    try {
      const buf = await downloadImageBuffer(imageData.url)
      filename = `${imageId}.png`
      const saved = await saveImage(buf, filename)
      savedUrl = saved.url
      storageType = saved.storageType
      console.log(`[PPT] 第 ${slide.index + 1} 页重新生成成功，已保存: ${savedUrl}`)
    } catch (err) {
      console.warn(`[PPT] 第 ${slide.index + 1} 页图片下载/保存失败，使用远程 URL:`, err.message)
    }

    // 写入 metadata
    try {
      const metadata = readMetadata()
      metadata.unshift({
        id: imageId,
        username: task.username || '匿名',
        prompt,
        aspectRatio: task.aspectRatio || '16:9',
        imageSize: '4K',
        referenceUrls: task.styleUrls || [],
        apiType: gen.apiType || 'unknown',
        filename,
        url: savedUrl,
        remoteUrl: imageData.url,
        storageType,
        createdAt: Date.now(),
        pptTaskId: taskId,
        pptSlideIndex: slide.index,
        pptStylePrompt: task.stylePrompt || '',
        pptSlideScript: slide.script || ''
      })
      writeMetadata(metadata)
    } catch (err) {
      console.error(`[PPT] 写入 metadata 失败:`, err.message)
    }

    pptTaskManager.updateSlide(taskId, slide.index, {
      status: 'succeeded',
      imageId,
      imageUrl: savedUrl,
      error: null
    })

    // 重新计算任务整体状态
    recalcTaskStatus(taskId)

  } catch (error) {
    const errorMessage = error.message || '生成失败'
    console.error(`[PPT] 第 ${slide.index + 1} 页重新生成失败:`, errorMessage)

    const isModerationError = errorMessage.includes('违规内容') ||
      errorMessage.includes('安全拦截') ||
      errorMessage.includes('output_moderation') ||
      errorMessage.includes('content_filter')

    const finalErrorMsg = isModerationError
      ? '内容审核未通过：生成的图片包含违规内容，请修改提示词后重试'
      : errorMessage

    pptTaskManager.updateSlide(taskId, slide.index, {
      status: 'failed',
      error: finalErrorMsg,
      imageId: null,
      imageUrl: null
    })

    recalcTaskStatus(taskId)
  }
}

// 重新计算任务整体状态
function recalcTaskStatus(taskId) {
  const task = pptTaskManager.getTask(taskId)
  if (!task) return

  const allSlides = task.slides || []
  const running = allSlides.some(s => s.status === 'running' || s.status === 'pending')
  if (running) return // 还有页面在生成中，不更新

  const succeeded = allSlides.filter(s => s.status === 'succeeded').length
  const failed = allSlides.filter(s => s.status === 'failed').length
  const total = allSlides.length

  if (succeeded === 0) {
    pptTaskManager.updateTask(taskId, { status: 'failed', progress: 100, error: '所有页面生成失败' })
  } else if (failed > 0) {
    pptTaskManager.updateTask(taskId, { status: 'succeeded', progress: 100, error: `部分页面生成失败 (${failed}/${total})` })
  } else {
    pptTaskManager.updateTask(taskId, { status: 'succeeded', progress: 100, error: null })
  }
}

export const deletePptTaskById = (req, res) => {
  try {
    const ok = pptTaskManager.deleteTask(req.params.id)
    res.json({ success: true, deleted: ok })
  } catch (error) {
    res.status(500).json({ success: false, error: '删除失败' })
  }
}

