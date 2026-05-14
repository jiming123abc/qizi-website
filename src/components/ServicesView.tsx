import { useState } from 'react';
import { User, Film, Video, Brain, Play, MessageSquare, Bot, Code2, Clapperboard, ImagePlay, AudioLines } from 'lucide-react';
import { Modal } from './Modal';

const services = [
  {
    id: 's1',
    title: 'AI 数字人定制',
    icon: User,
    iconColor: 'text-secondary',
    shortDesc: '基于最前沿的神经网络渲染技术，打造极致逼真的数字孪生与虚拟偶像。支持毫秒级低延迟实时交互，为品牌代言与元宇宙直播提供全链路解决方案。',
    fullDesc: '基于最前沿的神经网络渲染技术，打造极致逼真的数字孪生与虚拟偶像。支持毫秒级低延迟实时交互，为品牌代言与元宇宙直播提供全链路解决方案。',
    img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAp92O6UL9Vz2Y49V1pDeEaHSG60rc7Qo0WxFOSNdnZ73WECUQxvok_Ljw0_eu88WCkDV-V1ps4GTjXG3logkuhu09jLkfHqQYGHg_vJ-SMzQadM4e6BMeBUvEgw3PaYreuk82SU0Pnt_2khipWe-DYxJSnoAW4XnjO_zJ1nBef9ytJKr67OXcOAbe8AKYp-a0zRYLKCa7MU-6dPBgSKa0CJYiegBYWzWBjzaP3PuzL-jhC1Qx9GmekBCcE_EuCfPOtX8FQ2V6DND8',
    category: '核心服务',
    tag: '数字人',
    color: 'text-secondary',
    bgGlow: 'bg-secondary/20'
  },
  {
    id: 's2',
    title: '电影级 AI 制作',
    icon: Film,
    iconColor: 'text-primary',
    shortDesc: '重塑视频工业流程。利用 AI 赋能预可视化、特效合成与智能调色，将传统昂贵的影视工业水准带入全行业，实现高效、震撼的视觉叙事。',
    fullDesc: '重塑视频工业流程。利用 AI 赋能预可视化、特效合成与智能调色，将传统昂贵的影视工业水准带入全行业，实现高效、震撼的视觉叙事。',
    img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuC2oewJ15NnSn9V-GoIKkwxoY1AqBw8HA3aIRrU1pYtGc8y3NfJ8-M-8d_91Wg61pvV2YhhYcKqm8PixFHN_mu4njCl-PlSTzF5MHmTZ7yJ9-sl0HWcg-r81YTI_k6Oe9Q5R1jnOSu2-O7qRmCPFDeBqaf1AShYZgafO4NECgueKISBQ-Ame6ElhnbLFXZFwZ1hovklirx2Tu_DNHMivQzGQ1O4yB9HW3fEHychiTl2rxn7jCE4RpLCoiiOVV4FllQ55626gruZFaM',
    category: '核心服务',
    tag: '影视制作',
    color: 'text-primary',
    bgGlow: 'bg-primary/20'
  },
  {
    id: 's3',
    title: '社交平台短视频 AI',
    icon: Video,
    iconColor: 'text-tertiary',
    shortDesc: '深度理解社交媒体流量密码。智能脚本生成、自动剪辑与爆款元素植入，助您在碎片化时代快速构建高粘性的短视频生态。',
    fullDesc: '深度理解社交媒体流量密码。智能脚本生成、自动剪辑与爆款元素植入，助您在碎片化时代快速构建高粘性的短视频生态。',
    img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAQW5T_kIPPyvA0MArzCohp-Lvna6zFt2XVq_gvZQ9jAyCvDOHGl99kNivu9epZvRpRWEXnN7TDAcQvv0NMC9QlFNvKpjyjJVILsEgBhiLoltlUxxpxSIXTNl6mpd0z5J2Xww-y-tk1nAtx3PAAR9WZ82tRv3Pv4mTUCy56Oj-EbcPF4Iy7CNrZaDQJBOBZrrJ4agMu0RAI16RW8axFEwxgMZuI8t6czAeuzsQYFKbLW0JBNus9PBl2Lvq3KzxuHRvBFWhA-q9VsOo',
    category: '核心服务',
    tag: '短视频',
    color: 'text-tertiary',
    bgGlow: 'bg-tertiary/20'
  },
  {
    id: 's4',
    title: '神经网络技术栈',
    icon: Brain,
    iconColor: 'text-secondary-fixed-dim',
    shortDesc: '自主研发的底层引擎。涵盖 GANs, Diffusion Models 与 Transformer 架构的深度优化，为各类复杂商业场景提供最稳健的底层算力与算法支持。',
    fullDesc: '自主研发的底层引擎。涵盖 GANs, Diffusion Models 与 Transformer 架构的深度优化，为各类复杂商业场景提供最稳健的底层算力与算法支持。',
    img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuD9sPNFE9R6ql6lY5e9KZaO0PSDxjlAiPj22W0-bUUEdp1ZXEe1W-nUX_AXm14HSH01mDUjtaM2h3V8cGxjuy1v7NtABWUVxbcM-TvHE3RJOjFpLdBH3KeCPSF-sNZTVo-p6F2aNpcO7hVsASMZBr6exfJgyMZ2bKSzJZMQzBNXoPUJ3pY5XntB39SEtQX_CHKDEWJjQvqOLe-Ph24m71ztA8xOpu0a_pZvV4aknL7du7cSZ9V2UWqp1N4uhlmS86JZxPVYdn-ijE4',
    category: '核心服务',
    tag: '技术栈',
    color: 'text-secondary-fixed-dim',
    bgGlow: 'bg-secondary/20'
  }
];

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
    title: 'Sora / Runway',
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
  const [selectedItem, setSelectedItem] = useState<typeof services[0] | null>(null);

  return (
    <div className="pt-20 pb-28 lg:pb-12 px-6 space-y-16">
      {/* Hero Section / Title */}
      <section className="mt-4 mb-10">
        <h2 className="font-headline text-4xl md:text-5xl font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary">
          业务核心矩阵 Matrix
        </h2>
        <p className="text-on-surface-variant mt-3 font-label uppercase tracking-[0.3em] text-[10px]">Service Core Functional Matrix</p>
      </section>

      {/* Services Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {services.map((service) => (
          <section key={service.id} className="relative group cursor-pointer" onClick={() => setSelectedItem(service)}>
            <div className="rounded-2xl overflow-hidden bg-surface-container-low border border-outline-variant/10 shadow-2xl transition-all duration-500 hover:shadow-primary/5 active:scale-[0.98]">
              <div className="h-64 lg:h-80 relative overflow-hidden">
                <img
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000"
                  alt={service.title}
                  src={service.img}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-surface via-surface/20 to-transparent" />
              </div>
              <div className="p-8 glass-panel relative">
                <div className="absolute -top-10 right-8 w-16 h-16 rounded-2xl bg-surface-container shadow-xl flex items-center justify-center border border-white/5 group-hover:scale-110 transition-transform">
                  <service.icon className={`${service.iconColor} w-8 h-8`} />
                </div>
                <div className="pr-16">
                  <h3 className="font-headline text-2xl font-bold text-on-surface mb-4">{service.title}</h3>
                  <p className="font-body text-on-surface-variant text-sm leading-relaxed line-clamp-3">
                    {service.shortDesc}
                  </p>
                </div>
              </div>
            </div>
          </section>
        ))}
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

      {/* Detail Modal */}
      <Modal isOpen={!!selectedItem} onClose={() => setSelectedItem(null)}>
        {selectedItem && (
          <div className="flex flex-col h-full relative">
            <div className={`absolute top-0 left-0 w-full h-64 ${selectedItem.bgGlow} blur-[80px] -z-10 opacity-50`}></div>
            <div className="relative aspect-video shrink-0">
              <img src={selectedItem.img} alt={selectedItem.title} className="w-full h-full object-cover" />
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
    </div>
  );
}
