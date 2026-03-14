# 多阶段构建 Dockerfile
FROM node:18-alpine AS base

# 安装依赖
FROM base AS deps
WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm ci --only=production

# 构建应用
FROM base AS builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# 生产环境
FROM base AS runner
WORKDIR /app

# 创建非 root 用户
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nodeuser

# 复制文件
COPY --from=builder /app .
RUN chown -R nodeuser:nodejs /app

# 切换到非 root 用户
USER nodeuser

# 暴露端口
EXPOSE 3000

# 健康检查
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD node -e "require('http').get('http://localhost:3000/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# 启动命令
CMD ["node", "server.js"]
