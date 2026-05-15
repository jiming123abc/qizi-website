#!/bin/bash

echo "=========================================="
echo " AI Studio 部署脚本"
echo "=========================================="

# 检查是否以root身份运行
if [ "$(id -u)" != "0" ]; then
    echo "请以root身份运行此脚本"
    exit 1
fi

# 参数检查
if [ -z "$1" ]; then
    echo "用法: $0 <域名>"
    exit 1
fi

DOMAIN=$1

echo ""
echo "步骤1: 更新系统和安装依赖"
echo "------------------------"

apt update && apt upgrade -y
apt install -y nodejs npm nginx git

echo ""
echo "步骤2: 安装PM2进程管理器"
echo "------------------------"

npm install -g pm2

echo ""
echo "步骤3: 克隆项目代码"
echo "------------------------"

cd /var/www
git clone https://github.com/your-repo/ai-studio.git
cd ai-studio

echo ""
echo "步骤4: 安装依赖并构建"
echo "------------------------"

npm install
npm run build

cd server
npm install
cd ..

echo ""
echo "步骤5: 创建环境变量文件"
echo "------------------------"

cat > .env << EOF
REACT_APP_OSS_ACCESS_KEY_ID="您的OSS AccessKeyId"
REACT_APP_OSS_ACCESS_KEY_SECRET="您的OSS AccessKeySecret"
REACT_APP_OSS_BUCKET="qizi-store"
REACT_APP_OSS_REGION="oss-cn-beijing"
REACT_APP_API_URL="https://${DOMAIN}/api"
EOF

echo "⚠️  请手动编辑 .env 文件，填入正确的阿里云凭证"

echo ""
echo "步骤6: 配置Nginx"
echo "------------------------"

cat > /etc/nginx/sites-available/ai-studio << EOF
server {
    listen 80;
    server_name ${DOMAIN};

    # 前端静态文件
    location / {
        root /var/www/ai-studio/dist;
        try_files \$uri \$uri/ /index.html;
    }

    # API代理
    location /api/ {
        proxy_pass http://localhost:5000/;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }

    # 安全头部
    add_header X-Frame-Options "SAMEORIGIN";
    add_header X-XSS-Protection "1; mode=block";
    add_header X-Content-Type-Options "nosniff";
}
EOF

ln -sf /etc/nginx/sites-available/ai-studio /etc/nginx/sites-enabled/
nginx -t && systemctl reload nginx

echo ""
echo "步骤7: 启动后端服务"
echo "------------------------"

cd server
pm2 start server.js --name ai-studio-server
pm2 save
pm2 startup

echo ""
echo "=========================================="
echo " 部署完成！"
echo "=========================================="
echo ""
echo "请完成以下后续步骤:"
echo "1. 编辑 /var/www/ai-studio/.env 文件，填入正确的阿里云凭证"
echo "2. 在Cloudflare中配置域名DNS解析到服务器IP"
echo "3. 在Cloudflare中启用SSL/TLS"
echo "4. 在阿里云OSS中配置CORS规则，允许 ${DOMAIN} 访问"
echo ""
echo "访问地址: http://${DOMAIN}"
echo "管理后台: http://${DOMAIN}?admin=true"