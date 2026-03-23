# 🚀 Nano Banana Pro - 火山引擎部署指南

## 📋 部署前准备

### 1. 账号准备
- 火山引擎账号（已实名认证）
- 域名（已备案，中国大陆服务器必须）

### 2. 推荐配置
| 配置项 | 推荐值 |
|--------|--------|
| 实例规格 | ecs.g3i.large (2核4G) 或 ecs.g3i.small (1核2G) |
| 系统镜像 | Ubuntu 22.04 LTS |
| 系统盘 | 40GB SSD |
| 带宽 | 按量付费 5Mbps 或 固定带宽 3Mbps |
| 地域 | 华北2(北京) 或就近选择 |

---

## 🖥️ 第一步：创建云服务器实例

### 1.1 登录火山引擎控制台
访问：https://console.volcengine.com/

### 1.2 创建 ECS 实例
1. 进入「云服务器 ECS」→「实例」→「创建实例」
2. 选择配置：
   - **计费方式**：按量付费（测试）或 包年包月（生产）
   - **地域**：华北2(北京) 或就近
   - **规格**：通用型 g3i.large (2核4G)
   - **镜像**：Ubuntu 22.04 LTS
   - **系统盘**：40GB SSD
   - **网络**：选择或创建 VPC
   - **公网IP**：勾选「分配公网IP」
   - **带宽**：5Mbps 按量付费

### 1.3 配置安全组
在安全组中开放以下端口：

| 端口 | 协议 | 说明 |
|------|------|------|
| 22 | TCP | SSH 远程连接 |
| 80 | TCP | HTTP |
| 443 | TCP | HTTPS |
| 3000 | TCP | 应用端口（可选，Nginx代理后可关闭）|

### 1.4 设置登录凭证
- 选择「密钥对」（推荐）或「密码」登录
- 如选择密码，请设置强密码

### 1.5 创建完成
记录服务器的 **公网IP地址**

---

## 🔧 第二步：连接服务器并部署

### 2.1 SSH 连接服务器
```bash
# Windows PowerShell / Mac Terminal
ssh root@你的服务器公网IP

# 如果使用密钥对
ssh -i your-key.pem root@你的服务器公网IP
```

### 2.2 一键部署脚本
连接后，复制以下命令执行：

```bash
# 更新系统
apt update && apt upgrade -y

# 安装必要工具
apt install -y curl git nginx certbot python3-certbot-nginx

# 安装 Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
apt install -y nodejs

# 验证安装
node -v  # 应显示 v18.x.x
npm -v

# 安装 PM2 进程管理器
npm install -g pm2

# 创建项目目录
mkdir -p /var/www
cd /var/www

# 克隆项目（或上传代码）
# 方式1: 从 Git 仓库克隆
# git clone https://你的仓库地址.git nanobanana

# 方式2: 上传压缩包后解压（推荐）
# 先在本地执行: scp nanobanana-deploy.zip root@服务器IP:/var/www/
# 然后在服务器执行:
# unzip nanobanana-deploy.zip -d nanobanana
```

### 2.3 部署应用
```bash
cd /var/www/nanobanana

# 安装依赖
npm install
cd server && npm install && cd ..
cd client && npm install && cd ..

# 构建前端
cd client && npm run build && cd ..

# 配置环境变量
cat > server/.env << 'EOF'
PORT=3000
NODE_ENV=production

# 后端读取的是 NANO_BANANA_*（见 server/services/apiService.js）
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
EOF

# 启动后端服务
cd server
pm2 start server.js --name nano-banana
pm2 save
pm2 startup
```

---

## 🌐 第三步：配置 Nginx 反向代理

### 3.1 创建 Nginx 配置
```bash
cat > /etc/nginx/sites-available/nanobanana << 'EOF'
server {
    listen 80;
    server_name 你的域名.com www.你的域名.com;  # 替换为你的域名

    # 前端静态文件
    location / {
        root /var/www/nanobanana/client/dist;
        index index.html;
        try_files $uri $uri/ /index.html;
    }

    # API 代理到后端
    location /api/ {
        proxy_pass http://127.0.0.1:3000/api/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 300s;
        proxy_send_timeout 300s;
    }

    # 静态资源缓存
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        root /var/www/nanobanana/client/dist;
        expires 30d;
        add_header Cache-Control "public, immutable";
    }

    # 图片存储目录
    location /storage/ {
        alias /var/www/nanobanana/server/storage/;
        expires 7d;
    }

    # 上传大小限制
    client_max_body_size 50M;
}
EOF
```

### 3.2 启用配置
```bash
# 创建软链接
ln -s /etc/nginx/sites-available/nanobanana /etc/nginx/sites-enabled/

# 删除默认配置
rm -f /etc/nginx/sites-enabled/default

# 测试配置
nginx -t

# 重启 Nginx
systemctl restart nginx
systemctl enable nginx
```

---

## 🔒 第四步：配置 HTTPS（SSL证书）

### 4.1 使用 Let's Encrypt 免费证书
```bash
# 申请证书（替换为你的域名）
certbot --nginx -d 你的域名.com -d www.你的域名.com

# 按提示操作：
# - 输入邮箱
# - 同意条款
# - 选择是否重定向 HTTP 到 HTTPS（推荐选是）
```

### 4.2 自动续期
```bash
# 测试自动续期
certbot renew --dry-run

# 添加定时任务（每天检查）
echo "0 0 * * * root certbot renew --quiet" >> /etc/crontab
```

---

## 🌍 第五步：配置域名解析

### 5.1 登录火山引擎域名控制台
访问：https://console.volcengine.com/dns/

### 5.2 添加解析记录
| 记录类型 | 主机记录 | 记录值 | TTL |
|---------|---------|--------|-----|
| A | @ | 你的服务器公网IP | 600 |
| A | www | 你的服务器公网IP | 600 |

### 5.3 等待生效
DNS 解析通常 5-10 分钟生效，最长 48 小时

---

## ✅ 第六步：验证部署

### 6.1 检查服务状态
```bash
# 检查 PM2 进程
pm2 status

# 检查 Nginx 状态
systemctl status nginx

# 查看应用日志
pm2 logs nano-banana
```

### 6.2 访问测试
- HTTP: http://你的域名.com
- HTTPS: https://你的域名.com

---

## 🔧 常用运维命令

```bash
# 查看日志
pm2 logs nano-banana

# 重启应用
pm2 restart nano-banana

# 停止应用
pm2 stop nano-banana

# 重新部署
cd /var/www/nanobanana
git pull  # 或重新上传代码
cd client && npm run build && cd ..
pm2 restart nano-banana

# 重启 Nginx
systemctl restart nginx

# 查看 Nginx 错误日志
tail -f /var/log/nginx/error.log
```

---

## 🚨 常见问题排查

### 问题1: 502 Bad Gateway
```bash
# 检查后端是否运行
pm2 status
pm2 logs nano-banana

# 重启后端
pm2 restart nano-banana
```

### 问题2: 静态资源 404
```bash
# 检查前端构建
ls -la /var/www/nanobanana/client/dist/

# 重新构建
cd /var/www/nanobanana/client
npm run build
```

### 问题3: API 超时
```bash
# 检查 Nginx 代理配置
nginx -t

# 增加超时时间（在 location /api/ 中）
proxy_read_timeout 600s;
proxy_send_timeout 600s;
```

### 问题4: 域名无法访问
- 检查 DNS 解析是否生效：`ping 你的域名.com`
- 检查安全组是否开放 80/443 端口
- 检查备案状态（中国大陆服务器必须备案）

---

## 📞 部署支持

如遇问题，检查以下日志：
- 应用日志：`pm2 logs nano-banana`
- Nginx 日志：`/var/log/nginx/error.log`
- 系统日志：`journalctl -xe`
