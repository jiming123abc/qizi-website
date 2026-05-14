import { useState } from 'react';
import { Modal } from './Modal';

const teamMembers = [
  {
    id: 1,
    name: 'Aris Vane',
    role: 'Chief Architect',
    shortDesc: 'Neural network optimization and ethereal render engine lead.',
    fullDesc: 'Aris Vane is the visionary behind the Septem Ethereal Engine. With a background in quantum computing and neural aesthetics, Aris bridges the gap between raw data and cinematic beauty. His work focuses on optimizing generative models to run with near-zero latency while maintaining 8K resolution fidelity. He previously led the AI graphics division at a top-tier tech firm before founding Septem.',
    img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBI1wLmLAavWwY3sjC6VvvnHv7Z-TOXQQAti5URfUduUmhgIZN5oP6jzt9G7hgjKoUAZ3KM2VnBM8YHS7cLvSVd58U9K27-iH9y_5EZKDmhQDu3BoyoJSZ7pUNDSjzLDHH-7eg_c9Joe-Hzc66htw_tbBcJepN2ohMibJ4SwTaJfQh-iHrL9nBC_6j9P8XE_Q75ucsbOet99h4DQXzbfKvfYQgDWzEImpfhySOQuoMp93xQrGNg_b6D6fU7kHhfuE6DlRV_BVnbkW8',
    color: 'text-primary',
    bgGlow: 'bg-primary/20'
  },
  {
    id: 2,
    name: 'Kaelen Thorne',
    role: 'Visual Director',
    shortDesc: 'Mastermind behind the cinematic aesthetic of Septem Vision.',
    fullDesc: 'Kaelen Thorne brings over a decade of experience in Hollywood VFX and digital cinematography. At Septem, Kaelen ensures that every AI-generated frame adheres to strict cinematic principles—from lighting and composition to color grading. Kaelen\'s unique approach blends traditional film theory with cutting-edge neural rendering.',
    img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuC1GdXuj4dFpNkePTtOpw7nSbzX_T-pdq7KAN270cZTwWFiykDjInCUjZopaRQB_14SeKcZqkjfMqeNeGCh5mtIA5WnSl3-Y5ygw4FopihOIv9ONvtU1Ti4Qy7qQ4hiW9yIVnAPwlJCzoKtBhFvXFa3stdrU3aoFBpgYodb2k_VCtEJ044PlzX23gHxVGrdss2-WWVpwDVB-VT4SAw7AsX8KcxHJGTnLRj90AMnCwCxix-lFW9dZv10aidhwnDS-3v3jeha-XmMBSs',
    color: 'text-secondary',
    bgGlow: 'bg-secondary/20'
  },
  {
    id: 3,
    name: 'Soren Jinx',
    role: 'AI Strategist',
    shortDesc: 'Directing the evolution of generative models for narrative flow.',
    fullDesc: 'Soren Jinx focuses on the narrative capabilities of AI. By fine-tuning large language models and multimodal systems, Soren creates AI agents capable of generating coherent, emotionally resonant storyboards and scripts. Soren\'s research pushes the boundaries of how machines understand and replicate human storytelling.',
    img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBOQG4oEscoDTBKYA2bdCfjet5PJvLzkPYu8eRRrxB_fRamIVilSSHS1ROD-tMQqpxce4b0dlD8jXdSU0xMl4yr38lZOQrtw6sbai5-ilaZ5n_SdGIk2-Hmg6zTL3FurRhz_I15KmIq5EpHTao9HkE1v-tpNjc6NqSLcV7dMsCdQXeTTHdnwuL0JXZsuionTaAOTKfnDsDp8QRAXM7mOyG7iLz4yd27mjMvHUdBsvsfcuETC7vO_2lDG1BdR9p3OsDpElwDb_u_ZUQ',
    color: 'text-tertiary',
    bgGlow: 'bg-tertiary/20'
  },
  {
    id: 4,
    name: 'Elena Ross',
    role: 'Fluid Dynamics',
    shortDesc: 'Expert in digital atmospheric effects and particle systems.',
    fullDesc: 'Elena Ross is the wizard behind the ethereal particles, smoke, and fluid simulations that give Septem\'s visuals their signature look. Leveraging AI to predict fluid behavior, Elena creates hyper-realistic atmospheric effects that would traditionally take days to render, achieving them in real-time.',
    img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDOvvhfCyWH2_JgmDHVYpAMLDUM0qtFHntKzaMQTC8rrG_NPLjGlfRNdr3p_apTOnZ1wNRaIO7EHg6tqGtgGpYrxVQBJKUwYYsIDOsIT1IsM9HLrtuagCQeFcCrAYkBCMBmiHEkBS-ymq3SInArlfqQe5ZHgrdknhizEwBsL5yY7N-2de8GgObO4go0DXxRA0aY4FyeSwT9UXbusN7KGSMtu73ZJEPfooopfz-PliXD-T4ue7sMGuUvpKaYV2zC_oF81BGwz4vGeC8',
    color: 'text-primary-dim',
    bgGlow: 'bg-primary-dim/20'
  }
];

export function TeamView() {
  const [selectedMember, setSelectedMember] = useState<typeof teamMembers[0] | null>(null);

  return (
    <div className="flex-grow pt-20 pb-32 lg:pb-12 px-6 space-y-16">
      {/* High-Impact Hero Header */}
      <section className="relative pt-6 md:pt-12">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-[100px] -z-10"></div>
        <div className="max-w-3xl space-y-8">
          <h2 className="text-4xl md:text-6xl font-headline font-black tracking-tighter leading-[1.1] holographic-text">
            重塑现实的<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-secondary to-tertiary">想象力建筑师 Matrix</span>
          </h2>
          <div className="border-l-4 border-primary/30 pl-6 py-2">
            <p className="text-on-surface-variant font-body text-base md:text-lg leading-relaxed italic max-w-xl">
              通过人类引导的神经合成技术，跨越原始计算与电影诗学之间的鸿沟。我们不仅仅在处理数据，我们是在通过像素编织梦境。
            </p>
          </div>
        </div>
      </section>

      {/* Team Members Section */}
      <section className="space-y-8">
        <div className="flex items-end justify-between border-b border-white/10 pb-4">
          <div>
            <h3 className="text-2xl font-headline font-bold tracking-tight">核心成员 Corps</h3>
            <p className="text-on-surface-variant font-label text-[10px] tracking-widest mt-1 uppercase opacity-50">The Visionary Core Team</p>
          </div>
          <span className="font-label text-[10px] text-outline hidden md:block">SELECT TO EXPLORE PROTOCOL</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
          {teamMembers.map((member) => (
            <button
              key={member.id}
              onClick={() => setSelectedMember(member)}
              className="w-full text-left group relative bg-surface-container-low rounded-2xl overflow-hidden border border-white/5 flex h-48 transition-all hover:bg-white/5 active:scale-[0.98]"
            >
              <div className="w-2/5 h-full relative overflow-hidden">
                <img
                  alt={member.name}
                  className="w-full h-full object-cover grayscale brightness-75 group-hover:grayscale-0 group-hover:scale-110 transition-all duration-700"
                  src={member.img}
                />
                <div className="absolute inset-0 bg-gradient-to-r from-transparent to-surface-container-low" />
              </div>
              <div className="w-3/5 p-6 flex flex-col justify-center space-y-2">
                <p className={`font-label text-[10px] tracking-[0.2em] uppercase ${member.color}`}>
                  {member.role}
                </p>
                <h4 className="text-xl font-headline font-bold text-on-surface group-hover:text-primary transition-colors">{member.name}</h4>
                <p className="text-xs text-on-surface-variant leading-relaxed line-clamp-3">
                  {member.shortDesc}
                </p>
              </div>
            </button>
          ))}
        </div>
      </section>

      {/* Evolution Timeline */}
      <section className="space-y-8">
        <h3 className="text-xl font-headline font-bold tracking-tight">团队研发历程</h3>
        <div className="relative pl-8 space-y-10">
          {/* Timeline Thread */}
          <div className="absolute left-[3px] top-0 bottom-0 w-[2px] bg-gradient-to-b from-primary via-secondary to-transparent"></div>

          {/* 2022 */}
          <div className="relative">
            <div className="absolute -left-[32px] top-1.5 w-4 h-4 rounded-full bg-background border-2 border-primary shadow-[0_0_10px_rgba(186,158,255,0.5)]"></div>
            <div className="space-y-1">
              <span className="font-headline font-bold text-primary tracking-tighter text-sm">2022</span>
              <h5 className="text-on-surface font-medium">起子计：起源共鸣</h5>
              <p className="text-xs text-on-surface-variant">The initial seed of Septem was planted, exploring neural-driven aesthetics.</p>
            </div>
          </div>

          {/* 2023 */}
          <div className="relative">
            <div className="absolute -left-[32px] top-1.5 w-4 h-4 rounded-full bg-background border-2 border-secondary shadow-[0_0_10px_rgba(83,221,252,0.5)]"></div>
            <div className="space-y-1">
              <span className="font-headline font-bold text-secondary tracking-tighter text-sm">2023</span>
              <h5 className="text-on-surface font-medium">深核扩展：视觉奇点</h5>
              <p className="text-xs text-on-surface-variant">Mainframe expansion and the launch of the first 8K generative sequence.</p>
            </div>
          </div>

          {/* 2024 */}
          <div className="relative">
            <div className="absolute -left-[32px] top-1.5 w-4 h-4 rounded-full bg-background border-2 border-tertiary shadow-[0_0_10px_rgba(236,99,255,0.5)]"></div>
            <div className="space-y-1">
              <span className="font-headline font-bold text-tertiary tracking-tighter text-sm">2024</span>
              <h5 className="text-on-surface font-medium">神经主权：未来矩阵</h5>
              <p className="text-xs text-on-surface-variant">Achieving near-zero latency in neural rendering and cross-platform synergy.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer Text */}
      <footer className="px-8 py-12 text-center relative overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[1px] bg-gradient-to-r from-transparent via-primary/30 to-transparent"></div>
        <p className="font-body italic text-xs sm:text-sm opacity-80 leading-relaxed text-gradient whitespace-nowrap">
          介绍已经结束了，但是我们的故事才刚开始......
        </p>
      </footer>

      {/* Member Detail Modal */}
      <Modal isOpen={!!selectedMember} onClose={() => setSelectedMember(null)}>
        {selectedMember && (
          <div className="flex flex-col h-full relative">
            <div className={`absolute top-0 left-0 w-full h-64 ${selectedMember.bgGlow} blur-[80px] -z-10 opacity-50`}></div>
            <div className="relative h-72 shrink-0">
              <img src={selectedMember.img} alt={selectedMember.name} className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-surface-container-low via-surface-container-low/20 to-transparent"></div>
            </div>
            <div className="p-6 flex-1 flex flex-col -mt-12 relative z-10">
              <h3 className="text-3xl font-headline font-bold text-on-surface mb-1">{selectedMember.name}</h3>
              <p className={`font-label text-xs tracking-widest uppercase mb-6 ${selectedMember.color}`}>
                {selectedMember.role}
              </p>
              <div className="w-12 h-[1px] bg-white/20 mb-6"></div>
              <p className="text-on-surface-variant leading-relaxed font-body text-sm">
                {selectedMember.fullDesc}
              </p>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
