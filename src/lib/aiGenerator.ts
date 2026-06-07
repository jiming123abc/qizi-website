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
    console.error('调用 AI 生成 API 失败:', error);
    // 前端降级方案：生成本地渐变
    return generateLocalFallback(categoryName);
  }
}

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
    console.error('调用 AI 图标生成 API 失败:', error);
    // 前端降级方案：返回默认图标
    return getDefaultIcon();
  }
}

// 前端降级方案 - 生成渐变封面
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

// 获取默认图标
function getDefaultIcon(): string {
  return `
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"></path>
    </svg>
  `;
}
