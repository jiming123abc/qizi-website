# AI Studio 部署指南

## 系统要求

- Ubuntu 22.04 LTS (推荐)
- Node.js 20+
- Nginx
- PM2

## 快速部署

### 方法1：使用部署脚本（推荐）

```bash
# 下载并运行部署脚本
curl -o deploy.sh https://raw.githubusercontent.com/your-repo/ai-studio/main/deploy.sh
chmod +x deploy.sh
sudo ./deploy.sh your-domain.com
```

### 方法2：手动部署

#### 1. 更新系统

```bash
sudo apt update && sudo apt upgrade -y
```

#### 2. 安装依赖

```bash
sudo apt install -y nodejs npm nginx git
sudo npm install -g pm2
```

#### 3. 克隆代码

```bash
cd /var/www
git clone https://github.com/your-repo/ai-studio.git
cd ai-studio
```

#### 4. 安装项目依赖

```bash
npm install
npm run build

cd server
npm install
cd ..
```

#### 5. 配置环境变量

创建 `.env` 文件：

```env
REACT_APP_OSS_ACCESS_KEY_ID="您的OSS AccessKeyId"
REACT_APP_OSS_ACCESS_KEY_SECRET="您的OSS AccessKeySecret"
REACT_APP_OSS_BUCKET="qizi-store"
REACT_APP_OSS_REGION="oss-cn-beijing"
REACT_APP_API_URL="https://your-domain.com/api"
```

#### 6. 配置Nginx

创建配置文件 `/etc/nginx/sites-available/ai-studio`：

```nginx
server {
    listen 80;
    server_name your-domain.com;

    # 上传文件大小限制（根据需要调整）
    client_max_body_size 2048M;

    # 全局代理超时设置（30分钟）
    proxy_connect_timeout 300s;
    proxy_send_timeout 1800s;
    proxy_read_timeout 1800s;

    location / {
        root /var/www/ai-studio/dist;
        try_files $uri $uri/ /index.html;
    }

    location /api/ {
        proxy_pass http://localhost:5000/;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # API代理超时设置（30分钟）
        proxy_connect_timeout 300s;
        proxy_send_timeout 1800s;
        proxy_read_timeout 1800s;
        proxy_buffering off;
        proxy_request_buffering off;
    }

    # 大文件上传专用配置（视频/图片上传）
    location /api/upload/ {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        
        # 上传超时设置（30分钟）
        proxy_connect_timeout 300s;
        proxy_send_timeout 1800s;
        proxy_read_timeout 1800s;
        
        # 禁用代理缓冲（对大文件上传很重要）
        proxy_buffering off;
        proxy_request_buffering off;
    }

    add_header X-Frame-Options "SAMEORIGIN";
    add_header X-XSS-Protection "1; mode=block";
    add_header X-Content-Type-Options "nosniff";
}
```

**重要说明**：如果不配置Nginx超时，大文件（特别是需要压缩的视频）上传时会遇到504 Gateway Timeout错误，因为Nginx默认的代理超时时间很短。

启用配置：

```bash
sudo ln -sf /etc/nginx/sites-available/ai-studio /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

#### 7. 启动后端服务

```bash
cd /var/www/ai-studio/server
pm2 start server.js --name ai-studio-server
pm2 save
pm2 startup
```

## 阿里云OSS配置

### CORS规则配置

在阿里云OSS控制台配置CORS规则：

| 配置项 | 值 |
|--------|-----|
| 来源 | `https://your-domain.com` |
| 允许的Method | `GET, POST, PUT, DELETE, OPTIONS` |
| 允许的Header | `*` |
| 暴露的Header | `ETag, Content-Length` |
| 缓存时间 | `3600` |

## Cloudflare配置

### 1. 添加站点

1. 登录Cloudflare
2. 添加站点，输入您的域名
3. 更新域名DNS为Cloudflare提供的Nameservers

### 2. SSL/TLS配置

- SSL/TLS模式: `Full`
- 自动HTTPS重定向: `开启`
- 始终使用HTTPS: `开启`

### 3. 页面规则（可选）

```
http://*your-domain.com/* -> 重定向到 https://$1your-domain.com/$2
```

## 运维命令

### 查看服务状态

```bash
pm2 status
pm2 logs ai-studio-server
```

### 重启服务

```bash
pm2 restart ai-studio-server
```

### 更新代码

```bash
cd /var/www/ai-studio
git pull
npm run build
pm2 restart ai-studio-server
```

## 安全建议

1. **禁用SSH密码登录**，使用密钥登录
2. **配置防火墙**，只开放必要端口
3. **定期更新系统**
4. **备份数据**，定期备份OSS文件
5. **使用HTTPS**，启用HSTS

## 故障排除

### 常见问题

1. **502 Bad Gateway** - 后端服务未启动或端口被占用
2. **404 Not Found** - 前端文件路径错误
3. **上传失败** - 检查OSS配置和CORS规则
4. **HTTPS问题** - 检查Cloudflare SSL配置
5. **504 Gateway Timeout** - 大文件上传超时，**必须配置Nginx代理超时**（见上文Nginx配置第6步）

### 大文件上传504超时问题

如果上传大文件（特别是需要压缩的视频）时出现504错误，必须配置Nginx的代理超时时间：

```bash
# 编辑Nginx配置
sudo nano /etc/nginx/sites-available/ai-studio
```

在 `location /api/upload/` 块中添加或修改以下配置：

```nginx
location /api/upload/ {
    proxy_pass http://localhost:5000;
    proxy_http_version 1.1;
    
    # 超时设置（关键！）
    proxy_connect_timeout 300s;
    proxy_send_timeout 1800s;
    proxy_read_timeout 1800s;
    proxy_buffering off;
    proxy_request_buffering off;
}
```

然后重启Nginx：

```bash
sudo nginx -t
sudo systemctl reload nginx
```

**常见原因**：
- 视频压缩时间过长（大文件可能需要5-30分钟）
- 网络上传速度慢
- OSS连接不稳定

### 日志查看

```bash
# Nginx日志
tail -f /var/log/nginx/error.log

# PM2日志
pm2 logs ai-studio-server

# 系统日志
journalctl -u nginx
```

## 目录结构

```
/var/www/ai-studio/
├── dist/                 # 前端构建产物
├── server/               # 后端服务
│   ├── server.js         # 主服务文件
│   └── package.json
├── src/                  # 前端源码
├── .env                  # 环境变量
└── package.json
```