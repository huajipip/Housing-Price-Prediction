# ============================================================
# Dockerfile — Next.js 统一门户前端（多阶段构建）
#
# 阶段 1（deps）：仅复制 package.json，安装依赖（利用层缓存）
# 阶段 2（builder）：复制源码，执行 next build
# 阶段 3（runner）：仅复制 standalone 输出 + 静态资源，最小化镜像
#
# 使用方式：
#   docker build -t portal .
#   docker run -p 3000:3000 -e NEXT_PUBLIC_APP1_URL=http://app1-backend:8001 -e NEXT_PUBLIC_APP2_URL=http://app2-backend:8002 portal
# ============================================================

# ---- 依赖安装阶段 ----
FROM node:24-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --omit=dev

# ---- 构建阶段 ----
FROM node:24-alpine AS builder
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build

# ---- 运行阶段 ----
FROM node:24-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# 创建非 root 用户
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# 复制 standalone 输出
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public

USER nextjs

EXPOSE 3000

CMD ["node", "server.js"]
