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

type Tab = 'home' | 'team' | 'services' | 'portfolio' | 'search';

export default function App() {
  const [activeTab, setActiveTab] = useState<Tab>('home');
  const [searchQuery, setSearchQuery] = useState('');

  // Handle direct sharing links
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const id = params.get('id');
    if (id) {
      // If the ID looks like a portfolio item ID (simple number) or a featured work ID (starts with fw)
      if (id.startsWith('fw')) {
        setActiveTab('home');
      } else {
        setActiveTab('portfolio');
      }
    }
  }, []);

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    setActiveTab('search');
  };

  const navTab = activeTab === 'search' ? 'home' : activeTab;

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
      </div>
    </div>
  );
}

