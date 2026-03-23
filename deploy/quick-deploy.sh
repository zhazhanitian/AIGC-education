#!/bin/bash

# ====================================================
# Nano Banana Pro - 火山引擎快速部署脚本 v2.0
# 支持云存储模式（火山引擎TOS）
# 使用方法: bash quick-deploy.sh 你的域名.com
# ====================================================

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}"
echo "╔════════════════════════════════════════════════════════╗"
echo "║     🍌 Nano Banana Pro - 快速部署脚本 v2.0             ║"
echo "║         支持云存储（火山引擎TOS）                       ║"
echo "╚════════════════════════════════════════════════════════╝"
echo -e "${NC}"

# 获取域名
DOMAIN=${1:-""}
if [ -z "$DOMAIN" ]; then
    read -p "请输入你的域名 (例如: example.com): " DOMAIN
fi

if [ -z "$DOMAIN" ]; then
    echo -e "${RED}错误: 域名不能为空！${NC}"
    exit 1
fi

echo -e "${GREEN}域名: ${DOMAIN}${NC}"
echo ""

# 询问存储模式
echo -e "${YELLOW}选择存储模式:${NC}"
echo "  1) 本地存储 (适合测试/小型应用)"
echo "  2) 云存储 TOS (推荐生产环境，图片永不过期)"
read -p "请选择 [1/2] (默认1): " STORAGE_MODE
STORAGE_MODE=${STORAGE_MODE:-1}

if [ "$STORAGE_MODE" = "2" ]; then
    echo ""
    echo -e "${YELLOW}配置火山引擎TOS云存储:${NC}"
    read -p "TOS端点 (如 https://tos-cn-beijing.volces.com): " CLOUD_ENDPOINT
    read -p "区域 (如 cn-beijing): " CLOUD_REGION
    read -p "Bucket名称: " CLOUD_BUCKET
    read -p "AccessKey ID: " CLOUD_ACCESS_KEY
    read -sp "SecretAccessKey: " CLOUD_SECRET_KEY
    echo ""
    read -p "CDN域名 (可选，直接回车跳过): " CLOUD_CDN_DOMAIN
    STORAGE_TYPE="cloud"
else
    STORAGE_TYPE="local"
fi

echo ""

# 1. 系统更新
echo -e "${YELLOW}[1/8] 更新系统...${NC}"
apt update && apt upgrade -y

# 2. 安装依赖
echo -e "${YELLOW}[2/8] 安装必要软件...${NC}"
apt install -y curl git nginx certbot python3-certbot-nginx unzip

# 3. 安装 Node.js
echo -e "${YELLOW}[3/8] 安装 Node.js 18...${NC}"
if ! command -v node &> /dev/null; then
    curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
    apt install -y nodejs
fi
echo "Node.js 版本: $(node -v)"
echo "npm 版本: $(npm -v)"

# 4. 安装 PM2
echo -e "${YELLOW}[4/8] 安装 PM2...${NC}"
npm install -g pm2

# 5. 清理旧项目并创建新目录
echo -e "${YELLOW}[5/8] 清理旧项目...${NC}"
pm2 delete nano-banana 2>/dev/null || true
rm -rf /var/www/nanobanana
mkdir -p /var/www/nanobanana
cd /var/www/nanobanana

# 检查是否已有代码
if [ ! -f "server/server.js" ]; then
    echo -e "${YELLOW}请上传项目代码到 /var/www/nanobanana 目录${NC}"
    echo -e "${YELLOW}可使用以下命令上传:${NC}"
    echo "scp nanobanana-deploy.zip root@服务器IP:/var/www/"
    echo "unzip /var/www/nanobanana-deploy.zip -d /var/www/nanobanana"
    echo ""
    echo -e "${YELLOW}上传完成后，再次运行此脚本${NC}"
    exit 0
fi

# 6. 安装依赖
echo -e "${YELLOW}[6/8] 安装依赖...${NC}"
npm install 2>/dev/null || true
cd server && npm install && cd ..

# 配置环境变量
echo -e "${YELLOW}配置环境变量...${NC}"

# 询问 Nano Banana API 配置
read -p "NANO_BANANA_HOST (默认 https://grsai.dakka.com.cn): " NANO_BANANA_HOST
NANO_BANANA_HOST=${NANO_BANANA_HOST:-https://grsai.dakka.com.cn}
read -p "NANO_BANANA_MODEL (默认 nano-banana-fast): " NANO_BANANA_MODEL
NANO_BANANA_MODEL=${NANO_BANANA_MODEL:-nano-banana-fast}
read -sp "NANO_BANANA_API_KEY: " NANO_BANANA_API_KEY
echo ""

cat > server/.env << EOF
PORT=3000
NODE_ENV=production

NANO_BANANA_HOST=${NANO_BANANA_HOST}
NANO_BANANA_API_KEY=${NANO_BANANA_API_KEY}
NANO_BANANA_MODEL=${NANO_BANANA_MODEL}

# 存储配置
STORAGE_TYPE=${STORAGE_TYPE}
EOF

# 如果是云存储模式，添加额外配置
if [ "$STORAGE_TYPE" = "cloud" ]; then
    cat >> server/.env << EOF
CLOUD_ENDPOINT=${CLOUD_ENDPOINT}
CLOUD_REGION=${CLOUD_REGION}
CLOUD_BUCKET=${CLOUD_BUCKET}
CLOUD_ACCESS_KEY=${CLOUD_ACCESS_KEY}
CLOUD_SECRET_KEY=${CLOUD_SECRET_KEY}
CLOUD_CDN_DOMAIN=${CLOUD_CDN_DOMAIN}
EOF
    echo -e "${GREEN}✅ 已配置云存储模式 (TOS)${NC}"
else
    echo -e "${GREEN}✅ 已配置本地存储模式${NC}"
fi

# 确保存储目录存在
mkdir -p /var/www/nanobanana/server/storage/images

# 7. 配置 Nginx
echo -e "${YELLOW}[7/8] 配置 Nginx...${NC}"
cat > /etc/nginx/sites-available/nanobanana << EOF
server {
    listen 80;
    server_name ${DOMAIN} www.${DOMAIN};

    # 前端静态文件
    location / {
        root /var/www/nanobanana/client/dist;
        index index.html;
        try_files \$uri \$uri/ /index.html;
    }

    # API 代理
    location /api/ {
        proxy_pass http://127.0.0.1:3000/api/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_cache_bypass \$http_upgrade;
        proxy_read_timeout 300s;
        proxy_send_timeout 300s;
    }

    # 静态资源缓存
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)\$ {
        root /var/www/nanobanana/client/dist;
        expires 30d;
        add_header Cache-Control "public, immutable";
    }

    # 图片存储（本地存储模式需要）
    location /storage/ {
        alias /var/www/nanobanana/server/storage/;
        expires 7d;
    }

    client_max_body_size 50M;
}
EOF

# 启用配置
ln -sf /etc/nginx/sites-available/nanobanana /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default
nginx -t && systemctl restart nginx
systemctl enable nginx

# 8. 启动应用
echo -e "${YELLOW}[8/8] 启动应用...${NC}"
cd /var/www/nanobanana/server
pm2 delete nano-banana 2>/dev/null || true
pm2 start server.js --name nano-banana
pm2 save
pm2 startup systemd -u root --hp /root

echo ""
echo -e "${GREEN}╔════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║              🎉 部署完成！                              ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "📌 应用地址: ${BLUE}http://${DOMAIN}${NC}"
echo -e "📦 存储模式: ${BLUE}${STORAGE_TYPE}${NC}"
echo ""
echo -e "${YELLOW}下一步操作:${NC}"
echo "1. 配置 DNS 解析: 将 ${DOMAIN} 指向此服务器IP"
echo "2. 配置 HTTPS: certbot --nginx -d ${DOMAIN}"
echo ""
echo -e "${YELLOW}常用命令:${NC}"
echo "  pm2 status        # 查看状态"
echo "  pm2 logs          # 查看日志"
echo "  pm2 restart all   # 重启应用"
echo ""
