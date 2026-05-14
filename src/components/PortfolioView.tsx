import { useState, useEffect } from 'react';
import { Play } from 'lucide-react';
import { Modal } from './Modal';
import { isWeChat, copyToClipboard, setupWeChatShare, injectWeChatSDK } from '../lib/shareUtils';
import { ShareHint } from './WeChatShareHint';

const categories = ['全部作品', 'AI 数字人定制', '电影级 AI 制作', '社交平台短视频 AI', '神经网络技术栈'];

const portfolioItems = [
  {
    id: 1,
    title: 'Neon Avatar：实时数字孪生',
    category: 'AI 数字人定制',
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
    id: 2,
    title: '矩阵回响：电影视觉革命',
    category: '电影级 AI 制作',
    tag: '4K UHD',
    shortDesc: '利用 AI 赋能影视工业，实现传统流程无法企及的震撼叙事。',
    fullDesc: '该项目深度整合了 AI 预可视化与智能特效合成。通过自研的视觉引擎，我们能够在几小时内生成以往需要数周完成的复杂特效场景。全片采用 4K 解析度，展现了 AI 在高动态范围下的极致色彩表现力。',
    img: 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?q=80&w=2025&auto=format&fit=crop',
    videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-futuristic-city-with-neon-lights-and-flying-cars-34535-large.mp4',
    type: 'video',
    color: 'text-primary',
    bgGlow: 'bg-primary/20'
  },
  {
    id: 3,
    title: '流量密码：短视频爆发矩阵',
    category: '社交平台短视频 AI',
    tag: '内容爆发',
    shortDesc: '智能捕捉社媒热点，自动化生成高点击率的爆款短视频。',
    fullDesc: '针对 TikTok、快手、抖音等平台优化的一站式内容引擎。系统会自动分析当日热搜词条，并基于此生成匹配的视觉素材、脚本与配音。在为期一个月的测试中，该项目助力客户账号实现了 300% 的粉丝增长率。',
    img: 'https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?q=80&w=1974&auto=format&fit=crop',
    type: 'image',
    color: 'text-tertiary',
    bgGlow: 'bg-tertiary/20'
  },
  {
    id: 4,
    title: '多维张量：神经技术引擎',
    category: '神经网络技术栈',
    tag: '底层逻辑',
    shortDesc: '可视化神经网络的运行逻辑，展示 AI 底层的算力美学。',
    fullDesc: '这是一个将神经网络层级结构转化为艺术视觉的科普性项目。通过实时渲染 Transformer 架构中的注意力机制转移，我们让原本晦涩的数学逻辑通过流动的粒子与光线变得直观可感。',
    img: 'https://images.unsplash.com/photo-1639322537228-f710d846310a?q=80&w=2032&auto=format&fit=crop',
    type: 'image',
    color: 'text-secondary-fixed-dim',
    bgGlow: 'bg-secondary/20'
  }
];

export function PortfolioView() {
  const [activeCategory, setActiveCategory] = useState('全部作品');
  const [selectedItem, setSelectedItem] = useState<typeof portfolioItems[0] | null>(null);
  const [isWeChatHintVisible, setIsWeChatHintVisible] = useState(false);

  // Initial deep link detection
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const id = params.get('id');
    if (id) {
      const item = portfolioItems.find(p => p.id.toString() === id);
      if (item) {
        setSelectedItem(item);
      }
    }
    injectWeChatSDK();
  }, []);

  // Update URL on selection
  useEffect(() => {
    const url = new URL(window.location.href);
    if (selectedItem) {
      url.searchParams.set('id', selectedItem.id.toString());
    } else {
      url.searchParams.delete('id');
    }
    window.history.replaceState({}, '', url.toString());

    // Update WeChat share metadata if selected
    if (selectedItem) {
      setupWeChatShare({
        title: selectedItem.title,
        desc: selectedItem.category,
        link: url.toString(),
        imgUrl: selectedItem.img
      });
    }
  }, [selectedItem]);

  const handleShare = async () => {
    if (!selectedItem) return;
    
    const shareUrl = window.location.href;
    const copied = await copyToClipboard(shareUrl);

    if (copied) {
      setIsWeChatHintVisible(true);
    }
  };

  const filteredItems = activeCategory === '全部作品' 
    ? portfolioItems 
    : portfolioItems.filter(item => item.category === activeCategory);

  return (
    <div className="pt-20 pb-32 lg:pb-12">
      <ShareHint 
        isVisible={isWeChatHintVisible} 
        onClose={() => setIsWeChatHintVisible(false)} 
        mode={isWeChat() ? 'wechat' : 'default'}
      />
      
      {/* Category Filter */}
      <div className="sticky top-[64px] z-40 bg-[#0c0e14]/80 backdrop-blur-md py-6 border-b border-white/5">
        <div className="flex overflow-x-auto hide-scrollbar px-6 gap-3 max-w-7xl mx-auto">
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setActiveCategory(category)}
              className={`whitespace-nowrap px-6 py-2.5 rounded-full font-label text-xs tracking-widest uppercase transition-all duration-300 ${
                activeCategory === category
                  ? 'bg-primary text-on-primary shadow-[0_0_20px_rgba(186,158,255,0.3)]'
                  : 'bg-surface-container text-on-surface-variant hover:text-on-surface border border-white/5'
              }`}
            >
              {category}
            </button>
          ))}
        </div>
      </div>

      {/* Portfolio Grid */}
      <div className="px-6 py-12 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 auto-rows-[280px]">
          {filteredItems.map((item, index) => {
            // Bento Grid spanning logic
            const isLarge = index === 0;
            const isWide = index === 1;
            const isSmall = index === 2 || index === 3;
            
            const bentoClasses = isLarge 
              ? 'lg:col-span-2 lg:row-span-2' 
              : isWide 
                ? 'lg:col-span-2 lg:row-span-1'
                : 'lg:col-span-1 lg:row-span-1';

            return (
              <article 
                key={item.id}
                onClick={() => setSelectedItem(item)}
                className={`group relative overflow-hidden rounded-3xl bg-surface-container-low/40 shadow-2xl transition-all duration-700 hover:-translate-y-2 cursor-pointer border border-white/5 backdrop-blur-sm ${bentoClasses}`}
              >
                {/* Visual Background */}
                <div className="absolute inset-0 z-0">
                  <img
                    alt={item.title}
                    className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105 opacity-60 group-hover:opacity-80"
                    src={item.img}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0c0e14] via-[#0c0e14]/40 to-transparent" />
                  <div className={`absolute inset-0 opacity-0 group-hover:opacity-20 transition-opacity duration-700 ${item.bgGlow}`} />
                </div>

                {/* Card Content Overlay */}
                <div className="relative z-10 w-full h-full p-8 flex flex-col justify-end">
                  {/* Floating Play Button */}
                  {item.type === 'video' && (
                    <div className="absolute top-6 right-6 translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-500">
                      <div className="bg-primary/20 backdrop-blur-xl p-4 rounded-2xl border border-primary/30 shadow-[0_0_30px_rgba(186,158,255,0.2)]">
                        <Play className="text-primary w-5 h-5 fill-current" />
                      </div>
                    </div>
                  )}

                  <div className="space-y-4">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`px-2.5 py-1 rounded-lg bg-black/40 backdrop-blur-md border border-white/10 text-[9px] font-label uppercase tracking-[0.25em] ${item.color}`}>
                        {item.category}
                      </span>
                      <span className="px-2.5 py-1 rounded-lg bg-white/5 backdrop-blur-md border border-white/10 text-white/40 text-[9px] font-label uppercase tracking-[0.25em]">
                        {item.tag}
                      </span>
                    </div>

                    <div>
                      <h3 className={`font-headline font-bold tracking-tight text-on-surface transition-all duration-500 group-hover:text-primary ${isLarge ? 'text-4xl leading-tight' : 'text-2xl'}`}>
                        {item.title}
                      </h3>
                      <p className={`text-on-surface-variant font-body mt-3 leading-relaxed opacity-0 -translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-700 delay-100 line-clamp-2 ${isLarge ? 'text-lg' : 'text-sm'}`}>
                        {item.shortDesc}
                      </p>
                    </div>
                    
                    {/* Decorative Bottom Bar */}
                    <div className="w-0 group-hover:w-12 h-[2px] bg-primary transition-all duration-700 ease-out" />
                  </div>
                </div>

                {/* Subtle Interactive Borders */}
                <div className="absolute inset-0 border border-white/5 group-hover:border-primary/20 transition-colors duration-700 pointer-events-none rounded-3xl" />
              </article>
            );
          })}
        </div>
      </div>

      {/* Artistic Footer Text */}
      <footer className="px-8 py-12 text-center relative overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[1px] bg-gradient-to-r from-transparent via-primary/30 to-transparent"></div>
        <p className="font-body italic text-xs sm:text-sm opacity-80 leading-relaxed text-gradient whitespace-nowrap">
          介绍已经结束了，但是我们的故事才刚开始......
        </p>
      </footer>

      {/* Portfolio Detail Modal */}
      <Modal isOpen={!!selectedItem} onClose={() => setSelectedItem(null)} onShare={handleShare}>
        {selectedItem && (
          <div className="flex flex-col h-full relative">
            <div className={`absolute top-0 left-0 w-full h-64 ${selectedItem.bgGlow} blur-[80px] -z-10 opacity-50`}></div>
            <div className="relative aspect-video shrink-0 bg-black">
              {selectedItem.videoUrl ? (
                <video 
                  src={selectedItem.videoUrl} 
                  className="w-full h-full object-cover"
                  autoPlay
                  loop
                  muted
                  playsInline
                  controls
                />
              ) : (
                <>
                  <img src={selectedItem.img} alt={selectedItem.title} className="w-full h-full object-cover" />
                  {selectedItem.type === 'video' && (
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
                <span className={`px-2 py-0.5 rounded-sm bg-black/40 border border-white/10 text-[10px] font-label uppercase tracking-wider ${selectedItem.color}`}>
                  {selectedItem.category}
                </span>
                <span className="px-2 py-0.5 rounded-sm bg-black/40 border border-white/10 text-white/70 text-[10px] font-label uppercase tracking-wider">
                  {selectedItem.tag}
                </span>
              </div>
              <h3 className="text-2xl font-headline font-bold text-on-surface mb-6">{selectedItem.title}</h3>
              <div className="w-12 h-[1px] bg-white/20 mb-6"></div>
              <p className="text-on-surface-variant leading-relaxed font-body text-sm">
                {selectedItem.fullDesc}
              </p>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
