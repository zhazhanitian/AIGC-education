# 🚀 服务器部署稳定性指南

## 问题根因

图片"裂开"的根本原因：
1. **远程URL临时性**：API提供商的图片URL通常24-48小时后过期
2. **本地存储丢失**：服务器重启/迁移后本地图片可能丢失
3. **下载失败**：网络不稳定导致图片未能下载到本地

## ✅ 已实现的稳定性机制

```
代码已包含：
├── 5次重试机制（递增等待：2s, 4s, 6s, 8s, 10s）
├── 60秒下载超时（适应大图片和慢网络）
├── 图片大小验证（防止空文件）
├── 存储服务抽象层（支持本地/云存储切换）
├── 本地URL优先 + 远程URL备用
└── 前端fallback显示"图片已过期"占位符
```

---

## 🔧 部署方案

### 方案1：本地存储（开发/小型应用）

```bash
# 环境变量
STORAGE_TYPE=local

# Docker部署（必须挂载持久卷！）
docker run -d \
  -p 3000:3000 \
  -v /data/nano-banana/storage:/app/storage \
  -e STORAGE_TYPE=local \
  nano-banana-server
```

### 方案2：火山引擎TOS云存储（推荐生产环境）

**优势**：图片永不过期、CDN加速、高可用

#### Step 1: 创建TOS Bucket

1. 登录 [火山引擎控制台](https://console.volcengine.com/)
2. 进入 **对象存储TOS**
3. 创建Bucket，设置：
   - 名称：`nano-banana-images`（自定义）
   - 区域：`cn-beijing`（选择离服务器近的区域）
   - 访问权限：**公共读**

#### Step 2: 获取访问密钥

1. 点击右上角账号 → 密钥管理
2. 创建API密钥，记录 `AccessKey ID` 和 `SecretAccessKey`

#### Step 3: 配置环境变量

```bash
# 存储类型
STORAGE_TYPE=cloud

# 火山引擎TOS配置
CLOUD_ENDPOINT=https://tos-cn-beijing.volces.com
CLOUD_REGION=cn-beijing
CLOUD_BUCKET=nano-banana-images
CLOUD_ACCESS_KEY=AKLTxxxxxxxx
CLOUD_SECRET_KEY=xxxxxxxx

# 可选：CDN加速域名
CLOUD_CDN_DOMAIN=cdn.yourdomain.com
```

#### Step 4: Docker部署

```bash
docker run -d \
  -p 3000:3000 \
  -e STORAGE_TYPE=cloud \
  -e CLOUD_ENDPOINT=https://tos-cn-beijing.volces.com \
  -e CLOUD_REGION=cn-beijing \
  -e CLOUD_BUCKET=nano-banana-images \
  -e CLOUD_ACCESS_KEY=AKLTxxxxxxxx \
  -e CLOUD_SECRET_KEY=xxxxxxxx \
  nano-banana-server
```

#### Step 5: 配置CDN（可选但推荐）

1. 进入火山引擎 **CDN** 控制台
2. 添加加速域名，源站选择TOS Bucket
3. 配置HTTPS证书
4. 设置 `CLOUD_CDN_DOMAIN` 环境变量

---

## 📊 其他云存储配置

### 阿里云OSS

```bash
STORAGE_TYPE=cloud
CLOUD_ENDPOINT=https://oss-cn-hangzhou.aliyuncs.com
CLOUD_REGION=cn-hangzhou
CLOUD_BUCKET=your-bucket
CLOUD_ACCESS_KEY=your-access-key
CLOUD_SECRET_KEY=your-secret-key
```

### 腾讯云COS

```bash
STORAGE_TYPE=cloud
CLOUD_ENDPOINT=https://cos.ap-guangzhou.myqcloud.com
CLOUD_REGION=ap-guangzhou
CLOUD_BUCKET=your-bucket
CLOUD_ACCESS_KEY=your-secret-id
CLOUD_SECRET_KEY=your-secret-key
```

---

## 🔍 故障排查

### 检查存储状态

```bash
# API查看存储状态
curl http://localhost:3000/api/storage/status
```

响应示例：
```json
{
  "success": true,
  "storage": {
    "type": "cloud",
    "endpoint": "https://tos-cn-beijing.volces.com",
    "bucket": "nano-banana-images",
    "cdnDomain": "cdn.example.com",
    "ready": true
  }
}
```

### 常见问题

| 问题 | 原因 | 解决方案 |
|------|------|----------|
| 图片全部裂开 | 本地文件丢失 | 检查持久卷挂载或切换云存储 |
| 云存储上传失败 | 配置错误 | 检查 `CLOUD_*` 环境变量 |
| 新图片裂开 | 下载失败 | 查看日志，检查网络 |
| 部分图片裂开 | 历史图片过期 | 正常现象，已显示占位符 |

### 查看日志

```bash
docker logs <container> | grep -E "(✅|❌|⚠️|☁️|💾)"
```

---

## 🎯 最佳实践

| 场景 | 推荐方案 | 说明 |
|------|----------|------|
| 本地开发 | `STORAGE_TYPE=local` | 简单快速 |
| 小型应用 | 本地存储 + 持久卷 | 成本最低 |
| 生产环境 | 云存储 + CDN | 高可用、快速 |

**关键要点**：
1. 生产环境**必须**使用云存储或持久卷
2. 云存储图片永不过期，彻底解决"图裂开"问题
3. CDN加速可显著提升图片加载速度
