const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'video2.db');
const db = new sqlite3.Database(dbPath);

db.run("DELETE FROM videos WHERE title LIKE 'debug-test-%'", function(err) {
  if (err) {
    console.error('删除失败:', err.message);
  } else {
    console.log('删除 debug-test 视频: ' + this.changes + ' 条');
  }
  db.close();
});
