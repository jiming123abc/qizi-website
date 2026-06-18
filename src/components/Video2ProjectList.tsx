import { useState, useEffect, useCallback } from 'react';
import { Plus, Trash2, Share2, Film, HardDrive, ChevronRight, X } from 'lucide-react';
import { setupShareMetadata, copyToClipboard } from '../lib/shareUtils';

interface Project {
  id: number;
  name: string;
  description: string;
  coverUrl?: string;
  sortOrder: number;
  videoCount: number;
  totalSize: number;
  shareUrl: string;
  createdAt: string;
}

function formatSize(bytes: number): string {
  if (!bytes) return '0 B';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function Video2ProjectList() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createName, setCreateName] = useState('');
  const [createDesc, setCreateDesc] = useState('');
  const [createLoading, setCreateLoading] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Project | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  }, []);

  const loadProjects = useCallback(async () => {
    try {
      const res = await fetch('/api/video2/projects');
      const data = await res.json();
      if (data.success) setProjects(data.data);
    } catch (e) {
      console.error('加载项目列表失败:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProjects();

    // 设置页面 meta
    setupShareMetadata({
      title: '柒子文化拍摄辅助',
      desc: '专业的视频拍摄管理工具，帮助团队高效管理拍摄素材',
      link: window.location.href,
      imgUrl: '/images/hero-home.png'
    });
    document.title = '柒子文化拍摄辅助';
  }, [loadProjects]);

  const handleCreate = async () => {
    if (!createName.trim()) return;
    setCreateLoading(true);
    try {
      const res = await fetch('/api/video2/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: createName.trim(), description: createDesc.trim() })
      });
      const data = await res.json();
      if (data.success) {
        setShowCreateModal(false);
        setCreateName('');
        setCreateDesc('');
        await loadProjects();
        showToast('项目创建成功');
      }
    } catch (e) {
      console.error('创建项目失败:', e);
    } finally {
      setCreateLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    try {
      const res = await fetch(`/api/video2/projects/${deleteTarget.id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        setProjects(prev => prev.filter(p => p.id !== deleteTarget.id));
        setDeleteTarget(null);
        showToast('项目已删除');
      }
    } catch (e) {
      console.error('删除项目失败:', e);
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleShare = async (project: Project) => {
    // 设置当前页面 meta
    setupShareMetadata({
      title: project.name,
      desc: project.description || '柒子文化拍摄辅助 · 项目分享',
      link: project.shareUrl,
      imgUrl: project.coverUrl || '/images/hero-home.png'
    });
    // 复制分享链接
    const ok = await copyToClipboard(project.shareUrl);
    showToast(ok ? '分享链接已复制' : '复制失败，请手动复制');
  };

  const handleCardClick = (projectId: number) => {
    window.location.href = `/video2/project/${projectId}`;
  };

  return (
    <div className="min-h-screen bg-background">
      {/* 顶部标题栏 */}
      <header className="sticky top-0 z-20 bg-background/95 backdrop-blur border-b border-border px-4 py-3 flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-foreground">柒子文化拍摄辅助</h1>
          <p className="text-xs text-muted-foreground">{projects.length} 个项目</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-primary text-on-primary text-sm font-medium hover:bg-primary/90 transition-colors"
        >
          <Plus className="w-4 h-4" />
          新建项目
        </button>
      </header>

      {/* 项目网格 */}
      <main className="p-4">
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full" />
          </div>
        ) : projects.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <Film className="w-16 h-16 text-muted-foreground/40 mb-4" />
            <p className="text-muted-foreground mb-2">暂无项目</p>
            <p className="text-sm text-muted-foreground/60">点击上方「新建项目」开始</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {projects.map(project => (
              <div
                key={project.id}
                className="group relative rounded-xl border border-border bg-card overflow-hidden hover:border-primary/50 hover:shadow-md transition-all cursor-pointer"
              >
                {/* 封面区 */}
                <div
                  className="aspect-video relative bg-gradient-to-br from-violet-600/20 to-fuchsia-600/20 flex items-center justify-center"
                  onClick={() => handleCardClick(project.id)}
                >
                  {project.coverUrl ? (
                    <img
                      src={project.coverUrl}
                      alt={project.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <Film className="w-12 h-12 text-muted-foreground/30" />
                  )}
                  {/* 悬浮操作按钮 */}
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    <button
                      onClick={(e) => { e.stopPropagation(); handleShare(project); }}
                      className="p-2 rounded-full bg-white/20 hover:bg-white/30 text-white transition-colors"
                      title="分享"
                    >
                      <Share2 className="w-5 h-5" />
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); setDeleteTarget(project); }}
                      className="p-2 rounded-full bg-red-500/60 hover:bg-red-500/80 text-white transition-colors"
                      title="删除"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                  {/* 进入箭头 */}
                  <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <ChevronRight className="w-6 h-6 text-white" />
                  </div>
                </div>

                {/* 信息区 */}
                <div className="p-3" onClick={() => handleCardClick(project.id)}>
                  <h3 className="font-semibold text-foreground truncate">{project.name}</h3>
                  {project.description && (
                    <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{project.description}</p>
                  )}
                  <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Film className="w-3.5 h-3.5" />
                      {project.videoCount} 个视频
                    </span>
                    <span className="flex items-center gap-1">
                      <HardDrive className="w-3.5 h-3.5" />
                      {formatSize(project.totalSize)}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* 新建项目弹窗 */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setShowCreateModal(false)}>
          <div className="bg-card rounded-xl border border-border w-full max-w-md p-5" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold">新建项目</h2>
              <button onClick={() => setShowCreateModal(false)} className="p-1 rounded hover:bg-muted transition-colors">
                <X className="w-5 h-5 text-muted-foreground" />
              </button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium mb-1">项目名称 *</label>
                <input
                  type="text"
                  value={createName}
                  onChange={e => setCreateName(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleCreate()}
                  placeholder="例如：宣传片拍摄2026"
                  className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">项目描述</label>
                <textarea
                  value={createDesc}
                  onChange={e => setCreateDesc(e.target.value)}
                  placeholder="可选的项目描述"
                  rows={2}
                  className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-4">
              <button
                onClick={() => setShowCreateModal(false)}
                className="px-4 py-2 rounded-lg border border-border text-sm hover:bg-muted transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleCreate}
                disabled={!createName.trim() || createLoading}
                className="px-4 py-2 rounded-lg bg-primary text-on-primary text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
              >
                {createLoading ? '创建中...' : '创建'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 删除确认弹窗 */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setDeleteTarget(null)}>
          <div className="bg-card rounded-xl border border-border w-full max-w-sm p-5" onClick={e => e.stopPropagation()}>
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 rounded-full bg-red-100 text-red-600">
                <Trash2 className="w-5 h-5" />
              </div>
              <h2 className="text-lg font-bold">确认删除项目</h2>
            </div>
            <p className="text-sm text-muted-foreground mb-1">
              确定删除「<strong className="text-foreground">{deleteTarget.name}</strong>」吗？
            </p>
            <p className="text-sm text-muted-foreground mb-1">
              该项目下有 <strong className="text-foreground">{deleteTarget.videoCount}</strong> 个视频，共 <strong className="text-foreground">{formatSize(deleteTarget.totalSize)}</strong>
            </p>
            <p className="text-sm text-red-500 font-medium mb-4">删除后不可恢复，OSS 上的视频文件也会被清理。</p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setDeleteTarget(null)}
                className="px-4 py-2 rounded-lg border border-border text-sm hover:bg-muted transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleDelete}
                disabled={deleteLoading}
                className="px-4 py-2 rounded-lg bg-red-600 text-white text-sm font-medium hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                {deleteLoading ? '删除中...' : '确认删除'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast 提示 */}
      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-full bg-foreground text-background text-sm shadow-lg animate-in fade-in slide-in-from-bottom-2">
          {toast}
        </div>
      )}
    </div>
  );
}
