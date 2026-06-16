import { useState, useEffect, useRef, useCallback } from 'react';
import { Upload, Play, Check, Trash2, X, FileVideo } from 'lucide-react';

interface VideoItem {
  id: number;
  title: string;
  filename: string;
  url: string;
  status: 'pending' | 'done';
  size: number;
  duration?: number;
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
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRefs = useRef<Map<number, HTMLVideoElement>>(new Map());
  const rafPendingRef = useRef<number | null>(null);

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

  // 视频文件选择
  const handleFileSelect = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    Array.from(files).forEach((file) => {
      if (!file.type.startsWith('video/')) return;
      uploadSingleFile(file);
    });
  };

  // 单个文件上传（OSS 预签名 URL 直传）
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
      // Step 1: 获取 OSS 预签名 URL (folder: 'video2')
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

      // Step 2: 直传 OSS
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

      // Step 3: 通知服务器记录
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

      // 刷新列表
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
        // 先更新内存状态，动画后再从列表移除（由 React 自动重新渲染）
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

  // 注册 video 元素引用
  const registerVideoRef = (id: number, el: HTMLVideoElement | null) => {
    if (el) {
      videoRefs.current.set(id, el);
    } else {
      videoRefs.current.delete(id);
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
            <div className="space-y-4">
              {filteredVideos.map((video) => (
                <div
                  key={video.id}
                  className={`bg-surface-container border border-white/10 rounded-2xl overflow-hidden transition-all ${
                    video.status === 'done' ? 'opacity-75' : ''
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
                    {/* 复选框 */}
                    <button
                      onClick={() => toggleVideoStatus(video)}
                      className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all cursor-pointer ${
                        video.status === 'done'
                          ? 'bg-green-500 border-green-500'
                          : 'border-white/30 hover:border-violet-400 hover:bg-violet-500/20'
                      }`}
                      title={video.status === 'done' ? '点击移回"未拍摄"' : '点击标记为"已拍摄"'}
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
