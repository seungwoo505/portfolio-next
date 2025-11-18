"use client";

import { useState, useCallback } from 'react';
import { ProjectForm } from '@/types/project';
import dynamic from 'next/dynamic';
import { authApi } from '@/lib/api';
import toast from 'react-hot-toast';

// 마크다운 에디터 동적 import
const MDEditor = dynamic(
  () => import('@uiw/react-md-editor'),
  { ssr: false }
);

interface ProjectContentProps {
  formData: ProjectForm;
  setFormData: (data: ProjectForm) => void;
  errors: Record<string, string>;
}

function ProjectContent({ formData, setFormData, errors }: ProjectContentProps) {
  const [isGenerating, setIsGenerating] = useState(false);

  const handleContentChange = (value: string | undefined) => {
    setFormData({
      ...formData,
      content: value || ''
    });
  };

  // AI 기반 요약 생성
  const generateSummary = useCallback(async () => {
    if (!formData.content || formData.content.length < 50) {
      toast.error('콘텐츠가 너무 짧습니다. 최소 50자 이상 입력해주세요.');
      return;
    }

    try {
      setIsGenerating(true);
      const response = await authApi.generateSummary(formData.content, true);
      
      if (response.success && response.data) {
        const { summary, keywordsString } = response.data;
        
        // 요약을 description에 설정
        setFormData({
          ...formData,
          description: summary,
          meta_keywords: keywordsString || ''
        });
        
        toast.success('AI 요약이 생성되었습니다!');
      }
    } catch {
      toast.error('AI 요약 생성에 실패했습니다. 수동으로 입력해주세요.');
    } finally {
      setIsGenerating(false);
    }
  }, [formData, setFormData]);

  // AI 기반 키워드 생성
  const generateKeywords = useCallback(async () => {
    if (!formData.content || formData.content.length < 50) {
      toast.error('콘텐츠가 너무 짧습니다. 최소 50자 이상 입력해주세요.');
      return;
    }

    try {
      setIsGenerating(true);
      const response = await authApi.generateKeywords(formData.content, 10);
      
      if (response.success && response.data) {
        const { keywordsString } = response.data;
        
        setFormData({
          ...formData,
          meta_keywords: keywordsString || ''
        });
        
        toast.success('AI 키워드가 생성되었습니다!');
      }
    } catch {
      toast.error('AI 키워드 생성에 실패했습니다. 수동으로 입력해주세요.');
    } finally {
      setIsGenerating(false);
    }
  }, [formData, setFormData]);

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
            프로젝트 상세 내용 (마크다운)
          </label>
          <div className="flex space-x-2">
            <button
              type="button"
              onClick={generateSummary}
              disabled={isGenerating || !formData.content}
              className="px-3 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isGenerating ? '생성 중...' : 'AI 요약'}
            </button>
            <button
              type="button"
              onClick={generateKeywords}
              disabled={isGenerating || !formData.content}
              className="px-3 py-1 text-xs bg-green-100 text-green-700 rounded hover:bg-green-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isGenerating ? '생성 중...' : 'AI 키워드'}
            </button>
          </div>
        </div>
        
        <div className="border border-slate-300 dark:border-slate-600 rounded-lg overflow-hidden">
          <MDEditor
            value={formData.content}
            onChange={handleContentChange}
            height={400}
          />
        </div>
        {errors.content && <p className="text-red-500 text-sm mt-1">{errors.content}</p>}
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
          메타 키워드
        </label>
        <input
          type="text"
          value={formData.meta_keywords || ''}
          onChange={(e) => setFormData({ ...formData, meta_keywords: e.target.value })}
          className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
          placeholder="키워드1, 키워드2, 키워드3"
        />
        <p className="text-sm text-slate-500 mt-1">SEO를 위한 키워드를 쉼표로 구분하여 입력하세요</p>
      </div>
    </div>
  );
}

export default ProjectContent;
