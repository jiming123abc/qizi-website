import { useState, useEffect, useRef, useCallback } from 'react';
import { Upload, Play, CheckCircle2, Trash2, X, FileVideo, Maximize2, Share2, Plus, ArrowLeft, RotateCcw, Image as ImageIcon, Link2, Check } from 'lucide-react';
import { setupShareMetadata, copyToClipboard, isWeChat as checkIsWeChat } from '../lib/shareUtils';
import { uploadVideo2Image, uploadVideo2Video, uploadVideo2FromUrl, detectFileType } from '../lib/ossUtils';
import { ShareHint } from './WeChatShareHint';

interface Video2PageProps {
  projectId: number;
}

interface MediaItem {
  id: number;
  title: string;
  filename: string;
  url: string;
  type: 'image' | 'video';
  status: 'pending' | 'done';
  size: number;
  duration?: number;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
  deleted?: number;
  deletedAt?: string;
  projectId?: number;
  sceneId?: number;
}

interface Scene {
  id: number;
  projectId: number;
  name: string;
  sortOrder: number;
  scrollPosition: number;
  videoCount: number;
}

interface Project {
  id: number;
  name: string;
  description: string;
  coverUrl?: string;
  shareUrl: string;
}

interface UploadingFile {
  id: string;
  name: string;
  size: number;
  progress: number;
  status: 'uploading' | 'done' | 'error';
  message?: string;
}

// 视频 poster（OSS 截图）
function getPosterUrl(videoUrl: string): string {
  if (videoUrl && (videoUrl.includes('aliyuncs.com') || videoUrl.includes('qiziwenhua.top'))) {
    return videoUrl + '?x-oss-process=video/snapshot,t_1000,f_jpg,w_800,m_fast';
  }
  return '';
}

function timeAgo(dateStr: string): string {
  if (!dateStr) return '';
  const diff = Date.now() - new Date(dateStr).getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return '今天';
  if (days === 1) return '昨天';
  if (days < 7) return `${days} 天前`;
  return `${Math.floor(days / 7)} 周前`;
}

export function Video2Page({ projectId }: Video2PageProps) {
  const [project, setProject] = useState<Project | null>(null);
  const [scenes, setScenes] = useState<Scene[]>([]);
  const [items, setItems] = useState<MediaItem[]>([]);
  const [stats, setStats] = useState<{ pending: number; done: number; trash: number }>({ pending: 0, done: 0, trash: 0 });
  const [loading, setLoading] = useState(true);

  const [currentSceneId, setCurrentSceneId] = useState<number | null>(null);
  const [currentTab, setCurrentTab] = useState<'pending' | 'done' | 'trash'>('pending');
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());

  const [showNewSceneModal, setShowNewSceneModal] = useState(false);
  const [newSceneName, setNewSceneName] = useState('');
  const [showMoveModal, setShowMoveModal] = useState(false);
  const [showRenameSceneId, setShowRenameSceneId] = useState<number | null>(null);
  const [renameSceneName, setRenameSceneName] = useState('');
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [uploadTab, setUploadTab] = useState<'file' | 'url'>('file');
  const [uploadingFiles, setUploadingFiles] = useState<UploadingFile[]>([]);
  const [urlInputValue, setUrlInputValue] = useState('');

  const [shareHintVisible, setShareHintVisible] = useState(false);
  const [shareHintMode, setShareHintMode] = useState<'wechat' | 'default'>('default');

  const [toast, setToast] = useState<string | null>(null);
  const showToast = useCallback((msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  }, []);

  const containerRef = useRef<HTMLDivElement | null>(null);

  // 拖拽相关 - 媒体卡片
  const [dragItemId, setDragItemId] = useState<number | null>(null);
  const [dragOverItemId, setDragOverItemId] = useState<number | null>(null);

  // 拖拽相关 - 场次 tab
  const [dragSceneId, setDragSceneId] = useState<number | null>(null);
  const [dragOverSceneId, setDragOverSceneId] = useState<number | null>(null);

  const [fullscreenItem, setFullscreenItem] = useState<MediaItem | null>(null);

  // ============ 数据加载 ============
  const loadProject = useCallback(async () => {
    try {
      const res = await fetch(`/api/video2/projects/${projectId}`);
      const data = await res.json();
      if (data.success) setProject(data.data);
    } catch (e) {
      console.error('加载项目信息失败:', e);
    }
  }, [projectId]);

  const loadScenes = useCallback(async () => {
    try {
      const res = await fetch(`/api/video2/projects/${projectId}/scenes`);
      const data = await res.json();
      if (data.success) {
        const list: Scene[] = data.data || [];
        // 按 sortOrder 排序
        list.sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));
        setScenes(list);
      }
    } catch (e) {
      console.error('加载场次失败:', e);
    }
  }, [projectId]);

  const loadItems = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      params.set('projectId', String(projectId));
      if (currentSceneId !== null) params.set('sceneId', String(currentSceneId));
      if (currentTab === 'trash') params.set('deleted', '1');
      else params.set('status', currentTab);
      const res = await fetch(`/api/video2/list?${params.toString()}`);
      const data = await res.json();
      if (data.success) {
        const list: MediaItem[] = (data.data || []).slice();
        list.sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));
        setItems(list);
      }
    } catch (e) {
      console.error('加载列表失败:', e);
    }
  }, [projectId, currentSceneId, currentTab]);

  const loadStats = useCallback(async () => {
    try {
      const res = await fetch(`/api/video2/stats?projectId=${projectId}`);
      const data = await res.json();
      if (data.success) {
        setStats({ pending: data.pending || 0, done: data.done || 0, trash: data.trash || 0 });
      }
    } catch (e) {
      console.error('加载统计失败:', e);
    }
  }, [projectId]);

  const refreshAll = useCallback(async () => {
    await Promise.all([loadProject(), loadScenes(), loadItems(), loadStats()]);
  }, [loadProject, loadScenes, loadItems, loadStats]);

  useEffect(() => {
    setLoading(true);
    refreshAll().then(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // SEO / 分享元数据
  useEffect(() => {
    if (!project) return;
    document.title = project.name + ' · 柒子文化拍摄辅助';
    setupShareMetadata({
      title: project.name,
      desc: project.description || '柒子文化拍摄辅助 - 专业项目管理',
      link: window.location.href,
      imgUrl: project.coverUrl || ''
    });
  }, [project]);

  // 切换场次 / tab
  useEffect(() => {
    loadItems();
    loadStats();
  }, [currentSceneId, currentTab, loadItems, loadStats]);

  // ============ 标题编辑 ============
  const updateTitle = async (id: number, title: string) => {
    try {
      await fetch(`/api/video2/videos/${id}/title`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title })
      });
      setItems(prev => prev.map(it => it.id === id ? { ...it, title } : it));
    } catch (e) {
      console.error('更新标题失败:', e);
    }
  };

  // ============ 状态切换（点击圆圈复选框） ============
  const toggleStatus = async (item: MediaItem) => {
    const newStatus = item.status === 'pending' ? 'done' : 'pending';
    try {
      await fetch(`/api/video2/videos/${item.id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      // 本地立即移除：点击后自动移动到对应的 tab
      setItems(prev => prev.filter(it => it.id !== item.id));
      // 同步 stats
      await loadStats();
      showToast(newStatus === 'done' ? '已标记为已拍摄' : '已回到未拍摄');
    } catch (e) {
      console.error('更新状态失败:', e);
    }
  };

  // ============ 删除 / 恢复 ============
  const softDelete = async (id: number) => {
    try {
      await fetch(`/api/video2/videos/${id}`, { method: 'DELETE' });
      setItems(prev => prev.filter(it => it.id !== id));
      await loadStats();
      showToast('已移到垃圾桶');
    } catch (e) {
      console.error('删除失败:', e);
    }
  };

  const restoreItem = async (id: number) => {
    try {
      await fetch(`/api/video2/videos/${id}/restore`, { method: 'POST' });
      setItems(prev => prev.filter(it => it.id !== id));
      await loadStats();
      showToast('已恢复');
    } catch (e) {
      console.error('恢复失败:', e);
    }
  };

  const hardDelete = async (id: number) => {
    if (!confirm('确定彻底删除此素材吗？无法恢复。')) return;
    try {
      await fetch(`/api/video2/videos/${id}/hard`, { method: 'DELETE' });
      setItems(prev => prev.filter(it => it.id !== id));
      await loadStats();
      showToast('已彻底删除');
    } catch (e) {
      console.error('彻底删除失败:', e);
    }
  };

  // ============ 批量 ============
  const toggleSelect = (id: number) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectAll = () => {
    if (selectedIds.size === items.length) setSelectedIds(new Set());
    else setSelectedIds(new Set(items.map(it => it.id)));
  };

  const batchSoftDelete = async () => {
    if (selectedIds.size === 0) return;
    const ids = Array.from(selectedIds);
    try {
      await fetch('/api/video2/videos/batch-update', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids, action: 'softDelete' })
      });
      setItems(prev => prev.filter(it => !ids.includes(it.id)));
      setSelectedIds(new Set());
      await loadStats();
      showToast(`已将 ${ids.length} 项移到垃圾桶`);
    } catch (e) {
      console.error('批量删除失败:', e);
    }
  };

  const batchRestore = async () => {
    if (selectedIds.size === 0) return;
    const ids = Array.from(selectedIds);
    try {
      await fetch('/api/video2/videos/batch-update', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids, action: 'restore' })
      });
      setItems(prev => prev.filter(it => !ids.includes(it.id)));
      setSelectedIds(new Set());
      await loadStats();
      showToast(`已恢复 ${ids.length} 项`);
    } catch (e) {
      console.error('批量恢复失败:', e);
    }
  };

  const batchHardDelete = async () => {
    if (selectedIds.size === 0) return;
    if (!confirm(`确定彻底删除所选 ${selectedIds.size} 项？无法恢复。`)) return;
    const ids = Array.from(selectedIds);
    try {
      await fetch('/api/video2/videos/batch-update', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids, action: 'hardDelete' })
      });
      setItems(prev => prev.filter(it => !ids.includes(it.id)));
      setSelectedIds(new Set());
      await loadStats();
      showToast(`已彻底删除 ${ids.length} 项`);
    } catch (e) {
      console.error('批量彻底删除失败:', e);
    }
  };

  const batchMoveToScene = async (sceneId: number | null) => {
    if (selectedIds.size === 0) return;
    const ids = Array.from(selectedIds);
    try {
      await fetch('/api/video2/videos/batch-update', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids, action: 'changeScene', sceneId })
      });
      setItems(prev => prev.filter(it => !ids.includes(it.id)));
      setSelectedIds(new Set());
      setShowMoveModal(false);
      showToast(`已移动 ${ids.length} 项`);
    } catch (e) {
      console.error('批量移动失败:', e);
    }
  };

  // ============ 设置项目封面（上传后自动调用） ============
  const setProjectCover = async (coverUrl: string) => {
    try {
      await fetch(`/api/video2/projects/${projectId}/cover`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ coverUrl })
      });
      setProject(prev => prev ? { ...prev, coverUrl } : prev);
    } catch (e) {
      console.error('设置封面失败:', e);
    }
  };

  // ============ 场次管理 ============
  const createScene = async () => {
    const name = newSceneName.trim();
    if (!name) return;
    try {
      const res = await fetch(`/api/video2/projects/${projectId}/scenes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name })
      });
      const data = await res.json();
      if (data.success) {
        setNewSceneName('');
        setShowNewSceneModal(false);
        await loadScenes();
        showToast('已创建场次');
      }
    } catch (e) {
      console.error('创建场次失败:', e);
    }
  };

  const renameScene = async () => {
    if (showRenameSceneId === null) return;
    const name = renameSceneName.trim();
    if (!name) return;
    try {
      await fetch(`/api/video2/scenes/${showRenameSceneId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name })
      });
      setShowRenameSceneId(null);
      setRenameSceneName('');
      await loadScenes();
    } catch (e) {
      console.error('重命名失败:', e);
    }
  };

  const deleteScene = async (id: number) => {
    if (!confirm('删除本场次？该场次下的素材将移到未分类，不会删除。')) return;
    try {
      await fetch(`/api/video2/scenes/${id}`, { method: 'DELETE' });
      if (currentSceneId === id) setCurrentSceneId(null);
      await loadScenes();
      showToast('场次已删除');
    } catch (e) {
      console.error('删除场次失败:', e);
    }
  };

  // ============ 拖拽排序（媒体卡片） ============
  const handleItemDragStart = (id: number) => {
    setDragItemId(id);
  };
  const handleItemDragOver = (e: React.DragEvent, id: number) => {
    e.preventDefault();
    if (dragItemId === null || dragItemId === id) return;
    setDragOverItemId(id);
  };
  const handleItemDrop = async (targetId: number) => {
    if (dragItemId === null || dragItemId === targetId) {
      setDragItemId(null);
      setDragOverItemId(null);
      return;
    }
    // 在 items 里重新排序
    const sorted = [...items].sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));
    const dragIdx = sorted.findIndex(i => i.id === dragItemId);
    const targetIdx = sorted.findIndex(i => i.id === targetId);
    if (dragIdx < 0 || targetIdx < 0) { setDragItemId(null); setDragOverItemId(null); return; }

    const next = [...sorted];
    const [moved] = next.splice(dragIdx, 1);
    next.splice(targetIdx, 0, moved);

    // 为每个 item 分配新的 sortOrder（0..n-1）
    const orders = next.map((i, idx) => ({ id: i.id, sortOrder: idx }));
    // 本地乐观更新
    setItems(next.map((i, idx) => ({ ...i, sortOrder: idx })));

    try {
      await fetch('/api/video2/videos/batch-update', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'reorder', orders })
      });
    } catch (e) {
      console.error('更新排序失败:', e);
    }
    setDragItemId(null);
    setDragOverItemId(null);
  };

  // ============ 拖拽排序（场次 tab） ============
  const handleSceneDragStart = (id: number) => {
    setDragSceneId(id);
  };
  const handleSceneDragOver = (e: React.DragEvent, id: number) => {
    e.preventDefault();
    if (dragSceneId === null || dragSceneId === id) return;
    setDragOverSceneId(id);
  };
  const handleSceneDrop = async (targetId: number) => {
    if (dragSceneId === null || dragSceneId === targetId) {
      setDragSceneId(null); setDragOverSceneId(null); return;
    }
    const sorted = [...scenes].sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));
    const dragIdx = sorted.findIndex(s => s.id === dragSceneId);
    const targetIdx = sorted.findIndex(s => s.id === targetId);
    if (dragIdx < 0 || targetIdx < 0) { setDragSceneId(null); setDragOverSceneId(null); return; }

    const next = [...sorted];
    const [moved] = next.splice(dragIdx, 1);
    next.splice(targetIdx, 0, moved);
    const orders = next.map((s, idx) => ({ id: s.id, sortOrder: idx }));
    setScenes(next.map((s, idx) => ({ ...s, sortOrder: idx })));
    try {
      await fetch('/api/video2/scenes/sort', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orders })
      });
    } catch (e) {
      console.error('更新场次排序失败:', e);
    }
    setDragSceneId(null);
    setDragOverSceneId(null);
  };

  // ============ 上传 ============
  const handleUploadFiles = async (files: FileList | File[]) => {
    const list = Array.from(files);
    if (list.length === 0) return;

    const valid = list.filter(f => {
      const d = detectFileType(f);
      if (!d.supported) {
        showToast(`忽略不支持的文件：${f.name}`);
      }
      return d.supported;
    });
    if (valid.length === 0) return;

    const initial: UploadingFile[] = valid.map(f => ({
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 8)}`,
      name: f.name, size: f.size, progress: 5, status: 'uploading'
    }));
    setUploadingFiles(initial);

    let firstCoverUrl: string | null = null;
    for (let i = 0; i < valid.length; i++) {
      const file = valid[i];
      const detected = detectFileType(file);
      try {
        if (detected.type === 'image') {
          await uploadVideo2Image(file, {
            projectId,
            sceneId: currentSceneId !== null ? currentSceneId : undefined,
            title: file.name
          });
          if (!firstCoverUrl) firstCoverUrl = ''; // 占位，下面重新取
          setUploadingFiles(prev => prev.map((uf, idx) => idx === i ? { ...uf, progress: 100, status: 'done', message: '完成' } : uf));
        } else {
          await uploadVideo2Video(file, {
            projectId,
            sceneId: currentSceneId !== null ? currentSceneId : undefined,
            title: file.name,
            compress: file.size > 50 * 1024 * 1024,
            onProgress: p => {
              setUploadingFiles(prev => prev.map((uf, idx) => idx === i ? { ...uf, progress: p.progress, message: p.message } : uf));
            }
          });
          setUploadingFiles(prev => prev.map((uf, idx) => idx === i ? { ...uf, progress: 100, status: 'done', message: '完成' } : uf));
        }
      } catch (e) {
        console.error('上传失败:', file.name, e);
        setUploadingFiles(prev => prev.map((uf, idx) => idx === i ? { ...uf, status: 'error', message: '失败' } : uf));
      }
    }

    // 刷新列表 + 统计
    await loadItems();
    await loadStats();
    showToast(`上传完成（${valid.length} 项）`);

    // 无条件把最新一条素材设为项目封面（视频走 OSS 截图 URL）
    try {
      const params = new URLSearchParams();
      params.set('projectId', String(projectId));
      if (currentSceneId !== null) params.set('sceneId', String(currentSceneId));
      params.set('status', 'pending');
      const listRes = await fetch(`/api/video2/list?${params.toString()}`);
      const listData = await listRes.json();
      const list: MediaItem[] = (listData.data || []) as MediaItem[];
      if (list.length > 0) {
        list.sort((a, b) => (b.sortOrder || 0) - (a.sortOrder || 0)); // 最新的在前
        const latest = list[0];
        const coverUrl = latest.type === 'video' ? getPosterUrl(latest.url) || latest.url : latest.url;
        await setProjectCover(coverUrl);
      }
    } catch (e) { /* 忽略 */ }
  };

  const handleUploadFromUrl = async () => {
    const url = urlInputValue.trim();
    if (!url) return;
    const newItem: UploadingFile = {
      id: `${Date.now()}-url`,
      name: url.substring(0, 50) + '...',
      size: 0,
      progress: 20,
      status: 'uploading'
    };
    setUploadingFiles(prev => [...prev, newItem]);
    try {
      await uploadVideo2FromUrl(url, {
        projectId,
        sceneId: currentSceneId !== null ? currentSceneId : undefined,
        title: url
      });
      setUploadingFiles(prev => prev.map(uf => uf.id === newItem.id ? { ...uf, progress: 100, status: 'done', message: '转存完成' } : uf));
      setUrlInputValue('');
      await loadItems();
      await loadStats();
      // 无条件把最新一条素材设为项目封面（视频走 OSS 截图 URL）
      try {
        const urlParams = new URLSearchParams();
        urlParams.set('projectId', String(projectId));
        if (currentSceneId !== null) urlParams.set('sceneId', String(currentSceneId));
        urlParams.set('status', 'pending');
        const urlListRes = await fetch(`/api/video2/list?${urlParams.toString()}`);
        const urlListData = await urlListRes.json();
        const urlList: MediaItem[] = (urlListData.data || []) as MediaItem[];
        if (urlList.length > 0) {
          urlList.sort((a, b) => (b.sortOrder || 0) - (a.sortOrder || 0));
          const latest = urlList[0];
          const coverUrl = latest.type === 'video' ? getPosterUrl(latest.url) || latest.url : latest.url;
          await setProjectCover(coverUrl);
        }
      } catch (e) { /* 忽略 */ }
    } catch (e) {
      setUploadingFiles(prev => prev.map(uf => uf.id === newItem.id ? { ...uf, status: 'error', message: String(e) } : uf));
    }
  };

  // ============ 分享 ============
  const handleShare = async () => {
    const shareUrl = window.location.origin + `/share/video2/project/${projectId}`;
    setupShareMetadata({
      title: project?.name || '项目',
      desc: project?.description || '',
      link: shareUrl,
      imgUrl: project?.coverUrl || ''
    });
    await copyToClipboard(shareUrl);
    setShareHintMode(checkIsWeChat() ? 'wechat' : 'default');
    setShareHintVisible(true);
  };

  const backToProjectList = () => {
    window.location.href = '/video2';
  };

  // ============ 渲染 ============
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-violet-950 to-pink-950 text-white flex items-center justify-center">
        <div className="text-slate-400">加载中...</div>
      </div>
    );
  }

  // 渲染单个媒体卡片
  const renderMediaCard = (item: MediaItem, index: number) => {
    const isSelected = selectedIds.has(item.id);
    const isImage = item.type === 'image';
    const isDraggingThis = dragItemId === item.id;
    const isDragOverThis = dragOverItemId === item.id;

    return (
      <div
        key={item.id}
        draggable={currentTab !== 'trash'}
        onDragStart={() => handleItemDragStart(item.id)}
        onDragOver={(e) => handleItemDragOver(e, item.id)}
        onDragLeave={() => setDragOverItemId(null)}
        onDrop={(e) => { e.preventDefault(); handleItemDrop(item.id); }}
        className={`relative rounded-2xl border bg-white/[0.03] overflow-hidden transition-all ${
          isDraggingThis ? 'opacity-40 scale-95 border-violet-400/60' : 'border-white/10 hover:border-violet-400/30'
        } ${isDragOverThis && !isDraggingThis ? 'ring-2 ring-violet-400/60 border-violet-400/50 -translate-y-0.5' : ''}`}
      >
        {/* 左上：批量复选框 */}
        <button
          onClick={(e) => { e.stopPropagation(); toggleSelect(item.id); }}
          className={`absolute top-3 left-3 z-20 w-7 h-7 rounded-full border flex items-center justify-center transition text-xs ${
            isSelected
              ? 'border-violet-400 bg-gradient-to-br from-violet-500 to-fuchsia-500 text-white'
              : 'border-white/25 bg-black/50 text-white/70 hover:bg-black/70'
          }`}
          title="选择"
        >
          {isSelected ? <Check className="w-4 h-4" /> : null}
        </button>

        {/* 媒体区：点击进入全屏预览（避免移动端视频播放导致 poster 丢失） */}
        <div
          className="relative aspect-video bg-black/40 overflow-hidden cursor-pointer"
          style={{ minHeight: 180 }}
          onClick={(e) => { e.stopPropagation(); setFullscreenItem(item); }}
        >
          {isImage ? (
            <img
              src={item.url}
              alt={item.title}
              className="w-full h-full object-cover"
              onError={(e) => { (e.currentTarget as HTMLImageElement).style.visibility = 'hidden'; }}
            />
          ) : (
            <>
              <img
                src={getPosterUrl(item.url) || item.url}
                alt={item.title}
                className="w-full h-full object-cover"
                onError={(e) => { (e.currentTarget as HTMLImageElement).style.visibility = 'hidden'; }}
              />
              {/* 播放按钮叠加层（仅视频） */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="w-14 h-14 rounded-full border-2 border-violet-400/70 bg-black/40 backdrop-blur flex items-center justify-center">
                  <Play className="w-6 h-6 text-violet-100 fill-violet-100 ml-0.5" />
                </div>
              </div>
            </>
          )}

          {/* 右上角：全屏 */}
          <button
            onClick={(e) => { e.stopPropagation(); setFullscreenItem(item); }}
            className="absolute top-3 right-3 z-20 w-8 h-8 rounded-full border border-violet-400/40 bg-white/5 hover:bg-gradient-to-br hover:from-violet-500 hover:to-fuchsia-500 hover:border-transparent flex items-center justify-center transition"
            title="全屏查看"
          >
            <Maximize2 className="w-4 h-4 text-white/90" />
          </button>

          {/* 左下角：未拍摄/已拍摄 圆圈复选 */}
          {currentTab !== 'trash' && (
            <button
              onClick={(e) => { e.stopPropagation(); toggleStatus(item); }}
              className="absolute bottom-3 left-3 z-20 inline-flex items-center gap-1.5 pl-1.5 pr-3 py-1.5 rounded-full text-xs font-medium border transition"
              style={{
                backgroundColor: item.status === 'done' ? 'rgba(34,197,94,0.15)' : 'rgba(0,0,0,0.45)',
                borderColor: item.status === 'done' ? 'rgba(34,197,94,0.6)' : 'rgba(255,255,255,0.25)',
                color: item.status === 'done' ? '#bbf7d0' : '#fff'
              }}
              title={item.status === 'done' ? '点击回到未拍摄' : '点击标记为已拍摄'}
            >
              <span
                className="w-4 h-4 rounded-full border-[1.5px] flex items-center justify-center transition"
                style={{
                  borderColor: item.status === 'done' ? '#4ade80' : 'rgba(255,255,255,0.6)',
                  backgroundColor: item.status === 'done' ? '#22c55e' : 'transparent'
                }}
              >
                {item.status === 'done' && <Check className="w-3 h-3 text-white" />}
              </span>
              <span>{item.status === 'done' ? '已拍摄' : '未拍摄'}</span>
            </button>
          )}
        </div>

        {/* 下方操作区 */}
        <div className="p-3 sm:p-4">
          {/* 标题 */}
          <div className="mb-3">
            <input
              type="text"
              defaultValue={item.title}
              onBlur={(e) => {
                const v = e.currentTarget.value.trim();
                if (v && v !== item.title) updateTitle(item.id, v);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') (e.currentTarget as HTMLInputElement).blur();
                if (e.key === 'Escape') (e.currentTarget as HTMLInputElement).value = item.title;
              }}
              className="w-full text-sm font-medium bg-transparent border-b border-transparent hover:border-white/20 focus:border-violet-400/60 outline-none py-1 transition"
            />
          </div>

          {/* 底部操作行 */}
          <div className="flex items-center justify-between gap-2">
            <div className="text-xs text-slate-400">
              {currentTab === 'trash'
                ? `删除于 ${timeAgo(item.deletedAt || item.updatedAt)}`
                : `镜头 ${index + 1}`}
            </div>

            {currentTab === 'trash' ? (
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => restoreItem(item.id)}
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-full text-xs border border-white/15 hover:bg-white/10 transition text-slate-300"
                  title="恢复"
                >
                  <RotateCcw className="w-3.5 h-3.5" /> 恢复
                </button>
                <button
                  onClick={() => hardDelete(item.id)}
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-full text-xs border border-red-400/30 hover:bg-red-500/20 text-red-200 transition"
                  title="彻底删除"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => softDelete(item.id)}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-full text-xs border border-white/15 hover:bg-white/10 text-slate-300 transition"
                title="移到垃圾桶"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>
    );
  };

  // 排序后的 items（按 sortOrder）
  const sortedItems = [...items].sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));

  // 按 sortOrder 排序后的场景列表
  const sortedScenes = [...scenes].sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-violet-950 to-pink-950 text-white pb-24">
      {/* 顶部栏 */}
      <div className="sticky top-0 z-30 backdrop-blur-xl bg-slate-900/75 border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 sm:py-4 flex items-center gap-3">
          <button
            onClick={backToProjectList}
            className="w-9 h-9 rounded-full border border-white/20 bg-white/5 hover:bg-white/10 flex items-center justify-center transition"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="flex-1 min-w-0">
            <h1 className="text-base sm:text-xl font-bold truncate">{project?.name || '项目'}</h1>
            {project?.description && (
              <p className="text-xs text-slate-400 hidden sm:block truncate">{project.description}</p>
            )}
          </div>
          <button
            onClick={handleShare}
            className="w-9 h-9 rounded-full border border-violet-400/40 bg-white/5 hover:bg-gradient-to-br hover:from-violet-500 hover:to-fuchsia-500 hover:border-transparent flex items-center justify-center transition"
            title="分享项目"
          >
            <Share2 className="w-4 h-4 text-white/90" />
          </button>
          <button
            onClick={() => setShowUploadDialog(true)}
            className="inline-flex items-center gap-2 px-3 sm:px-4 py-2 rounded-full border border-violet-400/40 bg-gradient-to-br from-violet-500 to-fuchsia-500 hover:shadow-lg hover:shadow-violet-500/30 text-white text-sm font-medium transition"
          >
            <Upload className="w-4 h-4" />
            <span className="hidden sm:inline">批量上传</span>
            <span className="inline sm:hidden">上传</span>
          </button>
        </div>

        {/* 场次 Tab 栏（支持拖拽，未分类固定在最后） */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 pb-3 overflow-x-auto">
          <div className="flex items-center gap-2 min-w-max">
            {/* 自定义场次 tabs —— 可拖拽 */}
            {sortedScenes.map(scene => {
              const isActive = currentSceneId === scene.id;
              const isDragOverScene = dragOverSceneId === scene.id && dragSceneId !== scene.id;
              const isDraggingScene = dragSceneId === scene.id;
              return (
                <div
                  key={scene.id}
                  draggable
                  onDragStart={() => handleSceneDragStart(scene.id)}
                  onDragOver={(e) => handleSceneDragOver(e, scene.id)}
                  onDragLeave={() => setDragOverSceneId(null)}
                  onDrop={(e) => { e.preventDefault(); handleSceneDrop(scene.id); }}
                  onContextMenu={(e) => { e.preventDefault(); setShowRenameSceneId(scene.id); setRenameSceneName(scene.name); }}
                  className={`relative group ${isDraggingScene ? 'opacity-50' : ''}`}
                >
                  <button
                    onClick={() => { setCurrentSceneId(scene.id); setSelectedIds(new Set()); }}
                    className={`px-3 sm:px-4 py-1.5 rounded-full text-xs sm:text-sm font-medium whitespace-nowrap border transition ${
                      isActive
                        ? 'bg-gradient-to-br from-violet-500 to-fuchsia-500 border-transparent text-white shadow-lg shadow-violet-500/25'
                        : 'border-white/15 bg-white/5 text-slate-300 hover:bg-white/10'
                    } ${isDragOverScene ? 'ring-2 ring-violet-400/70' : ''}`}
                    title="拖拽排序 · 右键重命名/删除"
                  >
                    {scene.name}
                  </button>
                </div>
              );
            })}

            {/* 未分类 - 固定最后，不可拖拽 */}
            <button
              onClick={() => { setCurrentSceneId(null); setSelectedIds(new Set()); }}
              className={`px-3 sm:px-4 py-1.5 rounded-full text-xs sm:text-sm font-medium whitespace-nowrap border transition ${
                currentSceneId === null
                  ? 'bg-gradient-to-br from-violet-500 to-fuchsia-500 border-transparent text-white shadow-lg shadow-violet-500/25'
                  : 'border-white/15 bg-white/5 text-slate-300 hover:bg-white/10'
              }`}
              title="未分类（固定位置，不可拖拽）"
            >
              未分类
            </button>

            {/* + 新建场次 */}
            <button
              onClick={() => setShowNewSceneModal(true)}
              className="w-8 h-8 rounded-full border border-dashed border-white/25 hover:border-violet-400/50 hover:bg-violet-500/10 text-slate-400 hover:text-violet-200 flex items-center justify-center transition shrink-0"
              title="新建场次"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* 主体内容 */}
      <div ref={containerRef} className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        {/* 批量操作栏 */}
        {selectedIds.size > 0 && (
          <div className="mb-4 p-3 rounded-2xl border border-violet-400/30 bg-violet-500/10 backdrop-blur flex items-center gap-2 flex-wrap">
            <button
              onClick={selectAll}
              className="px-3 py-1.5 rounded-full text-xs border border-white/20 bg-white/5 hover:bg-white/10 transition"
            >
              全选 {items.length}
            </button>
            <span className="text-xs text-slate-300">已选 {selectedIds.size}</span>
            <span className="flex-1" />
            {currentTab === 'trash' ? (
              <>
                <button
                  onClick={batchRestore}
                  className="px-3 py-1.5 rounded-full text-xs border border-white/20 bg-white/5 hover:bg-white/10 transition"
                >
                  <RotateCcw className="w-3.5 h-3.5 inline mr-1" /> 恢复
                </button>
                <button
                  onClick={batchHardDelete}
                  className="px-3 py-1.5 rounded-full text-xs border border-red-400/30 bg-red-500/10 hover:bg-red-500/20 text-red-200 transition"
                >
                  <Trash2 className="w-3.5 h-3.5 inline mr-1" /> 彻底删除
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => setShowMoveModal(true)}
                  className="px-3 py-1.5 rounded-full text-xs border border-violet-400/30 bg-violet-500/10 hover:bg-violet-500/20 text-violet-200 transition"
                >
                  移动到场次
                </button>
                <button
                  onClick={batchSoftDelete}
                  className="px-3 py-1.5 rounded-full text-xs border border-white/20 bg-white/5 hover:bg-white/10 transition"
                >
                  <Trash2 className="w-3.5 h-3.5 inline mr-1" /> 删除
                </button>
              </>
            )}
          </div>
        )}

        {/* 媒体卡片网格 */}
        {items.length === 0 ? (
          <div className="py-16 text-center border border-dashed border-white/10 rounded-3xl bg-white/[0.02]">
            {currentTab === 'trash' ? (
              <>
                <Trash2 className="w-10 h-10 mx-auto mb-3 text-slate-400" />
                <p className="text-slate-300 mb-1">垃圾桶是空的</p>
                <p className="text-xs text-slate-500">返回「未拍摄 / 已拍摄」查看素材</p>
              </>
            ) : (
              <>
                <FileVideo className="w-10 h-10 mx-auto mb-3 text-violet-300/60" />
                <p className="text-slate-300 mb-1">暂无素材</p>
                <p className="text-xs text-slate-500 mb-4">点击右上角「批量上传」上传图片或视频</p>
                <button
                  onClick={() => setShowUploadDialog(true)}
                  className="px-4 py-2 rounded-full border border-violet-400/40 bg-gradient-to-br from-violet-500 to-fuchsia-500 text-white text-sm font-medium hover:shadow-lg hover:shadow-violet-500/25 transition"
                >
                  <Upload className="w-4 h-4 inline mr-1.5" /> 批量上传
                </button>
              </>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {sortedItems.map((it, idx) => renderMediaCard(it, idx))}
          </div>
        )}
      </div>

      {/* 底部 Tab：未拍摄 / 已拍摄 / 垃圾桶（数字实时更新） */}
      <div className="fixed bottom-0 left-0 right-0 z-30 border-t border-white/10 bg-slate-900/90 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-2.5 flex items-center gap-2">
          {([
            { key: 'pending', label: '未拍摄', count: stats.pending },
            { key: 'done', label: '已拍摄', count: stats.done },
            { key: 'trash', label: '垃圾桶', count: stats.trash }
          ] as const).map(tab => {
            const isActive = currentTab === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => { setCurrentTab(tab.key); setSelectedIds(new Set()); }}
                className={`flex-1 py-2.5 rounded-2xl text-xs sm:text-sm font-medium transition ${
                  isActive
                    ? 'bg-gradient-to-br from-violet-500 to-fuchsia-500 text-white shadow-lg shadow-violet-500/25'
                    : 'text-slate-300 hover:bg-white/5'
                }`}
              >
                {tab.label} <span className={`ml-1 ${isActive ? 'text-white/90' : 'text-slate-400'}`}>({tab.count})</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ============ 弹窗 ============ */}

      {/* 新建场次 */}
      {showNewSceneModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => setShowNewSceneModal(false)}>
          <div className="w-full max-w-sm rounded-3xl border border-white/10 bg-slate-900/95 backdrop-blur-xl p-6 shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-semibold">新建场次</h2>
              <button onClick={() => setShowNewSceneModal(false)} className="w-8 h-8 rounded-full hover:bg-white/10 flex items-center justify-center">
                <X className="w-4 h-4" />
              </button>
            </div>
            <input
              type="text"
              value={newSceneName}
              onChange={(e) => setNewSceneName(e.target.value)}
              placeholder="例如：场景 1 - 客厅"
              className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 focus:border-violet-400/50 outline-none text-sm transition"
              onKeyDown={(e) => e.key === 'Enter' && createScene()}
              autoFocus
            />
            <div className="flex items-center justify-end gap-2 mt-5">
              <button onClick={() => setShowNewSceneModal(false)} className="px-3 py-2 rounded-xl text-sm text-slate-400 hover:text-white hover:bg-white/5 transition">取消</button>
              <button
                onClick={createScene}
                disabled={!newSceneName.trim()}
                className="px-4 py-2 rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-500 text-white text-sm font-medium disabled:opacity-40 transition"
              >创建</button>
            </div>
          </div>
        </div>
      )}

      {/* 重命名场次 */}
      {showRenameSceneId !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => setShowRenameSceneId(null)}>
          <div className="w-full max-w-sm rounded-3xl border border-white/10 bg-slate-900/95 backdrop-blur-xl p-6 shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-semibold">重命名场次</h2>
              <button onClick={() => setShowRenameSceneId(null)} className="w-8 h-8 rounded-full hover:bg-white/10 flex items-center justify-center">
                <X className="w-4 h-4" />
              </button>
            </div>
            <input
              type="text"
              value={renameSceneName}
              onChange={(e) => setRenameSceneName(e.target.value)}
              placeholder="新的场次名称"
              className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 focus:border-violet-400/50 outline-none text-sm transition"
              onKeyDown={(e) => e.key === 'Enter' && renameScene()}
              autoFocus
            />
            <div className="flex items-center justify-between mt-5">
              <button
                onClick={() => deleteScene(showRenameSceneId)}
                className="px-3 py-2 rounded-xl text-sm text-red-300 hover:text-red-200 hover:bg-red-500/10 transition"
              >
                删除本场次
              </button>
              <div className="flex items-center gap-2">
                <button onClick={() => setShowRenameSceneId(null)} className="px-3 py-2 rounded-xl text-sm text-slate-400 hover:text-white hover:bg-white/5 transition">取消</button>
                <button
                  onClick={renameScene}
                  disabled={!renameSceneName.trim()}
                  className="px-4 py-2 rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-500 text-white text-sm font-medium disabled:opacity-40 transition"
                >保存</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 移动到场次 */}
      {showMoveModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => setShowMoveModal(false)}>
          <div className="w-full max-w-sm rounded-3xl border border-white/10 bg-slate-900/95 backdrop-blur-xl p-6 shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-semibold">移动到...（{selectedIds.size} 项）</h2>
              <button onClick={() => setShowMoveModal(false)} className="w-8 h-8 rounded-full hover:bg-white/10 flex items-center justify-center">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-1.5 max-h-80 overflow-y-auto">
              <button
                onClick={() => batchMoveToScene(null)}
                className={`w-full text-left px-4 py-2.5 rounded-xl text-sm border transition ${currentSceneId === null ? 'border-violet-400/40 bg-violet-500/15 text-violet-100' : 'border-white/10 hover:bg-white/5'}`}
              >未分类</button>
              {sortedScenes.map(s => (
                <button
                  key={s.id}
                  onClick={() => batchMoveToScene(s.id)}
                  className={`w-full text-left px-4 py-2.5 rounded-xl text-sm border transition ${currentSceneId === s.id ? 'border-violet-400/40 bg-violet-500/15 text-violet-100' : 'border-white/10 hover:bg-white/5'}`}
                >{s.name}</button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 批量上传弹窗 */}
      {showUploadDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => {
          if (uploadingFiles.every(f => f.status !== 'uploading')) setShowUploadDialog(false);
        }}>
          <div className="w-full max-w-xl rounded-3xl border border-white/10 bg-slate-900/95 backdrop-blur-xl p-6 shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-base font-semibold">批量上传</h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  当前场次：{currentSceneId === null ? '未分类' : (scenes.find(s => s.id === currentSceneId)?.name || '')}
                </p>
              </div>
              <button onClick={() => {
                if (uploadingFiles.every(f => f.status !== 'uploading')) setShowUploadDialog(false);
              }} className="w-8 h-8 rounded-full hover:bg-white/10 flex items-center justify-center">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex gap-2 mb-4 bg-white/5 p-1 rounded-2xl">
              <button
                onClick={() => setUploadTab('file')}
                className={`flex-1 py-2 text-sm rounded-xl transition ${uploadTab === 'file' ? 'bg-gradient-to-br from-violet-500 to-fuchsia-500 text-white' : 'text-slate-400 hover:text-white'}`}
              >
                <Upload className="w-4 h-4 inline mr-1.5" /> 选择文件
              </button>
              <button
                onClick={() => setUploadTab('url')}
                className={`flex-1 py-2 text-sm rounded-xl transition ${uploadTab === 'url' ? 'bg-gradient-to-br from-violet-500 to-fuchsia-500 text-white' : 'text-slate-400 hover:text-white'}`}
              >
                <Link2 className="w-4 h-4 inline mr-1.5" /> 网络 URL
              </button>
            </div>

            {uploadTab === 'file' ? (
              <div>
                <label className="block border-2 border-dashed border-white/15 hover:border-violet-400/40 rounded-2xl p-8 text-center cursor-pointer transition bg-white/[0.02]">
                  <input
                    type="file"
                    multiple
                    accept="image/*,video/*"
                    className="hidden"
                    onChange={(e) => { if (e.target.files) handleUploadFiles(e.target.files); e.target.value = ''; }}
                  />
                  <ImageIcon className="w-10 h-10 mx-auto mb-3 text-violet-300/60" />
                  <p className="text-sm font-medium mb-1">点击选择图片或视频</p>
                  <p className="text-xs text-slate-500">支持多选，非图片视频文件会被自动忽略</p>
                </label>
              </div>
            ) : (
              <div>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={urlInputValue}
                    onChange={(e) => setUrlInputValue(e.target.value)}
                    placeholder="https://example.com/image.jpg 或 https://example.com/video.mp4"
                    className="flex-1 px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 focus:border-violet-400/50 outline-none text-sm transition"
                    onKeyDown={(e) => e.key === 'Enter' && handleUploadFromUrl()}
                  />
                  <button
                    onClick={handleUploadFromUrl}
                    disabled={!urlInputValue.trim()}
                    className="px-4 py-2.5 rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-500 text-white text-sm font-medium disabled:opacity-40 transition"
                  >转存</button>
                </div>
                <p className="text-xs text-slate-500 mt-2">URL 必须是公开可访问资源链接</p>
              </div>
            )}

            {/* 上传进度 */}
            {uploadingFiles.length > 0 && (
              <div className="mt-5 space-y-2">
                {uploadingFiles.map(f => (
                  <div key={f.id} className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.03] border border-white/10">
                    <div className="flex-1 min-w-0">
                      <div className="text-xs text-slate-200 truncate">{f.name}</div>
                      <div className="h-1.5 rounded-full bg-white/10 overflow-hidden mt-2">
                        <div
                          className={`h-full rounded-full transition-all ${f.status === 'error' ? 'bg-red-400' : f.status === 'done' ? 'bg-green-400' : 'bg-gradient-to-r from-violet-500 to-fuchsia-500'}`}
                          style={{ width: `${f.progress}%` }}
                        />
                      </div>
                    </div>
                    <div className="text-xs text-right">
                      {f.status === 'error' ? (
                        <span className="text-red-300">{f.message || '失败'}</span>
                      ) : (
                        <span className="text-slate-300">{f.message || `${f.progress}%`}</span>
                      )}
                    </div>
                  </div>
                ))}
                <div className="text-center pt-2">
                  <button
                    onClick={() => { setUploadingFiles([]); setShowUploadDialog(false); }}
                    className="px-4 py-2 rounded-full text-xs text-slate-400 hover:text-white hover:bg-white/5 transition"
                  >{uploadingFiles.every(f => f.status !== 'uploading') ? '关闭' : '完成后可点击关闭'}</button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 全屏查看 */}
      {fullscreenItem && (
        <div className="fixed inset-0 z-[80] bg-black/95 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setFullscreenItem(null)}>
          <button
            onClick={() => setFullscreenItem(null)}
            className="absolute top-4 right-4 w-10 h-10 rounded-full border border-white/25 bg-white/5 hover:bg-white/15 flex items-center justify-center text-white z-10"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="max-w-6xl w-full max-h-full" onClick={e => e.stopPropagation()}>
            {fullscreenItem.type === 'image' ? (
              <img src={fullscreenItem.url} alt={fullscreenItem.title} className="mx-auto max-w-full max-h-[80vh] object-contain rounded-2xl" />
            ) : (
              <video
                src={fullscreenItem.url}
                poster={getPosterUrl(fullscreenItem.url)}
                controls
                autoPlay
                playsInline
                className="mx-auto max-w-full max-h-[80vh] rounded-2xl bg-black"
              />
            )}
            <p className="text-center text-sm text-slate-300 mt-4">{fullscreenItem.title}</p>
          </div>
        </div>
      )}

      {/* 微信分享提示 */}
      <ShareHint
        isVisible={shareHintVisible}
        onClose={() => setShareHintVisible(false)}
        mode={shareHintMode}
      />

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[90] px-4 py-2.5 rounded-2xl bg-slate-800/95 border border-white/10 text-sm shadow-xl">
          <CheckCircle2 className="w-4 h-4 inline mr-2 text-green-400" />
          {toast}
        </div>
      )}
    </div>
  );
}
