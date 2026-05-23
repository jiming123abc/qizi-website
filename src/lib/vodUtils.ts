export interface VodConfig {
  accessKeyId: string;
  accessKeySecret: string;
  region: string;
}

export interface VodUploadResult {
  videoId: string;
  playUrl: string;
  coverUrl: string;
}

export function generateVodConfig(): VodConfig {
  return {
    accessKeyId: import.meta.env.VITE_VOD_ACCESS_KEY_ID || import.meta.env.REACT_APP_VOD_ACCESS_KEY_ID || '',
    accessKeySecret: import.meta.env.VITE_VOD_ACCESS_KEY_SECRET || import.meta.env.REACT_APP_VOD_ACCESS_KEY_SECRET || '',
    region: import.meta.env.VITE_VOD_REGION || import.meta.env.REACT_APP_VOD_REGION || 'cn-beijing'
  };
}

const MOCK_VOD_ENDPOINT = 'https://vod.cn-beijing.aliyuncs.com';

export async function uploadVideoToVod(file: File): Promise<VodUploadResult> {
  const allowedTypes = ['video/mp4', 'video/webm', 'video/ogg'];
  if (!allowedTypes.includes(file.type)) {
    throw new Error('不支持的视频格式，请上传 MP4、WebM 或 OGG 格式');
  }

  return new Promise((resolve) => {
    setTimeout(() => {
      const timestamp = Date.now();
      const videoId = `v${timestamp}`;
      const playUrl = `${MOCK_VOD_ENDPOINT}/play/${videoId}/playlist.m3u8`;
      const coverUrl = `${MOCK_VOD_ENDPOINT}/cover/${videoId}.jpg`;
      resolve({ videoId, playUrl, coverUrl });
    }, 2000);
  });
}

export async function getVideoInfo(videoId: string): Promise<VodUploadResult> {
  return new Promise((resolve) => {
    setTimeout(() => {
      const playUrl = `${MOCK_VOD_ENDPOINT}/play/${videoId}/playlist.m3u8`;
      const coverUrl = `${MOCK_VOD_ENDPOINT}/cover/${videoId}.jpg`;
      resolve({ videoId, playUrl, coverUrl });
    }, 500);
  });
}

export async function getVodPlayUrl(videoId: string): Promise<string> {
  const info = await getVideoInfo(videoId);
  return info.playUrl;
}

export function validateVodUrl(url: string): boolean {
  const patterns = [
    /^https?:\/\/.*\.m3u8$/,
    /^https?:\/\/.*\/playlist\.m3u8/,
    /^https?:\/\/.*vod.*\.com\//
  ];
  return patterns.some(pattern => pattern.test(url));
}