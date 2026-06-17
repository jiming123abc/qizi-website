const http = require('http');

function test(path, method, body) {
  return new Promise((resolve) => {
    const data = body ? JSON.stringify(body) : '';
    const req = http.request({
      hostname: 'localhost',
      port: 5000,
      path: path,
      method: method,
      headers: body ? {
        'Content-Type': 'application/json',
        'Content-Length': data.length
      } : {}
    }, (res) => {
      let buf = '';
      res.on('data', c => buf += c);
      res.on('end', () => resolve({ status: res.statusCode, body: buf.substring(0, 200) }));
    });
    req.on('error', (e) => resolve({ status: -1, body: e.message }));
    if (body) req.write(data);
    req.end();
  });
}

async function main() {
  console.log('\n--- GET /api/video2/stats ---');
  console.log(await test('/api/video2/stats', 'GET'));

  console.log('\n--- GET /api/video2/list ---');
  console.log(await test('/api/video2/list', 'GET'));

  console.log('\n--- POST /api/video2/add ---');
  console.log(await test('/api/video2/add', 'POST', {
    title: 'debug-test-' + Date.now(),
    filename: 'debug.mp4',
    url: 'https://example.com/debug.mp4',
    size: 1024
  }));

  console.log('\n--- POST /api/oss/presign (folder: video2) ---');
  console.log(await test('/api/oss/presign', 'POST', {
    folder: 'video2',
    filename: 'test-' + Date.now() + '.mp4',
    contentType: 'video/mp4'
  }));
}

main();
