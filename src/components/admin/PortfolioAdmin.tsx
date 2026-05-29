import { useState, useEffect } from 'react';
import { 
  Plus, 
  Edit2, 
  Trash2, 
  X, 
  Upload, 
  Image, 
  Video,
  Check,
  Loader2,
  AlertCircle,
  Link,
  FileImage,
  GripVertical,
  ChevronUp,
  ChevronDown,
  EyeOff,
  Eye
} from 'lucide-react';
import { 
  getPortfolioItems, 
  addPortfolioItem, 
  updatePortfolioItem, 
  deletePortfolioItem,
  updatePortfolioItemsSortOrder,
  getCategoriesWithDetails,
  PortfolioItem 
} from '../../data/store';
import { generateQRCode } from '../../lib/qrCode';
import { uploadImage, checkVideoBitrate, uploadVideoDirectToOSS, uploadVideoToServerWithCompression, uploadVideoWithBrowserCompression, UploadError } from '../../lib/ossUtils';
import { validateVodUrl } from '../../lib/vodUtils';

type ViewMode = 'list' | 'create' | 'edit';

const colorOptions = [
  { value: 'text-primary', label: '紫色' },
  { value: 'text-secondary', label: '青色' },
  { value: 'text-tertiary', label: '粉色' },
  { value: 'text-secondary-fixed-dim', label: '浅青' }
];

const bgGlowOptions = [
  { value: 'bg-primary/20', label: '紫色发光' },
  { value: 'bg-secondary/20', label: '青色发光' },
  { value: 'bg-tertiary/20', label: '粉色发光' }
];

export function PortfolioAdmin() {
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [items, setItems] = useState<PortfolioItem[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [editingItem, setEditingItem] = useState<PortfolioItem | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<{ [key: string]: number }>({});
  const [imgSourceType, setImgSourceType] = useState<'upload' | 'url'>('upload');
  const [videoSourceType, setVideoSourceType] = useState<'upload' | 'url'>('upload');
  const [draggedItem, setDraggedItem] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [videoUploadStatus, setVideoUploadStatus] = useState<{
    phase: 'idle' | 'checking' | 'compressing' | 'uploading' | 'done';
    progress: number;
    message: string;
  }>({ phase: 'idle', progress: 0, message: '' });
  const [imageUploadStatus, setImageUploadStatus] = useState<{
    phase: 'idle' | 'uploading' | 'done';
    progress: number;
    message: string;
  }>({ phase: 'idle', progress: 0, message: '' });
  const [showHighBitrateDialog, setShowHighBitrateDialog] = useState(false);
  const [pendingHighBitrateFile, setPendingHighBitrateFile] = useState<File | null>(null);
  const [pendingHighBitrateInfo, setPendingHighBitrateInfo] = useState<{ bitrateKbps: number | null; fileSizeMB: string; serverCompressionAvailable: boolean } | null>(null);
  const [showCompressionFailedDialog, setShowCompressionFailedDialog] = useState(false);
  const [pendingCompressionFailedUrl, setPendingCompressionFailedUrl] = useState<string | null>(null);
  const [pendingForceLocal, setPendingForceLocal] = useState(false);

  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');

  const [formData, setFormData] = useState({
    title: '',
    category: '',
    tag: '',
    shortDesc: '',
    fullDesc: '',
    img: '',
    images: [] as string[],
    videoUrl: '',
    type: 'image' as 'image' | 'video',
    color: 'text-primary',
    bgGlow: 'bg-primary/20',
    hidden: false
  });

  useEffect(() => {
    if (editingItem && formData.hidden) {
      generateQRCode(`${window.location.origin}?id=${editingItem.id}`, 128).then(setQrCodeUrl);
    } else {
      setQrCodeUrl('');
    }
  }, [editingItem, formData.hidden]);
  const [additionalImagesUploading, setAdditionalImagesUploading] = useState(false);
  const [additionalImageSource, setAdditionalImageSource] = useState<'upload' | 'url'>('upload');
  const [additionalImageUrlInput, setAdditionalImageUrlInput] = useState('');

  useEffect(() => {
    refreshItems();
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      const cats = await getCategoriesWithDetails();
      setCategories(cats.map(c => c.name));
    } catch (error) {
      console.error('Failed to load categories:', error);
    }
  };

  // 监听分类加载完成，设置默认分类
  useEffect(() => {
    if (categories.length > 0 && viewMode === 'create') {
      // 只在分类已加载且是创建模式时更新 formData.category
      if (!formData.category) {
        setFormData(prev => ({
          ...prev,
          category: categories[0]
        }));
      }
    }
  }, [categories, viewMode]);

  const refreshItems = async () => {
    try {
      const allItems = await getPortfolioItems();
      setItems(allItems.sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0)));
    } catch (error) {
      console.error('Failed to refresh items:', error);
    }
  };

  const handleMoveUp = async (id: number) => {
    const sortedItems = [...items].sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));
    const index = sortedItems.findIndex(i => i.id === id);
    if (index > 0) {
      const temp = sortedItems[index];
      sortedItems[index] = sortedItems[index - 1];
      sortedItems[index - 1] = temp;
      sortedItems.forEach((item, i) => {
        item.sortOrder = i + 1;
      });
      try {
        await updatePortfolioItemsSortOrder(sortedItems);
        setItems(sortedItems);
      } catch (error) {
        console.error('排序失败:', error);
        alert('排序失败，请重试');
      }
    }
  };

  const handleMoveDown = async (id: number) => {
    const sortedItems = [...items].sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));
    const index = sortedItems.findIndex(i => i.id === id);
    if (index < sortedItems.length - 1) {
      const temp = sortedItems[index];
      sortedItems[index] = sortedItems[index + 1];
      sortedItems[index + 1] = temp;
      sortedItems.forEach((item, i) => {
        item.sortOrder = i + 1;
      });
      try {
        await updatePortfolioItemsSortOrder(sortedItems);
        setItems(sortedItems);
      } catch (error) {
        console.error('排序失败:', error);
        alert('排序失败，请重试');
      }
    }
  };

  const handleDragStart = (e: React.DragEvent, id: number) => {
    setDraggedItem(id);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    setDragOverIndex(index);
  };

  const handleDrop = async (e: React.DragEvent, targetIndex: number) => {
    e.preventDefault();
    if (draggedItem === null) return;

    const sortedItems = [...items].sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));
    const draggedIndex = sortedItems.findIndex(i => i.id === draggedItem);

    if (draggedIndex !== targetIndex) {
      const draggedWork = sortedItems.splice(draggedIndex, 1)[0];
      sortedItems.splice(targetIndex, 0, draggedWork);
      sortedItems.forEach((item, i) => {
        item.sortOrder = i + 1;
      });
      try {
        await updatePortfolioItemsSortOrder(sortedItems);
        setItems(sortedItems);
      } catch (error) {
        console.error('排序失败:', error);
        alert('排序失败，请重试');
      }
    }

    setDraggedItem(null);
    setDragOverIndex(null);
  };

  const handleDragEnd = () => {
    setDraggedItem(null);
    setDragOverIndex(null);
  };

  const handleCreate = () => {
    setImgSourceType('upload');
    setVideoSourceType('upload');
    setFormData({
      title: '',
      category: '', // 暂时留空，等 categories 加载完成后由 useEffect 设置
      tag: '',
      shortDesc: '',
      fullDesc: '',
      img: '',
      images: [],
      videoUrl: '',
      type: 'image',
      color: 'text-primary',
      bgGlow: 'bg-primary/20',
      hidden: false
    });
    setViewMode('create');
  };

  const handleEdit = (item: PortfolioItem) => {
    setImgSourceType(item.img.startsWith('http') ? 'url' : 'upload');
    setVideoSourceType(item.videoUrl && item.videoUrl.startsWith('http') ? 'url' : 'upload');
    setEditingItem(item);
    setFormData({
      title: item.title,
      category: item.category,
      tag: item.tag,
      shortDesc: item.shortDesc,
      fullDesc: item.fullDesc,
      img: item.img,
      images: item.images || [],
      videoUrl: item.videoUrl || '',
      type: item.type,
      color: item.color,
      bgGlow: item.bgGlow,
      hidden: !!item.hidden
    });
    setViewMode('edit');
  };

  const handleDelete = async (id: number) => {
    if (confirm('确定要删除这个案例吗？')) {
      deletePortfolioItem(id);
      refreshItems();
    }
  };

  const handleImageUpload = async (file: File, forceLocal: boolean = false) => {
    setIsLoading(true);
    const fileSizeKB = (file.size / 1024).toFixed(1);
    
    setImageUploadStatus({ 
      phase: 'uploading', 
      progress: 0, 
      message: `正在上传图片 (${fileSizeKB}KB)...` 
    });

    try {
      const result = await uploadImage(file, (progress) => {
        setImageUploadStatus({ ...progress, phase: progress.phase === 'uploading' ? 'uploading' : 'uploading' });
      }, forceLocal);
      
      setFormData(prev => ({ ...prev, img: result.url }));
      
      setImageUploadStatus(prev => ({ 
        ...prev,
        phase: 'done', 
        progress: 100 
      }));
    } catch (error) {
      const uploadError = error as UploadError;
      if (uploadError.ossError) {
        const useLocal = confirm(
          `${uploadError.message}\n\n是否使用本地存储？`
        );
        if (useLocal) {
          await handleImageUpload(file, true);
        }
      } else {
        setImageUploadStatus({ 
          phase: 'done', 
          progress: 0, 
          message: `上传失败: ${uploadError.message}` 
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleVideoUpload = async (file: File, _forceLocal: boolean = false) => {
    setIsLoading(true);
    const fileSizeMB = (file.size / 1024 / 1024).toFixed(2);

    setVideoUploadStatus({ 
      phase: 'checking', 
      progress: 0, 
      message: `正在检测视频码率...` 
    });

    try {
      const check = await checkVideoBitrate(file);
      
      if (check.decision === 'direct_oss') {
        const bitrateMsg = check.bitrateKbps ? ` (码率 ${check.bitrateKbps}kbps)` : '';
        setVideoUploadStatus({ 
          phase: 'uploading', 
          progress: 0, 
          message: `正在上传视频 (${fileSizeMB}MB)${bitrateMsg}...` 
        });

        const result = await uploadVideoDirectToOSS(file, (progress) => {
          setVideoUploadStatus({ ...progress, phase: progress.phase as any });
        });

        setFormData(prev => ({ ...prev, videoUrl: result.url }));
        setVideoUploadStatus(prev => ({ ...prev, phase: 'done', progress: 100 }));
        setIsLoading(false);
        return;
      }

      setVideoUploadStatus({ phase: 'idle', progress: 0, message: '' });
      setPendingHighBitrateFile(file);
      setPendingHighBitrateInfo({
        bitrateKbps: check.bitrateKbps,
        fileSizeMB,
        serverCompressionAvailable: check.serverCompressionAvailable,
      });
      setShowHighBitrateDialog(true);
      setIsLoading(false);
    } catch (error) {
      const uploadError = error as UploadError;
      setVideoUploadStatus({ 
        phase: 'done', 
        progress: 0, 
        message: `检测失败: ${uploadError.message}` 
      });
      setIsLoading(false);
    }
  };

  const handleConfirmHighBitrateUpload = async () => {
    if (!pendingHighBitrateFile || !pendingHighBitrateInfo) return;
    
    if (!pendingHighBitrateInfo.serverCompressionAvailable) {
      setShowHighBitrateDialog(false);
      setVideoUploadStatus({ 
        phase: 'done', 
        progress: 0, 
        message: '文件超过 Cloudflare 200MB 限制，无法使用服务器压缩。请使用浏览器压缩或自行压缩后上传。' 
      });
      return;
    }
    
    setShowHighBitrateDialog(false);
    setIsLoading(true);

    setVideoUploadStatus({ 
      phase: 'compressing', 
      progress: 0, 
      message: `正在上传至服务器压缩 (${pendingHighBitrateInfo.fileSizeMB}MB)...` 
    });

    try {
      const result = await uploadVideoToServerWithCompression(pendingHighBitrateFile, (progress) => {
        setVideoUploadStatus({ ...progress, phase: progress.phase as any });
      });

      if (result.compressionFailed) {
        setPendingCompressionFailedUrl(result.url);
        setShowCompressionFailedDialog(true);
        setVideoUploadStatus({ phase: 'idle', progress: 0, message: '' });
        setIsLoading(false);
        return;
      }

      setFormData(prev => ({ ...prev, videoUrl: result.url }));
      setVideoUploadStatus(prev => ({ ...prev, phase: 'done', progress: 100 }));
      setIsLoading(false);
    } catch (error) {
      const uploadError = error as UploadError;
      setShowCompressionFailedDialog(true);
      setPendingCompressionFailedUrl(null);
      setShowHighBitrateDialog(false);
      setVideoUploadStatus({ phase: 'idle', progress: 0, message: '' });
      setIsLoading(false);
    }
  };

  const handleCancelHighBitrateUpload = () => {
    setShowHighBitrateDialog(false);
    setPendingHighBitrateFile(null);
    setPendingHighBitrateInfo(null);
    setVideoUploadStatus({ 
      phase: 'done', 
      progress: 0, 
      message: '您可以自行压缩视频后再尝试上传。' 
    });
  };

  const handleBrowserCompressUpload = async () => {
    if (!pendingHighBitrateFile || !pendingHighBitrateInfo) return;
    
    setShowHighBitrateDialog(false);
    setIsLoading(true);

    setVideoUploadStatus({ 
      phase: 'compressing', 
      progress: 0, 
      message: '正在加载浏览器压缩组件...' 
    });

    try {
      const result = await uploadVideoWithBrowserCompression(pendingHighBitrateFile, (progress) => {
        setVideoUploadStatus({ ...progress, phase: progress.phase as any });
      });

      setFormData(prev => ({ ...prev, videoUrl: result.url }));
      setVideoUploadStatus(prev => ({ ...prev, phase: 'done', progress: 100 }));
      setIsLoading(false);
    } catch (error) {
      const uploadError = error as UploadError;
      const serverAvailable = pendingHighBitrateInfo.serverCompressionAvailable;
      setVideoUploadStatus({ 
        phase: 'done', 
        progress: 0, 
        message: `浏览器压缩失败: ${uploadError.message}${serverAvailable ? '。可尝试改用服务器压缩上传。' : '。请自行压缩后重新上传。'}` 
      });
      setIsLoading(false);
    }
  };

  const handleRetryWithBrowserCompression = async () => {
    if (!pendingHighBitrateFile || !pendingHighBitrateInfo) {
      setShowCompressionFailedDialog(false);
      return;
    }
    setShowCompressionFailedDialog(false);
    setIsLoading(true);
    setVideoUploadStatus({ 
      phase: 'compressing', 
      progress: 0, 
      message: '正在加载浏览器压缩组件...' 
    });
    try {
      const result = await uploadVideoWithBrowserCompression(pendingHighBitrateFile, (progress) => {
        setVideoUploadStatus({ ...progress, phase: progress.phase as any });
      });
      setFormData(prev => ({ ...prev, videoUrl: result.url }));
      setVideoUploadStatus(prev => ({ ...prev, phase: 'done', progress: 100 }));
      setIsLoading(false);
    } catch (error) {
      const uploadError = error as UploadError;
      setVideoUploadStatus({ 
        phase: 'done', 
        progress: 0, 
        message: `浏览器压缩失败: ${uploadError.message}。请自行压缩后重新上传。` 
      });
      setIsLoading(false);
    }
  };

  const handleUseOriginalVideo = () => {
    if (!pendingCompressionFailedUrl) return;
    setShowCompressionFailedDialog(false);
    setFormData(prev => ({ ...prev, videoUrl: pendingCompressionFailedUrl }));
    setPendingCompressionFailedUrl(null);
    setVideoUploadStatus({ 
      phase: 'done', 
      progress: 100, 
      message: '已使用原始视频。建议后续手动压缩后替换。' 
    });
  };

  const handleDiscardAfterCompressionFailed = () => {
    setShowCompressionFailedDialog(false);
    setPendingCompressionFailedUrl(null);
    setVideoUploadStatus({ 
      phase: 'done', 
      progress: 0, 
      message: '您可手动压缩后再重新上传。' 
    });
  };

  const handleAdditionalImageUpload = async (file: File, forceLocal: boolean = false) => {
    setAdditionalImagesUploading(true);
    const fileSizeKB = (file.size / 1024).toFixed(1);
    
    try {
      const result = await uploadImage(file, undefined, forceLocal);
      setFormData(prev => ({ 
        ...prev, 
        images: [...(prev.images || []), result.url] 
      }));
    } catch (error) {
      const uploadError = error as UploadError;
      if (uploadError.ossError) {
        const useLocal = confirm(
          `${uploadError.message}\n\n是否使用本地存储？`
        );
        if (useLocal) {
          await handleAdditionalImageUpload(file, true);
        }
      } else {
        alert(`上传失败: ${uploadError.message}`);
      }
    } finally {
      setAdditionalImagesUploading(false);
    }
  };

  const handleMultipleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    for (const file of files) {
      await handleAdditionalImageUpload(file);
    }
    // Clear the input
    e.target.value = '';
  };

  const handleAddImageByUrl = () => {
    if (additionalImageUrlInput.trim()) {
      setFormData(prev => ({
        ...prev,
        images: [...(prev.images || []), additionalImageUrlInput.trim()]
      }));
      setAdditionalImageUrlInput('');
    }
  };

  const removeAdditionalImage = (index: number) => {
    setFormData(prev => ({
      ...prev,
      images: (prev.images || []).filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async () => {
    if (!formData.title || !formData.category || !formData.img) {
      alert('请填写必填字段：标题、分类和封面图片');
      return;
    }

    if (formData.type === 'video' && !formData.videoUrl) {
      alert('视频类型需要填写视频地址或上传视频');
      return;
    }

    try {
      if (viewMode === 'create') {
        await addPortfolioItem(formData);
      } else if (viewMode === 'edit' && editingItem) {
        await updatePortfolioItem({ ...formData, id: editingItem.id, sortOrder: editingItem.sortOrder });
      }

      setViewMode('list');
      await refreshItems();
    } catch (error) {
      console.error('保存失败:', error);
      alert('保存失败，请重试');
    }
  };

  const handleCancel = () => {
    setViewMode('list');
    setEditingItem(null);
  };

  if (viewMode !== 'list') {
    return (
      <div className="p-8">
        {/* Compression Error Dialog */}
        {showHighBitrateDialog && pendingHighBitrateInfo && (
          <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
            <div className="bg-surface-container rounded-2xl border border-white/10 p-6 max-w-md w-full">
              <div className="flex items-start gap-3 mb-4">
                <AlertCircle className="w-6 h-6 text-yellow-400 flex-shrink-0" />
                <div>
                  <h3 className="font-headline text-lg font-bold text-on-surface">视频码率过高</h3>
                  <p className="text-sm text-on-surface-variant mt-1">
                    当前视频码率{' '}
                    {pendingHighBitrateInfo.bitrateKbps !== null ? (
                      <span className="font-bold text-yellow-400">{pendingHighBitrateInfo.bitrateKbps}kbps</span>
                    ) : (
                      <span className="font-bold text-yellow-400">未能检测</span>
                    )}
                    ，超过建议的 2000kbps，建议压缩后上传。
                  </p>
                  {!pendingHighBitrateInfo.serverCompressionAvailable && (
                    <p className="text-sm text-red-400 mt-2">
                      文件超过 Cloudflare 95MB 限制，无法通过服务器压缩。请使用浏览器压缩或自行压缩后上传。
                    </p>
                  )}
                </div>
              </div>
              <div className="space-y-2">
                <button
                  onClick={handleCancelHighBitrateUpload}
                  className="w-full px-4 py-3 rounded-xl bg-surface-container-low border border-white/10 text-on-surface-variant hover:text-on-surface transition-colors text-left"
                >
                  <div className="text-sm font-medium">取消上传</div>
                  <div className="text-xs text-on-surface-variant/60 mt-0.5">手动将视频压缩后再次上传</div>
                </button>
                <button
                  onClick={handleBrowserCompressUpload}
                  className="w-full px-4 py-3 rounded-xl bg-green-600 text-white hover:bg-green-500 transition-colors text-left"
                >
                  <div className="text-sm font-medium">浏览器自动压缩上传</div>
                  <div className="text-xs text-white/70 mt-0.5">首次使用会自动下载压缩组件，处理速度慢</div>
                </button>
                <p className="text-xs text-on-surface-variant/50 px-1">建议视频文件不超过 500MB，过大可能导致浏览器崩溃</p>
                {pendingHighBitrateInfo.serverCompressionAvailable ? (
                  <button
                    onClick={handleConfirmHighBitrateUpload}
                    className="w-full px-4 py-3 rounded-xl bg-primary text-on-primary hover:bg-primary/90 transition-colors text-left"
                  >
                    <div className="text-sm font-medium">服务器自动压缩上传</div>
                    <div className="text-xs text-on-primary/70 mt-0.5">需上传远程服务器，处理速度慢</div>
                  </button>
                ) : (
                  <button
                    disabled
                    className="w-full px-4 py-3 rounded-xl bg-surface-container-low border border-white/10 text-on-surface-variant/50 cursor-not-allowed text-left"
                  >
                    <div className="text-sm font-medium">服务器自动压缩上传（不可用）</div>
                    <div className="text-xs mt-0.5">文件超过 Cloudflare 95MB 限制</div>
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {showCompressionFailedDialog && (
          <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
            <div className="bg-surface-container rounded-2xl border border-white/10 p-6 max-w-md w-full">
              <div className="flex items-start gap-3 mb-4">
                <AlertCircle className="w-6 h-6 text-red-400 flex-shrink-0" />
                <div>
                  <h3 className="font-headline text-lg font-bold text-on-surface">
                    {pendingCompressionFailedUrl ? '视频压缩未减小' : '服务器上传失败'}
                  </h3>
                  <p className="text-sm text-on-surface-variant mt-1">
                    {pendingCompressionFailedUrl
                      ? '服务器压缩后文件未减小，已保留原始视频。'
                      : '视频上传至服务器失败，可能因为文件过大超出 Cloudflare 限制。'}
                  </p>
                  <p className="text-xs text-on-surface-variant/60 mt-3">
                    {pendingCompressionFailedUrl
                      ? '建议您使用浏览器压缩后再上传。'
                      : '建议您改用浏览器压缩，或自行压缩后重新上传。'}
                  </p>
                </div>
              </div>
              <div className="space-y-2">
                {pendingCompressionFailedUrl ? (
                  <button
                    onClick={handleUseOriginalVideo}
                    className="w-full px-4 py-3 rounded-xl bg-primary text-on-primary hover:bg-primary/90 transition-colors"
                  >
                    使用原始视频
                  </button>
                ) : (
                  <button
                    onClick={handleRetryWithBrowserCompression}
                    className="w-full px-4 py-3 rounded-xl bg-green-600 text-white hover:bg-green-500 transition-colors"
                  >
                    改用浏览器压缩上传
                  </button>
                )}
                <button
                  onClick={handleDiscardAfterCompressionFailed}
                  className="w-full px-4 py-3 rounded-xl bg-surface-container-low border border-white/10 text-on-surface-variant hover:text-on-surface transition-colors"
                >
                  {pendingCompressionFailedUrl ? '放弃，自行压缩后上传' : '取消上传'}
                </button>
              </div>
            </div>
          </div>
        )}

        <header className="flex items-center justify-between mb-8">
          <div>
            <h2 className="font-headline text-2xl font-bold text-on-surface">
              {viewMode === 'create' ? '新增案例' : '编辑案例'}
            </h2>
            <p className="text-on-surface-variant mt-1">
              {viewMode === 'create' ? '添加新的作品案例' : '修改选中的案例信息'}
            </p>
          </div>
          <button
            onClick={handleCancel}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-surface-container border border-white/10 text-on-surface-variant hover:text-on-surface transition-colors"
          >
            <X className="w-4 h-4" />
            取消
          </button>
        </header>

        <div className="max-w-2xl mx-auto">
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-label text-on-surface mb-2">标题 *</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                className="w-full px-4 py-3 rounded-xl bg-surface-container border border-white/10 text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:border-primary/50 transition-colors"
                placeholder="请输入案例标题"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-label text-on-surface mb-2">分类 *</label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                  className="w-full px-4 py-3 rounded-xl bg-surface-container border border-white/10 text-on-surface focus:outline-none focus:border-primary/50 transition-colors"
                >
                  {categories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-label text-on-surface mb-2">标签</label>
                <input
                  type="text"
                  value={formData.tag}
                  onChange={(e) => setFormData(prev => ({ ...prev, tag: e.target.value }))}
                  className="w-full px-4 py-3 rounded-xl bg-surface-container border border-white/10 text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:border-primary/50 transition-colors"
                  placeholder="例如：实时渲染"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-label text-on-surface mb-2">类型</label>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setFormData(prev => ({ ...prev, type: 'image' }));
                      setVideoSourceType('upload');
                    }}
                    className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl border transition-all ${
                      formData.type === 'image'
                        ? 'bg-primary/20 border-primary/50 text-primary'
                        : 'bg-surface-container border-white/10 text-on-surface-variant hover:text-on-surface'
                    }`}
                  >
                    <Image className="w-4 h-4" />
                    图片
                  </button>
                  <button
                    onClick={() => setFormData(prev => ({ ...prev, type: 'video' }))}
                    className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl border transition-all ${
                      formData.type === 'video'
                        ? 'bg-primary/20 border-primary/50 text-primary'
                        : 'bg-surface-container border-white/10 text-on-surface-variant hover:text-on-surface'
                    }`}
                  >
                    <Video className="w-4 h-4" />
                    视频
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-sm font-label text-on-surface mb-2">封面颜色</label>
                <select
                  value={formData.color}
                  onChange={(e) => setFormData(prev => ({ ...prev, color: e.target.value }))}
                  className="w-full px-4 py-3 rounded-xl bg-surface-container border border-white/10 text-on-surface focus:outline-none focus:border-primary/50 transition-colors"
                >
                  {colorOptions.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-label text-on-surface mb-2">封面图片 *</label>
              <div className="flex gap-2 mb-3">
                <button
                  onClick={() => setImgSourceType('upload')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-all ${
                    imgSourceType === 'upload'
                      ? 'bg-primary/20 border-primary/50 text-primary'
                      : 'bg-surface-container border-white/10 text-on-surface-variant hover:text-on-surface'
                  }`}
                >
                  <Upload className="w-4 h-4" />
                  上传图片
                </button>
                <button
                  onClick={() => setImgSourceType('url')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-all ${
                    imgSourceType === 'url'
                      ? 'bg-primary/20 border-primary/50 text-primary'
                      : 'bg-surface-container border-white/10 text-on-surface-variant hover:text-on-surface'
                  }`}
                >
                  <Link className="w-4 h-4" />
                  网络地址
                </button>
              </div>

              <div className="relative">
                {imgSourceType === 'upload' ? (
                  formData.img ? (
                    <div className="relative rounded-xl overflow-hidden border border-white/10">
                      <img src={formData.img} alt="封面预览" className="w-full h-48 object-cover" />
                      <button
                        onClick={() => setFormData(prev => ({ ...prev, img: '' }))}
                        className="absolute top-2 right-2 p-2 rounded-lg bg-black/50 text-white hover:bg-black/70 transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <label className="flex flex-col items-center justify-center w-full h-48 rounded-xl border-2 border-dashed border-white/20 cursor-pointer hover:border-primary/50 transition-colors">
                      <FileImage className="w-8 h-8 text-on-surface-variant mb-2" />
                      <span className="text-sm text-on-surface-variant">点击上传封面图片</span>
                      <span className="text-xs text-on-surface-variant/50 mt-1">支持 JPG、PNG、WebP 格式</span>
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp,image/gif"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleImageUpload(file);
                        }}
                        className="hidden"
                      />
                    </label>
                  )
                ) : (
                  <>
                    <input
                      type="text"
                      value={formData.img}
                      onChange={(e) => setFormData(prev => ({ ...prev, img: e.target.value }))}
                      className="w-full px-4 py-3 rounded-xl bg-surface-container border border-white/10 text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:border-primary/50 transition-colors"
                      placeholder="请输入图片URL地址"
                    />
                    <p className="text-xs text-on-surface-variant/50 mt-1">
                      可从阿里云OSS获取图片地址，格式如：https://xxx.oss-cn-beijing.aliyuncs.com/xxx.jpg
                    </p>
                    {formData.img && (
                      <div className="mt-3 rounded-xl overflow-hidden border border-white/10">
                        <img 
                          src={formData.img} 
                          alt="封面预览" 
                          className="w-full h-48 object-cover" 
                        />
                      </div>
                    )}
                  </>
                )}

                {/* Image Upload Progress */}
                {imageUploadStatus.phase !== 'idle' && (
                  <div className="mt-3 p-4 rounded-xl bg-surface-container border border-white/10">
                    <div className="flex items-start gap-3">
                      {imageUploadStatus.phase === 'uploading' && imageUploadStatus.progress < 100 && (
                        <Loader2 className="w-4 h-4 text-secondary animate-spin mt-0.5 flex-shrink-0" />
                      )}
                      {imageUploadStatus.phase === 'done' && imageUploadStatus.message.includes('失败') && (
                        <AlertCircle className="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0" />
                      )}
                      {imageUploadStatus.phase === 'done' && !imageUploadStatus.message.includes('失败') && (
                        <Check className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                      )}
                      <div className="flex-1">
                        <div className={`text-sm whitespace-pre-line ${imageUploadStatus.message.includes('失败') ? 'text-red-400' : 'text-on-surface-variant'}`}>
                          {imageUploadStatus.message}
                        </div>
                        {imageUploadStatus.phase !== 'done' && imageUploadStatus.progress > 0 && (
                          <div className="text-xs text-on-surface-variant/70 mt-1">
                            进度：{imageUploadStatus.progress}%
                          </div>
                        )}
                      </div>
                    </div>
                    {imageUploadStatus.phase !== 'done' && (
                      <div className="mt-3">
                        <div className="w-full bg-white/5 rounded-full h-3 overflow-hidden">
                          <div 
                            className="h-full rounded-full bg-gradient-to-r from-primary to-secondary transition-all duration-300"
                            style={{ width: `${imageUploadStatus.progress}%` }}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {formData.type === 'video' && (
              <div>
                <label className="block text-sm font-label text-on-surface mb-2">视频</label>
                <div className="flex gap-2 mb-3">
                  <button
                    onClick={() => setVideoSourceType('upload')}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-all ${
                      videoSourceType === 'upload'
                        ? 'bg-primary/20 border-primary/50 text-primary'
                        : 'bg-surface-container border-white/10 text-on-surface-variant hover:text-on-surface'
                    }`}
                  >
                    <Upload className="w-4 h-4" />
                    视频上传（阿里云OSS）
                  </button>
                  <button
                    onClick={() => setVideoSourceType('url')}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-all ${
                      videoSourceType === 'url'
                        ? 'bg-primary/20 border-primary/50 text-primary'
                        : 'bg-surface-container border-white/10 text-on-surface-variant hover:text-on-surface'
                    }`}
                  >
                    <Link className="w-4 h-4" />
                    视频点播URL
                  </button>
                </div>

                <div className="relative">
                  {videoSourceType === 'upload' ? (
                    formData.videoUrl ? (
                      <div className="relative rounded-xl overflow-hidden border border-white/10">
                        <video src={formData.videoUrl} className="w-full h-48 object-cover" controls />
                        <button
                          onClick={() => setFormData(prev => ({ ...prev, videoUrl: '' }))}
                          className="absolute top-2 right-2 p-2 rounded-lg bg-black/50 text-white hover:bg-black/70 transition-colors"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <label className="flex flex-col items-center justify-center w-full h-48 rounded-xl border-2 border-dashed border-white/20 cursor-pointer hover:border-primary/50 transition-colors">
                        <Video className="w-8 h-8 text-on-surface-variant mb-2" />
                        <span className="text-sm text-on-surface-variant">点击上传视频</span>
                        <span className="text-xs text-on-surface-variant/50 mt-1">支持 MP4、WebM、OGG 格式（上传至阿里云OSS）</span>
                        <input
                          type="file"
                          accept="video/mp4,video/webm,video/ogg"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) handleVideoUpload(file);
                            e.target.value = '';
                          }}
                          className="hidden"
                        />
                      </label>
                    )
                  ) : (
                    <>
                      <input
                        type="text"
                        value={formData.videoUrl}
                        onChange={(e) => setFormData(prev => ({ ...prev, videoUrl: e.target.value }))}
                        className="w-full px-4 py-3 rounded-xl bg-surface-container border border-white/10 text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:border-primary/50 transition-colors"
                        placeholder="请输入阿里云视频点播播放地址（.m3u8）"
                      />
                      <p className="text-xs text-on-surface-variant/50 mt-1">
                        可从阿里云视频点播服务获取播放地址，格式如：https://xxx.m3u8
                      </p>
                      {formData.videoUrl && (
                        <div className="mt-3 rounded-xl overflow-hidden border border-white/10">
                          <video 
                            src={formData.videoUrl} 
                            className="w-full h-48 object-cover" 
                            controls 
                            playsInline
                          />
                        </div>
                      )}
                    </>
                  )}
                </div>

                {/* Video Upload Progress */}
                {videoUploadStatus.phase !== 'idle' && (
                  <div className="mt-3 p-4 rounded-xl bg-surface-container border border-white/10">
                    <div className="flex items-start gap-3">
                      {(videoUploadStatus.phase === 'checking' || videoUploadStatus.phase === 'compressing') && (
                        <Loader2 className="w-4 h-4 text-primary animate-spin mt-0.5 flex-shrink-0" />
                      )}
                      {videoUploadStatus.phase === 'uploading' && videoUploadStatus.progress < 100 && (
                        <Loader2 className="w-4 h-4 text-secondary animate-spin mt-0.5 flex-shrink-0" />
                      )}
                      {videoUploadStatus.progress === 100 && videoUploadStatus.message.includes('失败') && (
                        <AlertCircle className="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0" />
                      )}
                      {videoUploadStatus.progress === 100 && !videoUploadStatus.message.includes('失败') && (
                        <Check className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                      )}
                      <div className="flex-1">
                        <div className={`text-sm whitespace-pre-line ${videoUploadStatus.message.includes('失败') ? 'text-red-400' : 'text-on-surface-variant'}`}>
                          {videoUploadStatus.message}
                        </div>
                        {(videoUploadStatus.phase !== 'done') && videoUploadStatus.progress > 0 && (
                          <div className="text-xs text-on-surface-variant/70 mt-1">
                            进度：{videoUploadStatus.progress}%
                            {videoUploadStatus.phase === 'checking' && ' (检测比特率中...)'}
                            {videoUploadStatus.phase === 'compressing' && ' (视频压缩中，请耐心等待...)'}
                            {videoUploadStatus.phase === 'uploading' && ' (正在上传中...)'}
                          </div>
                        )}
                      </div>
                    </div>
                    {(videoUploadStatus.phase !== 'done') && (
                      <div className="mt-3">
                        <div className="w-full bg-white/5 rounded-full h-3 overflow-hidden">
                          <div 
                            className={`h-full rounded-full transition-all duration-300 ${
                              videoUploadStatus.phase === 'checking' || videoUploadStatus.phase === 'compressing' 
                                ? 'bg-gradient-to-r from-primary to-purple-400' 
                                : 'bg-gradient-to-r from-secondary to-cyan-400'
                            }`}
                            style={{ width: `${videoUploadStatus.progress}%` }}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {formData.type === 'image' && (
              <div>
                <label className="block text-sm font-label text-on-surface mb-2">更多图片</label>
                {additionalImagesUploading && (
                  <div className="mb-3 p-3 rounded-xl bg-surface-container border border-white/10 text-sm text-on-surface-variant">
                    <Loader2 className="w-4 h-4 inline-block mr-2 animate-spin" />
                    正在上传图片...
                  </div>
                )}
                <div className="flex gap-2 mb-3">
                  <button
                    onClick={() => setAdditionalImageSource('upload')}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-all ${
                      additionalImageSource === 'upload'
                        ? 'bg-primary/20 border-primary/50 text-primary'
                        : 'bg-surface-container border-white/10 text-on-surface-variant hover:text-on-surface'
                    }`}
                  >
                    <Upload className="w-4 h-4" />
                    本地上传
                  </button>
                  <button
                    onClick={() => setAdditionalImageSource('url')}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-all ${
                      additionalImageSource === 'url'
                        ? 'bg-primary/20 border-primary/50 text-primary'
                        : 'bg-surface-container border-white/10 text-on-surface-variant hover:text-on-surface'
                    }`}
                  >
                    <Link className="w-4 h-4" />
                    网络地址
                  </button>
                </div>

                {additionalImageSource === 'upload' ? (
                  <div className="grid grid-cols-4 gap-3 mb-3">
                    {/* Upload button */}
                    <label className="flex flex-col items-center justify-center aspect-square rounded-xl border-2 border-dashed border-white/20 cursor-pointer hover:border-primary/50 transition-colors bg-surface-container-low hover:bg-surface-container">
                      <Plus className="w-6 h-6 text-on-surface-variant mb-1" />
                      <span className="text-xs text-on-surface-variant">添加图片</span>
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp,image/gif"
                        multiple
                        onChange={handleMultipleImageUpload}
                        className="hidden"
                      />
                    </label>
                    {/* Existing images */}
                    {(formData.images || []).map((imageUrl, index) => (
                      <div key={index} className="relative aspect-square rounded-xl overflow-hidden border border-white/10 bg-surface-container-low group">
                        <img src={imageUrl} alt={`图片 ${index + 1}`} className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <button
                            type="button"
                            onClick={() => removeAdditionalImage(index)}
                            className="p-2 rounded-full bg-red-500/80 text-white hover:bg-red-500 transition-colors"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="mb-3 space-y-3">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={additionalImageUrlInput}
                        onChange={(e) => setAdditionalImageUrlInput(e.target.value)}
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleAddImageByUrl();
                          }
                        }}
                        className="flex-1 px-4 py-3 rounded-xl bg-surface-container border border-white/10 text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:border-primary/50 transition-colors"
                        placeholder="请输入图片URL地址"
                      />
                      <button
                        onClick={handleAddImageByUrl}
                        disabled={!additionalImageUrlInput.trim()}
                        className="px-6 py-3 rounded-xl bg-primary text-on-primary hover:bg-primary/90 transition-colors disabled:opacity-50"
                      >
                        添加
                      </button>
                    </div>
                    {additionalImageUrlInput && (
                      <div className="rounded-xl overflow-hidden border border-white/10">
                        <img 
                          src={additionalImageUrlInput} 
                          alt="图片预览" 
                          className="w-full h-48 object-cover" 
                        />
                      </div>
                    )}
                    <div className="grid grid-cols-4 gap-3">
                      {(formData.images || []).map((imageUrl, index) => (
                        <div key={index} className="relative aspect-square rounded-xl overflow-hidden border border-white/10 bg-surface-container-low group">
                          <img src={imageUrl} alt={`图片 ${index + 1}`} className="w-full h-full object-cover" />
                          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <button
                              type="button"
                              onClick={() => removeAdditionalImage(index)}
                              className="p-2 rounded-full bg-red-500/80 text-white hover:bg-red-500 transition-colors"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                <p className="text-xs text-on-surface-variant/50">
                  添加更多案例图片（可选），支持本地上传或粘贴网络图片地址
                </p>
              </div>
            )}

            <div>
              <label className="block text-sm font-label text-on-surface mb-2">简短描述</label>
              <textarea
                value={formData.shortDesc}
                onChange={(e) => setFormData(prev => ({ ...prev, shortDesc: e.target.value }))}
                rows={3}
                className="w-full px-4 py-3 rounded-xl bg-surface-container border border-white/10 text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:border-primary/50 transition-colors resize-none"
                placeholder="简短描述案例内容"
              />
            </div>

            <div>
              <label className="block text-sm font-label text-on-surface mb-2">详细描述</label>
              <textarea
                value={formData.fullDesc}
                onChange={(e) => setFormData(prev => ({ ...prev, fullDesc: e.target.value }))}
                rows={5}
                className="w-full px-4 py-3 rounded-xl bg-surface-container border border-white/10 text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:border-primary/50 transition-colors resize-none"
                placeholder="详细描述案例内容..."
              />
            </div>

            <div className="bg-surface-container-low rounded-xl border border-white/10 p-4">
              <div className="flex items-center justify-between mb-3">
                <label className="text-sm font-label text-on-surface flex items-center gap-2">
                  {formData.hidden ? <EyeOff className="w-4 h-4 text-yellow-400" /> : <Eye className="w-4 h-4" />}
                  隐藏作品
                </label>
                <button
                  onClick={() => setFormData(prev => ({ ...prev, hidden: !prev.hidden }))}
                  className={`w-14 h-7 rounded-full transition-colors relative ${
                    formData.hidden ? 'bg-yellow-500' : 'bg-white/20'
                  }`}
                >
                  <div className={`absolute top-1 w-5 h-5 bg-white rounded-full transition-transform ${
                    formData.hidden ? 'left-8' : 'left-1'
                  }`} />
                </button>
              </div>
              
              {formData.hidden && editingItem && (
                <div className="mt-4 p-4 bg-black/30 rounded-lg border border-yellow-500/30">
                  <p className="text-xs text-on-surface-variant mb-3">
                    扫描二维码访问该作品（仅在后台可见）
                  </p>
                  <div className="flex items-center gap-4">
                    <div className="bg-white p-2 rounded-lg">
                      <img
                        src={qrCodeUrl}
                        alt="QR Code"
                        className="w-32 h-32"
                      />
                    </div>
                    <div className="flex-1">
                      <p className="text-xs text-on-surface-variant break-all">
                        {window.location.origin}?id={editingItem.id}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="flex gap-4 pt-4">
              <button
                onClick={handleCancel}
                className="flex-1 px-6 py-3 rounded-xl bg-surface-container border border-white/10 text-on-surface-variant hover:text-on-surface transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleSubmit}
                disabled={isLoading}
                className="flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-primary text-on-primary hover:bg-primary/90 transition-colors disabled:opacity-50"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    上传中...
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    {viewMode === 'create' ? '创建案例' : '保存修改'}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <header className="flex items-center justify-between mb-8">
        <div>
          <h2 className="font-headline text-2xl font-bold text-on-surface">案例管理</h2>
          <p className="text-on-surface-variant mt-1">管理您的作品案例，支持阿里云OSS和视频点播存储</p>
        </div>
        <button
          onClick={handleCreate}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-on-primary hover:bg-primary/90 transition-colors"
        >
          <Plus className="w-4 h-4" />
          新增案例
        </button>
      </header>

      <div className="bg-surface-container rounded-2xl border border-white/5 shadow-lg overflow-hidden">
        <div className="p-6">
          <div className="flex items-center gap-3 mb-6 flex-wrap">
            <span className="text-sm font-label text-on-surface-variant">筛选：</span>
            <button
              onClick={() => setSelectedCategory('all')}
              className={`px-4 py-2 rounded-lg text-sm font-label transition-all ${
                selectedCategory === 'all'
                  ? 'bg-primary text-on-primary'
                  : 'bg-surface-container-low text-on-surface-variant hover:text-on-surface hover:bg-white/5'
              }`}
            >
              全部
            </button>
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-4 py-2 rounded-lg text-sm font-label transition-all ${
                  selectedCategory === cat
                    ? 'bg-primary text-on-primary'
                    : 'bg-surface-container-low text-on-surface-variant hover:text-on-surface hover:bg-white/5'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          <div className="space-y-2 sm:space-y-3">
            {items
              .filter(item => selectedCategory === 'all' || item.category === selectedCategory)
              .map((item, index) => (
              <div
                key={item.id}
                draggable
                onDragStart={(e) => handleDragStart(e, item.id)}
                onDragOver={(e) => handleDragOver(e, index)}
                onDrop={(e) => handleDrop(e, index)}
                onDragEnd={handleDragEnd}
                className={`flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4 p-3 sm:p-4 rounded-xl border transition-all cursor-grab active:cursor-grabbing ${
                  dragOverIndex === index
                    ? 'bg-primary/10 border-primary/30'
                    : 'bg-surface-container-low border-white/5 hover:border-white/10'
                } ${draggedItem === item.id ? 'opacity-50' : ''}`}
              >
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-lg text-on-surface-variant hover:text-primary hover:bg-primary/10 transition-colors cursor-grab active:cursor-grabbing">
                    <GripVertical className="w-4 h-4" />
                  </div>
                  <button
                    onClick={() => handleMoveUp(item.id)}
                    disabled={index === 0}
                    className="p-1.5 rounded-lg text-on-surface-variant hover:text-primary hover:bg-primary/10 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    <ChevronUp className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleMoveDown(item.id)}
                    disabled={index === items.length - 1}
                    className="p-1.5 rounded-lg text-on-surface-variant hover:text-primary hover:bg-primary/10 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    <ChevronDown className="w-4 h-4" />
                  </button>
                </div>

                <span className="w-6 h-6 flex items-center justify-center rounded-lg bg-black/30 text-on-surface-variant text-xs">
                  {index + 1}
                </span>

                <img
                  src={item.img}
                  alt={item.title}
                  className="w-12 h-12 rounded-lg object-cover"
                />

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <div className="font-headline font-medium text-on-surface truncate">{item.title}</div>
                    {item.hidden && (
                      <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-yellow-500/20 text-yellow-400 text-xs">
                        <EyeOff className="w-3 h-3" />
                        已隐藏
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-on-surface-variant">{item.tag}</div>
                </div>

                <span className="px-2 py-1 rounded-lg bg-black/30 text-xs text-on-surface-variant">
                  {item.category}
                </span>

                <span className={`px-2 py-1 rounded-lg text-xs ${
                  item.type === 'video' 
                    ? 'bg-secondary/20 text-secondary' 
                    : 'bg-tertiary/20 text-tertiary'
                }`}>
                  {item.type === 'video' ? '视频' : '图片'}
                </span>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleEdit(item)}
                    className="p-2 rounded-lg text-on-surface-variant hover:text-primary hover:bg-primary/10 transition-colors"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(item.id)}
                    className="p-2 rounded-lg text-on-surface-variant hover:text-error hover:bg-error/10 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {items.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16">
            <AlertCircle className="w-12 h-12 text-on-surface-variant mb-4" />
            <p className="text-on-surface-variant">暂无案例数据</p>
            <button
              onClick={handleCreate}
              className="mt-4 px-4 py-2 rounded-xl bg-primary text-on-primary hover:bg-primary/90 transition-colors"
            >
              创建第一个案例
            </button>
          </div>
        )}
      </div>
    </div>
  );
}