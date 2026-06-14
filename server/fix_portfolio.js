// 修复数据库：清理测试数据 + 补全 videoUrl
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'data.db');
const db = new sqlite3.Database(dbPath);

// 从 img URL 推断视频URL
function inferVideoUrl(imgUrl) {
  if (!imgUrl) return null;
  // 格式: http://outin-xxx.aliyuncs.com/{video_id}/snapshots/{snapshot_id}-NNNNN.jpg
  // 对应视频: http://outin-xxx.aliyuncs.com/{video_id}/{snapshot_id}.mp4
  const snapshotMatch = imgUrl.match(/(aliyuncs\.com)\/([^\/]+)\/snapshots\/([^-]+)-\d+\.jpg$/);
  if (snapshotMatch) {
    return `http://outin-b731b50d948211ecb5cc00163e0eb78b.${snapshotMatch[1]}/${snapshotMatch[2]}/${snapshotMatch[3]}.mp4`;
  }
  // image/cover/ 格式是纯封面图，没有视频源
  return null;
}

// 判断作品类型
function inferType(imgUrl) {
  if (!imgUrl) return 'image';
  const snapshotMatch = imgUrl.match(/(aliyuncs\.com)\/([^\/]+)\/snapshots\/([^-]+)-\d+\.jpg$/);
  return snapshotMatch ? 'video' : 'image';
}

// 第一阶段：分析并报告需要修改的内容
console.log('========== 阶段 1：数据分析 ==========\n');

db.all('SELECT id, title, category, tag, img, type, videoUrl FROM portfolio_items ORDER BY id', (err, rows) => {
  if (err) { console.error('错误:', err.message); return; }

  const needsUpdate = [];
  const cleanImageType = []; // 纯图片封面，type 应为 image，videoUrl 为空

  console.log(`共有 ${rows.length} 个作品：\n`);
  rows.forEach(row => {
    const expectedVideoUrl = inferVideoUrl(row.img);
    const expectedType = inferType(row.img);
    const videoUrlDiff = expectedVideoUrl !== (row.videoUrl || null);
    const typeDiff = expectedType !== row.type;

    if (videoUrlDiff || typeDiff) {
      needsUpdate.push({
        id: row.id,
        title: row.title,
        currentType: row.type,
        expectedType,
        currentVideoUrl: row.videoUrl || '(空)',
        expectedVideoUrl: expectedVideoUrl || '(空，纯封面图)'
      });
    }

    if (expectedType === 'image' && (row.type !== 'image' || row.videoUrl)) {
      cleanImageType.push(row.id);
    }
  });

  console.log(`需要更新 videoUrl/type 的作品: ${needsUpdate.length} 个`);
  needsUpdate.forEach(u => {
    console.log(`  ID=${u.id}: "${u.title.substring(0, 20)}"`);
    console.log(`    type: ${u.currentType} -> ${u.expectedType}`);
    console.log(`    videoUrl: ${u.currentVideoUrl.substring(0, 50)} -> ${u.expectedVideoUrl.substring(0, 50)}`);
  });

  console.log('\n========== 阶段 2：执行更新 ==========\n');

  // 开始事务
  db.serialize(() => {
    db.run('BEGIN');

    let updateCount = 0;

    rows.forEach(row => {
      const expectedVideoUrl = inferVideoUrl(row.img);
      const expectedType = inferType(row.img);

      db.run(
        'UPDATE portfolio_items SET videoUrl = ?, type = ?, updatedAt = CURRENT_TIMESTAMP WHERE id = ?',
        [expectedVideoUrl, expectedType, row.id],
        function(err) {
          if (err) console.error(`更新 ID=${row.id} 失败:`, err.message);
          else if (this.changes > 0) updateCount++;
        }
      );
    });

    db.run('COMMIT', (err) => {
      if (err) {
        console.error('事务失败:', err.message);
        db.run('ROLLBACK');
      } else {
        console.log(`✅ 更新完成，共影响 ${updateCount} 条记录\n`);
      }

      // 验证结果
      console.log('========== 阶段 3：验证 ==========\n');
      db.all('SELECT id, title, type, videoUrl, img FROM portfolio_items ORDER BY id', (err, finalRows) => {
        if (err) { console.error('错误:', err.message); return; }

        let withVideo = 0;
        let withoutVideo = 0;
        finalRows.forEach(row => {
          if (row.videoUrl) withVideo++;
          else withoutVideo++;
          console.log(`  ID=${row.id}, type=${row.type}, title=${row.title.substring(0, 20)}, videoUrl=${row.videoUrl ? '✓' : '✗(纯图片封面)'}`);
        });
        console.log(`\n总计: ${finalRows.length} 个作品`);
        console.log(`  - 有视频URL: ${withVideo}`);
        console.log(`  - 无视频URL(纯图片封面): ${withoutVideo}`);

        db.close();
        console.log('\n========== 完成 ==========');
      });
    });
  });
});
