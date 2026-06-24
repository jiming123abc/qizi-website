﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿import { useState, useEffect } from 'react';
import { Plus, GripVertical, ChevronUp, ChevronDown, Edit2, Trash2, Image, AlertCircle, Upload, Link as LinkIcon, Save, X, Sparkles } from 'lucide-react';
import { getCategoriesWithDetails, addCategoryWithDetails, updateCategoryDetails, deleteCategoryWithDetails, CategoryWithDetails, updateCategoriesSortOrder } from '../../data/store';
import { uploadImage } from '../../lib/ossUtils';
import { generateCoverImage, generateIconSVG, ensureImageOnOSS } from '../../lib/aiGenerator';
import { decodeHtmlEntities } from '../../lib/iconPresets';

export function CategoriesAdmin() {
  const [categories, setCategories] = useState<CategoryWithDetails[]>([]);
  const [viewMode, setViewMode] = useState<'list' | 'create' | 'edit'>('list');
  const [editingCategory, setEditingCategory] = useState<CategoryWithDetails | null>(null);
  const [draggedItem, setDraggedItem] = useState<string | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [coverImageSource, setCoverImageSource] = useState<'upload' | 'url'>('upload');
  const [isLoading, setIsLoading] = useState(false);
  const [isGeneratingCover, setIsGeneratingCover] = useState(false);
  const [coverGenerationMessage, setCoverGenerationMessage] = useState('');
  const [isGeneratingIcon, setIsGeneratingIcon] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    coverImage: '',
    icon: ''
  });

  useEffect(() => {
    const loadCategories = async () => {
      try {
        const cats = await getCategoriesWithDetails();
        setCategories(cats);
      } catch (error) {
        console.error('Failed to refresh categories:', error);
      }
    };
    loadCategories();
  }, []);

  const handleCreate = () => {
    setEditingCategory(null);
    setFormData({ name: '', description: '', coverImage: '', icon: '' });
    setCoverImageSource('upload');
    setViewMode('create');
  };

  const handleEdit = (category: CategoryWithDetails) => {
    setEditingCategory(category);
    setFormData({
      name: category.name || '',
      description: category.description || '',
      coverImage: category.coverImage || '',
      icon: category.icon || ''
    });
    setCoverImageSource(category.coverImage && category.coverImage.startsWith('http') ? 'url' : 'upload');
    setViewMode('edit');
  };

  const handleDelete = async (id: string) => {
    if (confirm('确定要删除这个分类吗？删除后相关案例将不受影响。')) {
      setIsLoading(true);
      try {
        await deleteCategoryWithDetails(id);
        const cats = await getCategoriesWithDetails();
        setCategories(cats);
      } catch (error) {
        console.error('删除分类失败:', error);
        alert('删除失败，请重试');
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleCoverImageUpload = async (file: File) => {
    setIsLoading(true);
    try {
      const result = await uploadImage(file);
      if (result.url) {
        setFormData(prev => ({ ...prev, coverImage: result.url }));
      }
    } catch (error) {
      console.error('上传失败:', error);
      alert('上传失败，请重试');
    }
    setIsLoading(false);
  };

  const handleGenerateCover = async () => {
    // ======== 严格防御：标题为空不允许生成（避免白屏报错）========
    const trimmedName = (formData.name || '').trim();
    if (!trimmedName) {
      alert('请先输入分类名称');
      return;
    }

    // 描述为空时提示用户（不强制阻塞，但建议填写以获得更好的生成效果）
    if (!((formData.description || '').trim())) {
      if (!confirm('建议先填写分类描述以获得更精准的封面图，是否继续？')) {
        return;
      }
    }

    setIsGeneratingCover(true);
    setCoverGenerationMessage('正在请求服务器生成图片...');
    try {
      const url = await generateCoverImage(
        trimmedName,
        formData.description,
        (msg) => setCoverGenerationMessage(msg),
        'cover'
      );
      if (!url) {
        throw new Error('生成的图片为空');
      }
      // ======== 关键修复：AI生成图片后，自动切换到 URL 模式，让用户看到预览
      setFormData(prev => ({ ...prev, coverImage: url }));
      // 自动切换到 URL 模式（以确保图片能被预览）
      setCoverImageSource('url');
      setCoverGenerationMessage('生成成功！');
    } catch (error) {
      console.error('生成封面失败:', error);
      alert('生成失败，请检查网络或重试；系统已自动使用渐变图作为兜底。');
    } finally {
      setIsGeneratingCover(false);
      setTimeout(() => setCoverGenerationMessage(''), 5000);
    }
  };

  const handleGenerateIcon = async () => {
    if (!(formData.name || '').trim()) {
      alert('请先输入分类名称');
      return;
    }

    setIsGeneratingIcon(true);
    try {
      const svg = await generateIconSVG(formData.name || '', formData.description || '');
      setFormData(prev => ({ ...prev, icon: svg }));
    } catch (error) {
      console.error('生成图标失败:', error);
      alert('生成失败，请重试；系统已自动使用本地图标作为兜底。');
    } finally {
      setIsGeneratingIcon(false);
    }
  };

  const handleSubmit = async () => {
    if (!(formData.name || '').trim()) {
      alert('请输入分类名称');
      return;
    }

    setIsLoading(true);
    try {
      let finalCoverImage = formData.coverImage;
      if (finalCoverImage && (finalCoverImage.startsWith('http://') || finalCoverImage.startsWith('https://')) && !finalCoverImage.includes('aliyuncs.com') && !finalCoverImage.includes('myqcloud.com')) {
        try {
          console.log('[CategoriesAdmin] AI封面图转存 OSS:', finalCoverImage.substring(0, 60));
          finalCoverImage = await ensureImageOnOSS(finalCoverImage);
          setFormData(prev => ({ ...prev, coverImage: finalCoverImage }));
          console.log('[CategoriesAdmin] 转存成功:', finalCoverImage.substring(0, 60));
        } catch (err) {
          console.warn('[CategoriesAdmin] 封面图转存OSS失败，保留原URL:', err);
          alert('封面图上传至OSS失败，已保留原图片链接。请检查OSS配置后重试。');
        }
      }

      if (viewMode === 'create') {
        await addCategoryWithDetails(formData.name.trim(), formData.description, finalCoverImage, formData.icon);
      } else if (viewMode === 'edit' && editingCategory) {
        await updateCategoryDetails(editingCategory.id, {
          name: formData.name.trim(),
          description: formData.description,
          coverImage: finalCoverImage,
          icon: formData.icon
        });
      }

      setViewMode('list');
      const cats = await getCategoriesWithDetails();
      setCategories(cats);
    } catch (error) {
      console.error('保存分类失败:', error);
      alert('保存失败，请重试');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDragStart = (e: React.DragEvent, id: string) => {
    setDraggedItem(id);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    setDragOverIndex(index);
  };

  const handleDrop = async (e: React.DragEvent, targetIndex: number) => {
    e.preventDefault();
    if (!draggedItem) return;

    const newCategories = [...categories];
    const draggedIndex = newCategories.findIndex(c => c.id === draggedItem);
    
    if (draggedIndex !== targetIndex) {
      const draggedCategory = newCategories.splice(draggedIndex, 1)[0];
      newCategories.splice(targetIndex, 0, draggedCategory);
      newCategories.forEach((cat, idx) => {
        cat.sortOrder = idx + 1;
      });
      
      try {
        await updateCategoriesSortOrder(newCategories);
        setCategories(newCategories);
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

  const handleMoveUp = async (id: string) => {
    const newCategories = [...categories];
    const index = newCategories.findIndex(c => c.id === id);
    if (index > 0) {
      const temp = newCategories[index];
      newCategories[index] = newCategories[index - 1];
      newCategories[index - 1] = temp;
      newCategories.forEach((cat, idx) => {
        cat.sortOrder = idx + 1;
      });
      try {
        await updateCategoriesSortOrder(newCategories);
        setCategories(newCategories);
      } catch (error) {
        console.error('排序失败:', error);
        alert('排序失败，请重试');
      }
    }
  };

  const handleMoveDown = async (id: string) => {
    const newCategories = [...categories];
    const index = newCategories.findIndex(c => c.id === id);
    if (index < newCategories.length - 1) {
      const temp = newCategories[index];
      newCategories[index] = newCategories[index + 1];
      newCategories[index + 1] = temp;
      newCategories.forEach((cat, idx) => {
        cat.sortOrder = idx + 1;
      });
      try {
        await updateCategoriesSortOrder(newCategories);
        setCategories(newCategories);
      } catch (error) {
        console.error('排序失败:', error);
        alert('排序失败，请重试');
      }
    }
  };

  if (viewMode !== 'list') {
    return (
      <div className="p-8">
        <header className="flex items-center justify-between mb-8">
          <div>
            <h2 className="font-headline text-2xl font-bold text-on-surface">
              {viewMode === 'create' ? '新增分类' : '编辑分类'}
            </h2>
            <p className="text-on-surface-variant mt-1">
              {viewMode === 'create' ? '添加新的作品分类' : '修改选中的分类信息'}
            </p>
          </div>
          <button
            onClick={() => setViewMode('list')}
            className="p-2 rounded-xl hover:bg-black/20 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </header>

        <div className="max-w-2xl mx-auto px-4">
          <div className="bg-surface-container rounded-2xl border border-white/5 shadow-lg p-4 sm:p-6">
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-label text-on-surface mb-2">分类名称</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-4 py-3 rounded-xl bg-surface-container-low border border-white/5 text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:border-primary/50 transition-colors"
                  placeholder="请输入分类名称"
                />
              </div>

              <div>
                <label className="block text-sm font-label text-on-surface mb-2">分类说明</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full px-4 py-3 rounded-xl bg-surface-container-low border border-white/5 text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:border-primary/50 transition-colors resize-none"
                  rows={3}
                  placeholder="简短描述这个分类..."
                />
              </div>

              <div>
                <label className="block text-sm font-label text-on-surface mb-2">封面图</label>
                <div className="flex flex-wrap gap-2 mb-3">
                  <button
                    onClick={() => setCoverImageSource('upload')}
                    className={`flex-1 sm:flex-none px-4 py-2 rounded-lg text-sm transition-colors ${
                      coverImageSource === 'upload'
                        ? 'bg-primary/20 border-primary/50 text-primary'
                        : 'bg-black/20 text-on-surface-variant hover:bg-black/30'
                    }`}
                  >
                    <Upload className="w-4 h-4 inline mr-1" />
                    本地上传
                  </button>
                  <button
                    onClick={() => setCoverImageSource('url')}
                    className={`flex-1 sm:flex-none px-4 py-2 rounded-lg text-sm transition-colors ${
                      coverImageSource === 'url'
                        ? 'bg-primary/20 border-primary/50 text-primary'
                        : 'bg-black/20 text-on-surface-variant hover:bg-black/30'
                    }`}
                  >
                    <LinkIcon className="w-4 h-4 inline mr-1" />
                    网络地址
                  </button>
                  <button
                    onClick={handleGenerateCover}
                    disabled={isGeneratingCover}
                    className="flex-1 sm:flex-none px-4 py-2 rounded-lg text-sm transition-colors bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:from-purple-700 hover:to-pink-700 disabled:opacity-50 flex items-center justify-center gap-1"
                  >
                    {isGeneratingCover ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        生成中...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4" />
                        AI生成
                      </>
                    )}
                  </button>
                </div>

                {coverGenerationMessage && (
                  <div className="mb-3">
                    <p className="text-xs text-on-surface-variant">
                      {isGeneratingCover ? '⏳ ' : '✅ '}
                      {coverGenerationMessage}
                    </p>
                  </div>
                )}

                {coverImageSource === 'upload' ? (
                  <div className="relative">
                    {formData.coverImage ? (
                      <div className="relative w-full max-w-xs">
                        <img
                          src={formData.coverImage}
                          alt="封面预览"
                          className="w-full h-auto rounded-xl object-cover"
                        />
                        <button
                          onClick={() => setFormData(prev => ({ ...prev, coverImage: '' }))}
                          className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-error text-white flex items-center justify-center"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <label className="flex flex-col items-center justify-center w-full max-w-xs h-32 rounded-xl border-2 border-dashed border-white/20 hover:border-primary/50 transition-colors cursor-pointer">
                        <Image className="w-8 h-8 text-on-surface-variant mb-2" />
                        <span className="text-xs text-on-surface-variant">点击上传</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) handleCoverImageUpload(file);
                          }}
                          className="hidden"
                        />
                      </label>
                    )}
                  </div>
                ) : (
                  <div className="space-y-3">
                    <input
                      type="text"
                      value={formData.coverImage}
                      onChange={(e) => setFormData(prev => ({ ...prev, coverImage: e.target.value }))}
                      className="w-full px-4 py-3 rounded-xl bg-surface-container-low border border-white/5 text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:border-primary/50 transition-colors"
                      placeholder="输入图片URL地址"
                    />
                    {formData.coverImage && (
                      <div className="relative w-full max-w-xs">
                        <img
                          src={formData.coverImage}
                          alt="封面预览"
                          className="w-full h-auto rounded-xl object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = 'none';
                          }}
                        />
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-label text-on-surface mb-2">图标 (SVG)</label>
                <div className="mb-3">
                  <button
                    onClick={handleGenerateIcon}
                    disabled={isGeneratingIcon}
                    className="w-full px-4 py-2 rounded-lg text-sm transition-colors bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:from-purple-700 hover:to-pink-700 disabled:opacity-50 flex items-center justify-center gap-1"
                  >
                    {isGeneratingIcon ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        生成中...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4" />
                        AI生成图标
                      </>
                    )}
                  </button>
                </div>
                <div className="flex flex-col sm:flex-row gap-3">
                  <div className="flex-1">
                    <textarea
                      value={formData.icon}
                      onChange={(e) => setFormData(prev => ({ ...prev, icon: e.target.value }))}
                      className="w-full px-4 py-3 rounded-xl bg-surface-container-low border border-white/5 text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:border-primary/50 transition-colors resize-none text-xs font-mono"
                      rows={3}
                      placeholder="&lt;svg xmlns=&quot;http://www.w3.org/2000/svg&quot; ...&gt;&lt;/svg&gt;"
                    />
                  </div>
                  <div className="w-16 h-16 rounded-xl bg-surface-container-low border border-white/5 flex items-center justify-center flex-shrink-0">
                    {formData.icon ? (
                      <div dangerouslySetInnerHTML={{ __html: decodeHtmlEntities(formData.icon) }} className="w-10 h-10 text-primary flex items-center justify-center" />
                    ) : (
                      <Image className="w-6 h-6 text-on-surface-variant" />
                    )}
                  </div>
                </div>
                <p className="text-xs text-on-surface-variant/50 mt-2">请输入完整的 SVG 代码</p>
              </div>
            </div>

            <div className="flex gap-3 mt-8">
              <button
                onClick={() => setViewMode('list')}
                className="flex-1 px-4 py-3 rounded-xl bg-black/20 text-on-surface-variant hover:bg-black/30 transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleSubmit}
                disabled={isLoading}
                className="flex-1 px-4 py-3 rounded-xl bg-primary text-on-primary hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    保存中...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    {viewMode === 'create' ? '创建分类' : '保存修改'}
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
    <div className="p-4 sm:p-6 lg:p-8">
      <header className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6 sm:mb-8">
        <div>
          <h2 className="font-headline text-xl sm:text-2xl font-bold text-on-surface">分类管理</h2>
          <p className="text-on-surface-variant mt-1">管理作品案例的分类，支持拖放排序</p>
        </div>
        <button
          onClick={handleCreate}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-on-primary hover:bg-primary/90 transition-colors whitespace-nowrap"
        >
          <Plus className="w-4 h-4" />
          新增分类
        </button>
      </header>

      <div className="bg-surface-container rounded-2xl border border-white/5 shadow-lg overflow-hidden">
        <div className="p-4 md:p-6">
          <div className="space-y-3">
            {categories.map((category, index) => (
              <div
                key={category.id}
                draggable
                onDragStart={(e) => handleDragStart(e, category.id)}
                onDragOver={(e) => handleDragOver(e, index)}
                onDrop={(e) => handleDrop(e, index)}
                onDragEnd={handleDragEnd}
                className={`flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4 p-3 sm:p-4 rounded-xl border transition-all cursor-grab active:cursor-grabbing ${
                  dragOverIndex === index
                    ? 'bg-primary/10 border-primary/30'
                    : 'bg-surface-container-low border-white/5 hover:border-white/10'
                } ${draggedItem === category.id ? 'opacity-50' : ''}`}
              >
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-lg text-on-surface-variant hover:text-primary hover:bg-primary/10 transition-colors cursor-grab active:cursor-grabbing">
                    <GripVertical className="w-4 h-4" />
                  </div>
                  <button
                    onClick={() => handleMoveUp(category.id)}
                    disabled={index === 0}
                    className="p-1.5 rounded-lg text-on-surface-variant hover:text-primary hover:bg-primary/10 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    <ChevronUp className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleMoveDown(category.id)}
                    disabled={index === categories.length - 1}
                    className="p-1.5 rounded-lg text-on-surface-variant hover:text-primary hover:bg-primary/10 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    <ChevronDown className="w-4 h-4" />
                  </button>
                  <span className="w-6 h-6 flex items-center justify-center rounded-lg bg-black/30 text-on-surface-variant text-xs">
                    {index + 1}
                  </span>
                </div>

                {category.coverImage ? (
                  <img
                    src={category.coverImage}
                    alt={category.name}
                    className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg object-cover flex-shrink-0"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = '/images/hero-home.png';
                    }}
                  />
                ) : (
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg bg-black/20 flex items-center justify-center flex-shrink-0">
                    <Image className="w-5 h-5 text-on-surface-variant" />
                  </div>
                )}

                <div className="flex-1 min-w-0 w-full sm:w-auto">
                  <div className="font-headline font-medium text-on-surface">{category.name}</div>
                  <div className="text-xs text-on-surface-variant line-clamp-1 sm:line-clamp-2 md:line-clamp-3">
                    {category.description || '暂无说明'}
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  <button
                    onClick={() => handleEdit(category)}
                    className="p-2 rounded-lg text-on-surface-variant hover:text-primary hover:bg-primary/10 transition-colors"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(category.id)}
                    className="p-2 rounded-lg text-on-surface-variant hover:text-error hover:bg-error/10 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {categories.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16">
            <AlertCircle className="w-12 h-12 text-on-surface-variant mb-4" />
            <p className="text-on-surface-variant">暂无自定义分类</p>
            <button
              onClick={handleCreate}
              className="mt-4 px-4 py-2 rounded-xl bg-primary text-on-primary hover:bg-primary/90 transition-colors"
            >
              创建第一个分类
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
