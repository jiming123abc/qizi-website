import { useState } from 'react';
import { Play } from 'lucide-react';
import { Modal } from './Modal';

interface SearchViewProps {
  query: string;
}

const mockSearchResults = [
  {
    id: 'sr1',
    title: 'AI 虚拟主播定制',
    shortDesc: '数字人服务',
    fullDesc: '为企业提供专属的 AI 虚拟主播定制服务，支持多语言、多情感表达，适用于电商直播、新闻播报等多种场景。',
    img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAp92O6UL9Vz2Y49V1pDeEaHSG60rc7Qo0WxFOSNdnZ73WECUQxvok_Ljw0_eu88WCkDV-V1ps4GTjXG3logkuhu09jLkfHqQYGHg_vJ-SMzQadM4e6BMeBUvEgw3PaYreuk82SU0Pnt_2khipWe-DYxJSnoAW4XnjO_zJ1nBef9ytJKr67OXcOAbe8AKYp-a0zRYLKCa7MU-6dPBgSKa0CJYiegBYWzWBjzaP3PuzL-jhC1Qx9GmekBCcE_EuCfPOtX8FQ2V6DND8',
    category: '搜索结果',
    tag: '数字人',
    color: 'text-primary',
    bgGlow: 'bg-primary/20',
    type: 'image'
  },
  {
    id: 'sr2',
    title: '赛博朋克城市漫游',
    shortDesc: '影视特效案例',
    fullDesc: '利用虚幻引擎 5 与 AI 生成技术，打造的沉浸式赛博朋克城市视觉体验，展现极致的光影与细节。',
    img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAXfGF8h37RLZLjq1_gKcrFMxqFCOyJHjC7rtsKs5RRbNiRYktJ4SBIFoG1NQzSYQp1x3yzfWsv1qiCGMa6YrYBxsFMd4IPJ245CLmsfINYTmldUSImlWfxX5U4CeK_ZUxMLAgBGD7akKrGseKv9xmMVfa0ucravPW__iN_PTS4akvPJfpL6QwkX4tNcdn-FJBUYVvp0iwyAqJcGclQIbdiZpj13UqP556I84X_k0KStbdozBgXzFKTUqapEybz3PvXm4g2rp4BXkk',
    category: '搜索结果',
    tag: '影视制作',
    color: 'text-secondary',
    bgGlow: 'bg-secondary/20',
    type: 'video'
  },
  {
    id: 'sr3',
    title: '智能短视频矩阵',
    shortDesc: '自动化营销',
    fullDesc: '一键生成多平台适配的短视频内容矩阵，结合 AI 爆款文案与智能剪辑，大幅提升内容产出效率。',
    img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAQW5T_kIPPyvA0MArzCohp-Lvna6zFt2XVq_gvZQ9jAyCvDOHGl99kNivu9epZvRpRWEXnN7TDAcQvv0NMC9QlFNvKpjyjJVILsEgBhiLoltlUxxpxSIXTNl6mpd0z5J2Xww-y-tk1nAtx3PAAR9WZ82tRv3Pv4mTUCy56Oj-EbcPF4Iy7CNrZaDQJBOBZrrJ4agMu0RAI16RW8axFEwxgMZuI8t6czAeuzsQYFKbLW0JBNus9PBl2Lvq3KzxuHRvBFWhA-q9VsOo',
    category: '搜索结果',
    tag: '短视频',
    color: 'text-tertiary',
    bgGlow: 'bg-tertiary/20',
    type: 'image'
  }
];

export function SearchView({ query }: SearchViewProps) {
  const [selectedItem, setSelectedItem] = useState<typeof mockSearchResults[0] | null>(null);

  return (
    <main className="pt-20 pb-28 px-6">
      <div className="mb-8">
        <h2 className="font-headline text-2xl font-bold text-on-surface mb-2">搜索结果</h2>
        <p className="font-body text-on-surface-variant text-sm">
          关于 <span className="text-primary font-bold">"{query}"</span> 的相关内容
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        {mockSearchResults.map((result) => (
          <div 
            key={result.id}
            onClick={() => setSelectedItem(result)}
            className="relative group cursor-pointer rounded-xl overflow-hidden surface-container-low border border-outline-variant/10 shadow-xl transition-transform active:scale-95"
          >
            <div className="aspect-video relative">
              <img
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                alt={result.title}
                src={result.img}
              />
              {result.type === 'video' && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-12 h-12 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center border border-white/20">
                    <Play className="text-white w-5 h-5 ml-1" />
                  </div>
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-surface via-transparent to-transparent"></div>
            </div>
            <div className="p-5 glass-panel">
              <span className={`font-label text-[10px] tracking-widest uppercase mb-2 block ${result.color}`}>
                {result.shortDesc}
              </span>
              <h4 className="font-headline text-lg font-bold text-on-surface mb-2">{result.title}</h4>
              <p className="font-body text-on-surface-variant text-xs leading-relaxed line-clamp-2">
                {result.fullDesc}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Detail Modal */}
      <Modal isOpen={!!selectedItem} onClose={() => setSelectedItem(null)}>
        {selectedItem && (
          <div className="flex flex-col h-full relative">
            <div className={`absolute top-0 left-0 w-full h-64 ${selectedItem.bgGlow} blur-[80px] -z-10 opacity-50`}></div>
            <div className="relative aspect-video shrink-0">
              <img src={selectedItem.img} alt={selectedItem.title} className="w-full h-full object-cover" />
              {selectedItem.type === 'video' && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                  <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/30">
                    <Play className="text-white w-8 h-8 ml-1" />
                  </div>
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-surface-container-low via-surface-container-low/20 to-transparent"></div>
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
    </main>
  );
}
