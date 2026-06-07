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
  
  for (const [key, icon] of Object.entries(icons)) {
    if (categoryName.includes(key)) {
      return icon;
    }
  }
  
  return `
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"></path>
    </svg>
  `;
}
