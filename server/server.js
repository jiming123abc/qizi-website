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
app.use(express.json());

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
    region: 'oss-cn-beijing',
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
async function compressVideo(inputBuffer, maxBitrateKbps = 2000, onProgress) {
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
            if (bitrate && bitrate > 2500) {
              console.log(`服务端压缩开始: 码率 ${bitrate}kbps, 文件大小 ${originalSizeKB}KB`);
              task.message = '正在压缩视频...';
              task.compressProgress = 0;
              videoTasks.set(taskId, task);

              const compressedBuffer = await compressVideo(fileBuffer, 2500);
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

    res.json({ success: true, message: '数据导入成功' });
  } catch (error) {
    console.error('数据导入失败:', error);
    res.status(500).json({ success: false, message: '数据导入失败' });
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
    
    // 检查是否有 id 参数
    const id = req.query.id;
    if (id) {
      try {
        // 获取作品集数据
        const items = await db.portfolioItems.getAll();
        const item = items.find(i => i.id.toString() === id.toString());
        
        if (item) {
          // 获取首页默认内容作为 fallback
          let homeContent = null;
          try {
            homeContent = await db.homeContent.get();
          } catch (e) {
            console.warn('获取首页内容失败:', e);
          }
          
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
