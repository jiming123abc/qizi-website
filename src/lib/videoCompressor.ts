import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile, toBlobURL } from '@ffmpeg/util';

export type CompressionResult = {
  success: true;
  file: File;
  originalSizeKB: number;
  compressedSizeKB: number;
  originalBitrate?: number;
  duration?: number;
} | {
  success: false;
  error: 'webassembly-not-supported' | 'ffmpeg-load-failed' | 'compression-failed' | 'bitrate-detection-failed';
  message: string;
  originalFile: File;
};

export type CompressionProgressCallback = (stage: 'loading' | 'compressing', progress: number) => void;

const MAX_BITRATE_KBPS = 2500;
const TARGET_BITRATE_KBPS = 2500;

let ffmpegInstance: FFmpeg | null = null;
let ffmpegLoaded = false;

// 检查 WebAssembly 支持
function checkWebAssemblySupport(): boolean {
  try {
    if (typeof WebAssembly === 'object' && typeof WebAssembly.instantiate === 'function') {
      const module = new WebAssembly.Module(Uint8Array.of(0x0, 0x61, 0x73, 0x6d, 0x01, 0x00, 0x00, 0x00));
      return new WebAssembly.Instance(module) !== undefined;
    }
  } catch (e) {
    //
  }
  return false;
}

// 加载 FFmpeg
async function loadFFmpeg(onProgress?: CompressionProgressCallback): Promise<boolean> {
  if (ffmpegLoaded && ffmpegInstance) {
    return true;
  }

  if (!checkWebAssemblySupport()) {
    return false;
  }

  let timeoutId: ReturnType<typeof setTimeout> | null = null;
  
  try {
    onProgress?.('loading', 0);
    ffmpegInstance = new FFmpeg();
    
    // 监听加载进度
    ffmpegInstance.on('log', ({ message }) => {
      console.log('FFmpeg:', message);
    });
    
    ffmpegInstance.on('progress', ({ progress }) => {
      onProgress?.('compressing', progress * 100);
    });

    // 模拟加载进度
    let progress = 0;
    const progressInterval = setInterval(() => {
      progress += Math.random() * 5;
      if (progress > 90) {
        clearInterval(progressInterval);
      } else {
        onProgress?.('loading', progress);
      }
    }, 500);

    // 设置加载超时（3分钟 - 考虑到30MB文件需要较长时间）
    let loadTimedOut = false;
    timeoutId = setTimeout(() => {
      loadTimedOut = true;
      clearInterval(progressInterval);
    }, 180000);

    // 优先从本地服务器加载，备用 CDN
    const sources = [
      '/ffmpeg',
      'https://cdn.jsdelivr.net/npm/@ffmpeg/core@0.12.6/dist/umd',
      'https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd',
    ];

    let loadSuccess = false;
    for (const baseURL of sources) {
      if (loadTimedOut) break;
      
      try {
        console.log(`尝试加载 FFmpeg: ${baseURL}`);
        onProgress?.('loading', 10);
        await Promise.race([
          ffmpegInstance.load({
            coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
            wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
          }),
          // 单个源的超时时间设置为90秒（考虑到30MB的wasm文件）
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Load timeout')), 90000)
          )
        ]);
        loadSuccess = true;
        break;
      } catch (sourceError) {
        console.warn(`从 ${baseURL} 加载失败:`, sourceError);
        continue;
      }
    }

    clearInterval(progressInterval);
    if (timeoutId) clearTimeout(timeoutId);

    if (loadTimedOut) {
      throw new Error('FFmpeg 加载超时');
    }

    if (!loadSuccess) {
      throw new Error('所有 CDN 源加载失败');
    }

    ffmpegLoaded = true;
    onProgress?.('loading', 100);
    return true;
  } catch (error) {
    if (timeoutId) clearTimeout(timeoutId);
    console.error('Failed to load FFmpeg:', error);
    ffmpegInstance = null;
    ffmpegLoaded = false;
    return false;
  }
}

// 通过视频元素估算码率（替代 FFprobe）
async function estimateVideoBitrate(file: File): Promise<{ bitrate: number | null; duration: number | null }> {
  return new Promise((resolve) => {
    const video = document.createElement('video');
    video.preload = 'metadata';
    
    const url = URL.createObjectURL(file);
    
    video.onloadedmetadata = () => {
      URL.revokeObjectURL(url);
      
      const duration = video.duration;
      if (duration && duration > 0) {
        const fileSizeBits = file.size * 8;
        const durationSeconds = duration;
        const bitrateKbps = Math.round(fileSizeBits / durationSeconds / 1000);
        resolve({ bitrate: bitrateKbps, duration: durationSeconds });
      } else {
        resolve({ bitrate: null, duration: null });
      }
    };
    
    video.onerror = () => {
      URL.revokeObjectURL(url);
      resolve({ bitrate: null, duration: null });
    };
    
    video.src = url;
  });
}

// 主压缩函数
export async function compressVideoIfNeeded(
  file: File,
  onProgress?: CompressionProgressCallback
): Promise<CompressionResult> {
  const originalSizeKB = file.size / 1024;

  // 检查 WebAssembly 支持
  if (!checkWebAssemblySupport()) {
    return {
      success: false,
      error: 'webassembly-not-supported',
      message: '您的浏览器不支持视频压缩功能',
      originalFile: file,
    };
  }

  // 估算视频码率和时长
  let bitrateKbps: number | null = null;
  let duration: number | null = null;
  try {
    const result = await estimateVideoBitrate(file);
    bitrateKbps = result.bitrate;
    duration = result.duration;
  } catch (e) {
    // 继续执行
  }

  // 如果无法检测码率，或者码率低于阈值，直接返回原文件
  if (bitrateKbps === null || bitrateKbps <= MAX_BITRATE_KBPS) {
    return {
      success: true,
      file,
      originalSizeKB,
      compressedSizeKB: originalSizeKB,
      originalBitrate: bitrateKbps || undefined,
      duration: duration || undefined,
    };
  }

  console.log(`视频码率 ${bitrateKbps}kbps 超过 ${MAX_BITRATE_KBPS}kbps，需要压缩`);

  // 加载 FFmpeg
  const loadSuccess = await loadFFmpeg(onProgress);
  if (!loadSuccess || !ffmpegInstance) {
    return {
      success: false,
      error: 'ffmpeg-load-failed',
      message: '视频处理组件加载失败',
      originalFile: file,
    };
  }

  // 开始压缩
  try {
    onProgress?.('compressing', 0);

    const inputFileName = 'input' + getFileExtension(file.name);
    const outputFileName = 'output.mp4';

    // 写入输入文件
    await ffmpegInstance.writeFile(inputFileName, await fetchFile(file));

    // 执行压缩命令
    await ffmpegInstance.exec([
      '-i', inputFileName,
      '-c:v', 'libx264',
      '-preset', 'ultrafast',
      '-b:v', `${TARGET_BITRATE_KBPS}k`,
      '-maxrate', `${TARGET_BITRATE_KBPS}k`,
      '-bufsize', `${TARGET_BITRATE_KBPS * 2}k`,
      '-crf', '28',
      '-movflags', '+faststart',
      '-y',
      outputFileName,
    ]);

    // 读取输出文件
    const data = await ffmpegInstance.readFile(outputFileName);
    const compressedBlob = new Blob([data], { type: 'video/mp4' });
    const compressedFile = new File([compressedBlob], file.name.replace(/\.[^.]+$/, '.mp4'), { type: 'video/mp4' });

    // 清理
    try {
      await ffmpegInstance.deleteFile(inputFileName);
      await ffmpegInstance.deleteFile(outputFileName);
    } catch (e) {
      // 忽略清理错误
    }

    const compressedSizeKB = compressedFile.size / 1024;

    onProgress?.('compressing', 100);

    console.log(`视频压缩完成: ${originalSizeKB.toFixed(2)}KB -> ${compressedSizeKB.toFixed(2)}KB`);

    return {
      success: true,
      file: compressedFile,
      originalSizeKB,
      compressedSizeKB,
      originalBitrate: bitrateKbps,
      duration,
    };
  } catch (error) {
    console.error('视频压缩失败:', error);
    return {
      success: false,
      error: 'compression-failed',
      message: '视频压缩过程中出错',
      originalFile: file,
    };
  }
}

function getFileExtension(filename: string): string {
  const ext = filename.split('.').pop()?.toLowerCase() || 'mp4';
  return '.' + ext;
}

export function resetFFmpeg() {
  ffmpegInstance = null;
  ffmpegLoaded = false;
}
