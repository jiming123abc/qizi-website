import { useEffect, useState } from 'react';
import { FileImage, Video, Tag, TrendingUp } from 'lucide-react';
import { getPortfolioItems, getCategories } from '../../data/store';

export function Dashboard() {
  const [stats, setStats] = useState({
    portfolioCount: 0,
    imageCount: 0,
    videoCount: 0,
    categoryCount: 0
  });

  useEffect(() => {
    const loadData = async () => {
      try {
        const [items, categories] = await Promise.all([
          getPortfolioItems(),
          getCategories()
        ]);
        setStats({
          portfolioCount: items.length,
          imageCount: items.filter(i => i.type === 'image').length,
          videoCount: items.filter(i => i.type === 'video').length,
          categoryCount: categories.length
        });
      } catch (error) {
        console.error('Failed to load dashboard data:', error);
      }
    };
    
    loadData();
  }, []);

  const statCards = [
    { 
      title: '案例总数', 
      value: stats.portfolioCount, 
      icon: <FileImage className="w-6 h-6" />,
      color: 'text-primary',
      bgColor: 'bg-primary/10'
    },
    { 
      title: '图片案例', 
      value: stats.imageCount, 
      icon: <FileImage className="w-6 h-6" />,
      color: 'text-secondary',
      bgColor: 'bg-secondary/10'
    },
    { 
      title: '视频案例', 
      value: stats.videoCount, 
      icon: <Video className="w-6 h-6" />,
      color: 'text-tertiary',
      bgColor: 'bg-tertiary/10'
    },
    { 
      title: '分类数量', 
      value: stats.categoryCount, 
      icon: <Tag className="w-6 h-6" />,
      color: 'text-secondary-fixed-dim',
      bgColor: 'bg-secondary/10'
    }
  ];

  return (
    <div className="p-8">
      <header className="mb-8">
        <h2 className="font-headline text-3xl font-bold text-on-surface">仪表盘</h2>
        <p className="text-on-surface-variant mt-2">欢迎回来！查看您的内容统计概览。</p>
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((card) => (
          <div 
            key={card.title}
            className="p-6 rounded-2xl bg-surface-container border border-white/5 shadow-lg"
          >
            <div className={`w-12 h-12 rounded-xl ${card.bgColor} flex items-center justify-center mb-4 ${card.color}`}>
              {card.icon}
            </div>
            <div className="text-3xl font-headline font-bold text-on-surface mb-1">
              {card.value}
            </div>
            <div className="text-sm text-on-surface-variant">{card.title}</div>
          </div>
        ))}
      </div>

      <div className="mt-8 p-6 rounded-2xl bg-surface-container border border-white/5 shadow-lg">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="w-5 h-5 text-primary" />
          <h3 className="font-headline font-bold text-on-surface">最近更新</h3>
        </div>
        <p className="text-on-surface-variant text-sm">
          您可以通过左侧菜单管理案例和分类。点击"案例管理"可以添加、编辑或删除作品案例。
        </p>
      </div>
    </div>
  );
}