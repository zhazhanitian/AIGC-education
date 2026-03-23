import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const STORAGE_FILE = path.join(__dirname, '..', 'storage', 'ppt_tasks.json')
const TASKS_DIR = path.dirname(STORAGE_FILE)

if (!fs.existsSync(TASKS_DIR)) {
  fs.mkdirSync(TASKS_DIR, { recursive: true })
}

const tasks = new Map()

// 防抖保存：避免批量生图时高频同步写入
let saveTimer = null
const SAVE_DEBOUNCE_MS = 500

const loadTasks = () => {
  if (!fs.existsSync(STORAGE_FILE)) return

  try {
    const raw = fs.readFileSync(STORAGE_FILE, 'utf-8')
    const loaded = JSON.parse(raw)
    const arr = Array.isArray(loaded) ? loaded : []

    arr.forEach(task => {
      // 重启后无法恢复执行：running/pending 标记为 interrupted，支持重试
      if (task.status === 'running' || task.status === 'pending') {
        task.status = 'failed'
        task.error = '服务重启，任务已中断（可重试）'
        task.canRetry = true
        task.progress = 0
      }
      tasks.set(task.id, task)
    })

    console.log(`已从磁盘加载 ${tasks.size} 个 PPT 任务`)
  } catch (error) {
    console.error('加载 PPT 任务失败:', error)
  }
}

// 立即保存（用于关键操作如创建/删除）
const saveTasksSync = () => {
  if (saveTimer) {
    clearTimeout(saveTimer)
    saveTimer = null
  }
  try {
    const data = JSON.stringify(Array.from(tasks.values()), null, 2)
    fs.writeFileSync(STORAGE_FILE, data)
  } catch (error) {
    console.error('保存 PPT 任务失败:', error)
  }
}

// 防抖保存（用于高频更新如进度变化）
const saveTasks = () => {
  if (saveTimer) clearTimeout(saveTimer)
  saveTimer = setTimeout(() => {
    saveTimer = null
    saveTasksSync()
  }, SAVE_DEBOUNCE_MS)
}

loadTasks()

export const createTask = (taskId, params) => {
  const slides = Array.isArray(params.slides) ? params.slides : []

  const task = {
    id: taskId,
    type: 'ppt',
    username: params.username || '匿名',
    stylePrompt: params.stylePrompt || '',
    aspectRatio: params.aspectRatio || '16:9',
    styleUrls: params.styleUrls || [],
    hasStyleReferenceImages: !!(params.styleUrls && params.styleUrls.length > 0),
    slides: slides.map((s, i) => ({
      index: typeof s.index === 'number' ? s.index : i,
      script: s.script || '',
      status: 'pending', // pending, running, succeeded, failed
      error: null,
      imageId: null,
      imageUrl: null
    })),
    status: 'pending', // pending, running, succeeded, failed, cancelled
    progress: 0,
    error: null,
    result: null,
    createdAt: Date.now(),
    updatedAt: Date.now()
  }

  tasks.set(taskId, task)
  saveTasksSync() // 创建任务立即保存
  return task
}

export const updateTask = (taskId, updates) => {
  const task = tasks.get(taskId)
  if (!task) return null

  Object.assign(task, updates, { updatedAt: Date.now() })

  // 终态变更立即保存，进度更新走防抖
  if (updates.status && ['succeeded', 'failed', 'cancelled'].includes(updates.status)) {
    saveTasksSync()
    cleanupTasks()
  } else {
    saveTasks()
  }

  return task
}

export const updateSlide = (taskId, slideIndex, updates) => {
  const task = tasks.get(taskId)
  if (!task) return null

  const idx = task.slides.findIndex(s => s.index === slideIndex)
  if (idx === -1) return null

  Object.assign(task.slides[idx], updates)
  task.updatedAt = Date.now()
  
  // slide 的终态立即保存，其他走防抖
  if (updates.status && ['succeeded', 'failed'].includes(updates.status)) {
    saveTasksSync()
  } else {
    saveTasks()
  }
  return task.slides[idx]
}

export const getTask = (taskId) => tasks.get(taskId) || null

export const getAllTasks = () => Array.from(tasks.values()).sort((a, b) => b.createdAt - a.createdAt)

export const deleteTask = (taskId) => {
  const ok = tasks.delete(taskId)
  if (ok) saveTasksSync() // 删除立即保存
  return ok
}

export const isTaskCancelled = (taskId) => {
  const task = tasks.get(taskId)
  return task?.status === 'cancelled'
}

export const cancelTask = (taskId) => {
  const task = tasks.get(taskId)
  if (!task) return false

  if (task.status === 'pending' || task.status === 'running') {
    task.status = 'cancelled'
    task.updatedAt = Date.now()
    saveTasksSync() // 取消立即保存
    cleanupTasks()
    return true
  }

  return false
}

// 重置失败任务为可重试状态
export const retryTask = (taskId) => {
  const task = tasks.get(taskId)
  if (!task) return null
  if (task.status !== 'failed') return null

  task.status = 'pending'
  task.progress = 0
  task.error = null
  task.canRetry = false
  task.result = null
  task.updatedAt = Date.now()
  // 重置所有 slide 状态
  if (task.slides) {
    task.slides.forEach(s => {
      if (s.status === 'failed' || s.status === 'pending' || s.status === 'running') {
        s.status = 'pending'
        s.error = null
        s.imageId = null
        s.imageUrl = null
      }
    })
  }
  saveTasksSync()
  return task
}

export const cleanupTasks = () => {
  const all = Array.from(tasks.values()).sort((a, b) => b.createdAt - a.createdAt)
  if (all.length <= 50) return

  const toKeep = all.slice(0, 50)
  tasks.clear()
  toKeep.forEach(t => tasks.set(t.id, t))
  saveTasks()
}

export default {
  createTask,
  updateTask,
  updateSlide,
  getTask,
  getAllTasks,
  deleteTask,
  isTaskCancelled,
  cancelTask,
  retryTask,
  cleanupTasks
}

