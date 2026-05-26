import { useState, useRef, useEffect } from 'react';
import { X, Minus, Plus, RotateCcw } from 'lucide-react';

interface ImageViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageUrl: string;
  alt?: string;
}

export function ImageViewerModal({ isOpen, onClose, imageUrl, alt = '' }: ImageViewerModalProps) {
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const imageRef = useRef<HTMLImageElement>(null);

  // 重置状态
  useEffect(() => {
    if (isOpen) {
      setScale(1);
      setPosition({ x: 0, y: 0 });
    }
  }, [isOpen, imageUrl]);

  // 处理 ESC 键关闭
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // 处理滚轮缩放
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.1 : 0.1;
    const newScale = Math.max(0.5, Math.min(5, scale + delta));
    setScale(newScale);
  };

  // 处理鼠标按下开始拖动
  const handleMouseDown = (e: React.MouseEvent) => {
    if (scale > 1) {
      setIsDragging(true);
      setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
    }
  };

  // 处理鼠标移动
  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging && scale > 1) {
      setPosition({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      });
    }
  };

  // 处理鼠标抬起
  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // 处理触摸开始
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1 && scale > 1) {
      setIsDragging(true);
      setDragStart({ x: e.touches[0].clientX - position.x, y: e.touches[0].clientY - position.y });
    }
  };

  // 处理触摸移动
  const handleTouchMove = (e: React.TouchEvent) => {
    if (isDragging && e.touches.length === 1 && scale > 1) {
      setPosition({
        x: e.touches[0].clientX - dragStart.x,
        y: e.touches[0].clientY - dragStart.y
      });
    }
  };

  // 处理触摸结束
  const handleTouchEnd = () => {
    setIsDragging(false);
  };

  // 放大
  const handleZoomIn = () => {
    setScale(prev => Math.min(5, prev + 0.5));
  };

  // 缩小
  const handleZoomOut = () => {
    setScale(prev => Math.max(0.5, prev - 0.5));
  };

  // 重置
  const handleReset = () => {
    setScale(1);
    setPosition({ x: 0, y: 0 });
  };

  // 点击背景关闭（但图片区域不关闭）
  const handleBackgroundClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-[100] bg-black flex items-center justify-center"
      onMouseUp={handleMouseUp}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseUp}
      onClick={handleBackgroundClick}
    >
      {/* 关闭按钮 */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 z-10 p-3 rounded-full bg-black/50 backdrop-blur-md border border-white/20 text-white hover:bg-black/70 transition-colors"
      >
        <X className="w-6 h-6" />
      </button>

      {/* 缩放控制 */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10 flex items-center gap-2 p-2 rounded-full bg-black/50 backdrop-blur-md border border-white/20">
        <button
          onClick={handleZoomOut}
          className="p-2 rounded-full text-white/70 hover:text-white hover:bg-white/10 transition-colors"
        >
          <Minus className="w-5 h-5" />
        </button>
        <div className="px-2 text-white/70 text-sm font-medium min-w-[60px] text-center">
          {Math.round(scale * 100)}%
        </div>
        <button
          onClick={handleZoomIn}
          className="p-2 rounded-full text-white/70 hover:text-white hover:bg-white/10 transition-colors"
        >
          <Plus className="w-5 h-5" />
        </button>
        <div className="w-px h-6 bg-white/20 mx-1" />
        <button
          onClick={handleReset}
          className="p-2 rounded-full text-white/70 hover:text-white hover:bg-white/10 transition-colors"
        >
          <RotateCcw className="w-5 h-5" />
        </button>
      </div>

      {/* 图片容器 */}
      <div
        className="relative max-w-[90vw] max-h-[90vh] overflow-hidden"
        onMouseDown={handleMouseDown}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onWheel={handleWheel}
      >
        <img
          ref={imageRef}
          src={imageUrl}
          alt={alt}
          className="max-w-full max-h-[90vh] object-contain select-none"
          style={{
            transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
            transition: isDragging ? 'none' : 'transform 0.1s ease-out',
            cursor: scale > 1 ? (isDragging ? 'grabbing' : 'grab') : 'default'
          }}
          draggable={false}
          onError={(e) => {
            (e.target as HTMLImageElement).src = '/images/hero-home.png';
          }}
        />
      </div>
    </div>
  );
}
