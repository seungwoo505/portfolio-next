'use client';
import { useState, useEffect } from 'react';
import { Skill } from '@/types';
import toast from 'react-hot-toast';
interface SkillModalProps {
  isOpen: boolean;
  onClose: () => void;
  skill?: Skill | null;
  onSave: (skill: Partial<Skill>) => Promise<{ success: boolean; message?: string }>;
  categories: Array<{ id: string; name: string }>;
  keepOpenOnSuccess?: boolean; 
}
/**
 * @description 기술 스택을 추가하거나 수정하기 위한 모달 컴포넌트입니다.
 * @param {SkillModalProps} props 모달 제어 및 저장 콜백 설정.
 * @returns {JSX.Element | null} 모달 요소 또는 닫힌 상태에서는 null.
 */
export default function SkillModal({ isOpen, onClose, skill, onSave, categories, keepOpenOnSuccess = false }: SkillModalProps) {
  const [formData, setFormData] = useState<Partial<Skill>>({
    name: '',
    category_id: '',
    proficiency_level: 50,
    display_order: 0,
    is_featured: false,
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showDisplayOrder, setShowDisplayOrder] = useState(false);
  useEffect(() => {
    if (skill) {
      setFormData({
        name: skill.name,
        category_id: skill.category_id || '',
        proficiency_level: skill.proficiency_level,
        display_order: skill.display_order,
        is_featured: skill.is_featured,
      });
      setShowDisplayOrder(skill.is_featured || false);
    } else {
      setFormData({
        name: '',
        category_id: '',
        proficiency_level: 50,
        display_order: 0,
        is_featured: false,
      });
      setShowDisplayOrder(false);
    }
    setErrors({});
  }, [isOpen, skill, categories]);
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);
  /**
   * @description 폼 데이터를 검증합니다.
   * @returns {boolean} 검증 통과 여부.
   */
  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.name?.trim()) {
      newErrors.name = '기술명을 입력해주세요.';
    }
    if (formData.proficiency_level === undefined || formData.proficiency_level < 0 || formData.proficiency_level > 100) {
      newErrors.proficiency_level = '숙련도는 0-100 사이여야 합니다.';
    }
    if (formData.is_featured && (formData.display_order === undefined || formData.display_order < 1 || formData.display_order > 12)) {
      newErrors.display_order = '추천 기술 스택의 표시 순서는 1~12 사이여야 합니다.';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  /**
   * @description 폼 제출을 처리하고 기술을 저장합니다.
   * @param {React.FormEvent} e 제출 이벤트.
   * @returns {Promise<void>}
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) {
      return;
    }
    try {
      setLoading(true);
      const cleanFormData = {
        name: formData.name || '',
        category_id: formData.category_id || '',
        proficiency_level: formData.proficiency_level || 50,
        display_order: formData.display_order || 0,
        is_featured: formData.is_featured || false
      };
      const result = await onSave(cleanFormData);
      if (result.success) {
        toast.success(result.message || (skill ? '기술 스택이 수정되었습니다.' : '기술 스택이 추가되었습니다.'));
        if (!keepOpenOnSuccess) {
          onClose();
        } else {
          if (!skill) {
            setFormData({
              name: '',
              category_id: '',
              proficiency_level: 50,
              display_order: 0,
              is_featured: false,
            });
            setShowDisplayOrder(false);
          }
        }
      } else {
        toast.error(result.message || '저장에 실패했습니다.');
      }
    } catch {
      toast.error('기술 스택 저장 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };
  /**
   * @description 폼 필드 값을 업데이트합니다.
   * @param {keyof Skill} field 변경할 필드.
   * @param {string | number | boolean} value 새로운 값.
   * @returns {void}
   */
  const handleChange = (field: keyof Skill, value: string | number | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-black/75 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
              {skill ? '기술 스택 수정' : '새 기술 스택 추가'}
            </h2>
            <button
              type="button"
              onClick={onClose}
              aria-label="닫기"
              className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-1.5">
              <label htmlFor="skill-name" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                기술명 *
              </label>
              <input
                id="skill-name"
                type="text"
                value={formData.name || ''}
                onChange={(e) => handleChange('name', e.target.value)}
                className={`w-full px-3 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors placeholder:text-slate-400 dark:placeholder:text-slate-400 ${
                  errors.name 
                    ? 'border-red-500 dark:border-red-400' 
                    : 'border-slate-300 dark:border-slate-600'
                } bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100`}
                placeholder="예: React, TypeScript, Node.js"
              />
              {errors.name && (
                <p className="text-sm text-red-500 dark:text-red-400">{errors.name}</p>
              )}
            </div>
            <div className="space-y-1.5">
              <label htmlFor="skill-category" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                카테고리 *
              </label>
              <select
                id="skill-category"
                value={formData.category_id || ''}
                onChange={(e) => handleChange('category_id', e.target.value)}
                className={`w-full px-3 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
                  errors.category_id 
                    ? 'border-red-500 dark:border-red-400' 
                    : 'border-slate-300 dark:border-slate-600'
                } bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100`}
                required
              >
                <option value="">카테고리 선택</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
              {categories.length === 0 && (
                <p className="text-sm text-amber-600 dark:text-amber-400">
                  카테고리가 설정되지 않았습니다. 관리자에게 문의하세요.
                </p>
              )}
              {errors.category_id && (
                <p className="text-sm text-red-500 dark:text-red-400">{errors.category_id}</p>
              )}
            </div>
            <div className="space-y-1.5">
              <label htmlFor="skill-proficiency" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                숙련도: {formData.proficiency_level}%
              </label>
              <div className="flex items-center gap-4">
                <input
                  id="skill-proficiency"
                  type="range"
                  min="1"
                  max="100"
                  value={formData.proficiency_level || 50}
                  onChange={(e) => {
                    const value = parseInt(e.target.value);
                    handleChange('proficiency_level', value);
                  }}
                  className="flex-1 h-2.5 bg-slate-200 dark:bg-slate-600 rounded-lg appearance-none cursor-pointer accent-blue-600"
                  style={{
                    background: `linear-gradient(to right, #3B82F6 0%, #3B82F6 ${(formData.proficiency_level || 50)}%, #e2e8f0 ${(formData.proficiency_level || 50)}%, #e2e8f0 100%)`
                  }}
                />
              </div>
              {errors.proficiency_level && (
                <p className="text-sm text-red-500 dark:text-red-400">{errors.proficiency_level}</p>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-6">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="skill-is-featured"
                  checked={formData.is_featured || false}
                  onChange={(e) => {
                    const isFeatured = e.target.checked;
                    handleChange('is_featured', isFeatured);
                    setShowDisplayOrder(isFeatured);
                    if (!isFeatured) {
                      handleChange('display_order', 0);
                    } else if (!formData.display_order || formData.display_order === 0) {
                      handleChange('display_order', 1);
                    }
                  }}
                  className="h-4 w-4 rounded border-slate-300 dark:border-slate-600 text-blue-600 focus:ring-blue-500"
                />
                <label htmlFor="skill-is-featured" className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  추천 기술 스택으로 설정
                </label>
              </div>
              {showDisplayOrder && (
                <div className="flex items-center gap-3">
                  <label htmlFor="skill-display-order" className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    표시 순서
                  </label>
                  <select
                    id="skill-display-order"
                    value={formData.display_order || ''}
                    onChange={(e) => handleChange('display_order', parseInt(e.target.value) || 1)}
                    className={`w-20 px-3 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
                      errors.display_order 
                        ? 'border-red-500 dark:border-red-400' 
                        : 'border-slate-300 dark:border-slate-600'
                    } bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100`}
                  >
                    {[...Array(12)].map((_, i) => (
                      <option key={i + 1} value={i + 1}>
                        {i + 1}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
            {showDisplayOrder && errors.display_order && (
              <p className="text-sm text-red-500 dark:text-red-400">{errors.display_order}</p>
            )}
            <div className="flex justify-end gap-3 pt-2 border-t border-slate-200 dark:border-slate-600">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-lg text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
              >
                취소
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white transition-colors"
              >
                {loading ? '저장 중...' : (skill ? '수정' : '추가')}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
