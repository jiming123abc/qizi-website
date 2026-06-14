import { matchIconByKeywords, iconPresets } from './iconPresets';
import { uploadImage, UploadResult } from './ossUtils';

// 封面图请求超时（AI 生图通常需要 25-40 秒）
const COVER_TIMEOUT_MS = 60000;
// 图标请求超时
const ICON_TIMEOUT_MS = 10000;

// 判断 URL 是否为本地/OSS 资源（不需要额外上传）
function isLocalOrOSS(url: string): boolean {
  if (!url) return true;
  if (url.startsWith('/')) return true; // 本地静态资源路径
  if (url.startsWith('data:image/')) return false; // data URI 视为外部（需要转存）
  if (url.includes('aliyuncs.com')) return true; // 阿里云 OSS
  if (url.includes('myqcloud.com')) return true; // 腾讯云 COS
  return false;
}

// 根据 MIME 类型推断文件扩展名
function getExtensionFromMime(mimeType: string): string {
  const map: { [key: string]: string } = {
    'image/jpeg': 'jpg',
    'image/jpg': 'jpg',
    'image/png': 'png',
    'image/webp': 'webp',
    'image/gif': 'gif',
    'image/svg+xml': 'svg'
  };
  return map[mimeType] || 'png';
}

/**
 * 将 AI 生成的外链图片（或 data URI）转换为 OSS 资源
 * - 如果已是本地/OSS 路径，原样返回
 * - 如果是外链/AI 生成：先尝试浏览器直接fetch下载 → 上传OSS
 * - 如果浏览器因CORS限制无法fetch → 发送URL到后端 /api/upload/from-url 代理
 * - 如果下载失败（如跨域），返回原 URL 作为兜底
 */
export async function ensureImageOnOSS(url: string): Promise<string> {
  if (!url) return url;
  if (isLocalOrOSS(url)) return url;

  console.log('[ensureImageOnOSS] 将AI生成图片上传到OSS:', url.substring(0, 80));

  try {
    // 情况1: data URI（本地兜底的渐变 SVG 等）
    if (url.startsWith('data:image/')) {
      const match = url.match(/^data:([^;]+);base64,(.+)$/);
      if (!match) return url;
      const mimeType = match[1];
      const base64Data = match[2];
      const binaryString = atob(base64Data);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      const blob = new Blob([bytes], { type: mimeType });
      const file = new File([blob], `ai-generated-${Date.now()}.${getExtensionFromMime(mimeType)}`, { type: mimeType });
      const result: UploadResult = await uploadImage(file);
      console.log('[ensureImageOnOSS] ✅ data URI 上传成功:', result.url.substring(0, 60));
      return result.url;
    }

    // 情况2: 所有远程 HTTP/HTTPS 外链（GeekAI / Pollinations / Picsum 等）
    // 直接走后端代理：由服务器下载到内存 buffer → 上传 OSS
    // 不经过浏览器中转（避免 CORS + 双份传输），不写入服务器本地文件
    const proxyResponse = await fetch('/api/upload/from-url', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url })
    });

    if (!proxyResponse.ok) {
      const errData = await proxyResponse.json().catch(() => ({}));
      throw new Error(errData.error || errData.message || `后端代理上传失败 (HTTP ${proxyResponse.status})`);
    }

    const proxyData = await proxyResponse.json();
    if (proxyData.url) {
      console.log('[ensureImageOnOSS] ✅ 后端代理上传成功:', proxyData.url.substring(0, 80));
      return proxyData.url;
    }
    throw new Error('后端代理返回无有效 URL');
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.warn('[ensureImageOnOSS] 上传失败，保留原URL:', msg);
    // 失败时保留原 URL（AI 外链仍可直接访问），但明确抛出信息供调用方决定
    throw new Error(`图片上传OSS失败：${msg}`);
  }
}

async function fetchWithTimeout(
  url: string,
  options: RequestInit,
  timeoutMs: number
): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => {
    try {
      controller.abort(new Error(`请求超时 (${timeoutMs}ms): ${url.substring(0, 60)}`));
    } catch (e) {
      controller.abort();
    }
  }, timeoutMs);
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
 * 多级降级策略：
 *   1. 后端 GeekAI API（付费，首选，返回远程URL）
 *   2. 浏览器直接访问 Picsum Photos（稳定真实图片）
 *   3. 本地 SVG 渐变（最终兜底）
 *
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
  const trimmedName = String(categoryName || '').trim();
  if (!trimmedName) {
    throw new Error('请输入分类名称或标题');
  }

  const sizeMap = {
    cover: { width: 1024, height: 576 },
    hero:  { width: 1280, height: 720 },
    share: { width: 1024, height: 1024 },
  };
  const { width, height } = sizeMap[imageType] || sizeMap.cover;
  const seed = Math.floor(Math.random() * 10000000);

  console.log(`[aiGenerator] 请求封面图: ${trimmedName}, 类型: ${imageType}`);

  // ========== 第1步：后端 GeekAI API ==========
  if (onProgress) onProgress('正在使用 AI 生成图片...', 'GeekAI');
  try {
    const response = await fetchWithTimeout('/api/ai/generate-cover', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ categoryName: trimmedName, description, imageType })
    }, COVER_TIMEOUT_MS);

    const data = await response.json();
    if (data.success && data.data && data.data.url) {
      console.log(`[aiGenerator] ✅ 后端API成功: ${data.data.url.substring(0, 60)}, 模型: ${data.usedModel}`);
      if (onProgress) onProgress('生成成功！（浏览器直接加载）', data.usedModel);
      return data.data.url;
    }
    console.log(`[aiGenerator] 后端API返回失败: ${data.message || '未知原因'}`);
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    if (msg.includes('超时')) {
      console.warn(`[aiGenerator] 后端API超时 (${COVER_TIMEOUT_MS}ms)，继续降级`);
    } else {
      console.warn('[aiGenerator] 后端API异常:', msg);
    }
  }

  // ========== 第2步：浏览器直接访问 Picsum Photos（稳定真实图片） ==========
  if (onProgress) onProgress('正在从 Picsum 获取图片...', 'Picsum');
  try {
    const picsumUrl = `https://picsum.photos/seed/${encodeURIComponent(trimmedName)}${seed}/${width}/${height}`;
    const response = await fetchWithTimeout(picsumUrl, {
      method: 'GET',
      headers: { 'User-Agent': 'Mozilla/5.0' }
    }, 20000);

    if (response.ok) {
      const blob = await response.blob();
      if (blob.size > 5000) {
        console.log(`[aiGenerator] ✅ Picsum 成功! 大小: ${blob.size} bytes`);
        if (onProgress) onProgress('获取成功！（高质量图片）', 'Picsum Photos');
        return picsumUrl;
      }
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.warn('[aiGenerator] Picsum 失败:', msg);
  }

  // ========== 最终兜底：本地 SVG 渐变 ==========
  console.warn('[aiGenerator] 所有远程服务失败，使用本地渐变图');
  if (onProgress) onProgress('远程服务不可用，使用本地渐变图', 'local-gradient');
  return generateLocalFallback(trimmedName);
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
