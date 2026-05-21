<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# 大连柒子文化 - 官网项目

这是大连柒子文化发展有限公司的官方网站项目，包含作品展示、团队介绍、服务介绍等功能。

## 本地运行

**前置要求:** Node.js

1. 安装依赖:
   ```bash
   npm install
   cd server && npm install
   ```
2. 配置环境变量:
   ```bash
   cp .env.example .env
   # 编辑 .env 文件，填入你的配置
   ```
3. 构建前端:
   ```bash
   npm run build
   ```
4. 启动服务器:
   ```bash
   cd server && npm start
   ```

## 安全建议

### 生产环境部署注意事项

1. **数据库安全**
   - 数据库文件位于 `server/data.db`，请确保文件权限正确设置
   - 定期备份数据库文件
   - 生产环境建议使用 PostgreSQL 或 MySQL 替代 SQLite
   - 建议添加数据库访问密码和用户认证

2. **管理后台安全**
   - 修改默认的管理员密码（当前为 `admin123`）
   - 建议添加 IP 白名单限制管理后台访问
   - 定期检查管理后台访问日志

3. **文件上传安全**
   - 已配置文件大小限制和类型验证
   - 定期检查上传的文件内容
   - 建议使用 CDN 存储用户上传的文件

4. **API 安全**
   - 当前 API 没有认证保护，适合小访问量使用
   - 如果访问量增加，建议添加 API Key 或 JWT 认证
   - 可以在防火墙层限制 API 访问来源

## 部署

详细部署说明请参考 [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md)

## 环境变量说明

所有可配置的环境变量请参考 [.env.example](.env.example) 文件。
