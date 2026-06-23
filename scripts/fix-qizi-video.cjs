const fs = require('fs');
const path = require('path');

const targetDir = path.join(__dirname, '..', '..', 'qizi-video');

console.log('开始修复 qizi-video 配置...\n');

// 1. 修复 main.tsx 导入路径
const mainTsxPath = path.join(targetDir, 'src', 'main.tsx');
let mainTsx = fs.readFileSync(mainTsxPath, 'utf-8');
mainTsx = mainTsx.replace("from './Video2App'", "from './App'");
fs.writeFileSync(mainTsxPath, mainTsx);
console.log('✅ 修复: src/main.tsx 导入路径');

// 2. 修复 vite.config.ts
const viteConfigPath = path.join(targetDir, 'vite.config.ts');
let viteConfig = fs.readFileSync(viteConfigPath, 'utf-8');
viteConfig = viteConfig.replace("outDir: 'dist-video2'", "outDir: 'dist'");
viteConfig = viteConfig.replace("open: '/index-video2.html'", "open: '/'");
// 端口改为 3002（避免与后端 3001 冲突）
viteConfig = viteConfig.replace("port: 3002", "port: 3002");
fs.writeFileSync(viteConfigPath, viteConfig);
console.log('✅ 修复: vite.config.ts 配置');

// 3. 修复后端 package.json 入口文件
const serverPkgPath = path.join(targetDir, 'server', 'package.json');
let serverPkg = JSON.parse(fs.readFileSync(serverPkgPath, 'utf-8'));
serverPkg.main = 'index.js';
serverPkg.scripts.start = 'node index.js';
serverPkg.scripts.dev = 'nodemon index.js';
fs.writeFileSync(serverPkgPath, JSON.stringify(serverPkg, null, 2));
console.log('✅ 修复: server/package.json 入口文件');

// 4. 修复后端 index.js 中的 dist 路径引用
const serverIndexPath = path.join(targetDir, 'server', 'index.js');
let serverIndex = fs.readFileSync(serverIndexPath, 'utf-8');
// 把 dist-video2 改为 dist
serverIndex = serverIndex.replace("../dist-video2", "../dist");
fs.writeFileSync(serverIndexPath, serverIndex);
console.log('✅ 修复: server/index.js 静态文件路径');

// 5. 修复前端 package.json 的 dev 端口
const pkgPath = path.join(targetDir, 'package.json');
let pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));
pkg.scripts.dev = 'vite --port=3002 --host=0.0.0.0';
pkg.scripts.clean = 'rm -rf dist';
fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2));
console.log('✅ 修复: package.json dev 端口');

console.log('\n🎉 所有配置修复完成！');
console.log('');
console.log('接下来的步骤：');
console.log('1. cd qizi-video/server && npm install --ignore-scripts');
console.log('   (跳过 ffmpeg-static 的二进制下载，使用系统 ffmpeg)');
console.log('');
console.log('2. 如果本地没有 ffmpeg，可以从主站复制 node_modules：');
console.log('   xcopy /E /I qizi-website\\server\\node_modules qizi-video\\server\\node_modules');
console.log('');
console.log('3. 启动后端：cd qizi-video/server && node index.js');
console.log('');
console.log('4. 启动前端：cd qizi-video && npm run dev');
