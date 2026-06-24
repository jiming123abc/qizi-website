# 大连柒子文化官网 - 项目技术文档

## 项目概览

这是大连柒子文化发展有限公司的官方网站，采用 React + Express + SQLite + 阿里云 OSS 技术栈。

- **生产访问地址**：https://qiziwenhua.top
- **管理后台**：https://qiziwenhua.top?admin=true
- **本地开发地址**：http://localhost:3001

---

## 一、服务器与部署信息

### 1.1 生产服务器信息
```
IP地址: 45.77.46.164
地理位置: 新加坡
用户名: root
项目路径: /var/www/qizi-website
服务管理: PM2
PM2 进程名: qizi-website-server
后端端口: 5000
Nginx 配置: /etc/nginx/sites-available/qizi-website
Nginx 模式: 全代理模式（所有请求转发给 Express）
```

### 1.2 GitHub 仓库信息
```
仓库地址: https://github.com/jiming123abc/qizi-website
主要分支: main
```

### 1.3 关联子站信息
视频拍摄管理系统已拆分为独立应用：
- 仓库：https://github.com/jiming123abc/qizi-video
- 地址：https://video.qiziwenhua.top
- 路径：/var/www/qizi-video
- PM2 进程：qizi-video-server（端口 3001）
- 技术文档：见子站 TECHNICAL_GUIDE.md

### 1.4 生产部署/更新命令
```bash
# 完整更新流程（从本地执行）
ssh root@45.77.46.164 "cd /var/www/qizi-website && git pull origin main && npm run build && pm2 restart qizi-website-server"

# 分步执行
# 1. 拉取最新代码
ssh root@45.77.46.164 "cd /var/www/qizi-website && git pull origin main"

# 2. 安装依赖（如果有新增依赖）
ssh root@45.77.46.164 "cd /var/www/qizi-website && npm install"
ssh root@45.77.46.164 "cd /var/www/qizi-website/server && npm install"

# 3. 构建前端
ssh root@45.77.46.164 "cd /var/www/qizi-website && npm run build"

# 4. 重启服务
ssh root@45.77.46.164 "cd /var/www/qizi-website && pm2 restart qizi-website-server"

# 5. 查看服务状态
ssh root@45.77.46.164 "pm2 status"

# 6. 查看日志
ssh root@45.77.46.164 "pm2 logs qizi-website-server"
```

### 1.5 PM2 常用命令
```bash
# 查看所有服务状态（主站+子站）
pm2 status

# 重启主站
pm2 restart qizi-website-server

# 重启子站
pm2 restart qizi-video-server

# 停止服务
pm2 stop qizi-website-server

# 启动服务
pm2 start ecosystem.config.cjs

# 查看实时日志
pm2 logs qizi-website-server

# 保存 PM2 配置（开机自启）
pm2 save
pm2 startup
```

---

## 二、技术栈

### 2.1 前端技术栈
| 技术/库 | 版本 | 用途 |
|--------|------|------|
| React | ^19.0.0 | UI 框架 |
| React DOM | ^19.0.0 | DOM 渲染 |
| TypeScript | ~5.8.2 | 类型系统 |
| Vite | ^6.2.0 | 构建工具/开发服务器 |
| Tailwind CSS | ^4.1.14 | CSS 框架 |
| @tailwindcss/vite | ^4.1.14 | Vite Tailwind 插件 |
| @vitejs/plugin-react | ^5.0.4 | Vite React 插件 |
| lucide-react | ^0.546.0 | 图标库 |
| motion | ^12.23.24 | 动画库 |
| @ffmpeg/ffmpeg | ^0.12.9 | 浏览器端视频压缩（保留兼容） |
| @ffmpeg/util | ^0.12.2 | FFmpeg 工具库 |
| qrcode | ^1.5.4 | 二维码生成 |

### 2.2 后端技术栈
| 技术/库 | 版本 | 用途 |
|--------|------|------|
| Express | ^4.21.2 | Web 框架 |
| cors | ^2.x | 跨域支持 |
| compression | ^1.8.1 | Gzip 压缩 |
| dotenv | ^17.2.3 | 环境变量 |
| sqlite3 | ^5.x | SQLite 数据库 |
| ali-oss | ^6.x | 阿里云 OSS SDK |
| multer | ^1.x | 文件上传 |
| sharp | ^0.x | 图片处理 |
| fluent-ffmpeg | ^2.x | 视频处理 |
| ffmpeg-static | ^5.x | FFmpeg 静态二进制 |

### 2.3 基础设施
- **数据库**：SQLite（文件：server/database.db）
- **文件存储**：阿里云 OSS
- **进程管理**：PM2
- **反向代理**：Nginx

---

## 三、目录结构

```
qizi-website/
├── public/                      # 静态资源
│   ├── ffmpeg/                 # 浏览器端 FFmpeg 文件
│   │   ├── 814.ffmpeg.js
│   │   ├── ffmpeg-core.js
│   │   ├── ffmpeg-core.wasm
│   │   └── ffmpeg.umd.js
│   ├── images/                 # 静态图片资源
│   ├── favicon.svg
│   └── robots.txt
├── server/                      # 后端服务
│   ├── database.js             # 数据库操作
│   ├── server.js               # 后端主服务器（API + 静态服务 + SSR）
│   └── package.json            # 后端依赖
├── src/                         # 前端源代码
│   ├── components/             # React 组件
│   │   ├── admin/              # 管理后台组件
│   │   │   ├── AdminLayout.tsx
│   │   │   ├── CategoriesAdmin.tsx
│   │   │   ├── Dashboard.tsx
│   │   │   ├── FeaturedAdmin.tsx
│   │   │   ├── HomeContentAdmin.tsx
│   │   │   ├── Login.tsx
│   │   │   ├── PortfolioAdmin.tsx
│   │   │   ├── StorageAdmin.tsx
│   │   │   ├── TeamAdmin.tsx
│   │   │   └── AdminLayout.tsx
│   │   ├── BottomNavBar.tsx
│   │   ├── ConfirmDialog.tsx
│   │   ├── DesktopSidebar.tsx
│   │   ├── ErrorBoundary.tsx
│   │   ├── HomeView.tsx
│   │   ├── ImageViewerModal.tsx
│   │   ├── ItemDetailModal.tsx
│   │   ├── Modal.tsx
│   │   ├── PortfolioView.tsx
│   │   ├── SearchView.tsx
│   │   ├── ServicesView.tsx
│   │   ├── TeamView.tsx
│   │   ├── TopAppBar.tsx
│   │   └── WeChatShareHint.tsx
│   ├── data/
│   │   └── store.ts            # 前端 API 封装
│   ├── lib/                    # 工具库
│   │   ├── aiGenerator.ts
│   │   ├── iconPresets.ts
│   │   ├── ossUtils.ts         # OSS 上传工具
│   │   ├── qrCode.ts
│   │   ├── shareUtils.ts       # 微信分享工具
│   │   ├── videoCompressor.ts  # 视频压缩
│   │   └── vodUtils.ts
│   ├── App.tsx                 # 应用根组件
│   ├── main.tsx                # 前端入口
│   └── index.css               # 全局样式
├── dist/                        # 前端构建输出（不提交 Git）
├── logs/                        # PM2 日志目录（不提交 Git）
├── .env                         # 环境变量（不提交 Git）
├── .env.example                 # 环境变量示例
├── .gitignore                   # Git 忽略配置
├── ecosystem.config.cjs         # PM2 部署配置
├── nginx-qzwh.conf              # Nginx 配置参考
├── index.html                   # HTML 入口
├── package.json                 # 前端依赖与脚本
├── package-lock.json            # 依赖锁定文件
├── tsconfig.json                # TypeScript 配置
├── vite.config.ts               # Vite 配置
├── README.md
└── PROJECT_TECHNICAL_GUIDE.md   # 本文档
```

---

## 四、PM2 配置

配置文件：`ecosystem.config.cjs`

```javascript
module.exports = {
  apps: [
    {
      name: 'qizi-website-server',
      script: './server/server.js',
      cwd: './',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '500M',
      env: {
        NODE_ENV: 'production',
        PORT: 5000,
      },
      error_file: './logs/error.log',
      out_file: './logs/out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
    },
  ],
};
```

**注意**：子站 (qizi-video) 有独立的 `ecosystem.config.cjs`，配置在子站目录下。

---

## 五、Nginx 配置要点

服务器配置位置：`/etc/nginx/sites-available/qizi-website`

关键配置项：
1. **全代理模式**：所有请求（包括静态资源）都转发到 Express `http://localhost:5000`
2. **客户端上传大小**：`client_max_body_size 2048M`（支持大文件上传）
3. **超时设置**：长超时支持视频上传（1800s）
4. **SSL**：HTTPS 配置（使用 Let's Encrypt）
5. **COOP/COEP 头**：支持 SharedArrayBuffer（FFmpeg WebAssembly 必需）
6. **WebSocket 支持**：正确配置 Upgrade/Connection 头
7. **子站分离**：`video.qiziwenhua.top` 独立 server 块，转发到端口 3001
8. **旧路径重定向**：`/video2` 路径 301 重定向到 `https://video.qiziwenhua.top`

---

## 六、数据库表结构

数据库文件：`server/database.db`

### 6.1 portfolio_items（作品表）
- id: 主键
- categoryId: 分类ID
- title: 标题
- description: 描述
- img: 封面图
- images: 更多图片(JSON)
- videoUrl: 视频地址
- createdAt/updatedAt: 时间戳
- sortOrder: 排序

### 6.2 categories_details（分类详情表）
- id: 主键
- name: 分类名称
- description: 描述
- coverImage: 封面图
- sortOrder: 排序
- createdAt/updatedAt: 时间戳

### 6.3 team_members（团队成员表）
- id: 主键
- name: 姓名
- title: 职位
- avatar: 头像
- bio: 简介
- sortOrder: 排序
- createdAt/updatedAt: 时间戳

### 6.4 home_content（首页内容表）
- id: 主键（固定为 1）
- heroImage: 首页图
- heroSlides: 轮播图(JSON)
- services: 服务介绍(JSON)
- updatedAt: 更新时间

### 6.5 featured_works（精选作品表）
- id: 主键
- img: 图片
- title: 标题
- link: 链接
- sortOrder: 排序

---

## 七、微信分享技术机制

### 7.1 分享功能文件位置
```
后端渲染: server/server.js
前端提示组件: src/components/WeChatShareHint.tsx
工具库: src/lib/shareUtils.ts
```

### 7.2 实现原理
**基于 Open Graph Meta 标签的动态渲染**：
- 不需要微信公众号或 JSSDK
- 利用微信爬虫自动抓取页面 Meta 标签来生成分享卡片
- 支持以下 Meta 标签：
  - `og:title` - 分享标题
  - `og:description` - 分享描述
  - `og:image` - 分享缩略图
  - `og:url` - 分享链接
  - `wechat:title`/`wechat:description`/`wechat:image` - 微信专属标签
  - `twitter:title`/`twitter:description`/`twitter:image` - Twitter 兼容标签

### 7.3 工作流程
1. **后端动态渲染**：
   - 当用户访问首页或具体作品页时
   - 后端从数据库获取相应内容（首页配置或作品信息）
   - 读取 `dist/index.html` 模板
   - 动态替换 Meta 标签内容
   - 返回渲染后的 HTML 给浏览器

2. **微信爬虫抓取**：
   - 当用户在微信中分享链接时
   - 微信爬虫会访问该链接并抓取 Meta 标签
   - 根据抓取的内容生成分享卡片

3. **作品直达**：
   - 分享链接包含作品 ID 参数（如 `?id=123`）
   - 前端通过 URL 参数识别并展示对应作品

### 7.4 关键代码位置
```javascript
// 后端动态渲染 Meta 标签
server/server.js 中的 SSR 相关代码

// 前端分享提示组件
src/components/WeChatShareHint.tsx

// 分享工具函数
src/lib/shareUtils.ts
```

---

## 八、视频压缩上传技术机制（保留兼容）

### 8.1 压缩策略
```
目标码率: 3000kbps (默认值)
编码格式: H.264 (libx264)
压缩等级: CRF 28
速度预设: ultrafast (为了速度牺牲一点质量)
```

**注意**：主站已不包含视频管理功能（已拆分到 qizi-video 子站），相关代码保留用于兼容性。

---

## 九、存储管理功能

### 9.1 功能说明
- 扫描并列出阿里云 OSS 和本地存储中未被引用的图片和视频文件
- 支持单个或批量删除未引用文件
- 支持预览和确认

### 9.2 相关文件
- **后端接口**: `server/server.js` - `/api/storage/unreferenced`, `/api/storage/files`
- **存储管理组件**: `src/components/admin/StorageAdmin.tsx`
- **API 封装**: `src/data/store.ts` - `getUnreferencedFiles`, `deleteFiles`

---

## 十、环境变量配置

### 10.1 必需环境变量
```env
# 服务端口（本地开发: 3000，生产环境: 5000）
PORT=5000

# 阿里云 OSS 配置
VITE_OSS_REGION=oss-cn-beijing
VITE_OSS_BUCKET=qizi-store
VITE_OSS_ACCESS_KEY_ID=xxx
VITE_OSS_ACCESS_KEY_SECRET=xxx

# API 地址（前端使用，生产环境留空使用相对路径）
VITE_API_URL=https://qiziwenhua.top
```

### 10.2 配置位置
- **本地配置**: `.env`（项目根目录）
- **服务器配置**: `/var/www/qizi-website/.env`

**⚠️ 重要**：`.env` 文件包含敏感信息，**绝对不能**提交到 Git 仓库。

---

## 十一、本地开发流程

### 11.1 环境准备
1. 安装 Node.js 18+

### 11.2 安装依赖
```bash
# 安装前端依赖
npm install

# 安装后端依赖
cd server && npm install
cd ..
```

### 11.3 配置环境变量
1. 复制 `.env.example` 为 `.env`
2. 填入正确的 OSS 配置信息

### 11.4 启动开发服务器
需要**两个终端**：

```bash
# 终端 1：启动后端
cd server && npm start
# 后端运行在 http://localhost:3000

# 终端 2：启动前端
npm run dev
# 前端运行在 http://localhost:3001
```

### 11.5 构建生产版本
```bash
npm run build
```
构建输出到 `dist/` 目录。

---

## 十二、迁移历史

- **2026-06-24**：视频拍摄管理功能拆分为独立子站 qizi-video
- **2026-06-24**：清理临时文件和拆分相关代码
- **2026-06-24**：添加 PM2 ecosystem.config.cjs 配置
- **2026-06-24**：服务器部署路径从 `/root/website` 迁移到 `/var/www/qizi-website`
- **2026-06-24**：更新技术文档，记录子站拆分信息

---

## 十三、常见问题排查

### 13.1 服务器无法访问
- 检查 PM2 服务: `pm2 status`
- 查看日志: `pm2 logs`
- 重启服务: `pm2 restart all`
- 检查端口占用: `netstat -tlnp | grep node`

### 13.2 OSS 上传失败
- 检查 OSS 配置是否正确
- 检查 AccessKey 是否有权限
- 检查 Bucket 是否存在，区域是否正确

### 13.3 微信分享失败
- 检查 Meta 标签是否正确渲染（可以在浏览器中查看页面源代码）
- 检查分享缩略图是否可访问（需要是完整的 HTTPS URL）
- 检查首页内容配置是否正确（分享标题、描述、缩略图）
- 微信可能缓存旧的分享信息，可以尝试清除缓存或稍等一段时间
- 确保分享链接是 HTTPS 协议

### 13.4 管理后台登录问题
- 访问 `https://qiziwenhua.top?admin=true` 进入后台
- 检查数据库是否正常

### 13.5 主站和子站同时管理
```bash
# 查看两个服务状态
pm2 status

# 同时重启两个服务
pm2 restart qizi-website-server && pm2 restart qizi-video-server

# 查看 Nginx 配置
nginx -t && nginx -s reload
```
