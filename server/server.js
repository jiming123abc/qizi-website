const express = require('express');
const cors = require('cors');
const OSS = require('ali-oss');
const multer = require('multer');
const path = require('path');
const crypto = require('crypto');
const sharp = require('sharp');
const ffmpeg = require('fluent-ffmpeg');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

// 配置ffmpeg路径（Windows环境可能需要）
const ffmpegPath = require('ffmpeg-static');
if (ffmpegPath) {
  ffmpeg.setFfmpegPath(ffmpegPath);
}

const ffprobePath = require('ffprobe-static');
if (ffprobePath && ffprobePath.path) {
  ffmpeg.setFfprobePath(ffprobePath.path);
}

const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

const ossClient = new OSS({
  accessKeyId: process.env.REACT_APP_OSS_ACCESS_KEY_ID,
  accessKeySecret: process.env.REACT_APP_OSS_ACCESS_KEY_SECRET,
  bucket: process.env.REACT_APP_OSS_BUCKET,
  region: 'oss-cn-beijing',
  secure: true
});

// 微信签名缓存
let wechatTicketCache = {
  ticket: '',
  expires: 0
};

// 获取微信access_token
async function getWeChatAccessToken(appId, appSecret) {
  const url = `https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid=${appId}&secret=${appSecret}`;
  const response = await fetch(url);
  const data = await response.json();
  if (data.errcode) {
    throw new Error(`获取access_token失败: ${data.errmsg}`);
  }
  return data.access_token;
}

// 获取微信jsapi_ticket
async function getWeChatJsApiTicket(accessToken) {
  const url = `https://api.weixin.qq.com/cgi-bin/ticket/getticket?access_token=${accessToken}&type=jsapi`;
  const response = await fetch(url);
  const data = await response.json();
  if (data.errcode !== 0) {
    throw new Error(`获取jsapi_ticket失败: ${data.errmsg}`);
  }
  return data.ticket;
}

// 生成微信签名
function generateWeChatSignature(ticket, url) {
  const nonceStr = Math.random().toString(36).substr(2, 15);
  const timestamp = Math.floor(Date.now() / 1000);
  const string1 = `jsapi_ticket=${ticket}&noncestr=${nonceStr}&timestamp=${timestamp}&url=${url}`;
  const signature = crypto.createHash('sha1').update(string1).digest('hex');
  
  return {
    appId: process.env.WECHAT_APP_ID || '',
    timestamp: timestamp,
    nonceStr: nonceStr,
    signature: signature
  };
}

// 压缩图片到指定大小（小于300KB）
async function compressImage(buffer, maxSizeKB = 300) {
  const maxSizeBytes = maxSizeKB * 1024;
  
  if (buffer.length <= maxSizeBytes) {
    return buffer;
  }

  let quality = 0.9;
  let compressedBuffer = buffer;
  
  while (compressedBuffer.length > maxSizeBytes && quality > 0.1) {
    compressedBuffer = await sharp(buffer)
      .jpeg({ quality: Math.round(quality * 100) })
      .toBuffer();
    quality -= 0.05;
  }

  return compressedBuffer;
}

// 获取视频比特率（kbps）
async function getVideoBitrate(buffer) {
  return new Promise((resolve, reject) => {
    const fs = require('fs');
    const tempPath = path.join(__dirname, `temp_${Date.now()}_probe.mp4`);
    
    fs.writeFileSync(tempPath, buffer);
    
    ffmpeg.ffprobe(tempPath, (err, metadata) => {
      fs.unlinkSync(tempPath);
      
      if (err) {
        console.warn('无法获取视频比特率:', err.message);
        resolve(null);
        return;
      }
      
      if (metadata && metadata.streams) {
        const videoStream = metadata.streams.find(s => s.codec_type === 'video');
        if (videoStream && videoStream.bit_rate) {
          const bitrateKbps = Math.round(parseInt(videoStream.bit_rate) / 1000);
          resolve(bitrateKbps);
          return;
        }
      }
      
      resolve(null);
    });
  });
}

// 压缩视频到指定比特率
async function compressVideo(inputBuffer, maxBitrateKbps = 2000, onProgress) {
  return new Promise((resolve, reject) => {
    const fs = require('fs');
    const tempInputPath = path.join(__dirname, `temp_${Date.now()}_input.mp4`);
    const tempOutputPath = path.join(__dirname, `temp_${Date.now()}_output.mp4`);
    
    fs.writeFileSync(tempInputPath, inputBuffer);
    const originalSize = fs.statSync(tempInputPath).size;
    
    ffmpeg(tempInputPath)
      .outputOptions([
        `-b:v ${maxBitrateKbps}k`,
        `-maxrate ${maxBitrateKbps + 500}k`,
        `-bufsize ${maxBitrateKbps * 2}k`,
        '-preset fast',
        '-c:v libx264',
        '-c:a aac',
        '-crf 23',
        '-movflags +faststart'
      ])
      .on('progress', (progress) => {
        const percent = progress.percent || 0;
        console.log(`视频压缩进度: ${percent.toFixed(1)}%`);
        if (onProgress) {
          onProgress({ type: 'compress', progress: Math.round(percent) });
        }
      })
      .on('end', () => {
        const outputBuffer = fs.readFileSync(tempOutputPath);
        const compressedSize = outputBuffer.length;
        console.log(`视频压缩完成: ${(originalSize / 1024 / 1024).toFixed(2)}MB -> ${(compressedSize / 1024 / 1024).toFixed(2)}MB`);
        
        fs.unlinkSync(tempInputPath);
        fs.unlinkSync(tempOutputPath);
        resolve(outputBuffer);
      })
      .on('error', (err) => {
        console.error('视频压缩失败:', err.message);
        fs.unlinkSync(tempInputPath);
        if (fs.existsSync(tempOutputPath)) {
          fs.unlinkSync(tempOutputPath);
        }
        reject(err);
      })
      .save(tempOutputPath);
  });
}

// 微信签名接口
app.get('/api/wechat/signature', async (req, res) => {
  try {
    const { url } = req.query;
    
    if (!url) {
      return res.status(400).json({ error: '缺少URL参数' });
    }

    const appId = process.env.WECHAT_APP_ID;
    const appSecret = process.env.WECHAT_APP_SECRET;

    if (!appId || !appSecret) {
      return res.status(500).json({ error: '微信配置未设置' });
    }

    const now = Date.now();
    let ticket = wechatTicketCache.ticket;

    if (now > wechatTicketCache.expires || !ticket) {
      const accessToken = await getWeChatAccessToken(appId, appSecret);
      ticket = await getWeChatJsApiTicket(accessToken);
      
      wechatTicketCache = {
        ticket: ticket,
        expires: now + 7000 * 1000
      };
    }

    const signature = generateWeChatSignature(ticket, url);
    res.json(signature);
  } catch (error) {
    console.error('微信签名失败:', error);
    res.status(500).json({ error: '签名失败: ' + error.message });
  }
});

// 图片上传接口
app.post('/api/upload/image', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: '请上传文件' });
    }

    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowedTypes.includes(req.file.mimetype)) {
      return res.status(400).json({ error: '不支持的图片格式' });
    }

    let fileBuffer = req.file.buffer;
    const originalSizeKB = (fileBuffer.length / 1024).toFixed(2);
    let compressed = false;
    let compressedSizeKB = originalSizeKB;
    
    // 如果图片大于300KB，自动压缩
    if (fileBuffer.length > 300 * 1024) {
      fileBuffer = await compressImage(fileBuffer, 300);
      compressedSizeKB = (fileBuffer.length / 1024).toFixed(2);
      compressed = true;
      console.log(`图片已压缩: ${originalSizeKB}KB -> ${compressedSizeKB}KB`);
    }

    const timestamp = Date.now();
    const extension = req.file.originalname.split('.').pop();
    const fileName = `images/${timestamp}-${Math.random().toString(36).substr(2, 9)}.${extension}`;

    const result = await ossClient.put(fileName, fileBuffer);
    res.json({ 
      url: result.url,
      compressed: compressed,
      originalSizeKB: parseFloat(originalSizeKB),
      compressedSizeKB: parseFloat(compressedSizeKB)
    });
  } catch (error) {
    console.error('OSS上传失败:', error);
    res.status(500).json({ error: '上传失败: ' + error.message });
  }
});

// 使用内存存储上传进度（生产环境可以使用Redis）
const uploadProgressStore = new Map();

// 视频上传接口（支持SSE实时进度）
app.post('/api/upload/video', upload.single('file'), async (req, res) => {
  const startTime = Date.now();
  const uploadId = req.headers['x-upload-id'] || Math.random().toString(36).substr(2, 9);
  
  // 初始化进度存储
  uploadProgressStore.set(uploadId, {
    stage: 'uploading',
    compressProgress: 0,
    ossProgress: 0,
    message: '正在接收文件...'
  });

  try {
    if (!req.file) {
      return res.status(400).json({ error: '请上传文件' });
    }

    const allowedTypes = ['video/mp4', 'video/webm', 'video/ogg'];
    if (!allowedTypes.includes(req.file.mimetype)) {
      return res.status(400).json({ error: '不支持的视频格式' });
    }

    let fileBuffer = req.file.buffer;
    let compressed = false;
    let originalBitrate = null;
    let targetBitrate = 2000;
    const originalSize = req.file.size;

    // 更新状态：文件接收完成
    uploadProgressStore.set(uploadId, {
      stage: 'processing',
      compressProgress: 0,
      ossProgress: 0,
      message: '文件接收完成，正在检测比特率...'
    });

    // 只有MP4格式才检测和压缩
    if (req.file.mimetype === 'video/mp4') {
      try {
        originalBitrate = await getVideoBitrate(fileBuffer);
        console.log(`视频原始比特率: ${originalBitrate} kbps`);

        // 只有当比特率大于2000kbps时才进行压缩
        if (originalBitrate !== null && originalBitrate > targetBitrate) {
          console.log(`比特率 ${originalBitrate} kbps > ${targetBitrate} kbps，开始压缩...`);
          
          uploadProgressStore.set(uploadId, {
            stage: 'compressing',
            compressProgress: 0,
            ossProgress: 0,
            message: `视频压缩中... 0%`
          });
          
          // 创建进度回调
          const onProgress = (progressInfo) => {
            const percent = progressInfo.progress;
            uploadProgressStore.set(uploadId, {
              stage: 'compressing',
              compressProgress: percent,
              ossProgress: 0,
              message: `视频压缩中... ${percent}%`
            });
          };
          
          fileBuffer = await compressVideo(fileBuffer, targetBitrate, onProgress);
          compressed = true;
          console.log(`视频压缩完成，目标比特率: ${targetBitrate} kbps`);
          
          uploadProgressStore.set(uploadId, {
            stage: 'compressing',
            compressProgress: 100,
            ossProgress: 0,
            message: '视频压缩完成'
          });
        } else if (originalBitrate === null) {
          console.log('无法获取视频比特率，跳过压缩');
          uploadProgressStore.set(uploadId, {
            stage: 'processing',
            compressProgress: 100,
            ossProgress: 0,
            message: '无法检测比特率，跳过压缩'
          });
        } else {
          console.log(`比特率 ${originalBitrate} kbps <= ${targetBitrate} kbps，无需压缩`);
          uploadProgressStore.set(uploadId, {
            stage: 'processing',
            compressProgress: 100,
            ossProgress: 0,
            message: `比特率 ${originalBitrate}kbps，无需压缩`
          });
        }
      } catch (ffmpegError) {
        console.warn('视频处理失败，使用原始文件:', ffmpegError.message);
      }
    } else {
      console.log('非MP4格式，跳过压缩');
      uploadProgressStore.set(uploadId, {
        stage: 'processing',
        compressProgress: 100,
        ossProgress: 0,
        message: '非MP4格式，无需压缩'
      });
    }

    // 上传到阿里云OSS
    uploadProgressStore.set(uploadId, {
      stage: 'uploading',
      compressProgress: compressed ? 100 : 0,
      ossProgress: 0,
      message: '正在上传到阿里云OSS... 0%'
    });

    const timestamp = Date.now();
    const extension = req.file.originalname.split('.').pop();
    const fileName = `videos/${timestamp}-${Math.random().toString(36).substr(2, 9)}.${extension}`;

    // 使用流式上传获取进度
    const result = await ossClient.put(fileName, fileBuffer, {
      progress: (percentage) => {
        const percent = Math.round(percentage * 100);
        uploadProgressStore.set(uploadId, {
          stage: 'uploading',
          compressProgress: compressed ? 100 : 0,
          ossProgress: percent,
          message: `正在上传到阿里云OSS... ${percent}%`
        });
      }
    });
    
    const endTime = Date.now();
    const processingTime = Math.round((endTime - startTime) / 1000);
    const compressedSize = fileBuffer.length;

    // 更新完成状态
    uploadProgressStore.set(uploadId, {
      stage: 'done',
      compressProgress: compressed ? 100 : 0,
      ossProgress: 100,
      message: '上传完成'
    });

    // 清理进度存储（延迟清理）
    setTimeout(() => {
      uploadProgressStore.delete(uploadId);
    }, 30000);

    res.json({ 
      url: result.url,
      compressed: compressed,
      originalBitrate: originalBitrate,
      targetBitrate: compressed ? targetBitrate : null,
      originalSize: originalSize,
      compressedSize: compressedSize,
      processingTime: processingTime
    });
  } catch (error) {
    uploadProgressStore.delete(uploadId);
    console.error('OSS上传失败:', error);
    res.status(500).json({ error: '上传失败: ' + error.message });
  }
});

// 获取上传进度接口（用于轮询）
app.get('/api/upload/progress/:uploadId', (req, res) => {
  const { uploadId } = req.params;
  const progress = uploadProgressStore.get(uploadId);
  
  res.json({
    progress: progress || { compressProgress: 0, uploadProgress: 0 }
  });
});

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
