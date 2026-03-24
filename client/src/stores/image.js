import { defineStore } from 'pinia'
import { ref } from 'vue'
import { imageAPI, taskAPI } from '../api'

export const useImageStore = defineStore('image', () => {
  const images = ref([])
  const loading = ref(false)
  const error = ref(null)
  const tasks = ref([])
  const balance = ref(0)
  const lastServerBalance = ref(0)
  let pollingTimer = null
  let isPageVisible = true

  // 页面可见性监听 - 不可见时暂停轮询，节省资源
  if (typeof document !== 'undefined') {
    document.addEventListener('visibilitychange', () => {
      isPageVisible = !document.hidden
    })
  }

  // 表单状态持久化
  const formState = ref({
    prompt: '',
    aspectRatio: 'auto',
    imageSize: '4K',
    referenceImages: []
  })

  // 从localStorage恢复表单状态
  const loadFormState = () => {
    try {
      const saved = localStorage.getItem('nano-banana-form-state')
      if (saved) {
        const parsed = JSON.parse(saved)
        formState.value = { ...formState.value, ...parsed }
      }
    } catch (error) {
      console.error('恢复表单状态失败:', error)
    }
  }

  // 保存表单状态到localStorage
  const saveFormState = (state) => {
    try {
      formState.value = { ...formState.value, ...state }
      // 只保存基本字段，不保存referenceImages（太大）
      const toSave = {
        prompt: formState.value.prompt,
        aspectRatio: formState.value.aspectRatio,
        imageSize: formState.value.imageSize
      }
      localStorage.setItem('nano-banana-form-state', JSON.stringify(toSave))
    } catch (error) {
      console.error('保存表单状态失败:', error)
    }
  }

  // 更新表单状态（包含参考图）
  const updateFormState = (state) => {
    formState.value = { ...formState.value, ...state }
  }

  // 获取图片列表
  const fetchImages = async (silent = false) => {
    if (!silent) loading.value = true
    error.value = null
    try {
      const data = await imageAPI.getList()
      images.value = data.images || []
    } catch (err) {
      console.error('获取图片列表失败:', err)
      error.value = '加载失败，请检查网络'
    } finally {
      if (!silent) loading.value = false
    }
  }

  // 获取任务列表
  const fetchTasks = async () => {
    try {
      const data = await taskAPI.getAll()
      tasks.value = data.tasks || []
    } catch (error) {
      console.error('获取任务列表失败:', error)
    }
  }

  // 获取余额
  const fetchBalance = async () => {
    try {
      const data = await imageAPI.getBalance()
      if (data.success) {
        const serverVal = data.balance
        
        // 智能更新策略：
        // 1. 如果是初次加载，或者服务器值变了，直接更新
        if (lastServerBalance.value === 0 || serverVal !== lastServerBalance.value) {
          balance.value = serverVal
          lastServerBalance.value = serverVal
        } 
        // 2. 如果服务器值没变，但本地已经预扣费了（本地值 < 服务器值），则保持本地值
        //    这避免了API延迟导致的数值回跳
        else if (balance.value < serverVal) {
          // 保持本地预扣费状态，等待服务器真正扣费后（值变化）再同步
        }
        // 3. 其他情况（如手动刷新），如果值一样，也没必要动
      }
    } catch (error) {
      console.error('获取余额失败:', error)
    }
  }

  // 启动轮询
  const startPolling = () => {
    if (pollingTimer) return
    
    fetchBalance()
    
    const poll = async () => {
      // 页面不可见时跳过轮询
      if (!isPageVisible) {
        pollingTimer = setTimeout(poll, 2000)
        return
      }
      
      const activeTasks = tasks.value.filter(t => 
        t.status === 'pending' || t.status === 'running'
      )
      
      // 无活跃任务时使用更长间隔
      if (activeTasks.length === 0) {
        pollingTimer = setTimeout(poll, 3000)
        return
      }
      
      try {
        const data = await taskAPI.getAll()
        const newTasks = data.tasks || []
        
        let hasSucceeded = false
        newTasks.forEach(newTask => {
          const index = tasks.value.findIndex(t => t.id === newTask.id)
          if (index > -1) {
            const oldTask = tasks.value[index]
            
            if (oldTask.status !== 'succeeded' && newTask.status === 'succeeded') {
              hasSucceeded = true
              
              if (balance.value >= 1800) {
                balance.value -= 1800
              }
              
              if (newTask.result && newTask.result.images) {
                images.value.unshift(...newTask.result.images)
              } else {
                fetchImages(true)
              }
              
              setTimeout(() => removeTask(newTask.id), 5000)
            }
            
            tasks.value[index] = newTask
          } else if (newTask.status === 'pending' || newTask.status === 'running') {
            tasks.value.push(newTask)
          }
        })
        
        if (hasSucceeded) {
          fetchBalance()
          setTimeout(() => fetchBalance(), 2000)
        }
      } catch (err) {
        console.error('轮询任务失败:', err)
      }
      
      // 有活跃任务时快速轮询
      pollingTimer = setTimeout(poll, 800)
    }
    
    poll()
  }

  // 停止轮询
  const stopPolling = () => {
    if (pollingTimer) {
      clearTimeout(pollingTimer)
      pollingTimer = null
    }
  }

  // 创建任务
  const createTask = async (params) => {
    try {
      const data = await imageAPI.generate(params)
      
      if (data.task) {
        tasks.value.unshift(data.task)
      }
      
      // 延迟刷新余额（API调用后积分可能需要时间扣除）
      // 注意：即便这里刷新了，如果API没变，fetchBalance的智能策略会保护本地预扣费的值
      setTimeout(() => fetchBalance(), 500)
      setTimeout(() => fetchBalance(), 2000)
      
      // 确保轮询运行
      startPolling()
      
      return data.taskId
    } catch (error) {
      console.error('创建任务失败:', error)
      throw error
    }
  }

  // 取消任务
  const cancelTask = async (taskId) => {
    try {
      await taskAPI.cancel(taskId)
      
      const task = tasks.value.find(t => t.id === taskId)
      if (task) {
        task.status = 'cancelled'
      }
    } catch (error) {
      console.error('取消任务失败:', error)
      throw error
    }
  }

  // 移除任务
  const removeTask = async (taskId) => {
    try {
      await taskAPI.delete(taskId)
    } catch (error) {
      // 忽略删除失败
    }
    
    const index = tasks.value.findIndex(t => t.id === taskId)
    if (index > -1) {
      tasks.value.splice(index, 1)
    }
  }

  // 重试任务
  const retryTask = async (taskId) => {
    const task = tasks.value.find(t => t.id === taskId)
    if (!task) return

    const params = {
      prompt: task.prompt,
      aspectRatio: task.aspectRatio,
      imageSize: task.imageSize,
      urls: task.urls || [] // 包含参考图
    }

    // 先移除旧任务
    await removeTask(taskId)
    
    // 创建新任务
    await createTask(params)
  }

  // 删除图片
  const deleteImage = async (id) => {
    try {
      await imageAPI.delete(id)
      images.value = images.value.filter(img => img.id !== id)
    } catch (error) {
      console.error('删除图片失败:', error)
      throw error
    }
  }

  // 初始化
  const init = async () => {
    // 强制重置
    lastServerBalance.value = 0
    await Promise.all([fetchImages(), fetchTasks()])
    startPolling()
  }

  return {
    images,
    loading,
    error,
    tasks,
    formState,
    fetchImages,
    fetchTasks,
    createTask,
    cancelTask,
    removeTask,
    retryTask,
    deleteImage,
    init,
    startPolling,
    stopPolling,
    loadFormState,
    saveFormState,
    updateFormState,
    fetchBalance,
    balance,
    lastServerBalance // 暴露出来方便调试
  }
})
