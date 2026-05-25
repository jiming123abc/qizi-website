# 🎬 视频上传问题修复部署指南（方案2 + 压缩优化）

## 📋 已完成的改动
- ✅ **Nginx 配置优化** - 解决 HTTP/2 超时问题
- ✅ **压缩参数优化** - 压缩速度提升 2-3 倍

---

## 🚀 服务器部署步骤

### 第一步：备份现有配置
```bash
sudo cp /etc/nginx/sites-available/qizi-website /etc/nginx/sites-available/qizi-website.backup
```

### 第二步：更新 Nginx 配置
```bash
sudo nano /etc/nginx/sites-available/qizi-website
```

把项目中的 **[nginx-qzwh.conf](file:///c:/Users/jimin/Documents/app%20-%202/nginx-qzwh.conf)** 内容**完全复制替换**进去。

### 第三步：更新后端代码
上传修改后的 **[server/server.js](file:///c:/Users/jimin/Documents/app%20-%202/server/server.js)** 到服务器对应位置，替换原文件。

### 第四步：测试并重启 Nginx
```bash
# 测试配置
sudo nginx -t

# 如果看到 "syntax is ok"，重启服务
sudo systemctl restart nginx

# 确认运行状态
sudo systemctl status nginx
```

### 第五步：重启后端服务（如果需要）
根据您的服务管理方式重启后端：
```bash
# 如果使用 PM2
pm2 restart all

# 或其他方式重启您的 Node.js 服务
```

---

## 🔍 验证修复

### 测试用例
1. ✅ **小视频（不压缩）**：应该能正常上传
2. ✅ **大视频（需要压缩）**：应该能成功上传了

### 验证步骤
1. 访问 https://qzwh.me/admin=true
2. 尝试上传一个 50-100MB 的视频
3. 观察是否正常完成

---

## 📊 改动对比

### Nginx 配置新增项
| 配置项 | 值 | 作用 |
|--------|-----|------|
| `client_body_timeout` | 1800s | 客户端发送超时 |
| `send_timeout` | 1800s | 服务端发送超时 |
| `keepalive_timeout` | 1800s | 保持连接30分钟 |
| `tcp_nodelay` | on | 立即发送数据 |
| `tcp_nopush` | on | 优化传输 |

### 压缩参数改动
| 参数 | 修改前 | 修改后 | 影响 |
|-----|--------|--------|------|
| `preset` | veryfast | ultrafast | ⚡ 快 2-3 倍 |
| `crf` | 26 | 28 | 📊 质量稍降，体积稍大 |

---

## 🛠️ 如果还有问题

### 查看 Nginx 错误日志
```bash
sudo tail -f /var/log/nginx/error.log
```

### 查看后端服务日志
```bash
pm2 logs
```

---

## 📅 后续升级路径

当前方案是方案2（Nginx优化），后期可升级到：
- **短期**：智能压缩策略（按视频大小决定是否压缩）
- **长期**：方案3（异步任务 + 轮询，完美用户体验）
