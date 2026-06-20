"use client";
import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { authApi } from '@/lib/api';
import { ensureApiSuccess, getErrorMessage } from '@/utils/api-response';
import { X, AlertCircle, Palette, Save } from 'lucide-react';
interface BlogTag {
  id: string;
  name: string;
  slug: string;
  description?: string;
  color?: string;
  type: 'blog' | 'project' | 'general';
  usage_count?: number;
  created_at: string;
  updated_at: string;
}
interface TagModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTagSaved: (tag: BlogTag) => void;
  editingTag?: BlogTag | null;
  defaultType?: 'blog' | 'project' | 'general';
}
interface TagForm {
  name: string;
  slug: string;
  description: string;
  color: string;
  type: 'blog' | 'project' | 'general';
}
const colorOptions = [
  '#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6',
  '#06b6d4', '#84cc16', '#f97316', '#ec4899', '#6b7280',
  '#14b8a6', '#f43f5e', '#a855f7', '#0891b2', '#65a30d'
];
/**
 * @description 태그를 생성하거나 수정하기 위한 모달 컴포넌트입니다.
 * @param {TagModalProps} props 모달 제어 및 콜백 설정.
 * @returns {JSX.Element | null} 태그 모달 요소 혹은 닫힌 상태에서는 null.
 */
export default function TagModal({ isOpen, onClose, onTagSaved, editingTag, defaultType }: TagModalProps) {
  const [formData, setFormData] = useState<TagForm>({
    name: '',
    slug: '',
    description: '',
    color: colorOptions[0],
    type: 'general'
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  useEffect(() => {
    if (editingTag) {
      setFormData({
        name: editingTag.name,
        slug: editingTag.slug,
        description: editingTag.description || '',
        color: editingTag.color || colorOptions[0],
        type: editingTag.type
      });
    } else {
      setFormData({
        name: '',
        slug: '',
        description: '',
        color: colorOptions[0],
        type: defaultType || 'general'
      });
    }
    setErrors({});
  }, [editingTag, isOpen, defaultType]);
  /**
   * @description 태그명을 기반으로 슬러그를 생성합니다.
   * @param {string} name 태그명.
   * @returns {string} 생성된 슬러그.
   */
  const generateSlug = (name: string) => {
    return name
      .trim()
      .toLowerCase()
      .replace(/\s+/g, '-')           
      .replace(/[^a-z0-9가-힣-]/g, '') 
      .replace(/-+/g, '-')            
      .replace(/^-|-$/g, '');         
  };
  const validateForm = (): boolean => {
    const newErrors: Partial<TagForm> = {};
    if (!formData.name.trim()) {
      newErrors.name = '태그명을 입력하세요';
    }
    if (!formData.slug.trim()) {
      newErrors.slug = '태그명을 입력하면 슬러그가 자동으로 생성됩니다';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  /**
   * @description 폼 제출을 처리하고 태그를 저장합니다.
   * @param {React.FormEvent} e 제출 이벤트.
   * @returns {Promise<void>}
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    if (!validateForm()) return;
    setIsSubmitting(true);
    try {
      const tagData = {
        name: formData.name.trim(),
        slug: formData.slug.trim(),
        description: formData.description.trim() || null,
        color: formData.color || '#3b82f6', 
        type: formData.type
      };
      let response;
      if (editingTag) {
        response = await authApi.put(`/admin/tags/${editingTag.id}`, tagData);
      } else {
        response = await authApi.post('/admin/tags', tagData);
      }
      ensureApiSuccess(response, '태그 저장에 실패했습니다.');
      if (!response.data) {
        throw new Error('저장된 태그 정보를 받지 못했습니다.');
      }
      const savedTag = response.data as BlogTag;
      onTagSaved(savedTag);
      onClose();
    } catch (error: unknown) {
      const message = getErrorMessage(error, '태그 저장에 실패했습니다.');
      if (message.includes('slug') || message.includes('슬러그')) {
        setErrors({ slug: '이미 사용 중인 슬러그입니다' });
      } else if (message.includes('name') || message.includes('태그명')) {
        setErrors({ name: '이미 사용 중인 태그명입니다' });
      } else {
        toast.error('태그 저장 실패: ' + message);
      }
    } finally {
      setIsSubmitting(false);
    }
  };
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/50 p-4">
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-700">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
            {editingTag ? '태그 편집' : '새 태그 추가'}
          </h2>
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            aria-label="닫기"
            className="inline-flex h-10 w-10 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 disabled:cursor-not-allowed disabled:opacity-50 dark:hover:bg-slate-700 dark:hover:text-slate-300"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div className="space-y-1.5">
            <label htmlFor="tag-name" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
              태그명 *
            </label>
            <input
              id="tag-name"
              type="text"
              value={formData.name}
              onChange={(e) => {
                const name = e.target.value;
                setFormData(prev => ({ 
                  ...prev, 
                  name,
                  slug: generateSlug(name)
                }));
              }}
              className={`w-full px-3 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors placeholder:text-slate-400 dark:placeholder:text-slate-400 ${
                errors.name ? 'border-red-500 dark:border-red-400' : 'border-slate-300 dark:border-slate-600'
              } bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100`}
              placeholder="예: React, Next.js"
            />
            {errors.name && (
              <p className="text-red-500 dark:text-red-400 text-sm flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{errors.name}</span>
              </p>
            )}
          </div>
          <div className="space-y-1.5">
            <label htmlFor="tag-slug" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
              슬러그
            </label>
            <input
              id="tag-slug"
              type="text"
              value={formData.slug}
              readOnly
              aria-readonly
              className="w-full px-3 py-2.5 border border-slate-300 dark:border-slate-600 rounded-lg bg-slate-50 dark:bg-slate-700/80 text-slate-700 dark:text-slate-300 cursor-not-allowed"
              placeholder="태그명 입력 시 자동 생성"
            />
            <p className="text-xs text-slate-500 dark:text-slate-400">
              태그명을 기반으로 URL 친화적으로 자동 생성됩니다.
            </p>
          </div>
          <div className="space-y-1.5">
            <label htmlFor="tag-description" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
              설명 (선택)
            </label>
            <textarea
              id="tag-description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              rows={3}
              className="w-full px-3 py-2.5 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors placeholder:text-slate-400 dark:placeholder:text-slate-400 resize-y min-h-[76px] bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
              placeholder="태그에 대한 설명 (선택)"
            />
          </div>
          <div className="space-y-1.5">
            <label htmlFor="tag-type" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
              타입 *
            </label>
            <select
              id="tag-type"
              value={formData.type}
              onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value as 'blog' | 'project' | 'general' }))}
              className="w-full px-3 py-2.5 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
            >
              <option value="general">일반</option>
              <option value="blog">블로그</option>
              <option value="project">프로젝트</option>
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
              색상
            </label>
            <div className="p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg border border-slate-200 dark:border-slate-600">
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">미리보기</p>
              <div className="inline-flex items-center gap-2">
                <span 
                  className="px-3 py-1 rounded-full text-sm font-medium text-white"
                  style={{ backgroundColor: formData.color }}
                >
                  {formData.name || '태그 이름'}
                </span>
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  {formData.color}
                </span>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex flex-wrap gap-2">
                {colorOptions.map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, color }))}
                    className={`w-8 h-8 rounded-full border-2 transition-all ${
                      formData.color === color 
                        ? 'border-slate-500 dark:border-slate-300 ring-2 ring-slate-300 dark:ring-slate-500' 
                        : 'border-transparent hover:border-slate-300 dark:hover:border-slate-500'
                    }`}
                    style={{ backgroundColor: color }}
                    title={color}
                  />
                ))}
              </div>
              <div className="flex items-center gap-2">
                <Palette className="w-4 h-4 text-slate-400" />
                <input
                  type="color"
                  value={formData.color}
                  onChange={(e) => setFormData(prev => ({ ...prev, color: e.target.value }))}
                  className="w-8 h-8 border border-slate-300 dark:border-slate-600 rounded cursor-pointer"
                  title="커스텀 색상 선택"
                />
              </div>
            </div>
          </div>
          <div className="flex gap-3 pt-2 border-t border-slate-200 dark:border-slate-600">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="flex-1 px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors disabled:opacity-50"
            >
              취소
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{isSubmitting ? '저장 중...' : (editingTag ? '수정' : '생성')}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
