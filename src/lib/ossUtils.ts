// 文件大小限制配置（与后端一致）
const FILE_SIZE_LIMITS = {
  image: 20 * 1024 * 1024, // 图片：20MB
  video: 1024 * 1024 * 1024 // 视频：1GB
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
    accessKeyId: process.env.REACT_APP_OSS_ACCESS_KEY_ID || '',
    accessKeySecret: process.env.REACT_APP_OSS_ACCESS_KEY_SECRET || '',
    bucket: process.env.REACT_APP_OSS_BUCKET || '',
    region: process.env.REACT_APP_OSS_REGION || 'oss-cn-beijing',
    endpoint: process.env.REACT_APP_OSS_ENDPOINT || ''
  };
}

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

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
): Promise<{ url: string; coverUrl: string }> {
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

  const isMP4 = file.type === 'video/mp4';
  const fileSizeMB = (file.size / 1024 / 1024).toFixed(2);

  // 显示初始状态
  if (isMP4) {
    onProgress?.({ phase: 'checking', progress: 0, message: `正在处理视频 (${fileSizeMB}MB)...` });
  } else {
    onProgress?.({ phase: 'uploading', progress: 0, message: `正在上传视频 (${fileSizeMB}MB)...` });
  }

  return new Promise((resolve, reject) => {
    const formData = new FormData();
    formData.append('file', file);

    const url = new URL(`${API_BASE_URL}/api/upload/video`);
    if (forceLocal) {
      url.searchParams.set('forceLocal', 'true');
    }

    const xhr = new XMLHttpRequest();
    xhr.open('POST', url.toString());

    // 设置超时时间（30分钟）
    xhr.timeout = 1800000;

    // 文件大小超过50MB时显示警告
    if (file.size > 50 * 1024 * 1024) {
      console.warn('上传文件较大，可能需要较长时间');
    }

    // 上传进度
    xhr.upload.addEventListener('progress', (event) => {
      if (event.loaded && event.total) {
        const percentage = Math.round((event.loaded / event.total) * 100);
        const phase: UploadProgress['phase'] = isMP4 ? 'compressing' : 'uploading';
        onProgress?.({ 
          phase, 
          progress: percentage, 
          message: isMP4 ? `视频处理中... ${percentage}%` : `视频上传中... ${percentage}%`
        });
      }
    });

    xhr.addEventListener('load', () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const result = JSON.parse(xhr.responseText);
          
          let message = '';
          const originalSizeMB = (result.originalSize / 1024 / 1024).toFixed(2);
          const compressedSizeMB = (result.compressedSize / 1024 / 1024).toFixed(2);
          
          if (result.compressed) {
            message = `视频压缩完成\n比特率: ${result.originalBitrate}kbps -> ${result.targetBitrate}kbps\n大小: ${originalSizeMB}MB -> ${compressedSizeMB}MB\n用时: ${result.processingTime}秒`;
          } else if (isMP4 && result.originalBitrate !== null) {
            message = `视频上传完成\n比特率: ${result.originalBitrate}kbps（无需压缩）\n大小: ${originalSizeMB}MB\n用时: ${result.processingTime}秒`;
          } else if (isMP4 && result.originalBitrate === null) {
            message = `视频上传完成\n无法检测比特率（未压缩）\n大小: ${originalSizeMB}MB\n用时: ${result.processingTime}秒`;
          } else {
            message = `视频上传完成\n非MP4格式（无需压缩）\n大小: ${originalSizeMB}MB\n用时: ${result.processingTime}秒`;
          }
          
          onProgress?.({ phase: 'uploading', progress: 100, message });
          resolve({ url: result.url, coverUrl: '' });
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