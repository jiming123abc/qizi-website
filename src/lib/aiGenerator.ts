// 预设封面图颜色方案
const coverColors = [
  { primary: '#667eea', secondary: '#764ba2' }, // 紫蓝渐变
  { primary: '#f093fb', secondary: '#f5576c' }, // 粉红渐变
  { primary: '#4facfe', secondary: '#00f2fe' }, // 青蓝渐变
  { primary: '#43e97b', secondary: '#38f9d7' }, // 青绿渐变
  { primary: '#fa709a', secondary: '#fee140' }, // 粉黄渐变
  { primary: '#a8edea', secondary: '#fed6e3' }, // 浅粉渐变
  { primary: '#d299c2', secondary: '#fef9d7' }, // 紫黄渐变
  { primary: '#89f7fe', secondary: '#66a6ff' }, // 蓝青渐变
];

// 预设分类封面图
const presetCovers: Record<string, string> = {
  '数字人': 'https://images.unsplash.com/photo-1617791160505-6f00504e3519?w=1200&h=800&fit=crop',
  '电影': 'https://images.unsplash.com/photo-1485846234645-a62644f84728?w=1200&h=800&fit=crop',
  '视频': 'https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?w=1200&h=800&fit=crop',
  '技术': 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=1200&h=800&fit=crop',
  'ai': 'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=1200&h=800&fit=crop',
  '艺术': 'https://images.unsplash.com/photo-1541367777708-7905fe3296c0?w=1200&h=800&fit=crop',
};

// 生成渐变封面图
function generateGradientCover(seed: number): string {
  const colorIndex = seed % coverColors.length;
  const colors = coverColors[colorIndex];
  
  // 创建一个简单的 SVG 渐变封面
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
  
  // 转换为 data URL
  return `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(svg)))}`;
}

export async function generateCoverImage(
  categoryName: string,
  description: string
): Promise<string> {
  // 1. 首先尝试匹配预设封面图
  for (const [key, url] of Object.entries(presetCovers)) {
    if (categoryName.toLowerCase().includes(key.toLowerCase())) {
      return url;
    }
  }
  
  // 2. 如果没有匹配，生成渐变封面
  const seed = categoryName.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return generateGradientCover(seed);
}

export async function generateIconSVG(
  categoryName: string,
  description: string
): Promise<string> {
  const icons: Record<string, string> = {
    '数字人': `
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M12 2a2 2 0 0 1 2 2c0 .74-.4 1.39-1 1.73V7h1a7 7 0 0 1 7 7h1a1 1 0 0 1 1 1v3a1 1 0 0 1-1 1h-1v1a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-1H2a1 1 0 0 1-1-1v-3a1 1 0 0 1 1-1h1a7 7 0 0 1 7-7h1V5.73c-.6-.34-1-.99-1-1.73a2 2 0 0 1 2-2z"></path>
        <circle cx="7" cy="13" r="1"></circle>
        <circle cx="17" cy="13" r="1"></circle>
      </svg>
    `,
    '电影': `
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <rect x="2" y="2" width="20" height="20" rx="2.18" ry="2.18"></rect>
        <line x1="7" y1="2" x2="7" y2="22"></line>
        <line x1="17" y1="2" x2="17" y2="22"></line>
        <line x1="2" y1="12" x2="22" y2="12"></line>
        <line x1="2" y1="7" x2="7" y2="7"></line>
        <line x1="2" y1="17" x2="7" y2="17"></line>
        <line x1="17" y1="17" x2="22" y2="17"></line>
        <line x1="17" y1="7" x2="22" y2="7"></line>
      </svg>
    `,
    '视频': `
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <rect x="5" y="2" width="14" height="20" rx="2" ry="2"></rect>
        <path d="M12 18h.01"></path>
        <line x1="7" y1="6" x2="17" y2="6"></line>
      </svg>
    `,
    '技术': `
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="12" cy="12" r="10"></circle>
        <circle cx="12" cy="12" r="6"></circle>
        <circle cx="12" cy="12" r="2"></circle>
      </svg>
    `
  };
  
  // 尝试根据分类名匹配预设图标
  for (const [key, icon] of Object.entries(icons)) {
    if (categoryName.includes(key)) {
      return icon;
    }
  }
  
  // 默认图标
  return `
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"></path>
    </svg>
  `;
}
