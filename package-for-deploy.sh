#!/bin/bash
# 项目打包脚本 - 用于部署前准备

set -e

echo "📦 开始打包项目..."

# 文件名称
PACKAGE_NAME="qizi-website-$(date +%Y%m%d_%H%M%S).tar.gz"

# 排除不需要上传的文件
EXCLUDES=(
  "node_modules"
  ".git"
  ".DS_Store"
  "*.log"
  "server/data.db"
  "server/data.db-shm"
  "server/data.db-wal"
  ".env"
  "dist"
  "*.tar.gz"
  "*.zip"
)

# 构建排除参数
EXCLUDE_ARGS=""
for EXCLUDE in "${EXCLUDES[@]}"; do
  EXCLUDE_ARGS="$EXCLUDE_ARGS --exclude=$EXCLUDE"
done

# 执行打包
echo "📁 正在打包（排除不必要文件）..."
cd /workspace
tar $EXCLUDE_ARGS -czf "$PACKAGE_NAME" ./*

# 显示文件信息
echo ""
echo "✅ 打包完成！"
echo ""
echo "📄 文件名: $PACKAGE_NAME"
echo "📊 大小: $(du -h "$PACKAGE_NAME" | cut -f1)"
echo "📍 位置: $(pwd)/$PACKAGE_NAME"
echo ""
echo "📝 下一步："
echo "  1. 上传此文件到服务器"
echo "  2. 在服务器上解压部署"
