import { useState, useEffect, useCallback, useMemo } from 'react';
import { Plus, Trash2, Share2, Film, HardDrive, ChevronRight, ChevronLeft, X, Play, Maximize2, Upload, Image as ImageIcon, Link2, Settings, CheckCircle2 } from 'lucide-react';
import { setupShareMetadata, copyToClipboard, isWeChat } from '../lib/shareUtils';
import { uploadVideo2Image, uploadVideo2Video, detectFileType, uploadVideo2FromUrl } from '../lib/ossUtils';
import { ShareHint } from './WeChatShareHint';

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

interface ReferenceItem {
  id: number;
  type: 'image' | 'video';
  url: string;
  title: string;
}

function formatSize(bytes: number): string {
  if (!bytes) return '0 B';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function timeAgo(dateStr: string): string {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  const diff = (Date.now() - date.getTime()) / 1000;
  if (diff < 60) return '刚刚';
  if (diff < 3600) return `${Math.floor(diff / 60)} 分钟前`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} 小时前`;
  return `${Math.floor(diff / 86400)} 天前`;
}

// 默认封面：蓝紫渐变 SVG data URL
const DEFAULT_COVER =
  'data:image/svg+xml;utf8,' +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 225"><defs><linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="%237c3aed"/><stop offset="100%" stop-color="%23ec4899"/></linearGradient></defs><rect width="400" height="225" fill="url(%23g)"/><circle cx="200" cy="112" r="40" fill="white" fill-opacity="0.15"/></svg>`
  );

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

  // 分享提示（微信环境 vs 普通环境）
  const [shareHintVisible, setShareHintVisible] = useState(false);
  const [shareHintMode, setShareHintMode] = useState<'wechat' | 'default'>('default');

  // 参考文件上传弹窗状态
  const [uploadDialogProject, setUploadDialogProject] = useState<Project | null>(null);
  const [uploadDialogTab, setUploadDialogTab] = useState<'file' | 'url'>('file');
  const [uploadDialogLoading, setUploadDialogLoading] = useState(false);
  const [uploadDialogUrl, setUploadDialogUrl] = useState('');
  const [uploadDialogMessage, setUploadDialogMessage] = useState('');

  // 项目参考文件（按项目 id 缓存，避免每次打开时重新加载）
  const [referencesCache, setReferencesCache] = useState<Record<number, ReferenceItem[]>>({});
  const [carouselIndex, setCarouselIndex] = useState<Record<number, number>>({});

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
    setupShareMetadata({
      title: '柒子文化拍摄辅助',
      desc: '专业的视频拍摄管理工具，帮助团队高效管理拍摄素材',
      link: window.location.href,
      imgUrl: '/images/hero-home.png'
    });
    document.title = '柒子文化拍摄辅助';
  }, [loadProjects]);

  // 加载某个项目的参考文件
  const loadReferences = useCallback(async (projectId: number) => {
    try {
      const res = await fetch(`/api/video2/projects/${projectId}/references`);
      const data = await res.json();
      if (data.success) {
        setReferencesCache(prev => ({ ...prev, [projectId]: data.data || [] }));
      }
    } catch (e) {
      console.error('加载参考文件失败:', e);
    }
  }, []);

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
    const shareUrl = project.shareUrl || `${window.location.origin}/share/video2/project/${project.id}`;
    setupShareMetadata({
      title: project.name,
      desc: project.description || '柒子文化拍摄辅助 - 专业项目管理',
      link: shareUrl,
      imgUrl: project.coverUrl || DEFAULT_COVER
    });
    await copyToClipboard(shareUrl);
    const inWeChat = typeof isWeChat === 'function' ? isWeChat() : false;
    setShareHintMode(inWeChat ? 'wechat' : 'default');
    setShareHintVisible(true);
  };

  const openUploadDialog = (project: Project) => {
    setUploadDialogProject(project);
    setUploadDialogTab('file');
    setUploadDialogMessage('');
    setUploadDialogUrl('');
    // 打开时顺便加载现有参考文件
    if (!referencesCache[project.id]) {
      loadReferences(project.id);
    }
  };

  const handleFileUploadToProject = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0 || !uploadDialogProject) return;
    setUploadDialogLoading(true);
    setUploadDialogMessage(`准备上传 ${files.length} 个文件...`);

    let successCount = 0;
    let errorCount = 0;
    const project = uploadDialogProject;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const detected = detectFileType(file);
      if (!detected.supported) {
        errorCount++;
        continue;
      }
      try {
        if (detected.type === 'image') {
          await uploadVideo2Image(file, {
            projectId: project.id,
            reference: true,
            title: file.name
          });
        } else {
          await uploadVideo2Video(file, {
            projectId: project.id,
            reference: true,
            title: file.name,
            compress: file.size > 50 * 1024 * 1024, // 50MB 以上压缩
            onProgress: p => {
              setUploadDialogMessage(`视频 ${i + 1}/${files.length}: ${p.message} (${p.progress}%)`);
            }
          });
        }
        successCount++;
      } catch (err) {
        console.error('上传失败:', err);
        errorCount++;
      }
    }

    setUploadDialogMessage(`完成：成功 ${successCount}，失败 ${errorCount}`);
    if (successCount > 0) {
      await loadReferences(project.id);
    }
    setUploadDialogLoading(false);
    setTimeout(() => setUploadDialogMessage(''), 3000);
    // 清空 input
    e.target.value = '';
  };

  const handleUrlUploadToProject = async () => {
    if (!uploadDialogUrl.trim() || !uploadDialogProject) return;
    setUploadDialogLoading(true);
    setUploadDialogMessage('正在从 URL 抓取文件...');
    try {
      await uploadVideo2FromUrl(uploadDialogUrl.trim(), {
        projectId: uploadDialogProject.id,
        reference: true,
        title: 'URL 文件'
      });
      setUploadDialogMessage('转存成功');
      await loadReferences(uploadDialogProject.id);
      setUploadDialogUrl('');
    } catch (err) {
      console.error('URL 转存失败:', err);
      setUploadDialogMessage('转存失败，请检查链接是否可公开访问');
    } finally {
      setUploadDialogLoading(false);
      setTimeout(() => setUploadDialogMessage(''), 3000);
    }
  };

  // 点击项目卡片主体 → 进入详情页
  const goToProject = (id: number) => {
    window.location.href = `/video2/project/${id}`;
  };

  // 轮播导航
  const moveCarousel = (projectId: number, dir: 1 | -1) => {
    const refs = referencesCache[projectId] || [];
    if (refs.length === 0) return;
    const current = carouselIndex[projectId] || 0;
    const next = (current + dir + refs.length) % refs.length;
    setCarouselIndex(prev => ({ ...prev, [projectId]: next }));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-violet-950 to-pink-950 text-white">
      {/* Header */}
      <div className="sticky top-0 z-30 backdrop-blur-xl bg-slate-900/70 border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-violet-300 via-pink-300 to-fuchsia-300 bg-clip-text text-transparent">
              柒子文化拍摄辅助
            </h1>
            <p className="text-sm text-slate-400 mt-0.5 hidden sm:block">项目管理 · 多场景素材统筹</p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-full border border-violet-400/40 bg-white/5 hover:bg-violet-500/20 hover:border-violet-400/70 text-sm font-medium transition-all"
          >
            <Plus className="w-4 h-4 text-violet-300" />
            <span>新建项目</span>
          </button>
        </div>
      </div>

      {/* Projects grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {loading && (
          <div className="text-center py-12 text-slate-400">加载中...</div>
        )}

        {!loading && projects.length === 0 && (
          <div className="text-center py-20 border border-dashed border-white/15 rounded-3xl bg-white/[0.02]">
            <Film className="w-12 h-12 mx-auto mb-4 text-violet-300/60" />
            <p className="text-lg mb-2">还没有项目</p>
            <p className="text-sm text-slate-400 mb-6">点击右上角「新建项目」创建第一个项目</p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-5 py-2.5 rounded-full border border-violet-400/40 bg-violet-500/20 hover:bg-violet-500/30 text-sm font-medium transition-all"
            >
              <Plus className="w-4 h-4 inline mr-1.5" />创建项目
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map(project => {
            const refs = referencesCache[project.id] || [];
            const currentIdx = carouselIndex[project.id] || 0;
            const cover = project.coverUrl || DEFAULT_COVER;

            return (
              <div
                key={project.id}
                className="group relative rounded-3xl border border-white/10 bg-white/[0.03] backdrop-blur-xl overflow-hidden hover:border-violet-400/30 hover:shadow-2xl hover:shadow-violet-500/20 transition-all"
              >
                {/* 常驻右上角按钮：分享、删除 */}
                <div className="absolute top-3 right-3 z-20 flex items-center gap-2">
                  <button
                    onClick={(e) => { e.stopPropagation(); handleShare(project); }}
                    title="分享项目"
                    className="w-9 h-9 rounded-full border border-white/20 bg-white/5 backdrop-blur hover:bg-gradient-to-br hover:from-violet-500 hover:to-fuchsia-500 hover:border-transparent transition-all flex items-center justify-center"
                  >
                    <Share2 className="w-4 h-4 text-white/90" />
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); setDeleteTarget(project); }}
                    title="删除项目"
                    className="w-9 h-9 rounded-full border border-white/20 bg-white/5 backdrop-blur hover:bg-red-500/30 hover:border-red-400/50 transition-all flex items-center justify-center"
                  >
                    <Trash2 className="w-4 h-4 text-white/90" />
                  </button>
                </div>

                {/* 封面区 */}
                <div
                  className="relative aspect-[16/10] cursor-pointer overflow-hidden"
                  onClick={() => goToProject(project.id)}
                >
                  <img
                    src={cover}
                    alt={project.name}
                    className="w-full h-full object-cover"
                    onError={(ev) => { (ev.target as HTMLImageElement).src = DEFAULT_COVER; }}
                  />
                  {/* 底部渐变遮罩 */}
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-900/95 via-slate-900/20 to-transparent" />
                  {/* 点击提示 */}
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="px-4 py-2 rounded-full bg-white/15 backdrop-blur text-sm font-medium border border-white/20">
                      进入项目
                    </div>
                  </div>
                </div>

                {/* 参考文件轮播（如果有） */}
                {refs.length > 0 && (
                  <div className="relative border-t border-white/10 bg-slate-900/40">
                    <div className="flex items-center justify-between px-4 pt-3 pb-2 text-xs text-slate-400">
                      <span className="flex items-center gap-1.5"><Film className="w-3.5 h-3.5" />参考素材</span>
                      <span>{currentIdx + 1} / {refs.length}</span>
                    </div>
                    <div className="relative px-4 pb-4">
                      <div className="relative rounded-2xl overflow-hidden border border-white/10 aspect-video bg-black/50">
                        {(() => {
                          const item = refs[currentIdx];
                          if (!item) return null;
                          if (item.type === 'image') {
                            return <img src={item.url} alt={item.title} className="w-full h-full object-contain bg-black/70" />;
                          }
                          return (
                            <video
                              src={item.url}
                              className="w-full h-full object-contain bg-black/70"
                              preload="metadata"
                              controls
                            />
                          );
                        })()}

                        {/* 左/右 导航 */}
                        {refs.length > 1 && (
                          <>
                            <button
                              onClick={(e) => { e.stopPropagation(); moveCarousel(project.id, -1); }}
                              className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full border border-white/25 bg-black/50 hover:bg-white/20 flex items-center justify-center transition"
                            >
                              <ChevronLeft className="w-4 h-4" />
                            </button>
                            <button
                              onClick={(e) => { e.stopPropagation(); moveCarousel(project.id, 1); }}
                              className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full border border-white/25 bg-black/50 hover:bg-white/20 flex items-center justify-center transition"
                            >
                              <ChevronRight className="w-4 h-4" />
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* 信息区 */}
                <div className="relative p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <h3
                        className="text-lg font-semibold truncate cursor-pointer hover:text-violet-300 transition"
                        onClick={() => goToProject(project.id)}
                      >
                        {project.name}
                      </h3>
                      {project.description && (
                        <p className="text-sm text-slate-400 mt-1 line-clamp-2">{project.description}</p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-3 text-xs text-slate-400 mt-3">
                    <span className="inline-flex items-center gap-1">
                      <Film className="w-3.5 h-3.5" /> {project.videoCount} 项
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <HardDrive className="w-3.5 h-3.5" /> {formatSize(project.totalSize)}
                    </span>
                    <span className="ml-auto">{timeAgo(project.createdAt)}</span>
                  </div>

                  {/* 右下角上传图标（常驻） */}
                  <button
                    onClick={(e) => { e.stopPropagation(); openUploadDialog(project); }}
                    title="上传参考文件 / 修改封面"
                    className="mt-4 w-full py-2.5 rounded-2xl border border-violet-400/30 bg-violet-500/10 hover:bg-violet-500/25 hover:border-violet-400/50 transition-all text-sm font-medium inline-flex items-center justify-center gap-2 text-violet-200"
                  >
                    <Upload className="w-4 h-4" />
                    <span>上传参考素材 / 设置封面</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 新建项目弹窗 */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => !createLoading && setShowCreateModal(false)}>
          <div className="w-full max-w-md rounded-3xl border border-white/10 bg-slate-900/95 backdrop-blur-xl p-6 shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-semibold">新建项目</h2>
              <button onClick={() => setShowCreateModal(false)} className="w-9 h-9 rounded-full hover:bg-white/10 flex items-center justify-center">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2 text-slate-300">项目名称</label>
                <input
                  type="text"
                  value={createName}
                  onChange={e => setCreateName(e.target.value)}
                  placeholder="例如：宣传片 2026 春季"
                  className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 focus:border-violet-400/50 outline-none text-sm transition"
                  onKeyDown={e => e.key === 'Enter' && handleCreate()}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2 text-slate-300">描述（可选）</label>
                <textarea
                  value={createDesc}
                  onChange={e => setCreateDesc(e.target.value)}
                  rows={3}
                  placeholder="简单描述项目用途、客户信息等"
                  className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 focus:border-violet-400/50 outline-none text-sm resize-none transition"
                />
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 mt-6">
              <button
                onClick={() => setShowCreateModal(false)}
                className="px-4 py-2 rounded-xl text-sm text-slate-400 hover:text-white hover:bg-white/5 transition"
              >
                取消
              </button>
              <button
                onClick={handleCreate}
                disabled={!createName.trim() || createLoading}
                className="px-5 py-2 rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-500 text-white text-sm font-medium disabled:opacity-40 disabled:cursor-not-allowed transition"
              >
                {createLoading ? '创建中...' : '创建项目'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 删除确认弹窗 */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => !deleteLoading && setDeleteTarget(null)}>
          <div className="w-full max-w-sm rounded-3xl border border-white/10 bg-slate-900/95 backdrop-blur-xl p-6 shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="w-14 h-14 mx-auto rounded-full bg-red-500/15 border border-red-400/30 flex items-center justify-center mb-4">
              <Trash2 className="w-6 h-6 text-red-400" />
            </div>
            <h2 className="text-center text-lg font-semibold mb-1.5">删除项目</h2>
            <p className="text-center text-sm text-slate-400 mb-1">确定要删除「{deleteTarget.name}」吗？</p>
            <p className="text-center text-xs text-slate-500 mb-5">{deleteTarget.videoCount} 个视频 · {formatSize(deleteTarget.totalSize)} — 删除后无法恢复</p>
            <div className="flex items-center justify-center gap-3">
              <button
                onClick={() => setDeleteTarget(null)}
                disabled={deleteLoading}
                className="px-5 py-2 rounded-xl text-sm text-slate-400 hover:text-white hover:bg-white/5 transition"
              >
                取消
              </button>
              <button
                onClick={handleDelete}
                disabled={deleteLoading}
                className="px-5 py-2 rounded-xl bg-red-500 hover:bg-red-600 text-white text-sm font-medium disabled:opacity-50 transition"
              >
                {deleteLoading ? '删除中...' : '确认删除'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 上传参考文件对话框 */}
      {uploadDialogProject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => !uploadDialogLoading && setUploadDialogProject(null)}>
          <div className="w-full max-w-xl rounded-3xl border border-white/10 bg-slate-900/95 backdrop-blur-xl p-6 shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-semibold">为项目上传参考素材</h2>
                <p className="text-xs text-slate-400 mt-0.5">「{uploadDialogProject.name}」— 支持图片和视频</p>
              </div>
              <button onClick={() => !uploadDialogLoading && setUploadDialogProject(null)} className="w-9 h-9 rounded-full hover:bg-white/10 flex items-center justify-center">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Tab 切换 */}
            <div className="flex gap-2 mb-4 bg-white/5 p-1 rounded-2xl">
              <button
                onClick={() => setUploadDialogTab('file')}
                className={`flex-1 py-2 text-sm rounded-xl transition ${uploadDialogTab === 'file' ? 'bg-gradient-to-br from-violet-500 to-fuchsia-500 text-white' : 'text-slate-400 hover:text-white'}`}
              >
                <Upload className="w-4 h-4 inline mr-1.5" />选择文件
              </button>
              <button
                onClick={() => setUploadDialogTab('url')}
                className={`flex-1 py-2 text-sm rounded-xl transition ${uploadDialogTab === 'url' ? 'bg-gradient-to-br from-violet-500 to-fuchsia-500 text-white' : 'text-slate-400 hover:text-white'}`}
              >
                <Link2 className="w-4 h-4 inline mr-1.5" />网络 URL
              </button>
            </div>

            {uploadDialogTab === 'file' ? (
              <div>
                <label className="block border-2 border-dashed border-white/15 hover:border-violet-400/40 rounded-2xl p-8 text-center cursor-pointer transition bg-white/[0.02]">
                  <input
                    type="file"
                    multiple
                    accept="image/*,video/*"
                    className="hidden"
                    onChange={handleFileUploadToProject}
                    disabled={uploadDialogLoading}
                  />
                  <ImageIcon className="w-10 h-10 mx-auto text-violet-300/60 mb-3" />
                  <p className="text-sm font-medium mb-1">点击选择文件</p>
                  <p className="text-xs text-slate-500">支持图片 (jpg, png, webp, gif) 和视频 (mp4, webm)</p>
                </label>
                <p className="text-xs text-slate-500 mt-3">
                  提示：大视频会在服务端自动压缩；非图片/视频类型的文件会被忽略
                </p>
              </div>
            ) : (
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <input
                    type="text"
                    value={uploadDialogUrl}
                    onChange={e => setUploadDialogUrl(e.target.value)}
                    placeholder="https://example.com/image.jpg 或 https://example.com/video.mp4"
                    className="flex-1 px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 focus:border-violet-400/50 outline-none text-sm transition"
                    onKeyDown={e => e.key === 'Enter' && handleUrlUploadToProject()}
                    disabled={uploadDialogLoading}
                  />
                  <button
                    onClick={handleUrlUploadToProject}
                    disabled={!uploadDialogUrl.trim() || uploadDialogLoading}
                    className="px-4 py-2.5 rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-500 text-white text-sm font-medium disabled:opacity-40 disabled:cursor-not-allowed transition"
                  >
                    转存
                  </button>
                </div>
                <p className="text-xs text-slate-500">
                  链接必须是公开可访问的资源地址（非登录后的页面）
                </p>
              </div>
            )}

            {uploadDialogMessage && (
              <div className="mt-4 text-sm text-center text-violet-200 bg-violet-500/10 border border-violet-400/20 rounded-xl py-2.5">
                {uploadDialogMessage}
              </div>
            )}

            {/* 现有参考文件列表 */}
            {referencesCache[uploadDialogProject.id] && referencesCache[uploadDialogProject.id]!.length > 0 && (
              <div className="mt-5">
                <h3 className="text-sm font-medium mb-3 text-slate-300">已上传的参考素材（{referencesCache[uploadDialogProject.id]!.length}）</h3>
                <div className="grid grid-cols-3 gap-2 max-h-40 overflow-y-auto">
                  {referencesCache[uploadDialogProject.id]!.map(item => (
                    <div key={item.id} className="relative aspect-video rounded-xl overflow-hidden border border-white/10 bg-black/30">
                      {item.type === 'image' ? (
                        <img src={item.url} alt={item.title} className="w-full h-full object-cover" />
                      ) : (
                        <video src={item.url} className="w-full h-full object-cover" />
                      )}
                      <div className="absolute top-1 right-1 px-1.5 py-0.5 rounded bg-black/60 text-[10px] uppercase">
                        {item.type === 'image' ? 'img' : 'video'}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 微信分享提示浮层 */}
      <ShareHint
        isVisible={shareHintVisible}
        onClose={() => setShareHintVisible(false)}
        mode={shareHintMode}
      />

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[90] px-4 py-2.5 rounded-2xl bg-slate-800/95 border border-white/10 text-sm shadow-xl">
          <CheckCircle2 className="w-4 h-4 inline mr-2 text-green-400" />
          {toast}
        </div>
      )}
    </div>
  );
}
