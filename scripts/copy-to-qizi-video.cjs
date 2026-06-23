const fs = require('fs');
const path = require('path');

const sourceDir = path.join(__dirname, '..');
const targetDir = path.join(__dirname, '..', '..', 'qizi-video');

const filesToCopy = [
  ['src/Video2App.tsx', 'src/App.tsx'],
  ['src/main-video2.tsx', 'src/main.tsx'],
  ['src/components/Video2Page.tsx', 'src/components/Video2Page.tsx'],
  ['src/components/Video2ProjectList.tsx', 'src/components/Video2ProjectList.tsx'],
  ['src/components/ConfirmDialog.tsx', 'src/components/ConfirmDialog.tsx'],
  ['src/components/WeChatShareHint.tsx', 'src/components/WeChatShareHint.tsx'],
  ['src/lib/shareUtils.ts', 'src/lib/shareUtils.ts'],
  ['src/lib/ossUtils.ts', 'src/lib/ossUtils.ts'],
  ['src/lib/videoCompressor.ts', 'src/lib/videoCompressor.ts'],
  ['src/index.css', 'src/index.css'],
  ['server/video2-server.js', 'server/index.js'],
  ['server/database.js', 'server/database.js'],
  ['index-video2.html', 'index.html'],
  ['.env.example', '.env.example'],
  ['.gitignore', '.gitignore'],
  ['tsconfig.json', 'tsconfig.json'],
  ['vite.video2.config.ts', 'vite.config.ts'],
  ['server/package.json', 'server/package.json'],
];

function copyDir(src, dest) {
  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true });
  }
  const entries = fs.readdirSync(src, { withFileTypes: true });
  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      copyDir(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

console.log('开始复制文件到 qizi-video...');

for (const [src, dest] of filesToCopy) {
  const srcPath = path.join(sourceDir, src);
  const destPath = path.join(targetDir, dest);
  const destDir = path.dirname(destPath);
  
  if (!fs.existsSync(srcPath)) {
    console.log(`跳过（源文件不存在）: ${src}`);
    continue;
  }
  
  if (!fs.existsSync(destDir)) {
    fs.mkdirSync(destDir, { recursive: true });
  }
  
  fs.copyFileSync(srcPath, destPath);
  console.log(`已复制: ${src} -> ${dest}`);
}

const publicDirs = ['public/images', 'public/ffmpeg', 'public/uploads'];
for (const dir of publicDirs) {
  const srcPath = path.join(sourceDir, dir);
  const destPath = path.join(targetDir, dir);
  if (fs.existsSync(srcPath)) {
    copyDir(srcPath, destPath);
    console.log(`已复制目录: ${dir}`);
  }
}

const faviconPath = path.join(sourceDir, 'public', 'favicon.svg');
const faviconDest = path.join(targetDir, 'public', 'favicon.svg');
if (fs.existsSync(faviconPath)) {
  const favDir = path.dirname(faviconDest);
  if (!fs.existsSync(favDir)) fs.mkdirSync(favDir, { recursive: true });
  fs.copyFileSync(faviconPath, faviconDest);
  console.log('已复制: public/favicon.svg');
}

console.log('\n文件复制完成！');
