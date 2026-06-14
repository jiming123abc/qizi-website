const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('server/data.db');
db.all('SELECT title, img, videoUrl, type FROM portfolio_items ORDER BY sortOrder', (err, rows) => {
  if (err) { console.error(err); db.close(); return; }
  console.log('总计:', rows.length);
  console.log('有视频URL的:', rows.filter(r => r.videoUrl).length);
  console.log('无视频URL的:', rows.filter(r => !r.videoUrl).length);
  console.log('\n--- 无视频URL的作品 ---\n');
  rows.filter(r => !r.videoUrl).forEach((r, i) => {
    console.log(`${i+1}. [${r.type}] ${r.title}`);
    console.log(`   img: ${r.img}\n`);
  });
  console.log('\n--- 有视频URL的作品示例 ---\n');
  rows.filter(r => r.videoUrl).slice(0, 3).forEach((r, i) => {
    console.log(`${i+1}. [${r.type}] ${r.title}`);
    console.log(`   img: ${r.img.substring(0, 60)}...`);
    console.log(`   video: ${r.videoUrl}\n`);
  });
  db.close();
});
