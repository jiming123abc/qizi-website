// 清理未使用的 AI 生成图片
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

const dbPath = path.join(__dirname, 'data.db');
const db = new sqlite3.Database(dbPath);

function dbAll(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
}

async function main() {
  console.log('检查数据库中引用的文件...\n');

  // 获取所有可能引用文件路径的数据库字段
  const references = new Set();

  // 1. 作品图片
  const items = await dbAll('SELECT title, img, images FROM portfolio_items');
  items.forEach(item => {
    if (item.img) references.add(item.img);
  });

  // 2. 分类封面图
  const categories = await dbAll('SELECT name, coverImage FROM categories_details');
  categories.forEach(cat => {
    if (cat.coverImage) references.add(cat.coverImage);
  });

  // 3. 首页内容
  const homeContent = await dbAll('SELECT heroImage, heroSlides FROM home_content');
  homeContent.forEach(content => {
    if (content.heroImage) references.add(content.heroImage);
    if (content.heroSlides) {
      try {
        const slides = JSON.parse(content.heroSlides);
        slides.forEach(slide => { if (slide.img) references.add(slide.img); });
      } catch (e) {}
    }
  });

  // 4. 团队成员头像
  const members = await dbAll('SELECT name, avatar FROM team_members');
  members.forEach(m => { if (m.avatar) references.add(m.avatar); });

  console.log('数据库中引用的文件路径:');
  [...references].forEach(r => {
    console.log(`  ${r.substring(0, 100)}`);
  });

  // 检查 uploads/images 目录中的本地文件
  const imagesDir = path.join(__dirname, '../public/uploads/images');
  if (!fs.existsSync(imagesDir)) {
    console.log('\n目录不存在:', imagesDir);
    db.close();
    return;
  }

  const files = fs.readdirSync(imagesDir);
  console.log(`\n目录 ${imagesDir} 中的文件 (${files.length} 个):`);

  const aiGeneratedFiles = files.filter(f => f.startsWith('ai-cover-') || f.startsWith('ai-generated-'));
  const otherFiles = files.filter(f => !f.startsWith('ai-cover-') && !f.startsWith('ai-generated-'));

  console.log('\nAI 生成的文件:');
  const filesToDelete = [];
  const filesToKeep = [];

  for (const file of [...aiGeneratedFiles, ...otherFiles]) {
    const relativePath = `/uploads/images/${file}`;
    const isReferenced = [...references].some(ref => {
      return ref === relativePath ||
             ref.includes(file) ||
             relativePath.includes(ref.split('/').pop());
    });

    const filePath = path.join(imagesDir, file);
    const fileSizeKB = (fs.statSync(filePath).size / 1024).toFixed(1);

    if (isReferenced) {
      console.log(`  ✓ ${file} (${fileSizeKB} KB) - 已引用`);
      filesToKeep.push(file);
    } else {
      console.log(`  ✗ ${file} (${fileSizeKB} KB) - 未引用，可删除`);
      filesToDelete.push(file);
    }
  }

  console.log(`\n总结:`);
  console.log(`  可删除文件: ${filesToDelete.length} 个`);
  console.log(`  保留文件: ${filesToKeep.length} 个`);

  if (filesToDelete.length > 0) {
    console.log('\n正在删除未使用的文件...');
    let freedBytes = 0;
    for (const file of filesToDelete) {
      const filePath = path.join(imagesDir, file);
      const size = fs.statSync(filePath).size;
      try {
        fs.unlinkSync(filePath);
        freedBytes += size;
        console.log(`  ✓ 已删除: ${file} (${(size/1024).toFixed(1)} KB)`);
      } catch (err) {
        console.log(`  ✗ 删除失败: ${file} - ${err.message}`);
      }
    }
    console.log(`\n共释放 ${(freedBytes / 1024).toFixed(1)} KB 磁盘空间`);
  } else {
    console.log('\n没有需要删除的文件。');
  }

  db.close();
  console.log('\n完成！');
}

main().catch(err => {
  console.error('执行失败:', err);
  db.close();
  process.exit(1);
});
