// 分析 import-old-data.js 中每个作品的完整 img URL（解决重复图片问题）
const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'import-old-data.js');
const content = fs.readFileSync(filePath, 'utf8');

// 提取所有 portfolioItems 条目
// 匹配格式: { title: 'xxx', category: 'xxx', tag: 'xxx', shortDesc: 'xxx', fullDesc: 'xxx', img: 'URL', ... }
const itemRegex = /title:\s*'([^']+)'.*?img:\s*'([^']+)'/gs;
const items = [];
let match;
while ((match = itemRegex.exec(content)) !== null) {
  items.push({ title: match[1], img: match[2] });
}

console.log(`import-old-data.js 中共有 ${items.length} 个作品\n`);
console.log('========== 作品清单及 img URL ==========\n');

const imgMap = {};
items.forEach((item, idx) => {
  console.log(`${idx + 1}. ${item.title}`);
  console.log(`   img: ${item.img}`);
  if (!imgMap[item.img]) imgMap[item.img] = [];
  imgMap[item.img].push(item.title);
});

console.log('\n========== 按 img URL 分组（源文件中是否就有重复）==========\n');
let dupCount = 0;
Object.keys(imgMap).forEach(img => {
  if (imgMap[img].length > 1) {
    dupCount++;
    console.log(`[重复组 ${dupCount}] ${img}`);
    imgMap[img].forEach(t => console.log(`  - ${t}`));
  }
});
if (dupCount === 0) console.log('✅ 源文件中无重复 img URL');

console.log(`\n总计：${items.length} 个作品，${dupCount} 组重复`);

// 检查是否所有作品 URL 都是唯一的
console.log('\n========== URL 去重分析 ==========\n');
const uniqueImgs = new Set(items.map(i => i.img));
console.log(`作品数: ${items.length}, 唯一图片数: ${uniqueImgs.size}`);
