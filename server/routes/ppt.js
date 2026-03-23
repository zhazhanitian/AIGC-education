import express from 'express'
import {
  generatePpt,
  getPptTasks,
  getPptTaskById,
  cancelPptTask,
  retryPptTask,
  regenerateSlide,
  deletePptTaskById
} from '../controllers/pptController.js'

const router = express.Router()

// 创建 AI PPT 批量生图任务
router.post('/ppt/generate', generatePpt)

// 任务列表 / 详情
router.get('/ppt/tasks', getPptTasks)
router.get('/ppt/tasks/:id', getPptTaskById)

// 取消 / 重试 / 单页重新生成 / 删除
router.post('/ppt/tasks/:id/cancel', cancelPptTask)
router.post('/ppt/tasks/:id/retry', retryPptTask)
router.post('/ppt/tasks/:id/slides/:slideIndex/regenerate', regenerateSlide)
router.delete('/ppt/tasks/:id', deletePptTaskById)

export default router

