#!/bin/bash
# 服务器快速部署脚本
# 用法：./server-deploy.sh <tar.gz文件名>

set -e

# 颜色输出
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

echo ""
echo -e "${BLUE}=========================================${NC}"
echo -e "${BLUE}  🚀 柒子文化官网 - 快速部署脚本${NC}"
echo -e "${BLUE}=========================================${NC}"
echo ""

# 检查参数
if [ -z "$1" ]; then
  echo -e "${RED}❌ 错误：请指定要部署的压缩包文件名${NC}"
  echo ""
  echo "用法：./server-deploy.sh <tar.gz文件名>"
  echo "示例：./server-deploy.sh qizi-website-20240517_143022.tar.gz"
  echo ""
  exit 1
fi

TAR_FILE="$1"
PROJECT_DIR="/root/website"
BACKUP_DIR="/root/website-backups"

# 检查文件存在
if [ ! -f "$TAR_FILE" ]; then
  echo -e "${RED}❌ 文件不存在：$TAR_FILE${NC}"
  exit 1
fi

echo -e "${YELLOW}📦 准备部署文件：${TAR_FILE}${NC}"
echo ""

# ========= 步骤 1: 备份现有版本 =========
echo -e "${YELLOW}📋 步骤 1/6: 备份现有版本...${NC}"
if [ -d "$PROJECT_DIR" ]; then
  mkdir -p "$BACKUP_DIR"
  BACKUP_NAME="backup-$(date +%Y%m%d_%H%M%S).tar.gz"
  echo "  → 创建备份：$BACKUP_NAME"
  tar -czf "$BACKUP_DIR/$BACKUP_NAME" -C "$(dirname $PROJECT_DIR)" "$(basename $PROJECT_DIR)" 2>/dev/null || true
  echo "  ✅ 备份完成"
else
  echo "  → 现有项目不存在，跳过备份"
fi
echo ""

# ========= 步骤 2: 停止旧服务 =========
echo -e "${YELLOW}🛑 步骤 2/6: 停止旧服务...${NC}"
cd "$PROJECT_DIR" 2>/dev/null || true

# 停止 PM2 服务
if command -v pm2 &> /dev/null; then
  echo "  → 停止 PM2 服务..."
  pm2 stop qizi-website 2>/dev/null || true
fi

# 停止所有 node server.js 进程
echo "  → 清理 Node.js 进程..."
pkill -f "node server.js" 2>/dev/null || true
pkill -f "node.*server.js" 2>/dev/null || true

# 等待进程结束
sleep 2
echo "  ✅ 旧服务已停止"
echo ""

# ========= 步骤 3: 解压新文件 =========
echo -e "${YELLOW}📂 步骤 3/6: 解压新文件...${NC}"

# 创建项目目录
mkdir -p "$PROJECT_DIR"
cd "$PROJECT_DIR"

# 删除旧文件（保留 data.db 数据库文件）
echo "  → 清理旧文件（保留数据库）..."
find . -maxdepth 1 ! -name "." ! -name ".." ! -name "server" -exec rm -rf {} \; 2>/dev/null || true
if [ -d "server" ]; then
  mv server/data.db /tmp/data.db.tmp 2>/dev/null || true
  rm -rf server/*
  mkdir -p server
  mv /tmp/data.db.tmp server/data.db 2>/dev/null || true
fi

# 解压新文件
echo "  → 解压：$TAR_FILE"
tar -xzf "/root/$TAR_FILE" -C "$PROJECT_DIR"
echo "  ✅ 解压完成"
echo ""

# ========= 步骤 4: 安装依赖 =========
echo -e "${YELLOW}📦 步骤 4/6: 安装依赖...${NC}"

# 检查 Node.js
if ! command -v node &> /dev/null; then
  echo -e "${RED}❌ Node.js 未安装！请先安装 Node.js${NC}"
  exit 1
fi
echo "  → Node.js 版本：$(node -v)"

# 安装前端依赖
echo "  → 安装前端依赖..."
npm install --production=false

# 安装后端依赖
echo "  → 安装后端依赖..."
cd server
npm install --production=false
cd ..

echo "  ✅ 依赖安装完成"
echo ""

# ========= 步骤 5: 构建前端 =========
echo -e "${YELLOW}🔨 步骤 5/6: 构建前端...${NC}"
npm run build
echo "  ✅ 构建完成"
echo ""

# ========= 步骤 6: 启动服务 =========
echo -e "${YELLOW}🚀 步骤 6/6: 启动服务...${NC}"
cd server

# 检查 PM2
if command -v pm2 &> /dev/null; then
  echo "  → 使用 PM2 启动服务..."
  pm2 restart qizi-website 2>/dev/null || pm2 start server.js --name "qizi-website"
  pm2 save

  # 设置开机自启
  if ! pm2 startup 2>&1 | grep -q "PM2 Startup already"; then
    pm2 startup systemd -u root --hp /root | tail -1 | bash
  fi
else
  echo "  → PM2 未安装，使用后台运行..."
  nohup node server.js > /var/log/qizi-website.log 2>&1 &
  echo $! > /var/run/qizi-website.pid
fi

echo "  ✅ 服务已启动"
echo ""

# ========= 完成 =========
echo -e "${GREEN}=========================================${NC}"
echo -e "${GREEN}  ✅ 部署成功！${NC}"
echo -e "${GREEN}=========================================${NC}"
echo ""

# 等待服务启动
echo -e "${YELLOW}📊 等待服务启动...${NC}"
sleep 4

# 检查服务
echo ""
if command -v pm2 &> /dev/null; then
  echo -e "${BLUE}PM2 状态：${NC}"
  pm2 status
  echo ""
  echo -e "${BLUE}查看日志：${NC} pm2 logs qizi-website"
else
  echo -e "${BLUE}服务状态：${NC}"
  echo "  PID: $(cat /var/run/qizi-website.pid 2>/dev/null || echo "N/A")"
  echo "  日志: /var/log/qizi-website.log"
fi
echo ""

# 检查端口
if curl -s http://localhost:5000 > /dev/null 2>&1; then
  echo -e "${GREEN}✅ 服务运行正常！${NC}"
else
  echo -e "${RED}⚠️  服务可能未正常启动，请检查日志${NC}"
fi
echo ""

echo -e "${YELLOW}📖 访问地址：${NC}"
echo "  本地：http://localhost:5000"
echo "  公网：http://45.77.46.164"
echo ""
