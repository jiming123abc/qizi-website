const https = require('https');

function fetchUrl(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => resolve(data));
    }).on('error', reject);
  });
}

async function getContent() {
  console.log('正在获取网站内容...\n');
  
  try {
    const html = await fetchUrl('https://qiziwenhua.top');
    console.log('HTML内容：');
    console.log(html.substring(0, 2000));
    console.log('\n\n=== 查找案例相关数据 ===\n');
    
    // 查找所有可能的案例标题
    const casePatterns = [
      /Neon Avatar[^<]*/gi,
      /流量密码[^<]*/gi,
      /电影级[^<]*/gi,
      /神经网络[^<]*/gi,
      /数字人[^<]*/gi,
      /技术中台[^<]*/gi
    ];
    
    casePatterns.forEach(pattern => {
      const matches = html.match(pattern);
      if (matches) {
        console.log(`找到匹配: ${matches[0].substring(0, 100)}`);
      }
    });
    
  } catch (error) {
    console.error('获取内容失败:', error.message);
  }
}

getContent();