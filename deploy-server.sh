#!/bin/bash
# 服务器部署脚本 - 首次部署数据库版本
# 适用于服务器上之前没有数据库的情况

set -e

echo "🚀 开始服务器部署（首次数据库版本）..."
echo ""

# ============= 配置区域 - 请根据您的情况修改 =============
PROJECT_DIR="/path/to/your/project"  # 修改为实际项目路径
PM2_APP_NAME="server"                  # 如果使用PM2，修改为您的应用名
# =======================================================

# 颜色输出
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}==================================================${NC}"
echo -e "${BLUE}  项目目录: $PROJECT_DIR${NC}"
echo -e "${BLUE}==================================================${NC}"
echo ""

echo -e "${YELLOW}📂 进入项目目录...${NC}"
cd "$PROJECT_DIR"

echo -e "${YELLOW}📥 拉取最新代码...${NC}"
git pull

echo -e "${YELLOW}🛑 停止旧服务...${NC}"

# 停止 PM2 服务（如果有）
if command -v pm2 &> /dev/null; then
    echo -e "${YELLOW}→ 停止 PM2 服务...${NC}"
    pm2 stop "$PM2_APP_NAME" 2>/dev/null || true
fi

# 停止所有 node server.js 进程
echo -e "${YELLOW}→ 清理 node 进程...${NC}"
pkill -f "node server.js" 2>/dev/null || true

# 等待进程结束
sleep 2

echo -e "${YELLOW}📦 安装/更新依赖...${NC}"
npm install

echo -e "${YELLOW}🚀 启动服务...${NC}"
cd "$PROJECT_DIR/server"

# 启动方式选择
if command -v pm2 &> /dev/null; then
    echo -e "${YELLOW}→ 使用 PM2 启动...${NC}"
    cd ..
    pm2 restart "$PM2_APP_NAME" 2>/dev/null || pm2 start server.js --name "$PM2_APP_NAME"
else
    echo -e "${YELLOW}→ 后台直接运行...${NC}"
    node server.js &
    echo $! > "$PROJECT_DIR/server.pid"
fi

echo ""
echo -e "${GREEN}✅ 部署完成！${NC}"
echo ""
echo -e "${YELLOW}📊 等待服务启动...${NC}"
sleep 4

# 检查服务
if curl -s http://localhost:5000 > /dev/null 2>&1; then
    echo -e "${GREEN}✅ 服务运行正常！访问 http://localhost:5000${NC}"
else
    echo -e "${RED}⚠️  服务可能未正常启动，请检查日志${NC}"
fi

echo ""
echo -e "${BLUE}📝 提示：${NC}"
echo -e "  • 如果使用 PM2，查看日志: ${YELLOW}pm2 logs${NC}"
echo -e "  • 如果直接运行，查看输出: ${YELLOW}cd server && node server.js${NC}"
echo ""