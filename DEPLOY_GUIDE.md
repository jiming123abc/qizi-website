# 部署指南

## 从本地推送到 GitHub

### 1. 检查 GitHub Token
如果你还没有 GitHub Token，需要重新生成一个：
1. 访问 https://github.com/settings/tokens
2. 点击 "Generate new token (classic)"
3. 勾选 `repo` 权限
4. 生成并保存 Token

### 2. 推送到 GitHub
在本地执行：

```bash
cd C:\Users\qizi-jim\Desktop\app\app
git add .
git commit -m "Update: SQLite database and bug fixes"
git push origin main
```

提示输入密码时，输入你的 GitHub Token。

---

## 在服务器上部署

### 方法 1：使用 PuTTY 连接（推荐）

1. **打开 PuTTY**
2. **Host Name**: `root@45.77.46.164`
3. **Port**: `22`
4. **Connection Type**: `SSH`
5. 在左侧菜单：`Connection > SSH > Auth`
6. **Private key file for authentication**: 浏览选择你的 `.ppk` 文件
7. 点击 `Open`

### 方法 2：使用 Windows PowerShell

```powershell
# 使用密码连接（需要先配置密码）
ssh root@45.77.46.164
```

---

## 服务器部署命令

连接成功后，依次执行：

```bash
# 1. 进入网站目录
cd /var/www/ai-studio/app

# 2. 拉取最新代码
git pull origin main

# 3. 安装后端依赖
cd server
npm install sqlite3
cd ..

# 4. 安装前端依赖并构建
npm install
npm run build

# 5. 重启后端服务
pm2 restart ai-studio-server

# 6. 检查状态
pm2 status
```

---

## 如果遇到问题

### 问题：git pull 需要认证
```bash
# 方法1：配置 GitHub Token
git remote set-url origin https://你的GitHub用户名:你的GitHubToken@github.com/jiming123abc/app.git
git pull origin main

# 方法2：使用 SSH（需要先配置 SSH Key）
# 在本地生成 SSH Key
ssh-keygen -t rsa -b 4096 -C "your_email@example.com"
# 将公钥添加到 GitHub Settings > SSH Keys
```

### 问题：npm install 失败
```bash
# 清理缓存后重试
npm cache clean --force
rm -rf node_modules
npm install
```

### 问题：PM2 进程不存在
```bash
# 进入 server 目录
cd /var/www/ai-studio/app/server

# 启动服务
pm2 start server.js --name ai-studio-server

# 保存 PM2 配置
pm2 save

# 设置开机自启
pm2 startup
```

---

## 验证部署

访问你的域名：
- https://qzmart.com （或你配置的域名）

检查：
1. 首页是否正常加载
2. 数据库是否正常工作
3. 管理后台是否正常登录

查看日志：
```bash
pm2 logs ai-studio-server
```
