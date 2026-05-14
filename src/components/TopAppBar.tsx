import React, { useState } from 'react';
import { Search, X } from 'lucide-react';

interface TopAppBarProps {
  onSearch?: (query: string) => void;
}

export function TopAppBar({ onSearch }: TopAppBarProps) {
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim() && onSearch) {
      onSearch(searchQuery.trim());
      setIsSearchOpen(false);
      setSearchQuery('');
    }
  };

  return (
    <header className="sticky top-0 w-full z-50 bg-[#0c0e14]/80 backdrop-blur-xl border-b border-[#ba9eff]/15 flex items-center justify-between px-6 h-16 shadow-[0_0_15px_rgba(186,158,255,0.08)]">
      <div className="flex items-center flex-1 min-w-0 pr-4">
        <h1 className="font-headline tracking-tight text-base sm:text-lg font-bold bg-gradient-to-r from-violet-400 to-fuchsia-400 bg-clip-text text-transparent truncate">
          柒子视界 Septem Ethereal Vision
        </h1>
      </div>
      
      <div className="relative flex items-center">
        {isSearchOpen ? (
          <form 
            onSubmit={handleSearchSubmit}
            className="absolute right-0 top-1/2 -translate-y-1/2 flex items-center bg-surface-container-high border border-outline-variant/30 rounded-full px-3 py-1.5 w-48 sm:w-64 animate-in fade-in slide-in-from-right-4 duration-200"
          >
            <Search className="w-4 h-4 text-on-surface-variant mr-2 shrink-0" />
            <input 
              type="text"
              autoFocus
              placeholder="搜索作品或服务..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-transparent border-none outline-none text-sm text-on-surface w-full placeholder:text-on-surface-variant/50"
            />
            <button 
              type="button"
              onClick={() => setIsSearchOpen(false)}
              className="text-on-surface-variant hover:text-on-surface ml-1 shrink-0"
            >
              <X className="w-4 h-4" />
            </button>
          </form>
        ) : (
          <button 
            onClick={() => setIsSearchOpen(true)}
            className="text-slate-400 hover:text-white active:scale-95 duration-200 flex-shrink-0"
          >
            <Search className="w-6 h-6" />
          </button>
        )}
      </div>
    </header>
  );
}

