import React, { useState, useEffect } from 'react';
import { UnreferencedFile, getUnreferencedFiles, deleteFiles } from '../../data/store';

// 预览弹窗组件
function PreviewModal({ file, onClose }: { file: UnreferencedFile | null; onClose: () => void }) {
  if (!file) return null;

  const isImage = /\.(jpg|jpeg|png|gif|webp)$/i.test(file.name);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80" onClick={onClose}>
      <div className="relative max-w-4xl max-h-[90vh] m-4" onClick={(e) => e.stopPropagation()}>
        {/* 关闭按钮 */}
        <button 
          onClick={onClose}
          className="absolute -top-10 right-0 text-white hover:text-gray-300 transition-colors flex items-center gap-2"
        >
          <span>关闭</span>
          <span className="text-xl">✕</span>
        </button>
        
        {/* 文件名称 */}
        <div className="text-white text-center mb-4 font-medium">
          {file.name.split('/').pop()}
        </div>

        {/* 内容区 */}
        <div className="bg-black/50 rounded-xl overflow-hidden border border-white/10">
          {isImage ? (
            <img 
              src={file.url} 
              alt={file.name} 
              className="max-w-full max-h-[70vh] object-contain mx-auto"
              onError={(e) => {
                console.error('图片加载失败:', file.url);
                (e.target as HTMLImageElement).style.display = 'none';
                (e.target as HTMLImageElement).parentElement!.innerHTML = 
                  '<div class="flex items-center justify-center h-[300px] text-gray-400">图片加载失败</div>';
              }}
            />
          ) : (
            <video 
              src={file.url} 
              controls 
              className="max-w-full max-h-[70vh] mx-auto"
              onError={(e) => {
                console.error('视频加载失败:', file.url);
                (e.target as HTMLVideoElement).style.display = 'none';
                (e.target as HTMLVideoElement).parentElement!.innerHTML = 
                  '<div class="flex items-center justify-center h-[300px] text-gray-400">视频加载失败</div>';
              }}
            />
          )}
        </div>

        {/* 文件信息 */}
        <div className="text-gray-400 text-sm text-center mt-4">
          {file.source === 'oss' ? 'OSS 文件' : '本地文件'} • {formatFileSize(file.size)} • {new Date(file.lastModified).toLocaleString('zh-CN')}
        </div>
      </div>
    </div>
  );
}

// 格式化文件大小
function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

export default function StorageAdmin() {
  const [files, setFiles] = useState<UnreferencedFile[]>([]);
  const [totalSize, setTotalSize] = useState(0);
  const [loading, setLoading] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set());
  const [deleting, setDeleting] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [previewFile, setPreviewFile] = useState<UnreferencedFile | null>(null);

  // 加载未引用文件
  async function loadFiles() {
    setLoading(true);
    setMessage(null);
    try {
      const data = await getUnreferencedFiles();
      setFiles(data.files);
      setTotalSize(data.totalSize);
      setSelectedFiles(new Set());
    } catch (error) {
      console.error('加载文件失败:', error);
      setMessage({ text: '加载文件失败', type: 'error' });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadFiles();
  }, []);

  // 按 ESC 关闭预览
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape' && previewFile) {
        setPreviewFile(null);
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [previewFile]);

  // 选择/取消选择文件
  function toggleSelect(fileName: string) {
    const newSelected = new Set(selectedFiles);
    if (newSelected.has(fileName)) {
      newSelected.delete(fileName);
    } else {
      newSelected.add(fileName);
    }
    setSelectedFiles(newSelected);
  }

  // 全选/取消全选
  function toggleSelectAll() {
    if (selectedFiles.size === files.length) {
      setSelectedFiles(new Set());
    } else {
      setSelectedFiles(new Set(files.map(f => f.name)));
    }
  }

  // 删除选中文件
  async function handleDeleteSelected() {
    const filesToDelete = files.filter(f => selectedFiles.has(f.name));
    if (filesToDelete.length === 0) return;

    const confirmed = window.confirm(
      `确定要删除选中的 ${filesToDelete.length} 个文件吗？此操作不可恢复！`
    );
    if (!confirmed) return;

    setDeleting(true);
    setMessage(null);
    try {
      const result = await deleteFiles(filesToDelete);
      setMessage({
        text: `删除完成！成功: ${result.successCount}, 失败: ${result.failCount}`,
        type: result.failCount === 0 ? 'success' : 'error'
      });
      await loadFiles();
    } catch (error) {
      console.error('删除文件失败:', error);
      setMessage({ text: '删除文件失败', type: 'error' });
    } finally {
      setDeleting(false);
    }
  }

  // 选择文件来源筛选
  const [filter, setFilter] = useState<'all' | 'oss' | 'local'>('all');
  const filteredFiles = files.filter(f => {
    if (filter === 'all') return true;
    return f.source === filter;
  });

  return (
    <div className="p-8">
      {/* 预览弹窗 */}
      {previewFile && <PreviewModal file={previewFile} onClose={() => setPreviewFile(null)} />}

      <header className="mb-8">
        <h2 className="font-headline text-3xl font-bold text-on-surface">存储管理</h2>
        <p className="text-on-surface-variant mt-2">管理未被引用的图片和视频文件</p>
      </header>

      {message && (
        <div className={`message ${message.type}`}>
          {message.text}
        </div>
      )}

      {/* 操作栏 */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <button 
            onClick={loadFiles}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 rounded-xl border border-white/10 bg-surface-container text-on-surface-variant hover:bg-white/5 transition-colors disabled:opacity-50"
          >
            {loading ? '扫描中...' : '🔄 重新扫描'}
          </button>

          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value as any)}
            className="px-3 py-2 rounded-xl border border-white/10 bg-surface-container text-on-surface focus:outline-none focus:border-primary/50"
          >
            <option value="all">全部文件</option>
            <option value="oss">仅 OSS</option>
            <option value="local">仅本地</option>
          </select>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-on-surface-variant text-sm">
            共 {filteredFiles.length} 个文件, {formatFileSize(filteredFiles.reduce((s, f) => s + f.size, 0))}
          </span>
          {selectedFiles.size > 0 && (
            <button 
              onClick={handleDeleteSelected}
              disabled={deleting}
              className="px-4 py-2 rounded-xl bg-error text-on-error font-medium hover:bg-error/90 transition-colors disabled:opacity-50"
            >
              {deleting ? '删除中...' : `删除 ${selectedFiles.size} 个文件`}
            </button>
          )}
        </div>
      </div>

      {/* 文件列表 */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <p className="text-on-surface-variant">正在扫描文件...</p>
        </div>
      ) : filteredFiles.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <p className="text-on-surface-variant text-lg mb-2">✨ 未发现未引用的文件</p>
          <p className="text-sm text-on-surface-variant/60">所有文件都在正常使用中</p>
        </div>
      ) : (
        <div className="rounded-2xl bg-surface-container border border-white/5 overflow-hidden">
          {/* 表头 */}
          <div className="grid grid-cols-[40px_1fr_120px_100px_150px_120px] gap-4 px-6 py-4 bg-white/[0.02] border-b border-white/5 text-xs font-semibold text-on-surface-variant uppercase tracking-wider">
            <div>
              <input 
                type="checkbox" 
                checked={selectedFiles.size === filteredFiles.length && filteredFiles.length > 0}
                onChange={toggleSelectAll}
                className="cursor-pointer"
              />
            </div>
            <div>文件路径</div>
            <div>大小</div>
            <div>来源</div>
            <div>最后修改</div>
            <div>操作</div>
          </div>

          {/* 文件列表 */}
          <div className="max-h-[500px] overflow-auto">
            {filteredFiles.map((file, index) => {
              const isSelected = selectedFiles.has(file.name);
              const isImage = /\.(jpg|jpeg|png|gif|webp)$/i.test(file.name);
              return (
                <div 
                  key={file.name}
                  className={`grid grid-cols-[40px_1fr_120px_100px_150px_120px] gap-4 px-6 py-4 items-center border-b border-white/5 transition-colors ${isSelected ? 'bg-white/[0.03]' : 'hover:bg-white/[0.02]'}`}
                >
                  <div>
                    <input 
                      type="checkbox" 
                      checked={isSelected}
                      onChange={() => toggleSelect(file.name)}
                      className="cursor-pointer"
                    />
                  </div>

                  <div className="flex items-center gap-4 min-w-0">
                    {/* 缩略图预览 */}
                    <div className="w-12 h-12 rounded-lg bg-white/5 flex items-center justify-center overflow-hidden flex-shrink-0">
                      {isImage ? (
                        <img 
                          src={file.url} 
                          alt="" 
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = 'none';
                            (e.target as HTMLImageElement).parentElement!.innerHTML = '🖼️';
                            (e.target as HTMLImageElement).parentElement!.style.fontSize = '1.25rem';
                          }}
                        />
                      ) : (
                        <span className="text-xl">🎬</span>
                      )}
                    </div>
                    <div className="min-w-0">
                      <div className="font-medium text-on-surface truncate">
                        {file.name.split('/').pop()}
                      </div>
                      <div className="text-xs text-on-surface-variant/60 truncate">
                        {file.name}
                      </div>
                    </div>
                  </div>

                  <div className="text-on-surface-variant text-sm">
                    {formatFileSize(file.size)}
                  </div>

                  <div>
                    <span className={`px-2 py-1 rounded-md text-xs ${file.source === 'oss' ? 'bg-primary/20 text-primary' : 'bg-green-500/20 text-green-400'}`}>
                      {file.source === 'oss' ? 'OSS' : '本地'}
                    </span>
                  </div>

                  <div className="text-on-surface-variant text-xs">
                    {new Date(file.lastModified).toLocaleDateString('zh-CN')}
                  </div>

                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => setPreviewFile(file)}
                      className="px-3 py-1.5 text-xs border border-white/10 rounded-lg text-on-surface-variant hover:bg-white/5 transition-colors"
                    >
                      预览
                    </button>
                    <button 
                      onClick={() => {
                        if (confirm(`确定要删除文件 ${file.name} 吗？`)) {
                          deleteFiles([file]).then(() => loadFiles());
                        }
                      }}
                      className="px-3 py-1.5 text-xs bg-red-500/10 text-red-400 rounded-lg hover:bg-red-500/20 transition-colors"
                    >
                      删除
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="mt-8 p-6 rounded-2xl bg-surface-container border border-white/5 text-sm text-on-surface-variant">
        <p className="font-medium mb-2 text-on-surface">⚠️ 注意事项：</p>
        <ul className="list-disc list-inside space-y-1">
          <li>此操作会扫描所有未在数据库中引用的图片和视频文件</li>
          <li>删除操作不可恢复，请仔细确认后再删除</li>
          <li>建议先点击预览确认文件不再需要</li>
        </ul>
      </div>
    </div>
  );
}
