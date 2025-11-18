"use client";

import { useState, useEffect } from 'react';
import { ProjectForm, AvailableTag } from '@/types/project';
import { Search, Tag } from 'lucide-react';
import { authApi } from '@/lib/api';

interface ProjectTagsProps {
  formData: ProjectForm;
  setFormData: (data: ProjectForm) => void;
  errors: Record<string, string>;
}

function ProjectTags({ formData, setFormData, errors }: ProjectTagsProps) {
  const [availableTags, setAvailableTags] = useState<AvailableTag[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);

  // 사용 가능한 태그 목록 가져오기
  useEffect(() => {
    const fetchTags = async () => {
      try {
        setLoading(true);
        const response = await authApi.get<AvailableTag[]>('/admin/tags');
        if (response.success && response.data) {
          setAvailableTags(response.data);
        }
      } catch {
        // 태그 로딩 실패
      } finally {
        setLoading(false);
      }
    };

    fetchTags();
  }, []);

  // 태그 추가
  const addTag = (tag: AvailableTag) => {
    if (!formData.tags.includes(tag.name)) {
      setFormData({
        ...formData,
        tags: [...formData.tags, tag.name]
      });
    }
  };

  // 태그 제거
  const removeTag = (tagName: string) => {
    setFormData({
      ...formData,
      tags: formData.tags.filter(tag => tag !== tagName)
    });
  };

  // 검색 필터링
  const filteredTags = availableTags.filter(tag =>
    tag.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
    !formData.tags.includes(tag.name)
  );

  return (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
          <Tag className="w-4 h-4 inline mr-2" />
          기술 스택 / 태그
        </label>
        
        {/* 선택된 태그들 */}
        <div className="flex flex-wrap gap-2 mb-3">
          {formData.tags.map((tag, index) => (
            <span
              key={index}
              className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
            >
              {tag}
              <button
                type="button"
                onClick={() => removeTag(tag)}
                className="ml-2 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-200"
              >
                ×
              </button>
            </span>
          ))}
        </div>

        {/* 태그 검색 */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="태그를 검색하세요..."
            className="w-full pl-10 pr-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
          />
        </div>

        {/* 사용 가능한 태그 목록 */}
        {searchQuery && (
          <div className="mt-2 max-h-40 overflow-y-auto border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800">
            {loading ? (
              <div className="p-3 text-center text-slate-500">로딩 중...</div>
            ) : filteredTags.length > 0 ? (
              filteredTags.map((tag) => (
                <button
                  key={tag.id}
                  type="button"
                  onClick={() => addTag(tag)}
                  className="w-full px-3 py-2 text-left hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center space-x-2"
                >
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: tag.color || '#6B7280' }}
                  />
                  <span className="text-slate-900 dark:text-white">{tag.name}</span>
                </button>
              ))
            ) : (
              <div className="p-3 text-center text-slate-500">검색 결과가 없습니다</div>
            )}
          </div>
        )}

        {errors.tags && <p className="text-red-500 text-sm mt-1">{errors.tags}</p>}
      </div>
    </div>
  );
}

export default ProjectTags;
