// 数据库 schema 迁移脚本
// 检查并补齐缺失的列（使用 sqlite3 异步 API）
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = process.env.DB_PATH || path.join(__dirname, 'data.db');
console.log('数据库:', dbPath);

const db = new sqlite3.Database(dbPath);

function getColumns(tableName) {
  return new Promise((resolve, reject) => {
    db.all(`PRAGMA table_info(${tableName})`, (err, rows) => {
      if (err) reject(err);
      else resolve(rows.map(r => r.name));
    });
  });
}

function addColumnIfMissing(tableName, columnName, columnDef) {
  return new Promise(async (resolve, reject) => {
    const cols = await getColumns(tableName);
    if (cols.includes(columnName)) {
      console.log(`  ✓ ${tableName}.${columnName} 已存在`);
      resolve();
    } else {
      console.log(`  + 添加列 ${tableName}.${columnName} (${columnDef})`);
      db.exec(`ALTER TABLE ${tableName} ADD COLUMN ${columnName} ${columnDef}`, (err) => {
        if (err) reject(err);
        else resolve();
      });
    }
  });
}

async function main() {
  console.log('\n=== 检查 portfolio_items ===');
  const pCols = await getColumns('portfolio_items');
  console.log('当前列:', pCols.join(', '));

  const requiredPortfolioCols = [
    ['tag', 'TEXT'],
    ['images', 'TEXT'],
    ['videoUrl', 'TEXT'],
    ['hidden', 'INTEGER DEFAULT 0'],
    ['sortOrder', 'INTEGER DEFAULT 0'],
  ];
  for (const [col, def] of requiredPortfolioCols) {
    await addColumnIfMissing('portfolio_items', col, def);
  }

  console.log('\n=== 检查 categories_details ===');
  const cCols = await getColumns('categories_details');
  console.log('当前列:', cCols.join(', '));

  const requiredCatCols = [
    ['tag', 'TEXT'],
    ['color', 'TEXT'],
    ['bgGlow', 'TEXT'],
    ['icon', 'TEXT'],
    ['sortOrder', 'INTEGER DEFAULT 0'],
  ];
  for (const [col, def] of requiredCatCols) {
    await addColumnIfMissing('categories_details', col, def);
  }

  console.log('\n=== 完成！===');
  console.log('portfolio_items:', (await getColumns('portfolio_items')).join(', '));
  console.log('categories_details:', (await getColumns('categories_details')).join(', '));

  db.close();
}

main().catch(err => { console.error(err); db.close(); process.exit(1); });
