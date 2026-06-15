const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'data.db');
const db = new sqlite3.Database(dbPath);

console.log('========== 批量填充空标签 ==========\n');

db.all('SELECT id, title, tag, shortDesc, category FROM portfolio_items ORDER BY id', (err, rows) => {
  if (err) {
    console.error('读取数据失败:', err.message);
    db.close();
    return;
  }

  const itemsWithEmptyTag = rows.filter(row => !row.tag || row.tag.trim() === '' || /^\d+$/.test(row.tag));
  const totalCount = rows.length;
  const emptyTagCount = itemsWithEmptyTag.length;

  console.log(`共检测到 ${totalCount} 个作品`);
  console.log(`其中标签为空或无效的作品: ${emptyTagCount} 个\n`);

  if (emptyTagCount === 0) {
    console.log('✓ 没有需要填充的空标签');
    db.close();
    return;
  }

  console.log('需要填充标签的作品列表:');
  itemsWithEmptyTag.forEach(item => {
    const fillValue = item.shortDesc && item.shortDesc.trim() !== '' 
      ? item.shortDesc.substring(0, 20) + (item.shortDesc.length > 20 ? '...' : '')
      : item.category || '未分类';
    console.log(`  ID=${item.id}: "${item.title.substring(0, 25)}..." -> 将填充: "${fillValue}"`);
  });

  console.log('\n开始批量填充...');

  db.serialize(() => {
    db.run('BEGIN');
    let updatedCount = 0;

    itemsWithEmptyTag.forEach(item => {
      let newTag = '';
      
      if (item.shortDesc && item.shortDesc.trim() !== '') {
        newTag = item.shortDesc.trim();
      } else if (item.category && item.category.trim() !== '' && !/^\d+$/.test(item.category)) {
        newTag = item.category.trim();
      } else {
        newTag = '未分类';
      }

      db.run(
        'UPDATE portfolio_items SET tag = ?, updatedAt = CURRENT_TIMESTAMP WHERE id = ?',
        [newTag, item.id],
        function(err) {
          if (err) {
            console.error(`  ✗ ID=${item.id} 更新失败:`, err.message);
          } else if (this.changes > 0) {
            updatedCount++;
            console.log(`  ✓ ID=${item.id} 已填充标签: "${newTag.substring(0, 20)}${newTag.length > 20 ? '...' : ''}"`);
          }
        }
      );
    });

    db.run('COMMIT', (err) => {
      if (err) {
        console.error('\n✗ 事务失败:', err.message);
        db.run('ROLLBACK');
      } else {
        console.log(`\n✅ 批量填充完成！`);
        console.log(`   共处理 ${emptyTagCount} 个作品，成功更新 ${updatedCount} 条记录`);
        
        db.all('SELECT tag, COUNT(*) as count FROM portfolio_items GROUP BY tag ORDER BY count DESC', (err, result) => {
          if (err) {
            console.error('统计失败:', err.message);
          } else {
            console.log('\n标签统计:');
            result.forEach(r => {
              console.log(`  "${r.tag}": ${r.count} 个作品`);
            });
          }
          db.close();
          console.log('\n========== 完成 ==========');
        });
      }
    });
  });
});