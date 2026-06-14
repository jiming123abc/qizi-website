// 综合修复脚本：清理测试数据 + 补全缺失作品 + 设置正确 videoUrl
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'data.db');
const db = new sqlite3.Database(dbPath);

// ========== 需要删除的测试数据 ID ==========
const TEST_DATA_IDS = [1, 2, 3, 5, 6, 7];

// ========== 标准作品清单（按 sortOrder 排序）==========
// 从 import-old-data.js 提取
const STANDARD_ITEMS = [
  // 精选作品 (sortOrder 0-9, featured=true)
  { title: '深大微众金融科技学院形象宣传片', category: '专题视频', tag: '形象片', sortOrder: 0, featured: true, img: 'http://outin-b731b50d948211ecb5cc00163e0eb78b.oss-cn-beijing.aliyuncs.com/image/cover/A71C2187F49C4372B6F87D3C7B339DB9-6-2.png' },
  { title: '大连理工大学人才宣传片', category: '活动视频', tag: '宣传片', sortOrder: 1, featured: true, img: 'http://outin-b731b50d948211ecb5cc00163e0eb78b.oss-cn-beijing.aliyuncs.com/image/cover/BC8CDEE594E141BB9303DFC2DA4E23C9-6-2.png' },
  { title: '山东财经大学招生宣传片', category: '专题视频', tag: '招生', sortOrder: 2, featured: true, img: 'http://outin-b731b50d948211ecb5cc00163e0eb78b.oss-cn-beijing.aliyuncs.com/image/cover/20CE451285C6421491C71A5E9A0A30BD-6-2.png' },
  { title: '玉兰', category: '专题视频', tag: '短片', sortOrder: 3, featured: true, img: 'http://outin-b731b50d948211ecb5cc00163e0eb78b.oss-cn-beijing.aliyuncs.com/image/cover/D74323BE993A4E879C2CE0FDEF16C42C-6-2.png' },
  { title: '专题思政课', category: '课程建设', tag: '慕课', sortOrder: 4, featured: true, img: 'http://outin-b731b50d948211ecb5cc00163e0eb78b.oss-cn-beijing.aliyuncs.com/0124d99792064689987930646092067e/snapshots/82c2f32a9ec642a1b7e11607a7811a99-00008.jpg' },
  { title: '大连理工大学2023级毕业MV', category: '活动视频', tag: 'MV', sortOrder: 5, featured: true, img: 'http://outin-b731b50d948211ecb5cc00163e0eb78b.oss-cn-beijing.aliyuncs.com/51fb93f035c771ee951f7fb2780c0102/snapshots/3970c2b876424823b4f100fe5fe82798-00007.jpg' },
  { title: '大连理工大学毕业生演讲会宣传视频', category: '活动视频', tag: '活动', sortOrder: 6, featured: true, img: 'http://outin-b731b50d948211ecb5cc00163e0eb78b.oss-cn-beijing.aliyuncs.com/5cb11fe035c771ee951f7fb2780c0102/snapshots/acf2163dbac146a79ad7dad3c3c35851-00007.jpg' },
  { title: '哈尔滨工业大学威海校区形象宣传片', category: '专题视频', tag: '形象片', sortOrder: 7, featured: true, img: 'http://outin-b731b50d948211ecb5cc00163e0eb78b.oss-cn-beijing.aliyuncs.com/image/cover/6CB4DE58473244718E535CA8A1FC5162-6-2.png' },
  { title: 'AI数字人直播演示', category: '数字人', tag: 'AI', sortOrder: 8, featured: true, img: 'http://outin-b731b50d948211ecb5cc00163e0eb78b.oss-cn-beijing.aliyuncs.com/31149e04a50d4f75b4e5eecf20dbba5c/snapshots/45c15f4af63a4fca910e0cf9c9e417d3-00008.jpg' },
  { title: '融创集团品牌形象片', category: '商业视频', tag: '品牌', sortOrder: 9, featured: true, img: 'http://outin-b731b50d948211ecb5cc00163e0eb78b.oss-cn-beijing.aliyuncs.com/f9163df4d4084af0a3000abada6866dc/snapshots/0ae663807a7347eb8b69db7e672908ad-00003.jpg' },
  // 普通作品 (sortOrder 10-43, featured=false)
  { title: '大连理工大学招生宣传视频', category: '活动视频', tag: '招生', sortOrder: 10, featured: false, img: 'http://outin-b731b50d948211ecb5cc00163e0eb78b.oss-cn-beijing.aliyuncs.com/f3bb81a035c771ee93f835a6ecca0102/snapshots/0f6c7dcac2a74513a328fcc82195498b-00003.jpg' },
  { title: '大连理工大学国旗护卫队形象视频', category: '活动视频', tag: '形象', sortOrder: 11, featured: false, img: 'http://outin-b731b50d948211ecb5cc00163e0eb78b.oss-cn-beijing.aliyuncs.com/f3c063a035c771eebfd16eb3690d0102/snapshots/fd25f7510856491c88ed365b660ef168-00004.jpg' },
  { title: '东北大学校园开放日活动记录', category: '活动视频', tag: '活动', sortOrder: 12, featured: false, img: 'http://outin-b731b50d948211ecb5cc00163e0eb78b.oss-cn-beijing.aliyuncs.com/51fb93f035c771ee951f7fb2780c0102/snapshots/3970c2b876424823b4f100fe5fe82798-00007.jpg' },
  { title: '毕业季系列微电影', category: '活动视频', tag: '微电影', sortOrder: 13, featured: false, img: 'http://outin-b731b50d948211ecb5cc00163e0eb78b.oss-cn-beijing.aliyuncs.com/51fb93f035c771ee951f7fb2780c0102/snapshots/3970c2b876424823b4f100fe5fe82798-00007.jpg' },
  { title: '校园歌手大赛总决赛实录', category: '活动视频', tag: '赛事', sortOrder: 14, featured: false, img: 'http://outin-b731b50d948211ecb5cc00163e0eb78b.oss-cn-beijing.aliyuncs.com/5cb11fe035c771ee951f7fb2780c0102/snapshots/acf2163dbac146a79ad7dad3c3c35851-00007.jpg' },
  { title: '开学典礼全程记录', category: '活动视频', tag: '典礼', sortOrder: 15, featured: false, img: 'http://outin-b731b50d948211ecb5cc00163e0eb78b.oss-cn-beijing.aliyuncs.com/f3bb81a035c771ee93f835a6ecca0102/snapshots/0f6c7dcac2a74513a328fcc82195498b-00003.jpg' },
  { title: '校庆晚会创意视频', category: '活动视频', tag: '晚会', sortOrder: 16, featured: false, img: 'http://outin-b731b50d948211ecb5cc00163e0eb78b.oss-cn-beijing.aliyuncs.com/f3c063a035c771eebfd16eb3690d0102/snapshots/fd25f7510856491c88ed365b660ef168-00004.jpg' },
  { title: '大连理工大学人才引进形象宣传片', category: '专题视频', tag: '人才', sortOrder: 17, featured: false, img: 'http://outin-b731b50d948211ecb5cc00163e0eb78b.oss-cn-beijing.aliyuncs.com/db95c45035cc71eebff425b7edcb0102/snapshots/f50bea479cdb48a6a474149730dc7357-00004.jpg' },
  { title: '深圳大学招生宣传片', category: '专题视频', tag: '招生', sortOrder: 18, featured: false, img: 'http://outin-b731b50d948211ecb5cc00163e0eb78b.oss-cn-beijing.aliyuncs.com/image/cover/830857BF363B49878F6047859240EC52-6-2.png' },
  { title: '广东省建筑设计研究院校招形象片', category: '专题视频', tag: '校招', sortOrder: 19, featured: false, img: 'http://outin-b731b50d948211ecb5cc00163e0eb78b.oss-cn-beijing.aliyuncs.com/image/cover/4452110AD8DA47E69B6CC6FA1BC71992-6-2.png' },
  { title: '融创西南校招形象片', category: '专题视频', tag: '校招', sortOrder: 20, featured: false, img: 'http://outin-b731b50d948211ecb5cc00163e0eb78b.oss-cn-beijing.aliyuncs.com/image/cover/6CB4DE58473244718E535CA8A1FC5162-6-2.png' },
  { title: '企业党建宣传片', category: '专题视频', tag: '党建', sortOrder: 21, featured: false, img: 'http://outin-b731b50d948211ecb5cc00163e0eb78b.oss-cn-beijing.aliyuncs.com/image/cover/A71C2187F49C4372B6F87D3C7B339DB9-6-2.png' },
  { title: '校史档案专题片', category: '专题视频', tag: '校史', sortOrder: 22, featured: false, img: 'http://outin-b731b50d948211ecb5cc00163e0eb78b.oss-cn-beijing.aliyuncs.com/image/cover/BC8CDEE594E141BB9303DFC2DA4E23C9-6-2.png' },
  { title: '教师风采专题片', category: '专题视频', tag: '教师', sortOrder: 23, featured: false, img: 'http://outin-b731b50d948211ecb5cc00163e0eb78b.oss-cn-beijing.aliyuncs.com/image/cover/20CE451285C6421491C71A5E9A0A30BD-6-2.png' },
  { title: '学院文化宣传系列视频', category: '专题视频', tag: '文化', sortOrder: 24, featured: false, img: 'http://outin-b731b50d948211ecb5cc00163e0eb78b.oss-cn-beijing.aliyuncs.com/image/cover/D74323BE993A4E879C2CE0FDEF16C42C-6-2.png' },
  { title: '国家精品在线课程录制', category: '课程建设', tag: '精品课', sortOrder: 25, featured: false, img: 'http://outin-b731b50d948211ecb5cc00163e0eb78b.oss-cn-beijing.aliyuncs.com/0124d99792064689987930646092067e/snapshots/82c2f32a9ec642a1b7e11607a7811a99-00008.jpg' },
  { title: '大学物理实验慕课视频', category: '课程建设', tag: '慕课', sortOrder: 26, featured: false, img: 'http://outin-b731b50d948211ecb5cc00163e0eb78b.oss-cn-beijing.aliyuncs.com/0124d99792064689987930646092067e/snapshots/82c2f32a9ec642a1b7e11607a7811a99-00008.jpg' },
  { title: '在线开放课程建设', category: '课程建设', tag: 'MOOC', sortOrder: 27, featured: false, img: 'http://outin-b731b50d948211ecb5cc00163e0eb78b.oss-cn-beijing.aliyuncs.com/0124d99792064689987930646092067e/snapshots/82c2f32a9ec642a1b7e11607a7811a99-00008.jpg' },
  { title: '专业课程微课视频制作', category: '课程建设', tag: '微课', sortOrder: 28, featured: false, img: 'http://outin-b731b50d948211ecb5cc00163e0eb78b.oss-cn-beijing.aliyuncs.com/0124d99792064689987930646092067e/snapshots/82c2f32a9ec642a1b7e11607a7811a99-00008.jpg' },
  { title: '弘扬劳模精神专题党课', category: '党课', tag: '党课', sortOrder: 29, featured: false, img: 'http://outin-b731b50d948211ecb5cc00163e0eb78b.oss-cn-beijing.aliyuncs.com/image/cover/1AAB5DE8ECA5401CBBDBE4F4BCF5258C-6-2.png' },
  { title: '党建工作先进事迹片', category: '党课', tag: '事迹', sortOrder: 30, featured: false, img: 'http://outin-b731b50d948211ecb5cc00163e0eb78b.oss-cn-beijing.aliyuncs.com/image/cover/1AAB5DE8ECA5401CBBDBE4F4BCF5258C-6-2.png' },
  { title: '新时代共产党员风采录', category: '党课', tag: '党员', sortOrder: 31, featured: false, img: 'http://outin-b731b50d948211ecb5cc00163e0eb78b.oss-cn-beijing.aliyuncs.com/image/cover/1AAB5DE8ECA5401CBBDBE4F4BCF5258C-6-2.png' },
  { title: '听她说——佩璇·时光守艺人', category: '人物志', tag: '纪录片', sortOrder: 32, featured: false, img: 'http://outin-b731b50d948211ecb5cc00163e0eb78b.oss-cn-beijing.aliyuncs.com/31149e04a50d4f75b4e5eecf20dbba5c/snapshots/45c15f4af63a4fca910e0cf9c9e417d3-00008.jpg' },
  { title: '学者的一天', category: '人物志', tag: '学者', sortOrder: 33, featured: false, img: 'http://outin-b731b50d948211ecb5cc00163e0eb78b.oss-cn-beijing.aliyuncs.com/31149e04a50d4f75b4e5eecf20dbba5c/snapshots/45c15f4af63a4fca910e0cf9c9e417d3-00008.jpg' },
  { title: '青年创业者访谈录', category: '人物志', tag: '创业', sortOrder: 34, featured: false, img: 'http://outin-b731b50d948211ecb5cc00163e0eb78b.oss-cn-beijing.aliyuncs.com/31149e04a50d4f75b4e5eecf20dbba5c/snapshots/45c15f4af63a4fca910e0cf9c9e417d3-00008.jpg' },
  { title: '非遗传承人纪录片', category: '人物志', tag: '非遗', sortOrder: 35, featured: false, img: 'http://outin-b731b50d948211ecb5cc00163e0eb78b.oss-cn-beijing.aliyuncs.com/31149e04a50d4f75b4e5eecf20dbba5c/snapshots/45c15f4af63a4fca910e0cf9c9e417d3-00008.jpg' },
  { title: '边界猎手APP演示', category: '动画', tag: '演示动画', sortOrder: 36, featured: false, img: 'http://outin-b731b50d948211ecb5cc00163e0eb78b.oss-cn-beijing.aliyuncs.com/ec1d77b446e44c26926ced984e252429/snapshots/e5839266886946dcbe4829ba56f77a4b-00003.jpg' },
  { title: '企业年报数据可视化动画', category: '动画', tag: '数据', sortOrder: 37, featured: false, img: 'http://outin-b731b50d948211ecb5cc00163e0eb78b.oss-cn-beijing.aliyuncs.com/ec1d77b446e44c26926ced984e252429/snapshots/e5839266886946dcbe4829ba56f77a4b-00003.jpg' },
  { title: '产品功能MG动画', category: '动画', tag: 'MG动画', sortOrder: 38, featured: false, img: 'http://outin-b731b50d948211ecb5cc00163e0eb78b.oss-cn-beijing.aliyuncs.com/ec1d77b446e44c26926ced984e252429/snapshots/e5839266886946dcbe4829ba56f77a4b-00003.jpg' },
  { title: '三维建筑漫游动画', category: '动画', tag: '3D', sortOrder: 39, featured: false, img: 'http://outin-b731b50d948211ecb5cc00163e0eb78b.oss-cn-beijing.aliyuncs.com/ec1d77b446e44c26926ced984e252429/snapshots/e5839266886946dcbe4829ba56f77a4b-00003.jpg' },
  { title: '九州建设', category: '商业视频', tag: '宣传片', sortOrder: 40, featured: false, img: 'http://outin-b731b50d948211ecb5cc00163e0eb78b.oss-cn-beijing.aliyuncs.com/f9163df4d4084af0a3000abada6866dc/snapshots/0ae663807a7347eb8b69db7e672908ad-00003.jpg' },
  { title: '品牌年度大会宣传片', category: '商业视频', tag: '年会', sortOrder: 41, featured: false, img: 'http://outin-b731b50d948211ecb5cc00163e0eb78b.oss-cn-beijing.aliyuncs.com/f9163df4d4084af0a3000abada6866dc/snapshots/0ae663807a7347eb8b69db7e672908ad-00003.jpg' },
  { title: '企业文化宣传短片', category: '商业视频', tag: '文化', sortOrder: 42, featured: false, img: 'http://outin-b731b50d948211ecb5cc00163e0eb78b.oss-cn-beijing.aliyuncs.com/f9163df4d4084af0a3000abada6866dc/snapshots/0ae663807a7347eb8b69db7e672908ad-00003.jpg' },
  { title: '产品发布预告视频', category: '商业视频', tag: '产品', sortOrder: 43, featured: false, img: 'http://outin-b731b50d948211ecb5cc00163e0eb78b.oss-cn-beijing.aliyuncs.com/f9163df4d4084af0a3000abada6866dc/snapshots/0ae663807a7347eb8b69db7e672908ad-00003.jpg' }
];

// 辅助函数：从 img URL 推断 videoUrl
function inferVideoUrl(imgUrl) {
  if (!imgUrl) return null;
  const snapshotMatch = imgUrl.match(/(aliyuncs\.com)\/([^\/]+)\/snapshots\/([^-]+)-\d+\.jpg$/);
  if (snapshotMatch) {
    return `http://outin-b731b50d948211ecb5cc00163e0eb78b.${snapshotMatch[1]}/${snapshotMatch[2]}/${snapshotMatch[3]}.mp4`;
  }
  return null;
}

// 辅助函数：判断类型
function inferType(imgUrl) {
  if (!imgUrl) return 'image';
  const isVideo = /(aliyuncs\.com)\/([^\/]+)\/snapshots\/([^-]+)-\d+\.jpg$/.test(imgUrl);
  return isVideo ? 'video' : 'image';
}

// 颜色方案
const COLORS = [
  'from-blue-500 to-cyan-600',
  'from-purple-500 to-pink-600',
  'from-green-500 to-teal-600',
  'from-yellow-500 to-orange-600',
  'from-pink-500 to-red-600',
  'from-red-500 to-rose-600',
  'from-indigo-500 to-purple-600',
  'from-cyan-500 to-blue-600'
];
const GLOW_COLORS = [
  'bg-blue-500/20', 'bg-purple-500/20', 'bg-green-500/20',
  'bg-yellow-500/20', 'bg-pink-500/20', 'bg-red-500/20',
  'bg-indigo-500/20', 'bg-cyan-500/20'
];

// ========== 主执行流程 ==========
async function main() {
  console.log('========== 综合修复开始 ==========\n');

  try {
    // 1. 删除测试数据
    console.log('【步骤 1/4】删除测试数据...');
    for (const id of TEST_DATA_IDS) {
      await new Promise((resolve, reject) => {
        db.run('DELETE FROM featured_works WHERE portfolioId = ?', [id], (err) => {
          if (err) reject(err);
          else db.run('DELETE FROM portfolio_items WHERE id = ?', [id], (err) => {
            if (err) reject(err);
            else { console.log(`  ✓ 已删除 ID=${id}`); resolve(); }
          });
        });
      });
    }
    console.log(`  完成！删除了 ${TEST_DATA_IDS.length} 条测试数据\n`);

    // 2. 读取当前数据库中剩余的作品（按 title 索引）
    console.log('【步骤 2/4】读取当前作品状态...');
    const existingItems = await new Promise((resolve, reject) => {
      db.all('SELECT id, title, img, videoUrl, type, sortOrder, category, tag FROM portfolio_items', (err, rows) => {
        if (err) reject(err); else resolve(rows);
      });
    });
    console.log(`  当前数据库有 ${existingItems.length} 个作品\n`);

    // 建立 title -> 数据库行 的映射
    const existingByTitle = {};
    existingItems.forEach(row => { existingByTitle[row.title] = row; });

    // 3. 为每个标准作品执行：更新 or 插入
    console.log('【步骤 3/4】对齐作品数据（更新/插入）...');
    let updatedCount = 0;
    let insertedCount = 0;
    let updatedFeaturedIds = [];

    for (const item of STANDARD_ITEMS) {
      const videoUrl = inferVideoUrl(item.img);
      const type = inferType(item.img);
      const colorIdx = item.sortOrder % COLORS.length;
      const color = COLORS[colorIdx];
      const bgGlow = GLOW_COLORS[colorIdx];
      const shortDesc = `${item.category} - ${item.tag}`;
      const fullDesc = `${item.title} - ${item.category}作品`;

      if (existingByTitle[item.title]) {
        // 更新现有作品
        const existing = existingByTitle[item.title];
        await new Promise((resolve, reject) => {
          db.run(
            'UPDATE portfolio_items SET img=?, videoUrl=?, type=?, category=?, tag=?, shortDesc=?, fullDesc=?, color=?, bgGlow=?, sortOrder=?, updatedAt=CURRENT_TIMESTAMP WHERE id=?',
            [item.img, videoUrl, type, item.category, item.tag, shortDesc, fullDesc, color, bgGlow, item.sortOrder, existing.id],
            (err) => { if (err) reject(err); else resolve(); }
          );
        });
        console.log(`  ✓ [更新] ${item.title} (type=${type}, videoUrl=${videoUrl ? '已设置' : '空(封面图)'})`);
        updatedCount++;
        if (item.featured) updatedFeaturedIds.push({ portfolioId: existing.id, sortOrder: item.sortOrder });
      } else {
        // 插入新作品
        const result = await new Promise((resolve, reject) => {
          db.run(
            'INSERT INTO portfolio_items (title, category, tag, shortDesc, fullDesc, img, images, videoUrl, type, color, bgGlow, hidden, sortOrder, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)',
            [item.title, item.category, item.tag, shortDesc, fullDesc, item.img, null, videoUrl, type, color, bgGlow, item.sortOrder],
            function(err) { if (err) reject(err); else resolve({ lastID: this.lastID }); }
          );
        });
        console.log(`  ✚ [新增] ${item.title} (type=${type}, videoUrl=${videoUrl ? '已设置' : '空(封面图)'})`);
        insertedCount++;
        if (item.featured) updatedFeaturedIds.push({ portfolioId: result.lastID, sortOrder: item.sortOrder });
      }
    }
    console.log(`  完成！更新 ${updatedCount} 条，新增 ${insertedCount} 条\n`);

    // 4. 清理并重建精选作品表
    console.log('【步骤 4/4】重建精选作品关联...');
    await new Promise((resolve, reject) => {
      db.run('DELETE FROM featured_works', (err) => { if (err) reject(err); else resolve(); });
    });
    // 按 sortOrder 排序精选
    updatedFeaturedIds.sort((a, b) => a.sortOrder - b.sortOrder);
    let fwIdx = 0;
    for (const fw of updatedFeaturedIds) {
      await new Promise((resolve, reject) => {
        db.run(
          'INSERT INTO featured_works (id, portfolioId, sortOrder) VALUES (?, ?, ?)',
          [`fw-cleanup-${fwIdx}`, fw.portfolioId, fwIdx],
          (err) => { if (err) reject(err); else resolve(); }
        );
      });
      fwIdx++;
    }
    console.log(`  完成！重建 ${fwIdx} 条精选作品关联\n`);

    // 5. 验证结果
    console.log('========== 修复完成 - 结果验证 ==========\n');
    const finalItems = await new Promise((resolve, reject) => {
      db.all('SELECT id, title, type, videoUrl, img FROM portfolio_items ORDER BY sortOrder, id', (err, rows) => {
        if (err) reject(err); else resolve(rows);
      });
    });

    let videoCount = 0, imageCount = 0, withVideoUrl = 0;
    finalItems.forEach(item => {
      if (item.type === 'video') videoCount++;
      if (item.type === 'image') imageCount++;
      if (item.videoUrl) withVideoUrl++;
    });

    console.log(`总计作品: ${finalItems.length} 个`);
    console.log(`  - 视频类型 (type=video): ${videoCount} 个`);
    console.log(`  - 图片类型 (type=image): ${imageCount} 个`);
    console.log(`  - 已设置 videoUrl: ${withVideoUrl} 个`);
    console.log(`  - 空 videoUrl (纯封面图): ${finalItems.length - withVideoUrl} 个`);

    // 列出一些作品做展示
    console.log('\n前 10 个作品详情:');
    finalItems.slice(0, 10).forEach(item => {
      console.log(`  ID=${item.id}, type=${item.type}, title=${item.title.substring(0, 20)}, videoUrl=${item.videoUrl ? '✓' : '(封面图)'}`);
    });

    // 检查是否有多余作品（不在标准清单中的）
    const standardTitles = new Set(STANDARD_ITEMS.map(i => i.title));
    const extraItems = finalItems.filter(i => !standardTitles.has(i.title));
    if (extraItems.length > 0) {
      console.log(`\n⚠ 注意：还有 ${extraItems.length} 个多余作品未清理:`);
      extraItems.forEach(i => console.log(`  ID=${i.id}, title="${i.title}"`));
    } else {
      console.log('\n✓ 数据库中只有标准作品，无多余作品');
    }

  } catch (err) {
    console.error('\n✗ 执行出错:', err.message);
    console.error(err.stack);
  } finally {
    db.close();
    console.log('\n========== 脚本结束 ==========');
  }
}

main();
