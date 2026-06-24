const FILE_SIZE_LIMITS = {
  image: 20 * 1024 * 1024,
  video: 1024 * 1024 * 1024
};

const TARGET_BITRATE_KBPS = 3000;
const CLOUDFLARE_MAX_MB = 95;

function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

const ALLOWED_MIME_TYPES = {
  image: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'],
  video: ['video/mp4', 'video/webm', 'video/ogg', 'video/quicktime']
};

export interface OSSConfig {
  accessKeyId: string;
  accessKeySecret: string;
  bucket: string;
  region: string;
  endpoint: string;
}

function validateFileSize(file: File, type: 'image' | 'video'): { valid: boolean; maxSizeMB: number } {
  const maxSize = FILE_SIZE_LIMITS[type];
  return {
    valid: file.size <= maxSize,
    maxSizeMB: maxSize / (1024 * 1024)
  };
}

function validateFileType(file: File, type: 'image' | 'video'): boolean {
  return ALLOWED_MIME_TYPES[type].includes(file.type);
}

export function generateOSSConfig(): OSSConfig {
  return {
    accessKeyId: import.meta.env.VITE_OSS_ACCESS_KEY_ID || import.meta.env.REACT_APP_OSS_ACCESS_KEY_ID || '',
    accessKeySecret: import.meta.env.VITE_OSS_ACCESS_KEY_SECRET || import.meta.env.REACT_APP_OSS_ACCESS_KEY_SECRET || '',
    bucket: import.meta.env.VITE_OSS_BUCKET || import.meta.env.REACT_APP_OSS_BUCKET || '',
    region: import.meta.env.VITE_OSS_REGION || import.meta.env.REACT_APP_OSS_REGION || 'oss-cn-beijing',
    endpoint: import.meta.env.VITE_OSS_ENDPOINT || import.meta.env.REACT_APP_OSS_ENDPOINT || ''
  };
}

const API_BASE_URL = import.meta.env.VITE_API_URL || import.meta.env.REACT_APP_API_URL || '';

export interface UploadProgress {
  phase: 'idle' | 'checking' | 'compressing' | 'uploading' | 'done';
  progress: number;
  message: string;
}

export interface UploadResult {
  url: string;
  compressed: boolean;
  compressionFailed?: boolean;
  originalSizeKB?: number;
  compressedSizeKB?: number;
  originalBitrate?: number;
  targetBitrate?: number;
  duration?: number;
}

export interface UploadError extends Error {
  ossError?: boolean;
  message: string;
}

export type UploadDecision = {
  decision: 'direct_oss' | 'needs_confirmation';
  bitrateKbps: number | null;
  duration: number | null;
  fileSizeMB: string;
  serverCompressionAvailable: boolean;
};

// 图片上传（保持不变）
export async function uploadImage(
  file: File,
  onProgress?: (progress: UploadProgress) => void,
  forceLocal: boolean = false
): Promise<UploadResult> {
  if (!validateFileType(file, 'image')) {
    throw new Error('不支持的图片格式，请上传 JPG、PNG、WebP 或 GIF 格式');
  }
  
  const sizeValidation = validateFileSize(file, 'image');
  if (!sizeValidation.valid) {
    const fileSizeMB = (file.size / (1024 * 1024)).toFixed(2);
    throw new Error(`图片大小不能超过 ${sizeValidation.maxSizeMB}MB，当前文件大小: ${fileSizeMB}MB`);
  }

  const fileSizeKB = (file.size / 1024).toFixed(1);
  onProgress?.({ phase: 'uploading', progress: 0, message: `正在上传图片 (${fileSizeKB}KB)...` });

  return new Promise((resolve, reject) => {
    const formData = new FormData();
    formData.append('file', file);

    const url = new URL(`${API_BASE_URL}/api/upload/image`);
    if (forceLocal) {
      url.searchParams.set('forceLocal', 'true');
    }

    const xhr = new XMLHttpRequest();
    xhr.open('POST', url.toString());
    xhr.timeout = 300000;

    xhr.upload.addEventListener('progress', (event) => {
      if (event.loaded && event.total) {
        const percentage = Math.round((event.loaded / event.total) * 100);
        onProgress?.({ phase: 'uploading', progress: percentage, message: `图片上传中... ${percentage}%` });
      }
    });

    xhr.addEventListener('load', () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const result = JSON.parse(xhr.responseText);
          let message = '';
          if (result.compressed) {
            message = `图片压缩完成\n大小: ${result.originalSizeKB.toFixed(1)}KB -> ${result.compressedSizeKB.toFixed(1)}KB`;
          } else {
            message = `图片上传完成\n大小: ${result.originalSizeKB?.toFixed(1) || fileSizeKB}KB（无需压缩）`;
          }
          onProgress?.({ phase: 'uploading', progress: 100, message });
          resolve(result);
        } catch (error) {
          reject(new Error('解析响应失败'));
        }
      } else {
        try {
          const error = JSON.parse(xhr.responseText);
          const uploadError: UploadError = new Error(error.message || error.error || '上传失败');
          uploadError.ossError = error.ossError === true;
          reject(uploadError);
        } catch {
          reject(new Error('上传失败'));
        }
      }
    });

    xhr.addEventListener('error', () => {
      reject(new Error('网络错误'));
    });

    xhr.addEventListener('timeout', () => {
      reject(new Error('上传超时'));
    });

    xhr.send(formData);
  });
}

// 检测视频码率，返回上传决策
export async function checkVideoBitrate(file: File): Promise<UploadDecision> {
  const fileSizeMB = (file.size / 1024 / 1024).toFixed(2);
  const fileSizeMBNum = file.size / 1024 / 1024;
  const serverCompressionAvailable = fileSizeMBNum <= CLOUDFLARE_MAX_MB;
  
  const { estimateVideoBitrate } = await import('./videoCompressor');
  const result = await estimateVideoBitrate(file);
  
  if (result.bitrateKbps === null || result.bitrateKbps <= TARGET_BITRATE_KBPS) {
    return { decision: 'direct_oss', bitrateKbps: result.bitrateKbps, duration: result.duration, fileSizeMB, serverCompressionAvailable };
  }
  
  return { decision: 'needs_confirmation', bitrateKbps: result.bitrateKbps, duration: result.duration, fileSizeMB, serverCompressionAvailable };
}

// 客户端直传 OSS（低码率视频，不经过服务器）
export async function uploadVideoDirectToOSS(
  file: File,
  onProgress?: (progress: UploadProgress) => void
): Promise<UploadResult> {
  if (!validateFileType(file, 'video')) {
    throw new Error('不支持的视频格式，请上传 MP4、WebM、OGG 或 MOV 格式');
  }

  const sizeValidation = validateFileSize(file, 'video');
  if (!sizeValidation.valid) {
    const fileSizeMB = (file.size / (1024 * 1024)).toFixed(2);
    throw new Error(`视频大小不能超过 ${sizeValidation.maxSizeMB}MB，当前文件大小: ${fileSizeMB}MB`);
  }

  onProgress?.({ phase: 'uploading', progress: 0, message: '正在获取上传凭证...' });

  const presignResponse = await fetch(`${API_BASE_URL}/api/oss/presign`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      folder: 'videos',
      filename: file.name,
      contentType: file.type || 'video/mp4'
    })
  });

  if (!presignResponse.ok) {
    const err = await presignResponse.json();
    throw new Error(err.error || '获取上传凭证失败');
  }

  const { signedUrl, publicUrl } = await presignResponse.json();

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('PUT', signedUrl);
    xhr.setRequestHeader('Content-Type', file.type || 'video/mp4');
    xhr.timeout = 600000;

    xhr.upload.addEventListener('progress', (event) => {
      if (event.loaded && event.total) {
        const percentage = Math.round((event.loaded / event.total) * 100);
        onProgress?.({ phase: 'uploading', progress: percentage, message: `视频上传中... ${percentage}%` });
      }
    });

    xhr.addEventListener('load', () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        const fileSizeMB = (file.size / 1024 / 1024).toFixed(2);
        onProgress?.({ phase: 'done', progress: 100, message: `视频上传完成\n大小: ${fileSizeMB}MB` });
        resolve({ url: publicUrl, compressed: false });
      } else {
        reject(new Error(`OSS 上传失败: HTTP ${xhr.status}`));
      }
    });

    xhr.addEventListener('error', () => reject(new Error('网络错误')));
    xhr.addEventListener('timeout', () => reject(new Error('上传超时')));

    xhr.send(file);
  });
}

// 轮询函数
async function pollTaskStatus(
  taskId: string,
  onProgress?: (progress: UploadProgress) => void
): Promise<any> {
  let attempts = 0;
  const maxAttempts = 360; // 最多10分钟 (360 * 2秒)

  while (attempts < maxAttempts) {
    const res = await fetch(`${API_BASE_URL}/api/upload/video/status/${taskId}`);
    if (!res.ok) {
      throw new Error('获取任务状态失败');
    }
    const task = await res.json();

    if (task.status === 'completed') {
      return task.result;
    }
    if (task.status === 'failed') {
      const err: UploadError = new Error(task.error || '任务失败');
      err.ossError = task.ossError === true;
      throw err;
    }

    // 更新进度
    const phase: any = task.progress < 50 ? 'compressing' : (task.progress < 100 ? 'uploading' : 'done');
    const progress = task.progress;
    const message = task.message || '处理中...';
    onProgress?.({ phase, progress, message });

    attempts++;
    await new Promise(resolve => setTimeout(resolve, 2000)); // 2秒轮询一次
  }

  throw new Error('任务超时');
}

// 上传到服务器进行压缩（高码率视频，异步轮询模式）
export async function uploadVideoToServerWithCompression(
  file: File,
  onProgress?: (progress: UploadProgress) => void,
  forceLocal: boolean = false
): Promise<UploadResult> {
  if (!validateFileType(file, 'video')) {
    throw new Error('不支持的视频格式，请上传 MP4、WebM、OGG 或 MOV 格式');
  }

  const sizeValidation = validateFileSize(file, 'video');
  if (!sizeValidation.valid) {
    const fileSizeMB = (file.size / (1024 * 1024)).toFixed(2);
    throw new Error(`视频大小不能超过 ${sizeValidation.maxSizeMB}MB，当前文件大小: ${fileSizeMB}MB`);
  }

  const fileSizeMB = (file.size / 1024 / 1024).toFixed(2);
  onProgress?.({ phase: 'compressing', progress: 0, message: `正在上传视频至服务器进行压缩 (${fileSizeMB}MB)...` });

  // 第一步：上传文件获取 taskId
  const formData = new FormData();
  formData.append('file', file);

  const url = new URL(`${API_BASE_URL}/api/upload/video`);
  url.searchParams.set('compress', 'true');
  if (forceLocal) {
    url.searchParams.set('forceLocal', 'true');
  }

  const uploadRes = await fetch(url.toString(), {
    method: 'POST',
    body: formData
  });

  if (!uploadRes.ok) {
    const err = await uploadRes.json().catch(() => ({ error: '上传失败' }));
    const uploadError: UploadError = new Error(err.message || err.error || '上传失败');
    uploadError.ossError = err.ossError === true;
    throw uploadError;
  }

  const { taskId } = await uploadRes.json();

  // 第二步：轮询任务状态
  onProgress?.({ phase: 'compressing', progress: 5, message: '文件上传完成，等待处理...' });
  const result = await pollTaskStatus(taskId, onProgress);

  const compressionFailed = result.compressionFailed === true;
  const compressed = result.compressed === true;

  if (compressionFailed) {
    onProgress?.({ phase: 'done', progress: 100, message: '压缩未成功，已上传原始视频' });
  } else if (compressed) {
    const origMB = (result.originalSizeKB / 1024).toFixed(2);
    const compMB = (result.compressedSizeKB / 1024).toFixed(2);
    onProgress?.({ phase: 'done', progress: 100, message: `视频压缩上传完成\n大小: ${origMB}MB -> ${compMB}MB` });
  } else {
    onProgress?.({ phase: 'done', progress: 100, message: `视频上传完成\n大小: ${fileSizeMB}MB（无需压缩）` });
  }

  return {
    url: result.url,
    compressed,
    compressionFailed,
    originalSizeKB: result.originalSizeKB,
    compressedSizeKB: result.compressedSizeKB,
  };
}

// 浏览器压缩后再直传 OSS（高码率视频，绕过 Cloudflare 100MB 限制）
export async function uploadVideoWithBrowserCompression(
  file: File,
  onProgress?: (progress: UploadProgress) => void
): Promise<UploadResult> {
  if (!validateFileType(file, 'video')) {
    throw new Error('不支持的视频格式，请上传 MP4、WebM、OGG 或 MOV 格式');
  }

  const sizeValidation = validateFileSize(file, 'video');
  if (!sizeValidation.valid) {
    const fileSizeMB = (file.size / (1024 * 1024)).toFixed(2);
    throw new Error(`视频大小不能超过 ${sizeValidation.maxSizeMB}MB，当前文件大小: ${fileSizeMB}MB`);
  }

  const originalSizeKB = Math.round(file.size / 1024);
  onProgress?.({ phase: 'compressing', progress: 0, message: '正在加载浏览器压缩组件...' });

  const { compressVideoInBrowser } = await import('./videoCompressor');
  const compressResult = await compressVideoInBrowser(file, (stage, progress) => {
    if (stage === 'loading') {
      onProgress?.({ phase: 'compressing', progress: Math.min(progress * 0.3, 30), message: `正在加载压缩组件... ${Math.round(progress)}%` });
    } else {
      onProgress?.({ phase: 'compressing', progress: 30 + progress * 0.3, message: `正在浏览器中压缩视频... ${Math.round(progress)}%` });
    }
  });

  if (!compressResult.success) {
    throw new Error(compressResult.message);
  }

  const compressedFile = compressResult.file;
  const compressedSizeKB = Math.round(compressedFile.size / 1024);
  onProgress?.({ phase: 'uploading', progress: 60, message: `压缩完成，正在上传至 OSS (${(compressedSizeKB / 1024).toFixed(2)}MB)...` });

  const presignResponse = await fetch(`${API_BASE_URL}/api/oss/presign`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      folder: 'videos',
      filename: compressedFile.name,
      contentType: 'video/mp4'
    })
  });

  if (!presignResponse.ok) {
    throw new Error('获取上传凭证失败');
  }

  const { signedUrl, publicUrl } = await presignResponse.json();

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('PUT', signedUrl);
    xhr.setRequestHeader('Content-Type', 'video/mp4');
    xhr.timeout = 600000;

    xhr.upload.addEventListener('progress', (event) => {
      if (event.loaded && event.total) {
        const percentage = 60 + Math.round((event.loaded / event.total) * 40);
        onProgress?.({ phase: 'uploading', progress: percentage, message: `上传压缩后视频... ${Math.round((event.loaded / event.total) * 100)}%` });
      }
    });

    xhr.addEventListener('load', () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        onProgress?.({ phase: 'done', progress: 100, message: `浏览器压缩完成\n${(originalSizeKB / 1024).toFixed(2)}MB -> ${(compressedSizeKB / 1024).toFixed(2)}MB` });
        resolve({
          url: publicUrl,
          compressed: true,
          originalSizeKB,
          compressedSizeKB,
        });
      } else {
        reject(new Error(`上传失败: HTTP ${xhr.status}`));
      }
    });

    xhr.addEventListener('error', () => reject(new Error('网络错误')));
    xhr.addEventListener('timeout', () => reject(new Error('上传超时')));
    xhr.send(compressedFile);
  });
}

// 文件类型检测：判断某个 File 是图片、视频，还是不支持
export function detectFileType(file: File): { supported: boolean; type: 'image' | 'video' | 'unknown'; mime: string } {
  const mime = file.type;
  if (ALLOWED_MIME_TYPES.image.includes(mime) || mime.startsWith('image/')) {
    return { supported: true, type: 'image', mime };
  }
  if (ALLOWED_MIME_TYPES.video.includes(mime) || mime.startsWith('video/')) {
    return { supported: true, type: 'video', mime };
  }
  return { supported: false, type: 'unknown', mime };
}