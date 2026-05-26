import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, X, Upload, Image, Link, FileImage, Check, Loader2, AlertCircle, GripVertical, ChevronUp, ChevronDown } from 'lucide-react';
import { getTeamMembers, addTeamMember, updateTeamMember, deleteTeamMember, updateTeamMembersSortOrder, TeamMember } from '../../data/store';
import { uploadImage, UploadError } from '../../lib/ossUtils';

type ViewMode = 'list' | 'create' | 'edit';

export function TeamAdmin() {
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [editingMember, setEditingMember] = useState<TeamMember | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [draggedItem, setDraggedItem] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [avatarSourceType, setAvatarSourceType] = useState<'upload' | 'url'>('upload');

  const [formData, setFormData] = useState({
    name: '',
    role: '',
    avatar: '',
    bio: '',
    fullDesc: ''
  });

  useEffect(() => {
    refreshMembers();
  }, []);

  const refreshMembers = async () => {
    try {
      const teamMembers = await getTeamMembers();
      setMembers(teamMembers);
    } catch (error) {
      console.error('Failed to refresh team members:', error);
    }
  };

  const handleCreate = () => {
    setAvatarSourceType('upload');
    setFormData({
      name: '',
      role: '',
      avatar: '',
      bio: '',
      fullDesc: ''
    });
    setViewMode('create');
  };

  const handleEdit = (member: TeamMember) => {
    setAvatarSourceType(member.avatar.startsWith('http') ? 'url' : 'upload');
    setEditingMember(member);
    setFormData({
      name: member.name,
      role: member.role,
      avatar: member.avatar,
      bio: member.bio,
      fullDesc: (member as any).fullDesc || ''
    });
    setViewMode('edit');
  };

  const handleDelete = (id: number) => {
    if (confirm('确定要删除这个团队成员吗？')) {
      deleteTeamMember(id);
      refreshMembers();
    }
  };

  const handleAvatarUpload = async (file: File, forceLocal: boolean = false) => {
    setIsLoading(true);
    try {
      const result = await uploadImage(file, undefined, forceLocal);
      const url = result.url;
      setFormData(prev => ({ ...prev, avatar: url }));
    } catch (error) {
      const uploadError = error as UploadError;
      if (uploadError.ossError) {
        const useLocal = confirm(
          `${uploadError.message}\n\n是否使用本地存储？`
        );
        if (useLocal) {
          await handleAvatarUpload(file, true);
        }
      } else {
        alert(uploadError.message);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = () => {
    if (!formData.name || !formData.role) {
      alert('请填写必填字段：姓名和职位');
      return;
    }

    if (viewMode === 'create') {
      addTeamMember({ ...formData, sortOrder: members.length + 1 });
    } else if (viewMode === 'edit' && editingMember) {
      updateTeamMember({ ...formData, id: editingMember.id, sortOrder: editingMember.sortOrder });
    }

    setViewMode('list');
    refreshMembers();
  };

  const handleCancel = () => {
    setViewMode('list');
    setEditingMember(null);
  };

  const handleMoveUp = (id: number) => {
    const sortedMembers = [...members].sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));
    const index = sortedMembers.findIndex(m => m.id === id);
    if (index > 0) {
      const temp = sortedMembers[index];
      sortedMembers[index] = sortedMembers[index - 1];
      sortedMembers[index - 1] = temp;
      sortedMembers.forEach((m, i) => {
        m.sortOrder = i + 1;
      });
      updateTeamMembersSortOrder(sortedMembers);
      setMembers(sortedMembers);
    }
  };

  const handleMoveDown = (id: number) => {
    const sortedMembers = [...members].sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));
    const index = sortedMembers.findIndex(m => m.id === id);
    if (index < sortedMembers.length - 1) {
      const temp = sortedMembers[index];
      sortedMembers[index] = sortedMembers[index + 1];
      sortedMembers[index + 1] = temp;
      sortedMembers.forEach((m, i) => {
        m.sortOrder = i + 1;
      });
      updateTeamMembersSortOrder(sortedMembers);
      setMembers(sortedMembers);
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

    const sortedMembers = [...members].sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));
    const draggedIndex = sortedMembers.findIndex(m => m.id === draggedItem);

    if (draggedIndex !== targetIndex) {
      const draggedMember = sortedMembers.splice(draggedIndex, 1)[0];
      sortedMembers.splice(targetIndex, 0, draggedMember);
      sortedMembers.forEach((m, i) => {
        m.sortOrder = i + 1;
      });
      updateTeamMembersSortOrder(sortedMembers);
      setMembers(sortedMembers);
    }

    setDraggedItem(null);
    setDragOverIndex(null);
  };

  const handleDragEnd = () => {
    setDraggedItem(null);
    setDragOverIndex(null);
  };

  if (viewMode !== 'list') {
    return (
      <div className="p-8">
        <header className="flex items-center justify-between mb-8">
          <div>
            <h2 className="font-headline text-2xl font-bold text-on-surface">
              {viewMode === 'create' ? '新增团队成员' : '编辑团队成员'}
            </h2>
            <p className="text-on-surface-variant mt-1">
              {viewMode === 'create' ? '添加新的团队成员' : '修改团队成员信息'}
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
              <label className="block text-sm font-label text-on-surface mb-2">姓名 *</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                className="w-full px-4 py-3 rounded-xl bg-surface-container-low border border-white/10 text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:border-primary/50 transition-colors"
                placeholder="请输入姓名"
              />
            </div>

            <div>
              <label className="block text-sm font-label text-on-surface mb-2">职位 *</label>
              <input
                type="text"
                value={formData.role}
                onChange={(e) => setFormData(prev => ({ ...prev, role: e.target.value }))}
                className="w-full px-4 py-3 rounded-xl bg-surface-container-low border border-white/10 text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:border-primary/50 transition-colors"
                placeholder="请输入职位"
              />
            </div>

            <div>
              <label className="block text-sm font-label text-on-surface mb-2">头像</label>
              <div className="flex gap-2 mb-3">
                <button
                  onClick={() => setAvatarSourceType('upload')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-all ${
                    avatarSourceType === 'upload'
                      ? 'bg-primary/20 border-primary/50 text-primary'
                      : 'bg-surface-container border-white/10 text-on-surface-variant hover:text-on-surface'
                  }`}
                >
                  <Upload className="w-4 h-4" />
                  上传头像
                </button>
                <button
                  onClick={() => setAvatarSourceType('url')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-all ${
                    avatarSourceType === 'url'
                      ? 'bg-primary/20 border-primary/50 text-primary'
                      : 'bg-surface-container border-white/10 text-on-surface-variant hover:text-on-surface'
                  }`}
                >
                  <Link className="w-4 h-4" />
                  网络地址
                </button>
              </div>

              {avatarSourceType === 'upload' ? (
                formData.avatar ? (
                  <div className="relative rounded-xl overflow-hidden border border-white/10 w-32 h-32">
                    <img src={formData.avatar} alt="头像" className="w-full h-full object-cover" />
                    <button
                      onClick={() => setFormData(prev => ({ ...prev, avatar: '' }))}
                      className="absolute top-2 right-2 p-2 rounded-lg bg-black/50 text-white hover:bg-black/70 transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center w-32 h-32 rounded-xl border-2 border-dashed border-white/20 cursor-pointer hover:border-primary/50 transition-colors">
                    <Image className="w-8 h-8 text-on-surface-variant mb-2" />
                    <span className="text-xs text-on-surface-variant">上传头像</span>
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleAvatarUpload(file);
                      }}
                      className="hidden"
                    />
                  </label>
                )
              ) : (
                <>
                  <input
                    type="text"
                    value={formData.avatar}
                    onChange={(e) => setFormData(prev => ({ ...prev, avatar: e.target.value }))}
                    className="w-full px-4 py-3 rounded-xl bg-surface-container-low border border-white/10 text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:border-primary/50 transition-colors"
                    placeholder="请输入头像网络地址"
                  />
                  {formData.avatar && (
                    <div className="mt-3 rounded-xl overflow-hidden border border-white/10 w-32 h-32">
                      <img src={formData.avatar} alt="头像" className="w-full h-full object-cover" />
                    </div>
                  )}
                </>
              )}
            </div>

            <div>
              <label className="block text-sm font-label text-on-surface mb-2">简介</label>
              <textarea
                value={formData.bio}
                onChange={(e) => setFormData(prev => ({ ...prev, bio: e.target.value }))}
                rows={3}
                className="w-full px-4 py-3 rounded-xl bg-surface-container-low border border-white/10 text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:border-primary/50 transition-colors resize-none"
                placeholder="简短介绍..."
              />
            </div>

            <div>
              <label className="block text-sm font-label text-on-surface mb-2">详细介绍</label>
              <textarea
                value={formData.fullDesc}
                onChange={(e) => setFormData(prev => ({ ...prev, fullDesc: e.target.value }))}
                rows={5}
                className="w-full px-4 py-3 rounded-xl bg-surface-container-low border border-white/10 text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:border-primary/50 transition-colors resize-none"
                placeholder="详细介绍..."
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
                    保存中...
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    {viewMode === 'create' ? '创建成员' : '保存修改'}
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
          <h2 className="font-headline text-2xl font-bold text-on-surface">团队成员管理</h2>
          <p className="text-on-surface-variant mt-1">管理团队成员信息，支持拖放排序</p>
        </div>
        <button
          onClick={handleCreate}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-on-primary hover:bg-primary/90 transition-colors"
        >
          <Plus className="w-4 h-4" />
          新增成员
        </button>
      </header>

      <div className="bg-surface-container rounded-2xl border border-white/5 shadow-lg overflow-hidden">
        {members.length > 0 ? (
          <div className="p-4 sm:p-6">
            <div className="space-y-2 sm:space-y-3">
              {members.map((member, index) => (
                <div
                  key={member.id}
                  draggable
                  onDragStart={(e) => handleDragStart(e, member.id)}
                  onDragOver={(e) => handleDragOver(e, index)}
                  onDrop={(e) => handleDrop(e, index)}
                  onDragEnd={handleDragEnd}
                  className={`flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4 p-3 sm:p-4 rounded-xl border transition-all cursor-grab active:cursor-grabbing ${
                    dragOverIndex === index
                      ? 'bg-primary/10 border-primary/30'
                      : 'bg-surface-container-low border-white/5 hover:border-white/10'
                  } ${draggedItem === member.id ? 'opacity-50' : ''}`}
                >
                  <div className="flex items-center gap-2">
                    <div className="p-2 rounded-lg text-on-surface-variant hover:text-primary hover:bg-primary/10 transition-colors cursor-grab active:cursor-grabbing">
                      <GripVertical className="w-4 h-4" />
                    </div>
                    <button
                      onClick={() => handleMoveUp(member.id)}
                      disabled={index === 0}
                      className="p-1.5 rounded-lg text-on-surface-variant hover:text-primary hover:bg-primary/10 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                      <ChevronUp className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleMoveDown(member.id)}
                      disabled={index === members.length - 1}
                      className="p-1.5 rounded-lg text-on-surface-variant hover:text-primary hover:bg-primary/10 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                      <ChevronDown className="w-4 h-4" />
                    </button>
                  </div>

                  <span className="w-6 h-6 flex items-center justify-center rounded-lg bg-black/30 text-on-surface-variant text-xs">
                    {index + 1}
                  </span>

                  <img
                    src={member.avatar || '/images/neon-avatar.png'}
                    alt={member.name}
                    className="w-12 h-12 rounded-full object-cover"
                  />

                  <div className="flex-1 min-w-0">
                    <div className="font-headline font-medium text-on-surface">{member.name}</div>
                    <div className="text-xs text-on-surface-variant">{member.role}</div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleEdit(member)}
                      className="p-2 rounded-lg text-on-surface-variant hover:text-primary hover:bg-primary/10 transition-colors"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(member.id)}
                      className="p-2 rounded-lg text-on-surface-variant hover:text-error hover:bg-error/10 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-16">
            <AlertCircle className="w-12 h-12 text-on-surface-variant mb-4" />
            <p className="text-on-surface-variant">暂无团队成员</p>
            <button
              onClick={handleCreate}
              className="mt-4 px-4 py-2 rounded-xl bg-primary text-on-primary hover:bg-primary/90 transition-colors"
            >
              添加第一个成员
            </button>
          </div>
        )}
      </div>
    </div>
  );
}