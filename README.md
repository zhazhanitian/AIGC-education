# Nano Banana Pro - AIGC生图平台

## 安装依赖

```bash
npm run install:all
```

## 开发运行

```bash
npm run dev
```

前端运行在 http://localhost:5176
后端运行在 http://localhost:3000

## API 配置

在 `server/` 目录下创建 `.env` 文件：

```
# 本地开发建议：直接用 3000，前端 Vite 已代理到 3000
PORT=3000

# 后端实际读取的是 NANO_BANANA_*（见 server/services/apiService.js）
NANO_BANANA_HOST=https://grsai.dakka.com.cn
NANO_BANANA_API_KEY=你的API密钥
NANO_BANANA_MODEL=nano-banana-fast

# 可选：联网搜索
# SERPER_API_KEY=你的SERPER密钥

# 可选：存储（生产建议 cloud 或者做持久化挂载）
# STORAGE_TYPE=local
# STORAGE_TYPE=cloud
# CLOUD_ENDPOINT=https://tos-cn-beijing.volces.com
# CLOUD_REGION=cn-beijing
# CLOUD_BUCKET=your-bucket-name
# CLOUD_ACCESS_KEY=your-access-key-id
# CLOUD_SECRET_KEY=your-secret-access-key
# CLOUD_CDN_DOMAIN=cdn.yourdomain.com
```

API 文档: https://grsai.ai/zh/dashboard/documents/nano-banana

## 目录结构

```
├── client/          # 前端Vue3应用
│   ├── src/
│   │   ├── api/     # API接口
│   │   ├── components/  # 组件
│   │   ├── stores/      # 状态管理
│   │   ├── styles/      # 样式
│   │   └── views/       # 页面
├── server/          # 后端Node.js应用
│   ├── controllers/ # 控制器
│   ├── routes/      # 路由
│   ├── services/    # 服务
│   └── storage/     # 图片存储
```

