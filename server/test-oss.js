const OSS = require('ali-oss');
require('dotenv').config({ path: '../.env' });

const ossClient = new OSS({
  accessKeyId: process.env.REACT_APP_OSS_ACCESS_KEY_ID,
  accessKeySecret: process.env.REACT_APP_OSS_ACCESS_KEY_SECRET,
  bucket: process.env.REACT_APP_OSS_BUCKET,
  region: 'oss-cn-beijing',
  secure: true
});

console.log('配置信息:', {
  accessKeyId: process.env.REACT_APP_OSS_ACCESS_KEY_ID,
  bucket: process.env.REACT_APP_OSS_BUCKET,
  region: 'oss-cn-beijing'
});

async function testOSS() {
  try {
    console.log('正在测试OSS连接...');
    const result = await ossClient.list({ maxKeys: 1 });
    console.log('OSS连接成功!');
    console.log('Bucket中文件数量:', result.objects.length);
  } catch (error) {
    console.error('OSS连接失败:', error.message);
    console.error('完整错误:', JSON.stringify(error, null, 2));
  }
}

testOSS();