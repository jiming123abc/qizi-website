const fs = require('fs');
const sqlite3 = require('sqlite3').verbose();
const data = JSON.parse(fs.readFileSync('./db_backup.json', 'utf8'));

// 本地原始建表语句（从 database.js 提取）
const createStatements = [
  `CREATE TABLE IF NOT EXISTS categories_details (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    coverImage TEXT,
    icon TEXT,
    sortOrder INTEGER DEFAULT 0,
    tag TEXT,
    color TEXT,
    bgGlow TEXT,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
  )`,
  `CREATE TABLE IF NOT EXISTS portfolio_items (
    id INTEGER PRIMARY KEY,
    category TEXT,
    title TEXT,
    shortDesc TEXT,
    fullDesc TEXT,
    img TEXT,
    images TEXT,
    videoUrl TEXT,
    type TEXT DEFAULT 'image',
    color TEXT DEFAULT 'text-primary',
    bgGlow TEXT DEFAULT 'bg-primary/20',
    sortOrder INTEGER DEFAULT 0,
    hidden INTEGER DEFAULT 0,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
  )`,
  `CREATE TABLE IF NOT EXISTS team_members (
    id INTEGER PRIMARY KEY,
    name TEXT NOT NULL,
    title TEXT,
    avatar TEXT,
    bio TEXT,
    sortOrder INTEGER DEFAULT 0,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
  )`,
  `CREATE TABLE IF NOT EXISTS featured_works (
    id TEXT PRIMARY KEY,
    portfolioId INTEGER,
    img TEXT,
    title TEXT,
    link TEXT,
    sortOrder INTEGER DEFAULT 0,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
  )`,
  `CREATE TABLE IF NOT EXISTS home_content (
    id INTEGER PRIMARY KEY,
    heroTitle TEXT,
    heroGradientTitle TEXT,
    heroSubtitle TEXT,
    heroImage TEXT,
    heroSlides TEXT,
    shareTitle TEXT,
    shareDescription TEXT,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
  )`
];

const db = new sqlite3.Database('./data.db');

db.serialize(() => {
  // 1. 删除旧表
  db.run('DROP TABLE IF EXISTS home_content');
  db.run('DROP TABLE IF EXISTS featured_works');
  db.run('DROP TABLE IF EXISTS team_members');
  db.run('DROP TABLE IF EXISTS portfolio_items');
  db.run('DROP TABLE IF EXISTS categories_details');
  console.log('Dropped old tables');

  // 2. 按本地 schema 创建新表
  createStatements.forEach(sql => {
    db.run(sql);
  });
  console.log('Created tables with local schema');

  // 3. 插入数据
  // categories_details
  const catStmt = db.prepare('INSERT INTO categories_details (id, name, description, coverImage, icon, sortOrder, tag, color, bgGlow, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)');
  data.categories_details.forEach(row => {
    catStmt.run(row.id, row.name, row.description, row.coverImage, row.icon, row.sortOrder, row.tag, row.color, row.bgGlow, row.createdAt, row.updatedAt);
  });
  catStmt.finalize();
  console.log('categories_details: ' + data.categories_details.length + ' rows');

  // portfolio_items
  const portStmt = db.prepare('INSERT INTO portfolio_items (id, category, title, shortDesc, fullDesc, img, images, videoUrl, type, color, bgGlow, sortOrder, hidden, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)');
  data.portfolio_items.forEach(row => {
    // portfolio_items - images 可能是字符串（从SQLite读出）也可能是数组（从JSON文件）
  let imagesVal = row.images;
  if (typeof imagesVal === 'string') {
    try { imagesVal = JSON.parse(imagesVal); } catch {}
  }
  portStmt.run(row.id, row.category, row.title, row.shortDesc, row.fullDesc, row.img, JSON.stringify(imagesVal || []), row.videoUrl, row.type, row.color, row.bgGlow, row.sortOrder, row.hidden, row.createdAt, row.updatedAt);
  });
  portStmt.finalize();
  console.log('portfolio_items: ' + data.portfolio_items.length + ' rows');

  // team_members
  const teamStmt = db.prepare('INSERT INTO team_members (id, name, title, avatar, bio, sortOrder, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?)');
  data.team_members.forEach(row => {
    teamStmt.run(row.id, row.name, row.title, row.avatar, row.bio, row.sortOrder, row.createdAt, row.updatedAt);
  });
  teamStmt.finalize();
  console.log('team_members: ' + data.team_members.length + ' rows');

  // featured_works
  const featStmt = db.prepare('INSERT INTO featured_works (id, portfolioId, img, title, link, sortOrder, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?)');
  data.featured_works.forEach(row => {
    featStmt.run(row.id, row.portfolioId, row.img, row.title, row.link, row.sortOrder, row.createdAt, row.updatedAt);
  });
  featStmt.finalize();
  console.log('featured_works: ' + data.featured_works.length + ' rows');

  // home_content
  const homeStmt = db.prepare('INSERT INTO home_content (id, heroTitle, heroGradientTitle, heroSubtitle, heroImage, heroSlides, shareTitle, shareDescription, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)');
  data.home_content.forEach(row => {
    // home_content - heroSlides 可能是字符串也可能是数组
  let slidesVal = row.heroSlides;
  if (typeof slidesVal === 'string') {
    try { slidesVal = JSON.parse(slidesVal); } catch {}
  }
  homeStmt.run(row.id, row.heroTitle, row.heroGradientTitle, row.heroSubtitle, row.heroImage, JSON.stringify(slidesVal || []), row.shareTitle, row.shareDescription, row.updatedAt);
  });
  homeStmt.finalize();
  console.log('home_content: ' + data.home_content.length + ' rows');

  console.log('\nAll data imported successfully!');
});

db.close(() => {
  process.exit(0);
});
