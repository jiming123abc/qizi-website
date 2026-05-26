// 简单的 QR 码生成库（简化版）
export function generateQRCode(text: string, size: number = 200): string {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  // 背景
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, size, size);

  // 我们使用一个简单的可视化表示（真实的 QR 码生成需要复杂算法）
  // 这里我们生成一个简化的二维码样式图案，实际使用中可以引入 qrcode.js
  ctx.fillStyle = '#000000';
  
  // 绘制定位图案（三个角落的大方块）
  drawPositionPattern(ctx, 0, 0, size);
  drawPositionPattern(ctx, size - 7 * 8, 0, size);
  drawPositionPattern(ctx, 0, size - 7 * 8, size);
  
  // 绘制随机数据点来模拟二维码
  const cellSize = size / 25;
  for (let i = 0; i < 25; i++) {
    for (let j = 0; j < 25; j++) {
      // 跳过定位图案区域
      if ((i < 7 && j < 7) || (i < 7 && j > 17) || (i > 17 && j < 7)) continue;
      
      // 用文本字符码生成伪随机数据
      const charIndex = (i * 25 + j + text.charCodeAt(j % text.length)) % 2;
      if (charIndex === 0) {
        ctx.fillRect(i * cellSize, j * cellSize, cellSize, cellSize);
      }
    }
  }

  return canvas.toDataURL('image/png');
}

function drawPositionPattern(ctx: CanvasRenderingContext2D, x: number, y: number, size: number) {
  const cellSize = size / 25;
  
  // 外框
  ctx.fillRect(x, y, cellSize * 7, cellSize * 7);
  
  // 内白框
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(x + cellSize, y + cellSize, cellSize * 5, cellSize * 5);
  
  // 中心方块
  ctx.fillStyle = '#000000';
  ctx.fillRect(x + cellSize * 2, y + cellSize * 2, cellSize * 3, cellSize * 3);
}
