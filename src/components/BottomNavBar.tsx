import { Home, Users, Sparkles, Film } from 'lucide-react';

type Tab = 'home' | 'team' | 'services' | 'portfolio';

interface BottomNavBarProps {
  activeTab: Tab;
  onTabChange: (tab: Tab) => void;
}

export function BottomNavBar({ activeTab, onTabChange }: BottomNavBarProps) {
  return (
    <nav className="fixed bottom-0 left-0 w-full flex h-20 px-2 pb-safe bg-[#000000]/90 backdrop-blur-2xl border-t border-[#ba9eff]/10 z-50 rounded-t-2xl shadow-[0_-10px_30px_rgba(186,158,255,0.05)]">
      <button
        onClick={() => onTabChange('home')}
        className={`flex-1 flex flex-col items-center justify-center transition-all duration-500 active:scale-90 ${
          activeTab === 'home'
            ? "text-[#53ddfc] after:content-[''] after:w-1 after:h-1 after:bg-[#53ddfc] after:rounded-full after:mt-1 after:shadow-[0_0_8px_#53ddfc]"
            : 'text-[#e5e4ed]/40 hover:text-[#ba9eff]'
        }`}
      >
        <Home className="w-6 h-6 mb-1" />
        <span className="font-label text-[10px] uppercase tracking-[0.05em]">首页</span>
      </button>

      <button
        onClick={() => onTabChange('team')}
        className={`flex-1 flex flex-col items-center justify-center transition-all duration-500 active:scale-90 ${
          activeTab === 'team'
            ? "text-[#53ddfc] after:content-[''] after:w-1 after:h-1 after:bg-[#53ddfc] after:rounded-full after:mt-1 after:shadow-[0_0_8px_#53ddfc]"
            : 'text-[#e5e4ed]/40 hover:text-[#ba9eff]'
        }`}
      >
        <Users className="w-6 h-6 mb-1" />
        <span className="font-label text-[10px] uppercase tracking-[0.05em]">团队</span>
      </button>

      <button
        onClick={() => onTabChange('services')}
        className={`flex-1 flex flex-col items-center justify-center transition-all duration-500 active:scale-90 ${
          activeTab === 'services'
            ? "text-[#53ddfc] after:content-[''] after:w-1 after:h-1 after:bg-[#53ddfc] after:rounded-full after:mt-1 after:shadow-[0_0_8px_#53ddfc]"
            : 'text-[#e5e4ed]/40 hover:text-[#ba9eff]'
        }`}
      >
        <Sparkles className="w-6 h-6 mb-1" />
        <span className="font-label text-[10px] uppercase tracking-[0.05em]">服务</span>
      </button>

      <button
        onClick={() => onTabChange('portfolio')}
        className={`flex-1 flex flex-col items-center justify-center transition-all duration-500 active:scale-90 ${
          activeTab === 'portfolio'
            ? "text-[#53ddfc] after:content-[''] after:w-1 after:h-1 after:bg-[#53ddfc] after:rounded-full after:mt-1 after:shadow-[0_0_8px_#53ddfc]"
            : 'text-[#e5e4ed]/40 hover:text-[#ba9eff]'
        }`}
      >
        <Film className="w-6 h-6 mb-1" />
        <span className="font-label text-[10px] uppercase tracking-[0.05em]">案例</span>
      </button>
    </nav>
  );
}

