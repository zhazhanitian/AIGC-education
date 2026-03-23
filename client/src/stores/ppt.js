import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { pptAPI } from '../api'
import { useImageStore } from './image'

const STORAGE_KEY = 'lutanano_ppt_form_state'

export const usePptStore = defineStore('ppt', () => {
  const imageStore = useImageStore()
  
  const pptTasks = ref([])
  const activePptTaskId = ref(null)
  const stylePrompt = ref('')
  const aspectRatio = ref('16:9') // 固定为 16:9，PPT 专用于横屏 4K
  const styleReferenceImages = ref([]) // { preview, content (base64/url) }
  const slides = ref([]) // [{ index, script }]
  
  let pollingTimer = null
  let isPageVisible = true
  let chargedSlidesCount = new Map() // taskId -> 已扣费页数
  let visibilityHandler = null

  if (typeof document !== 'undefined') {
    visibilityHandler = () => {
      const wasHidden = !isPageVisible
      isPageVisible = !document.hidden
      // 页面重新可见时，如果有活跃任务且轮询已停止，重新启动
      if (wasHidden && isPageVisible && hasActiveTasks() && !pollingTimer) {
        startPolling()
      }
    }
    document.addEventListener('visibilitychange', visibilityHandler)
  }

  // 判断是否有活跃任务
  const hasActiveTasks = () => {
    return pptTasks.value.some(t => t.status === 'pending' || t.status === 'running')
  }

  // 从 localStorage 恢复表单状态
  // 兼容 content 和 script 两种字段
  const loadFormState = () => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved) {
        const parsed = JSON.parse(saved)
        stylePrompt.value = parsed.stylePrompt || ''
        aspectRatio.value = parsed.aspectRatio || '16:9'
        const rawSlides = parsed.slides || []
        slides.value = rawSlides.map(s => ({ content: s.content ?? s.script ?? '' }))
        // 不恢复图片（太大）
      }
    } catch (error) {
      console.error('恢复 PPT 表单状态失败:', error)
    }
  }

  // 保存表单状态（不保存图片）
  // 兼容 content（面板用）和 script（历史数据）
  const saveFormState = () => {
    try {
      const toSave = {
        stylePrompt: stylePrompt.value,
        aspectRatio: aspectRatio.value,
        slides: slides.value.map((s, i) => ({ index: i, content: s.content ?? s.script ?? '' }))
      }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave))
    } catch (error) {
      console.error('保存 PPT 表单状态失败:', error)
    }
  }

  // 添加脚本卡片
  const addSlide = () => {
    const newIndex = slides.value.length
    slides.value.push({ index: newIndex, script: '' })
    saveFormState()
  }

  // 删除脚本卡片
  const removeSlide = (index) => {
    slides.value = slides.value.filter((_, i) => i !== index).map((s, i) => ({ ...s, index: i }))
    saveFormState()
  }

  // 更新脚本内容
  const updateSlideScript = (index, script) => {
    const slide = slides.value[index]
    if (slide) {
      slide.script = script
      // 触发响应式更新
      slides.value = [...slides.value]
      saveFormState()
    }
  }

  // 更新风格提示词
  const updateStylePrompt = (prompt) => {
    stylePrompt.value = prompt
    saveFormState()
  }

  // 更新画面比例
  const updateAspectRatio = (ratio) => {
    aspectRatio.value = ratio
    saveFormState()
  }

  // 更新风格参考图
  const updateStyleReferenceImages = (images) => {
    styleReferenceImages.value = images
    // 不保存到 localStorage（太大）
  }

  // 创建 PPT 任务
  // 兼容 content（面板用）和 script（历史数据）
  const createPptTask = async () => {
    const validSlides = slides.value
      .map((s, i) => ({ index: i, script: (s.content ?? s.script ?? '').trim() }))
      .filter(s => s.script)
    if (validSlides.length === 0) {
      throw new Error('至少需要一张有内容的脚本卡片')
    }

    const styleUrls = styleReferenceImages.value.map(img => img.content ?? img.base64 ?? img.preview).filter(Boolean)

    const params = {
      stylePrompt: stylePrompt.value,
      aspectRatio: aspectRatio.value,
      slides: validSlides,
      styleUrls
    }

    const data = await pptAPI.generate(params)
    if (data.success && data.task) {
      pptTasks.value.unshift(data.task)
      activePptTaskId.value = data.pptTaskId
      chargedSlidesCount.set(data.pptTaskId, 0)
      startPolling()
      return data.pptTaskId
    }
    throw new Error('创建 PPT 任务失败')
  }

  // 轮询任务状态
  const startPolling = () => {
    if (pollingTimer) return

    const poll = async () => {
      // 页面不可见时暂停轮询，等 visibilityHandler 恢复
      if (!isPageVisible) {
        pollingTimer = null
        return
      }

      // 没有活跃任务时停止轮询
      if (!hasActiveTasks()) {
        pollingTimer = null
        return
      }

      try {
        const data = await pptAPI.getTasks()
        const newTasks = data.tasks || []

        newTasks.forEach(newTask => {
          const idx = pptTasks.value.findIndex(t => t.id === newTask.id)
          if (idx > -1) {
            const oldTask = pptTasks.value[idx]
            
            // 检查新增成功的页数，按页扣费
            if (oldTask.status !== 'succeeded' && newTask.status === 'succeeded') {
              const succeededSlides = newTask.slides?.filter(s => s.status === 'succeeded') || []
              const oldCharged = chargedSlidesCount.get(newTask.id) || 0
              const newSucceededCount = succeededSlides.length
              
              if (newSucceededCount > oldCharged) {
                const toCharge = newSucceededCount - oldCharged
                const cost = toCharge * 1800
                
                if (imageStore.balance >= cost) {
                  imageStore.balance -= cost
                  chargedSlidesCount.set(newTask.id, newSucceededCount)
                  
                  // 延迟同步服务器余额
                  setTimeout(() => imageStore.fetchBalance(), 2000)
                }
              }
            }

            pptTasks.value[idx] = newTask
          } else if (newTask.status === 'pending' || newTask.status === 'running') {
            pptTasks.value.push(newTask)
          }
        })
      } catch (err) {
        console.error('轮询 PPT 任务失败:', err)
      }

      // 轮询完成后再次检查是否还有活跃任务
      if (hasActiveTasks()) {
        pollingTimer = setTimeout(poll, 1500)
      } else {
        pollingTimer = null
      }
    }

    poll()
  }

  const stopPolling = () => {
    if (pollingTimer) {
      clearTimeout(pollingTimer)
      pollingTimer = null
    }
  }

  // 清理资源（组件卸载时调用）
  const cleanup = () => {
    stopPolling()
    if (visibilityHandler && typeof document !== 'undefined') {
      document.removeEventListener('visibilitychange', visibilityHandler)
    }
  }

  // 取消任务
  const cancelPptTask = async (taskId) => {
    try {
      const result = await pptAPI.cancel(taskId)
      if (result.success) {
        const task = pptTasks.value.find(t => t.id === taskId)
        if (task) {
          task.status = 'cancelled'
        }
      } else {
        throw new Error(result.error || '取消失败')
      }
    } catch (error) {
      console.error('取消 PPT 任务失败:', error)
      throw error
    }
  }

  // 重试失败任务
  const retryPptTask = async (taskId) => {
    try {
      const result = await pptAPI.retry(taskId)
      if (result.success && result.task) {
        const idx = pptTasks.value.findIndex(t => t.id === taskId)
        if (idx > -1) {
          pptTasks.value[idx] = result.task
        }
        activePptTaskId.value = taskId
        startPolling()
      } else {
        throw new Error(result.error || '重试失败')
      }
    } catch (error) {
      console.error('重试 PPT 任务失败:', error)
      throw error
    }
  }

  // 单页重新生成
  const regenerateSlide = async (taskId, slideIndex) => {
    try {
      const result = await pptAPI.regenerateSlide(taskId, slideIndex)
      if (result.success && result.task) {
        const idx = pptTasks.value.findIndex(t => t.id === taskId)
        if (idx > -1) {
          pptTasks.value[idx] = result.task
        }
        startPolling()
      } else {
        throw new Error(result.error || '重新生成失败')
      }
    } catch (error) {
      console.error('单页重新生成失败:', error)
      throw error
    }
  }

  // 删除任务
  const deletePptTask = async (taskId) => {
    try {
      const result = await pptAPI.delete(taskId)
      if (result.success) {
        pptTasks.value = pptTasks.value.filter(t => t.id !== taskId)
        if (activePptTaskId.value === taskId) {
          activePptTaskId.value = pptTasks.value.length > 0 ? pptTasks.value[0].id : null
        }
        chargedSlidesCount.delete(taskId)
      } else {
        throw new Error(result.error || '删除失败')
      }
    } catch (error) {
      console.error('删除 PPT 任务失败:', error)
      throw error
    }
  }

  // 获取任务列表
  const fetchPptTasks = async () => {
    try {
      const data = await pptAPI.getTasks()
      pptTasks.value = data.tasks || []
    } catch (error) {
      console.error('获取 PPT 任务列表失败:', error)
    }
  }

  // 当前任务
  const activeTask = computed(() => {
    if (!activePptTaskId.value) return null
    return pptTasks.value.find(t => t.id === activePptTaskId.value)
  })

  // 初始化
  const init = async () => {
    loadFormState()
    await fetchPptTasks()
    
    // 恢复 activePptTaskId：优先选择运行中的任务，其次是最近的任务
    if (!activePptTaskId.value && pptTasks.value.length > 0) {
      const runningTask = pptTasks.value.find(t => t.status === 'running' || t.status === 'pending')
      activePptTaskId.value = runningTask ? runningTask.id : pptTasks.value[0].id
    }
    
    // 有活跃任务时才启动轮询
    if (hasActiveTasks()) {
      startPolling()
    }
  }

  return {
    pptTasks,
    activePptTaskId,
    stylePrompt,
    aspectRatio,
    styleReferenceImages,
    slides,
    activeTask,
    addSlide,
    removeSlide,
    updateSlideScript,
    updateStylePrompt,
    updateAspectRatio,
    updateStyleReferenceImages,
    createPptTask,
    cancelPptTask,
    retryPptTask,
    regenerateSlide,
    deletePptTask,
    fetchPptTasks,
    startPolling,
    stopPolling,
    cleanup,
    saveFormState,
    loadFormState,
    init
  }
})
