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

app.use(cors());
app.use(express.json());

app.use('/images', express.static(path.join(__dirname, '../public/images')));
app.use('/uploads', express.static(path.join(__dirname, '../public/uploads')));

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
    const randomStr = Math.random().toString(36).substr(2, 9);
    const fileName = `${timestamp}-${randomStr}.${extension}`;
    const filePath = path.join(uploadDir, 'images', fileName);

    let fileUrl = '';
    
    // 检查是否强制使用本地存储（用于 OSS 失败后用户确认的情况）
    const forceLocalStorage = req.query.forceLocal === 'true';
    
    if (isOSSConfigured && !forceLocalStorage) {
      // 使用 OSS 上传
      try {
        const ossFileName = `images/${fileName}`;
        const result = await ossClient.put(ossFileName, fileBuffer);
        fileUrl = result.url;
        console.log('使用 OSS 上传成功');
      } catch (ossError) {
        console.warn('OSS 上传失败:', ossError.message);
        // 返回 OSS 失败错误，让前端询问用户是否使用本地存储
        return res.status(500).json({ 
          error: 'OSS 上传失败', 
          ossError: true,
          message: '阿里云 OSS 上传失败，是否要上传到本地存储？'
        });
      }
    } else {
      // 使用本地存储
      fs.writeFileSync(filePath, fileBuffer);
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

    // 保存文件
    uploadProgressStore.set(uploadId, {
      stage: 'uploading',
      compressProgress: compressed ? 100 : 0,
      ossProgress: 0,
      message: '正在保存文件... 0%'
    });

    const timestamp = Date.now();
    const extension = req.file.originalname.split('.').pop();
    const randomStr = Math.random().toString(36).substr(2, 9);
    const fileName = `${timestamp}-${randomStr}.${extension}`;
    const filePath = path.join(uploadDir, 'videos', fileName);

    let fileUrl = '';
    
    // 检查是否强制使用本地存储（用于 OSS 失败后用户确认的情况）
    const forceLocalStorage = req.query.forceLocal === 'true';
    
    if (isOSSConfigured && !forceLocalStorage) {
      // 使用 OSS 上传
      try {
        const ossFileName = `videos/${fileName}`;
        const result = await ossClient.put(ossFileName, fileBuffer, {
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
        fileUrl = result.url;
        console.log('使用 OSS 上传视频成功');
      } catch (ossError) {
        console.warn('OSS 上传失败:', ossError.message);
        uploadProgressStore.delete(uploadId);
        // 返回 OSS 失败错误，让前端询问用户是否使用本地存储
        return res.status(500).json({ 
          error: 'OSS 上传失败', 
          ossError: true,
          message: '阿里云 OSS 上传失败，是否要上传到本地存储？'
        });
      }
    } else {
      // 使用本地存储
      fs.writeFileSync(filePath, fileBuffer);
      fileUrl = `/uploads/videos/${fileName}`;
      console.log('使用本地存储视频');
    }
    
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
      url: fileUrl,
      compressed: compressed,
      originalBitrate: originalBitrate,
      targetBitrate: compressed ? targetBitrate : null,
      originalSize: originalSize,
      compressedSize: compressedSize,
      processingTime: processingTime
    });
  } catch (error) {
    uploadProgressStore.delete(uploadId);
    console.error('上传失败:', error);
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

app.get('/api/categories', async (req, res) => {
  try {
    const categories = await db.categories.getAll();
    res.json(categories);
  } catch (error) {
    console.error('Get categories error:', error);
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

app.post('/api/categories', async (req, res) => {
  try {
    const categories = await db.categories.getAll();
    const maxId = Math.max(...categories.map(c => parseInt(c.id || '0')), 0);
    const maxSortOrder = Math.max(...categories.map(c => c.sortOrder || 0), 0);
    const category = { ...req.body, id: (maxId + 1).toString(), sortOrder: maxSortOrder + 1 };
    const newCategory = await db.categories.create(category);
    res.json(newCategory);
  } catch (error) {
    console.error('Create category error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/categories/:id', async (req, res) => {
  try {
    const updatedCategory = await db.categories.update(req.params.id, req.body);
    res.json(updatedCategory);
  } catch (error) {
    console.error('Update category error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/categories/:id', async (req, res) => {
  try {
    await db.categories.delete(req.params.id);
    res.status(204).end();
  } catch (error) {
    console.error('Delete category error:', error);
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
    const fw = { id: `fw${Date.now()}`, portfolioId: portfolioId, sortOrder: 0 };
    const result = await db.featuredWorks.create(fw);
    res.json(result);
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

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
