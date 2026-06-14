const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./data.db');
db.all('SELECT COUNT(*) as cnt FROM portfolio_items', (e, r) => console.log('portfolio_items:', r[0].cnt));
db.all('SELECT COUNT(*) as cnt FROM categories_details', (e, r) => console.log('categories_details:', r[0].cnt));
db.all('SELECT COUNT(*) as cnt FROM featured_works', (e, r) => console.log('featured_works:', r[0].cnt));
db.all('SELECT COUNT(*) as cnt FROM team_members', (e, r) => console.log('team_members:', r[0].cnt));
db.all('SELECT COUNT(*) as cnt FROM home_content', (e, r) => console.log('home_content:', r[0].cnt));
db.close();
