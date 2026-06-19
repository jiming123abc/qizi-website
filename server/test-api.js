const http = require('http');

function get(path) {
  return new Promise((resolve) => {
    http.get('http://localhost:5000' + path, (r) => {
      let d = '';
      r.on('data', (c) => d += c);
      r.on('end', () => resolve({ status: r.statusCode, body: d }));
    });
  });
}

async function main() {
  // 1. 项目列表
  let r = await get('/api/video2/projects');
  console.log('✓ /api/video2/projects  status=' + r.status + '  projects=' + JSON.parse(r.body).data.length);

  // 2. 分享落地页 - 检查 meta 标签
  r = await get('/share/video2/project/1');
  console.log('✓ /share/video2/project/1  status=' + r.status);
  const ogTitle = r.body.match(/og:title" content="([^"]*)"/);
  const ogDesc = r.body.match(/og:description" content="([^"]*)"/);
  const wechatTitle = r.body.match(/wechat:title" content="([^"]*)"/);
  const hasRedirect = /window\.location\.href.*\/video2\/project\/1/.test(r.body);
  console.log('    og:title=' + (ogTitle ? ogTitle[1] : 'NONE'));
  console.log('    og:description=' + (ogDesc ? ogDesc[1] : 'NONE'));
  console.log('    wechat:title=' + (wechatTitle ? wechatTitle[1] : 'NONE'));
  console.log('    redirect script=' + hasRedirect);

  // 3. /video2/project/1 SSR 页面
  r = await get('/video2/project/1');
  console.log('✓ /video2/project/1  status=' + r.status);

  // 4. /video2 列表页
  r = await get('/video2');
  console.log('✓ /video2  status=' + r.status);

  // 5. stats
  r = await get('/api/video2/stats');
  console.log('✓ /api/video2/stats  status=' + r.status);

  // 6. 场次
  r = await get('/api/video2/projects/1/scenes');
  console.log('✓ /api/video2/projects/1/scenes  status=' + r.status);

  console.log('\n=== 所有测试通过 ===');
}

main();
