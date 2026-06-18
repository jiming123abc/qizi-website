import { useState, useEffect, useRef, useCallback } from 'react';
import { Upload, Play, Check, Trash2, X, FileVideo, GripVertical, Maximize, Share2, Plus, ArrowLeft, RotateCcw } from 'lucide-react';
import { setupShareMetadata, copyToClipboard } from '../lib/shareUtils';

// ==================== 浏览器环境检测 ====================
const UA = typeof navigator !== 'undefined' ? navigator.userAgent : '';
const isWeChat = /MicroMessenger/i.test(UA);
const USE_CLICK_TO_PLAY = isWeChat;

// ==================== OSS 封面截图 URL ====================
function getPosterUrl(videoUrl: string): string {
  if (videoUrl.includes('qiziwenhua.top') || videoUrl.includes('aliyuncs.com')) {
    return videoUrl + '?x-oss-process=video/snapshot,t_1000,f_jpg,w_800,m_fast';
  }
  return '';
}
const POSTER_MAX_RETRY = 3;
const POSTER_RETRY_DELAY = 1500;

interface VideoItem {
  id: number;
  title: string;
  filename: string;
  url: string;
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
  errorMsg?: string;
}

const formatSize = (bytes: number): string => {
  if (!bytes || bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / 1024 / 1024).toFixed(1) + ' MB';
};

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return '今天';
  if (days === 1) return '昨天';
  if (days < 7) return `${days} 天前`;
  return `${Math.floor(days / 7)} 周前`;
}

// debounce helper
function debounce<T extends (...args: unknown[]) => void>(fn: T, ms: number): T {
  let timer: ReturnType<typeof setTimeout>;
  return ((...args: unknown[]) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), ms);
  }) as T;
}

interface Video2PageProps {
  projectId: number;
}

export function Video2Page({ projectId }: Video2PageProps) {
  const [project, setProject] = useState<Project | null>(null);
  const [scenes, setScenes] = useState<Scene[]>([]);
  const [videos, setVideos] = useState<VideoItem[]>([]);
  const [currentSceneId, setCurrentSceneId] = useState<number | null>(null); // null = 未分类
  const [currentTab, setCurrentTab] = useState<'pending' | 'done' | 'trash'>('pending');
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [stats, setStats] = useState({ pending: 0, done: 0, trash: 0, total: 0 });
  const [loading, setLoading] = useState(true);
  const [uploadingFiles, setUploadingFiles] = useState<UploadingFile[]>([]);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const [isSavingSort, setIsSavingSort] = useState(false);
  const [draggingId, setDraggingId] = useState<number | null>(null);
  const [dragOverId, setDragOverId] = useState<number | null>(null);
  const [editingTitleId, setEditingTitleId] = useState<number | null>(null);
  const [editingTitleText, setEditingTitleText] = useState('');
  const [showSceneMenu, setShowSceneMenu] = useState<number | null>(null); // sceneId
  const [showNewSceneModal, setShowNewSceneModal] = useState(false);
  const [newSceneName, setNewSceneName] = useState('');
  const [showMoveModal, setShowMoveModal] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [showDeleteProjectConfirm, setShowDeleteProjectConfirm] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRefs = useRef<Map<number, HTMLVideoElement>>(new Map());
  const posterRetryRef = useRef<Map<number, number>>(new Map());
  const posterReadyRef = useRef<Map<number, boolean>>(new Map());
  const nowPlayingIdRef = useRef<number | null>(null);
  const playLockRef = useRef<boolean>(false);
  const visibleVideosRef = useRef<Map<number, number>>(new Map());
  const ioRef = useRef<IntersectionObserver | null>(null);
  const saveSortDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  }, []);

  // 加载项目信息
  const loadProject = useCallback(async () => {
    try {
      const res = await fetch('/api/video2/projects');
      const data = await res.json();
      if (data.success) {
        const p = data.data.find((x: Project) => x.id === projectId);
        if (p) setProject(p);
      }
    } catch (e) { console.error('加载项目失败:', e); }
  }, [projectId]);

  // 加载场次列表
  const loadScenes = useCallback(async () => {
    try {
      const res = await fetch(`/api/video2/projects/${projectId}/scenes`);
      const data = await res.json();
      if (data.success) setScenes(data.data);
    } catch (e) { console.error('加载场次失败:', e); }
  }, [projectId]);

  // 加载视频列表 + 统计
  const loadVideos = useCallback(async () => {
    try {
      const params = new URLSearchParams({ projectId: String(projectId) });
      if (currentSceneId !== null) params.set('sceneId', String(currentSceneId));
      if (currentTab === 'trash') params.set('deleted', '1');
      else params.set('deleted', '0');
      if (currentTab !== 'trash') params.set('status', currentTab);

      const [listRes, statsRes] = await Promise.all([
        fetch(`/api/video2/list?${params.toString()}`),
        fetch(`/api/video2/stats?projectId=${projectId}`)
      ]);
      const [listData, statsData] = await Promise.all([listRes.json(), statsRes.json()]);
      if (listData.success) setVideos(listData.data);
      if (statsData.success) setStats(statsData.data);
    } catch (e) { console.error('加载视频失败:', e); }
    finally { setLoading(false); }
  }, [projectId, currentSceneId, currentTab]);

  useEffect(() => { setLoading(true); setSelectedIds(new Set()); }, [currentSceneId, currentTab]);
  useEffect(() => { loadProject(); loadScenes(); }, [loadProject, loadScenes]);
  useEffect(() => { loadVideos(); }, [loadVideos]);

  // 页面标题设置
  useEffect(() => {
    if (project) {
      document.title = project.name;
      setupShareMetadata({
        title: project.name,
        desc: project.description || '柒子文化拍摄辅助 · 项目分享',
        link: project.shareUrl,
        imgUrl: project.coverUrl || '/images/hero-home.png'
      });
    }
  }, [project]);

  // 滚动位置记忆
  const saveScrollPosition = useCallback(
    debounce((sceneId: number | null) => {
      if (sceneId === null) return;
      fetch(`/api/video2/scenes/${sceneId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scrollPosition: window.scrollY })
      }).catch(() => {});
    }, 300),
    []
  );

  // 恢复滚动位置
  useEffect(() => {
    if (!loading && currentSceneId !== null) {
      const scene = scenes.find(s => s.id === currentSceneId);
      if (scene?.scrollPosition) {
        window.scrollTo(0, scene.scrollPosition);
      }
    }
  }, [loading, currentSceneId, scenes]);

  // IntersectionObserver + 滚动自动播放
  const updatePlayingFromVisible = useCallback(() => {
    if (playLockRef.current) return;
    playLockRef.current = true;
    setTimeout(() => { playLockRef.current = false; }, 50);

    if (visibleVideosRef.current.size === 0) {
      videoRefs.current.forEach(v => { if (!v.paused) v.pause(); v.preload = 'none'; });
      nowPlayingIdRef.current = null;
      return;
    }
    let bestId: number | null = null, bestRatio = 0;
    visibleVideosRef.current.forEach((ratio, id) => { if (ratio > bestRatio) { bestRatio = ratio; bestId = id; } });

    if (bestId !== null) {
      const tv = videoRefs.current.get(bestId);
      if (tv) {
        const rect = tv.getBoundingClientRect();
        const center = rect.top + rect.height / 2;
        const dist = Math.abs(center - window.innerHeight / 2) / window.innerHeight;
        if (dist > 0.35) bestId = null;
      } else bestId = null;
    }

    videoRefs.current.forEach((video, id) => {
      if (id !== bestId) {
        if (!video.paused) video.pause();
        const ratio = visibleVideosRef.current.get(id);
        if (ratio === undefined || ratio < 0.3) video.preload = 'none';
        return;
      }
      video.preload = 'auto';
      if (USE_CLICK_TO_PLAY) return;
      if (video.paused) video.play().catch(() => {});
    });
    nowPlayingIdRef.current = bestId;
  }, []);

  // 注册/注销 video element
  const registerVideoRef = useCallback((id: number, el: HTMLVideoElement | null) => {
    if (el) {
      videoRefs.current.set(id, el);
      if (ioRef.current) ioRef.current.observe(el);
    } else {
      const old = videoRefs.current.get(id);
      if (old && ioRef.current) ioRef.current.unobserve(old);
      videoRefs.current.delete(id);
      visibleVideosRef.current.delete(id);
      if (nowPlayingIdRef.current === id) nowPlayingIdRef.current = null;
    }
  }, []);

  useEffect(() => {
    const supportsIO = typeof window !== 'undefined' && 'IntersectionObserver' in window;
    const updateFromRects = () => {
      let changed = false;
      videoRefs.current.forEach((el, id) => {
        const rect = el.getBoundingClientRect();
        const vh = window.innerHeight, vw = window.innerWidth;
        if (rect.bottom <= 0 || rect.top >= vh || rect.right <= 0 || rect.left >= vw) {
          if (visibleVideosRef.current.has(id)) { visibleVideosRef.current.delete(id); changed = true; }
          return;
        }
        const visH = Math.min(rect.bottom, vh) - Math.max(rect.top, 0);
        const visW = Math.min(rect.right, vw) - Math.max(rect.left, 0);
        const ratio = (rect.width * rect.height) > 0 ? (visH * visW) / (rect.width * rect.height) : 0;
        if (ratio >= 0.6) { if (visibleVideosRef.current.get(id) !== ratio) { visibleVideosRef.current.set(id, ratio); changed = true; } }
        else { if (visibleVideosRef.current.has(id)) { visibleVideosRef.current.delete(id); changed = true; } }
      });
      if (changed) updatePlayingFromVisible();
    };
    if (supportsIO) {
      ioRef.current = new IntersectionObserver((entries) => {
        let changed = false;
        entries.forEach(entry => {
          const el = entry.target as HTMLVideoElement;
          const id = Number(el.getAttribute('data-video-id'));
          if (!id || isNaN(id)) return;
          if (entry.intersectionRatio >= 0.6) { visibleVideosRef.current.set(id, entry.intersectionRatio); changed = true; }
          else { if (visibleVideosRef.current.has(id)) { visibleVideosRef.current.delete(id); changed = true; } }
        });
        if (changed) updatePlayingFromVisible();
      }, { threshold: [0.25, 0.4, 0.5, 0.6, 0.75, 0.9] });
      videoRefs.current.forEach(el => { if (ioRef.current) ioRef.current.observe(el); });
    }
    let rafId: number | null = null;
    const onScroll = () => {
      if (rafId !== null) return;
      rafId = window.requestAnimationFrame(() => { rafId = null; updateFromRects(); });
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    const t1 = setTimeout(() => updateFromRects(), 300);
    const t2 = setTimeout(() => updateFromRects(), 1200);
    return () => {
      clearTimeout(t1); clearTimeout(t2);
      window.removeEventListener('scroll', onScroll);
      if (rafId !== null) window.cancelAnimationFrame(rafId);
      if (ioRef.current) ioRef.current.disconnect();
    };
  }, [updatePlayingFromVisible]);

  // 切换播放/暂停
  const togglePlay = (videoEl: HTMLVideoElement, videoId: number) => {
    videoRefs.current.forEach((v, id) => { if (id !== videoId && !v.paused) v.pause(); });
    nowPlayingIdRef.current = videoId;
    if (videoEl.paused) videoEl.play().catch(() => {});
    else videoEl.pause();
  };

  // 全屏播放
  const toggleFullscreen = (videoEl: HTMLVideoElement, videoId: number) => {
    videoRefs.current.forEach((v, id) => { if (id !== videoId && !v.paused) v.pause(); });
    nowPlayingIdRef.current = videoId;
    videoEl.muted = false; videoEl.controls = true;
    const v = videoEl as any;
    const enterFs = () => {
      if (v.webkitEnterFullscreen) try { v.webkitEnterFullscreen(); } catch (e) {}
      else if (v.webkitRequestFullscreen) try { v.webkitRequestFullscreen(); } catch (e) {}
      else if (videoEl.requestFullscreen) videoEl.requestFullscreen().catch(() => {});
    };
    if (!videoEl.paused) { enterFs(); return; }
    videoEl.play().then(() => enterFs()).catch(() => enterFs());
  };

  // 上传视频
  const handleFileSelect = (files: FileList | null) => {
    if (!files) return;
    Array.from(files).forEach(f => { if (f.type.startsWith('video/')) uploadSingleFile(f); });
  };

  const uploadSingleFile = async (file: File) => {
    const uploadId = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const uploadingFile: UploadingFile = { id: uploadId, name: file.name, size: file.size, progress: 0, status: 'uploading' };
    setUploadingFiles(prev => [uploadingFile, ...prev]);
    try {
      const presignRes = await fetch('/api/oss/presign', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ folder: 'video2', filename: file.name, contentType: file.type || 'video/mp4' })
      });
      const presignData = await presignRes.json();
      if (!presignData.signedUrl || !presignData.publicUrl) throw new Error('获取上传凭证失败');
      const { signedUrl, publicUrl, key } = presignData;
      await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open('PUT', signedUrl);
        xhr.setRequestHeader('Content-Type', file.type || 'video/mp4');
        xhr.timeout = 30 * 60 * 1000;
        xhr.upload.addEventListener('progress', e => {
          if (e.lengthComputable) setUploadingFiles(prev => prev.map(f => f.id === uploadId ? { ...f, progress: Math.round(e.loaded / e.total * 95) } : f));
        });
        xhr.addEventListener('load', () => (xhr.status >= 200 && xhr.status < 300) ? resolve() : reject(new Error(`HTTP ${xhr.status}`)));
        xhr.addEventListener('error', () => reject(new Error('网络错误')));
        xhr.addEventListener('timeout', () => reject(new Error('上传超时')));
        xhr.send(file);
      });
      setUploadingFiles(prev => prev.map(f => f.id === uploadId ? { ...f, progress: 98 } : f));
      const addRes = await fetch('/api/video2/add', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: file.name.replace(/\.[^/.]+$/, ''),
          filename: key || file.name, url: publicUrl, size: file.size,
          projectId, sceneId: currentSceneId
        })
      });
      const addData = await addRes.json();
      if (!addData.success) throw new Error(addData.message);
      setUploadingFiles(prev => prev.map(f => f.id === uploadId ? { ...f, progress: 100, status: 'done' } : f));
      setTimeout(() => { setUploadingFiles(prev => prev.filter(f => f.id !== uploadId)); loadVideos(); }, 800);
    } catch (err) {
      setUploadingFiles(prev => prev.map(f => f.id === uploadId ? { ...f, status: 'error', errorMsg: err instanceof Error ? err.message : '未知错误' } : f));
    }
  };

  // 切换视频状态
  const toggleVideoStatus = async (video: VideoItem) => {
    const newStatus = video.status === 'pending' ? 'done' : 'pending';
    try {
      const res = await fetch(`/api/video2/${video.id}/status`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      const data = await res.json();
      if (data.success) {
        setVideos(prev => prev.map(v => v.id === video.id ? { ...v, status: newStatus } : v));
        loadVideos(); // 刷新列表和统计
      }
    } catch (e) { console.error('更新状态失败:', e); }
  };

  // 软删除视频
  const softDeleteVideo = async (videoId: number) => {
    try {
      const res = await fetch(`/api/video2/${videoId}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) { setVideos(prev => prev.filter(v => v.id !== videoId)); loadVideos(); showToast('已移入垃圾桶'); }
    } catch (e) { console.error('删除失败:', e); }
  };

  // 恢复视频
  const restoreVideo = async (videoId: number) => {
    try {
      const res = await fetch(`/api/video2/videos/${videoId}/restore`, { method: 'POST' });
      const data = await res.json();
      if (data.success) { setVideos(prev => prev.filter(v => v.id !== videoId)); loadVideos(); showToast('已恢复'); }
    } catch (e) { console.error('恢复失败:', e); }
  };

  // 彻底删除视频
  const hardDeleteVideo = async (videoId: number) => {
    if (!confirm('彻底删除后无法恢复，确定吗？')) return;
    try {
      const res = await fetch(`/api/video2/videos/${videoId}/hard`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) { setVideos(prev => prev.filter(v => v.id !== videoId)); loadVideos(); showToast('已彻底删除'); }
    } catch (e) { console.error('彻底删除失败:', e); }
  };

  // 修改标题
  const saveTitle = async (videoId: number) => {
    const text = editingTitleText.trim();
    if (!text) { setEditingTitleId(null); return; }
    try {
      const res = await fetch(`/api/video2/videos/${videoId}/title`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: text })
      });
      const data = await res.json();
      if (data.success) {
        setVideos(prev => prev.map(v => v.id === videoId ? { ...v, title: text } : v));
        showToast('标题已保存');
      }
    } catch (e) { console.error('保存标题失败:', e); }
    setEditingTitleId(null);
  };

  // 批量操作
  const handleBatchOp = async (op: 'softDelete' | 'restore' | 'hardDelete' | 'changeScene', sceneId?: number | null) => {
    if (selectedIds.size === 0) return;
    if (op === 'hardDelete' && !confirm(`彻底删除 ${selectedIds.size} 个视频，无法恢复！`)) return;
    try {
      const res = await fetch('/api/video2/videos/batch-update', {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ videoIds: Array.from(selectedIds), operation: op, sceneId: op === 'changeScene' ? (sceneId ?? null) : undefined })
      });
      const data = await res.json();
      if (data.success) {
        if (op === 'softDelete') showToast(`已删除 ${data.changes} 个视频到垃圾桶`);
        else if (op === 'restore') showToast(`已恢复 ${data.changes} 个视频`);
        else if (op === 'hardDelete') showToast(`已彻底删除 ${data.changes} 个视频`);
        else if (op === 'changeScene') showToast(`已移动 ${data.changes} 个视频`);
        setSelectedIds(new Set());
        setShowMoveModal(false);
        loadVideos();
      }
    } catch (e) { console.error('批量操作失败:', e); }
  };

  // 拖拽排序
  const scheduleSaveSort = useCallback((newVideos: VideoItem[]) => {
    if (saveSortDebounceRef.current) clearTimeout(saveSortDebounceRef.current);
    saveSortDebounceRef.current = setTimeout(async () => {
      setIsSavingSort(true);
      try {
        const orders = newVideos.map((v, idx) => ({ id: v.id, sortOrder: idx }));
        await fetch('/api/video2/sort', {
          method: 'PUT', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ orders })
        });
      } finally { setIsSavingSort(false); }
    }, 400);
  }, []);

  const moveVideo = useCallback((fromId: number, toId: number) => {
    setVideos(prev => {
      const filtered = prev.filter(v => v.status === (currentTab === 'trash' ? 'pending' : currentTab));
      const fromIdx = filtered.findIndex(v => v.id === fromId);
      let toIdx = filtered.findIndex(v => v.id === toId);
      if (fromIdx === -1 || toIdx === -1 || fromIdx === toIdx) return prev;
      const nextF = [...filtered]; const [moved] = nextF.splice(fromIdx, 1); nextF.splice(toIdx, 0, moved);
      const nextAll = [...prev]; let fIdx = 0;
      for (let i = 0; i < nextAll.length; i++) {
        if (nextAll[i].status === (currentTab === 'trash' ? 'pending' : currentTab)) nextAll[i] = nextF[fIdx++];
      }
      scheduleSaveSort(nextAll);
      return nextAll;
    });
  }, [currentTab, scheduleSaveSort]);

  const onCardDragStart = (e: React.DragEvent<HTMLDivElement>, id: number) => { setDraggingId(id); e.dataTransfer.effectAllowed = 'move'; e.dataTransfer.setData('text/plain', String(id)); };
  const onCardDragOver = (e: React.DragEvent<HTMLDivElement>, id: number) => { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; if (dragOverId !== id) setDragOverId(id); };
  const onCardDrop = (e: React.DragEvent<HTMLDivElement>, targetId: number) => { e.preventDefault(); e.stopPropagation(); setDraggingId(null); setDragOverId(null); const src = parseInt(e.dataTransfer.getData('text/plain')); if (src && src !== targetId) moveVideo(src, targetId); };
  const onCardDragEnd = () => { setDraggingId(null); setDragOverId(null); };

  const handleSceneChange = (sceneId: number | null) => {
    if (currentSceneId !== null && currentSceneId !== sceneId) saveScrollPosition(currentSceneId);
    setCurrentSceneId(sceneId);
    setSelectedIds(new Set());
  };

  const createScene = async () => {
    if (!newSceneName.trim()) return;
    try {
      const res = await fetch(`/api/video2/projects/${projectId}/scenes`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newSceneName.trim() })
      });
      const data = await res.json();
      if (data.success) { setScenes(prev => [...prev, data.data]); setShowNewSceneModal(false); setNewSceneName(''); showToast('场次创建成功'); }
    } catch (e) { console.error('创建场次失败:', e); }
  };

  const deleteScene = async (sceneId: number) => {
    if (!confirm('删除场次后，该场次下的视频将归到"未分类"，确定？')) return;
    try {
      const res = await fetch(`/api/video2/scenes/${sceneId}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) { setScenes(prev => prev.filter(s => s.id !== sceneId)); if (currentSceneId === sceneId) setCurrentSceneId(null); loadVideos(); showToast('场次已删除'); }
    } catch (e) { console.error('删除场次失败:', e); }
    setShowSceneMenu(null);
  };

  const renameScene = async (sceneId: number) => {
    const name = prompt('请输入新的场次名称');
    if (!name?.trim()) return;
    try {
      const res = await fetch(`/api/video2/scenes/${sceneId}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim() })
      });
      const data = await res.json();
      if (data.success) { setScenes(prev => prev.map(s => s.id === sceneId ? { ...s, name: name.trim() } : s)); showToast('场次已重命名'); }
    } catch (e) { console.error('重命名失败:', e); }
    setShowSceneMenu(null);
  };

  const toggleSelect = (id: number) => {
    setSelectedIds(prev => { const next = new Set(prev); next.has(id) ? next.delete(id) : next.add(id); return next; });
  };

  const selectAll = () => {
    if (selectedIds.size === filteredVideos.length) setSelectedIds(new Set());
    else setSelectedIds(new Set(filteredVideos.map(v => v.id)));
  };

  const filteredVideos = videos;

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0a0f1f] via-[#0d1033] to-[#0a0f1f] text-on-surface pb-20">
      {/* 顶部标题栏 */}
      <header className="sticky top-0 z-20 bg-[#0a0f1f]/95 backdrop-blur border-b border-white/10 px-4 py-3 flex items-center gap-3">
        <button onClick={() => window.location.href = '/video2'} className="p-1.5 rounded-lg hover:bg-white/10 transition-colors">
          <ArrowLeft className="w-5 h-5 text-white" />
        </button>
        <div className="flex-1 min-w-0">
          <h1 className="font-bold text-white truncate">{project?.name || '加载中...'}</h1>
        </div>
        {project && (
          <button onClick={async () => {
            setupShareMetadata({ title: project.name, desc: project.description || '项目分享', link: project.shareUrl, imgUrl: project.coverUrl || '/images/hero-home.png' });
            const ok = await copyToClipboard(project.shareUrl);
            showToast(ok ? '分享链接已复制' : '复制失败');
          }} className="p-2 rounded-lg hover:bg-white/10 transition-colors">
            <Share2 className="w-5 h-5 text-white" />
          </button>
        )}
        <button
          onClick={() => setIsUploadOpen(!isUploadOpen)}
          className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all flex items-center gap-1.5 ${
            isUploadOpen ? 'bg-white/10 text-white' : 'bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white shadow'
          }`}
        >
          {isUploadOpen ? <><X className="w-4 h-4" /> 关闭</> : <><Upload className="w-4 h-4" /> 上传</>}
        </button>
      </header>

      {/* 场次 Tab 栏 */}
      <div className="sticky top-[57px] z-10 bg-[#0a0f1f]/95 backdrop-blur border-b border-white/5 px-4 py-2 overflow-x-auto scrollbar-hide">
        <div className="flex items-center gap-2 w-max">
          <button
            onClick={() => handleSceneChange(null)}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
              currentSceneId === null ? 'bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white' : 'bg-white/5 text-white/70 hover:bg-white/10'
            }`}
          >
            未分类
          </button>
          {scenes.map(scene => (
            <div key={scene.id} className="relative">
              <button
                onClick={() => handleSceneChange(scene.id)}
                onContextMenu={e => { e.preventDefault(); setShowSceneMenu(showSceneMenu === scene.id ? null : scene.id); }}
                className={`px-4 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-all flex items-center gap-1 ${
                  currentSceneId === scene.id ? 'bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white' : 'bg-white/5 text-white/70 hover:bg-white/10'
                }`}
              >
                {scene.name}
                <span className="text-xs opacity-60">({scene.videoCount})</span>
              </button>
              {showSceneMenu === scene.id && (
                <div className="absolute top-full mt-1 right-0 bg-[#1a1a2e] border border-white/10 rounded-lg shadow-xl py-1 z-30 min-w-[100px]">
                  <button onClick={() => renameScene(scene.id)} className="w-full px-3 py-1.5 text-sm text-left hover:bg-white/10 text-white">重命名</button>
                  <button onClick={() => deleteScene(scene.id)} className="w-full px-3 py-1.5 text-sm text-left hover:bg-red-500/20 text-red-400">删除</button>
                </div>
              )}
            </div>
          ))}
          <button
            onClick={() => setShowNewSceneModal(true)}
            className="px-3 py-1.5 rounded-lg text-sm font-medium bg-white/5 text-white/70 hover:bg-white/10 transition-all flex items-center gap-1"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 批量工具栏 */}
      {selectedIds.size > 0 && currentTab !== 'trash' && (
        <div className="sticky top-[100px] z-10 bg-violet-600/90 backdrop-blur px-4 py-2 flex items-center gap-3 shadow-lg">
          <button onClick={selectAll} className="text-sm text-white/90 hover:text-white">
            {selectedIds.size === filteredVideos.length ? '取消全选' : '全选'}
          </button>
          <span className="text-sm text-white/80">已选 {selectedIds.size} 个</span>
          <div className="flex-1" />
          <button onClick={() => setShowMoveModal(true)} className="px-3 py-1 rounded-lg bg-white/20 hover:bg-white/30 text-sm text-white transition-colors">移动到</button>
          <button onClick={() => handleBatchOp('softDelete')} className="px-3 py-1 rounded-lg bg-red-500/80 hover:bg-red-500 text-sm text-white transition-colors flex items-center gap-1">
            <Trash2 className="w-3.5 h-3.5" /> 删除
          </button>
        </div>
      )}
      {selectedIds.size > 0 && currentTab === 'trash' && (
        <div className="sticky top-[100px] z-10 bg-[#1a1a2e] backdrop-blur border border-white/10 px-4 py-2 flex items-center gap-3 shadow-lg">
          <button onClick={selectAll} className="text-sm text-white/70 hover:text-white">
            {selectedIds.size === filteredVideos.length ? '取消全选' : '全选'}
          </button>
          <span className="text-sm text-white/60">已选 {selectedIds.size} 个</span>
          <div className="flex-1" />
          <button onClick={() => handleBatchOp('restore')} className="px-3 py-1 rounded-lg bg-green-600/80 hover:bg-green-600 text-sm text-white transition-colors flex items-center gap-1">
            <RotateCcw className="w-3.5 h-3.5" /> 恢复
          </button>
          <button onClick={() => handleBatchOp('hardDelete')} className="px-3 py-1 rounded-lg bg-red-600/80 hover:bg-red-600 text-sm text-white transition-colors flex items-center gap-1">
            <Trash2 className="w-3.5 h-3.5" /> 彻底删除
          </button>
        </div>
      )}

      {/* 上传区域 */}
      {isUploadOpen && currentTab !== 'trash' && (
        <div className="px-4 pt-3">
          <div
            onDragOver={e => { e.preventDefault(); setIsDragOver(true); }}
            onDragLeave={() => setIsDragOver(false)}
            onDrop={e => { e.preventDefault(); setIsDragOver(false); handleFileSelect(e.dataTransfer.files); }}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all ${isDragOver ? 'border-violet-400 bg-violet-500/10' : 'border-white/10 hover:border-violet-400/50'}`}
          >
            <input ref={fileInputRef} type="file" multiple accept="video/*" className="hidden"
              onChange={e => { handleFileSelect(e.target.files); e.target.value = ''; }} />
            <div className="flex flex-col items-center gap-2">
              <div className="w-12 h-12 rounded-full bg-violet-500/20 flex items-center justify-center">
                <FileVideo className="w-6 h-6 text-violet-400" />
              </div>
              <p className="text-sm text-white/70">点击选择视频文件或拖拽到此处上传</p>
            </div>
          </div>
          {/* 上传进度 */}
          {uploadingFiles.length > 0 && (
            <div className="mt-3 space-y-2">
              {uploadingFiles.map(f => (
                <div key={f.id} className="bg-white/5 border border-white/10 rounded-xl p-3 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-violet-500/20 flex items-center justify-center flex-shrink-0">
                    {f.status === 'done' ? <Check className="w-4 h-4 text-green-400" /> : f.status === 'error' ? <X className="w-4 h-4 text-red-400" /> : <Play className="w-4 h-4 text-violet-400" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between mb-1">
                      <span className="text-sm truncate max-w-[180px]">{f.name}</span>
                      <span className="text-xs text-white/50 ml-2 flex-shrink-0">
                        {f.status === 'done' ? '完成' : f.status === 'error' ? '失败' : `${f.progress}%`}
                      </span>
                    </div>
                    <div className="h-1 bg-white/10 rounded-full overflow-hidden">
                      <div className={`h-full transition-all ${f.status === 'error' ? 'bg-red-500' : f.status === 'done' ? 'bg-green-500' : 'bg-gradient-to-r from-violet-500 to-fuchsia-500'}`}
                        style={{ width: `${f.progress}%` }} />
                    </div>
                    {f.status === 'error' && f.errorMsg && <p className="text-xs text-red-400 mt-1">{f.errorMsg}</p>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 视频列表 */}
      <div className="px-4 pt-4">
        {loading ? (
          <div className="text-center py-16 text-white/50">加载中...</div>
        ) : filteredVideos.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-16 h-16 mx-auto rounded-full bg-white/5 flex items-center justify-center mb-4">
              <FileVideo className="w-8 h-8 text-white/30" />
            </div>
            <p className="text-white/50">
              {currentTab === 'trash' ? '垃圾桶是空的' : currentTab === 'pending' ? '暂无未拍摄视频' : '暂无已拍摄视频'}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredVideos.map(video => (
              <div
                key={video.id} data-video-card data-id={video.id}
                draggable={currentTab !== 'trash'}
                onDragStart={e => onCardDragStart(e, video.id)}
                onDragOver={e => onCardDragOver(e, video.id)}
                onDrop={e => onCardDrop(e, video.id)}
                onDragEnd={onCardDragEnd}
                className={`bg-[#111827] border rounded-2xl overflow-hidden transition-all select-none ${
                  draggingId === video.id ? 'opacity-40 border-violet-400 scale-[0.98]' :
                  dragOverId === video.id ? 'border-violet-400 shadow-lg shadow-violet-500/20' : 'border-white/10'
                }`}
              >
                {/* 播放区 */}
                <div className="relative bg-black aspect-video overflow-hidden">
                  {(() => {
                    const posterUrl = getPosterUrl(video.url);
                    return posterUrl ? (
                      <img data-poster-img={video.id} src={posterUrl} alt={video.title}
                        className="absolute inset-0 w-full h-full object-cover z-10"
                        style={{ opacity: 1, transition: 'opacity 200ms' }}
                        onError={e => {
                          const el = e.currentTarget as HTMLImageElement;
                          const retries = posterRetryRef.current.get(video.id) || 0;
                          if (retries < POSTER_MAX_RETRY) {
                            posterRetryRef.current.set(video.id, retries + 1);
                            const t = setTimeout(() => { el.src = getPosterUrl(video.url) + '&_retry=' + Date.now(); }, POSTER_RETRY_DELAY * (retries + 1));
                            el.addEventListener('load', () => clearTimeout(t), { once: true });
                          } else { posterReadyRef.current.set(video.id, true); }
                        }} />
                    ) : null;
                  })()}
                  <video
                    ref={el => registerVideoRef(video.id, el)}
                    data-video-id={video.id} src={video.url}
                    poster={getPosterUrl(video.url) || undefined} loop muted playsInline preload="none"
                    onClick={() => { const v = videoRefs.current.get(video.id); if (v) togglePlay(v, video.id); }}
                    onPlay={e => {
                      const v = e.currentTarget as HTMLVideoElement;
                      v.style.opacity = '1';
                      const poster = v.parentElement?.querySelector(`[data-poster-img="${video.id}"]`) as HTMLImageElement;
                      if (poster) poster.style.opacity = '0';
                      const playBtn = v.parentElement?.querySelector(`[data-play-button="${video.id}"]`) as HTMLElement;
                      if (playBtn) { playBtn.style.opacity = '0'; playBtn.style.pointerEvents = 'none'; }
                    }}
                    onPause={e => {
                      const v = e.currentTarget as HTMLVideoElement;
                      v.style.opacity = '0';
                      const poster = v.parentElement?.querySelector(`[data-poster-img="${video.id}"]`) as HTMLImageElement;
                      if (poster) poster.style.opacity = '1';
                      const playBtn = v.parentElement?.querySelector(`[data-play-button="${video.id}"]`) as HTMLElement;
                      if (playBtn) { playBtn.style.opacity = '1'; playBtn.style.pointerEvents = 'auto'; }
                    }}
                    onEnded={e => {
                      const v = e.currentTarget as HTMLVideoElement; v.style.opacity = '0';
                      const poster = v.parentElement?.querySelector(`[data-poster-img="${video.id}"]`) as HTMLImageElement;
                      if (poster) poster.style.opacity = '1';
                      const playBtn = v.parentElement?.querySelector(`[data-play-button="${video.id}"]`) as HTMLElement;
                      if (playBtn) { playBtn.style.opacity = '1'; playBtn.style.pointerEvents = 'auto'; }
                    }}
                    onFullscreenChange={e => {
                      const v = e.target as HTMLVideoElement;
                      const fsEl = (document as any).fullscreenElement || (document as any).webkitFullscreenElement;
                      if (!fsEl || fsEl !== v) { v.muted = true; v.controls = false; }
                    }}
                    className="absolute inset-0 w-full h-full object-contain cursor-pointer" style={{ opacity: 0, transition: 'opacity 200ms', background: 'transparent' }} />
                  {/* 播放按钮：蓝紫渐变粗线 */}
                  <div onClick={e => { e.stopPropagation(); const v = videoRefs.current.get(video.id); if (v) togglePlay(v, video.id); }}
                    className="absolute inset-0 flex items-center justify-center z-20 cursor-pointer"
                    data-play-button={video.id} style={{ transition: 'opacity 200ms' }}>
                    <div className="w-14 h-14 rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center shadow-lg shadow-fuchsia-500/40 hover:scale-105 transition-transform">
                      <Play className="w-7 h-7 text-white ml-0.5" strokeWidth={2.5} />
                    </div>
                  </div>
                  {/* 全屏按钮：蓝紫渐变 */}
                  <button onClick={e => { e.stopPropagation(); const v = videoRefs.current.get(video.id); if (v) toggleFullscreen(v, video.id); }}
                    className="absolute bottom-2 right-2 w-9 h-9 rounded-full bg-gradient-to-br from-violet-500/80 to-fuchsia-500/80 flex items-center justify-center z-20 hover:scale-105 transition-transform shadow">
                    <Maximize className="w-4 h-4 text-white" strokeWidth={2.5} />
                  </button>
                  {/* 复选框 */}
                  <button onClick={() => toggleSelect(video.id)}
                    className={`absolute top-2 left-2 w-7 h-7 rounded-lg border-2 flex items-center justify-center z-20 transition-all ${
                      selectedIds.has(video.id) ? 'bg-violet-500 border-violet-500' : 'bg-black/40 border-white/40 hover:border-white/70'
                    }`}>
                    {selectedIds.has(video.id) && <Check className="w-4 h-4 text-white" strokeWidth={3} />}
                  </button>
                </div>
                {/* 底部信息栏 */}
                <div className="flex items-center gap-2 p-3">
                  {/* 标题 */}
                  <div className="flex-1 min-w-0">
                    {editingTitleId === video.id ? (
                      <input
                        autoFocus value={editingTitleText}
                        onChange={e => setEditingTitleText(e.target.value)}
                        onBlur={() => saveTitle(video.id)}
                        onKeyDown={e => { if (e.key === 'Enter') saveTitle(video.id); if (e.key === 'Escape') setEditingTitleId(null); }}
                        className="w-full px-2 py-0.5 bg-white/10 border border-violet-400/50 rounded text-sm text-white focus:outline-none"
                      />
                    ) : (
                      <p onClick={() => currentTab !== 'trash' && (setEditingTitleId(video.id), setEditingTitleText(video.title))}
                        className={`text-sm font-medium truncate cursor-pointer hover:text-violet-300 ${currentTab === 'trash' ? 'text-white/50' : 'text-white'}`}>
                        {video.title}
                      </p>
                    )}
                    <div className="flex items-center gap-2 mt-0.5">
                      {currentTab === 'trash' ? (
                        <span className="text-xs text-white/40">{timeAgo(video.deletedAt || video.updatedAt)}</span>
                      ) : (
                        <>
                          <span className="text-xs text-white/40">{formatSize(video.size)}</span>
                          <button
                            onClick={() => toggleVideoStatus(video)}
                            className={`px-2 py-0.5 rounded text-xs font-medium transition-colors ${
                              video.status === 'done' ? 'bg-green-500/20 text-green-400 hover:bg-green-500/30' : 'bg-white/10 text-white/60 hover:bg-white/20'
                            }`}>
                            {video.status === 'done' ? '✓ 已拍摄' : '○ 未拍摄'}
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                  {currentTab === 'trash' ? (
                    <div className="flex items-center gap-1">
                      <button onClick={() => restoreVideo(video.id)} className="p-2 rounded-lg text-green-400/70 hover:text-green-400 hover:bg-green-500/20 transition-all" title="恢复">
                        <RotateCcw className="w-4 h-4" />
                      </button>
                      <button onClick={() => hardDeleteVideo(video.id)} className="p-2 rounded-lg text-red-400/70 hover:text-red-400 hover:bg-red-500/20 transition-all" title="彻底删除">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <>
                      {currentTab !== 'trash' && (
                        <div className="flex items-center justify-center flex-shrink-0 w-7 h-7">
                          <GripVertical className="w-4 h-4 text-white/30 cursor-grab" />
                        </div>
                      )}
                      <button onClick={() => softDeleteVideo(video.id)} className="p-2 rounded-lg text-white/40 hover:text-red-400 hover:bg-red-500/10 transition-all" title="删除到垃圾桶">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 底部常驻 Tab（sticky） */}
      <div className="fixed bottom-0 left-0 right-0 z-20 bg-[#0a0f1f]/95 backdrop-blur border-t border-white/10 flex">
        {([
          { key: 'pending', label: '未拍摄', count: stats.pending },
          { key: 'done', label: '已拍摄', count: stats.done },
          { key: 'trash', label: '垃圾桶', count: stats.trash, red: true }
        ] as const).map(tab => (
          <button key={tab.key}
            onClick={() => { setCurrentTab(tab.key); setSelectedIds(new Set()); }}
            className={`flex-1 py-3 text-sm font-medium transition-all flex items-center justify-center gap-1.5 ${
              currentTab === tab.key ? 'border-t-2 border-violet-500 text-white' : 'text-white/50 hover:text-white/80 border-t-2 border-transparent'
            } ${tab.red ? 'text-red-400/70' : ''}`}
          >
            {tab.label}({tab.count})
          </button>
        ))}
      </div>

      {/* 新建场次弹窗 */}
      {showNewSceneModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setShowNewSceneModal(false)}>
          <div className="bg-[#1a1a2e] rounded-xl border border-white/10 w-full max-w-sm p-5" onClick={e => e.stopPropagation()}>
            <h3 className="font-bold text-white mb-3">新建场次</h3>
            <input autoFocus type="text" value={newSceneName} onChange={e => setNewSceneName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && createScene()}
              placeholder="例如：场地A / 补拍" className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-violet-400" />
            <div className="flex justify-end gap-2 mt-3">
              <button onClick={() => setShowNewSceneModal(false)} className="px-4 py-2 rounded-lg border border-white/10 text-white/70 text-sm hover:bg-white/10">取消</button>
              <button onClick={createScene} className="px-4 py-2 rounded-lg bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white text-sm font-medium">创建</button>
            </div>
          </div>
        </div>
      )}

      {/* 移动到场次弹窗 */}
      {showMoveModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setShowMoveModal(false)}>
          <div className="bg-[#1a1a2e] rounded-xl border border-white/10 w-full max-w-sm p-5" onClick={e => e.stopPropagation()}>
            <h3 className="font-bold text-white mb-3">移动到</h3>
            <button onClick={() => handleBatchOp('changeScene', null)} className="w-full text-left px-3 py-2 rounded-lg hover:bg-white/10 text-white/80 text-sm transition-colors">
              未分类
            </button>
            {scenes.map(s => (
              <button key={s.id} onClick={() => handleBatchOp('changeScene', s.id)}
                className="w-full text-left px-3 py-2 rounded-lg hover:bg-white/10 text-white/80 text-sm transition-colors">
                {s.name}
              </button>
            ))}
            <div className="mt-3 flex justify-end">
              <button onClick={() => setShowMoveModal(false)} className="px-4 py-2 rounded-lg border border-white/10 text-white/70 text-sm hover:bg-white/10">取消</button>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-full bg-white/90 text-gray-900 text-sm shadow-lg">
          {toast}
        </div>
      )}
    </div>
  );
}
