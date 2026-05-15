import { useState, useEffect } from 'react';
import { Plus, Trash2, ChevronUp, ChevronDown, AlertCircle, Check, GripVertical } from 'lucide-react';
import {
  getPortfolioItems,
  getFeaturedWorks,
  addFeaturedWork,
  removeFeaturedWork,
  saveFeaturedWorks,
  PortfolioItem,
  FeaturedWork
} from '../../data/store';

export function FeaturedAdmin() {
  const [portfolioItems, setPortfolioItems] = useState<PortfolioItem[]>([]);
  const [featuredWorks, setFeaturedWorks] = useState<FeaturedWork[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [draggedItem, setDraggedItem] = useState<string | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  useEffect(() => {
    refreshData();
  }, []);

  const refreshData = () => {
    setPortfolioItems(getPortfolioItems());
    setFeaturedWorks(getFeaturedWorks());
  };

  const getFeaturedPortfolioItems = (): (PortfolioItem & { featuredId: string; sortOrder: number })[] => {
    return featuredWorks
      .map(fw => {
        const item = portfolioItems.find(pi => pi.id === fw.portfolioId);
        if (item) {
          return { ...item, featuredId: fw.id, sortOrder: fw.sortOrder };
        }
        return null;
      })
      .filter((item): item is PortfolioItem & { featuredId: string; sortOrder: number } => item !== null)
      .sort((a, b) => a.sortOrder - b.sortOrder);
  };

  const getAvailableItems = () => {
    const featuredIds = featuredWorks.map(fw => fw.portfolioId);
    return portfolioItems.filter(item => !featuredIds.includes(item.id));
  };

  const handleAddFeatured = (portfolioId: number) => {
    addFeaturedWork(portfolioId);
    refreshData();
    setShowAddModal(false);
  };

  const handleRemoveFeatured = (featuredId: string) => {
    if (confirm('确定要从精选中移除这个作品吗？')) {
      removeFeaturedWork(featuredId);
      refreshData();
    }
  };

  const handleMoveUp = (featuredId: string) => {
    const works = [...featuredWorks];
    const index = works.findIndex(w => w.id === featuredId);
    if (index > 0) {
      const temp = works[index];
      works[index] = works[index - 1];
      works[index - 1] = temp;
      works.forEach((w, i) => {
        w.sortOrder = i + 1;
      });
      saveFeaturedWorks(works);
      setFeaturedWorks(works);
    }
  };

  const handleMoveDown = (featuredId: string) => {
    const works = [...featuredWorks];
    const index = works.findIndex(w => w.id === featuredId);
    if (index < works.length - 1) {
      const temp = works[index];
      works[index] = works[index + 1];
      works[index + 1] = temp;
      works.forEach((w, i) => {
        w.sortOrder = i + 1;
      });
      saveFeaturedWorks(works);
      setFeaturedWorks(works);
    }
  };

  const handleDragStart = (e: React.DragEvent, featuredId: string) => {
    setDraggedItem(featuredId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    setDragOverIndex(index);
  };

  const handleDrop = (e: React.DragEvent, targetIndex: number) => {
    e.preventDefault();
    if (!draggedItem) return;

    const works = [...featuredWorks];
    const draggedIndex = works.findIndex(w => w.id === draggedItem);
    
    if (draggedIndex !== targetIndex) {
      const draggedWork = works.splice(draggedIndex, 1)[0];
      works.splice(targetIndex, 0, draggedWork);
      works.forEach((w, i) => {
        w.sortOrder = i + 1;
      });
      saveFeaturedWorks(works);
      setFeaturedWorks(works);
    }

    setDraggedItem(null);
    setDragOverIndex(null);
  };

  const handleDragEnd = () => {
    setDraggedItem(null);
    setDragOverIndex(null);
  };

  const featuredItems = getFeaturedPortfolioItems();
  const availableItems = getAvailableItems();

  return (
    <div className="p-8">
      <header className="flex items-center justify-between mb-8">
        <div>
          <h2 className="font-headline text-2xl font-bold text-on-surface">精选作品管理</h2>
          <p className="text-on-surface-variant mt-1">管理首页展示的精选作品，支持拖放排序调整</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-on-primary hover:bg-primary/90 transition-colors"
        >
          <Plus className="w-4 h-4" />
          添加精选
        </button>
      </header>

      <div className="bg-surface-container rounded-2xl border border-white/5 shadow-lg overflow-hidden">
        {featuredItems.length > 0 ? (
          <div className="p-4 sm:p-6">
            <div className="grid gap-2 sm:gap-3">
              {featuredItems.map((item, index) => (
                <div
                  key={item.featuredId}
                  draggable
                  onDragStart={(e) => handleDragStart(e, item.featuredId)}
                  onDragOver={(e) => handleDragOver(e, index)}
                  onDrop={(e) => handleDrop(e, index)}
                  onDragEnd={handleDragEnd}
                  className={`flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4 p-3 sm:p-4 rounded-xl border transition-all cursor-grab active:cursor-grabbing ${
                    dragOverIndex === index
                      ? 'bg-primary/10 border-primary/30'
                      : 'bg-surface-container-low border-white/5 hover:border-white/10'
                  } ${draggedItem === item.featuredId ? 'opacity-50' : ''}`}
                >
                  <div className="flex items-center gap-2">
                    <div className="p-2 rounded-lg text-on-surface-variant hover:text-primary hover:bg-primary/10 transition-colors cursor-grab active:cursor-grabbing">
                      <GripVertical className="w-4 h-4" />
                    </div>
                    <button
                      onClick={() => handleMoveUp(item.featuredId)}
                      disabled={item.sortOrder === 1}
                      className="p-1.5 rounded-lg text-on-surface-variant hover:text-primary hover:bg-primary/10 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                      <ChevronUp className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleMoveDown(item.featuredId)}
                      disabled={item.sortOrder === featuredItems.length}
                      className="p-1.5 rounded-lg text-on-surface-variant hover:text-primary hover:bg-primary/10 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                      <ChevronDown className="w-4 h-4" />
                    </button>
                  </div>

                  <span className="w-8 h-8 flex items-center justify-center rounded-lg bg-primary/20 text-primary text-sm font-medium">
                    {item.sortOrder}
                  </span>

                  <img
                    src={item.img}
                    alt={item.title}
                    className="w-14 h-14 rounded-lg object-cover"
                  />

                  <div className="flex-1 min-w-0">
                    <div className="font-headline font-medium text-on-surface truncate">
                      {item.title}
                    </div>
                    <div className="text-xs text-on-surface-variant">
                      {item.category}
                    </div>
                  </div>

                  <button
                    onClick={() => handleRemoveFeatured(item.featuredId)}
                    className="p-2 rounded-lg text-on-surface-variant hover:text-error hover:bg-error/10 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-16">
            <AlertCircle className="w-12 h-12 text-on-surface-variant mb-4" />
            <p className="text-on-surface-variant">暂无精选作品</p>
            <button
              onClick={() => setShowAddModal(true)}
              className="mt-4 px-4 py-2 rounded-xl bg-primary text-on-primary hover:bg-primary/90 transition-colors"
            >
              添加第一个精选作品
            </button>
          </div>
        )}
      </div>

      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-surface-container rounded-2xl border border-white/10 shadow-xl w-full max-w-md overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
              <h3 className="font-headline font-semibold text-on-surface">添加精选作品</h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-1 rounded-lg text-on-surface-variant hover:text-on-surface hover:bg-white/5 transition-colors"
              >
                <span className="text-xl">&times;</span>
              </button>
            </div>

            <div className="p-6 max-h-80 overflow-y-auto">
              {availableItems.length > 0 ? (
                <div className="space-y-2">
                  {availableItems.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => handleAddFeatured(item.id)}
                      className="w-full flex items-center gap-3 p-3 rounded-xl bg-surface-container-low border border-white/5 hover:border-primary/50 transition-colors text-left"
                    >
                      <img
                        src={item.img}
                        alt={item.title}
                        className="w-10 h-10 rounded-lg object-cover"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="font-headline font-medium text-on-surface truncate">
                          {item.title}
                        </div>
                        <div className="text-xs text-on-surface-variant">
                          {item.category}
                        </div>
                      </div>
                      <div className="w-6 h-6 rounded-full border-2 border-primary/30 flex items-center justify-center">
                        <Check className="w-3 h-3 text-primary" />
                      </div>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <AlertCircle className="w-8 h-8 text-on-surface-variant mx-auto mb-2" />
                  <p className="text-on-surface-variant">所有作品都已添加到精选</p>
                </div>
              )}
            </div>

            <div className="px-6 py-4 border-t border-white/10">
              <button
                onClick={() => setShowAddModal(false)}
                className="w-full px-6 py-3 rounded-xl bg-surface-container border border-white/10 text-on-surface-variant hover:text-on-surface transition-colors"
              >
                关闭
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}