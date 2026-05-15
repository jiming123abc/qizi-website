import { useState, useEffect } from 'react';
import { Modal } from './Modal';
import { getTeamMembers, TeamMember } from '../data/store';

export function TeamView() {
  const [selectedMember, setSelectedMember] = useState<(TeamMember & { fullDesc?: string }) | null>(null);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);

  useEffect(() => {
    setTeamMembers(getTeamMembers());
  }, []);

  const getMemberColor = (index: number) => {
    const colors = ['text-primary', 'text-secondary', 'text-tertiary', 'text-primary-dim'];
    return colors[index % colors.length];
  };

  const getMemberBgGlow = (index: number) => {
    const glows = ['bg-primary/20', 'bg-secondary/20', 'bg-tertiary/20', 'bg-primary-dim/20'];
    return glows[index % glows.length];
  };

  const defaultMembers = [
    {
      id: 1,
      name: 'Aris Vane',
      role: 'Chief Architect',
      bio: 'Neural network optimization and ethereal render engine lead.',
      fullDesc: 'Aris Vane is the visionary behind the Septem Ethereal Engine. With a background in quantum computing and neural aesthetics, Aris bridges the gap between raw data and cinematic beauty. His work focuses on optimizing generative models to run with near-zero latency while maintaining 8K resolution fidelity. He previously led the AI graphics division at a top-tier tech firm before founding Septem.',
      avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBI1wLmLAavWwY3sjC6VvvnHv7Z-TOXQQAti5URfUduUmhgIZN5oP6jzt9G7hgjKoUAZ3KM2VnBM8YHS7cLvSVd58U9K27-iH9y_5EZKDmhQDu3BoyoJSZ7pUNDSjzLDHH-7eg_c9Joe-Hzc66htw_tbBcJepN2ohMibJ4SwTaJfQh-iHrL9nBC_6j9P8XE_Q75ucsbOet99h4DQXzbfKvfYQgDWzEImpfhySOQuoMp93xQrGNg_b6D6fU7kHhfuE6DlRV_BVnbkW8',
      sortOrder: 1
    },
    {
      id: 2,
      name: 'Kaelen Thorne',
      role: 'Visual Director',
      bio: 'Mastermind behind the cinematic aesthetic of Septem Vision.',
      fullDesc: 'Kaelen Thorne brings over a decade of experience in Hollywood VFX and digital cinematography. At Septem, Kaelen ensures that every AI-generated frame adheres to strict cinematic principles—from lighting and composition to color grading. Kaelen\'s unique approach blends traditional film theory with cutting-edge neural rendering.',
      avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuC1GdXuj4dFpNkePTtOpw7nSbzX_T-pdq7KAN270cZTwWFiykDjInCUjZopaRQB_14SeKcZqkjfMqeNeGCh5mtIA5WnSl3-Y5ygw4FopihOIv9ONvtU1Ti4Qy7qQ4hiW9yIVnAPwlJCzoKtBhFvXFa3stdrU3aoFBpgYodb2k_VCtEJ044PlzX23gHxVGrdss2-WWVpwDVB-VT4SAw7AsX8KcxHJGTnLRj90AMnCwCxix-lFW9dZv10aidhwnDS-3v3jeha-XmMBSs',
      sortOrder: 2
    },
    {
      id: 3,
      name: 'Soren Jinx',
      role: 'AI Strategist',
      bio: 'Directing the evolution of generative models for narrative flow.',
      fullDesc: 'Soren Jinx focuses on the narrative capabilities of AI. By fine-tuning large language models and multimodal systems, Soren creates AI agents capable of generating coherent, emotionally resonant storyboards and scripts. Soren\'s research pushes the boundaries of how machines understand and replicate human storytelling.',
      avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBOQG4oEscoDTBKYA2bdCfjet5PJvLzkPYu8eRRrxB_fRamIVilSSHS1ROD-tMQqpxce4b0dlD8jXdSU0xMl4yr38lZOQrtw6sbai5-ilaZ5n_SdGIk2-Hmg6zTL3FurRhz_I15KmIq5EpHTao9HkE1v-tpNjc6NqSLcV7dMsCdQXeTTHdnwuL0JXZsuionTaAOTKfnDsDp8QRAXM7mOyG7iLz4yd27mjMvHUdBsvsfcuETC7vO_2lDG1BdR9p3OsDpElwDb_u_ZUQ',
      sortOrder: 3
    },
    {
      id: 4,
      name: 'Elena Ross',
      role: 'Fluid Dynamics',
      bio: 'Expert in digital atmospheric effects and particle systems.',
      fullDesc: 'Elena Ross is the wizard behind the ethereal particles, smoke, and fluid simulations that give Septem\'s visuals their signature look. Leveraging AI to predict fluid behavior, Elena creates hyper-realistic atmospheric effects that would traditionally take days to render, achieving them in real-time.',
      avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDOvvhfCyWH2_JgmDHVYpAMLDUM0qtFHntKzaMQTC8rrG_NPLjGlfRNdr3p_apTOnZ1wNRaIO7EHg6tqGtgGpYrxVQBJKUwYYsIDOsIT1IsM9HLrtuagCQeFcCrAYkBCMBmiHEkBS-ymq3SInArlfqQe5ZHgrdknhizEwBsL5yY7N-2de8GgObO4go0DXxRA0aY4FyeSwT9UXbusN7KGSMtu73ZJEPfooopfz-PliXD-T4ue7sMGuUvpKaYV2zC_oF81BGwz4vGeC8',
      sortOrder: 4
    }
  ];

  const displayMembers = teamMembers.length > 0 ? teamMembers : defaultMembers;

  return (
    <div className="flex-grow pt-20 pb-32 lg:pb-12 px-6 space-y-16">
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

      <section className="space-y-8">
        <div className="flex items-end justify-between border-b border-white/10 pb-4">
          <div>
            <h3 className="text-2xl font-headline font-bold tracking-tight">核心成员 Corps</h3>
            <p className="text-on-surface-variant font-label text-[10px] tracking-widest mt-1 uppercase opacity-50">The Visionary Core Team</p>
          </div>
          <span className="font-label text-[10px] text-outline hidden md:block">SELECT TO EXPLORE PROTOCOL</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
          {displayMembers.map((member, index) => (
            <button
              key={member.id}
              onClick={() => setSelectedMember({ ...member, fullDesc: defaultMembers.find(m => m.id === member.id)?.fullDesc || '' })}
              className="w-full text-left group relative bg-surface-container-low rounded-2xl overflow-hidden border border-white/5 flex h-48 transition-all hover:bg-white/5 active:scale-[0.98]"
            >
              <div className="w-2/5 h-full relative overflow-hidden">
                <img
                  alt={member.name}
                  className="w-full h-full object-cover grayscale brightness-75 group-hover:grayscale-0 group-hover:scale-110 transition-all duration-700"
                  src={member.avatar}
                />
                <div className="absolute inset-0 bg-gradient-to-r from-transparent to-surface-container-low" />
              </div>
              <div className="w-3/5 p-6 flex flex-col justify-center space-y-2">
                <p className={`font-label text-[10px] tracking-[0.2em] uppercase ${getMemberColor(index)}`}>
                  {member.role}
                </p>
                <h4 className="text-xl font-headline font-bold text-on-surface group-hover:text-primary transition-colors">{member.name}</h4>
                <p className="text-xs text-on-surface-variant leading-relaxed line-clamp-3">
                  {member.bio}
                </p>
              </div>
            </button>
          ))}
        </div>
      </section>

      <section className="space-y-8">
        <h3 className="text-xl font-headline font-bold tracking-tight">团队研发历程</h3>
        <div className="relative pl-8 space-y-10">
          <div className="absolute left-[3px] top-0 bottom-0 w-[2px] bg-gradient-to-b from-primary via-secondary to-transparent"></div>

          <div className="relative">
            <div className="absolute -left-[32px] top-1.5 w-4 h-4 rounded-full bg-background border-2 border-primary shadow-[0_0_10px_rgba(186,158,255,0.5)]"></div>
            <div className="space-y-1">
              <span className="font-headline font-bold text-primary tracking-tighter text-sm">2022</span>
              <h5 className="text-on-surface font-medium">起子计：起源共鸣</h5>
              <p className="text-xs text-on-surface-variant">The initial seed of Septem was planted, exploring neural-driven aesthetics.</p>
            </div>
          </div>

          <div className="relative">
            <div className="absolute -left-[32px] top-1.5 w-4 h-4 rounded-full bg-background border-2 border-secondary shadow-[0_0_10px_rgba(126,255,175,0.5)]"></div>
            <div className="space-y-1">
              <span className="font-headline font-bold text-secondary tracking-tighter text-sm">2023</span>
              <h5 className="text-on-surface font-medium">神经网络：觉醒</h5>
              <p className="text-xs text-on-surface-variant">Development of the proprietary Septem Ethereal Engine commenced.</p>
            </div>
          </div>

          <div className="relative">
            <div className="absolute -left-[32px] top-1.5 w-4 h-4 rounded-full bg-background border-2 border-tertiary shadow-[0_0_10px_rgba(255,214,161,0.5)]"></div>
            <div className="space-y-1">
              <span className="font-headline font-bold text-tertiary tracking-tighter text-sm">2024</span>
              <h5 className="text-on-surface font-medium">量子飞跃：实现</h5>
              <p className="text-xs text-on-surface-variant">First commercial deployments and major studio partnerships established.</p>
            </div>
          </div>

          <div className="relative">
            <div className="absolute -left-[32px] top-1.5 w-4 h-4 rounded-full bg-primary shadow-[0_0_15px_rgba(186,158,255,0.8)] animate-pulse"></div>
            <div className="space-y-1">
              <span className="font-headline font-bold text-primary tracking-tighter text-sm">2025</span>
              <h5 className="text-on-surface font-medium">矩阵演化：未来</h5>
              <p className="text-xs text-on-surface-variant">Continued innovation in real-time neural rendering and AI storytelling.</p>
            </div>
          </div>
        </div>
      </section>

      {selectedMember && (
        <Modal onClose={() => setSelectedMember(null)}>
          <div className="max-w-4xl w-full mx-4">
            <div className="bg-surface-container rounded-3xl overflow-hidden border border-white/10">
              <div className="relative h-64 overflow-hidden">
                <img
                  alt={selectedMember.name}
                  className="w-full h-full object-cover"
                  src={selectedMember.avatar}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-surface-container via-surface-container/50 to-transparent" />
              </div>
              <div className="p-8 -mt-16 relative">
                <p className={`font-label text-[10px] tracking-[0.2em] uppercase ${getMemberColor(displayMembers.findIndex(m => m.id === selectedMember.id) || 0)}`}>
                  {selectedMember.role}
                </p>
                <h3 className="text-3xl font-headline font-bold text-on-surface mt-2">{selectedMember.name}</h3>
                <div className="w-16 h-[2px] bg-gradient-to-r from-primary to-secondary mt-4 rounded-full"></div>
                <p className="text-on-surface-variant font-body leading-relaxed mt-6">
                  {selectedMember.fullDesc || selectedMember.bio}
                </p>
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}