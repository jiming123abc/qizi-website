import { useState, useRef, useEffect } from 'react';
import { PlayCircle, Play, ChevronLeft, ChevronRight } from 'lucide-react';
import { Modal } from './Modal';
import { isWeChat, copyToClipboard, setupShareMetadata } from '../lib/shareUtils';
import { ShareHint } from './WeChatShareHint';
import { getFeaturedWorks, getPortfolioItems, getHomeContent, getCategoriesWithDetails, PortfolioItem, HomeContent, CategoryWithDetails } from '../data/store';

const coreBusiness = [
  {
    id: 'cb1',
    title: 'AI 数字人定制',
    shortDesc: '基于最前沿的神经网络渲染技术，打造极致逼真的数字孪生与虚拟偶像。支持毫秒级低延迟实时交互。',
    fullDesc: '基于最前沿的神经网络渲染技术，打造极致逼真的数字孪生与虚拟偶像。支持毫秒级低延迟实时交互，为品牌代言与元宇宙直播提供全链路解决方案。',
    img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAp92O6UL9Vz2Y49V1pDeEaHSG60rc7Qo0WxFOSNdnZ73WECUQxvok_Ljw0_eu88WCkDV-V1ps4GTjXG3logkuhu09jLkfHqQYGHg_vJ-SMzQadM4e6BMeBUvEgw3PaYreuk82SU0Pnt_2khipWe-DYxJSnoAW4XnjO_zJ1nBef9ytJKr67OXcOAbe8AKYp-a0zRYLKCa7MU-6dPBgSKa0CJYiegBYWzWBjzaP3PuzL-jhC1Qx9GmekBCcE_EuCfPOtX8FQ2V6DND8',
    category: '核心业务',
    tag: '数字人',
    color: 'text-primary',
    bgGlow: 'bg-primary/20'
  },
  {
    id: 'cb2',
    title: '电影级 AI 制作',
    shortDesc: '重塑视频工业流程。利用 AI 赋能预可视化、特效合成与智能调色，将传统昂贵的影视工业水准带入全行业。',
    fullDesc: '重塑视频工业流程。利用 AI 赋能预可视化、特效合成与智能调色，将传统昂贵的影视工业水准带入全行业，实现高效、震撼的视觉叙事。',
    img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuC2oewJ15NnSn9V-GoIKkwxoY1AqBw8HA3aIRrU1pYtGc8y3NfJ8-M-8d_91Wg61pvV2YhhYcKqm8PixFHN_mu4njCl-PlSTzF5MHmTZ7yJ9-sl0HWcg-r81YTI_k6Oe9Q5R1jnOSu2-O7qRmCPFDeBqaf1AShYZgafO4NECgueKISBQ-Ame6ElhnbLFXZFwZ1hovklirx2Tu_DNHMivQzGQ1O4yB9HW3fEHychiTl2rxn7jCE4RpLCoiiOVV4FllQ55626gruZFaM',
    category: '核心业务',
    tag: '影视制作',
    color: 'text-secondary',
    bgGlow: 'bg-secondary/20'
  },
  {
    id: 'cb3',
    title: '社交平台短视频 AI',
    shortDesc: '深度理解社交媒体流量密码。智能脚本生成、自动剪辑与爆款元素植入，助您快速构建高粘性生态。',
    fullDesc: '深度理解社交媒体流量密码。智能脚本生成、自动剪辑与爆款元素植入，助您在碎片化时代快速构建高粘性的短视频生态。',
    img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAQW5T_kIPPyvA0MArzCohp-Lvna6zFt2XVq_gvZQ9jAyCvDOHGl99kNivu9epZvRpRWEXnN7TDAcQvv0NMC9QlFNvKpjyjJVILsEgBhiLoltlUxxpxSIXTNl6mpd0z5J2Xww-y-tk1nAtx3PAAR9WZ82tRv3Pv4mTUCy56Oj-EbcPF4Iy7CNrZaDQJBOBZrrJ4agMu0RAI16RW8axFEwxgMZuI8t6czAeuzsQYFKbLW0JBNus9PBl2Lvq3KzxuHRvBFWhA-q9VsOo',
    category: '核心业务',
    tag: '短视频',
    color: 'text-tertiary',
    bgGlow: 'bg-tertiary/20'
  },
  {
    id: 'cb4',
    title: '神经网络技术栈',
    shortDesc: '自主研发的底层引擎。涵盖 GANs, Diffusion Models 与 Transformer 架构的深度优化。',
    fullDesc: '自主研发的底层引擎。涵盖 GANs, Diffusion Models 与 Transformer 架构的深度优化，为各类复杂商业场景提供最稳健的底层算力与算法支持。',
    img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuD9sPNFE9R6ql6lY5e9KZaO0PSDxjlAiPj22W0-bUUEdp1ZXEe1W-nUX_AXm14HSH01mDUjtaM2h3V8cGxjuy1v7NtABWUVxbcM-TvHE3RJOjFpLdBH3KeCPSF-sNZTVo-p6F2aNpcO7hVsASMZBr6exfJgyMZ2bKSzJZMQzBNXoPUJ3pY5XntB39SEtQX_CHKDEWJjQvqOLe-Ph24m71ztA8xOpu0a_pZvV4aknL7du7cSZ9V2UWqp1N4uhlmS86JZxPVYdn-ijE4',
    category: '核心业务',
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
    img: 'https://images.unsplash.com/photo-1620641788421-7a1c342ea42e?q=80&w=2074&auto=format&fit=crop',
    videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-young-woman-in-a-futuristic-setting-34533-large.mp4',
    type: 'video',
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
    img: 'https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?q=80&w=1974&auto=format&fit=crop',
    type: 'image',
    color: 'text-tertiary',
    bgGlow: 'bg-tertiary/20'
  }
];

export function HomeView() {
  const [selectedItem, setSelectedItem] = useState<typeof coreBusiness[0] | (PortfolioItem & { featuredId: string }) | (CategoryWithDetails & { id: string }) | null>(null);
  const [isWeChatHintVisible, setIsWeChatHintVisible] = useState(false);
  const [featuredItems, setFeaturedItems] = useState<(PortfolioItem & { featuredId: string })[]>([]);
  const [homeContent, setHomeContent] = useState<HomeContent>({
    heroTitle: '',
    heroSubtitle: '',
    heroImage: '',
    aboutTitle: '',
    aboutContent: ''
  });
  const [categories, setCategories] = useState<CategoryWithDetails[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const portfolioItems = getPortfolioItems();
    const featuredWorks = getFeaturedWorks();
    const items = featuredWorks
      .map(fw => {
        const item = portfolioItems.find(pi => pi.id === fw.portfolioId);
        if (item) {
          return { ...item, featuredId: fw.id };
        }
        return null;
      })
      .filter((item): item is PortfolioItem & { featuredId: string } => item !== null)
      .sort((a, b) => {
        const aOrder = getFeaturedWorks().find(fw => fw.id === a.featuredId)?.sortOrder || 0;
        const bOrder = getFeaturedWorks().find(fw => fw.id === b.featuredId)?.sortOrder || 0;
        return aOrder - bOrder;
      });
    setFeaturedItems(items);
    setHomeContent(getHomeContent());
    setCategories(getCategoriesWithDetails());
  }, []);

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
      }
    }
  }, [featuredItems]);

  // Update URL on selection
  useEffect(() => {
    const url = new URL(window.location.href);
    if (selectedItem) {
      url.searchParams.set('id', selectedItem.id);
    } else {
      url.searchParams.delete('id');
    }
    window.history.replaceState({}, '', url.toString());

    // Update share metadata if selected
    if (selectedItem) {
      setupShareMetadata({
        title: ('name' in selectedItem ? selectedItem.name : selectedItem.title),
        desc: ('category' in selectedItem ? selectedItem.category : '大连柒子文化'),
        link: url.toString(),
        imgUrl: ('coverImage' in selectedItem ? selectedItem.coverImage : selectedItem.img)
      });
    } else {
      // Restore default share metadata when closing
      setupShareMetadata({
        title: '大连柒子文化发展有限公司',
        desc: '诚信立足 创新致远',
        link: url.toString(),
        imgUrl: homeContent.hero?.cover || ''
      });
    }
  }, [selectedItem, homeContent]);

  const handleShare = async () => {
    if (!selectedItem) return;
    
    const shareUrl = window.location.href;
    const copied = await copyToClipboard(shareUrl);

    if (copied) {
      setIsWeChatHintVisible(true);
    }
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
        onClose={() => setIsWeChatHintVisible(false)} 
        mode={isWeChat() ? 'wechat' : 'default'}
      />
      {/* Hero Section */}
      <section className="relative px-6 py-12 md:py-24 flex flex-col items-start overflow-hidden lg:flex-row lg:items-center lg:gap-12">
        <div className="absolute top-0 right-0 w-96 h-96 bg-primary/10 blur-[120px] -z-10"></div>
        
        <div className="flex-1 space-y-6">
          <h2 
            className="font-headline text-4xl sm:text-5xl lg:text-7xl font-bold leading-[1.1] tracking-tight text-on-surface"
            dangerouslySetInnerHTML={{ __html: homeContent.heroTitle || '开启未来的<br /><span className="text-gradient">视界 Matrix</span>' }}
          />
          <p className="font-body text-on-surface-variant text-lg lg:text-xl leading-relaxed max-w-xl">
            {homeContent.heroSubtitle || '通过 AIGC 重新定义数字影像。我们将人类的情感与神经计算相结合，打造跨越维度的奇迹。'}
          </p>
        </div>

        {/* Video Placeholder Card */}
        <div className="mt-12 lg:mt-0 flex-1 w-full aspect-video rounded-3xl overflow-hidden relative surface-container shadow-2xl group border border-white/5">
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent z-10"></div>
          <img
            className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105"
            alt="Futuristic cinematic video frame"
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuBVnsilofkLdu_UD0gMLpFa3FNesRCTduuMzvnsGe_-j8w0_DokWrqAjjcXqBefYFRO7iOHZGs8glunqVrLuxr28k0_pGIDT54wDOoVF0bhUNVukujHNiqIJlbtqhTm-DqbVvqONvOhaKqsEscnFkcLWfH_SMHF-59Bh6jBqGaczV0boqSCmytchNdYPthBVQ53rS_86d8YTvrnxY3bDsDUYJX7OI3eXu9nv8niQv3H8hGyz_0VTKpABpHUHv7ZDuQO-B302O_0K44"
          />
          <div className="absolute bottom-6 left-6 z-20 flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-secondary/20 backdrop-blur-md flex items-center justify-center border border-secondary/30 shadow-[0_0_20px_rgba(83,237,252,0.2)]">
              <PlayCircle className="text-secondary w-6 h-6" />
            </div>
            <div>
              <span className="font-label text-[10px] tracking-[0.2em] uppercase text-secondary/60 block mb-0.5">Neural Stream</span>
              <span className="font-headline font-bold text-lg text-secondary">Ethereal Segment 01</span>
            </div>
          </div>
        </div>
      </section>

      {/* Core Business Areas */}
      <section className="px-6 py-12 relative group/carousel">
        <div className="flex items-end justify-between mb-8">
          <h3 className="font-headline text-2xl font-bold text-on-surface tracking-tight">核心业务领域</h3>
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
                      src={item.coverImage}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-surface-container-low via-transparent to-transparent"></div>
                    {item.icon && (
                      <div className="absolute bottom-3 right-3 w-12 h-12 rounded-xl bg-surface-container-low/90 backdrop-blur-sm flex items-center justify-center border border-white/10">
                        <div dangerouslySetInnerHTML={{ __html: item.icon }} className={`w-6 h-6 ${item.color || 'text-primary'}`} />
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
                      src={item.img}
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
                  src={work.img}
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
                  <span className="px-2 py-0.5 rounded-sm bg-black/40 border border-white/10 text-white/50 text-[9px] font-label uppercase tracking-[0.2em]">
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
      <Modal 
        isOpen={!!selectedItem} 
        onClose={() => setSelectedItem(null)} 
        onShare={(!selectedItem || 'name' in selectedItem) ? undefined : handleShare}
      >
        {selectedItem && (
          <div className="flex flex-col h-full relative">
            <div className={`absolute top-0 left-0 w-full h-64 ${selectedItem.bgGlow || 'bg-primary/20'} blur-[80px] -z-10 opacity-50`}></div>
            <div className="relative aspect-video shrink-0 bg-black">
              {('videoUrl' in selectedItem && selectedItem.videoUrl) ? (
                <video 
                  src={selectedItem.videoUrl as string} 
                  className="w-full h-full object-cover"
                  autoPlay
                  loop
                  muted
                  playsInline
                  controls
                />
              ) : (
                <>
                  <img 
                    src={('coverImage' in selectedItem ? selectedItem.coverImage : selectedItem.img) || 'https://neeko-copilot.bytedance.net/api/text_to_image?prompt=professional%20digital%20art%20studio%20logo&image_size=square'} 
                    alt={('name' in selectedItem ? selectedItem.name : selectedItem.title)} 
                    className="w-full h-full object-cover" 
                  />
                  {('type' in selectedItem && selectedItem.type === 'video') && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                      <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/30">
                        <Play className="text-white w-8 h-8 ml-1" />
                      </div>
                    </div>
                  )}
                </>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-surface-container-low via-surface-container-low/20 to-transparent pointer-events-none"></div>
            </div>
            <div className="p-6 flex-1 flex flex-col -mt-8 relative z-10">
              <div className="flex items-center gap-2 mb-4">
                <span className={`px-2 py-0.5 rounded-sm bg-black/40 border border-white/10 text-[10px] font-label uppercase tracking-wider ${selectedItem.color || 'text-primary'}`}>
                  {('category' in selectedItem ? selectedItem.category : '核心业务')}
                </span>
                <span className="px-2 py-0.5 rounded-sm bg-black/40 border border-white/10 text-white/70 text-[10px] font-label uppercase tracking-wider">
                  {selectedItem.tag}
                </span>
              </div>
              <h3 className="text-2xl font-headline font-bold text-on-surface mb-6">{('name' in selectedItem ? selectedItem.name : selectedItem.title)}</h3>
              <div className="w-12 h-[1px] bg-white/20 mb-6"></div>
              <p className="text-on-surface-variant leading-relaxed font-body text-sm">
                {('description' in selectedItem ? selectedItem.description : selectedItem.fullDesc)}
              </p>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
