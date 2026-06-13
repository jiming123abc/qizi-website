import { matchIconByKeywords, iconPresets } from './iconPresets';

// 封面图请求超时（AI 生图可能需要几十秒）
const COVER_TIMEOUT_MS = 60000;
// 图标请求超时
const ICON_TIMEOUT_MS = 10000;

async function fetchWithTimeout(
  url: string,
  options: RequestInit,
  timeoutMs: number
): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal
    });
    clearTimeout(timeoutId);
    return response;
  } catch (err) {
    clearTimeout(timeoutId);
    throw err;
  }
}

/**
 * 生成封面图
 * 策略：优先调用后端 API（GeekAI gpt-image-2 -> z-image-turbo -> Pollinations.ai -> LoremFlickr -> 渐变SVG）
 * @param onProgress - 可选的进度回调，用于 UI 展示当前状态
 * @param imageType - 图片用途类型:
 *   - 'cover' 分类卡片封面 (1024x576, 16:9)
 *   - 'hero' 首页 Hero 轮播图 (1280x720, 16:9)
 *   - 'share' 分享缩略图 (1024x1024, 1:1)
 */
export async function generateCoverImage(
  categoryName: string,
  description: string,
  onProgress?: (message: string, usedModel?: string) => void,
  imageType: 'cover' | 'hero' | 'share' = 'cover'
): Promise<string> {
  try {
    console.log(`[aiGenerator] 请求封面图: ${categoryName}, 类型: ${imageType}`);
    if (onProgress) onProgress('正在请求服务器生成图片...');

    const response = await fetchWithTimeout('/api/ai/generate-cover', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ categoryName, description, imageType })
    }, COVER_TIMEOUT_MS);

    const data = await response.json();
    if (data.success && data.data && data.data.url) {
      console.log(`[aiGenerator] 封面图成功: ${data.data.url}, 使用模型: ${data.usedModel}`);
      if (data.progress && data.progress.length > 0) {
        const lastStep = data.progress[data.progress.length - 1];
        if (onProgress) onProgress(lastStep.message, data.usedModel);
      }
      return data.data.url;
    }
    throw new Error(`API 响应异常: ${JSON.stringify(data)}`);
  } catch (error) {
    console.warn('[aiGenerator] 封面图 API 失败，使用本地渐变:', error);
    if (onProgress) onProgress('请求超时或失败，使用本地渐变图');
    return generateLocalFallback(categoryName);
  }
}

/**
 * 生成首页 Hero 轮播图（便捷函数，自动使用 hero 类型 1280x720）
 */
export async function generateHeroSlideImage(
  title: string,
  subtitle: string,
  onProgress?: (message: string, usedModel?: string) => void
): Promise<string> {
  return generateCoverImage(title, subtitle, onProgress, 'hero');
}

/**
 * 生成微信分享缩略图（便捷函数，自动使用 share 类型 1024x1024）
 */
export async function generateShareImage(
  title: string,
  description: string,
  onProgress?: (message: string, usedModel?: string) => void
): Promise<string> {
  return generateCoverImage(title, description, onProgress, 'share');
}

/**
 * 生成图标 SVG
 * 策略：优先调用后端 API（智能关键词匹配 80+ 种预设），失败时用本地匹配库兜底
 */
export async function generateIconSVG(
  categoryName: string,
  description: string
): Promise<string> {
  try {
    console.log(`[aiGenerator] 请求图标: ${categoryName}`);
    const response = await fetchWithTimeout('/api/ai/generate-icon', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ categoryName, description })
    }, 10000);

    const data = await response.json();
    if (data.success && data.data && data.data.svg) {
      return data.data.svg;
    }
    throw new Error(`API 响应异常: ${JSON.stringify(data)}`);
  } catch (error) {
    console.warn('[aiGenerator] 图标 API 失败，使用本地匹配:', error);
    return matchIconByKeywords(categoryName, description);
  }
}

/** 获取所有图标类别 */
export function getIconCategories(): string[] {
  const categories = new Set(iconPresets.map(p => p.category));
  return Array.from(categories);
}

/** 获取指定类别的所有图标 */
export function getIconsByCategory(category: string) {
  return iconPresets.filter(p => p.category === category);
}

/** 按名称精确获取图标 SVG */
export function getIconByName(name: string): string | null {
  const match = iconPresets.find(p => p.name === name);
  return match?.svg || null;
}

/** 获取所有预设图标基本信息（用于调试/列表展示） */
export function getAllIconPresets() {
  return iconPresets.map(p => ({ name: p.name, category: p.category, keywords: p.keywords }));
}

/** 本地兜底：生成渐变色 SVG 封面 */
function generateLocalFallback(categoryName: string): string {
  const coverColors = [
    { primary: '#667eea', secondary: '#764ba2' },
    { primary: '#f093fb', secondary: '#f5576c' },
    { primary: '#4facfe', secondary: '#00f2fe' },
    { primary: '#43e97b', secondary: '#38f9d7' },
    { primary: '#fa709a', secondary: '#fee140' },
  ];

  const seed = categoryName.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const colors = coverColors[seed % coverColors.length];

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="800" viewBox="0 0 1200 800">
    <defs>
      <linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" style="stop-color:${colors.primary};stop-opacity:1"/>
        <stop offset="100%" style="stop-color:${colors.secondary};stop-opacity:1"/>
      </linearGradient>
    </defs>
    <rect width="1200" height="800" fill="url(#g)"/>
    <circle cx="200" cy="200" r="100" fill="rgba(255,255,255,0.1)"/>
    <circle cx="1000" cy="600" r="150" fill="rgba(255,255,255,0.08)"/>
    <circle cx="600" cy="400" r="80" fill="rgba(255,255,255,0.12)"/>
  </svg>`;

  return `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(svg)))}`;
}

/** 默认图标（星星） */
export function getDefaultIcon(): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>`;
}
