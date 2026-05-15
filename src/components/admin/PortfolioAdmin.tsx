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
  ChevronDown
} from 'lucide-react';
import { 
  getPortfolioItems, 
  addPortfolioItem, 
  updatePortfolioItem, 
  deletePortfolioItem,
  updatePortfolioItemsSortOrder,
  getCategories,
  PortfolioItem 
} from '../../data/store';
import { uploadImage, uploadVideo } from '../../lib/ossUtils';
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

  const [formData, setFormData] = useState({
    title: '',
    category: '',
    tag: '',
    shortDesc: '',
    fullDesc: '',
    img: '',
    videoUrl: '',
    type: 'image' as 'image' | 'video',
    color: 'text-primary',
    bgGlow: 'bg-primary/20'
  });

  useEffect(() => {
    refreshItems();
  }, []);

  useEffect(() => {
    const cats = getCategories().filter(c => c.name !== '全部作品').map(c => c.name);
    setCategories(cats);
  }, []);

  const refreshItems = () => {
    const allItems = getPortfolioItems();
    setItems(allItems.sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0)));
  };

  const handleMoveUp = (id: number) => {
    const sortedItems = [...items].sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));
    const index = sortedItems.findIndex(i => i.id === id);
    if (index > 0) {
      const temp = sortedItems[index];
      sortedItems[index] = sortedItems[index - 1];
      sortedItems[index - 1] = temp;
      sortedItems.forEach((item, i) => {
        item.sortOrder = i + 1;
      });
      updatePortfolioItemsSortOrder(sortedItems);
      setItems(sortedItems);
    }
  };

  const handleMoveDown = (id: number) => {
    const sortedItems = [...items].sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));
    const index = sortedItems.findIndex(i => i.id === id);
    if (index < sortedItems.length - 1) {
      const temp = sortedItems[index];
      sortedItems[index] = sortedItems[index + 1];
      sortedItems[index + 1] = temp;
      sortedItems.forEach((item, i) => {
        item.sortOrder = i + 1;
      });
      updatePortfolioItemsSortOrder(sortedItems);
      setItems(sortedItems);
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

  const handleDrop = (e: React.DragEvent, targetIndex: number) => {
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
      updatePortfolioItemsSortOrder(sortedItems);
      setItems(sortedItems);
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
    const defaultCategory = selectedCategory === 'all' ? (categories[0] || '') : selectedCategory;
    setFormData({
      title: '',
      category: defaultCategory,
      tag: '',
      shortDesc: '',
      fullDesc: '',
      img: '',
      videoUrl: '',
      type: 'image',
      color: 'text-primary',
      bgGlow: 'bg-primary/20'
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
      videoUrl: item.videoUrl || '',
      type: item.type,
      color: item.color,
      bgGlow: item.bgGlow
    });
    setViewMode('edit');
  };

  const handleDelete = async (id: number) => {
    if (confirm('确定要删除这个案例吗？')) {
      deletePortfolioItem(id);
      refreshItems();
    }
  };

  const handleImageUpload = async (file: File) => {
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
      });
      
      setFormData(prev => ({ ...prev, img: result.url }));
      
      setImageUploadStatus(prev => ({ 
        ...prev,
        phase: 'done', 
        progress: 100 
      }));
    } catch (error) {
      setImageUploadStatus({ 
        phase: 'done', 
        progress: 0, 
        message: `上传失败: ${(error as Error).message}` 
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleVideoUpload = async (file: File) => {
    setIsLoading(true);
    const isMP4 = file.type === 'video/mp4';
    const fileSizeKB = (file.size / 1024).toFixed(1);
    const fileSizeMB = (file.size / 1024 / 1024).toFixed(2);

    if (isMP4) {
      setVideoUploadStatus({ 
        phase: 'checking', 
        progress: 0, 
        message: `正在检测视频比特率 (${fileSizeKB}KB)...` 
      });
    } else {
      setVideoUploadStatus({ 
        phase: 'uploading', 
        progress: 0, 
        message: `视频无需压缩，直接上传 (${fileSizeMB}MB)...` 
      });
    }

    try {
      const result = await uploadVideo(file, (progress) => {
        setVideoUploadStatus({ ...progress, phase: progress.phase as any });
      });
      
      setFormData(prev => ({ ...prev, videoUrl: result.url }));
      if (!formData.img && result.coverUrl) {
        setFormData(prev => ({ ...prev, img: result.coverUrl }));
      }
      
      setVideoUploadStatus(prev => ({ 
        ...prev,
        phase: 'done', 
        progress: 100 
      }));
    } catch (error) {
      setVideoUploadStatus({ 
        phase: 'done', 
        progress: 0, 
        message: `上传失败: ${(error as Error).message}` 
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = () => {
    if (!formData.title || !formData.category || !formData.img) {
      alert('请填写必填字段：标题、分类和封面图片');
      return;
    }

    if (formData.type === 'video' && !formData.videoUrl) {
      alert('视频类型需要填写视频地址或上传视频');
      return;
    }

    if (viewMode === 'create') {
      addPortfolioItem(formData);
    } else if (viewMode === 'edit' && editingItem) {
      updatePortfolioItem({ ...formData, id: editingItem.id });
    }

    setViewMode('list');
    refreshItems();
  };

  const handleCancel = () => {
    setViewMode('list');
    setEditingItem(null);
  };

  if (viewMode !== 'list') {
    return (
      <div className="p-8">
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
                      <div className={`text-sm whitespace-pre-line ${imageUploadStatus.message.includes('失败') ? 'text-red-400' : 'text-on-surface-variant'}`}>
                        {imageUploadStatus.message}
                      </div>
                    </div>
                    {imageUploadStatus.phase !== 'done' && (
                      <div className="w-full bg-white/5 rounded-full h-2 overflow-hidden mt-2">
                        <div 
                          className="h-full rounded-full bg-secondary transition-all duration-300"
                          style={{ width: `${imageUploadStatus.progress}%` }}
                        />
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
                      <div className={`text-sm whitespace-pre-line ${videoUploadStatus.message.includes('失败') ? 'text-red-400' : 'text-on-surface-variant'}`}>
                        {videoUploadStatus.message}
                      </div>
                    </div>
                    {(videoUploadStatus.phase !== 'done') && (
                      <div className="w-full bg-white/5 rounded-full h-2 overflow-hidden mt-2">
                        <div 
                          className={`h-full rounded-full transition-all duration-300 ${
                            videoUploadStatus.phase === 'checking' || videoUploadStatus.phase === 'compressing' ? 'bg-primary' : 'bg-secondary'
                          }`}
                          style={{ width: `${videoUploadStatus.progress}%` }}
                        />
                      </div>
                    )}
                  </div>
                )}
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
                  <div className="font-headline font-medium text-on-surface truncate">{item.title}</div>
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