const fs = require('fs');
const path = require('path');

const sourceDir = path.join(__dirname, '..');
const targetDir = path.join(__dirname, '..', '..', 'qizi-video');

console.log('========================================');
console.log('  qizi-video 迁移文件清单');
console.log('========================================');
console.log('');
console.log('由于沙箱限制，需要手动复制以下文件到 qizi-video 目录：');
console.log('');

const files = [
  ['src/Video2App.tsx', 'src/App.tsx', '主应用组件（独立路由）'],
  ['src/main-video2.tsx', 'src/main.tsx', '前端入口文件'],
  ['src/components/Video2Page.tsx', 'src/components/Video2Page.tsx', '项目详情页'],
  ['src/components/Video2ProjectList.tsx', 'src/components/Video2ProjectList.tsx', '项目列表页'],
  ['src/components/ConfirmDialog.tsx', 'src/components/ConfirmDialog.tsx', '确认对话框组件'],
  ['src/components/WeChatShareHint.tsx', 'src/components/WeChatShareHint.tsx', '分享提示组件'],
  ['src/lib/shareUtils.ts', 'src/lib/shareUtils.ts', '分享工具函数'],
  ['src/lib/ossUtils.ts', 'src/lib/ossUtils.ts', '上传/OSS工具函数'],
  ['src/lib/videoCompressor.ts', 'src/lib/videoCompressor.ts', '视频压缩工具'],
  ['src/index.css', 'src/index.css', '全局样式'],
  ['server/video2-server.js', 'server/index.js', '后端服务入口'],
  ['server/database.js', 'server/database.js', '数据库操作'],
  ['index-video2.html', 'index.html', 'HTML入口'],
  ['vite.video2.config.ts', 'vite.config.ts', 'Vite构建配置'],
  ['tsconfig.json', 'tsconfig.json', 'TypeScript配置'],
  ['.env.example', '.env.example', '环境变量示例'],
  ['.gitignore', '.gitignore', 'Git忽略配置'],
  ['server/package.json', 'server/package.json', '后端依赖配置'],
];

console.log('【前端文件】');
for (const [src, dest, desc] of files.filter(f => f[1].startsWith('src/') || f[1] === 'index.html' || f[1].endsWith('.ts') || f[1].endsWith('.json'))) {
  if (src.startsWith('src/') || src === 'index-video2.html' || src === 'vite.video2.config.ts' || src === 'tsconfig.json') {
    console.log(`  ${src}  ->  ${dest}`);
    console.log(`    ${desc}`);
  }
}

console.log('');
console.log('【后端文件】');
for (const [src, dest, desc] of files.filter(f => f[1].startsWith('server/'))) {
  console.log(`  ${src}  ->  ${dest}`);
  console.log(`    ${desc}`);
}

console.log('');
console.log('【静态资源目录】');
console.log('  public/images/    ->  public/images/   (图片资源)');
console.log('  public/ffmpeg/    ->  public/ffmpeg/   (ffmpeg wasm文件)');
console.log('  public/uploads/   ->  public/uploads/  (上传目录，可选)');
console.log('  public/favicon.svg -> public/favicon.svg');

console.log('');
console.log('========================================');
console.log('  后端依赖安装');
console.log('========================================');
console.log('');
console.log('cd qizi-video/server');
console.log('npm install');
console.log('');

console.log('========================================');
console.log('  前端依赖安装');
console.log('========================================');
console.log('');
console.log('cd qizi-video');
console.log('npm install');
console.log('');

console.log('========================================');
console.log('  本地开发测试');
console.log('========================================');
console.log('');
console.log('1. 启动后端服务：');
console.log('   cd qizi-video/server && node index.js');
console.log('');
console.log('2. 启动前端开发服务器：');
console.log('   cd qizi-video && npm run dev');
console.log('   (默认端口 3001，代理 /api 到 3001 端口)');
console.log('');

console.log('========================================');
console.log('  生产构建');
console.log('========================================');
console.log('');
console.log('cd qizi-video');
console.log('npm run build');
console.log('');
console.log('构建输出目录：dist/');
console.log('后端服务会自动服务 dist 目录的静态文件');
console.log('');

console.log('========================================');
console.log('  环境变量配置');
console.log('========================================');
console.log('');
console.log('复制 .env.example 为 .env，并填写以下配置：');
console.log('');
console.log('# OSS 配置（与主站共用）');
console.log('REACT_APP_OSS_ACCESS_KEY_ID=your_access_key_id');
console.log('REACT_APP_OSS_ACCESS_KEY_SECRET=your_access_key_secret');
console.log('REACT_APP_OSS_BUCKET=your_bucket_name');
console.log('REACT_APP_OSS_REGION=oss-cn-beijing');
console.log('');
console.log('# 服务端口');
console.log('PORT=3001');
console.log('');

console.log('========================================');
console.log('  数据库迁移');
console.log('========================================');
console.log('');
console.log('将服务器上的 video2.db 复制到 qizi-video/server/ 目录下');
console.log('数据库文件路径：');
console.log('  主站：/var/www/qizi-website/server/video2.db');
console.log('  新站：/var/www/qizi-video/server/video2.db');
console.log('');
console.log('注意：数据库已完全独立，不与主站共享');
console.log('');

console.log('========================================');
console.log('  Nginx 配置 (子域名)');
console.log('========================================');
console.log('');
console.log('配置文件：nginx-video.conf');
console.log('域名：video.qiziwenhua.top');
console.log('反代到：localhost:3001');
console.log('');

console.log('========================================');
console.log('  PM2 部署');
console.log('========================================');
console.log('');
console.log('配置文件：ecosystem-video.config.cjs');
console.log('');
console.log('启动命令：');
console.log('  cd /var/www/qizi-video');
console.log('  pm2 start ecosystem-video.config.cjs');
console.log('');
console.log('或直接启动：');
console.log('  pm2 start server/index.js --name qizi-video');
console.log('');

console.log('========================================');
console.log('  旧链接重定向');
console.log('========================================');
console.log('');
console.log('在主站 Nginx 配置中添加以下重定向规则：');
console.log('');
console.log('# /video2 路径重定向到新域名');
console.log('location /video2/ {');
console.log('    return 301 https://video.qiziwenhua.top/;');
console.log('}');
console.log('');
console.log('# 分享链接重定向');
console.log('location /share/video2/ {');
console.log('    rewrite ^/share/video2/project/(.*)$ https://video.qiziwenhua.top/share/project/$1 permanent;');
console.log('}');
console.log('');
