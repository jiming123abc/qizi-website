import { useEffect, useState } from 'react';
import { FileImage, Video, Tag, TrendingUp, Download, RefreshCcw } from 'lucide-react';
import { 
  getPortfolioItems, 
  getCategories, 
  getCategoriesWithDetails, 
  getTeamMembers,
  getHomeContent 
} from '../../data/store';

export function Dashboard() {
  const [stats, setStats] = useState({
    portfolioCount: 0,
    imageCount: 0,
    videoCount: 0,
    categoryCount: 0
  });
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);

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

  const handleExportData = async () => {
    setIsExporting(true);
    try {
      const [portfolioItems, categoriesDetails, teamMembers, homeContent] = await Promise.all([
        getPortfolioItems(),
        getCategoriesWithDetails(),
        getTeamMembers(),
        getHomeContent()
      ]);

      const exportData = {
        version: '1.0.0',
        exportDate: new Date().toISOString(),
        data: {
          portfolioItems,
          categoriesDetails,
          teamMembers,
          homeContent
        }
      };

      const dataStr = JSON.stringify(exportData, null, 2);
      const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
      
      const exportFileName = `qizi-portfolio-backup-${new Date().toISOString().split('T')[0]}.json`;
      
      const linkElement = document.createElement('a');
      linkElement.setAttribute('href', dataUri);
      linkElement.setAttribute('download', exportFileName);
      linkElement.click();
      
      alert('数据导出成功！');
    } catch (error) {
      console.error('Export failed:', error);
      alert('导出失败，请重试');
    } finally {
      setIsExporting(false);
    }
  };

  const handleImportData = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    try {
      const text = await file.text();
      const importData = JSON.parse(text);
      
      if (!importData.data || !importData.version) {
        alert('无效的备份文件格式！');
        return;
      }

      const confirmed = confirm(
        `此操作将覆盖现有数据：\n` +
        `- ${importData.data.portfolioItems?.length || 0} 个作品\n` +
        `- ${importData.data.categoriesDetails?.length || 0} 个分类\n` +
        `- ${importData.data.teamMembers?.length || 0} 个团队成员\n` +
        `- 首页内容\n\n` +
        `确定要导入吗？此操作不可撤销！`
      );

      if (!confirmed) return;

      const response = await fetch('/api/data/import', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(importData.data)
      });

      if (response.ok) {
        alert('数据导入成功！页面将刷新。');
        window.location.reload();
      } else {
        alert('导入失败，请重试');
      }
    } catch (error) {
      console.error('Import failed:', error);
      alert('导入失败：无效的文件格式或数据');
    } finally {
      setIsImporting(false);
      e.target.value = '';
    }
  };

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
          <h3 className="font-headline font-bold text-on-surface">数据管理</h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
          <button
            onClick={handleExportData}
            disabled={isExporting}
            className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-secondary/20 border border-secondary/30 text-secondary hover:bg-secondary/30 transition-colors disabled:opacity-50"
          >
            {isExporting ? (
              <RefreshCcw className="w-4 h-4 animate-spin" />
            ) : (
              <Download className="w-4 h-4" />
            )}
            {isExporting ? '正在导出...' : '导出数据备份'}
          </button>
          <label className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-surface border border-white/10 text-on-surface hover:bg-surface-container cursor-pointer transition-colors disabled:opacity-50">
            <RefreshCcw className="w-4 h-4" />
            {isImporting ? '正在导入...' : '导入数据备份'}
            <input
              type="file"
              accept=".json"
              onChange={handleImportData}
              disabled={isImporting}
              className="hidden"
            />
          </label>
        </div>
        <p className="text-on-surface-variant text-sm">
          您可以通过左侧菜单管理案例和分类。点击"案例管理"可以添加、编辑或删除作品案例。
        </p>
      </div>
    </div>
  );
}