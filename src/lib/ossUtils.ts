// 文件大小限制配置（与后端一致）
const FILE_SIZE_LIMITS = {
  image: 20 * 1024 * 1024, // 图片：20MB
  video: 1024 * 1024 * 1024 // 视频：1GB
};

const TARGET_BITRATE_KBPS = 2500;

function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

// 视频压缩结果类型
export type VideoCompressionError = {
  success: false;
  error: 'webassembly-not-supported' | 'ffmpeg-load-failed' | 'compression-failed' | 'bitrate-detection-failed';
  message: string;
  originalFile: File;
};

export type VideoUploadResult = {
  success: true;
  url: string;
  compressed: boolean;
  originalSizeKB: number;
  compressedSizeKB?: number;
  originalBitrate?: number;
  duration?: number;
} | {
  success: false;
  compressionError: VideoCompressionError;
};

// 文件类型白名单
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

// 验证文件大小
function validateFileSize(file: File, type: 'image' | 'video'): { valid: boolean; maxSizeMB: number } {
  const maxSize = FILE_SIZE_LIMITS[type];
  return {
    valid: file.size <= maxSize,
    maxSizeMB: maxSize / (1024 * 1024)
  };
}

// 验证文件类型
function validateFileType(file: File, type: 'image' | 'video'): boolean {
  return ALLOWED_MIME_TYPES[type].includes(file.type);
}

// 格式化文件大小显示
function formatFileSize(bytes: number): string {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
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

const API_BASE_URL = import.meta.env.VITE_API_URL || import.meta.env.REACT_APP_API_URL || 'http://localhost:5000';

export async function uploadFileToOSS(
  file: File,
  folder: string = 'portfolio',
  forceLocal: boolean = false
): Promise<string> {
  const isImage = folder === 'images';
  const endpoint = isImage ? '/api/upload/image' : '/api/upload/video';

  const formData = new FormData();
  formData.append('file', file);

  const url = new URL(`${API_BASE_URL}${endpoint}`);
  if (forceLocal) {
    url.searchParams.set('forceLocal', 'true');
  }

  try {
    const response = await fetch(url.toString(), {
      method: 'POST',
      body: formData
    });

    if (!response.ok) {
      const error = await response.json();
      const uploadError: UploadError = new Error(error.message || error.error || '上传失败');
      uploadError.ossError = error.ossError === true;
      throw uploadError;
    }

    const result = await response.json();
    return result.url;
  } catch (error) {
    console.error('上传失败:', error);
    if ((error as UploadError).ossError) {
      throw error;
    }
    throw new Error(`上传失败: ${(error as Error).message}`);
  }
}

export async function uploadImageToOSS(file: File, forceLocal: boolean = false): Promise<string> {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
  if (!allowedTypes.includes(file.type)) {
    throw new Error('不支持的图片格式，请上传 JPG、PNG、WebP 或 GIF 格式');
  }
  return uploadFileToOSS(file, 'images', forceLocal);
}

export async function uploadVideoToOSS(file: File, forceLocal: boolean = false): Promise<string> {
  const allowedTypes = ['video/mp4', 'video/webm', 'video/ogg'];
  if (!allowedTypes.includes(file.type)) {
    throw new Error('不支持的视频格式，请上传 MP4、WebM 或 OGG 格式');
  }
  return uploadFileToOSS(file, 'videos', forceLocal);
}

export interface UploadProgress {
  phase: 'idle' | 'checking' | 'compressing' | 'uploading';
  progress: number;
  message: string;
}

export interface UploadResult {
  url: string;
  compressed: boolean;
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

export async function uploadImage(
  file: File,
  onProgress?: (progress: UploadProgress) => void,
  forceLocal: boolean = false
): Promise<UploadResult> {
  // 验证文件类型
  if (!validateFileType(file, 'image')) {
    throw new Error('不支持的图片格式，请上传 JPG、PNG、WebP 或 GIF 格式');
  }
  
  // 验证文件大小
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

    // 设置超时时间（5分钟）
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

export async function uploadVideo(
  file: File,
  onProgress?: (progress: UploadProgress) => void,
  forceLocal: boolean = false
): Promise<VideoUploadResult> {
  // 验证文件类型
  if (!validateFileType(file, 'video')) {
    throw new Error('不支持的视频格式，请上传 MP4、WebM、OGG 或 MOV 格式');
  }
  
  // 验证文件大小
  const sizeValidation = validateFileSize(file, 'video');
  if (!sizeValidation.valid) {
    const fileSizeMB = (file.size / (1024 * 1024)).toFixed(2);
    throw new Error(`视频大小不能超过 ${sizeValidation.maxSizeMB}MB，当前文件大小: ${fileSizeMB}MB`);
  }

  const originalSizeKB = file.size / 1024;
  const fileSizeMB = (file.size / 1024 / 1024).toFixed(2);

  // 显示初始状态
  onProgress?.({ phase: 'checking', progress: 0, message: `正在检查视频 (${fileSizeMB}MB)...` });

  // 动态导入视频压缩模块
  const { compressVideoIfNeeded } = await import('./videoCompressor');

  // 尝试压缩视频
  const compressionResult = await compressVideoIfNeeded(file, (stage, progress) => {
    if (stage === 'loading') {
      onProgress?.({ 
        phase: 'compressing', 
        progress, 
        message: `正在加载视频处理组件... ${progress.toFixed(0)}%` 
      });
    } else if (stage === 'compressing') {
      onProgress?.({ 
        phase: 'compressing', 
        progress, 
        message: `正在压缩视频... ${progress.toFixed(0)}%` 
      });
    }
  });

  // 如果压缩失败，返回错误信息
  if (!compressionResult.success) {
    return {
      success: false,
      compressionError: compressionResult,
    };
  }

  // 准备上传的文件
  const fileToUpload = compressionResult.file;
  const isCompressed = compressionResult.compressedSizeKB !== compressionResult.originalSizeKB;
  const originalBitrate = compressionResult.originalBitrate;
  const duration = compressionResult.duration;

  // 开始上传
  onProgress?.({ phase: 'uploading', progress: 0, message: `正在上传视频...` });

  const uploadUrl = await new Promise<string>((resolve, reject) => {
    const formData = new FormData();
    formData.append('file', fileToUpload);

    const url = new URL(`${API_BASE_URL}/api/upload/video`);
    if (forceLocal) {
      url.searchParams.set('forceLocal', 'true');
    }

    const xhr = new XMLHttpRequest();
    xhr.open('POST', url.toString());

    // 设置超时时间（10分钟，足够上传）
    xhr.timeout = 600000;

    // 上传进度
    xhr.upload.addEventListener('progress', (event) => {
      if (event.loaded && event.total) {
        const percentage = Math.round((event.loaded / event.total) * 100);
        onProgress?.({ 
          phase: 'uploading', 
          progress: percentage, 
          message: `视频上传中... ${percentage}%`
        });
      }
    });

    xhr.addEventListener('load', () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const result = JSON.parse(xhr.responseText);
          resolve(result.url);
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

  // 上传完成的消息
  let message = '';
  if (isCompressed) {
    const originalSizeMB = (compressionResult.originalSizeKB / 1024).toFixed(2);
    const compressedSizeMB = (compressionResult.compressedSizeKB / 1024).toFixed(2);
    message = `视频上传完成\n大小: ${originalSizeMB}MB -> ${compressedSizeMB}MB\n码率: ${originalBitrate || '未知'}kbps -> ${TARGET_BITRATE_KBPS}kbps`;
  } else {
    const sizeMB = (compressionResult.originalSizeKB / 1024).toFixed(2);
    const bitrateInfo = originalBitrate ? `\n码率: ${originalBitrate}kbps` : '';
    const durationInfo = duration ? `\n时长: ${formatDuration(duration)}` : '';
    message = `视频上传完成\n大小: ${sizeMB}MB（无需压缩）${bitrateInfo}${durationInfo}`;
  }
  onProgress?.({ phase: 'uploading', progress: 100, message });

  return {
    success: true,
    url: uploadUrl,
    compressed: isCompressed,
    originalSizeKB: compressionResult.originalSizeKB,
    compressedSizeKB: compressionResult.compressedSizeKB,
    originalBitrate,
    duration,
  };
}