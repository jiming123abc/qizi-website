import { useState, useEffect, useRef } from 'react';
import { Play, ChevronLeft, ChevronRight } from 'lucide-react';
import { Modal } from './Modal';
import { ImageViewerModal } from './ImageViewerModal';

// 接口定义
interface SimpleItem {
  id?: any;
  title?: string;
  name?: string;
  category?: string;
  tag?: string;
  shortDesc?: string;
  fullDesc?: string;
  description?: string;
  img?: string;
  images?: string[];
  coverImage?: string;
  videoUrl?: string;
  type?: string;
  color?: string;
  bgGlow?: string;
}

interface ItemDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: SimpleItem | null;
  onShare?: () => void;
}

export function ItemDetailModal({ isOpen, onClose, item, onShare }: ItemDetailModalProps) {
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [imageViewerOpen, setImageViewerOpen] = useState(false);
  const [currentViewImage, setCurrentViewImage] = useState<string>('');
  const videoRef = useRef<HTMLVideoElement>(null);
  const touchStartX = useRef<number>(0);

  // 重置状态当 item 变化时
  useEffect(() => {
    if (item) {
      setCurrentSlideIndex(0);
      setIsVideoPlaying(false);
    }
    // 当模态框关闭时暂停视频
    if (!isOpen && videoRef.current) {
      videoRef.current.pause();
    }
  }, [item, isOpen]);

  // 安全检查 - 如果item是null，不要渲染复杂内容
  if (!item) {
    return (
      <Modal isOpen={isOpen} onClose={onClose} onShare={undefined}>
        <div className="p-6 text-center">
          <p className="text-white">没有内容</p>
        </div>
      </Modal>
    );
  }

  // 安全地获取属性
  const safeItem = item;
  const isCategory = !!(('name' in safeItem && safeItem.name) || ('coverImage' in safeItem && safeItem.coverImage));
  const isPortfolioItem = !isCategory;
  const title = (safeItem.title || safeItem.name || '内容详情') as string;
  const description = (safeItem.fullDesc || safeItem.description || safeItem.shortDesc || '暂无详细描述') as string;
  const bgGlow = (safeItem.bgGlow || 'bg-primary/20') as string;
  const color = (safeItem.color || 'text-primary') as string;
  const category = safeItem.category as string | undefined;
  const tag = safeItem.tag as string | undefined;
  const isVideoType = safeItem.type === 'video';
  const hasVideoUrl = !!safeItem.videoUrl;
  const isVideoItem = isPortfolioItem && isVideoType && hasVideoUrl;
  const imagesList = Array.isArray(safeItem.images) ? safeItem.images : [];
  const hasMultipleImages = isPortfolioItem && imagesList.length > 0;
  const showTags = isPortfolioItem && !isCategory;
  const showShare = isPortfolioItem && !isCategory && !!onShare;

  // 获取图片源
  const getImageSrc = () => {
    try {
      if (isCategory && safeItem.coverImage) return safeItem.coverImage;
      if (safeItem.img) return safeItem.img;
      return '/images/hero-home.png';
    } catch {
      return '/images/hero-home.png';
    }
  };

  const imageSrc = getImageSrc();

  // 轮播图总数量
  const totalSlides = 1 + imagesList.length;

  // 处理播放/暂停
  const toggleVideoPlay = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (videoRef.current) {
      if (videoRef.current.paused) {
        videoRef.current.play().catch(err => {
          console.error('播放失败:', err);
          setIsVideoPlaying(false);
        });
      } else {
        videoRef.current.pause();
      }
    }
  };

  // 获取当前轮播图的图片URL
  const getCurrentImageUrl = () => {
    if (currentSlideIndex === 0) {
      return imageSrc;
    }
    return imagesList[currentSlideIndex - 1];
  };

  // 简单可靠的图片点击处理
  const openImageViewer = (imgUrl: string) => {
    setCurrentViewImage(imgUrl);
    setImageViewerOpen(true);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} onShare={showShare ? onShare : undefined}>
      <div className="flex flex-col h-full relative bg-surface-container-low">
        {/* 背景光晕 */}
        <div className={`absolute top-0 left-0 w-full h-64 ${bgGlow} blur-[80px] -z-10 opacity-50`}></div>

        {/* 媒体区域 */}
        <div className="relative aspect-video shrink-0 bg-black">
          {/* 视频类型 */}
          {isVideoItem ? (
            <div className="relative w-full h-full group">
              <video
                ref={videoRef}
                src={safeItem.videoUrl}
                className="w-full h-full object-cover cursor-pointer"
                loop
                controls
                playsInline
                onClick={toggleVideoPlay}
                onPlay={() => setIsVideoPlaying(true)}
                onPause={() => setIsVideoPlaying(false)}
              />
              {/* 播放按钮 - 只在暂停时显示 */}
              {!isVideoPlaying && (
                <div
                  className="absolute inset-0 flex items-center justify-center bg-black/30 transition-opacity duration-300 cursor-pointer"
                  onClick={toggleVideoPlay}
                >
                  <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/30 group-hover:scale-110 transition-transform">
                    <Play className="text-white w-8 h-8 ml-1" />
                  </div>
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-surface-container-low via-surface-container-low/20 to-transparent pointer-events-none"></div>
            </div>
          ) : hasMultipleImages ? (
            // 多图轮播
            <div
              className="relative w-full h-full overflow-hidden group"
              onTouchStart={(e) => { touchStartX.current = e.touches[0].clientX; }}
              onTouchEnd={(e) => {
                const deltaX = e.changedTouches[0].clientX - touchStartX.current;
                if (deltaX < -50) {
                  setCurrentSlideIndex((prev) => Math.min(totalSlides - 1, prev + 1));
                } else if (deltaX > 50) {
                  setCurrentSlideIndex((prev) => Math.max(0, prev - 1));
                }
              }}
            >
              <div
                className="h-full flex transition-transform duration-500"
                style={{ transform: `translateX(-${currentSlideIndex * 100}%)` }}
              >
                <div 
                  className="w-full h-full flex-shrink-0 cursor-pointer"
                  onClick={() => openImageViewer(imageSrc)}
                >
                  <img
                    src={imageSrc}
                    alt={title}
                    className="w-full h-full object-cover"
                    loading="lazy"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = '/images/hero-home.png';
                    }}
                  />
                </div>
                {imagesList.map((imgUrl: string, idx: number) => (
                  <div 
                    key={idx}
                    className="w-full h-full flex-shrink-0 cursor-pointer"
                    onClick={() => openImageViewer(imgUrl)}
                  >
                    <img
                      src={imgUrl}
                      alt={`${title} ${idx + 1}`}
                      className="w-full h-full object-cover"
                      loading="lazy"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = '/images/hero-home.png';
                      }}
                    />
                  </div>
                ))}
              </div>
              {/* 左箭头 */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setCurrentSlideIndex((prev) => Math.max(0, prev - 1));
                }}
                className="absolute left-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/40 backdrop-blur-md border border-white/10 text-white/70 hover:text-white hover:bg-black/60 transition-all"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
              {/* 右箭头 */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setCurrentSlideIndex((prev) => Math.min(totalSlides - 1, prev + 1));
                }}
                className="absolute right-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/40 backdrop-blur-md border border-white/10 text-white/70 hover:text-white hover:bg-black/60 transition-all"
              >
                <ChevronRight className="w-6 h-6" />
              </button>
              {/* 指示点 */}
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                <button
                  onClick={(e) => { e.stopPropagation(); setCurrentSlideIndex(0); }}
                  className={`w-2 h-2 rounded-full transition-all ${currentSlideIndex === 0 ? 'bg-white w-4' : 'bg-white/50'}`}
                />
                {imagesList.map((_, idx: number) => (
                  <button
                    key={idx}
                    onClick={(e) => { e.stopPropagation(); setCurrentSlideIndex(idx + 1); }}
                    className={`w-2 h-2 rounded-full transition-all ${currentSlideIndex === idx + 1 ? 'bg-white w-4' : 'bg-white/50'}`}
                  />
                ))}
              </div>
              <div className="absolute inset-0 bg-gradient-to-t from-surface-container-low via-surface-container-low/20 to-transparent pointer-events-none"></div>
            </div>
          ) : (
            // 单图
            <div 
              className="w-full h-full cursor-pointer"
              onClick={() => openImageViewer(imageSrc)}
            >
              <img
                src={imageSrc}
                alt={title}
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = '/images/hero-home.png';
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-surface-container-low via-surface-container-low/20 to-transparent pointer-events-none"></div>
            </div>
          )}
        </div>

        {/* 内容区域 */}
        <div className="p-6 flex-1 flex flex-col -mt-8 relative z-10">
          {showTags && (
            <div className="flex items-center gap-2 mb-4">
              {category && (
                <span className={`px-2 py-0.5 rounded-sm bg-black/40 border border-white/10 text-[10px] font-label uppercase tracking-wider ${color}`}>
                  {category}
                </span>
              )}
              {tag && (
                <span className="px-2 py-0.5 rounded-sm bg-black/40 border border-white/10 text-white/70 text-[10px] font-label uppercase tracking-wider">
                  {tag}
                </span>
              )}
            </div>
          )}
          <h3 className="text-2xl font-headline font-bold text-on-surface mb-6">{title}</h3>
          <div className="w-12 h-[1px] bg-white/20 mb-6"></div>
          <p className="text-on-surface-variant leading-relaxed font-body text-sm">
            {description}
          </p>
        </div>

        {showShare && (
          <p className="px-6 pb-4 -mt-4 text-xs text-on-surface-variant/40 text-center">
            点击右上角的分享按钮，可以通过分享链接或微信分享卡片一键直达该作品
          </p>
        )}
      </div>
    </Modal>

    {/* 图片查看器 */}
    <ImageViewerModal
      isOpen={imageViewerOpen}
      onClose={() => setImageViewerOpen(false)}
      imageUrl={currentViewImage}
      alt={title}
    />
  );
}
