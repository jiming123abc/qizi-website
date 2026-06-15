const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'data.db');
const db = new sqlite3.Database(dbPath);

console.log('========== 检查作品标签和简短描述 ==========\n');

db.all('SELECT id, title, tag, shortDesc, category FROM portfolio_items ORDER BY id', (err, rows) => {
  if (err) {
    console.error('读取数据失败:', err.message);
    db.close();
    return;
  }

  console.log('共检测到 ' + rows.length + ' 个作品\n');

  const itemsWithEmptyTag = [];
  const itemsWithTag = [];

  rows.forEach(row => {
    const hasEmptyTag = !row.tag || row.tag.trim() === '' || /^\d+$/.test(row.tag);
    if (hasEmptyTag) {
      itemsWithEmptyTag.push(row);
    } else {
      itemsWithTag.push(row);
    }
  });

  console.log('标签为空或无效的作品: ' + itemsWithEmptyTag.length + ' 个\n');

  if (itemsWithEmptyTag.length > 0) {
    itemsWithEmptyTag.forEach(item => {
      console.log('  ID=' + item.id + ': "' + (item.title || '').substring(0, 30) + '..."');
      console.log('    当前标签: "' + (item.tag || '(空)') + '"');
      console.log('    简短描述: "' + (item.shortDesc || '(空)') + '"');
      console.log('    分类: "' + (item.category || '(空)') + '"');
      console.log();
    });
  }

  console.log('已有有效标签的作品: ' + itemsWithTag.length + ' 个\n');
  itemsWithTag.slice(0, 5).forEach(item => {
    console.log('  ID=' + item.id + ': "' + (item.title || '').substring(0, 30) + '..." -> 标签: "' + item.tag + '"');
  });

  console.log('\n标签统计:');
  const tagStats = {};
  rows.forEach(row => {
    const tag = row.tag && row.tag.trim() !== '' && !/^\d+$/.test(row.tag) ? row.tag : '(空)';
    tagStats[tag] = (tagStats[tag] || 0) + 1;
  });

  Object.entries(tagStats).forEach(([tag, count]) => {
    console.log('  "' + tag + '": ' + count + ' 个作品');
  });

  db.close();
  console.log('\n========== 完成 ==========');
});
