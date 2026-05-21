# 微信分享机制完整说明文档

## 概述

本文档详细记录了本项目的微信分享卡片实现机制，包括技术原理、架构设计、最佳实践，以及针对苹果手机微信"白条"问题的完整解决方案。

## 目录

- [技术背景](#技术背景)
- [两种实现方案](#两种实现方案)
- [本项目采用的方案](#本项目采用的方案)
- [苹果手机白条问题及解决方案](#苹果手机白条问题及解决方案)
- [代码架构说明](#代码架构说明)
- [API参考](#api参考)
- [部署和测试指南](#部署和测试指南)

---

## 技术背景

### 微信分享卡片的工作原理

微信在用户分享网页时，会通过以下两种方式之一来抓取分享信息：

#### 方式1：Open Graph (OG) 标签抓取（无需公众号）

当用户在微信中访问一个网页时：
1. 微信爬虫会自动请求该 URL
2. 解析 HTML 中的 `<meta>` 标签
3. 提取 `og:title`、`og:description`、`og:image`、`og:url` 等标签
4. 生成分享卡片

**优点：**
- 无需微信公众号
- 实现简单，纯前端即可
- 兼容性好

**缺点：**
- 微信只会在**首次加载**时抓取一次 meta 标签
- 后续 JavaScript 动态修改 meta 标签可能**不会被立即识别**
- 功能有限，无法自定义分享回调等高级功能

#### 方式2：微信 JS-SDK（需要公众号）

通过微信官方提供的 JS-SDK：
1. 后端获取 access_token 和 jsapi_ticket
2. 前端通过签名验证
3. 调用 `wx.updateAppMessageShareData()` 等 API

**优点：**
- 功能强大，可完全控制分享
- 实时生效，支持动态更新
- 有分享成功/失败的回调

**缺点：**
- 需要认证的微信公众号（企业认证）
- 配置复杂，需要服务器端支持
- 有调用频率限制

---

## 两种实现方案

### 方案A：纯前端动态修改（传统方式）

#### 原理

在用户浏览过程中，通过 JavaScript 动态修改 `<meta>` 标签。

```typescript
// 示例代码
function updateShareMeta(config) {
  document.title = config.title;
  
  const ogTitle = document.querySelector('meta[property="og:title"]');
  if (ogTitle) ogTitle.setAttribute('content', config.title);
  
  // ... 修改其他标签
}
```

#### 问题

- 微信可能不会识别动态修改的 meta 标签
- 在苹果手机上，修改 URL 会触发微信显示**底部导航白条**

---

### 方案B：专用分享落地页（本项目采用）

#### 核心思想

为每一个可分享的内容创建**独立的、服务端渲染的 URL**，例如：

```
/share/work/123  →  作品123的分享落地页
/share/work/456  →  作品456的分享落地页
```

#### 工作流程

```
1. 用户在主应用中浏览
   └─ URL 保持不变 (如 https://site.com/)
   └─ 不会触发白条！

2. 用户点击分享按钮
   └─ 生成分享链接：https://site.com/share/work/123
   └─ 复制此链接到剪贴板

3. 其他人点击分享链接
   └─ 访问 https://site.com/share/work/123
   └─ 服务器**动态渲染**带有作品信息的 meta 标签
   └─ 微信爬虫抓取到正确信息
   └─ 页面自动跳转到主应用 https://site.com/?id=123
   └─ 主应用显示作品详情
```

---

## 本项目采用的方案

### 架构图

```
┌─────────────────────────────────────────────────────────────┐
│                        用户浏览阶段                          │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  主应用 (React SPA)                                          │
│  URL: https://site.com/                                     │
│                                                             │
│  ✅ URL 始终不变！                                         │
│  ✅ 无白条问题！                                            │
│  ✅ 分享信息保持默认（首页信息）                              │
│                                                             │
└────────────────────────┬────────────────────────────────────┘
                         │ 用户点击分享
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                        分享生成阶段                          │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  JavaScript 逻辑：                                           │
│  1. 不修改主应用 URL！                                       │
│  2. 生成分享链接：/share/work/{id}                            │
│  3. 复制链接到剪贴板                                         │
│  4. 临时修改当前页面 meta 标签（仅为用户体验）                │
│                                                             │
└─────────────────────────────────────────────────────────────┘
                         │ 其他人点击分享链接
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                      分享落地页阶段                          │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  访问：https://site.com/share/work/123                      │
│                                                             │
│  服务端 (Express) 处理：                                     │
│  1. 从数据库获取作品信息                                      │
│  2. 动态替换 share.html 中的 meta 标签                        │
│  3. 返回渲染好的 HTML                                         │
│                                                             │
│  返回的 HTML：                                               │
│  <meta property="og:title" content="作品标题">               │
│  <meta property="og:description" content="作品描述">         │
│  <meta property="og:image" content="作品图片">               │
│  <meta property="og:url" content="当前 URL">                 │
│                                                             │
│  然后自动跳转到：                                            │
│  https://site.com/?id=123                                   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

### 关键代码位置

| 功能 | 文件位置 | 说明 |
|------|----------|------|
| 分享工具库 | `src/lib/shareUtils.ts` | `setupShareMetadata()` 函数 |
| 作品列表分享 | `src/components/PortfolioView.tsx` | `handleShare()` 函数 |
| 首页分享 | `src/components/HomeView.tsx` | `handleShare()` 函数 |
| 分享落地页 | `server/server.js` | `GET /share/work/:id` 路由 |
| 主应用动态渲染 | `server/server.js` | `GET *` 通配路由 |
| 分享落地页模板 | `share.html` | 静态模板 |

---

## 苹果手机白条问题及解决方案

### 问题描述

在**苹果手机微信**中，当页面 URL 发生变化（即使使用 `history.replaceState`）时：
- 微信会认为发生了"页面跳转"
- 显示底部导航条（俗称"白条"）
- 影响用户体验

### 哪些操作会触发白条？

| 操作 | 是否触发白条 | 原因 |
|------|-------------|------|
| `history.pushState()` | ✅ 会 | 微信认为有新页面 |
| `history.replaceState()` | ✅ 会 | 微信能察觉到 URL 变化 |
| `window.location.href = xxx` | ✅ 会 | 真实页面跳转 |
| **URL 保持不变** | ❌ **不会** | ✅ 最佳方案！ |

### 本项目的解决方案

#### 核心原则

> **主应用的 URL 永远不变！**

只有在以下情况才会有不同的 URL：
- 分享链接使用独立的 `/share/work/:id`
- 用户点击分享链接进入时，落地页会跳转

#### 具体实现

**PortfolioView.tsx 修改前（有问题）:**
```typescript
// ❌ 会修改 URL，导致白条
const url = new URL(window.location.href);
url.searchParams.set('id', selectedItem.id.toString());
window.history.replaceState({}, '', url.toString());
```

**PortfolioView.tsx 修改后（无问题）:**
```typescript
// ✅ 不修改主应用 URL
const shareUrl = `${window.location.origin}/share/work/${selectedItem.id}`;
// 只用这个链接作为分享地址
```

---

## 代码架构说明

### 1. 前端分享管理 (`src/lib/shareUtils.ts`)

#### `setupShareMetadata(config)` 函数

```typescript
export interface ShareConfig {
  title: string;
  desc: string;
  link: string;
  imgUrl: string;
}

export function setupShareMetadata(config: ShareConfig) {
  // 1. 修改文档标题
  document.title = config.title;
  
  // 2. 修改 Open Graph 标签
  setMetaTag('og:title', config.title, true);
  setMetaTag('og:description', config.desc, true);
  setMetaTag('og:image', config.imgUrl, true);
  setMetaTag('og:url', config.link, true);
  setMetaTag('og:type', 'website', true);
  
  // 3. 修改微信专用标签
  setMetaTag('description', config.desc);
  setMetaTag('wechat:title', config.title);
  setMetaTag('wechat:description', config.desc);
  setMetaTag('wechat:image', config.imgUrl);
  
  // 4. 修改 Twitter Card 标签
  setMetaTag('twitter:title', config.title);
  setMetaTag('twitter:description', config.desc);
  setMetaTag('twitter:image', config.imgUrl);
}
```

#### 说明

这个函数**仅修改当前页面的 meta 标签**（为了用户体验），**不应该依赖它来让微信抓取**。

**真正让微信抓取的是分享落地页的服务端渲染。**

---

### 2. 服务端分享落地页 (`server/server.js`)

#### 路由定义

```javascript
// 分享落地页动态渲染
app.get('/share/work/:id', async (req, res) => {
  try {
    const workId = req.params.id;
    let html = shareHtmlTemplate;
    
    try {
      // 获取作品集数据
      const items = await db.portfolioItems.getAll();
      const item = items.find(i => i.id.toString() === workId.toString());
      
      if (item) {
        // 获取首页默认内容作为 fallback
        let homeContent = null;
        try {
          homeContent = await db.homeContent.get();
        } catch (e) {
          console.warn('获取首页内容失败:', e);
        }
        
        const title = item.title || (homeContent?.shareTitle || '大连柒子文化发展有限公司');
        const description = item.shortDesc || item.fullDesc || item.category || (homeContent?.shareDescription || '诚信立足 创新致远');
        const image = item.img || (homeContent?.heroImage || '/images/hero-home.png');
        const url = `${req.protocol}://${req.get('host')}${req.originalUrl}`;
        
        // 替换 meta 标签
        html = html
          .replace(/<meta property="og:title" content="[^"]*" \/>/, `<meta property="og:title" content="${escapeHtml(title)}" />`)
          .replace(/<meta property="og:description" content="[^"]*" \/>/, `<meta property="og:description" content="${escapeHtml(description)}" />`)
          .replace(/<meta property="og:image" content="[^"]*" \/>/, `<meta property="og:image" content="${getFullImageUrl(image, req)}" />`)
          .replace(/<meta property="og:url" content="[^"]*" \/>/, `<meta property="og:url" content="${escapeHtml(url)}" />`)
          .replace(/<meta name="description" content="[^"]*" \/>/, `<meta name="description" content="${escapeHtml(description)}" />`)
          // ... 其他标签替换
        
        console.log(`为作品 ID ${workId} 渲染了分享落地页`);
      } else {
        // 作品不存在，跳转到首页
        console.log(`作品 ID ${workId} 不存在`);
      }
    } catch (itemErr) {
      console.warn('获取作品信息失败，使用默认 meta 标签:', itemErr);
    }
    
    res.send(html);
  } catch (error) {
    console.error('渲染 share.html 失败:', error);
    res.send(shareHtmlTemplate);
  }
});
```

---

### 3. 分享落地页模板 (`share.html`)

```html
<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>大连柒子文化发展有限公司</title>
  
  <!-- Open Graph Meta Tags for Social Sharing -->
  <meta property="og:title" content="大连柒子文化发展有限公司" />
  <meta property="og:description" content="诚信立足 创新致远" />
  <meta property="og:image" content="/images/hero-home.png" />
  <meta property="og:url" content="" />
  <meta property="og:type" content="website" />
  <meta property="og:site_name" content="大连柒子文化发展有限公司" />
  
  <!-- 微信专用标签 -->
  <meta name="description" content="诚信立足 创新致远" />
  <meta name="wechat:title" content="大连柒子文化发展有限公司" />
  <meta name="wechat:description" content="诚信立足 创新致远" />
  <meta name="wechat:image" content="/images/hero-home.png" />
  
  <!-- Twitter Card Meta Tags -->
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="大连柒子文化发展有限公司" />
  <meta name="twitter:description" content="诚信立足 创新致远" />
  <meta name="twitter:image" content="/images/hero-home.png" />
  
  <!-- 自动跳转脚本 -->
  <script>
    setTimeout(function() {
      const pathParts = window.location.pathname.split('/');
      const workId = pathParts[pathParts.length - 1];
      
      if (workId) {
        window.location.href = '/?id=' + workId;
      } else {
        window.location.href = '/';
      }
    }, 500);
  </script>
</head>
<body>
  <!-- 加载中的UI -->
</body>
</html>
```

---

## API 参考

### 前端 API

#### `setupShareMetadata(config)`

**用途：** 修改当前页面的分享元标签（仅为用户体验）

**参数：**
- `config.title` - 分享标题
- `config.desc` - 分享描述
- `config.link` - 分享链接
- `config.imgUrl` - 分享图片

---

### 后端 API

#### `GET /share/work/:id`

**用途：** 获取作品的分享落地页

**参数：**
- `:id` - 作品 ID

**返回：**
- 服务端渲染好的 HTML，包含正确的 meta 标签
- 页面会自动跳转到主应用

---

## 部署和测试指南

### 部署前检查清单

- [ ] 分享落地页路由正常工作
- [ ] 数据库中存在测试作品
- [ ] HTTPS 已配置
- [ ] 图片可公网访问

### 测试步骤

#### 1. 测试分享落地页

直接访问分享链接，查看 HTML 源码：

```bash
curl https://yourdomain.com/share/work/1
```

检查返回的 HTML 中，meta 标签是否有正确的作品信息。

#### 2. 测试主应用白条问题

在苹果手机微信中：
1. 打开网站首页
2. 点击一个作品打开详情
3. 确认 URL **没有**变化
4. 确认**没有**显示底部白条

#### 3. 测试分享功能

1. 打开作品详情
2. 点击分享按钮
3. 确认复制的链接是 `/share/work/:id` 格式
4. 把链接发给朋友
5. 朋友点击后，确认显示正确的分享卡片
6. 点击卡片后，正确跳转到作品详情

---

## 最佳实践

### 1. URL 管理原则

| 场景 | URL 处理 | 说明 |
|------|---------|------|
| 用户浏览 | 保持不变 | 避免白条 |
| 分享链接 | 使用独立格式 | `/share/work/:id` |
| 落地页跳转 | 使用查询参数 | `/?id=123` |

### 2. 新增可分享内容

当需要新增一种可分享的内容（如团队成员）：

1. 创建新的分享落地页路由（如 `/share/team/:id`）
2. 在服务端实现动态渲染
3. 在前端对应组件添加分享功能
4. **不要修改主应用 URL！**

### 3. 图片建议

- **格式：** JPG、PNG
- **尺寸：** 建议 300x300 或 1.91:1（1200x630）
- **大小：** 不超过 300KB
- **协议：** 必须是 HTTPS

---

## 常见问题

### Q1: 微信分享卡片还是不显示作品信息？

**A:** 请检查：
1. 分享链接是否是 `/share/work/:id` 格式
2. 直接访问分享链接，查看 HTML 源码中的 meta 标签
3. 检查微信是否缓存了旧页面（可在链接后加 `?v=2` 强制刷新）

### Q2: 如何让分享链接对 SEO 友好？

**A:** 本方案已经是 SEO 友好的！
- 分享落地页有完整的 meta 标签
- 搜索引擎和微信爬虫都能正确抓取

### Q3: 需要微信公众号吗？

**A:** 不需要！本方案使用 Open Graph 标签，完全免费。

### Q4: 如何添加微信公众号的高级功能？

**A:** 未来可以升级：
1. 申请认证的微信公众号
2. 配置 JS-SDK
3. 两种方式可以**并存**

---

## 版本历史

| 版本 | 日期 | 说明 |
|------|------|------|
| 1.0 | 2026-05-22 | 初始版本，记录完整机制 |

---

## 相关文件

- [WECHAT_SETUP_GUIDE.md](./WECHAT_SETUP_GUIDE.md) - 微信公众号配置指南
- [server/server.js](../server/server.js) - 服务端实现
- [src/lib/shareUtils.ts](./src/lib/shareUtils.ts) - 前端分享工具
- [share.html](../share.html) - 分享落地页模板

---

## 参考资源

- [Open Graph 协议](https://ogp.me/)
- [微信 JS-SDK 文档](https://developers.weixin.qq.com/doc/offiaccount/OA_Web_Apps/JS-SDK.html)
- [Twitter Card 文档](https://developer.twitter.com/en/docs/twitter-for-websites/cards/overview/abouts-cards)

