/**
 * 存储服务抽象层
 * 支持本地存储和云存储（火山引擎TOS/阿里云OSS等S3兼容服务）
 * 通过环境变量 STORAGE_TYPE 切换
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// 存储配置
const STORAGE_TYPE = process.env.STORAGE_TYPE || 'local' // 'local' | 'cloud'
const LOCAL_STORAGE_DIR = path.join(__dirname, '..', 'storage', 'images')

// 云存储配置（火山引擎TOS / 阿里云OSS / AWS S3 兼容）
const CLOUD_CONFIG = {
  endpoint: process.env.CLOUD_ENDPOINT || '',           // 火山引擎: https://tos-cn-beijing.volces.com
  region: process.env.CLOUD_REGION || 'cn-beijing',
  bucket: process.env.CLOUD_BUCKET || '',
  accessKeyId: process.env.CLOUD_ACCESS_KEY || '',
  secretAccessKey: process.env.CLOUD_SECRET_KEY || '',
  cdnDomain: process.env.CLOUD_CDN_DOMAIN || '',        // 可选CDN域名
}

// S3客户端（延迟初始化）
let s3Client = null

/**
 * 获取S3客户端
 */
const getS3Client = () => {
  if (!s3Client && STORAGE_TYPE === 'cloud') {
    if (!CLOUD_CONFIG.endpoint || !CLOUD_CONFIG.bucket || !CLOUD_CONFIG.accessKeyId) {
      throw new Error('云存储配置不完整，请检查环境变量')
    }
    
    s3Client = new S3Client({
      endpoint: CLOUD_CONFIG.endpoint,
      region: CLOUD_CONFIG.region,
      credentials: {
        accessKeyId: CLOUD_CONFIG.accessKeyId,
        secretAccessKey: CLOUD_CONFIG.secretAccessKey,
      },
      forcePathStyle: true, // 火山引擎TOS需要
    })
    console.log('☁️ 云存储客户端已初始化:', CLOUD_CONFIG.endpoint)
  }
  return s3Client
}

/**
 * 确保本地存储目录存在
 */
const ensureLocalDir = () => {
  if (!fs.existsSync(LOCAL_STORAGE_DIR)) {
    fs.mkdirSync(LOCAL_STORAGE_DIR, { recursive: true })
    console.log('📁 创建本地存储目录:', LOCAL_STORAGE_DIR)
  }
}

/**
 * 保存图片
 * @param {Buffer} buffer - 图片数据
 * @param {string} filename - 文件名
 * @returns {Promise<{url: string, storageType: string}>}
 */
export const saveImage = async (buffer, filename) => {
  if (STORAGE_TYPE === 'cloud') {
    return saveToCloud(buffer, filename)
  } else {
    return saveToLocal(buffer, filename)
  }
}

/**
 * 保存到本地
 */
const saveToLocal = async (buffer, filename) => {
  ensureLocalDir()
  const filepath = path.join(LOCAL_STORAGE_DIR, filename)
  fs.writeFileSync(filepath, buffer)
  console.log(`💾 图片已保存到本地: ${filename}`)
  return {
    url: `/storage/images/${filename}`,
    storageType: 'local'
  }
}

/**
 * 保存到云存储
 */
const saveToCloud = async (buffer, filename) => {
  const client = getS3Client()
  const key = `images/${filename}`
  
  try {
    await client.send(new PutObjectCommand({
      Bucket: CLOUD_CONFIG.bucket,
      Key: key,
      Body: buffer,
      ContentType: 'image/png',
      // 设置公开读取
      ACL: 'public-read',
    }))
    
    // 生成访问URL
    let url
    if (CLOUD_CONFIG.cdnDomain) {
      // 使用CDN域名
      url = `https://${CLOUD_CONFIG.cdnDomain}/${key}`
    } else {
      // 使用默认域名
      const endpoint = CLOUD_CONFIG.endpoint.replace('https://', '')
      url = `https://${CLOUD_CONFIG.bucket}.${endpoint}/${key}`
    }
    
    console.log(`☁️ 图片已上传到云存储: ${filename}`)
    return {
      url,
      storageType: 'cloud'
    }
  } catch (error) {
    console.error('☁️ 云存储上传失败，回退到本地存储:', error.message)
    // 云存储失败时回退到本地
    return saveToLocal(buffer, filename)
  }
}

/**
 * 删除图片
 * @param {string} filename - 文件名
 * @param {string} storageType - 存储类型 'local' | 'cloud'
 */
export const deleteImage = async (filename, storageType = 'local') => {
  if (storageType === 'cloud') {
    return deleteFromCloud(filename)
  } else {
    return deleteFromLocal(filename)
  }
}

/**
 * 从本地删除
 */
const deleteFromLocal = async (filename) => {
  const filepath = path.join(LOCAL_STORAGE_DIR, filename)
  if (fs.existsSync(filepath)) {
    fs.unlinkSync(filepath)
    console.log(`🗑️ 本地图片已删除: ${filename}`)
  }
}

/**
 * 从云存储删除
 */
const deleteFromCloud = async (filename) => {
  try {
    const client = getS3Client()
    await client.send(new DeleteObjectCommand({
      Bucket: CLOUD_CONFIG.bucket,
      Key: `images/${filename}`,
    }))
    console.log(`☁️ 云存储图片已删除: ${filename}`)
  } catch (error) {
    console.error('☁️ 云存储删除失败:', error.message)
  }
}

/**
 * 检查图片是否存在（仅本地）
 */
export const imageExists = (filename) => {
  const filepath = path.join(LOCAL_STORAGE_DIR, filename)
  return fs.existsSync(filepath)
}

/**
 * 获取当前存储类型
 */
export const getStorageType = () => STORAGE_TYPE

/**
 * 获取存储配置状态
 */
export const getStorageStatus = () => {
  if (STORAGE_TYPE === 'cloud') {
    return {
      type: 'cloud',
      endpoint: CLOUD_CONFIG.endpoint,
      bucket: CLOUD_CONFIG.bucket,
      cdnDomain: CLOUD_CONFIG.cdnDomain || '无',
      ready: !!(CLOUD_CONFIG.endpoint && CLOUD_CONFIG.bucket && CLOUD_CONFIG.accessKeyId)
    }
  } else {
    return {
      type: 'local',
      directory: LOCAL_STORAGE_DIR,
      ready: true
    }
  }
}

// 启动时打印存储配置
console.log('📦 存储服务初始化:', getStorageStatus())
