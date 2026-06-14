// 数据库 schema 迁移脚本
// 检查并补齐缺失的列
const path = require('path');
const Database = require('better-sqlite3');

const dbPath = process.env.DB_PATH || path.join(__dirname, 'data', 'portfolio.db');
const db = new Database(dbPath);

console.log('数据库:', dbPath);

function getColumns(tableName) {
  return db.prepare(`PRAGMA table_info(${tableName})`).all().map(c => c.name);
}

function addColumnIfMissing(tableName, columnName, columnDef) {
  const existingCols = getColumns(tableName);
  if (!existingCols.includes(columnName)) {
    console.log(`  + 添加列 ${tableName}.${columnName} (${columnDef})`);
    db.exec(`ALTER TABLE ${tableName} ADD COLUMN ${columnName} ${columnDef}`);
    return true;
  }
  console.log(`  ✓ ${tableName}.${columnName} 已存在`);
  return false;
}

console.log('\n=== 检查 portfolio_items ===');
const portfolioCols = getColumns('portfolio_items');
console.log('当前列:', portfolioCols.join(', '));

// 需要的列（根据 data/database.js 的最新 schema）
const requiredPortfolioCols = [
  ['tag', 'TEXT'],
  ['images', 'TEXT'],
  ['videoUrl', 'TEXT'],
  ['hidden', 'INTEGER DEFAULT 0'],
  ['sortOrder', 'INTEGER DEFAULT 0'],
];
for (const [col, def] of requiredPortfolioCols) {
  addColumnIfMissing('portfolio_items', col, def);
}

console.log('\n=== 检查 categories_details ===');
const catCols = getColumns('categories_details');
console.log('当前列:', catCols.join(', '));

const requiredCatCols = [
  ['tag', 'TEXT'],
  ['color', 'TEXT'],
  ['bgGlow', 'TEXT'],
  ['icon', 'TEXT'],
  ['sortOrder', 'INTEGER DEFAULT 0'],
];
for (const [col, def] of requiredCatCols) {
  addColumnIfMissing('categories_details', col, def);
}

console.log('\n=== 完成！===');
console.log('\nportfolio_items 最终列:', getColumns('portfolio_items').join(', '));
console.log('categories_details 最终列:', getColumns('categories_details').join(', '));

db.close();
