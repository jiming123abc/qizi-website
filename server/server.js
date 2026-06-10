const express = require('express');
const cors = require('cors');
const OSS = require('ali-oss');
const multer = require('multer');
const path = require('path');
const crypto = require('crypto');
const sharp = require('sharp');
const ffmpeg = require('fluent-ffmpeg');
const fs = require('fs');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const db = require('./database');

// 读取 index.html 模板
const indexHtmlPath = path.join(__dirname, '../index.html');
let indexHtmlTemplate = '';
try {
  indexHtmlTemplate = fs.readFileSync(indexHtmlPath, 'utf-8');
} catch (err) {
  console.error('读取 index.html 失败:', err);
}

// 确保本地存储目录存在
const uploadDir = path.join(__dirname, '../public/uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}
if (!fs.existsSync(path.join(uploadDir, 'images'))) {
  fs.mkdirSync(path.join(uploadDir, 'images'));
}
if (!fs.existsSync(path.join(uploadDir, 'videos'))) {
  fs.mkdirSync(path.join(uploadDir, 'videos'));
}

// 检查 OSS 是否配置
const isOSSConfigured = 
  process.env.REACT_APP_OSS_ACCESS_KEY_ID && 
  process.env.REACT_APP_OSS_ACCESS_KEY_ID !== '你的OSS AccessKey ID' &&
  process.env.REACT_APP_OSS_ACCESS_KEY_SECRET && 
  process.env.REACT_APP_OSS_ACCESS_KEY_SECRET !== '你的OSS AccessKey Secret' &&
  process.env.REACT_APP_OSS_BUCKET && 
  process.env.REACT_APP_OSS_BUCKET !== '你的Bucket名称';

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

// 设置请求超时（30分钟）
app.use((req, res, next) => {
  res.setTimeout(1800000, () => {
    console.warn('请求超时');
    if (!res.headersSent) {
      res.status(408).json({ error: '请求超时' });
    }
  });
  next();
});

app.use(cors());

// 统一请求日志中间件
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url} - Content-Type: ${req.headers['content-type'] || 'none'}`);
  next();
});

// JSON 解析中间件 - 增加大小限制和错误处理
app.use(express.json({ limit: '1mb' }));

// JSON 解析错误处理中间件（捕获 malformed JSON 导致的 400 错误）
app.use((err, req, res, next) => {
  if (err && err.type === 'entity.parse.failed') {
    console.error(`[JSON Parse Error] ${req.method} ${req.url} - ${err.message}`);
    return res.status(400).json({ success: false, message: '请求体格式错误，请检查 JSON 格式' });
  }
  if (err && err.status === 413) {
    console.error(`[Payload Too Large] ${req.method} ${req.url} - ${err.message}`);
    return res.status(413).json({ success: false, message: '请求体过大' });
  }
  next(err);
});

app.use('/images', express.static(path.join(__dirname, '../public/images')));
app.use('/uploads', express.static(path.join(__dirname, '../public/uploads')));
app.use('/ffmpeg', express.static(path.join(__dirname, '../dist/ffmpeg')));
// 托管前端静态文件
app.use(express.static(path.join(__dirname, '../dist')));

// 文件大小限制配置
const FILE_SIZE_LIMITS = {
  image: 20 * 1024 * 1024, // 图片：20MB
  video: 1024 * 1024 * 1024 // 视频：1GB
};

// 文件白名单（MIME类型）
const ALLOWED_MIME_TYPES = {
  image: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'],
  video: ['video/mp4', 'video/webm', 'video/ogg', 'video/quicktime']
};

// 文件扩展名白名单
const ALLOWED_EXTENSIONS = {
  image: ['jpg', 'jpeg', 'png', 'webp', 'gif'],
  video: ['mp4', 'webm', 'ogg', 'mov']
};

// 验证文件扩展名
function validateFileExtension(filename, type) {
  const ext = filename.split('.').pop().toLowerCase();
  return ALLOWED_EXTENSIONS[type].includes(ext);
}

// 验证文件大小
function validateFileSize(size, type) {
  return size <= FILE_SIZE_LIMITS[type];
}

// 配置 multer 存储 - 使用磁盘存储处理大文件
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const isImage = file.mimetype.startsWith('image/');
    const uploadPath = isImage 
      ? path.join(uploadDir, 'images') 
      : path.join(uploadDir, 'videos');
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const timestamp = Date.now();
    const extension = file.originalname.split('.').pop();
    const randomStr = Math.random().toString(36).substr(2, 9);
    const fileName = `${timestamp}-${randomStr}.${extension}`;
    cb(null, fileName);
  }
});

// 文件过滤器
const fileFilter = (req, file, cb) => {
  const isImage = file.mimetype.startsWith('image/');
  const isVideo = file.mimetype.startsWith('video/');
  const fileType = isImage ? 'image' : (isVideo ? 'video' : null);
  
  if (!fileType) {
    return cb(new Error('只支持图片和视频文件'), false);
  }
  
  // 检查 MIME 类型
  if (!ALLOWED_MIME_TYPES[fileType].includes(file.mimetype)) {
    return cb(new Error(`不支持的${fileType === 'image' ? '图片' : '视频'}格式`), false);
  }
  
  // 检查文件扩展名
  if (!validateFileExtension(file.originalname, fileType)) {
    return cb(new Error(`不支持的文件扩展名`), false);
  }
  
  cb(null, true);
};

const upload = multer({ 
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: FILE_SIZE_LIMITS.video // 最大限制为视频大小
  }
});

// 初始化 OSS 客户端（如果配置了的话）
let ossClient = null;
if (isOSSConfigured) {
  ossClient = new OSS({
    accessKeyId: process.env.REACT_APP_OSS_ACCESS_KEY_ID,
    accessKeySecret: process.env.REACT_APP_OSS_ACCESS_KEY_SECRET,
    bucket: process.env.REACT_APP_OSS_BUCKET,
    region: process.env.REACT_APP_OSS_REGION || 'oss-cn-beijing',
    secure: true
  });
}

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
    
    // 设置超时（30秒）
    const timeoutId = setTimeout(() => {
      if (fs.existsSync(tempPath)) {
        fs.unlinkSync(tempPath);
      }
      console.warn('获取视频比特率超时');
      resolve(null);
    }, 30000);
    
    try {
      fs.writeFileSync(tempPath, buffer);
      
      ffmpeg.ffprobe(tempPath, (err, metadata) => {
        clearTimeout(timeoutId);
        try {
          if (fs.existsSync(tempPath)) {
            fs.unlinkSync(tempPath);
          }
        } catch (e) {
          // 忽略删除错误
        }
        
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
    } catch (err) {
      clearTimeout(timeoutId);
      try {
        if (fs.existsSync(tempPath)) {
          fs.unlinkSync(tempPath);
        }
      } catch (e) {
        // 忽略删除错误
      }
      console.warn('获取视频比特率出错:', err.message);
      resolve(null);
    }
  });
}

// 压缩视频到指定比特率
async function compressVideo(inputBuffer, maxBitrateKbps = 3000, onProgress) {
  return new Promise((resolve, reject) => {
    const fs = require('fs');
    const tempInputPath = path.join(__dirname, `temp_${Date.now()}_input.mp4`);
    const tempOutputPath = path.join(__dirname, `temp_${Date.now()}_output.mp4`);
    
    // 根据文件大小估算超时时间（每10MB给1分钟）
    const sizeMB = inputBuffer.length / (1024 * 1024);
    const timeoutMs = Math.max(300000, Math.min(1800000, Math.ceil(sizeMB / 10) * 60000)); // 最少5分钟，最多30分钟
    console.log(`视频压缩超时设置: ${Math.round(timeoutMs / 1000)}秒 (文件大小: ${sizeMB.toFixed(2)}MB)`);
    
    // 设置超时
    let ffmpegCommand = null;
    const timeoutId = setTimeout(() => {
      console.warn('视频压缩超时，取消压缩');
      if (ffmpegCommand) {
        try {
          ffmpegCommand.kill('SIGKILL');
        } catch (e) {
          // 忽略错误
        }
      }
      // 超时后返回原始文件而不是失败
      try {
        if (fs.existsSync(tempInputPath)) {
          fs.unlinkSync(tempInputPath);
        }
        if (fs.existsSync(tempOutputPath)) {
          fs.unlinkSync(tempOutputPath);
        }
      } catch (e) {
        // 忽略删除错误
      }
      resolve(inputBuffer);
    }, timeoutMs);
    
    try {
      fs.writeFileSync(tempInputPath, inputBuffer);
      const originalSize = fs.statSync(tempInputPath).size;
      
      ffmpegCommand = ffmpeg(tempInputPath)
        .outputOptions([
          `-b:v ${maxBitrateKbps}k`,
          `-maxrate ${maxBitrateKbps + 500}k`,
          `-bufsize ${maxBitrateKbps * 2}k`,
          '-preset ultrafast',
          '-c:v libx264',
          '-c:a aac',
          '-crf 28',
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
          clearTimeout(timeoutId);
          try {
            const outputBuffer = fs.readFileSync(tempOutputPath);
            const compressedSize = outputBuffer.length;
            console.log(`视频压缩完成: ${(originalSize / 1024 / 1024).toFixed(2)}MB -> ${(compressedSize / 1024 / 1024).toFixed(2)}MB`);
            
            fs.unlinkSync(tempInputPath);
            fs.unlinkSync(tempOutputPath);
            resolve(outputBuffer);
          } catch (err) {
            console.error('读取压缩后视频失败，使用原始文件:', err.message);
            try {
              fs.unlinkSync(tempInputPath);
              if (fs.existsSync(tempOutputPath)) {
                fs.unlinkSync(tempOutputPath);
              }
            } catch (e) {
              // 忽略删除错误
            }
            resolve(inputBuffer);
          }
        })
        .on('error', (err) => {
          clearTimeout(timeoutId);
          console.warn('视频压缩失败，使用原始文件:', err.message);
          try {
            fs.unlinkSync(tempInputPath);
            if (fs.existsSync(tempOutputPath)) {
              fs.unlinkSync(tempOutputPath);
            }
          } catch (e) {
            // 忽略删除错误
          }
          // 压缩失败时也返回原始文件
          resolve(inputBuffer);
        })
        .save(tempOutputPath);
    } catch (err) {
      clearTimeout(timeoutId);
      console.error('视频压缩出错，使用原始文件:', err.message);
      try {
        if (fs.existsSync(tempInputPath)) {
          fs.unlinkSync(tempInputPath);
        }
        if (fs.existsSync(tempOutputPath)) {
          fs.unlinkSync(tempOutputPath);
        }
      } catch (e) {
        // 忽略删除错误
      }
      resolve(inputBuffer);
    }
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

    // 验证文件大小
    if (!validateFileSize(req.file.size, 'image')) {
      const maxSizeMB = FILE_SIZE_LIMITS.image / (1024 * 1024);
      return res.status(400).json({ error: `图片大小不能超过 ${maxSizeMB}MB` });
    }

    const fileName = req.file.filename;
    const filePath = req.file.path;
    const originalSizeKB = (req.file.size / 1024).toFixed(2);
    let compressed = false;
    let compressedSizeKB = originalSizeKB;
    let fileBuffer = fs.readFileSync(filePath);
    
    // 如果图片大于 300KB，自动压缩
    if (req.file.size > 300 * 1024) {
      fileBuffer = await compressImage(fileBuffer, 300);
      compressedSizeKB = (fileBuffer.length / 1024).toFixed(2);
      compressed = true;
      console.log(`图片已压缩: ${originalSizeKB}KB -> ${compressedSizeKB}KB`);
    }

    let fileUrl = '';
    
    // 检查是否强制使用本地存储（用于 OSS 失败后用户确认的情况）
    const forceLocalStorage = req.query.forceLocal === 'true';
    
    if (isOSSConfigured && !forceLocalStorage && ossClient) {
      // 使用 OSS 上传
      try {
        const ossFileName = `images/${fileName}`;
        const result = await ossClient.put(ossFileName, fileBuffer);
        fileUrl = result.url;
        // 上传成功后删除本地临时文件
        fs.unlinkSync(filePath);
        console.log('使用 OSS 上传成功');
      } catch (ossError) {
        console.warn('OSS 上传失败:', ossError.message);
        // 返回 OSS 失败错误，让前端询问用户是否使用本地存储
        // 删除已保存的临时文件
        try {
          fs.unlinkSync(filePath);
        } catch (e) {
          console.warn('删除临时文件失败:', e.message);
        }
        return res.status(500).json({ 
          error: 'OSS 上传失败', 
          ossError: true,
          message: '阿里云 OSS 上传失败，是否要上传到本地存储？'
        });
      }
    } else {
      // 使用本地存储 - 如果压缩了，需要覆盖原文件
      if (compressed) {
        fs.writeFileSync(filePath, fileBuffer);
      }
      fileUrl = `/uploads/images/${fileName}`;
      console.log('使用本地存储');
    }

    res.json({ 
      url: fileUrl,
      compressed: compressed,
      originalSizeKB: parseFloat(originalSizeKB),
      compressedSizeKB: parseFloat(compressedSizeKB)
    });
  } catch (error) {
    console.error('上传失败:', error);
    // 清理已保存的文件
    if (req.file && req.file.path) {
      try {
        fs.unlinkSync(req.file.path);
      } catch (e) {
        console.warn('清理临时文件失败:', e.message);
      }
    }
    res.status(500).json({ error: '上传失败: ' + error.message });
  }
});

// OSS 预签名上传接口（客户端直传 OSS 使用）
app.post('/api/oss/presign', async (req, res) => {
  try {
    if (!isOSSConfigured || !ossClient) {
      return res.status(500).json({ error: 'OSS 未配置' });
    }
    const { folder, filename, contentType } = req.body;
    if (!folder || !filename) {
      return res.status(400).json({ error: '缺少参数 folder 或 filename' });
    }
    const key = `${folder}/${Date.now()}-${filename}`;
    const signedUrl = ossClient.signatureUrl(key, {
      method: 'PUT',
      'Content-Type': contentType || 'application/octet-stream',
    });
    const publicUrl = `https://${ossClient.options.bucket}.${ossClient.options.region}.aliyuncs.com/${key}`;
    res.json({ signedUrl, publicUrl, key });
  } catch (error) {
    console.error('生成预签名URL失败:', error);
    res.status(500).json({ error: error.message });
  }
});

// 使用内存存储上传进度（生产环境可以使用Redis）
const uploadProgressStore = new Map();
const videoTasks = new Map(); // 任务id -> 状态对象

// 视频上传接口 (异步模式)
app.post('/api/upload/video', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: '请上传文件' });
    }

    // 验证文件大小
    if (!validateFileSize(req.file.size, 'video')) {
      const maxSizeMB = FILE_SIZE_LIMITS.video / (1024 * 1024);
      return res.status(400).json({ error: `视频大小不能超过 ${maxSizeMB}MB` });
    }

    const fileName = req.file.filename;
    const filePath = req.file.path;
    const shouldCompress = req.query.compress === 'true';
    const forceLocalStorage = req.query.forceLocal === 'true';
    const taskId = Date.now() + '-' + Math.random().toString(36).substr(2, 9);

    // 立即初始化任务状态
    videoTasks.set(taskId, {
      status: 'processing',
      progress: 0,
      compressProgress: 0,
      uploadProgress: 0,
      message: '文件上传完成，正在处理中...',
      result: null,
      error: null,
      filePath,
      fileName,
      shouldCompress,
      forceLocalStorage,
      createdAt: Date.now()
    });

    // 立即返回 taskId，不等处理完成
    res.json({ taskId, status: 'queued' });

    // 后台异步执行完整流程
    (async () => {
      try {
        const task = videoTasks.get(taskId);
        if (!task) return;

        const { filePath, fileName, shouldCompress, forceLocalStorage } = task;
        let fileUrl = '';
        let compressed = false;
        let compressionFailed = false;
        let originalSizeKB = 0;
        let compressedSizeKB = 0;

        task.message = '正在检查文件...';
        videoTasks.set(taskId, task);

        // 如果请求压缩，先读取文件并进行服务端压缩
        let fileToUpload = filePath;
        let fileBufferToUpload = null;
        if (shouldCompress) {
          try {
            const fileBuffer = fs.readFileSync(filePath);
            originalSizeKB = Math.round(fileBuffer.length / 1024);
            const bitrate = await getVideoBitrate(fileBuffer);
            if (bitrate && bitrate > 3000) {
              console.log(`服务端压缩开始: 码率 ${bitrate}kbps, 文件大小 ${originalSizeKB}KB`);
              task.message = '正在压缩视频...';
              task.compressProgress = 0;
              videoTasks.set(taskId, task);

              const compressedBuffer = await compressVideo(fileBuffer, 3000);
              compressedSizeKB = Math.round(compressedBuffer.length / 1024);
              if (compressedBuffer.length < fileBuffer.length) {
                compressed = true;
                fileBufferToUpload = compressedBuffer;
                task.compressProgress = 100;
                console.log(`服务端压缩完成: ${originalSizeKB}KB -> ${compressedSizeKB}KB`);
              } else {
                compressionFailed = true;
                fileBufferToUpload = fileBuffer;
                console.log(`服务端压缩未减小文件，使用原始文件`);
              }
            } else {
              fileBufferToUpload = fileBuffer;
            }
            task.progress = 50;
            videoTasks.set(taskId, task);
          } catch (compressError) {
            console.warn('服务端压缩出错:', compressError.message);
            compressionFailed = true;
            try {
              fileBufferToUpload = fs.readFileSync(filePath);
            } catch (e) {
              fileBufferToUpload = null;
            }
          }
        } else {
          fileBufferToUpload = fs.readFileSync(filePath);
        }

        task.message = '正在上传到存储...';
        task.progress = 75;
        videoTasks.set(taskId, task);

        if (isOSSConfigured && !forceLocalStorage && ossClient) {
          try {
            const ossFileName = `videos/${fileName}`;
            let result;
            if (fileBufferToUpload) {
              result = await ossClient.put(ossFileName, fileBufferToUpload);
            } else {
              result = await ossClient.put(ossFileName, filePath);
            }
            fileUrl = result.url;
            fs.unlinkSync(filePath);
            console.log('使用 OSS 上传视频成功');
          } catch (ossError) {
            console.warn('OSS 上传失败:', ossError.message);
            try { fs.unlinkSync(filePath); } catch (e) {}
            // 更新任务状态为错误
            const finalTask = videoTasks.get(taskId);
            if (finalTask) {
              finalTask.status = 'failed';
              finalTask.error = 'OSS 上传失败';
              finalTask.ossError = true;
              finalTask.message = '阿里云 OSS 上传失败';
              videoTasks.set(taskId, finalTask);
            }
            return;
          }
        } else {
          if (fileBufferToUpload && compressed) {
            fs.writeFileSync(filePath, fileBufferToUpload);
          }
          fileUrl = `/uploads/videos/${fileName}`;
          console.log('使用本地存储视频');
        }

        task.uploadProgress = 100;
        task.progress = 100;
        task.status = 'completed';
        task.message = '上传完成';
        task.result = {
          url: fileUrl,
          compressed,
          compressionFailed,
          originalSizeKB,
          compressedSizeKB
        };
        videoTasks.set(taskId, task);

      } catch (error) {
        console.error('后台处理失败:', error);
        const task = videoTasks.get(taskId);
        if (task) {
          task.status = 'failed';
          task.error = '处理失败: ' + error.message;
          task.message = '处理失败';
          if (task.filePath && fs.existsSync(task.filePath)) {
            try { fs.unlinkSync(task.filePath); } catch (e) {}
          }
          videoTasks.set(taskId, task);
        }
      }
    })();

  } catch (error) {
    console.error('上传失败:', error);
    if (req.file && req.file.path) {
      try { fs.unlinkSync(req.file.path); } catch (e) {}
    }
    res.status(500).json({ error: '上传失败: ' + error.message });
  }
});

// 获取视频任务状态接口
app.get('/api/upload/video/status/:taskId', (req, res) => {
  const { taskId } = req.params;
  const task = videoTasks.get(taskId);

  if (!task) {
    return res.status(404).json({ error: '任务不存在或已过期' });
  }

  res.json(task);

  // 完成后可以清理任务（比如保留15分钟）
  if (task.status === 'completed' || task.status === 'failed') {
    const age = Date.now() - task.createdAt;
    if (age > 900000) { // 15分钟
      videoTasks.delete(taskId);
    }
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

app.get('/api/portfolio-items', async (req, res) => {
  try {
    const items = await db.portfolioItems.getAll();
    res.json(items);
  } catch (error) {
    console.error('Get portfolio items error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/portfolio-items', async (req, res) => {
  try {
    const items = await db.portfolioItems.getAll();
    const maxSortOrder = Math.max(...items.map(i => i.sortOrder || 0), 0);
    const item = { ...req.body, sortOrder: maxSortOrder + 1 };
    const newItem = await db.portfolioItems.create(item);
    res.json(newItem);
  } catch (error) {
    console.error('Create portfolio item error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/portfolio-items/sort', async (req, res) => {
  try {
    const result = await db.portfolioItems.updateSort(req.body);
    res.json(result);
  } catch (error) {
    console.error('Update portfolio sort error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/portfolio-items/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const updatedItem = await db.portfolioItems.update(id, req.body);
    res.json(updatedItem);
  } catch (error) {
    console.error('Update portfolio item error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/portfolio-items/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    await db.portfolioItems.delete(id);
    res.status(204).end();
  } catch (error) {
    console.error('Delete portfolio item error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/categories-details', async (req, res) => {
  try {
    const categories = await db.categoriesDetails.getAll();
    res.json(categories);
  } catch (error) {
    console.error('Get categories details error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/categories-details', async (req, res) => {
  try {
    const categories = await db.categoriesDetails.getAll();
    const maxSortOrder = Math.max(...categories.map(c => c.sortOrder || 0), 0);
    const category = { 
      ...req.body, 
      id: req.body.id || `cat${Date.now()}`,
      sortOrder: maxSortOrder + 1 
    };
    const newCategory = await db.categoriesDetails.create(category);
    res.json(newCategory);
  } catch (error) {
    console.error('Create category details error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/categories-details/sort', async (req, res) => {
  try {
    const result = await db.categoriesDetails.updateSort(req.body);
    res.json(result);
  } catch (error) {
    console.error('Update categories sort error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/categories-details/:id', async (req, res) => {
  try {
    const updatedCategory = await db.categoriesDetails.update(req.params.id, req.body);
    res.json(updatedCategory);
  } catch (error) {
    console.error('Update category details error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/categories-details/:id', async (req, res) => {
  try {
    await db.categoriesDetails.delete(req.params.id);
    res.status(204).end();
  } catch (error) {
    console.error('Delete category details error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/featured-works', async (req, res) => {
  try {
    const featured = await db.featuredWorks.getAll();
    res.json(featured);
  } catch (error) {
    console.error('Get featured works error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/featured-works', async (req, res) => {
  try {
    const { portfolioId } = req.body;
    const existingWorks = await db.featuredWorks.getAll();
    const maxSortOrder = existingWorks.length > 0 ? Math.max(...existingWorks.map(w => w.sortOrder || 0)) : 0;
    const fw = { id: `fw${Date.now()}`, portfolioId: Number(portfolioId), sortOrder: maxSortOrder + 1 };
    
    await db.featuredWorks.create(fw);
    
    const allWorks = await db.featuredWorks.getAll();
    res.json(allWorks);
  } catch (error) {
    console.error('Add featured work error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/featured-works/sort', async (req, res) => {
  try {
    const result = await db.featuredWorks.updateSort(req.body);
    res.json(result);
  } catch (error) {
    console.error('Update featured sort error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/featured-works/:id', async (req, res) => {
  try {
    await db.featuredWorks.delete(req.params.id);
    const works = await db.featuredWorks.getAll();
    res.json(works);
  } catch (error) {
    console.error('Remove featured work error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/home-content', async (req, res) => {
  try {
    const content = await db.homeContent.get();
    res.json(content);
  } catch (error) {
    console.error('Get home content error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/home-content', async (req, res) => {
  try {
    const updatedContent = await db.homeContent.update(req.body);
    res.json(updatedContent);
  } catch (error) {
    console.error('Update home content error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/team-members', async (req, res) => {
  try {
    const members = await db.teamMembers.getAll();
    res.json(members);
  } catch (error) {
    console.error('Get team members error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/team-members', async (req, res) => {
  try {
    const members = await db.teamMembers.getAll();
    const maxSortOrder = Math.max(...members.map(m => m.sortOrder || 0), 0);
    const member = { ...req.body, sortOrder: maxSortOrder + 1 };
    const newMember = await db.teamMembers.create(member);
    res.json(newMember);
  } catch (error) {
    console.error('Create team member error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/team-members/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const updatedMember = await db.teamMembers.update(id, req.body);
    res.json(updatedMember);
  } catch (error) {
    console.error('Update team member error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/team-members/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    await db.teamMembers.delete(id);
    res.status(204).end();
  } catch (error) {
    console.error('Delete team member error:', error);
    res.status(500).json({ error: error.message });
  }
});

// 数据导入 API
app.post('/api/data/import', async (req, res) => {
  try {
    const data = req.body;
    console.log('开始导入数据...');

    if (data.portfolioItems && Array.isArray(data.portfolioItems)) {
      for (const item of data.portfolioItems) {
        if (item.id) {
          await db.portfolioItems.put(item);
        }
      }
      console.log(`导入了 ${data.portfolioItems.length} 个作品`);
    }

    if (data.categoriesDetails && Array.isArray(data.categoriesDetails)) {
      for (const cat of data.categoriesDetails) {
        if (cat.id) {
          await db.categoriesDetails.put(cat);
        }
      }
      console.log(`导入了 ${data.categoriesDetails.length} 个分类`);
    }

    if (data.teamMembers && Array.isArray(data.teamMembers)) {
      for (const member of data.teamMembers) {
        if (member.id) {
          await db.teamMembers.put(member);
        }
      }
      console.log(`导入了 ${data.teamMembers.length} 个团队成员`);
    }

    if (data.homeContent) {
      await db.homeContent.put(data.homeContent);
      console.log('导入了首页内容');
    }

    if (data.featuredWorks && Array.isArray(data.featuredWorks)) {
      // 直接使用 featuredWorks 的 updateSort 方法，它会先清空再插入
      await db.featuredWorks.updateSort(data.featuredWorks);
      console.log(`导入了 ${data.featuredWorks.length} 个精选作品`);
    }

    res.json({ success: true, message: '数据导入成功' });
  } catch (error) {
    console.error('数据导入失败:', error);
    res.status(500).json({ success: false, message: '数据导入失败' });
  }
});

// ================= 存储管理 API =================

// 获取数据库中所有引用的文件路径
async function getReferencedFiles() {
  const files = new Set();
  
  // 获取 portfolio items
  const portfolioItems = await db.portfolioItems.getAll();
  portfolioItems.forEach(item => {
    if (item.img) files.add(item.img);
    if (item.images && Array.isArray(item.images)) {
      item.images.forEach(img => files.add(img));
    }
    if (item.videoUrl) files.add(item.videoUrl);
  });

  // 获取 featured works
  const featuredWorks = await db.featuredWorks.getAll();
  featuredWorks.forEach(work => {
    if (work.img) files.add(work.img);
  });

  // 获取 home content
  const homeContent = await db.homeContent.get();
  if (homeContent.heroImage) files.add(homeContent.heroImage);
  if (homeContent.heroSlides && Array.isArray(homeContent.heroSlides)) {
    homeContent.heroSlides.forEach(slide => {
      if (slide.img) files.add(slide.img);
    });
  }

  // 获取 team members
  const teamMembers = await db.teamMembers.getAll();
  teamMembers.forEach(member => {
    if (member.avatar) files.add(member.avatar);
  });

  // 获取 categories
  const categories = await db.categoriesDetails.getAll();
  categories.forEach(cat => {
    if (cat.coverImage) files.add(cat.coverImage);
  });

  return Array.from(files);
}

// 从 URL 提取文件路径
function extractFilePath(url) {
  if (!url) return null;
  // 如果是完整的 OSS URL
  if (url.startsWith('http')) {
    try {
      const urlObj = new URL(url);
      // 路径格式: /images/xxx.jpg
      const pathname = urlObj.pathname;
      if (pathname) {
        return pathname.startsWith('/') ? pathname.slice(1) : pathname;
      }
    } catch (e) {
      // 忽略
    }
  }
  // 如果是相对路径
  if (url.startsWith('/')) {
    return url.slice(1);
  }
  return url;
}

// 检查文件是否被引用
function isFileReferenced(filePath, referencedFiles) {
  const normalizedFile = decodeURIComponent(filePath.toLowerCase());
  
  return referencedFiles.some(ref => {
    const normalizedRef = extractFilePath(ref);
    if (!normalizedRef) return false;
    
    const normalizedRefLower = decodeURIComponent(normalizedRef.toLowerCase());
    
    // 两种匹配方式都检查
    const fileIncludesRef = normalizedFile.includes(normalizedRefLower);
    const refIncludesFile = normalizedRefLower.includes(normalizedFile);
    const exactMatch = normalizedFile === normalizedRefLower;
    
    return fileIncludesRef || refIncludesFile || exactMatch;
  });
}

// 获取所有未引用文件
app.get('/api/storage/unreferenced', async (req, res) => {
  try {
    const referencedFiles = await getReferencedFiles();
    const unreferencedFiles = [];

    // 检查 OSS 文件（如果配置了）
    if (isOSSConfigured && ossClient) {
      try {
        let continuationToken = null;
        do {
          const result = await ossClient.listV2({
            prefix: '',
            'max-keys': 100,
            'continuation-token': continuationToken
          });

          if (result.objects) {
            result.objects.forEach(obj => {
              // 只处理图片和视频文件
              const ext = obj.name.split('.').pop().toLowerCase();
              const isImage = ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext);
              const isVideo = ['mp4', 'webm', 'mov', 'ogg'].includes(ext);

              if (isImage || isVideo) {
                if (!isFileReferenced(obj.name, referencedFiles)) {
                  // 使用和上传时一样的 URL 格式
                  const publicUrl = `https://${ossClient.options.bucket}.${ossClient.options.region}.aliyuncs.com/${obj.name}`;
                  unreferencedFiles.push({
                    name: obj.name,
                    size: obj.size,
                    url: publicUrl,
                    source: 'oss',
                    lastModified: obj.lastModified
                  });
                }
              }
            });
          }

          continuationToken = result.nextContinuationToken;
        } while (continuationToken);
      } catch (ossError) {
        console.warn('获取 OSS 文件列表失败:', ossError.message);
        // 继续执行，不阻止本地文件的检查
      }
    }

    // 检查本地文件
    const localImagesPath = path.join(__dirname, '../public/uploads/images');
    const localVideosPath = path.join(__dirname, '../public/uploads/videos');

    const scanLocalFiles = (dirPath, source) => {
      if (fs.existsSync(dirPath)) {
        const files = fs.readdirSync(dirPath);
        files.forEach(file => {
          const filePath = path.join(dirPath, file);
          const stat = fs.statSync(filePath);
          if (stat.isFile()) {
            const relativePath = `uploads/${source}/${file}`;
            if (!isFileReferenced(relativePath, referencedFiles)) {
              unreferencedFiles.push({
                name: relativePath,
                size: stat.size,
                url: `/${relativePath}`,
                source: 'local',
                lastModified: stat.mtime.toISOString()
              });
            }
          }
        });
      }
    };

    scanLocalFiles(localImagesPath, 'images');
    scanLocalFiles(localVideosPath, 'videos');

    // 计算总大小
    const totalSize = unreferencedFiles.reduce((sum, f) => sum + f.size, 0);

    res.json({
      success: true,
      data: {
        files: unreferencedFiles,
        totalSize,
        count: unreferencedFiles.length
      }
    });
  } catch (error) {
    console.error('获取未引用文件失败:', error);
    res.status(500).json({ success: false, message: '获取未引用文件失败' });
  }
});

// 删除指定文件
app.delete('/api/storage/files', async (req, res) => {
  try {
    const { files } = req.body;

    if (!Array.isArray(files) || files.length === 0) {
      return res.status(400).json({ success: false, message: '请选择要删除的文件' });
    }

    const results = [];

    for (const file of files) {
      try {
        if (file.source === 'oss' && isOSSConfigured && ossClient) {
          // 删除 OSS 文件
          await ossClient.delete(file.name);
          results.push({ name: file.name, success: true, source: 'oss' });
        } else if (file.source === 'local') {
          // 删除本地文件
          const filePath = path.join(__dirname, '../public', file.name);
          if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
            results.push({ name: file.name, success: true, source: 'local' });
          } else {
            results.push({ name: file.name, success: false, error: '文件不存在', source: 'local' });
          }
        }
      } catch (deleteError) {
        console.error(`删除文件失败 ${file.name}:`, deleteError.message);
        results.push({ 
          name: file.name, 
          success: false, 
          error: deleteError.message,
          source: file.source 
        });
      }
    }

    const successCount = results.filter(r => r.success).length;
    const failCount = results.filter(r => !r.success).length;

    res.json({
      success: true,
      data: {
        successCount,
        failCount,
        results
      }
    });
  } catch (error) {
    console.error('删除文件失败:', error);
    res.status(500).json({ success: false, message: '删除文件失败' });
  }
});

// ================= AI 生成 API =================

// 预设封面图颜色方案
const coverColors = [
  { primary: '#667eea', secondary: '#764ba2' }, // 紫蓝渐变
  { primary: '#f093fb', secondary: '#f5576c' }, // 粉红渐变
  { primary: '#4facfe', secondary: '#00f2fe' }, // 青蓝渐变
  { primary: '#43e97b', secondary: '#38f9d7' }, // 青绿渐变
  { primary: '#fa709a', secondary: '#fee140' }, // 粉黄渐变
  { primary: '#a8edea', secondary: '#fed6e3' }, // 浅粉渐变
  { primary: '#d299c2', secondary: '#fef9d7' }, // 紫黄渐变
  { primary: '#89f7fe', secondary: '#66a6ff' }, // 蓝青渐变
];

// 预设分类封面图
const presetCovers = {
  '数字人': 'https://images.unsplash.com/photo-1617791160505-6f00504e3519?w=1200&h=800&fit=crop',
  '电影': 'https://images.unsplash.com/photo-1485846234645-a62644f84728?w=1200&h=800&fit=crop',
  '视频': 'https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?w=1200&h=800&fit=crop',
  '技术': 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=1200&h=800&fit=crop',
  'ai': 'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=1200&h=800&fit=crop',
  '艺术': 'https://images.unsplash.com/photo-1541367777708-7905fe3296c0?w=1200&h=800&fit=crop',
};

// 生成渐变封面图
function generateGradientCover(seed) {
  const colorIndex = seed % coverColors.length;
  const colors = coverColors[colorIndex];
  
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="1200" height="800" viewBox="0 0 1200 800">
      <defs>
        <linearGradient id="coverGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:${colors.primary};stop-opacity:1" />
          <stop offset="100%" style="stop-color:${colors.secondary};stop-opacity:1" />
        </linearGradient>
      </defs>
      <rect width="1200" height="800" fill="url(#coverGradient)" />
      <circle cx="200" cy="200" r="100" fill="rgba(255,255,255,0.1)" />
      <circle cx="1000" cy="600" r="150" fill="rgba(255,255,255,0.08)" />
      <circle cx="600" cy="400" r="80" fill="rgba(255,255,255,0.12)" />
    </svg>
  `;
  
  return `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(svg)))}`;
}

// AI 生成封面图 - 使用 Pollinations.ai + 多级降级
app.post('/api/ai/generate-cover', async (req, res) => {
  try {
    const { categoryName, description } = req.body;

    if (!categoryName) {
      return res.status(400).json({ success: false, message: '请输入分类名称' });
    }

    const seed = Math.floor(Math.random() * 10000000);
    const combinedKeywords = `${categoryName} ${description || ''}`.trim();
    console.log(`[AI Cover] 生成: categoryName=${categoryName}, seed=${seed}`);

    // 构建 Pollinations.ai 的英文 prompt（AI 生成图片对英文 prompt 效果更好）
    // 先尝试使用原始中文关键词，然后是英文翻译
    const zhPrompt = `${categoryName},${description || ''},专业摄影,高清,1200x800,电影感`;

    // 图片服务列表（按优先级）
    // 1. Pollinations.ai - 免费 AI 生图，效果最好
    // 2. LoremFlickr - 关键词搜索真实图片
    // 3. 渐变色 SVG 兜底
    const coverServices = [
      // Pollinations.ai - AI 生成图片（中文 prompt）
      () => `https://image.pollinations.ai/prompt/${encodeURIComponent(zhPrompt)}?width=1200&height=800&nologo=true&enhance=true&seed=${seed}`,
      // Pollinations.ai - 使用简短 prompt
      () => `https://image.pollinations.ai/prompt/${encodeURIComponent(categoryName)}?width=1200&height=800&nologo=true&seed=${seed + 1}`,
      // LoremFlickr 兜底
      () => `https://loremflickr.com/1200/800/${encodeURIComponent(categoryName)}?lock=${seed + 2}`,
    ];

    // 尝试每个图片服务
    for (let i = 0; i < coverServices.length; i++) {
      const url = coverServices[i]();
      console.log(`[AI Cover] 尝试服务 ${i + 1}: ${url.substring(0, 80)}...`);

      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 15000); // Pollinations 可能需要更长时间

        const response = await fetch(url, {
          signal: controller.signal,
          headers: { 'User-Agent': 'Mozilla/5.0' }
        });

        clearTimeout(timeout);

        if (response.ok) {
          const buffer = Buffer.from(await response.arrayBuffer());

          // 检查图片是否有效（大于5KB且是image类型）
          const contentType = response.headers.get('content-type') || '';
          if (buffer.length > 5000 && (contentType.includes('image') || contentType === 'application/octet-stream')) {
            const ext = contentType.includes('jpeg') ? 'jpg' :
                       contentType.includes('png') ? 'png' :
                       contentType.includes('webp') ? 'webp' : 'jpg';
            const fileName = `ai-cover-${Date.now()}-${seed}.${ext}`;
            const filePath = path.join(uploadDir, 'images', fileName);
            fs.writeFileSync(filePath, buffer);

            console.log(`[AI Cover] 成功 (服务 ${i + 1})! 大小: ${buffer.length} bytes`);
            return res.json({
              success: true,
              data: { url: `/uploads/images/${fileName}` }
            });
          } else {
            console.log(`[AI Cover] 服务 ${i + 1} 返回图片太小或类型不对: ${contentType}, ${buffer.length} bytes`);
          }
        } else {
          console.log(`[AI Cover] 服务 ${i + 1} 返回状态: ${response.status}`);
        }
      } catch (err) {
        console.log(`[AI Cover] 服务 ${i + 1} 出错: ${err.message}`);
      }
    }

    // 最终降级：本地生成高质量渐变封面
    console.log(`[AI Cover] 所有远程服务失败，使用本地方案: 渐变SVG`);
    const gradientUrl = generateGradientCover(categoryName.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0));

    return res.json({
      success: true,
      data: { url: gradientUrl }
    });

  } catch (error) {
    console.error('[AI Cover] 失败:', error.message);

    const seed = (req.body && req.body.categoryName || 'default').split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const fallbackUrl = generateGradientCover(seed);

    res.json({
      success: true,
      data: { url: fallbackUrl }
    });
  }
});

// AI 生成图标 - 智能关键词匹配 + 动态兜底
app.post('/api/ai/generate-icon', async (req, res) => {
  try {
    const { categoryName, description } = req.body;

    if (!categoryName) {
      return res.status(400).json({ success: false, message: '请输入分类名称' });
    }

    const nameLower = categoryName.toLowerCase();
    const descLower = (description || '').toLowerCase();
    const searchText = `${nameLower} ${descLower}`;
    console.log(`[AI Icon] 生成: categoryName=${categoryName}`);

    // 统一的默认图标
    const getDefaultIcon = (colorSeed = 0) => {
      const colors = [
        { stroke: '#667eea', fill: '#667eea' },
        { stroke: '#f093fb', fill: '#f093fb' },
        { stroke: '#4facfe', fill: '#4facfe' },
        { stroke: '#43e97b', fill: '#43e97b' },
        { stroke: '#fa709a', fill: '#fa709a' },
        { stroke: '#ffb86c', fill: '#ffb86c' },
      ];
      const c = colors[colorSeed % colors.length];
      return `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="${c.stroke}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>`;
    };

    const matchIcon = (text) => {
      for (const matcher of iconMatchers) {
        if (matcher.keywords.some(k => text.includes(k.toLowerCase()))) {
          return matcher.svg;
        }
      }
      return null;
    };

    // 图标匹配器 - 线条风格SVG (60+ 种预设)
    const iconMatchers = [
      // ============== 数字/AI 类 ==============
      {
        keywords: ['数字人', 'ai', '人工智能', '数字', '虚拟', 'robot', '数字形象'],
        label: '数字人',
        svg: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="10" rx="2"/><circle cx="12" cy="5" r="2"/><path d="M12 7v4"/><line x1="8" y1="16" x2="8" y2="16"/><line x1="16" y1="16" x2="16" y2="16"/></svg>`
      },
      {
        keywords: ['虚拟人', 'avatar', '虚拟形象', '数字孪生'],
        label: '虚拟人',
        svg: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/></svg>`
      },
      {
        keywords: ['神经网络', 'deep learning', '深度学习', 'neural'],
        label: '神经网络',
        svg: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="5" cy="6" r="1.5"/><circle cx="5" cy="12" r="1.5"/><circle cx="5" cy="18" r="1.5"/><circle cx="12" cy="6" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="12" cy="18" r="1.5"/><circle cx="19" cy="12" r="1.5"/><path d="M7 6l4 0M7 12l4 0M7 18l4 0M14 6l3 6M14 12l3 0M14 18l3-6"/></svg>`
      },

      // ============== 影视制作类 ==============
      {
        keywords: ['电影', '影视', '影片', 'cinema', 'movie', '院线'],
        label: '电影',
        svg: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="5 3 19 12 5 21 5 3"/></svg>`
      },
      {
        keywords: ['视频', '短片', 'video', '拍摄'],
        label: '视频',
        svg: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/></svg>`
      },
      {
        keywords: ['宣传片', '宣传', '推广', '形象片', '品牌宣传片'],
        label: '宣传片',
        svg: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 11l18-5v12L3 14v-3z"/><path d="M11.6 16.8a3 3 0 1 1-5.8-1.6"/></svg>`
      },
      {
        keywords: ['广告片', '广告', 'commercial', 'ad'],
        label: '广告片',
        svg: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.5 16.5v-9l9 4.5-9 4.5z"/><rect x="3" y="3" width="18" height="18" rx="2"/></svg>`
      },
      {
        keywords: ['专题片', '专题', '纪录片', 'documentary'],
        label: '专题片',
        svg: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="9" y1="13" x2="15" y2="13"/><line x1="9" y1="17" x2="15" y2="17"/></svg>`
      },
      {
        keywords: ['课程', '微课', '课程实录', '在线课程', 'course', 'lecture', '网课'],
        label: '课程实录',
        svg: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/><circle cx="14" cy="10" r="1.5"/></svg>`
      },
      {
        keywords: ['教学', '课堂', '培训', '教学视频', '教室', 'class'],
        label: '教学',
        svg: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/></svg>`
      },
      {
        keywords: ['活动', '活动视频', 'event', '演出', '庆典'],
        label: '活动视频',
        svg: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/><path d="M12 3v18"/></svg>`
      },
      {
        keywords: ['mv', 'mtv', '音乐电视', '音乐视频'],
        label: 'MV',
        svg: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/><path d="M9 18c0-3 3-3 3 0s-3 0-3 0z" fill="currentColor"/></svg>`
      },
      {
        keywords: ['短视频', '短视', 'short video', 'vlog', '抖音', '快手'],
        label: '短视频',
        svg: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/><line x1="16" y1="14" x2="18" y2="14"/><line x1="19" y1="14" x2="19" y2="14"/></svg>`
      },
      {
        keywords: ['动画', '动漫', 'animation', 'cartoon', '二维动画', '三维动画', 'mg动画', 'motion graphic'],
        label: '动画',
        svg: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M8 14s1.5 2 4 2 4-2 4-2"/><line x1="9" y1="9" x2="9.01" y2="9"/><line x1="15" y1="9" x2="15.01" y2="9"/><path d="M2 12h20M22 12a10 10 0 0 1-20 0 10 10 0 0 1 20 0z" fill="none"/></svg>`
      },
      {
        keywords: ['3d', '三维', '3d动画', '3d建模', 'cg'],
        label: '3D',
        svg: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg>`
      },
      {
        keywords: ['特效', '后期', '特效制作', 'vfx', 'special effect'],
        label: '特效',
        svg: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>`
      },
      {
        keywords: ['剪辑', '后期剪辑', 'edit', 'editing'],
        label: '剪辑',
        svg: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="6" cy="6" r="3"/><circle cx="18" cy="18" r="3"/><path d="M8.12 8.12L19.88 19.88M8.12 8.12l5.88 5.88 5.88 5.88"/></svg>`
      },
      {
        keywords: ['航拍', '无人机', 'aerial', 'drone'],
        label: '航拍',
        svg: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="5" cy="5" r="2"/><circle cx="19" cy="5" r="2"/><circle cx="5" cy="19" r="2"/><circle cx="19" cy="19" r="2"/><line x1="5" y1="5" x2="19" y2="19"/><line x1="19" y1="5" x2="5" y2="19"/><rect x="10" y="10" width="4" height="4"/></svg>`
      },
      {
        keywords: ['直播', 'live', '在线直播', 'streaming'],
        label: '直播',
        svg: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14M4.93 19.07a10 10 0 0 1 0-14.14"/><circle cx="12" cy="12" r="10" fill="none"/></svg>`
      },
      {
        keywords: ['主持', '主播', '主持人', 'anchor', 'host'],
        label: '主持',
        svg: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></svg>`
      },
      {
        keywords: ['访谈', '采访', 'talk show', 'interview'],
        label: '访谈',
        svg: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/><line x1="8" y1="10" x2="8" y2="10"/><line x1="12" y1="10" x2="12" y2="10"/><line x1="16" y1="10" x2="16" y2="10"/></svg>`
      },

      // ============== 企业/商业类 ==============
      {
        keywords: ['企业', '公司', '企业宣传片', 'corporate', 'enterprise'],
        label: '企业',
        svg: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 21h18"/><path d="M5 21V7l8-4v18"/><path d="M19 21V11l-6-4"/></svg>`
      },
      {
        keywords: ['产品', '产品介绍', 'product', '产品视频'],
        label: '产品',
        svg: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>`
      },
      {
        keywords: ['招商', '加盟', '投资', '招商片'],
        label: '招商',
        svg: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>`
      },
      {
        keywords: ['金融', 'finance', '银行', '基金', '理财'],
        label: '金融',
        svg: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>`
      },
      {
        keywords: ['品牌', '品牌片', 'brand', '品牌形象'],
        label: '品牌',
        svg: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 2a15 15 0 0 1 0 20M12 2a15 15 0 0 0 0 20M2 12h20"/></svg>`
      },
      {
        keywords: ['营销', 'marketing', '推广片'],
        label: '营销',
        svg: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 11l18-5v12L3 14v-3z"/><path d="M11.6 16.8a3 3 0 1 1-5.8-1.6"/></svg>`
      },

      // ============== 生活/文化类 ==============
      {
        keywords: ['生活', 'life', '日常'],
        label: '生活',
        svg: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>`
      },
      {
        keywords: ['健康', '养生', 'health', '医疗', '医药'],
        label: '健康',
        svg: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/><path d="M12 8v8M8 12h8"/></svg>`
      },
      {
        keywords: ['美食', '食品', 'food', '餐饮', '烹饪', '美食视频'],
        label: '美食',
        svg: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 8h1a4 4 0 0 1 0 8h-1"/><path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z"/><line x1="6" y1="1" x2="6" y2="4"/><line x1="10" y1="1" x2="10" y2="4"/><line x1="14" y1="1" x2="14" y2="4"/></svg>`
      },
      {
        keywords: ['旅行', '旅游', 'travel', '风景', '旅行视频', '旅拍'],
        label: '旅行',
        svg: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 12h20"/><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="4"/></svg>`
      },
      {
        keywords: ['时尚', 'fashion', '潮流', '穿搭'],
        label: '时尚',
        svg: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.4 14.5 16 10.5V4a2 2 0 0 0-4 0v6.5L7.6 14.5a2 2 0 0 0 2.8 2.8l1.6-1.3V20a2 2 0 0 0 4 0v-4l1.6 1.3a2 2 0 0 0 2.4.2 2 2 0 0 0 .4-3.2z"/></svg>`
      },
      {
        keywords: ['体育', '运动', 'sport', '健身'],
        label: '体育',
        svg: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15 15 0 0 1 0 20M12 2a15 15 0 0 0 0 20"/></svg>`
      },

      // ============== 技术/制作类 ==============
      {
        keywords: ['技术', '科技', '网络', '智能', 'tech', 'technology', 'code', '程序', '软件'],
        label: '技术',
        svg: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>`
      },
      {
        keywords: ['摄影', 'photography', '摄像', '摄影摄像'],
        label: '摄影',
        svg: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>`
      },
      {
        keywords: ['灯光', '照明', 'lighting', '灯光师'],
        label: '灯光',
        svg: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18h6M10 22h4M12 2a7 7 0 0 0-4 12.7V17h8v-2.3A7 7 0 0 0 12 2z"/></svg>`
      },
      {
        keywords: ['声音', '配音', '音频', 'sound', '配音演员'],
        label: '配音',
        svg: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"/></svg>`
      },
      {
        keywords: ['字幕', 'subtitle', 'caption', '翻译'],
        label: '字幕',
        svg: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="5" width="20" height="14" rx="2"/><line x1="7" y1="15" x2="7" y2="15"/><line x1="11" y1="15" x2="11" y2="15"/><line x1="15" y1="15" x2="15" y2="15"/><line x1="19" y1="15" x2="19" y2="15"/><line x1="7" y1="9" x2="17" y2="9"/></svg>`
      },
      {
        keywords: ['调色', 'color', 'color grading', '校色'],
        label: '调色',
        svg: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="13.5" cy="6.5" r=".5"/><circle cx="17.5" cy="10.5" r=".5"/><circle cx="8.5" cy="7.5" r=".5"/><circle cx="6.5" cy="12.5" r=".5"/><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z"/></svg>`
      },

      // ============== 社交/媒体类 ==============
      {
        keywords: ['社交', '媒体', 'social media', '朋友', '社区'],
        label: '社交',
        svg: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg>`
      },
      {
        keywords: ['自媒体', 'we media', '公众号', '新媒体'],
        label: '自媒体',
        svg: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5M2 12l10 5 10-5"/></svg>`
      },
      {
        keywords: ['音乐', 'music', '音频', 'audio', '配乐'],
        label: '音乐',
        svg: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>`
      },
      {
        keywords: ['游戏', 'game', 'gaming', '娱乐'],
        label: '游戏',
        svg: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 12h4m-2-2v4"/><circle cx="15" cy="11" r="1"/><circle cx="17.5" cy="13.5" r="1"/><path d="M18 22a6 6 0 0 1-12 0H3a1 1 0 0 1-1-1v-9a1 1 0 0 1 1-1h18a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1z"/></svg>`
      },

      // ============== 内容/教育类 ==============
      {
        keywords: ['教育', '学习', 'edu', '教程', '知识', '教学'],
        label: '教育',
        svg: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/></svg>`
      },
      {
        keywords: ['知识', '知识分享', 'knowledge'],
        label: '知识',
        svg: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>`
      },
      {
        keywords: ['儿童', '亲子', 'children', 'kids', '动画'],
        label: '儿童',
        svg: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="10" r="5"/><path d="M12 2a8 8 0 0 0-8 8c0 5 8 12 8 12s8-7 8-12a8 8 0 0 0-8-8z"/></svg>`
      },
      {
        keywords: ['综艺', '真人秀', 'variety', '综艺节目'],
        label: '综艺',
        svg: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M8 14s1.5 2 4 2 4-2 4-2"/><path d="M9 9h.01M15 9h.01"/></svg>`
      },

      // ============== 商业/政务/其他 ==============
      {
        keywords: ['政务', '政府', 'government', '公益'],
        label: '政务',
        svg: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 21h18"/><path d="M3 10h18M5 6l7-3 7 3M4 10v11M20 10v11M8 14v3M12 14v3M16 14v3"/></svg>`
      },
      {
        keywords: ['电商', 'e-commerce', '淘宝', '京东', '购物', 'product video'],
        label: '电商',
        svg: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>`
      },
      {
        keywords: ['图片', 'photo', 'image', '照片', '图片素材'],
        label: '图片',
        svg: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>`
      },
      {
        keywords: ['创意', '创意视频', 'creative', 'idea'],
        label: '创意',
        svg: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18h6M10 22h4M12 2a7 7 0 0 0-4 12.7V17h8v-2.3A7 7 0 0 0 12 2z"/><line x1="9" y1="9" x2="15" y2="9"/></svg>`
      },
      {
        keywords: ['纪录片', '记录片', 'documentary'],
        label: '纪录片',
        svg: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="2" width="20" height="20" rx="2.18" ry="2.18"/><line x1="7" y1="2" x2="7" y2="22"/><line x1="17" y1="2" x2="17" y2="22"/><line x1="2" y1="12" x2="22" y2="12"/><line x1="2" y1="7" x2="7" y2="7"/><line x1="2" y1="17" x2="7" y2="17"/><line x1="17" y1="17" x2="22" y2="17"/><line x1="17" y1="7" x2="22" y2="7"/></svg>`
      },
      {
        keywords: ['广告', 'ad', '广告投放'],
        label: '广告',
        svg: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 11l18-5v12L3 14v-3z"/><path d="M11.6 16.8a3 3 0 1 1-5.8-1.6"/></svg>`
      },
      {
        keywords: ['发布会', '新品发布', 'launch', '产品发布'],
        label: '发布会',
        svg: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4.93 4.93l14.14 14.14M12 3l9 9-9 9-9-9 9-9z"/></svg>`
      },
      {
        keywords: ['年会', '晚会', 'annual meeting', '会议'],
        label: '年会',
        svg: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>`
      },
      {
        keywords: ['vlog', '生活记录', 'video blog'],
        label: 'Vlog',
        svg: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/><circle cx="6" cy="10" r="1.5" fill="none"/></svg>`
      },
      {
        keywords: ['科普', '科学', 'science', '科教'],
        label: '科普',
        svg: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 2v7.31"/><path d="M14 9.3V1.99"/><path d="M8.5 2h7"/><path d="M14 9.3a6.5 6.5 0 1 1-4 0"/><path d="M5.52 16h12.96"/></svg>`
      },
      {
        keywords: ['汽车', '汽车视频', 'car', 'auto', 'vehicle'],
        label: '汽车',
        svg: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 16H9m10 0h3v-3.15L19.6 6H4.4L3 12.85V16h3"/><circle cx="7" cy="16" r="2"/><circle cx="17" cy="16" r="2"/></svg>`
      },
      {
        keywords: ['房产', '房地产', '楼盘', 'house', 'real estate'],
        label: '房产',
        svg: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>`
      },
      {
        keywords: ['服装', 'fashion', '服饰', 'clothing'],
        label: '服装',
        svg: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.38 3.46 16 2a4 4 0 0 1-8 0L3.62 3.46a2 2 0 0 0-1.34 2.23l1.92 13.46a2 2 0 0 0 2 1.74h11.56a2 2 0 0 0 2-1.74l1.92-13.46a2 2 0 0 0-1.34-2.23z"/></svg>`
      },
      {
        keywords: ['宠物', 'animal', 'pet', '萌宠'],
        label: '宠物',
        svg: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="4" r="2"/><circle cx="18" cy="8" r="2"/><circle cx="20" cy="16" r="2"/><circle cx="8" cy="20" r="2"/><path d="M18 10c-1.5 0-2.5.5-3.5 1.5S13 13 13 13s-2.5 0-3.5-1-2.5-1.5-2.5-1.5 0 2.5 1 3.5S10 18 10 18"/></svg>`
      },

      // ============== 课程/教育类 ==============
      {
        keywords: ['课程实录', '课程', '微课', '课堂', '在线课程', '网课', '教学视频'],
        label: '课程实录',
        svg: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>`
      },
      {
        keywords: ['教育', '培训', '教学', '老师', '学校', 'education'],
        label: '教育',
        svg: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/></svg>`
      },

      // ============== 宣传片/广告类扩展 ==============
      {
        keywords: ['宣传片3d', '三维', '3d宣传片', '3d展示', '3d产品'],
        label: '3D宣传片',
        svg: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg>`
      },
      {
        keywords: ['活动视频', '庆典', '年会', '晚会', '活动拍摄'],
        label: '活动视频',
        svg: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>`
      },

      // ============== MV/音乐类 ==============
      {
        keywords: ['mv', '音乐电视', '音乐视频', 'music video', 'mtv'],
        label: 'MV',
        svg: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18V6l10-2v12"/><circle cx="7" cy="18" r="2"/><circle cx="17" cy="16" r="2"/></svg>`
      },

      // ============== 短视频/内容电商类 ==============
      {
        keywords: ['带货', '直播带货', '主播', '电商直播', '卖货'],
        label: '带货直播',
        svg: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="4"/><path d="M5 22v-4a7 7 0 0 1 14 0v4"/><circle cx="18" cy="5" r="2"/><path d="M20 7l2 2"/></svg>`
      },
      {
        keywords: ['种草', '推荐', '好物', '好物推荐', 'product recommendation'],
        label: '种草视频',
        svg: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2l3 7h7l-5.5 4.5L19 21l-7-4.5L5 21l2.5-7.5L2 9h7z"/></svg>`
      },
      {
        keywords: ['探店', '店铺测评', '美食探店', '评测', '测评'],
        label: '探店测评',
        svg: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l1-5h16l1 5"/><path d="M3 9v11h18V9"/><circle cx="9" cy="14" r="1.5"/><circle cx="15" cy="14" r="1.5"/><path d="M9 18h6"/></svg>`
      },
      {
        keywords: ['开箱', 'unboxing', '拆箱', '开箱测评'],
        label: '开箱视频',
        svg: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 8l9-5 9 5v11H3z"/><path d="M3 8l9 5 9-5"/><path d="M12 13v10"/></svg>`
      },

      // ============== 生活/时尚类扩展 ==============
      {
        keywords: ['健身', '健身教程', 'fitness', '运动', '塑形', 'gym'],
        label: '健身教程',
        svg: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 4v16"/><path d="M18 4v16"/><path d="M3 9v6"/><path d="M21 9v6"/><path d="M6 12h12"/></svg>`
      },
      {
        keywords: ['美妆', '美妆教程', 'makeup', '化妆', '美容', 'beauty'],
        label: '美妆教程',
        svg: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><circle cx="9" cy="10" r="1"/><circle cx="15" cy="10" r="1"/><path d="M9 15c1 1 2 1.5 3 1.5s2-.5 3-1.5"/></svg>`
      },
      {
        keywords: ['穿搭', '搭配', '服装搭配', 'outfit', '穿搭分享'],
        label: '穿搭分享',
        svg: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2l4 4-2 2v14h-4V8L8 6z"/><circle cx="12" cy="4" r="1"/></svg>`
      },

      // ============== 儿童/动画类 ==============
      {
        keywords: ['儿童', '儿童动画', '幼教', '少儿', 'kids animation', '儿童节目'],
        label: '儿童动画',
        svg: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="10" r="6"/><circle cx="10" cy="9" r="1"/><circle cx="14" cy="9" r="1"/><path d="M9 13c1 1 2 1.5 3 1.5s2-.5 3-1.5"/><path d="M5 22v-2a7 7 0 0 1 14 0v2"/></svg>`
      },

      // ============== 纪录片/专题片类 ==============
      {
        keywords: ['专题片', '专题', '专题视频', '专题报道'],
        label: '专题片',
        svg: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="3" width="20" height="18" rx="2"/><line x1="7" y1="8" x2="17" y2="8"/><line x1="7" y1="12" x2="17" y2="12"/><line x1="7" y1="16" x2="13" y2="16"/></svg>`
      },

      // ============== 企业/商业类扩展 ==============
      {
        keywords: ['企业文化', '公司文化', 'company culture', '团队文化'],
        label: '企业文化',
        svg: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="8" r="4"/><circle cx="18" cy="10" r="3"/><path d="M10 22v-4c0-2-2-4-4-4H2v8h8z"/><path d="M18 22v-4c0-2-1.5-3-3-3"/></svg>`
      },
      {
        keywords: ['总裁', 'ceo', '董事长', '领导寄语'],
        label: '总裁寄语',
        svg: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="7" r="4"/><path d="M4 22v-2a8 8 0 0 1 16 0v2"/><path d="M9 3c-1 0-2 1-2 2"/><path d="M15 3c1 0 2 1 2 2"/></svg>`
      },
      {
        keywords: ['招聘', 'recruitment', '招聘视频', '招聘宣传片'],
        label: '招聘片',
        svg: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="7" width="18" height="14" rx="2"/><path d="M8 7V4a4 4 0 0 1 8 0v3"/><line x1="8" y1="12" x2="16" y2="12"/><line x1="8" y1="16" x2="13" y2="16"/></svg>`
      },

      // ============== 创意/科技类扩展 ==============
      {
        keywords: ['延时', 'timelapse', '延时摄影', '时间流逝'],
        label: '延时摄影',
        svg: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/><circle cx="12" cy="12" r="1"/></svg>`
      },
      {
        keywords: ['高速', '高速摄像', 'slow motion', '慢动作'],
        label: '高速摄像',
        svg: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M13 2L3 14h8l-1 8 10-12h-8l1-8z"/></svg>`
      },
      {
        keywords: ['微距', 'macro', '微距摄影', '微观'],
        label: '微距摄影',
        svg: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="7"/><path d="M20 20l-4-4"/><circle cx="11" cy="11" r="3"/></svg>`
      },
      {
        keywords: ['vr', '虚拟现实', '全景', '360全景', '全景视频'],
        label: 'VR全景',
        svg: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M2 12c2 0 4 2 4 4s2 2 4 2 4-2 4-2 2-2 4-2 4 2 4 2"/><path d="M2 12c2 0 4-2 4-4s2-2 4-2 4 2 4 2 2 2 4 2 4-2 4-2"/><circle cx="8" cy="12" r="2"/><circle cx="16" cy="12" r="2"/></svg>`
      },
      {
        keywords: ['全息', 'hologram', '全息投影', '3d投影'],
        label: '全息投影',
        svg: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2L2 20h20L12 2z"/><path d="M8 15c1 1 3 1 4 0s3 1 4 0"/><circle cx="12" cy="12" r="1"/></svg>`
      },

      // ============== 后期制作类 ==============
      {
        keywords: ['分镜', '分镜头', 'storyboard', '镜头脚本'],
        label: '分镜脚本',
        svg: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="4" width="8" height="6" rx="1"/><rect x="14" y="4" width="8" height="6" rx="1"/><rect x="2" y="14" width="8" height="6" rx="1"/><rect x="14" y="14" width="8" height="6" rx="1"/></svg>`
      },
      {
        keywords: ['绿幕', '抠像', 'chroma key', '抠图', '蓝幕'],
        label: '绿幕抠像',
        svg: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8" cy="10" r="3"/><path d="M14 7v10"/><path d="M17 7v10"/><path d="M14 7l3 10"/></svg>`
      },
      {
        keywords: ['降噪', 'denoise', '视频降噪', '去噪'],
        label: '降噪处理',
        svg: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M8 12c0-2 2-4 4-4s4 2 4 4-2 4-4 4"/><line x1="4" y1="4" x2="20" y2="20"/></svg>`
      },
      {
        keywords: ['防抖', '稳定', 'stabilization', '视频稳定'],
        label: '防抖稳定',
        svg: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 3c0 6 0 12 0 18"/><path d="M3 12c6 0 12 0 18 0"/></svg>`
      },
      {
        keywords: ['渲染', 'render', '视频渲染', '导出渲染'],
        label: '视频渲染',
        svg: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 12l6-4"/><path d="M12 12v8"/><path d="M12 12l-6 4"/><path d="M12 12l-6-4"/></svg>`
      },
      {
        keywords: ['包装', '视频包装', '片头', '片尾', 'video packaging'],
        label: '视频包装',
        svg: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="16" rx="2"/><line x1="3" y1="10" x2="21" y2="10"/><path d="M12 4v6"/><circle cx="12" cy="15" r="2"/></svg>`
      },
      {
        keywords: ['场记', '场记板', 'clapperboard', '电影场记'],
        label: '场记板',
        svg: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 3h12l2 4H4l2-4z"/><rect x="3" y="7" width="18" height="14" rx="1"/><line x1="8" y1="3" x2="12" y2="7"/><line x1="12" y1="3" x2="16" y2="7"/></svg>`
      }
    ];

    // === 智能匹配算法 ===
    let matchedSvg = null;
    let matchedLabel = null;

    // 1. 严格匹配分类名称中的关键词
    for (const matcher of iconMatchers) {
      if (matcher.keywords.some(k => nameLower.includes(k.toLowerCase()))) {
        matchedSvg = matcher.svg;
        matchedLabel = matcher.label;
        console.log(`[AI Icon] 名称匹配: ${matcher.label}`);
        break;
      }
    }

    // 2. 在 description 中匹配
    if (!matchedSvg && descLower) {
      for (const matcher of iconMatchers) {
        if (matcher.keywords.some(k => descLower.includes(k.toLowerCase()))) {
          matchedSvg = matcher.svg;
          matchedLabel = matcher.label;
          console.log(`[AI Icon] 描述匹配: ${matcher.label}`);
          break;
        }
      }
    }

    // 3. 反向模糊匹配：关键词中包含分类名称的 2 字以上部分
    if (!matchedSvg && searchText.length >= 2) {
      outer:
      for (const matcher of iconMatchers) {
        for (const k of matcher.keywords) {
          const kl = k.toLowerCase();
          if (kl.length >= 2) {
            for (let i = 0; i <= kl.length - 2; i++) {
              const sub = kl.substr(i, 2);
              if (searchText.includes(sub)) {
                matchedSvg = matcher.svg;
                matchedLabel = matcher.label;
                console.log(`[AI Icon] 模糊匹配: ${matcher.label} (sub="${sub}")`);
                break outer;
              }
            }
          }
        }
      }
    }

    // 4. 兜底：根据分类名称哈希选择带颜色的默认图标
    if (!matchedSvg) {
      console.log(`[AI Icon] 无匹配，使用默认彩色图标`);
      const colorSeed = categoryName.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
      matchedSvg = getDefaultIcon(colorSeed);
    }

    return res.json({
      success: true,
      data: { svg: matchedSvg }
    });

  } catch (error) {
    console.error('[AI Icon] 失败:', error.message);
    const colorSeed = (req.body && req.body.categoryName || 'default').split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    res.json({
      success: true,
      data: { svg: getDefaultIcon(colorSeed) }
    });
  }
});

// 动态渲染 index.html（服务端预渲染 meta 标签）
app.get('*', async (req, res) => {
  try {
    // 如果请求的是静态文件，让 express.static 处理（已经在前面定义了）
    if (req.path.startsWith('/images/') || req.path.startsWith('/uploads/') || 
        req.path.includes('.')) {
      return res.status(404).end();
    }

    // 前端构建后的 index.html
    const distIndexPath = path.join(__dirname, '../dist/index.html');
    let html = fs.readFileSync(distIndexPath, 'utf-8');
    
    // 获取首页内容用于默认 meta 标签
    let homeContent = null;
    try {
      homeContent = await db.homeContent.get();
    } catch (e) {
      console.warn('获取首页内容失败:', e);
    }
    
    // 检查是否有 id 参数
    const id = req.query.id;
    if (id) {
      try {
        // 获取作品集数据
        const items = await db.portfolioItems.getAll();
        const item = items.find(i => i.id.toString() === id.toString());
        
        if (item) {
          const title = item.title || (homeContent?.shareTitle || '大连柒子文化发展有限公司');
          const description = item.shortDesc || item.fullDesc || item.category || (homeContent?.shareDescription || '诚信立足 创新致远');
          const image = item.img || (homeContent?.heroImage || '/images/hero-home.png');
          const url = `${req.protocol}://${req.get('host')}${req.originalUrl}`;
          
          // 替换 meta 标签
          html = html
            .replace(/<meta property="og:title" content="[^"]*" \/>/, `<meta property="og:title" content="${escapeHtml(title)}" />`)
            .replace(/<meta property="og:description" content="[^"]*" \/>/, `<meta property="og:description" content="${escapeHtml(description)}" />`)
            .replace(/<meta property="og:image" content="[^"]*" \/>/, `<meta property="og:image" content="${getFullImageUrl(image, req)}" />`)
            .replace(/<meta property="og:url" content="[^"]*" \/>/, `<meta property="og:url" content="${escapeHtml(url)}" />`)
            .replace(/<meta name="description" content="[^"]*" \/>/, `<meta name="description" content="${escapeHtml(description)}" />`)
            .replace(/<meta name="wechat:title" content="[^"]*" \/>/, `<meta name="wechat:title" content="${escapeHtml(title)}" />`)
            .replace(/<meta name="wechat:description" content="[^"]*" \/>/, `<meta name="wechat:description" content="${escapeHtml(description)}" />`)
            .replace(/<meta name="wechat:image" content="[^"]*" \/>/, `<meta name="wechat:image" content="${getFullImageUrl(image, req)}" />`)
            .replace(/<meta name="twitter:title" content="[^"]*" \/>/, `<meta name="twitter:title" content="${escapeHtml(title)}" />`)
            .replace(/<meta name="twitter:description" content="[^"]*" \/>/, `<meta name="twitter:description" content="${escapeHtml(description)}" />`)
            .replace(/<meta name="twitter:image" content="[^"]*" \/>/, `<meta name="twitter:image" content="${getFullImageUrl(image, req)}" />`)
            .replace(/<title>[^<]*<\/title>/, `<title>${escapeHtml(title)}</title>`);
          
          console.log(`为作品 ID ${id} 渲染了自定义 meta 标签`);
        }
      } catch (itemErr) {
        console.warn('获取作品信息失败，使用默认 meta 标签:', itemErr);
      }
    } else {
      // 首页：使用数据库中的配置更新默认 meta 标签
      const title = homeContent?.shareTitle || '大连柒子文化发展有限公司';
      const description = homeContent?.shareDescription || '诚信立足 创新致远';
      const image = homeContent?.heroImage || '/images/hero-home.png';
      const url = `${req.protocol}://${req.get('host')}${req.originalUrl}`;
      
      // 替换 meta 标签
      html = html
        .replace(/<meta property="og:title" content="[^"]*" \/>/, `<meta property="og:title" content="${escapeHtml(title)}" />`)
        .replace(/<meta property="og:description" content="[^"]*" \/>/, `<meta property="og:description" content="${escapeHtml(description)}" />`)
        .replace(/<meta property="og:image" content="[^"]*" \/>/, `<meta property="og:image" content="${getFullImageUrl(image, req)}" />`)
        .replace(/<meta property="og:url" content="[^"]*" \/>/, `<meta property="og:url" content="${escapeHtml(url)}" />`)
        .replace(/<meta name="description" content="[^"]*" \/>/, `<meta name="description" content="${escapeHtml(description)}" />`)
        .replace(/<meta name="wechat:title" content="[^"]*" \/>/, `<meta name="wechat:title" content="${escapeHtml(title)}" />`)
        .replace(/<meta name="wechat:description" content="[^"]*" \/>/, `<meta name="wechat:description" content="${escapeHtml(description)}" />`)
        .replace(/<meta name="wechat:image" content="[^"]*" \/>/, `<meta name="wechat:image" content="${getFullImageUrl(image, req)}" />`)
        .replace(/<meta name="twitter:title" content="[^"]*" \/>/, `<meta name="twitter:title" content="${escapeHtml(title)}" />`)
        .replace(/<meta name="twitter:description" content="[^"]*" \/>/, `<meta name="twitter:description" content="${escapeHtml(description)}" />`)
        .replace(/<meta name="twitter:image" content="[^"]*" \/>/, `<meta name="twitter:image" content="${getFullImageUrl(image, req)}" />`)
        .replace(/<title>[^<]*<\/title>/, `<title>${escapeHtml(title)}</title>`);
      
      console.log('为首页渲染了自定义 meta 标签');
    }
    
    res.send(html);
  } catch (error) {
    console.error('渲染 index.html 失败:', error);
    // 出错时返回原始模板
    const distIndexPath = path.join(__dirname, '../dist/index.html');
    res.sendFile(distIndexPath);
  }
});

// 工具函数：转义 HTML 特殊字符
function escapeHtml(text) {
  if (!text) return '';
  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  };
  return text.toString().replace(/[&<>"]/g, m => map[m]);
}

// 工具函数：获取完整的图片 URL
function getFullImageUrl(imgPath, req) {
  if (!imgPath) return '';
  if (imgPath.startsWith('http://') || imgPath.startsWith('https://')) {
    return imgPath;
  }
  return `${req.protocol}://${req.get('host')}${imgPath.startsWith('/') ? '' : '/'}${imgPath}`;
}

const server = app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});

// 设置服务器超时（40分钟）
server.timeout = 2400000;
server.keepAliveTimeout = 65000;
