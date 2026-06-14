// 检查数据库中作品数据状态
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'data.db');
const db = new sqlite3.Database(dbPath);

console.log('========== 数据库状态检查 ==========\n');
console.log('数据库路径:', dbPath);

// 1. 统计作品总数
db.get('SELECT COUNT(*) as count FROM portfolio_items', (err, row) => {
  if (err) { console.error('错误:', err.message); return; }
  console.log(`\n【1】作品总数: ${row.count}`);
});

// 2. 检查 videoUrl 字段
db.all('SELECT id, title, type, videoUrl, img FROM portfolio_items ORDER BY id', (err, rows) => {
  if (err) { console.error('错误:', err.message); return; }
  console.log(`\n【2】作品详情 (共 ${rows.length} 条):`);
  let withVideo = 0;
  let withoutVideo = 0;
  let typeImage = 0;
  let typeVideo = 0;
  rows.forEach(row => {
    const hasVideo = row.videoUrl && row.videoUrl.trim() !== '';
    if (hasVideo) withVideo++; else withoutVideo++;
    if (row.type === 'video') typeVideo++;
    if (row.type === 'image') typeImage++;
    console.log(`  ID=${row.id}, type=${row.type}, title=${row.title.substring(0, 20)}, videoUrl=${hasVideo ? '已设置 ✓' : '空 ✗'}, img=${row.img ? row.img.substring(0, 60) : '空'}`);
  });
  console.log(`  └─ 有视频URL: ${withVideo}, 无视频URL: ${withoutVideo}`);
  console.log(`  └─ type=video: ${typeVideo}, type=image: ${typeImage}`);
});

// 3. 检查重复数据（按 title 去重）
db.all('SELECT title, COUNT(*) as cnt, GROUP_CONCAT(id) as ids FROM portfolio_items GROUP BY title HAVING cnt > 1', (err, rows) => {
  if (err) { console.error('错误:', err.message); return; }
  console.log(`\n【3】按 title 重复的作品:`);
  if (rows.length === 0) {
    console.log('  ✓ 无重复标题');
  } else {
    rows.forEach(row => {
      console.log(`  标题 "${row.title}" 出现 ${row.cnt} 次, IDs: ${row.ids}`);
    });
  }
});

// 4. 检查按 img URL 重复
db.all('SELECT img, COUNT(*) as cnt, GROUP_CONCAT(id) as ids FROM portfolio_items WHERE img IS NOT NULL GROUP BY img HAVING cnt > 1', (err, rows) => {
  if (err) { console.error('错误:', err.message); return; }
  console.log(`\n【4】按 img URL 重复的作品:`);
  if (rows.length === 0) {
    console.log('  ✓ 无重复图片URL');
  } else {
    rows.forEach(row => {
      console.log(`  img "${row.img ? row.img.substring(0, 80) : ''}" 出现 ${row.cnt} 次, IDs: ${row.ids}`);
    });
  }
});

// 5. 检查分类
db.all('SELECT id, name, sortOrder FROM categories_details ORDER BY sortOrder', (err, rows) => {
  if (err) { console.error('错误:', err.message); return; }
  console.log(`\n【5】分类列表 (共 ${rows.length} 条):`);
  rows.forEach(row => {
    console.log(`  ${row.id} - ${row.name} (sort=${row.sortOrder})`);
  });
});

// 6. 检查精选作品
db.all('SELECT fw.id, fw.portfolioId, fw.sortOrder, pi.title FROM featured_works fw LEFT JOIN portfolio_items pi ON fw.portfolioId = pi.id ORDER BY fw.sortOrder', (err, rows) => {
  if (err) { console.error('错误:', err.message); return; }
  console.log(`\n【6】精选作品列表 (共 ${rows.length} 条):`);
  rows.forEach(row => {
    console.log(`  ${row.id} - portfolioId=${row.portfolioId}, title=${row.title ? row.title.substring(0, 20) : 'N/A'}, sort=${row.sortOrder}`);
  });
});

setTimeout(() => {
  db.close();
  console.log('\n========== 检查完成 ==========');
}, 800);
