import { Home, Users, Sparkles, Film } from 'lucide-react';

type Tab = 'home' | 'team' | 'services' | 'portfolio';

interface DesktopSidebarProps {
  activeTab: Tab;
  onTabChange: (tab: Tab) => void;
}

export function DesktopSidebar({ activeTab, onTabChange }: DesktopSidebarProps) {
  const menuItems = [
    { id: 'home', label: '首页', icon: Home },
    { id: 'team', label: '团队', icon: Users },
    { id: 'services', label: '服务', icon: Sparkles },
    { id: 'portfolio', label: '案例', icon: Film },
  ];

  return (
    <aside className="hidden md:flex flex-col fixed left-0 top-0 h-full w-20 lg:w-64 bg-[#0c0e14] border-r border-[#ba9eff]/10 z-50 pt-20">
      <div className="flex flex-col gap-2 px-3 lg:px-6">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          
          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id as Tab)}
              className={`flex items-center gap-4 p-3 lg:px-4 lg:py-3.5 rounded-xl transition-all duration-300 group relative ${
                isActive 
                  ? 'bg-primary/10 text-primary shadow-[0_0_20px_rgba(186,158,255,0.05)]' 
                  : 'text-on-surface-variant hover:text-on-surface hover:bg-white/5'
              }`}
            >
              <Icon className={`w-6 h-6 shrink-0 transition-transform ${isActive ? 'scale-110' : 'group-hover:scale-110'}`} />
              <span className="hidden lg:block font-headline font-bold text-sm tracking-wide">
                {item.label}
              </span>
              {isActive && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-primary rounded-r-full shadow-[0_0_10px_var(--color-primary)]" />
              )}
            </button>
          );
        })}
      </div>

      <div className="mt-auto p-6 hidden lg:block">
        <div className="p-4 rounded-2xl surface-container-low border border-outline-variant/10">
          <p className="text-[10px] font-label text-outline uppercase tracking-widest mb-2">Septem Ethereal</p>
          <p className="text-xs text-on-surface-variant leading-relaxed italic">
            "Neural aesthetics and cinematic visions."
          </p>
        </div>
      </div>
    </aside>
  );
}
