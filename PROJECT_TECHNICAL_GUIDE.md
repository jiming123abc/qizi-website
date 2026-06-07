# 大连柒子文化官网 - 项目技术文档

## 项目概览

这是大连柒子文化发展有限公司的官方网站，采用 React + Express + SQLite + 阿里云 OSS 技术栈。

---

## 一、服务器与部署信息

### 1.1 生产服务器信息
```
IP地址: 45.77.46.164
地理位置: 新加坡
用户名: root
项目路径: /root/website
服务管理: PM2
```

### 1.2 GitHub 仓库
```
仓库地址: https://github.com/jiming123abc/qizi-website
主要分支: main
```

### 1.3 部署命令
```bash
# 完整部署命令（从本地执行）
ssh root@45.77.46.164 "cd /root/website && git pull origin main && npm run build && pm2 restart all"

# 分步部署命令
1. 拉取最新代码
ssh root@45.77.46.164 "cd /root/website && git pull origin main"

2. 构建前端
ssh root@45.77.46.164 "cd /root/website && npm run build"

3. 重启服务
ssh root@45.77.46.164 "cd /root/website && pm2 restart all"

4. 查看服务状态
ssh root@45.77.46.164 "cd /root/website && pm2 status"
```

### 1.4 PM2 服务命令
```bash
# 查看服务状态
pm2 status

# 重启服务
pm2 restart all

# 查看日志
pm2 logs

# 停止服务
pm2 stop all

# 启动服务
pm2 start all
```

---

## 二、项目结构

```
app - 2/
├── public/                  # 静态资源
│   ├── ffmpeg/             # 浏览器端 FFmpeg 压缩
│   │   ├── 814.ffmpeg.js
│   │   ├── ffmpeg-core.js
│   │   ├── ffmpeg-core.wasm
│   │   └── ffmpeg.umd.js
│   └── images/             # 静态图片资源
├── server/                 # 后端服务
│   ├── database.js         # 数据库操作
│   └── server.js           # 后端主服务器
├── src/                    # 前端源代码
│   ├── components/         # React 组件
│   │   ├── admin/          # 管理后台组件
│   │   │   ├── PortfolioAdmin.tsx
│   │   │   ├── CategoriesAdmin.tsx
│   │   │   ├── FeaturedAdmin.tsx
│   │   │   ├── HomeContentAdmin.tsx
│   │   │   ├── TeamAdmin.tsx
│   │   │   ├── Dashboard.tsx
│   │   │   ├── StorageAdmin.tsx      # 存储管理（清理未引用文件）
│   │   │   └── AdminLayout.tsx
│   │   └── 其他业务组件
│   ├── lib/                # 工具库
│   │   ├── ossUtils.ts     # OSS 上传工具
│   │   ├── videoCompressor.ts  # 浏览器端视频压缩
│   │   ├── shareUtils.ts    # 微信分享工具
│   │   └── vodUtils.ts      # 视频点播相关
│   ├── data/
│   │   └── store.ts        # 前端 API 封装
│   └── App.tsx
├── .env                    # 环境变量
└── package.json
```

---

## 三、数据库表结构

### 3.1 portfolio_items（作品表）
- id: 主键
- categoryId: 分类ID
- title: 标题
- description: 描述
- img: 封面图
- images: 更多图片(JSON)
- videoUrl: 视频地址
- createdAt/updatedAt: 时间戳
- sortOrder: 排序

### 3.2 categories_details（分类详情表）
- id: 主键
- name: 分类名称
- description: 描述
- coverImage: 封面图
- sortOrder: 排序
- createdAt/updatedAt: 时间戳

### 3.3 team_members（团队成员表）
- id: 主键
- name: 姓名
- title: 职位
- avatar: 头像
- bio: 简介
- sortOrder: 排序
- createdAt/updatedAt: 时间戳

### 3.4 home_content（首页内容表）
- id: 主键
- heroImage: 首页图
- heroSlides: 轮播图(JSON)
- services: 服务介绍(JSON)
- updatedAt: 更新时间

### 3.5 featured_works（精选作品表）
- id: 主键
- img: 图片
- title: 标题
- link: 链接
- sortOrder: 排序

---

## 四、微信分享技术机制

### 4.1 分享功能文件位置
```
前端文件: src/components/WeChatShareHint.tsx
后端接口: server/server.js
微信配置: src/lib/shareUtils.ts
```

### 4.2 实现原理
1. **JSSDK 签名生成（后端）**：
   - 从微信获取 access_token
   - 用 access_token 获取 jsapi_ticket
   - 对当前 URL、noncestr、timestamp 进行 SHA1 签名
   - 接口：`/api/wechat-jssdk-config`

2. **前端集成**：
   - 加载微信 JSSDK 脚本
   - 调用后端接口获取签名配置
   - 调用 `wx.config()` 初始化
   - 配置分享标题、描述、缩略图等

### 4.3 关键代码位置
```javascript
// 后端 JSSDK 签名接口
server/server.js 中查找 getWechatJsSdkConfig

// 前端分享组件
src/components/WeChatShareHint.tsx
src/lib/shareUtils.ts
```

---

## 五、视频压缩上传技术机制

### 5.1 压缩策略
```
目标码率: 3000kbps (默认值)
编码格式: H.264 (libx264)
压缩等级: CRF 28
速度预设: ultrafast (为了速度牺牲一点质量)
```

### 5.2 上传流程
```
┌─────────────┐   码率判断   ┌───────────────────┐
│ 用户选择视频 │─────────────▶│ 检测视频码率      │
└─────────────┘             └─────────┬─────────┘
                                     │
                                     │
                         ┌───────────┴───────────┐
                         │                       │
                         ▼                       ▼
                  码率 ≤ 3000kbps          码率 > 3000kbps
                         │                       │
                         ▼                       ▼
                  ┌─────────────┐        ┌───────────────┐
                  │ 直接上传OSS │        │ 启动压缩流程   │
                  └─────────────┘        └───────┬───────┘
                                                 │
                                     ┌───────────┴────────────┐
                                     │                        │
                                     ▼                        ▼
                           文件 ≤ 95MB          文件 > 95MB
                                     │                        │
                                     ▼                        ▼
                          ┌─────────────┐          ┌──────────────┐
                          │ 服务端压缩  │          │ 浏览器压缩   │
                          └──────┬──────┘          └──────┬───────┘
                                 │                       │
                                 ▼                       ▼
                       ┌─────────────────────────────────────────┐
                       │          上传到 OSS (阿里云对象存储)      │
                       └─────────────────────────────────────────┘
```

### 5.3 压缩相关文件
| 组件 | 文件路径 | 说明 |
|------|---------|------|
| **浏览器压缩** | `src/lib/videoCompressor.ts` | 使用 FFmpeg.wasm 进行压缩 |
| **服务端压缩** | `server/server.js` | 使用 ffmpeg 命令行工具 |
| **上传控制** | `src/lib/ossUtils.ts` | 决策：直接上传/服务端压缩/浏览器压缩 |
| **压缩参数** | `TARGET_BITRATE_KBPS = 3000` | 默认目标码率 3000kbps |

### 5.4 服务端压缩参数
```bash
# server/server.js 中的 ffmpeg 命令
ffmpeg -i input.mp4
  -c:v libx264
  -b:v 3000k
  -maxrate 3500k
  -bufsize 6000k
  -preset ultrafast
  -movflags +faststart
  output.mp4
```

### 5.5 浏览器压缩参数
```typescript
// src/lib/videoCompressor.ts
ffmpeg -i input.mp4
  -c:v libx264
  -b:v 3000k
  -preset ultrafast
  -crf 28
  output.mp4
```

---

## 六、存储管理功能

### 6.1 功能说明
- 扫描并列出阿里云 OSS 和本地存储中未被引用的图片和视频文件
- 支持单个或批量删除未引用文件
- 支持预览和确认

### 6.2 实现方式
```javascript
1. 获取所有数据库引用的文件路径
   - portfolio_items (img, images[], videoUrl)
   - home_content (heroImage, heroSlides[])
   - team_members (avatar)
   - categories_details (coverImage)
   - featured_works (img)

2. 扫描 OSS 上所有图片和视频文件
   - 使用 ossClient.listV2() 获取所有文件
   - 按扩展名筛选：jpg, png, gif, webp, mp4, webm, mov, ogg

3. 对比匹配
   - 对数据库中的路径使用 extractFilePath() 提取
   - 对 OSS 路径和引用路径进行 URL 解码和对比
   - 如果不匹配，标记为未引用

4. 删除操作
   - 单个删除：删除一个文件
   - 批量删除：删除选中的多个文件
```

### 6.3 相关文件
- **后端接口**: `server/server.js` - `/api/storage/unreferenced`, `/api/storage/files`
- **存储管理组件**: `src/components/admin/StorageAdmin.tsx`
- **API 封装**: `src/data/store.ts` - `getUnreferencedFiles`, `deleteFiles`

---

## 七、环境变量配置

### 7.1 必需环境变量
```env
VITE_API_URL=https://qiziwenhua.top
VITE_OSS_REGION=oss-cn-beijing
VITE_OSS_BUCKET=qizi-store
VITE_OSS_ACCESS_KEY_ID=xxx
VITE_OSS_ACCESS_KEY_SECRET=xxx
WECHAT_APPID=wx12345678
WECHAT_SECRET=xxx123
```

### 7.2 配置位置
- **本地配置**: `.env`
- **服务器配置**: `/root/website/.env`

---

## 八、开发命令

### 8.1 本地开发
```bash
# 安装依赖
npm install
cd server && npm install

# 启动后端
cd server && npm start

# 启动前端（另一终端）
npm run dev
```

### 8.2 构建
```bash
npm run build
```

---

## 九、Git 推送与部署流程

### 9.1 完整流程
```bash
# 1. 提交修改
git add [修改的文件]
git commit -m "描述修改内容"

# 2. 推送到 GitHub
git push

# 3. 更新服务器
ssh root@45.77.46.164 "cd /root/website && git pull origin main && npm run build && pm2 restart all"
```

---

## 十、常见问题排查

### 10.1 服务器无法访问
- 检查 PM2 服务: `pm2 status`
- 查看日志: `pm2 logs`
- 重启服务: `pm2 restart all`

### 10.2 OSS 上传失败
- 检查 OSS 配置是否正确
- 检查 AccessKey 是否有权限
- 检查 Bucket 是否存在，区域是否正确

### 10.3 微信分享失败
- 检查微信 AppID 和 Secret 是否正确
- 检查 JSSDK 安全域名配置
- 检查 URL 签名是否正确生成

---

## 十一、生产访问地址
```
官网地址: https://qiziwenhua.top
管理后台: https://qiziwenhua.top?admin=true
```
