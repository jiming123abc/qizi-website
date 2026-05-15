import { useState, useEffect } from 'react';
import { Save, Image, Link, FileImage, Loader2, Check } from 'lucide-react';
import { getHomeContent, saveHomeContent, HomeContent } from '../../data/store';
import { uploadImageToOSS } from '../../lib/ossUtils';

export function HomeContentAdmin() {
  const [content, setContent] = useState<HomeContent>({
    heroTitle: '',
    heroSubtitle: '',
    heroImage: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [heroImageSource, setHeroImageSource] = useState<'upload' | 'url'>('upload');

  useEffect(() => {
    setContent(getHomeContent());
  }, []);

  const handleImageUpload = async (file: File) => {
    setIsLoading(true);
    try {
      const url = await uploadImageToOSS(file);
      setContent(prev => ({ ...prev, heroImage: url }));
    } catch (error) {
      alert((error as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = () => {
    saveHomeContent(content);
    alert('首页内容已更新！');
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
          <h3 className="font-headline font-semibold text-on-surface mb-6">Hero 区域</h3>
          
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-label text-on-surface mb-2">主标题</label>
              <textarea
                value={content.heroTitle}
                onChange={(e) => setContent(prev => ({ ...prev, heroTitle: e.target.value }))}
                rows={3}
                className="w-full px-4 py-3 rounded-xl bg-surface-container-low border border-white/10 text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:border-primary/50 transition-colors resize-none"
                placeholder="支持 HTML 标签，如 &lt;br /&gt; 和 &lt;span&gt;"
              />
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

            <div>
              <label className="block text-sm font-label text-on-surface mb-2">背景图片</label>
              <div className="flex gap-2 mb-3">
                <button
                  onClick={() => setHeroImageSource('upload')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-all ${
                    heroImageSource === 'upload'
                      ? 'bg-primary/20 border-primary/50 text-primary'
                      : 'bg-surface-container border-white/10 text-on-surface-variant hover:text-on-surface'
                  }`}
                >
                  <Image className="w-4 h-4" />
                  上传图片
                </button>
                <button
                  onClick={() => setHeroImageSource('url')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-all ${
                    heroImageSource === 'url'
                      ? 'bg-primary/20 border-primary/50 text-primary'
                      : 'bg-surface-container border-white/10 text-on-surface-variant hover:text-on-surface'
                  }`}
                >
                  <Link className="w-4 h-4" />
                  网络地址
                </button>
              </div>

              {heroImageSource === 'upload' ? (
                content.heroImage ? (
                  <div className="relative rounded-xl overflow-hidden border border-white/10">
                    <img src={content.heroImage} alt="Hero" className="w-full h-48 object-cover" />
                    <button
                      onClick={() => setContent(prev => ({ ...prev, heroImage: '' }))}
                      className="absolute top-2 right-2 p-2 rounded-lg bg-black/50 text-white hover:bg-black/70 transition-colors"
                    >
                      <span className="text-xl">&times;</span>
                    </button>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center w-full h-48 rounded-xl border-2 border-dashed border-white/20 cursor-pointer hover:border-primary/50 transition-colors">
                    <FileImage className="w-8 h-8 text-on-surface-variant mb-2" />
                    <span className="text-sm text-on-surface-variant">点击上传背景图片</span>
                    <span className="text-xs text-on-surface-variant/50 mt-1">支持 JPG、PNG、WebP 格式</span>
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
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
                    value={content.heroImage}
                    onChange={(e) => setContent(prev => ({ ...prev, heroImage: e.target.value }))}
                    className="w-full px-4 py-3 rounded-xl bg-surface-container-low border border-white/10 text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:border-primary/50 transition-colors"
                    placeholder="请输入图片网络地址"
                  />
                  {content.heroImage && (
                    <div className="mt-3 rounded-xl overflow-hidden border border-white/10">
                      <img src={content.heroImage} alt="Hero" className="w-full h-48 object-cover" />
                    </div>
                  )}
                </>
              )}
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