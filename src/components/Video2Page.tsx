import { useState, useEffect, useRef, useCallback } from 'react';
import { Upload, Play, Check, Trash2, X, FileVideo, GripVertical } from 'lucide-react';

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
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  if (bytes < 1024 * 1024 * 1024) return (bytes / 1024 / 1024).toFixed(1) + ' MB';
  return (bytes / 1024 / 1024 / 1024).toFixed(2) + ' GB';
};

export function Video2Page() {
  const [videos, setVideos] = useState<VideoItem[]>([]);
  const [currentTab, setCurrentTab] = useState<'pending' | 'done'>('pending');
  const [uploadingFiles, setUploadingFiles] = useState<UploadingFile[]>([]);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState({ pending: 0, done: 0, total: 0 });
  const [draggingId, setDraggingId] = useState<number | null>(null);
  const [dragOverId, setDragOverId] = useState<number | null>(null);
  const [isSavingSort, setIsSavingSort] = useState(false);

  // Touch 拖拽支持（移动端）
  const listContainerRef = useRef<HTMLDivElement>(null);
  const touchDragRef = useRef<{
    active: boolean;
    draggedId: number | null;
    startY: number;
    offsetY: number;
    ghost: HTMLDivElement | null;
    touchedCount: number;
  } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRefs = useRef<Map<number, HTMLVideoElement>>(new Map());
  const rafPendingRef = useRef<number | null>(null);
  const saveSortDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // 加载视频列表
  const loadVideos = useCallback(async () => {
    try {
      setIsLoading(true);
      const listRes = await fetch('/api/video2/list');
      const listData = await listRes.json();
      if (listData.success) {
        setVideos(listData.data || []);
      }
      const statsRes = await fetch('/api/video2/stats');
      const statsData = await statsRes.json();
      if (statsData.success) {
        setStats(statsData.data);
      }
    } catch (e) {
      console.error('加载视频列表失败:', e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadVideos();
  }, [loadVideos]);

  // 滚动检测：居中视频自动播放
  useEffect(() => {
    const handleScroll = () => {
      if (rafPendingRef.current !== null) return;
      rafPendingRef.current = requestAnimationFrame(() => {
        rafPendingRef.current = null;
        const viewportCenter = window.innerHeight / 2;
        let closestVideo: HTMLVideoElement | null = null;
        let closestDistance = Infinity;

        videoRefs.current.forEach((video) => {
          const rect = video.getBoundingClientRect();
          if (rect.height <= 0) return;
          const videoCenter = rect.top + rect.height / 2;
          const distance = Math.abs(videoCenter - viewportCenter);
          if (distance < closestDistance) {
            closestDistance = distance;
            closestVideo = video;
          }
        });

        videoRefs.current.forEach((video) => {
          if (video === closestVideo && closestDistance < 400) {
            video.play().catch(() => {});
          } else {
            video.pause();
          }
        });
      });
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', handleScroll);
    handleScroll();

    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleScroll);
      if (rafPendingRef.current !== null) {
        cancelAnimationFrame(rafPendingRef.current);
      }
    };
  }, [currentTab, videos]);

  // 上传视频
  const handleFileSelect = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    Array.from(files).forEach((file) => {
      if (!file.type.startsWith('video/')) return;
      uploadSingleFile(file);
    });
  };

  const uploadSingleFile = async (file: File) => {
    const uploadId = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const uploadingFile: UploadingFile = {
      id: uploadId,
      name: file.name,
      size: file.size,
      progress: 0,
      status: 'uploading',
    };
    setUploadingFiles((prev) => [uploadingFile, ...prev]);

    try {
      const presignRes = await fetch('/api/oss/presign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          folder: 'video2',
          filename: file.name,
          contentType: file.type || 'video/mp4',
        }),
      });
      const presignData = await presignRes.json();
      if (!presignData.signedUrl || !presignData.publicUrl) {
        throw new Error('获取上传凭证失败');
      }
      const { signedUrl, publicUrl, key } = presignData;

      await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open('PUT', signedUrl);
        xhr.setRequestHeader('Content-Type', file.type || 'video/mp4');
        xhr.timeout = 30 * 60 * 1000;

        xhr.upload.addEventListener('progress', (event) => {
          if (event.lengthComputable) {
            const percent = Math.round((event.loaded / event.total) * 95);
            setUploadingFiles((prev) =>
              prev.map((f) => (f.id === uploadId ? { ...f, progress: percent } : f))
            );
          }
        });

        xhr.addEventListener('load', () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            resolve();
          } else {
            reject(new Error(`上传失败: HTTP ${xhr.status}`));
          }
        });

        xhr.addEventListener('error', () => reject(new Error('网络错误，上传失败')));
        xhr.addEventListener('timeout', () => reject(new Error('上传超时，请检查网络')));

        xhr.send(file);
      });

      setUploadingFiles((prev) =>
        prev.map((f) => (f.id === uploadId ? { ...f, progress: 98 } : f))
      );

      const addRes = await fetch('/api/video2/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: file.name.replace(/\.[^/.]+$/, ''),
          filename: key || file.name,
          url: publicUrl,
          size: file.size,
        }),
      });
      const addData = await addRes.json();
      if (!addData.success) {
        throw new Error(addData.message || '记录失败');
      }

      setUploadingFiles((prev) =>
        prev.map((f) => (f.id === uploadId ? { ...f, progress: 100, status: 'done' } : f))
      );

      setTimeout(() => {
        setUploadingFiles((prev) => prev.filter((f) => f.id !== uploadId));
        loadVideos();
      }, 800);
    } catch (err) {
      console.error('上传失败:', err);
      setUploadingFiles((prev) =>
        prev.map((f) =>
          f.id === uploadId
            ? { ...f, status: 'error', errorMsg: err instanceof Error ? err.message : '未知错误' }
            : f
        )
      );
    }
  };

  // 切换视频状态
  const toggleVideoStatus = async (video: VideoItem) => {
    const newStatus = video.status === 'pending' ? 'done' : 'pending';
    try {
      const res = await fetch(`/api/video2/${video.id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await res.json();
      if (data.success) {
        setVideos((prev) =>
          prev.map((v) => (v.id === video.id ? { ...v, status: newStatus } : v))
        );
        setStats((prev) => {
          const next = { ...prev };
          if (video.status === 'pending') {
            next.pending -= 1;
            next.done += 1;
          } else {
            next.done -= 1;
            next.pending += 1;
          }
          return next;
        });
      }
    } catch (e) {
      console.error('更新状态失败:', e);
    }
  };

  // 删除视频
  const deleteVideo = async (video: VideoItem) => {
    if (!confirm(`确定删除视频 "${video.title}" 吗？`)) return;
    try {
      const res = await fetch(`/api/video2/${video.id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        setVideos((prev) => prev.filter((v) => v.id !== video.id));
        setStats((prev) => ({
          ...prev,
          [video.status]: (prev[video.status as keyof typeof prev] || 0) - 1,
          total: prev.total - 1,
        }));
      }
    } catch (e) {
      console.error('删除失败:', e);
    }
  };

  // 点击视频：全屏播放
  const handleVideoClick = (video: HTMLVideoElement) => {
    if (video.paused) {
      video.play().catch(() => {});
    }
    const requestFs =
      video.requestFullscreen ||
      (video as any).webkitRequestFullscreen ||
      (video as any).mozRequestFullScreen;
    if (requestFs) {
      requestFs.call(video).catch(() => {});
    }
  };

  const registerVideoRef = (id: number, el: HTMLVideoElement | null) => {
    if (el) {
      videoRefs.current.set(id, el);
    } else {
      videoRefs.current.delete(id);
    }
  };

  // ============ 拖拽排序核心逻辑 ============

  // 保存排序到服务器（防抖）
  const scheduleSaveSort = useCallback((newVideos: VideoItem[]) => {
    if (saveSortDebounceRef.current) {
      clearTimeout(saveSortDebounceRef.current);
    }
    saveSortDebounceRef.current = setTimeout(async () => {
      setIsSavingSort(true);
      try {
        const orders = newVideos.map((v, idx) => ({ id: v.id, sortOrder: idx }));
        const res = await fetch('/api/video2/sort', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ orders }),
        });
        const data = await res.json();
        if (!data.success) {
          console.warn('排序保存失败:', data.message);
        }
      } catch (e) {
        console.error('排序保存异常:', e);
      } finally {
        setIsSavingSort(false);
      }
    }, 400);
  }, []);

  // 移动视频到新位置（本地状态立即更新）
  const moveVideo = useCallback(
    (fromId: number, toId: number) => {
      setVideos((prev) => {
        // 先按当前 tab 过滤
        const currentStatus =
          prev.find(v => v.id === fromId)?.status || 'pending';
        const filtered = prev.filter(v => v.status === currentStatus);
        const fromIdx = filtered.findIndex(v => v.id === fromId);
        let toIdx = filtered.findIndex(v => v.id === toId);
        if (fromIdx === -1 || toIdx === -1 || fromIdx === toIdx) return prev;

        const nextFiltered = [...filtered];
        const [moved] = nextFiltered.splice(fromIdx, 1);
        nextFiltered.splice(toIdx, 0, moved);

        // 把新顺序放回全部 videos
        const nextAll = [...prev];
        let fIdx = 0;
        for (let i = 0; i < nextAll.length; i++) {
          if (nextAll[i].status === currentStatus) {
            nextAll[i] = nextFiltered[fIdx++];
          }
        }
        scheduleSaveSort(nextAll);
        return nextAll;
      });
    },
    [scheduleSaveSort]
  );

  // HTML5 原生拖拽（桌面端）
  const onCardDragStart = (e: React.DragEvent<HTMLDivElement>, id: number) => {
    setDraggingId(id);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', String(id));
    // 让 drag 图像为整张卡片（浏览器默认已支持）
  };

  const onCardDragOver = (e: React.DragEvent<HTMLDivElement>, id: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverId !== id) {
      setDragOverId(id);
    }
  };

  const onCardDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    // 用 setTimeout 判断是否真正离开
    const related = e.relatedTarget as HTMLElement | null;
    if (!related || !related.closest('[data-video-card]')) {
      setDragOverId(null);
    }
  };

  const onCardDrop = (e: React.DragEvent<HTMLDivElement>, targetId: number) => {
    e.preventDefault();
    e.stopPropagation();
    const sourceIdStr = e.dataTransfer.getData('text/plain');
    const sourceId = sourceIdStr ? parseInt(sourceIdStr) : draggingId;
    setDraggingId(null);
    setDragOverId(null);
    if (sourceId && sourceId !== targetId) {
      moveVideo(sourceId, targetId);
    }
  };

  const onCardDragEnd = () => {
    setDraggingId(null);
    setDragOverId(null);
  };

  // 触摸拖拽（移动端）- 在拖动手柄上触发
  const onHandleTouchStart = (e: React.TouchEvent, videoId: number, rect: DOMRect) => {
    // 初始化状态
    const t = e.touches[0];
    touchDragRef.current = {
      active: true,
      draggedId: videoId,
      startY: t.clientY,
      offsetY: 0,
      ghost: null,
      touchedCount: 0,
    };
    setDraggingId(videoId);
    // 防止滚动
    e.preventDefault();

    // 创建 ghost 元素
    const card = (e.currentTarget as HTMLElement).closest('[data-video-card]');
    if (card) {
      const ghost = (card as HTMLElement).cloneNode(true) as HTMLDivElement;
      ghost.style.position = 'fixed';
      ghost.style.left = rect.left + 'px';
      ghost.style.top = rect.top + 'px';
      ghost.style.width = rect.width + 'px';
      ghost.style.zIndex = '9999';
      ghost.style.opacity = '0.85';
      ghost.style.pointerEvents = 'none';
      ghost.style.transform = 'scale(0.95)';
      ghost.style.boxShadow = '0 8px 24px rgba(0,0,0,0.5)';
      // 移除 ghost 中的 video 元素（防止播放干扰）
      const ghostVideo = ghost.querySelector('video');
      if (ghostVideo) ghostVideo.remove();
      document.body.appendChild(ghost);
      touchDragRef.current!.ghost = ghost;
    }
  };

  const onHandleTouchMove = (e: React.TouchEvent) => {
    const st = touchDragRef.current;
    if (!st || !st.active || !st.ghost) return;
    e.preventDefault();
    const t = e.touches[0];
    st.offsetY = t.clientY - st.startY;
    const startTop = parseFloat(st.ghost.style.top) || 0;
    st.ghost.style.top = (startTop + st.offsetY) + 'px';

    // 悬停检测：获取当前手指位置下的卡片
    st.ghost.style.pointerEvents = 'none';
    const elAtPoint = document.elementFromPoint(t.clientX, t.clientY);
    const targetCard = elAtPoint?.closest('[data-video-card]') as HTMLElement | null;
    if (targetCard) {
      const id = parseInt(targetCard.getAttribute('data-id') || '0');
      if (id && id !== st.draggedId) {
        setDragOverId(id);
        return;
      }
    }
    setDragOverId(null);
  };

  const onHandleTouchEnd = (e: React.TouchEvent) => {
    const st = touchDragRef.current;
    if (!st || !st.active) return;
    const draggedId = st.draggedId;
    const targetId = dragOverId;

    // 清理 ghost
    if (st.ghost && st.ghost.parentNode) {
      st.ghost.parentNode.removeChild(st.ghost);
    }
    st.active = false;
    st.draggedId = null;
    st.ghost = null;
    setDraggingId(null);
    setDragOverId(null);

    if (draggedId && targetId && draggedId !== targetId) {
      moveVideo(draggedId, targetId);
    }
  };

  const filteredVideos = videos.filter((v) => v.status === currentTab);

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0a0f1f] via-[#0d1033] to-[#0a0f1f] text-on-surface">
      {/* 顶部：标题 + 统计 */}
      <div className="px-4 py-6 md:px-8 md:py-8">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-violet-400 via-purple-400 to-fuchsia-400 bg-clip-text text-transparent">
                视频片段管理
              </h1>
              <p className="text-sm text-on-surface-variant/70 mt-1">
                共 {stats.total} 个视频 · 未拍摄 {stats.pending} · 已拍摄 {stats.done}
                {isSavingSort && ' · 保存排序中...'}
              </p>
            </div>
            <button
              onClick={() => setIsUploadOpen(!isUploadOpen)}
              className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-all flex items-center gap-2 ${
                isUploadOpen
                  ? 'bg-surface-container border border-white/10 text-on-surface'
                  : 'bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white shadow-lg shadow-fuchsia-500/20 hover:shadow-fuchsia-500/40'
              }`}
            >
              {isUploadOpen ? (
                <>
                  <X className="w-4 h-4" /> 关闭
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4" /> 上传视频
                </>
              )}
            </button>
          </div>

          {/* 上传区域 */}
          {isUploadOpen && (
            <div className="mb-6">
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragOver(true);
                }}
                onDragLeave={() => setIsDragOver(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setIsDragOver(false);
                  handleFileSelect(e.dataTransfer.files);
                }}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-2xl p-6 md:p-10 text-center cursor-pointer transition-all ${
                  isDragOver
                    ? 'border-violet-400 bg-violet-500/10'
                    : 'border-white/10 bg-surface-container/50 hover:border-violet-400/50 hover:bg-surface-container'
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept="video/*"
                  className="hidden"
                  onChange={(e) => {
                    handleFileSelect(e.target.files);
                    e.target.value = '';
                  }}
                />
                <div className="flex flex-col items-center gap-3">
                  <div className="w-14 h-14 rounded-full bg-gradient-to-br from-violet-500/20 to-fuchsia-500/20 flex items-center justify-center">
                    <FileVideo className="w-7 h-7 text-violet-400" />
                  </div>
                  <div>
                    <p className="text-base font-medium text-on-surface">
                      点击选择文件或拖拽视频到此处
                    </p>
                    <p className="text-sm text-on-surface-variant/60 mt-1">
                      支持 MP4、WebM、MOV 等常见视频格式，可多选上传
                    </p>
                  </div>
                </div>
              </div>

              {/* 上传进度列表 */}
              {uploadingFiles.length > 0 && (
                <div className="mt-4 space-y-2">
                  {uploadingFiles.map((f) => (
                    <div
                      key={f.id}
                      className="bg-surface-container border border-white/10 rounded-xl p-3 flex items-center gap-3"
                    >
                      <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center flex-shrink-0">
                        {f.status === 'done' ? (
                          <Check className="w-4 h-4 text-green-400" />
                        ) : f.status === 'error' ? (
                          <X className="w-4 h-4 text-red-400" />
                        ) : (
                          <Play className="w-4 h-4 text-primary" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-medium truncate max-w-[200px]">
                            {f.name}
                          </span>
                          <span className="text-xs text-on-surface-variant/70 flex-shrink-0 ml-2">
                            {f.status === 'done'
                              ? '完成'
                              : f.status === 'error'
                              ? '失败'
                              : `${f.progress}%`}
                          </span>
                        </div>
                        <div className="h-1.5 bg-surface rounded-full overflow-hidden">
                          <div
                            className={`h-full transition-all duration-200 ${
                              f.status === 'error'
                                ? 'bg-red-500'
                                : f.status === 'done'
                                ? 'bg-green-500'
                                : 'bg-gradient-to-r from-violet-500 to-fuchsia-500'
                            }`}
                            style={{ width: `${f.progress}%` }}
                          />
                        </div>
                        {f.status === 'error' && f.errorMsg && (
                          <p className="text-xs text-red-400 mt-1">{f.errorMsg}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Tab 切换 */}
          <div className="flex items-center gap-2 mb-5 bg-surface-container/50 p-1 rounded-xl w-fit border border-white/10">
            <button
              onClick={() => setCurrentTab('pending')}
              className={`px-5 py-2 rounded-lg text-sm font-medium transition-all ${
                currentTab === 'pending'
                  ? 'bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white shadow-md'
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              未拍摄 ({stats.pending})
            </button>
            <button
              onClick={() => setCurrentTab('done')}
              className={`px-5 py-2 rounded-lg text-sm font-medium transition-all ${
                currentTab === 'done'
                  ? 'bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white shadow-md'
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              已拍摄 ({stats.done})
            </button>
          </div>

          {/* 提示栏 */}
          {!isLoading && filteredVideos.length > 0 && (
            <div className="text-xs text-on-surface-variant/60 mb-3 text-center">
              拖拽左侧 ⋮⋮ 手柄或长按卡片可调整顺序
            </div>
          )}

          {/* 视频列表 */}
          {isLoading ? (
            <div className="text-center py-16 text-on-surface-variant/70">加载中...</div>
          ) : filteredVideos.length === 0 ? (
            <div className="text-center py-20">
              <div className="w-20 h-20 mx-auto rounded-full bg-surface-container border border-white/10 flex items-center justify-center mb-4">
                <FileVideo className="w-10 h-10 text-on-surface-variant/40" />
              </div>
              <p className="text-on-surface-variant/70 text-base">
                {currentTab === 'pending' ? '暂无未拍摄的视频' : '暂无已拍摄的视频'}
              </p>
              <p className="text-sm text-on-surface-variant/40 mt-2">
                点击右上角「上传视频」开始添加
              </p>
            </div>
          ) : (
            <div ref={listContainerRef} className="space-y-4">
              {filteredVideos.map((video) => (
                <div
                  key={video.id}
                  data-video-card
                  data-id={video.id}
                  draggable
                  onDragStart={(e) => onCardDragStart(e, video.id)}
                  onDragOver={(e) => onCardDragOver(e, video.id)}
                  onDragLeave={onCardDragLeave}
                  onDrop={(e) => onCardDrop(e, video.id)}
                  onDragEnd={onCardDragEnd}
                  className={`bg-surface-container border rounded-2xl overflow-hidden transition-all select-none ${
                    draggingId === video.id
                      ? 'opacity-40 border-violet-400 scale-[0.98]'
                      : dragOverId === video.id
                      ? 'border-violet-400 shadow-lg shadow-violet-500/20'
                      : 'border-white/10'
                  } ${
                    video.status === 'done' ? 'opacity-90' : ''
                  }`}
                >
                  {/* 视频播放器 */}
                  <div className="relative bg-black">
                    <video
                      ref={(el) => registerVideoRef(video.id, el)}
                      src={video.url}
                      loop
                      muted
                      playsInline
                      preload="metadata"
                      onClick={(e) => handleVideoClick(e.currentTarget)}
                      className="w-full aspect-video object-contain cursor-pointer bg-black"
                    />
                    <div className="absolute bottom-3 right-3 px-2.5 py-1 rounded-lg bg-black/60 backdrop-blur-sm text-xs text-white/80 pointer-events-none">
                      点击全屏播放
                    </div>
                  </div>

                  {/* 底部信息栏 */}
                  <div className="flex items-center gap-3 p-3 md:p-4">
                    {/* 拖拽手柄 */}
                    <div
                      className="flex items-center justify-center flex-shrink-0 w-8 h-8 rounded-lg text-on-surface-variant/60 hover:text-violet-400 hover:bg-violet-500/20 cursor-grab active:cursor-grabbing transition-all"
                      title="拖动调整顺序"
                      onTouchStart={(e) => {
                        const card = (e.currentTarget as HTMLElement).closest(
                          '[data-video-card]'
                        ) as HTMLElement;
                        if (card) {
                          const rect = card.getBoundingClientRect();
                          onHandleTouchStart(e, video.id, rect);
                        }
                      }}
                      onTouchMove={onHandleTouchMove}
                      onTouchEnd={onHandleTouchEnd}
                      onTouchCancel={onHandleTouchEnd}
                    >
                      <GripVertical className="w-5 h-5" />
                    </div>

                    {/* 复选框 */}
                    <button
                      onClick={() => toggleVideoStatus(video)}
                      className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all cursor-pointer ${
                        video.status === 'done'
                          ? 'bg-green-500 border-green-500'
                          : 'border-white/30 hover:border-violet-400 hover:bg-violet-500/20'
                      }`}
                      title={
                        video.status === 'done'
                          ? '点击移回"未拍摄"'
                          : '点击标记为"已拍摄"'
                      }
                    >
                      {video.status === 'done' && (
                        <Check className="w-4 h-4 text-white" strokeWidth={3} />
                      )}
                    </button>

                    {/* 标题与大小 */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{video.title}</p>
                      <p className="text-xs text-on-surface-variant/60 mt-0.5">
                        {formatSize(video.size)}
                      </p>
                    </div>

                    {/* 删除按钮 */}
                    <button
                      onClick={() => deleteVideo(video)}
                      className="p-2 rounded-lg text-on-surface-variant/60 hover:text-red-400 hover:bg-red-500/10 transition-all flex-shrink-0"
                      title="删除"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
