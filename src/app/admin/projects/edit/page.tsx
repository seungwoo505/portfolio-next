"use client";
import Link from "next/link";
import { Suspense } from "react";

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

import toast from 'react-hot-toast';
import dynamic from 'next/dynamic';
import {
  ArrowLeft,
  Save,
  X,
  Search,
  Tag,
  Plus
} from 'lucide-react';
import { authApi } from '@/lib/api';
import { Project } from '@/types';

// 마크다운 에디터 동적 import
const MDEditor = dynamic(
  () => import('@uiw/react-md-editor'),
  { ssr: false }
);

interface ProjectFormData {
  title: string;
  slug: string;
  description: string;
  content: string;
  excerpt: string;
  meta_description: string;
  featured_image: string;
  project_url: string;
  github_url: string;
  tags: string[];
  start_date: string;
  end_date: string;
  is_featured: boolean;
  is_published: boolean;
  is_ongoing: boolean;
  meta_keywords?: string;
}

interface AvailableTag {
  id: string;
  name: string;
  color: string;
  type: string;
}

function EditProjectContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const projectSlug = searchParams.get('slug');
  
  const [formData, setFormData] = useState<ProjectFormData>({
    title: '',
    slug: '',
    description: '',
    content: '',
    excerpt: '',
    meta_description: '',
    featured_image: '',
    project_url: '',
    github_url: '',
    tags: [],
    start_date: '',
    end_date: '',
    is_featured: false,
    is_published: false,
    is_ongoing: false,
    meta_keywords: ''
  });

  const [availableTags, setAvailableTags] = useState<AvailableTag[]>([]);
  const [selectedTags, setSelectedTags] = useState<AvailableTag[]>([]);
  const [showTagDropdown, setShowTagDropdown] = useState(false);
  const [tagSearchQuery, setTagSearchQuery] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isDarkMode, setIsDarkMode] = useState(false);

  // AI 요약/키워드 생성을 위한 전처리 함수
  const preprocessContentForAI = (content: string) => {
    // 마크다운에서 텍스트만 추출하고 __projectName__ 형식을 실제 프로젝트명으로 변환
    return content
      .replace(/__projectName__/g, formData.title || '프로젝트')
      .replace(/#{1,6}\s+/g, '') // 헤더 제거
      .replace(/\*\*(.*?)\*\*/g, '$1') // 볼드 제거
      .replace(/\*(.*?)\*/g, '$1') // 이탤릭 제거
      .replace(/`(.*?)`/g, '$1') // 인라인 코드 제거
      .replace(/```[\s\S]*?```/g, '') // 코드 블록 제거
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // 링크 제거
      .replace(/!\[([^\]]*)\]\([^)]+\)/g, '') // 이미지 제거
      .replace(/\n+/g, ' ') // 줄바꿈을 공백으로
      .trim();
  };

  // Gemini AI 기반 요약 생성
  const generateAISummary = async (content: string) => {
    if (!content.trim()) {
      toast.error('요약할 내용이 없습니다. 먼저 프로젝트 내용을 작성해주세요.');
      return '';
    }

    try {
      const preprocessedContent = preprocessContentForAI(content);
      const response = await authApi.generateSummary(preprocessedContent, false);
      
      if (response.success && response.data) {
        return response.data.summary;
      } else {
        throw new Error(response.message || '요약 생성에 실패했습니다.');
      }
    } catch {
      toast.error('AI 요약 생성에 실패했습니다. 수동으로 입력해주세요.');
      return '';
    }
  };

  // Gemini AI 기반 키워드 생성
  const generateAIKeywords = async (content: string) => {
    if (!content.trim()) {
      toast.error('키워드를 추출할 내용이 없습니다. 먼저 프로젝트 내용을 작성해주세요.');
      return '';
    }

    try {
      const preprocessedContent = preprocessContentForAI(content);
      const response = await authApi.generateSummary(preprocessedContent, true);
      
      if (response.success && response.data) {
        return response.data.keywordsString || '';
      } else {
        throw new Error(response.message || '키워드 생성에 실패했습니다.');
      }
    } catch {
      toast.error('AI 키워드 생성에 실패했습니다. 수동으로 입력해주세요.');
      return '';
    }
  };

  // 다크 모드 감지
  useEffect(() => {
    const checkDarkMode = () => {
      setIsDarkMode(document.documentElement.classList.contains('dark'));
    };
    
    checkDarkMode();
    
    const observer = new MutationObserver(checkDarkMode);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class']
    });
    
    return () => observer.disconnect();
  }, []);

  // 프로젝트 데이터 로드
  useEffect(() => {
    const loadProject = async () => {
      if (!projectSlug) {
        toast.error('프로젝트 슬러그가 필요합니다.');
        setIsLoading(false);
        return;
      }
      
      try {
        setIsLoading(true);
        const response = await authApi.get(`/admin/projects/slug/${projectSlug}`);
        
        if (response.success && response.data) {
          const project = response.data as Project;
          
          setFormData({
            title: project.title || '',
            slug: project.slug || '',
            description: project.description || '',
            content: project.content || '',
            excerpt: project.excerpt || '',
            meta_description: project.meta_description || '',
            featured_image: project.image_url || '',
            project_url: project.demo_url || '',
            github_url: project.github_url || '',
            tags: [],
            start_date: project.start_date ? project.start_date.split('T')[0] : '',
            end_date: project.end_date ? project.end_date.split('T')[0] : '',
            is_featured: Boolean(project.featured),
            is_published: project.status === 'completed' || false,
            is_ongoing: project.status === 'in_progress' || false,
            meta_keywords: project.meta_keywords || ''
          });

          // 태그 설정
          if (project.tags && Array.isArray(project.tags)) {
            const formattedTags = project.tags.map((tag, index) => {
              if (typeof tag === 'string') {
                return {
                  id: `${project.id}-tag-${index}`,
                  name: tag,
                  color: '#6B7280',
                  type: 'project'
                };
              } else {
                return {
                  id: String(tag.id),
                  name: tag.name,
                  color: tag.color || '#6B7280',
                  type: tag.type || 'project'
                };
              }
            });
            setSelectedTags(formattedTags);
          }
        }
      } catch {
        // console.error 제거됨
        toast.error('프로젝트를 불러오는데 실패했습니다.');
        router.push('/admin/projects');
      } finally {
        setIsLoading(false);
      }
    };

    loadProject();
  }, [projectSlug, router]);

  // 사용 가능한 태그 목록 가져오기
  useEffect(() => {
    const fetchTags = async () => {
      try {
        const response = await authApi.get('/admin/tags');
        if (response.success && response.data) {
          const tagsData = response.data as Array<{ type?: string; id: string | number; name: string; color?: string }>;
          const filteredData = tagsData.filter(
            (t: { type?: string }) => t.type === 'project' || t.type === 'general'
          );
          const mapped = filteredData.map((t: { id: string | number; name: string; color?: string }) => ({
            id: String(t.id),
            name: t.name,
            color: t.color || '#6B7280',
            type: 'project'
          }));
          setAvailableTags(mapped);
        }
      } catch {
        // console.error 제거됨
      }
    };

    fetchTags();
  }, []);


  const filteredTags = availableTags.filter(tag =>
    tag.name.toLowerCase().includes(tagSearchQuery.toLowerCase())
  );

  // 드롭다운 외부 클릭 시 닫기
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (!target.closest('.tag-dropdown')) {
        setShowTagDropdown(false);
        setTagSearchQuery('');
      }
    };

    if (showTagDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showTagDropdown]);

  // 제목에서 슬러그 자동 생성
  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9가-힣\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
  };

  const handleTitleChange = (title: string) => {
    setFormData(prev => ({
      ...prev,
      title,
      slug: generateSlug(title)
    }));
  };

  const toggleTag = (tag: AvailableTag) => {
    setSelectedTags(prev => {
      const isSelected = prev.some(t => t.id === tag.id);
      if (isSelected) {
        return prev.filter(t => t.id !== tag.id);
      } else {
        return [...prev, tag];
      }
    });
  };

  // 이미지 업로드 핸들러 - 주석 처리
  // const _handleImageUpload = async (file: File): Promise<string> => {
  //   try {
  //     if (file.size > 5 * 1024 * 1024) {
  //       throw new Error('파일 크기는 5MB 이하여야 합니다.');
  //     }
  //     const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
  //     if (!allowedTypes.includes(file.type)) {
  //       throw new Error('지원되지 않는 이미지 형식입니다.');
  //     }

  //     const response = await authApi.uploadImage(file);
  //     
  //     if (response.success && response.data?.url) {
  //       return response.data.url;
  //     } else {
  //       throw new Error(response.message || '서버에서 올바른 응답을 받지 못했습니다.');
  //     }
  //   } catch {
  //     // console.error 제거됨
  //     throw new Error('이미지 업로드에 실패했습니다.');
  //   }
  // };

  const handleSubmit = async () => {
    if (!formData.title.trim()) {
      toast.error('제목을 입력해주세요.');
      return;
    }

    if (!formData.start_date) {
      toast.error('시작일을 입력해주세요.');
      return;
    }

    if (!formData.is_ongoing && !formData.end_date) {
      toast.error('종료일을 입력해주세요.');
      return;
    }

    if (!projectSlug) {
      toast.error('프로젝트 슬러그가 필요합니다.');
      return;
    }

    setIsSubmitting(true);
    try {
      const projectData = {
        title: formData.title,
        slug: formData.slug,
        description: formData.description,
        content: formData.content,
        excerpt: formData.excerpt || null,
        meta_description: formData.meta_description || null,
        featured_image: formData.featured_image || null,
        project_url: formData.project_url || null,
        github_url: formData.github_url || null,
        tags: selectedTags.map(tag => tag.name),
        start_date: formData.start_date || null,
        end_date: formData.end_date || null,
        is_featured: formData.is_featured,
        is_published: formData.is_published,
        is_ongoing: formData.is_ongoing,
        meta_keywords: formData.meta_keywords || null
      };

      const response = await authApi.put(`/admin/projects/slug/${projectSlug}`, projectData);
      
      if (response.success) {
        toast.success('프로젝트가 성공적으로 수정되었습니다!');
        router.push('/admin/projects');
      }
    } catch {
      // console.error 제거됨
      toast.error('프로젝트 수정에 실패했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="animate-pulse">
            <div className="h-8 bg-slate-300 dark:bg-slate-600 rounded w-1/3 mb-8"></div>
            <div className="space-y-4">
              <div className="h-12 bg-slate-300 dark:bg-slate-600 rounded"></div>
              <div className="h-96 bg-slate-300 dark:bg-slate-600 rounded"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!projectSlug) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">프로젝트 슬러그가 필요합니다</h1>
            <p className="text-slate-600 dark:text-slate-400 mb-8">URL에 프로젝트 슬러그가 포함되어야 합니다.</p>
            <Link href="/admin/projects" className="inline-flex items-center space-x-2 text-blue-600 dark:text-blue-400 hover:underline font-medium">
              <ArrowLeft className="w-4 h-4" />
              <span>프로젝트 목록으로 돌아가기</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* 메인 폼 */}
          <div className="lg:col-span-2 space-y-6">
            {/* 기본 정보 */}
            <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 p-6">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">기본 정보</h2>
              
              {/* 제목 */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  제목 *
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => handleTitleChange(e.target.value)}
                  className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 placeholder-slate-500 dark:placeholder-slate-400"
                  placeholder="프로젝트 제목을 입력하세요"
                />
              </div>

              {/* 슬러그 */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  슬러그 (URL)
                </label>
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-slate-500 dark:text-slate-400">/projects/</span>
                  <input
                    type="text"
                    value={formData.slug}
                    onChange={(e) => setFormData(prev => ({ ...prev, slug: e.target.value }))}
                    className="flex-1 px-3 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-slate-900 dark:text-white"
                    placeholder="project-slug"
                  />
                </div>
              </div>

            </div>

            {/* 상세 내용 */}
            <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 p-6">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">상세 내용</h2>
              <div data-color-mode={isDarkMode ? 'dark' : 'light'}>
                <MDEditor
                  value={formData.content}
                  onChange={(val) => setFormData(prev => ({ ...prev, content: val || '' }))}
                  height={400}
                  preview="edit"
                  hideToolbar={false}
                />
              </div>
            </div>

            {/* 링크 정보 */}
            <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 p-6">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">링크 정보</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    프로젝트 URL
                  </label>
                  <input
                    type="url"
                    value={formData.project_url}
                    onChange={(e) => setFormData(prev => ({ ...prev, project_url: e.target.value }))}
                    className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 placeholder-slate-500 dark:placeholder-slate-400"
                    placeholder="https://example.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    GitHub URL
                  </label>
                  <input
                    type="url"
                    value={formData.github_url}
                    onChange={(e) => setFormData(prev => ({ ...prev, github_url: e.target.value }))}
                    className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 placeholder-slate-500 dark:placeholder-slate-400"
                    placeholder="https://github.com/username/repo"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* 사이드바 */}
          <div className="space-y-6">
            {/* 공개 설정 */}
            <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 p-6">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">공개 설정</h3>
              
              <div className="space-y-4">
                {/* 공개/비공개 토글 */}
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                      {formData.is_published ? '공개' : '비공개'}
                    </span>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                      {formData.is_published 
                        ? '프로젝트가 즉시 공개됩니다.' 
                        : '비공개로 저장됩니다.'
                      }
                    </p>
                  </div>
                  
                  {/* 토글 스위치 */}
                  <button
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, is_published: !prev.is_published }))}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                      formData.is_published ? 'toggle-bg-on' : 'toggle-bg-off'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        formData.is_published ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>

                {/* 대표 프로젝트 설정 */}
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                      {formData.is_featured ? '대표 프로젝트' : '일반 프로젝트'}
                    </span>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                      {formData.is_featured 
                        ? '메인 페이지에 표시됩니다.' 
                        : '일반 프로젝트로 저장됩니다.'
                      }
                    </p>
                  </div>
                  
                  {/* 토글 스위치 */}
                  <button
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, is_featured: !prev.is_featured }))}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                      formData.is_featured ? 'toggle-bg-on' : 'toggle-bg-off'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        formData.is_featured ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>

                {/* 진행 중 프로젝트 설정 */}
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                      진행 중 프로젝트
                    </span>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                      현재 진행 중인 프로젝트인지 설정합니다.
                    </p>
                  </div>
                  
                  {/* 토글 스위치 */}
                  <button
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, is_ongoing: !prev.is_ongoing }))}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                      formData.is_ongoing ? 'toggle-bg-on' : 'toggle-bg-off'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        formData.is_ongoing ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
              </div>
            </div>

            {/* 프로젝트 설정 */}
            <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white">프로젝트 설정</h3>
                <button
                  type="button"
                  onClick={async () => {
                    try {
                      const [summary, keywords] = await Promise.all([
                        generateAISummary(formData.content),
                        generateAIKeywords(formData.content)
                      ]);
                      
                      if (summary) {
                        setFormData(prev => ({ 
                          ...prev, 
                          excerpt: summary,
                          meta_description: summary
                        }));
                      }
                      
                      if (keywords) {
                        setFormData(prev => ({ 
                          ...prev, 
                          meta_keywords: keywords
                        }));
                      }
                    } catch {
                      toast.error('AI 요약 & 키워드 생성에 실패했습니다.');
                    }
                  }}
                  className="text-sm text-green-600 dark:text-green-400 hover:text-green-800 dark:hover:text-green-200 flex items-center space-x-2 px-3 py-2 border border-green-300 dark:border-green-600 rounded-lg hover:bg-green-50 dark:hover:bg-green-900/20 transition-colors"
                  disabled={formData.content.trim().length === 0}
                >
                  <span>🚀</span>
                  <span>AI 요약 & 키워드 생성</span>
                </button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                      프로젝트 요약
                    </label>
                    <button
                      type="button"
                      onClick={async () => {
                        const summary = await generateAISummary(formData.content);
                        if (summary) {
                          setFormData(prev => ({ 
                            ...prev, 
                            excerpt: summary,
                            meta_description: summary
                          }));
                        }
                      }}
                      className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-200 flex items-center space-x-1"
                      disabled={formData.content.trim().length === 0}
                    >
                      <span>🤖</span>
                      <span>AI 요약</span>
                    </button>
                  </div>
                  <textarea
                    value={formData.excerpt}
                    onChange={(e) => {
                      const value = e.target.value;
                      setFormData(prev => ({ 
                        ...prev, 
                        excerpt: value,
                        meta_description: value // 요약과 메타 설명 동기화
                      }));
                    }}
                    rows={3}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-slate-900 dark:text-white text-sm"
                    placeholder="프로젝트 요약을 입력하세요. (검색 엔진에도 사용됩니다)"
                  />
                  <div className="flex justify-between items-center mt-1">
                    <span className="text-xs text-slate-500 dark:text-slate-400">
                      프로젝트 목록과 검색 엔진에 표시됩니다.
                    </span>
                    <span className={`text-xs ${formData.excerpt.length > 160 ? 'text-red-500' : 'text-slate-500 dark:text-slate-400'}`}>
                      {formData.excerpt.length}/160
                    </span>
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                      메타 키워드
                    </label>
                    <button
                      type="button"
                      onClick={async () => {
                        const keywords = await generateAIKeywords(formData.content);
                        if (keywords) {
                          setFormData(prev => ({ 
                            ...prev, 
                            meta_keywords: keywords
                          }));
                        }
                      }}
                      className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-200 flex items-center space-x-1"
                      disabled={formData.content.trim().length === 0}
                    >
                      <span>🔍</span>
                      <span>AI 키워드</span>
                    </button>
                  </div>
                  <input
                    type="text"
                    value={formData.meta_keywords || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, meta_keywords: e.target.value }))}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-slate-900 dark:text-white text-sm"
                    placeholder="키워드1, 키워드2, ..."
                  />
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    검색 엔진 최적화를 위한 키워드입니다. (선택사항)
                  </p>
                </div>
              </div>
            </div>

            {/* 태그 */}
            <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">태그 선택</h3>
                <Link
                  href="/admin/tags?type=project"
                  className="text-blue-600 dark:text-blue-400 hover:text-blue-900 dark:hover:text-blue-300 text-sm flex items-center space-x-1"
                >
                  <Tag className="w-4 h-4" />
                  <span>태그 관리</span>
                </Link>
              </div>

              <div className="tag-dropdown relative">
                <button
                  type="button"
                  onClick={() => setShowTagDropdown(!showTagDropdown)}
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-slate-900 dark:text-white text-left flex items-center justify-between"
                >
                  <span>프로젝트 태그 선택...</span>
                  <Plus className={`w-4 h-4 transition-transform ${showTagDropdown ? 'rotate-45' : ''}`} />
                </button>

                {showTagDropdown && (
                  <div 
                    className="absolute z-10 w-full mt-1 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg shadow-lg"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {/* 검색 입력창 */}
                    <div className="p-3 border-b border-slate-200 dark:border-slate-700">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                          type="text"
                          placeholder="프로젝트 태그 검색..."
                          value={tagSearchQuery}
                          onChange={(e) => setTagSearchQuery(e.target.value)}
                          className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-slate-900 dark:text-white text-sm"
                          autoFocus
                        />
                      </div>
                    </div>
                    
                    {/* 태그 목록 */}
                    <div className="max-h-48 overflow-y-auto">
                      {filteredTags.length > 0 ? (
                        filteredTags.map((tag) => {
                          const isSelected = selectedTags.some(t => t.id === tag.id);
                          return (
                            <button
                              key={`dropdown-${tag.id}`}
                              type="button"
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                toggleTag(tag);
                              }}
                              className={`w-full px-4 py-3 text-left hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors flex items-center justify-between ${
                                isSelected ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                              }`}
                            >
                              <div className="flex items-center space-x-3">
                                <div 
                                  className="w-3 h-3 rounded-full"
                                  style={{ backgroundColor: tag.color }}
                                ></div>
                                <span className="text-sm text-slate-700 dark:text-slate-300">
                                  {tag.name}
                                </span>
                              </div>
                              {isSelected && (
                                <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                              )}
                            </button>
                          );
                        })
                      ) : (
                        <div className="px-4 py-3 text-sm text-slate-500 dark:text-slate-400 text-center">
                          검색 결과가 없습니다.
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* 선택된 태그들 표시 */}
              {selectedTags.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-3">
                  {selectedTags.map((tag, index) => (
                    <span 
                      key={`selected-${tag.id}-${index}`} 
                      className="inline-flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium text-white"
                      style={{ backgroundColor: tag.color || '#3b82f6' }}
                    >
                      <span>{tag.name}</span>
                      <button
                        onClick={() => toggleTag(tag)}
                        className="text-white/80 hover:text-white"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* 날짜 정보 */}
            <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 p-6">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">프로젝트 기간</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    시작일 *
                  </label>
                  <input
                    type="date"
                    value={formData.start_date}
                    onChange={(e) => setFormData(prev => ({ ...prev, start_date: e.target.value }))}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    종료일 {!formData.is_ongoing && '*'}
                  </label>
                  <input
                    type="date"
                    value={formData.end_date}
                    onChange={(e) => setFormData(prev => ({ ...prev, end_date: e.target.value }))}
                    disabled={formData.is_ongoing}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 하단 저장 버튼 */}
        <div className="mt-8 flex justify-end space-x-4">
          <Link
            href="/admin/projects"
            className="px-6 py-3 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
          >
            취소
          </Link>
          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="flex items-center space-x-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Save className="w-5 h-5" />
            <span>
              {isSubmitting 
                ? '저장 중...' 
                : formData.is_published 
                  ? '공개로 저장' 
                  : '비공개로 저장'
              }
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}

export default function EditProject() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-slate-600 dark:text-slate-400">프로젝트 정보를 불러오는 중...</p>
          </div>
        </div>
      </div>
    }>
      <EditProjectContent />
    </Suspense>
  );
}
