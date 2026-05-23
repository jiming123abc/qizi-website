/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { TopAppBar } from './components/TopAppBar';
import { BottomNavBar } from './components/BottomNavBar';
import { DesktopSidebar } from './components/DesktopSidebar';
import { HomeView } from './components/HomeView';
import { TeamView } from './components/TeamView';
import { ServicesView } from './components/ServicesView';
import { PortfolioView } from './components/PortfolioView';
import { SearchView } from './components/SearchView';
import { AdminLayout } from './components/admin/AdminLayout';
import { Dashboard } from './components/admin/Dashboard';
import { PortfolioAdmin } from './components/admin/PortfolioAdmin';
import { CategoriesAdmin } from './components/admin/CategoriesAdmin';
import { FeaturedAdmin } from './components/admin/FeaturedAdmin';
import { HomeContentAdmin } from './components/admin/HomeContentAdmin';
import { TeamAdmin } from './components/admin/TeamAdmin';
import { Login } from './components/admin/Login';
import { Settings } from 'lucide-react';
import { setupShareMetadata } from './lib/shareUtils';
import { getHomeContent } from './data/store';

type Tab = 'home' | 'team' | 'services' | 'portfolio' | 'search';
type AdminTab = 'dashboard' | 'portfolio' | 'categories' | 'featured' | 'home' | 'team';

const ADMIN_PASSWORD = 'admin123';

export default function App() {
  const [activeTab, setActiveTab] = useState<Tab>('home');
  const [searchQuery, setSearchQuery] = useState('');
  const [isAdminMode, setIsAdminMode] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [adminTab, setAdminTab] = useState<AdminTab>('dashboard');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const id = params.get('id');
    if (id) {
      // 对于分享链接，始终跳转到 portfolio 页面，
      // 因为 PortfolioView 可以处理所有类型的作品 ID
      setActiveTab('portfolio');
    }

    const admin = params.get('admin');
    if (admin === 'true') {
      setIsAdminMode(true);
    }
  }, []);

  useEffect(() => {
    const loadHomeContent = async () => {
      try {
        const homeContent = await getHomeContent();
        const defaultImage = homeContent.heroImage || '/images/hero-home.png';
        
        setupShareMetadata({
          title: homeContent.shareTitle || '大连柒子文化发展有限公司',
          desc: homeContent.shareDescription || '诚信立足 创新致远',
          link: window.location.href,
          imgUrl: defaultImage
        });
      } catch (error) {
        console.error('Failed to load home content:', error);
      }
    };
    
    loadHomeContent();
  }, [activeTab]);

  // 标签页切换时自动滚动回顶部
  useEffect(() => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  }, [activeTab]);

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    setActiveTab('search');
  };

  const handleLogin = (password: string): boolean => {
    if (password === ADMIN_PASSWORD) {
      setIsLoggedIn(true);
      return true;
    }
    return false;
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setIsAdminMode(false);
    const url = new URL(window.location.href);
    url.searchParams.delete('admin');
    window.history.replaceState({}, '', url.toString());
  };

  const handleCancelLogin = () => {
    setIsAdminMode(false);
    const url = new URL(window.location.href);
    url.searchParams.delete('admin');
    window.history.replaceState({}, '', url.toString());
  };

  const navTab = activeTab === 'search' ? 'home' : activeTab;

  if (isAdminMode) {
    if (!isLoggedIn) {
      return <Login onLogin={handleLogin} onCancel={handleCancelLogin} />;
    }

    return (
      <AdminLayout 
        activeTab={adminTab} 
        onTabChange={setAdminTab}
        onLogout={handleLogout}
      >
        {adminTab === 'dashboard' && <Dashboard />}
        {adminTab === 'home' && <HomeContentAdmin />}
        {adminTab === 'portfolio' && <PortfolioAdmin />}
        {adminTab === 'featured' && <FeaturedAdmin />}
        {adminTab === 'categories' && <CategoriesAdmin />}
        {adminTab === 'team' && <TeamAdmin />}
      </AdminLayout>
    );
  }

  return (
    <div className="flex min-h-screen bg-background">
      <DesktopSidebar activeTab={navTab} onTabChange={setActiveTab} />
      
      <div className="flex flex-col flex-1 min-w-0 md:ml-20 lg:ml-64">
        <TopAppBar onSearch={handleSearch} />
        
        <main className="flex-grow">
          <div className="max-w-7xl mx-auto w-full">
            {activeTab === 'home' && <HomeView />}
            {activeTab === 'team' && <TeamView />}
            {activeTab === 'services' && <ServicesView />}
            {activeTab === 'portfolio' && <PortfolioView />}
            {activeTab === 'search' && <SearchView query={searchQuery} />}
          </div>
        </main>

        <div className="md:hidden">
          <BottomNavBar activeTab={navTab} onTabChange={setActiveTab} />
        </div>

        <button
          onClick={() => {
            setIsAdminMode(true);
            const url = new URL(window.location.href);
            url.searchParams.set('admin', 'true');
            window.history.replaceState({}, '', url.toString());
          }}
          className="hidden md:flex fixed bottom-6 right-6 p-3 rounded-full bg-primary text-on-primary shadow-lg hover:bg-primary/90 transition-all hover:scale-110 z-50"
          title="管理后台"
        >
          <Settings className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}