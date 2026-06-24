import { useState, useRef, useEffect } from 'react';
import { PlayCircle, Play, ChevronLeft, ChevronRight } from 'lucide-react';
import { ItemDetailModal } from './ItemDetailModal';
import { isWeChat, copyToClipboard, setupShareMetadata } from '../lib/shareUtils';
import { ShareHint } from './WeChatShareHint';
import { getFeaturedWorks, getPortfolioItems, getPublicPortfolioItems, getHomeContent, getCategoriesWithDetails, PortfolioItem, HomeContent, CategoryWithDetails } from '../data/store';
import { decodeHtmlEntities } from '../lib/iconPresets';

const heroSlides = [
  {
    id: 1,
    img: '/images/hero-video.png',
    label: 'Neural Stream',
    title: 'Ethereal Segment 01'
  },
  {
    id: 2,
    img: '/images/ai-digital-human.png',
    label: 'Digital Human',
    title: 'Avatar Segment 02'
  },
  {
    id: 3,
    img: '/images/ai-film-production.png',
    label: 'Film Production',
    title: 'Cinematic Segment 03'
  }
];

const coreBusiness = [
  {
    id: 'cb1',
    title: 'AI 数字人定制',
    shortDesc: '基于最前沿的神经网络渲染技术，打造极致逼真的数字孪生与虚拟偶像。支持毫秒级低延迟实时交互。',
    fullDesc: '基于最前沿的神经网络渲染技术，打造极致逼真的数字孪生与虚拟偶像。支持毫秒级低延迟实时交互，为品牌代言与元宇宙直播提供全链路解决方案。',
    img: '/images/ai-digital-human.png',
    category: '核心服务',
    tag: '数字人',
    color: 'text-secondary',
    bgGlow: 'bg-secondary/20'
  },
  {
    id: 'cb2',
    title: '电影级 AI 制作',
    shortDesc: '重塑视频工业流程。利用 AI 赋能预可视化、特效合成与智能调色，将传统昂贵的影视工业水准带入全行业。',
    fullDesc: '重塑视频工业流程。利用 AI 赋能预可视化、特效合成与智能调色，将传统昂贵的影视工业水准带入全行业，实现高效、震撼的视觉叙事。',
    img: '/images/ai-film-production.png',
    category: '核心服务',
    tag: '影视制作',
    color: 'text-primary',
    bgGlow: 'bg-primary/20'
  },
  {
    id: 'cb3',
    title: '社交平台短视频 AI',
    shortDesc: '深度理解社交媒体流量密码。智能脚本生成、自动剪辑与爆款元素植入，助您快速构建高粘性生态。',
    fullDesc: '深度理解社交媒体流量密码。智能脚本生成、自动剪辑与爆款元素植入，助您在碎片化时代快速构建高粘性的短视频生态。',
    img: '/images/ai-short-video.png',
    category: '核心服务',
    tag: '短视频',
    color: 'text-tertiary',
    bgGlow: 'bg-tertiary/20'
  },
  {
    id: 'cb4',
    title: '神经网络技术栈',
    shortDesc: '自主研发的底层引擎。涵盖 GANs, Diffusion Models 与 Transformer 架构的深度优化。',
    fullDesc: '自主研发的底层引擎。涵盖 GANs, Diffusion Models 与 Transformer 架构的深度优化，为各类复杂商业场景提供最稳健的底层算力与算法支持。',
    img: '/images/ai-tech-stack.png',
    category: '核心服务',
    tag: '技术栈',
    color: 'text-secondary-fixed-dim',
    bgGlow: 'bg-secondary/20'
  }
];

const featuredWorks = [
  {
    id: 'fw1',
    title: 'Neon Avatar：实时数字孪生',
    category: '精选作品',
    tag: '实时渲染',
    shortDesc: '打造毫秒级延迟的虚拟代言人，重塑直播与交互体验。',
    fullDesc: '通过最先进的神经渲染技术，我们为品牌定制了专属的数字孪生。该系统支持实时面部捕捉与动作过滤，确保在任何直播环境下都能保持稳定、自然的视觉还原。目前已成功应用于多个头部品牌的元宇宙营销方案。',
    img: '/images/neon-avatar.png',
    type: 'image',
    color: 'text-secondary',
    bgGlow: 'bg-secondary/20'
  },
  {
    id: 'fw2',
    title: '流量密码：短视频爆发矩阵',
    category: '精选作品',
    tag: '内容爆发',
    shortDesc: '智能捕捉社媒热点，自动化生成高点击率的爆款短视频。',
    fullDesc: '针对 TikTok、快手、抖音等平台优化的一站式内容引擎。系统会自动分析当日热搜词条，并基于此生成匹配的视觉素材、脚本与配音。在为期一个月的测试中，该项目助力客户账号实现了 300% 的粉丝增长率。',
    img: '/images/traffic-secret.png',
    type: 'image',
    color: 'text-tertiary',
    bgGlow: 'bg-tertiary/20'
  }
];

export function HomeView() {
  const [selectedItem, setSelectedItem] = useState<typeof coreBusiness[0] | (PortfolioItem & { featuredId: string }) | (CategoryWithDetails & { id: string }) | null>(null);
  const [isWeChatHintVisible, setIsWeChatHintVisible] = useState(false);
  const [featuredItems, setFeaturedItems] = useState<(PortfolioItem & { featuredId: string })[]>([]);
  const [allPortfolioItems, setAllPortfolioItems] = useState<PortfolioItem[]>([]);
  const [homeContent, setHomeContent] = useState<HomeContent>({
    heroTitle: '',
    heroGradientTitle: '',
    heroSubtitle: '',
    heroSlides: []
  });
  const [categories, setCategories] = useState<CategoryWithDetails[]>([]);
  const [currentSlide, setCurrentSlide] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);
  const heroIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const isPortfolioShareItem = (item: typeof selectedItem) => {
    return !!item && 'id' in item && !('coverImage' in item) && Number.isFinite(Number(item.id));
  };

  const updateUrlForShare = (id: number | string) => {
    const url = new URL(window.location.href);
    url.searchParams.set('id', id.toString());
    window.history.replaceState({}, '', url.toString());
  };

  const restoreDefaultUrl = () => {
    const url = new URL(window.location.href);
    url.searchParams.delete('id');
    window.history.replaceState({}, '', `${url.pathname}${url.search}${url.hash}`);
  };

  useEffect(() => {
    const loadData = async () => {
      try {
        const [allPortfolioItemsData, publicPortfolioItems, featuredWorks, homeContent, categories] = await Promise.all([
          getPortfolioItems(),
          getPublicPortfolioItems(),
          getFeaturedWorks(),
          getHomeContent(),
          getCategoriesWithDetails()
        ]);
        
        const items = featuredWorks
          .map(fw => {
            const item = publicPortfolioItems.find(pi => pi.id === fw.portfolioId || Number(pi.id) === Number(fw.portfolioId));
            if (item) {
              return { ...item, featuredId: fw.id };
            }
            return null;
          })
          .filter((item): item is PortfolioItem & { featuredId: string } => item !== null)
          .sort((a, b) => {
            const aOrder = featuredWorks.find(fw => fw.id === a.featuredId)?.sortOrder || 0;
            const bOrder = featuredWorks.find(fw => fw.id === b.featuredId)?.sortOrder || 0;
            return aOrder - bOrder;
          });
        
        setAllPortfolioItems(allPortfolioItemsData);
        setFeaturedItems(items);
        setHomeContent(homeContent);
        setCategories(categories);
      } catch (error) {
        console.error('Failed to load data:', error);
      }
    };
    
    loadData();
  }, []);

  // Hero carousel auto-play
  useEffect(() => {
    if (homeContent.heroSlides && homeContent.heroSlides.length > 0) {
      heroIntervalRef.current = setInterval(() => {
        setCurrentSlide((prev) => (prev + 1) % (homeContent.heroSlides?.length || 1));
      }, 5000);
    }
    
    return () => {
      if (heroIntervalRef.current) {
        clearInterval(heroIntervalRef.current);
      }
    };
  }, [homeContent.heroSlides]);

  const nextHeroSlide = () => {
    const slideCount = homeContent.heroSlides?.length || 1;
    setCurrentSlide((prev) => (prev + 1) % slideCount);
  };

  const prevHeroSlide = () => {
    const slideCount = homeContent.heroSlides?.length || 1;
    setCurrentSlide((prev) => (prev - 1 + slideCount) % slideCount);
  };

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const id = params.get('id');
    if (id) {
      if (id.startsWith('cb')) {
        const item = coreBusiness.find(b => b.id === id);
        if (item) setSelectedItem(item);
      } else if (id.startsWith('fw')) {
        const item = featuredItems.find(w => w.featuredId === id);
        if (item) setSelectedItem(item);
      } else {
        // 首先在所有作品中查找普通 portfolio ID（包括隐藏作品）
        const item = allPortfolioItems.find(p => p.id.toString() === id);
        if (item) {
          setSelectedItem(item as any);
        }
      }
    }
  }, [featuredItems, allPortfolioItems]);

  // Update share metadata when opening/closing detail modal
  // Do NOT update URL to avoid WeChat bottom bar
  useEffect(() => {
    if (selectedItem) {
      // When opening detail, set share info for the item
      let shareTitle: string;
      let shareDesc: string;
      let shareImg: string;
      let shareUrl: string;
      
      // 判断是否是作品（有 portfolio ID），使用主应用链接带参数
      if (isPortfolioShareItem(selectedItem)) {
        // Portfolio item，使用主应用链接
        shareUrl = `${window.location.origin}/?id=${selectedItem.id}`;
        shareTitle = ('title' in selectedItem ? selectedItem.title : '大连柒子文化发展有限公司');
        shareDesc = ('shortDesc' in selectedItem ? selectedItem.shortDesc : selectedItem.category) || '诚信立足 创新致远';
        shareImg = ('img' in selectedItem ? selectedItem.img : homeContent.heroImage || '/images/hero-home.png');
      } else {
        // 核心业务或分类，使用首页
        shareUrl = window.location.origin;
        shareTitle = ('name' in selectedItem ? selectedItem.name : selectedItem.title) || '大连柒子文化发展有限公司';
        shareDesc = ('category' in selectedItem ? selectedItem.category : '大连柒子文化');
        shareImg = ('coverImage' in selectedItem ? selectedItem.coverImage : selectedItem.img) || homeContent.heroImage || '/images/hero-home.png';
      }
      
      setupShareMetadata({
        title: shareTitle,
        desc: shareDesc,
        link: shareUrl,
        imgUrl: shareImg
      });
    } else {
      // When closing, restore default share metadata
      setupShareMetadata({
        title: homeContent.shareTitle || '大连柒子文化发展有限公司',
        desc: homeContent.shareDescription || '诚信立足 创新致远',
        link: window.location.origin,
        imgUrl: homeContent.heroImage || '/images/hero-home.png'
      });
    }
  }, [selectedItem, homeContent]);

  const handleShare = async () => {
    if (!selectedItem) return;
    
    let shareUrl: string;
    
    // 判断是否是作品（有 portfolio ID），使用主应用链接带参数
    if (isPortfolioShareItem(selectedItem)) {
      // Portfolio item，使用主应用链接
      shareUrl = `${window.location.origin}/?id=${selectedItem.id}`;
      updateUrlForShare(selectedItem.id);
    } else {
      // 核心业务或分类，使用首页
      shareUrl = window.location.origin;
    }
    
    const copied = await copyToClipboard(shareUrl);

    if (copied) {
      setIsWeChatHintVisible(true);
    }
  };

  const handleCloseShareHint = () => {
    setIsWeChatHintVisible(false);
    restoreDefaultUrl();
  };

  const handleCloseDetail = () => {
    setSelectedItem(null);
    setIsWeChatHintVisible(false);
    restoreDefaultUrl();
  };

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const scrollAmount = 400;
      scrollRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  return (
    <div className="pt-16 pb-24 lg:pb-12">
      <ShareHint 
        isVisible={isWeChatHintVisible} 
        onClose={handleCloseShareHint} 
        mode={isWeChat() ? 'wechat' : 'default'}
      />
      {/* Hero Section */}
      <section className="relative px-6 py-12 md:py-24 flex flex-col items-start overflow-hidden lg:flex-row lg:items-center lg:gap-12">
        <div className="absolute top-0 right-0 w-96 h-96 bg-primary/10 blur-[120px] -z-10"></div>
        
        <div className="flex-1 space-y-6">
          <h2 className="text-4xl md:text-6xl font-headline font-black tracking-tighter leading-[1.1] holographic-text">
            {homeContent.heroTitle || '开启未来的'}<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-secondary to-tertiary">
              {homeContent.heroGradientTitle || '视界 Matrix'}
            </span>
          </h2>
          <div className="border-l-4 border-primary/30 pl-6 py-2">
            <p className="text-on-surface-variant font-body text-base md:text-lg leading-relaxed italic max-w-xl">
              {homeContent.heroSubtitle || '通过 AIGC 重新定义数字影像。我们将人类的情感与神经计算相结合，打造跨越维度的奇迹。'}
            </p>
          </div>
        </div>

        {/* Hero Carousel */}
        {(homeContent.heroSlides && homeContent.heroSlides.length > 0) && (
          <div className="mt-12 lg:mt-0 flex-1 w-full aspect-video rounded-3xl overflow-hidden relative surface-container shadow-2xl border border-white/5 group">
            {/* Carousel slides */}
            <div className="relative w-full h-full">
              {homeContent.heroSlides.map((slide, index) => (
                <div
                  key={slide.id}
                  className={`absolute inset-0 transition-opacity duration-1000 ${
                    index === currentSlide ? 'opacity-100' : 'opacity-0'
                  }`}
                >
                  <img
                    className="w-full h-full object-cover"
                    alt={`Hero slide ${index + 1}`}
                    src={slide.img || '/images/hero-video.png'}
                    loading={index === 0 ? "eager" : "lazy"}
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = '/images/hero-video.png';
                    }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent z-10"></div>
                  <div 
                    className="absolute bottom-6 left-6 z-20 flex items-center gap-4 cursor-pointer"
                    onClick={() => {
                      if (slide.portfolioId) {
                        const item = allPortfolioItems.find(p => p.id === slide.portfolioId);
                        if (item) {
                          setSelectedItem(item);
                        }
                      }
                    }}
                  >
                    <div className="w-12 h-12 rounded-full bg-secondary/20 backdrop-blur-md flex items-center justify-center border border-secondary/30 shadow-[0_0_20px_rgba(83,237,252,0.2)]">
                      <PlayCircle className="text-secondary w-6 h-6" />
                    </div>
                    <div>
                      {slide.label && (
                        <span className="font-label text-[10px] tracking-[0.2em] uppercase text-secondary/60 block mb-0.5">{slide.label}</span>
                      )}
                      {slide.title && (
                        <span className="font-headline font-bold text-lg text-secondary">{slide.title}</span>
                      )}
                    </div>
                  </div>
                  {slide.portfolioId && (
                    <div className="absolute inset-0 z-15 cursor-pointer" onClick={() => {
                      const item = allPortfolioItems.find(p => p.id === slide.portfolioId);
                      if (item) {
                        setSelectedItem(item);
                      }
                    }}></div>
                  )}
                </div>
              ))}
            </div>
            
            {/* Navigation buttons */}
            <button
              onClick={prevHeroSlide}
              className="absolute left-4 top-1/2 -translate-y-1/2 z-30 p-2 rounded-full bg-black/40 backdrop-blur-md border border-white/10 text-white/80 hover:text-white hover:bg-black/60 transition-all opacity-0 group-hover:opacity-100"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
            <button
              onClick={nextHeroSlide}
              className="absolute right-4 top-1/2 -translate-y-1/2 z-30 p-2 rounded-full bg-black/40 backdrop-blur-md border border-white/10 text-white/80 hover:text-white hover:bg-black/60 transition-all opacity-0 group-hover:opacity-100"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
            
            {/* Indicators */}
            <div className="absolute bottom-4 right-4 z-20 flex gap-2">
              {homeContent.heroSlides.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentSlide(index)}
                  className={`w-2 h-2 rounded-full transition-all ${
                    index === currentSlide 
                      ? 'bg-secondary w-6 rounded-full' 
                      : 'bg-white/30 hover:bg-white/50'
                  }`}
                />
              ))}
            </div>
          </div>
        )}
      </section>

      {/* Core Business Areas */}
      <section className="px-6 py-12 relative group/carousel">
        <div className="flex items-end justify-between mb-8">
          <div>
            <h3 className="font-headline text-2xl font-bold text-on-surface tracking-tight">核心业务矩阵 Matrix</h3>
            <p className="text-on-surface-variant font-label text-[10px] tracking-widest mt-1 uppercase opacity-50">Service Core Functional Matrix</p>
          </div>
          <span className="font-label text-[10px] text-outline">SWIPE FOR MORE</span>
        </div>
        
        <div className="relative">
          {/* Scroll Buttons */}
          <button 
            onClick={() => scroll('left')}
            className="absolute -left-4 top-1/2 -translate-y-1/2 z-10 p-2 rounded-full glass-panel border border-white/10 text-white/50 hover:text-white hover:scale-110 transition-all opacity-0 group-hover/carousel:opacity-100 hidden sm:flex"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          <button 
            onClick={() => scroll('right')}
            className="absolute -right-4 top-1/2 -translate-y-1/2 z-10 p-2 rounded-full glass-panel border border-white/10 text-white/50 hover:text-white hover:scale-110 transition-all opacity-0 group-hover/carousel:opacity-100 hidden sm:flex"
          >
            <ChevronRight className="w-6 h-6" />
          </button>

          <div 
            ref={scrollRef}
            className="flex overflow-x-auto hide-scrollbar gap-4 pb-4 -mx-6 px-6 scroll-smooth"
          >
            {categories.length > 0 ? (
              categories.map((item) => (
                <div 
                  key={item.id}
                  onClick={() => setSelectedItem(item)}
                  className="min-w-[280px] w-[280px] shrink-0 rounded-2xl overflow-hidden surface-container-low border border-outline-variant/10 shadow-xl cursor-pointer transition-transform active:scale-95"
                >
                  <div className="h-40 relative">
                    <img
                      className="w-full h-full object-cover"
                      alt={item.name}
                      src={item.coverImage || '/images/hero-home.png'}
                      loading="lazy"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = '/images/hero-home.png';
                      }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-surface-container-low via-transparent to-transparent"></div>
                    {item.icon && (
                      <div className="absolute bottom-3 right-3 w-12 h-12 rounded-xl bg-surface-container-low/90 backdrop-blur-sm flex items-center justify-center border border-white/10">
                        <div dangerouslySetInnerHTML={{ __html: decodeHtmlEntities(item.icon) }} className={`w-6 h-6 ${item.color || 'text-primary'} flex items-center justify-center`} />
                      </div>
                    )}
                  </div>
                  <div className="p-5">
                    <h4 className="font-headline text-lg font-bold text-on-surface mb-2">{item.name}</h4>
                    <p className="font-body text-on-surface-variant text-xs leading-relaxed line-clamp-3">
                      {item.description}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              coreBusiness.map((item) => (
                <div 
                  key={item.id}
                  onClick={() => setSelectedItem(item)}
                  className="min-w-[280px] w-[280px] shrink-0 rounded-2xl overflow-hidden surface-container-low border border-outline-variant/10 shadow-xl cursor-pointer transition-transform active:scale-95"
                >
                  <div className="h-40 relative">
                    <img
                      className="w-full h-full object-cover"
                      alt={item.title}
                      src={item.img || '/images/hero-home.png'}
                      loading="lazy"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = '/images/hero-home.png';
                      }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-surface-container-low via-transparent to-transparent"></div>
                  </div>
                  <div className="p-5">
                    <h4 className="font-headline text-lg font-bold text-on-surface mb-2">{item.title}</h4>
                    <p className="font-body text-on-surface-variant text-xs leading-relaxed line-clamp-3">
                      {item.shortDesc}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </section>

      {/* Featured Works */}
      <section className="px-6 py-12 md:py-24">
        <div className="flex items-end justify-between mb-12">
          <div>
            <h3 className="font-headline text-2xl md:text-3xl font-bold text-on-surface tracking-tight">精选作品</h3>
            <p className="text-on-surface-variant font-label text-xs tracking-widest mt-2 uppercase opacity-50">Featured Cinematic Works</p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-8">
          {featuredItems.length > 0 ? (
            featuredItems.map((work) => (
              <div 
                key={work.featuredId}
                onClick={() => setSelectedItem(work)}
                className="relative group cursor-pointer"
              >
              <div className="aspect-[16/10] rounded-2xl overflow-hidden shadow-2xl relative border border-white/5">
                <img
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-1000"
                  alt={work.title}
                  src={work.img || '/images/hero-home.png'}
                  loading="lazy"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = '/images/hero-home.png';
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-60 group-hover:opacity-100 transition-opacity" />
                
                {work.type === 'video' && (
                  <div className="absolute top-4 right-4 bg-black/40 backdrop-blur-md p-3 rounded-full border border-white/10 group-hover:bg-primary transition-colors">
                    <Play className="text-white w-4 h-4 fill-current" />
                  </div>
                )}
              </div>
              <div className="mt-5 space-y-2">
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-0.5 rounded-sm bg-black/40 border border-white/10 text-[9px] font-label uppercase tracking-[0.2em] ${work.color}`}>
                    {work.category}
                  </span>
                  <span className={`px-2 py-0.5 rounded-sm bg-black/40 border border-white/10 text-[9px] font-label uppercase tracking-[0.2em] ${work.color}`}>
                    {work.tag}
                  </span>
                </div>
                <h4 className="font-headline text-xl font-bold group-hover:text-primary transition-colors">{work.title}</h4>
              </div>
            </div>
            ))
          ) : (
            <div className="col-span-full text-center py-12">
              <p className="text-on-surface-variant">暂无精选作品</p>
            </div>
          )}
        </div>
      </section>

      {/* Footer Text Area */}
      <footer className="px-8 py-12 text-center relative overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[1px] bg-gradient-to-r from-transparent via-primary/30 to-transparent"></div>
        <p className="font-body italic text-xs sm:text-sm opacity-80 leading-relaxed text-gradient whitespace-nowrap">
          介绍已经结束了，但是我们的故事才刚开始......
        </p>
      </footer>

      {/* Detail Modal */}
      <ItemDetailModal
        isOpen={!!selectedItem}
        onClose={handleCloseDetail}
        item={selectedItem}
        onShare={handleShare}
      />
    </div>
  );
}
