const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./data.db');
db.all('SELECT heroSlides FROM home_content LIMIT 1', (e, r) => {
  const slides = r[0].heroSlides;
  console.log('Type:', typeof slides);
  console.log('First 80 chars:', String(slides).substring(0, 80));
  try {
    const parsed = JSON.parse(slides);
    console.log('After JSON.parse - is array:', Array.isArray(parsed), 'length:', parsed.length);
  } catch(err) {
    console.log('JSON.parse failed:', err.message);
  }
  db.close();
});
