import { useState, useEffect, useRef, useCallback } from 'react';
import { Upload, Play, Check, Trash2, X, FileVideo, GripVertical, Maximize } from 'lucide-react';

// ==================== 浏览器环境检测 ====================
const UA = typeof navigator !== 'undefined' ? navigator.userAgent : '';
const isWeChat = /MicroMessenger/i.test(UA);
// 微信中因浏览器策略限制，无法在非用户手势下自动播放视频
// 对微信使用「点击播放」降级策略，其他浏览器使用「滚动自动播放」
const USE_CLICK_TO_PLAY = isWeChat;

// ==================== OSS 封面截图 URL ====================
// 阿里云 OSS 的视频处理：t_1000 表示 1000ms 处截图，w_800 表示宽度 800px
function getPosterUrl(videoUrl: string): string {
  if (videoUrl.includes('qiziwenhua.top') || videoUrl.includes('aliyuncs.com')) {
    return videoUrl + '?x-oss-process=video/snapshot,t_1000,f_jpg,w_800,m_fast';
  }
  return ''; // 非 OSS 视频：不拼接参数，走 video 首帧兜底
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

  // 海报图重试计数器（key: video.id, value: 当前已重试次数）
  const posterRetryRef = useRef<Map<number, number>>(new Map());
  // 海报图加载状态（true: 已加载成功 / 最终兜底显示 video 首帧）
  const posterReadyRef = useRef<Map<number, boolean>>(new Map());

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

  // 滚动检测：使用 IntersectionObserver 检测屏幕中央视频（移动端更可靠）
  const nowPlayingIdRef = useRef<number | null>(null);
  const playLockRef = useRef<boolean>(false);

  // 可见比例 > 0.7 的视频集合
  const visibleVideosRef = useRef<Map<number, number>>(new Map());

  const updatePlayingFromVisible = useCallback(() => {
    if (playLockRef.current) return;
    playLockRef.current = true;

    setTimeout(() => {
      playLockRef.current = false;

      if (visibleVideosRef.current.size === 0) {
        // 没有任何可见视频：暂停所有播放中的
        videoRefs.current.forEach((video) => {
          if (!video.paused) video.pause();
          video.preload = 'none';
        });
        nowPlayingIdRef.current = null;
        return;
      }

      // 找到可见比例最高的视频
      let bestId: number | null = null;
      let bestRatio = 0;
      visibleVideosRef.current.forEach((ratio, id) => {
        if (ratio > bestRatio) {
          bestRatio = ratio;
          bestId = id;
        }
      });

      // 如果最高可见比例的视频中心接近屏幕中央（+/- 35%）才选为播放目标
      let targetId: number | null = bestId;
      if (targetId !== null) {
        const targetVideo = videoRefs.current.get(targetId);
        if (targetVideo) {
          const rect = targetVideo.getBoundingClientRect();
          const center = rect.top + rect.height / 2;
          const viewportCenter = window.innerHeight / 2;
          const distanceRatio = Math.abs(center - viewportCenter) / window.innerHeight;
          if (distanceRatio > 0.35) {
            targetId = null;
          }
        } else {
          targetId = null;
        }
      }

      // 更新播放/暂停状态（所有浏览器统一处理暂停，播放区分微信和非微信）
      videoRefs.current.forEach((video, id) => {
        if (id !== targetId) {
          // 非目标视频：暂停
          if (!video.paused) video.pause();
          // 离开视口的视频节省带宽
          const ratio = visibleVideosRef.current.get(id);
          if (ratio === undefined || ratio < 0.3) {
            video.preload = 'none';
          }
          return;
        }

        // 目标视频
        if (id === targetId) {
          // 预加载目标视频数据（用户点击时更快播放）
          video.preload = 'auto';

          // 微信浏览器：不自动播放（需要用户手势）
          if (USE_CLICK_TO_PLAY) {
            return;
          }

          // 非微信浏览器：自动播放
          if (video.paused) {
            video.play().catch(() => {
              // 被浏览器策略拒绝：忽略，等待用户点击
            });
          }
        }
      });

      nowPlayingIdRef.current = targetId;
    }, 50);
  }, []);

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

  // 点击视频：切换播放/暂停（不再进入全屏）
  const togglePlay = (videoEl: HTMLVideoElement, videoId: number) => {
    // 先暂停其他所有视频
    videoRefs.current.forEach((v, id) => {
      if (id !== videoId && !v.paused) v.pause();
    });
    nowPlayingIdRef.current = videoId;

    // 切换当前视频的播放/暂停状态
    if (videoEl.paused) {
      const playPromise = videoEl.play();
      if (playPromise && typeof playPromise.catch === 'function') {
        playPromise.catch(() => {});
      }
    } else {
      videoEl.pause();
    }
  };

  // 点击全屏按钮：先播放 → 进入全屏（确保微信/iOS 全屏后有声音有播放）
  const toggleFullscreen = (videoEl: HTMLVideoElement, videoId: number) => {
    // 先暂停其他所有视频
    videoRefs.current.forEach((v, id) => {
      if (id !== videoId && !v.paused) v.pause();
    });
    nowPlayingIdRef.current = videoId;

    // 在进入全屏前设置为静音和控件
    videoEl.muted = false;
    videoEl.controls = true;

    // 进入全屏的方法封装（确保在用户手势路径内）
    const v = videoEl as any;
    const enterFullscreen = () => {
      if (typeof v.webkitEnterFullscreen === 'function') {
        try { v.webkitEnterFullscreen(); } catch (e) {}
      } else if (typeof v.webkitRequestFullscreen === 'function') {
        try { v.webkitRequestFullscreen(); } catch (e) {}
      } else if (typeof videoEl.requestFullscreen === 'function') {
        videoEl.requestFullscreen().catch(() => {});
      }
    };

    // 如果视频已经在播放，直接进入全屏
    if (!videoEl.paused) {
      enterFullscreen();
      return;
    }

    // 视频处于 paused，先尝试播放，成功后进入全屏
    const playPromise = videoEl.play();
    if (playPromise && typeof playPromise.then === 'function') {
      playPromise
        .then(() => {
          enterFullscreen();
        })
        .catch(() => {
          // 播放被拒绝：尝试直接进入全屏（iOS 全屏模式有时会自动播放）
          enterFullscreen();
        });
    } else {
      // 旧浏览器 play() 不返回 Promise：直接尝试进入全屏
      enterFullscreen();
    }
  };

  const ioRef = useRef<IntersectionObserver | null>(null);

  const registerVideoRef = (id: number, el: HTMLVideoElement | null) => {
    if (el) {
      videoRefs.current.set(id, el);
      if (ioRef.current) {
        ioRef.current.observe(el);
      }
    } else {
      const oldEl = videoRefs.current.get(id);
      if (oldEl && ioRef.current) {
        ioRef.current.unobserve(oldEl);
      }
      videoRefs.current.delete(id);
      visibleVideosRef.current.delete(id);
      if (nowPlayingIdRef.current === id) {
        nowPlayingIdRef.current = null;
      }
    }
  };

  // 初始化 IntersectionObserver + scroll fallback
  useEffect(() => {
    const updateFromRects = () => {
      // scroll fallback：通过 getBoundingClientRect 手动计算
      let changed = false;
      videoRefs.current.forEach((videoEl, id) => {
        const rect = videoEl.getBoundingClientRect();
        const viewportH = window.innerHeight || document.documentElement.clientHeight;
        const viewportW = window.innerWidth || document.documentElement.clientWidth;
        if (
          rect.bottom <= 0 ||
          rect.top >= viewportH ||
          rect.right <= 0 ||
          rect.left >= viewportW
        ) {
          if (visibleVideosRef.current.has(id)) {
            visibleVideosRef.current.delete(id);
            changed = true;
          }
          return;
        }
        const visibleH = Math.min(rect.bottom, viewportH) - Math.max(rect.top, 0);
        const visibleW = Math.min(rect.right, viewportW) - Math.max(rect.left, 0);
        const elementArea = rect.width * rect.height;
        const visibleArea = visibleH * visibleW;
        const ratio = elementArea > 0 ? visibleArea / elementArea : 0;
        if (ratio >= 0.6) {
          if (visibleVideosRef.current.get(id) !== ratio) {
            visibleVideosRef.current.set(id, ratio);
            changed = true;
          }
        } else {
          if (visibleVideosRef.current.has(id)) {
            visibleVideosRef.current.delete(id);
            changed = true;
          }
        }
      });
      if (changed) updatePlayingFromVisible();
    };

    // 使用 IntersectionObserver（如果可用）
    const supportsIO =
      typeof window !== 'undefined' && 'IntersectionObserver' in window;
    if (supportsIO) {
      ioRef.current = new IntersectionObserver(
        (entries) => {
          let changed = false;
          entries.forEach((entry) => {
            const videoEl = entry.target as HTMLVideoElement;
            const id = Number(videoEl.getAttribute('data-video-id'));
            if (!id || isNaN(id)) return;
            const ratio = entry.intersectionRatio;
            if (ratio >= 0.6) {
              if (visibleVideosRef.current.get(id) !== ratio) {
                visibleVideosRef.current.set(id, ratio);
                changed = true;
              }
            } else {
              if (visibleVideosRef.current.has(id)) {
                visibleVideosRef.current.delete(id);
                changed = true;
              }
            }
          });
          if (changed) updatePlayingFromVisible();
        },
        {
          threshold: [0.25, 0.4, 0.5, 0.6, 0.75, 0.9],
          root: null,
        }
      );
      videoRefs.current.forEach((el) => {
        if (ioRef.current) ioRef.current.observe(el);
      });
    }

    // scroll/resize fallback — 即使 IO 工作也保留作为兜底（防抖）
    let rafId: number | null = null;
    const onScrollOrResize = () => {
      if (rafId !== null) return;
      rafId = window.requestAnimationFrame(() => {
        rafId = null;
        if (supportsIO) {
          // 有 IO 时只做一次同步（例如微信首次打开时 IO 未触发的场景）
          updateFromRects();
        } else {
          updateFromRects();
        }
      });
    };
    window.addEventListener('scroll', onScrollOrResize, { passive: true });
    window.addEventListener('resize', onScrollOrResize);

    // 初始化一次
    const initTimer = window.setTimeout(() => updateFromRects(), 300);
    const initTimer2 = window.setTimeout(() => updateFromRects(), 1200);

    return () => {
      window.clearTimeout(initTimer);
      window.clearTimeout(initTimer2);
      window.removeEventListener('scroll', onScrollOrResize);
      window.removeEventListener('resize', onScrollOrResize);
      if (rafId !== null) window.cancelAnimationFrame(rafId);
      if (ioRef.current) ioRef.current.disconnect();
    };
  }, [updatePlayingFromVisible]);

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
                  {/* 视频播放区：海报图 + 播放按钮 + 视频元素 */}
                  <div className="relative bg-black aspect-video overflow-hidden">
                    {/* 海报图：独立 img 层，OSS 截图，带重试，始终可见直到视频播放 */}
                    {(() => {
                      const posterUrl = getPosterUrl(video.url);
                      if (!posterUrl) return null;
                      return (
                        <img
                          data-poster-img={video.id}
                          src={posterUrl}
                          alt={video.title}
                          className="absolute inset-0 w-full h-full object-cover z-10"
                          style={{
                            opacity: 1,
                            transition: 'opacity 200ms ease-out',
                          }}
                          onError={(e) => {
                            const el = e.currentTarget as HTMLImageElement;
                            const retries = posterRetryRef.current.get(video.id) || 0;
                            if (retries < POSTER_MAX_RETRY) {
                              posterRetryRef.current.set(video.id, retries + 1);
                              const retryTimer = window.setTimeout(() => {
                                el.src = getPosterUrl(video.url) + '&_retry=' + Date.now();
                              }, POSTER_RETRY_DELAY * (retries + 1));
                              el.addEventListener(
                                'load',
                                () => window.clearTimeout(retryTimer),
                                { once: true }
                              );
                            } else {
                              posterReadyRef.current.set(video.id, true);
                            }
                          }}
                        />
                      );
                    })()}
                    {/* 视频：preload="none" 优化首屏，用户点击后才加载，
                         播放时显示视频画面，暂停时隐藏（恢复海报图可见） */}
                    <video
                      ref={(el) => {
                        if (el) {
                          videoRefs.current.set(video.id, el);
                          if (ioRef.current) {
                            ioRef.current.observe(el);
                          }
                          // 监听全屏事件：退出全屏时恢复静音+隐藏控件
                          const onFsChange = () => {
                            const fsEl =
                              (document as any).fullscreenElement ||
                              (document as any).webkitFullscreenElement ||
                              (document as any).webkitCurrentFullScreenElement;
                            if (!fsEl || fsEl !== el) {
                              el.muted = true;
                              el.controls = false;
                            }
                          };
                          el.addEventListener('fullscreenchange', onFsChange);
                          el.addEventListener('webkitfullscreenchange', onFsChange);
                          el.addEventListener('webkitendfullscreen', onFsChange);
                        } else {
                          const oldEl = videoRefs.current.get(video.id);
                          if (oldEl && ioRef.current) {
                            ioRef.current.unobserve(oldEl);
                          }
                          videoRefs.current.delete(video.id);
                          visibleVideosRef.current.delete(video.id);
                          if (nowPlayingIdRef.current === video.id) {
                            nowPlayingIdRef.current = null;
                          }
                        }
                      }}
                      data-video-id={video.id}
                      src={video.url}
                      poster={getPosterUrl(video.url) || undefined}
                      loop
                      muted
                      playsInline
                      autoPlay={false}
                      preload="none"
                      onClick={(e) => togglePlay(e.currentTarget, video.id)}
                      onPlay={(e) => {
                        const v = e.currentTarget as HTMLVideoElement;
                        v.style.opacity = '1';
                        // 隐藏独立海报图
                        const poster = v.parentElement?.querySelector(
                          `[data-poster-img="${video.id}"]`
                        ) as HTMLImageElement | null;
                        if (poster) poster.style.opacity = '0';
                        // 隐藏居中播放按钮（全屏按钮保持可见）
                        const playBtn = v.parentElement?.querySelector(
                          `[data-play-button="${video.id}"]`
                        ) as HTMLElement | null;
                        if (playBtn) {
                          playBtn.style.opacity = '0';
                          playBtn.style.pointerEvents = 'none';
                        }
                      }}
                      onPause={(e) => {
                        const v = e.currentTarget as HTMLVideoElement;
                        v.style.opacity = '0';
                        // 显示独立海报图
                        const poster = v.parentElement?.querySelector(
                          `[data-poster-img="${video.id}"]`
                        ) as HTMLImageElement | null;
                        if (poster) poster.style.opacity = '1';
                        // 显示居中播放按钮
                        const playBtn = v.parentElement?.querySelector(
                          `[data-play-button="${video.id}"]`
                        ) as HTMLElement | null;
                        if (playBtn) {
                          playBtn.style.opacity = '1';
                          playBtn.style.pointerEvents = 'auto';
                        }
                      }}
                      onEnded={(e) => {
                        const v = e.currentTarget as HTMLVideoElement;
                        v.style.opacity = '0';
                        const poster = v.parentElement?.querySelector(
                          `[data-poster-img="${video.id}"]`
                        ) as HTMLImageElement | null;
                        if (poster) poster.style.opacity = '1';
                        const playBtn = v.parentElement?.querySelector(
                          `[data-play-button="${video.id}"]`
                        ) as HTMLElement | null;
                        if (playBtn) {
                          playBtn.style.opacity = '1';
                          playBtn.style.pointerEvents = 'auto';
                        }
                      }}
                      className="absolute inset-0 w-full h-full object-contain cursor-pointer"
                      style={{
                        opacity: 0,
                        transition: 'opacity 200ms ease-out',
                        background: 'transparent',
                      }}
                    />
                    {/* 居中播放按钮：线性风格（半透明黑色底板 + 白色描边图标 */}
                    <div
                      onClick={(e) => {
                        e.stopPropagation();
                        const v = videoRefs.current.get(video.id);
                        if (v) togglePlay(v, video.id);
                      }}
                      className="absolute inset-0 flex items-center justify-center z-20 cursor-pointer pointer-events-auto"
                      data-play-button={video.id}
                      style={{
                        transition: 'opacity 200ms ease-out',
                      }}
                    >
                      <div
                      className={`w-14 h-14 md:w-16 md:h-16 rounded-full bg-black/40 border border-white/40 backdrop-blur-sm flex items-center justify-center transition-transform hover:scale-105`}
                    >
                      <Play
                        className="w-7 h-7 md:w-8 md:h-8 text-white ml-1"
                        strokeWidth={1.5}
                      />
                    </div>
                    </div>
                    {/* 右下角全屏按钮 */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        const v = videoRefs.current.get(video.id);
                        if (v) toggleFullscreen(v, video.id);
                      }}
                      className="absolute bottom-3 right-3 w-9 h-9 rounded-full bg-black/60 border border-white/30 flex items-center justify-center text-white z-20 hover:bg-black/80 hover:scale-105 transition-all"
                      title="全屏播放"
                    >
                      <Maximize className="w-4 h-4" strokeWidth={1.5} />
                    </button>
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
