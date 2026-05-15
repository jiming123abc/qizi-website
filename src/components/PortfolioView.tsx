import { useState, useEffect } from 'react';
import { Play } from 'lucide-react';
import { Modal } from './Modal';
import { isWeChat, copyToClipboard, setupShareMetadata } from '../lib/shareUtils';
import { ShareHint } from './WeChatShareHint';
import { getPortfolioItems, getCategories, getHomeContent, PortfolioItem } from '../data/store';

export function PortfolioView() {
  const [activeCategory, setActiveCategory] = useState('全部作品');
  const [selectedItem, setSelectedItem] = useState<PortfolioItem | null>(null);
  const [items, setItems] = useState<PortfolioItem[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [defaultImage, setDefaultImage] = useState('');

  useEffect(() => {
    setItems(getPortfolioItems());
    setCategories(getCategories().map(c => c.name));
    const homeContent = getHomeContent();
    setDefaultImage(homeContent.hero?.cover || '');
  }, []);

  useEffect(() => {
    setItems(getPortfolioItems());
  }, []);
  const [isWeChatHintVisible, setIsWeChatHintVisible] = useState(false);

  // Initial deep link detection
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const id = params.get('id');
    if (id) {
      const item = items.find(p => p.id.toString() === id);
      if (item) {
        setSelectedItem(item);
      }
    }
  }, [items]);

  // Update URL on selection
  useEffect(() => {
    const url = new URL(window.location.href);
    if (selectedItem) {
      url.searchParams.set('id', selectedItem.id.toString());
    } else {
      url.searchParams.delete('id');
    }
    window.history.replaceState({}, '', url.toString());

    // Update share metadata if selected
    if (selectedItem) {
      setupShareMetadata({
        title: selectedItem.title,
        desc: selectedItem.shortDesc || selectedItem.fullDesc || selectedItem.category,
        link: url.toString(),
        imgUrl: selectedItem.img
      });
    } else {
      // Restore default share metadata when closing
      setupShareMetadata({
        title: '大连柒子文化发展有限公司',
        desc: '诚信立足 创新致远',
        link: url.toString(),
        imgUrl: defaultImage
      });
    }
  }, [selectedItem, defaultImage]);

  const handleShare = async () => {
    if (!selectedItem) return;
    
    const shareUrl = window.location.href;
    const copied = await copyToClipboard(shareUrl);

    if (copied) {
      setIsWeChatHintVisible(true);
    }
  };

  const filteredItems = activeCategory === '全部作品' 
    ? items 
    : items.filter(item => item.category === activeCategory);

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
