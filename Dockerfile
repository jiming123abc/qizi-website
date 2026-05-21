FROM node:18-alpine AS builder

WORKDIR /app

# 复制 package 文件
COPY package*.json ./
RUN npm ci

# 复制源代码并构建
COPY . .
RUN npm run build

# 生产阶段
FROM node:18-alpine

WORKDIR /app

# 安装生产依赖
COPY package*.json ./
RUN npm ci --only=production

# 复制构建产物
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/public ./public
COPY --from=builder /app/index.html ./
COPY --from=builder /app/share.html ./
COPY --from=builder /app/server ./server

# 确保上传目录存在
RUN mkdir -p /app/server/data /app/public/uploads/images /app/public/uploads/videos

# 暴露端口
EXPOSE 5000

# 启动服务器
CMD ["node", "server/server.js"]
