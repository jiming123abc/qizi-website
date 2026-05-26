import { useState, useEffect } from 'react';
import { Save, Image, Link, FileImage, Loader2, Plus, X } from 'lucide-react';
import { getHomeContent, saveHomeContent, HomeContent } from '../../data/store';
import { uploadImage, UploadError } from '../../lib/ossUtils';

export function HomeContentAdmin() {
  const [content, setContent] = useState<HomeContent>({
    heroTitle: '',
    heroGradientTitle: '',
    heroSubtitle: '',
    heroSlides: [],
    heroImage: '/images/hero-home.png',
    shareTitle: '大连柒子文化发展有限公司',
    shareDescription: '诚信立足 创新致远'
  });
  const [heroImageSource, setHeroImageSource] = useState<'upload' | 'url'>('upload');
  const [isLoading, setIsLoading] = useState(false);
  const [editingSlideIndex, setEditingSlideIndex] = useState<number | null>(null);
  const [slideImageSource, setSlideImageSource] = useState<'upload' | 'url'>('upload');

  useEffect(() => {
    const loadContent = async () => {
      try {
        const homeContent = await getHomeContent();
        setContent(homeContent);
      } catch (error) {
        console.error('Failed to load home content:', error);
      }
    };
    
    loadContent();
  }, []);

  const handleImageUpload = async (file: File, slideIndex?: number, isHeroImage?: boolean, forceLocal: boolean = false) => {
    setIsLoading(true);
    try {
      const result = await uploadImage(file, undefined, forceLocal);
      const url = result.url;
      if (isHeroImage) {
        setContent(prev => ({ ...prev, heroImage: url }));
      } else if (slideIndex !== undefined) {
        const newSlides = [...content.heroSlides];
        newSlides[slideIndex] = { ...newSlides[slideIndex], img: url };
        setContent(prev => ({ ...prev, heroSlides: newSlides }));
      }
    } catch (error) {
      const uploadError = error as UploadError;
      if (uploadError.ossError) {
        const useLocal = confirm(
          `${uploadError.message}\n\n是否使用本地存储？`
        );
        if (useLocal) {
          await handleImageUpload(file, slideIndex, isHeroImage, true);
        }
      } else {
        alert(uploadError.message);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const addSlide = () => {
    const newId = Math.max(...content.heroSlides.map(s => s.id), 0) + 1;
    const newSlide = { id: newId, img: '', label: '', title: '' };
    setContent(prev => ({
      ...prev,
      heroSlides: [...prev.heroSlides, newSlide]
    }));
    setEditingSlideIndex(content.heroSlides.length);
  };

  const removeSlide = (index: number) => {
    setContent(prev => ({
      ...prev,
      heroSlides: prev.heroSlides.filter((_, i) => i !== index)
    }));
  };

  const updateSlide = (index: number, field: string, value: string) => {
    const newSlides = [...content.heroSlides];
    newSlides[index] = { ...newSlides[index], [field]: value };
    setContent(prev => ({ ...prev, heroSlides: newSlides }));
  };

  const handleSubmit = async () => {
    try {
      await saveHomeContent(content);
      alert('首页内容已更新！');
    } catch (error) {
      console.error('Failed to save home content:', error);
      alert('保存失败，请重试');
    }
  };

  return (
    <div className="p-8">
      <header className="flex items-center justify-between mb-8">
        <div>
          <h2 className="font-headline text-2xl font-bold text-on-surface">首页内容管理</h2>
          <p className="text-on-surface-variant mt-1">管理首页展示的内容</p>
        </div>
      </header>

      <div className="max-w-3xl mx-auto space-y-8">
        <div className="bg-surface-container rounded-2xl border border-white/5 shadow-lg p-6">
          <h3 className="font-headline font-semibold text-on-surface mb-6">标题区域</h3>
          
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-label text-on-surface mb-2">主标题（第一行）</label>
              <input
                type="text"
                value={content.heroTitle}
                onChange={(e) => setContent(prev => ({ ...prev, heroTitle: e.target.value }))}
                className="w-full px-4 py-3 rounded-xl bg-surface-container-low border border-white/10 text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:border-primary/50 transition-colors"
                placeholder="开启未来的"
              />
            </div>

            <div>
              <label className="block text-sm font-label text-on-surface mb-2">渐变标题（第二行）</label>
              <input
                type="text"
                value={content.heroGradientTitle}
                onChange={(e) => setContent(prev => ({ ...prev, heroGradientTitle: e.target.value }))}
                className="w-full px-4 py-3 rounded-xl bg-surface-container-low border border-white/10 text-transparent bg-clip-text bg-gradient-to-r from-primary via-secondary to-tertiary placeholder:text-on-surface-variant/50 focus:outline-none focus:border-primary/50 transition-colors"
                placeholder="视界 Matrix"
              />
              <p className="text-xs text-on-surface-variant/50 mt-1">
                渐变颜色：从主色到次色再到第三色
              </p>
            </div>

            <div>
              <label className="block text-sm font-label text-on-surface mb-2">副标题</label>
              <textarea
                value={content.heroSubtitle}
                onChange={(e) => setContent(prev => ({ ...prev, heroSubtitle: e.target.value }))}
                rows={3}
                className="w-full px-4 py-3 rounded-xl bg-surface-container-low border border-white/10 text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:border-primary/50 transition-colors resize-none"
                placeholder="简短描述"
              />
            </div>
          </div>
        </div>

        <div className="bg-surface-container rounded-2xl border border-white/5 shadow-lg p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-headline font-semibold text-on-surface">轮播图管理</h3>
            <button
              onClick={addSlide}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-on-primary hover:bg-primary/90 transition-colors"
            >
              <Plus className="w-4 h-4" />
              添加轮播图
            </button>
          </div>
          
          <div className="space-y-6">
            {content.heroSlides.map((slide, index) => (
              <div key={slide.id} className="border border-white/10 rounded-xl p-4 relative">
                <button
                  onClick={() => removeSlide(index)}
                  className="absolute top-2 right-2 p-1 rounded bg-black/50 text-white hover:bg-black/70 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-label text-on-surface mb-2">图片</label>
                    
                    {editingSlideIndex === index ? (
                      <div className="space-y-3">
                        <div className="flex gap-2">
                          <button
                            onClick={() => setSlideImageSource('upload')}
                            className={`flex items-center gap-2 px-3 py-1 rounded border text-xs transition-all ${
                              slideImageSource === 'upload'
                                ? 'bg-primary/20 border-primary/50 text-primary'
                                : 'bg-surface-container border-white/10 text-on-surface-variant'
                            }`}
                          >
                            <Image className="w-3 h-3" />
                            上传
                          </button>
                          <button
                            onClick={() => setSlideImageSource('url')}
                            className={`flex items-center gap-2 px-3 py-1 rounded border text-xs transition-all ${
                              slideImageSource === 'url'
                                ? 'bg-primary/20 border-primary/50 text-primary'
                                : 'bg-surface-container border-white/10 text-on-surface-variant'
                            }`}
                          >
                            <Link className="w-3 h-3" />
                            URL
                          </button>
                        </div>

                        {slideImageSource === 'upload' && (
                          slide.img ? (
                            <div className="relative rounded-lg overflow-hidden border border-white/10">
                              <img src={slide.img} alt={`Slide ${index + 1}`} className="w-full h-32 object-cover" />
                              <button
                                onClick={() => updateSlide(index, 'img', '')}
                                className="absolute top-1 right-1 p-1 rounded bg-black/50 text-white hover:bg-black/70 transition-colors"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </div>
                          ) : (
                            <label className="flex flex-col items-center justify-center w-full h-32 rounded-lg border-2 border-dashed border-white/20 cursor-pointer hover:border-primary/50 transition-colors">
                              <FileImage className="w-6 h-6 text-on-surface-variant mb-1" />
                              <span className="text-xs text-on-surface-variant">上传图片</span>
                              <input
                                type="file"
                                accept="image/jpeg,image/png,image/webp"
                                onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  if (file) handleImageUpload(file, index);
                                }}
                                className="hidden"
                              />
                            </label>
                          )
                        )}

                        {slideImageSource === 'url' && (
                          <div className="space-y-2">
                            <input
                              type="text"
                              value={slide.img}
                              onChange={(e) => updateSlide(index, 'img', e.target.value)}
                              className="w-full px-3 py-2 rounded-lg bg-surface-container-low border border-white/10 text-on-surface text-sm placeholder:text-on-surface-variant/50 focus:outline-none focus:border-primary/50 transition-colors"
                              placeholder="图片URL"
                            />
                            {slide.img && (
                              <div className="rounded-lg overflow-hidden border border-white/10">
                                <img src={slide.img} alt={`Slide ${index + 1}`} className="w-full h-32 object-cover" />
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    ) : (
                      slide.img && (
                        <div className="relative rounded-lg overflow-hidden border border-white/10">
                          <img src={slide.img} alt={`Slide ${index + 1}`} className="w-full h-32 object-cover" />
                          <button
                            onClick={() => setEditingSlideIndex(index)}
                            className="absolute bottom-2 right-2 px-2 py-1 rounded bg-black/50 text-white text-xs hover:bg-black/70 transition-colors"
                          >
                            编辑
                          </button>
                        </div>
                      )
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-label text-on-surface mb-2">标签</label>
                      <input
                        type="text"
                        value={slide.label}
                        onChange={(e) => updateSlide(index, 'label', e.target.value)}
                        className="w-full px-3 py-2 rounded-lg bg-surface-container-low border border-white/10 text-on-surface text-sm placeholder:text-on-surface-variant/50 focus:outline-none focus:border-primary/50 transition-colors"
                        placeholder="Neural Stream"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-label text-on-surface mb-2">标题</label>
                      <input
                        type="text"
                        value={slide.title}
                        onChange={(e) => updateSlide(index, 'title', e.target.value)}
                        className="w-full px-3 py-2 rounded-lg bg-surface-container-low border border-white/10 text-on-surface text-sm placeholder:text-on-surface-variant/50 focus:outline-none focus:border-primary/50 transition-colors"
                        placeholder="Ethereal Segment 01"
                      />
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {content.heroSlides.length === 0 && (
              <div className="text-center py-8 text-on-surface-variant">
                <p>暂无轮播图，请点击"添加轮播图"按钮添加</p>
              </div>
            )}
          </div>
        </div>

        <div className="bg-surface-container rounded-2xl border border-white/5 shadow-lg p-6">
          <h3 className="font-headline font-semibold text-on-surface mb-6">默认微信分享卡片</h3>
          
          <div className="space-y-4 mb-6">
            <div>
              <label className="block text-sm font-label text-on-surface mb-2">分享标题</label>
              <input
                type="text"
                value={content.shareTitle}
                onChange={(e) => setContent(prev => ({ ...prev, shareTitle: e.target.value }))}
                className="w-full px-4 py-3 rounded-xl bg-surface-container-low border border-white/10 text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:border-primary/50 transition-colors"
                placeholder="分享时显示的标题"
              />
            </div>
            <div>
              <label className="block text-sm font-label text-on-surface mb-2">分享描述</label>
              <textarea
                value={content.shareDescription}
                onChange={(e) => setContent(prev => ({ ...prev, shareDescription: e.target.value }))}
                rows={2}
                className="w-full px-4 py-3 rounded-xl bg-surface-container-low border border-white/10 text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:border-primary/50 transition-colors resize-none"
                placeholder="分享时显示的描述"
              />
            </div>
          </div>

          <div className="space-y-4 pt-6 border-t border-white/10">
            <h4 className="font-headline text-on-surface text-sm">分享缩略图</h4>
            <div>
              <div className="space-y-3">
                <div className="flex gap-2">
                  <button
                    onClick={() => setHeroImageSource('upload')}
                    className={`flex items-center gap-2 px-3 py-1 rounded border text-xs transition-all ${
                      heroImageSource === 'upload'
                        ? 'bg-primary/20 border-primary/50 text-primary'
                        : 'bg-surface-container border-white/10 text-on-surface-variant'
                    }`}
                  >
                    <Image className="w-3 h-3" />
                    上传
                  </button>
                  <button
                    onClick={() => setHeroImageSource('url')}
                    className={`flex items-center gap-2 px-3 py-1 rounded border text-xs transition-all ${
                      heroImageSource === 'url'
                        ? 'bg-primary/20 border-primary/50 text-primary'
                        : 'bg-surface-container border-white/10 text-on-surface-variant'
                    }`}
                  >
                    <Link className="w-3 h-3" />
                    URL
                  </button>
                </div>

                {heroImageSource === 'upload' && (
                  content.heroImage ? (
                    <div className="relative rounded-lg overflow-hidden border border-white/10">
                      <img src={content.heroImage} alt="分享缩略图" className="w-full h-32 object-cover" />
                      <button
                        onClick={() => setContent(prev => ({ ...prev, heroImage: '' }))}
                        className="absolute top-1 right-1 p-1 rounded bg-black/50 text-white hover:bg-black/70 transition-colors"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ) : (
                    <label className="flex flex-col items-center justify-center w-full h-32 rounded-lg border-2 border-dashed border-white/20 cursor-pointer hover:border-primary/50 transition-colors">
                      <FileImage className="w-6 h-6 text-on-surface-variant mb-1" />
                      <span className="text-xs text-on-surface-variant">上传分享缩略图</span>
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleImageUpload(file, undefined, true);
                        }}
                        className="hidden"
                      />
                    </label>
                  )
                )}

                {heroImageSource === 'url' && (
                  <div className="space-y-2">
                    <input
                      type="text"
                      value={content.heroImage}
                      onChange={(e) => setContent(prev => ({ ...prev, heroImage: e.target.value }))}
                      className="w-full px-3 py-2 rounded-lg bg-surface-container-low border border-white/10 text-on-surface text-sm placeholder:text-on-surface-variant/50 focus:outline-none focus:border-primary/50 transition-colors"
                      placeholder="图片URL"
                    />
                    {content.heroImage && (
                      <div className="rounded-lg overflow-hidden border border-white/10">
                        <img src={content.heroImage} alt="分享缩略图预览" className="w-full h-32 object-cover" />
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <button
          onClick={handleSubmit}
          disabled={isLoading}
          className="w-full flex items-center justify-center gap-2 px-6 py-4 rounded-xl bg-primary text-on-primary hover:bg-primary/90 transition-colors disabled:opacity-50"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              保存中...
            </>
          ) : (
            <>
              <Save className="w-5 h-5" />
              保存更改
            </>
          )}
        </button>
      </div>
    </div>
  );
}
