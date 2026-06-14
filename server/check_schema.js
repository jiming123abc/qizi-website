const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./data.db');
db.all('PRAGMA table_info(team_members)', (err, cols) => {
  console.log('team_members columns:', JSON.stringify(cols, null, 2));
  db.all('PRAGMA table_info(categories_details)', (err2, cols2) => {
    console.log('categories_details columns:', JSON.stringify(cols2, null, 2));
    db.all('PRAGMA table_info(featured_works)', (err3, cols3) => {
      console.log('featured_works columns:', JSON.stringify(cols3, null, 2));
      db.close();
    });
  });
});
