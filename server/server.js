// Debug PPT errors
import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'
import fs from 'fs'
import zlib from 'zlib'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// 加载 .env 文件（从 server 目录）
dotenv.config({ path: path.join(__dirname, '.env') })

import imageRoutes from './routes/images.js'
import authRoutes from './routes/auth.js'
import searchRoutes from './routes/search.js'
import pptRoutes from './routes/ppt.js'

const app = express()
const PORT = process.env.PORT || 3000

// 确保存储目录存在
const STORAGE_DIR = path.join(__dirname, 'storage', 'images')
if (!fs.existsSync(STORAGE_DIR)) {
  fs.mkdirSync(STORAGE_DIR, { recursive: true })
}

app.use(cors())
app.use(express.json({ limit: '50mb' }))
app.use(express.urlencoded({ extended: true, limit: '50mb' }))

// 静态文件服务 - 带缓存
app.use('/storage', express.static(path.join(__dirname, 'storage'), {
  maxAge: '7d',           // 图片缓存 7 天
  etag: true,
  lastModified: true
}))

// 路由
app.use('/api', imageRoutes)
app.use('/api', authRoutes)
app.use('/api', searchRoutes)
app.use('/api', pptRoutes)

// 健康检查
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: Date.now() })
})

// 前端静态文件服务
app.use(express.static(path.join(__dirname, '../client/dist')))
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../client/dist/index.html'))
})

app.listen(PORT, () => {
  console.log(`🚀 服务器运行在 http://localhost:${PORT}`)
})


