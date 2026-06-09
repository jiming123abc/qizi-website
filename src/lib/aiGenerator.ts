import { matchIconByKeywords, iconPresets } from './iconPresets';

/**
 * 根据分类名称和描述生成封面图
 * 优先使用后端 API 生成的封面图
 * 失败则生成渐变色 SVG 作为兜底
 */
export async function generateCoverImage(
  categoryName: string,
  description: string
): Promise<string> {
  try {
    const response = await fetch('/api/ai/generate-cover', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ categoryName, description })
    });

    const data = await response.json();
    if (data.success && data.data && data.data.url) {
      return data.data.url;
    }

    throw new Error('API 返回格式错误');
  } catch (error) {
    console.error('调用 AI 生成封面 API 失败，使用本地方案:', error);
    return generateLocalFallback(categoryName);
  }
}

/**
 * 根据分类名称和描述生成图标 SVG
 * 策略:
 * 1. 优先调用后端 API 获取匹配的图标
 * 2. 失败时使用本地 iconPresets 智能匹配（60+ 种预设线条风格 SVG）
 */
export async function generateIconSVG(
  categoryName: string,
  description: string
): Promise<string> {
  try {
    const response = await fetch('/api/ai/generate-icon', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ categoryName, description })
    });

    const data = await response.json();
    if (data.success && data.data && data.data.svg) {
      return data.data.svg;
    }

    throw new Error('API 返回格式错误');
  } catch (error) {
    console.error('调用 AI 图标生成 API 失败，使用本地智能匹配:', error);
    return matchIconByKeywords(categoryName, description);
  }
}

/**
 * 获取所有图标类别（用于管理后台）
 */
export function getIconCategories(): string[] {
  const categories = new Set(iconPresets.map(p => p.category));
  return Array.from(categories);
}

/**
 * 获取指定类别的所有图标
 */
export function getIconsByCategory(category: string) {
  return iconPresets.filter(p => p.category === category);
}

/**
 * 按名称精确获取图标 SVG
 */
export function getIconByName(name: string): string | null {
  const match = iconPresets.find(p => p.name === name);
  return match?.svg || null;
}

/**
 * 获取所有预设图标基本信息（用于调试/列表展示）
 */
export function getAllIconPresets() {
  return iconPresets.map(p => ({ name: p.name, category: p.category, keywords: p.keywords }));
}

/**
 * 本地方案 - 生成渐变色 SVG 封面（兜底方案）
 */
function generateLocalFallback(categoryName: string): string {
  const coverColors = [
    { primary: '#667eea', secondary: '#764ba2' },
    { primary: '#f093fb', secondary: '#f5576c' },
    { primary: '#4facfe', secondary: '#00f2fe' },
    { primary: '#43e97b', secondary: '#38f9d7' },
    { primary: '#fa709a', secondary: '#fee140' },
  ];
  
  const seed = categoryName.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
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

/**
 * 获取默认图标（星星）
 */
export function getDefaultIcon(): string {
  return `
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
    </svg>
  `;
}
