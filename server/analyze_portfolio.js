// 深度分析：比较数据库与旧网站作品清单
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'data.db');
const db = new sqlite3.Database(dbPath);

// 从 import-old-data.js 提取的标准作品清单（旧网站作品）
const oldSiteTitles = [
  // 精选
  '深大微众金融科技学院形象宣传片',
  '大连理工大学人才宣传片',
  '山东财经大学招生宣传片',
  '玉兰',
  '专题思政课',
  '大连理工大学2023级毕业MV',
  '大连理工大学毕业生演讲会宣传视频',
  '哈尔滨工业大学威海校区形象宣传片',
  'AI数字人直播演示',
  '融创集团品牌形象片',
  // 普通
  '大连理工大学招生宣传视频',
  '大连理工大学国旗护卫队形象视频',
  '东北大学校园开放日活动记录',
  '毕业季系列微电影',
  '校园歌手大赛总决赛实录',
  '开学典礼全程记录',
  '校庆晚会创意视频',
  '大连理工大学人才引进形象宣传片',
  '深圳大学招生宣传片',
  '广东省建筑设计研究院校招形象片',
  '融创西南校招形象片',
  '企业党建宣传片',
  '校史档案专题片',
  '教师风采专题片',
  '学院文化宣传系列视频',
  '国家精品在线课程录制',
  '大学物理实验慕课视频',
  '在线开放课程建设',
  '专业课程微课视频制作',
  '弘扬劳模精神专题党课',
  '党建工作先进事迹片',
  '新时代共产党员风采录',
  '听她说——佩璇·时光守艺人',
  '学者的一天',
  '青年创业者访谈录',
  '非遗传承人纪录片',
  '边界猎手APP演示',
  '企业年报数据可视化动画',
  '产品功能MG动画',
  '三维建筑漫游动画',
  '九州建设',
  '品牌年度大会宣传片',
  '企业文化宣传短片',
  '产品发布预告视频'
];

console.log('========== 深度分析：数据库 vs 旧网站清单 ==========\n');

db.all('SELECT id, title, img, type, videoUrl FROM portfolio_items ORDER BY id', (err, rows) => {
  if (err) { console.error('错误:', err.message); return; }

  console.log(`数据库当前作品: ${rows.length} 个`);
  console.log(`旧网站标准作品: ${oldSiteTitles.length} 个\n`);

  // 匹配分析
  const matched = [];
  const extra = []; // 数据库有但旧网站没有 = 多余/测试数据
  const missing = []; // 旧网站有但数据库没有

  rows.forEach(row => {
    const isInOldSite = oldSiteTitles.some(t => t === row.title || row.title.startsWith(t.substring(0, 5)));
    if (isInOldSite) {
      matched.push(row);
    } else {
      extra.push(row);
    }
  });

  oldSiteTitles.forEach(title => {
    const exists = rows.some(r => r.title === title);
    if (!exists) missing.push(title);
  });

  console.log(`【匹配】旧网站作品：${matched.length} 个`);
  console.log(`【多余】数据库特有（可能是测试数据）：${extra.length} 个`);
  extra.forEach(r => console.log(`  ID=${r.id}, title="${r.title}", img=${r.img ? r.img.substring(0, 60) : '空'}`));
  console.log(`\n【缺失】数据库没有的旧网站作品：${missing.length} 个`);
  missing.forEach(t => console.log(`  - ${t}`));

  // 按 img URL 分析重复问题（详细列出每组）
  console.log('\n========== 重复 img URL 详细分析 ==========\n');
  const imgGroups = {};
  rows.forEach(r => {
    if (!r.img) return;
    const key = r.img.substring(0, 100);
    if (!imgGroups[key]) imgGroups[key] = [];
    imgGroups[key].push(r);
  });

  let dupGroupCount = 0;
  Object.keys(imgGroups).forEach(key => {
    if (imgGroups[key].length > 1) {
      dupGroupCount++;
      console.log(`\n重复组 ${dupGroupCount}: ${key}`);
      imgGroups[key].forEach(r => {
        const isStandard = oldSiteTitles.some(t => t === r.title || r.title.startsWith(t.substring(0, 5)));
        console.log(`  ID=${r.id}, title="${r.title.substring(0, 30)}" [${isStandard ? '标准作品' : '多余/测试'}]`);
      });
    }
  });

  console.log(`\n共 ${dupGroupCount} 组重复 img URL`);

  db.close();
  console.log('\n========== 分析结束 ==========');
});
