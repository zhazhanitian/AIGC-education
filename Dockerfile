# 约定：Node + pnpm（corepack）
FROM node:24.11.0-alpine AS builder

WORKDIR /app

# 启用 pnpm，并固定版本（避免不同机器拉到不同版本）
RUN corepack enable && corepack prepare pnpm@10.32.1 --activate

# 解决服务器访问 npmjs 不稳定：切换 registry + 增加超时/重试
RUN pnpm config set registry https://registry.npmmirror.com \
  && pnpm config set fetch-retries 5 \
  && pnpm config set fetch-retry-factor 2 \
  && pnpm config set fetch-retry-mintimeout 10000 \
  && pnpm config set fetch-retry-maxtimeout 120000 \
  && pnpm config set fetch-timeout 600000 \
  && pnpm config set network-concurrency 4

# 先复制依赖清单与 lockfile（用于 Docker layer cache）
COPY client/package.json ./client/package.json
COPY client/pnpm-lock.yaml ./client/pnpm-lock.yaml
COPY server/package.json ./server/package.json
COPY server/pnpm-lock.yaml ./server/pnpm-lock.yaml

# 安装依赖（参考你给的做法：先 prod 再 full）
RUN cd client && pnpm install --prod --frozen-lockfile && pnpm install --frozen-lockfile
RUN cd server && pnpm install --prod --frozen-lockfile && pnpm install --frozen-lockfile

# 复制所有源代码
COPY . .

# 构建前端
RUN cd client && pnpm run build

# 运行阶段
FROM node:24.11.0-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

RUN corepack enable && corepack prepare pnpm@10.32.1 --activate
RUN pnpm config set registry https://registry.npmmirror.com \
  && pnpm config set fetch-retries 5 \
  && pnpm config set fetch-retry-factor 2 \
  && pnpm config set fetch-retry-mintimeout 10000 \
  && pnpm config set fetch-retry-maxtimeout 120000 \
  && pnpm config set fetch-timeout 600000 \
  && pnpm config set network-concurrency 4

# 先仅复制 server 的依赖清单与 lockfile 安装生产依赖
COPY server/package.json ./server/package.json
COPY server/pnpm-lock.yaml ./server/pnpm-lock.yaml
RUN cd server && pnpm install --prod --frozen-lockfile

# 再复制后端源码 + 前端构建产物
COPY server ./server
COPY --from=builder /app/client/dist ./client/dist

EXPOSE 3000

RUN mkdir -p /app/server/storage/images

CMD ["node", "server/server.js"]



