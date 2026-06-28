import { useState } from 'react';
import { 
  LayoutDashboard, 
  FolderOpen, 
  Tag, 
  LogOut, 
  Menu,
  X,
  ChevronRight,
  Star,
  Home,
  Users,
  HardDrive
} from 'lucide-react';

type AdminTab = 'dashboard' | 'portfolio' | 'categories' | 'featured' | 'home' | 'team' | 'storage';

interface AdminLayoutProps {
  activeTab: AdminTab;
  onTabChange: (tab: AdminTab) => void;
  onLogout: () => void;
  children: React.ReactNode;
}

const menuItems: { id: AdminTab; label: string; icon: React.ReactNode }[] = [
  { id: 'dashboard', label: '仪表盘', icon: <LayoutDashboard className="w-5 h-5" /> },
  { id: 'home', label: '首页内容', icon: <Home className="w-5 h-5" /> },
  { id: 'portfolio', label: '案例管理', icon: <FolderOpen className="w-5 h-5" /> },
  { id: 'featured', label: '精选作品', icon: <Star className="w-5 h-5" /> },
  { id: 'categories', label: '分类管理', icon: <Tag className="w-5 h-5" /> },
  { id: 'team', label: '团队管理', icon: <Users className="w-5 h-5" /> },
  { id: 'storage', label: '存储管理', icon: <HardDrive className="w-5 h-5" /> }
];

export function AdminLayout({ activeTab, onTabChange, onLogout, children }: AdminLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  return (
    <div className="min-h-screen bg-surface-container-low">
      <aside 
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-surface-container transform transition-transform duration-300 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        <div className="flex flex-col h-full overflow-y-auto hide-scrollbar">
          <div className="p-6 border-b border-white/10">
            <h1 className="font-headline text-xl font-bold text-primary">管理后台</h1>
            <p className="text-xs text-on-surface-variant mt-1">AI Studio Dashboard</p>
          </div>
          
          <nav className="flex-1 p-4 space-y-1">
            {menuItems.map((item) => (
              <button
                key={item.id}
                onClick={() => onTabChange(item.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                  activeTab === item.id
                    ? 'bg-primary/20 text-primary border border-primary/30'
                    : 'text-on-surface-variant hover:text-on-surface hover:bg-white/5'
                }`}
              >
                {item.icon}
                <span className="font-label text-sm">{item.label}</span>
                {activeTab === item.id && <ChevronRight className="w-4 h-4 ml-auto" />}
              </button>
            ))}
          </nav>

          <div className="p-4 border-t border-white/10">
            <button
              onClick={onLogout}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-on-surface-variant hover:text-error hover:bg-error/10 transition-all duration-200"
            >
              <LogOut className="w-5 h-5" />
              <span className="font-label text-sm">退出登录</span>
            </button>
          </div>
        </div>
      </aside>

      {sidebarOpen && (
        <button
          onClick={() => setSidebarOpen(false)}
          className="fixed top-4 left-68 z-50 p-2 rounded-lg bg-surface-container border border-white/10 text-on-surface-variant hover:text-on-surface md:hidden"
        >
          <X className="w-5 h-5" />
        </button>
      )}

      <button
        onClick={() => setSidebarOpen(true)}
        className="fixed top-4 left-4 z-50 p-2 rounded-lg bg-surface-container border border-white/10 text-on-surface-variant hover:text-on-surface md:hidden"
      >
        <Menu className="w-5 h-5" />
      </button>

      <main className="md:ml-64 min-h-screen">
        {children}
      </main>
    </div>
  );
}