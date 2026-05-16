import { useState, useEffect } from 'react';
import { MessageSquare, Bot, Code2, Clapperboard, ImagePlay, AudioLines } from 'lucide-react';
import { Modal } from './Modal';
import { getCategoriesWithDetails, CategoryWithDetails } from '../data/store';

const techStack = [
  {
    id: 'ts1',
    title: 'Gemini 1.5 Pro',
    category: '大语言模型 (LLM)',
    icon: MessageSquare,
    color: 'text-blue-400',
  },
  {
    id: 'ts2',
    title: 'Coze / Dify',
    category: '智能体 (Agents)',
    icon: Bot,
    color: 'text-emerald-400',
  },
  {
    id: 'ts3',
    title: 'Cursor',
    category: '全栈 AI 开发',
    icon: Code2,
    color: 'text-purple-400',
  },
  {
    id: 'ts4',
    title: 'Seedance',
    category: '文生视频',
    icon: Clapperboard,
    color: 'text-rose-400',
  },
  {
    id: 'ts5',
    title: 'Kling / Luma',
    category: '图生视频',
    icon: ImagePlay,
    color: 'text-orange-400',
  },
  {
    id: 'ts6',
    title: 'Suno / Udio',
    category: '音频生成',
    icon: AudioLines,
    color: 'text-cyan-400',
  }
];

export function ServicesView() {
  const [selectedItem, setSelectedItem] = useState<CategoryWithDetails | null>(null);
  const [categories, setCategories] = useState<CategoryWithDetails[]>([]);

  useEffect(() => {
    const loadData = async () => {
      try {
        const cats = await getCategoriesWithDetails();
        setCategories(cats);
      } catch (error) {
        console.error('Failed to load categories:', error);
      }
    };
    loadData();
  }, []);

  return (
    <div className="pt-20 pb-28 lg:pb-12 px-6 space-y-16">
      {/* Hero Section / Title */}
      <section className="mt-4 mb-10">
        <h2 className="font-headline text-4xl md:text-5xl font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary">
          核心业务矩阵 Matrix
        </h2>
        <p className="text-on-surface-variant mt-3 font-label uppercase tracking-[0.3em] text-[10px]">Service Core Functional Matrix</p>
      </section>

      {/* Services Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {categories.length > 0 ? (
          categories.map((service) => (
            <section key={service.id} className="relative group cursor-pointer" onClick={() => setSelectedItem(service)}>
              <div className="rounded-2xl overflow-hidden bg-surface-container-low border border-outline-variant/10 shadow-2xl transition-all duration-500 hover:shadow-primary/5 active:scale-[0.98]">
                <div className="h-64 lg:h-80 relative overflow-hidden">
                  <img
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000"
                    alt={service.name}
                    src={service.coverImage}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-surface via-surface/20 to-transparent" />
                </div>
                <div className="p-8 glass-panel relative">
                  <div className="absolute -top-10 right-8 w-16 h-16 rounded-2xl bg-surface-container shadow-xl flex items-center justify-center border border-white/5 group-hover:scale-110 transition-transform">
                    {service.icon ? (
                      <div dangerouslySetInnerHTML={{ __html: service.icon }} className={`w-8 h-8 ${service.color || 'text-primary'}`} />
                    ) : (
                      <span className="text-2xl">🎯</span>
                    )}
                  </div>
                  <div className="pr-16">
                    <h3 className="font-headline text-2xl font-bold text-on-surface mb-4">{service.name}</h3>
                    <p className="font-body text-on-surface-variant text-sm leading-relaxed line-clamp-3">
                      {service.description}
                    </p>
                  </div>
                </div>
              </div>
            </section>
          ))
        ) : (
          <div className="col-span-full text-center py-12">
            <p className="text-on-surface-variant">暂无服务内容</p>
          </div>
        )}
      </div>

      {/* Tech Stack Section / Title */}
      <section className="mt-16 mb-8">
        <h2 className="font-headline text-3xl font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-secondary to-tertiary">
          前沿技术栈
        </h2>
        <p className="text-on-surface-variant mt-2 font-label uppercase tracking-widest text-xs">AI Technology Stack</p>
      </section>

      {/* Tech Stack List */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        {techStack.map((tech) => (
          <div key={tech.id} className="flex items-center gap-3 p-4 rounded-xl surface-container-low border border-outline-variant/10 shadow-sm hover:bg-white/5 transition-colors">
            <div className={`p-2.5 rounded-lg bg-black/20 ${tech.color}`}>
              <tech.icon className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-headline font-bold text-on-surface text-sm">{tech.title}</h4>
              <p className="font-body text-[10px] sm:text-xs text-on-surface-variant mt-0.5">{tech.category}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Footer Ending */}
      <footer className="px-8 py-12 text-center relative overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[1px] bg-gradient-to-r from-transparent via-primary/30 to-transparent"></div>
        <p className="font-body italic text-xs sm:text-sm opacity-80 leading-relaxed text-gradient whitespace-nowrap">
          介绍已经结束了，但是我们的故事才刚开始......
        </p>
      </footer>

      {/* Detail Modal - 与首页一致 */}
      <Modal isOpen={!!selectedItem} onClose={() => setSelectedItem(null)}>
        {selectedItem && (
          <div className="flex flex-col h-full relative">
            <div className={`absolute top-0 left-0 w-full h-64 ${selectedItem.bgGlow || 'bg-primary/20'} blur-[80px] -z-10 opacity-50`}></div>
            <div className="relative aspect-video shrink-0 bg-black">
              <img 
                src={selectedItem.coverImage} 
                alt={selectedItem.name} 
                className="w-full h-full object-cover" 
              />
              <div className="absolute inset-0 bg-gradient-to-t from-surface-container-low via-surface-container-low/20 to-transparent pointer-events-none"></div>
            </div>
            <div className="p-6 flex-1 flex flex-col -mt-8 relative z-10">
              <h3 className="text-2xl font-headline font-bold text-on-surface mb-6">{selectedItem.name}</h3>
              <div className="w-12 h-[1px] bg-white/20 mb-6"></div>
              <p className="text-on-surface-variant leading-relaxed font-body text-sm">
                {selectedItem.description}
              </p>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}