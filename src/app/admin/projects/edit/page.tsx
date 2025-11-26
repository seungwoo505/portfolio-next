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
import { AdminProjectForm, AdminTagOption } from '@/types';
const MDEditor = dynamic(
  () => import('@uiw/react-md-editor'),
  { ssr: false }
);
/**
 * @description 기존 프로젝트를 수정하기 위한 폼 콘텐츠입니다.
 * @returns {JSX.Element} 프로젝트 수정 폼 컴포넌트.
 */
function EditProjectContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const projectSlug = searchParams.get('slug');
  const [formData, setFormData] = useState<AdminProjectForm>({
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
  const [availableTags, setAvailableTags] = useState<AdminTagOption[]>([]);
  const [selectedTags, setSelectedTags] = useState<AdminTagOption[]>([]);
  const [showTagDropdown, setShowTagDropdown] = useState(false);
  const [tagSearchQuery, setTagSearchQuery] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isDarkMode, setIsDarkMode] = useState(false);
  /**
   * @description AI 요약/키워드 생성을 위해 콘텐츠를 전처리합니다.
   * @param {string} content 원본 콘텐츠.
   * @returns {string} 전처리된 콘텐츠.
   */
  const preprocessContentForAI = (content: string) => {
    return content
      .replace(/__projectName__/g, formData.title || '프로젝트')
      .replace(/#{1,6}\s+/g, '') 
      .replace(/\*\*(.*?)\*\*/g, '$1') 
      .replace(/\*(.*?)\*/g, '$1') 
      .replace(/`(.*?)`/g, '$1') 
      .replace(/```[\s\S]*?```/g, '') 
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') 
      .replace(/!\[([^\]]*)\]\([^)]+\)/g, '') 
      .replace(/\n+/g, ' ') 
      .trim();
  };
  /**
   * @description AI를 사용해 프로젝트 요약을 생성합니다.
   * @param {string} content 요약할 콘텐츠.
   * @returns {Promise<string>} 생성된 요약.
   */
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
  /**
   * @description AI를 사용해 프로젝트 키워드를 추출합니다.
   * @param {string} content 키워드를 추출할 콘텐츠.
   * @returns {Promise<string>} 추출된 키워드.
   */
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
  useEffect(() => {
    /**
     * @description 현재 다크 모드 여부를 감지합니다.
     * @returns {void}
     */
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
  useEffect(() => {
    /**
     * @description 슬러그를 기반으로 편집할 프로젝트를 불러옵니다.
     * @returns {Promise<void>}
     */
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
        toast.error('프로젝트를 불러오는데 실패했습니다.');
        router.push('/admin/projects');
      } finally {
        setIsLoading(false);
      }
    };
    loadProject();
  }, [projectSlug, router]);
  useEffect(() => {
    /**
     * @description 프로젝트에 사용할 태그 목록을 불러옵니다.
     * @returns {Promise<void>}
     */
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
      }
    };
    fetchTags();
  }, []);
  const filteredTags = availableTags.filter(tag =>
    tag.name.toLowerCase().includes(tagSearchQuery.toLowerCase())
  );
  useEffect(() => {
    /**
     * @description 태그 드롭다운 외부 클릭을 감지해 닫습니다.
     * @param {MouseEvent} event 마우스 이벤트.
     * @returns {void}
     */
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
  /**
   * @description 제목을 기반으로 슬러그를 생성합니다.
   * @param {string} title 프로젝트 제목.
   * @returns {string} 생성된 슬러그.
   */
  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9가-힣\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
  };
  /**
   * @description 제목 변경 시 슬러그를 함께 업데이트합니다.
   * @param {string} title 새 제목.
   * @returns {void}
   */
  const handleTitleChange = (title: string) => {
    setFormData(prev => ({
      ...prev,
      title,
      slug: generateSlug(title)
    }));
  };
  /**
   * @description 태그 선택 여부를 토글합니다.
   * @param {AdminTagOption} tag 선택하거나 해제할 태그.
   * @returns {void}
   */
  const toggleTag = (tag: AdminTagOption) => {
    setSelectedTags(prev => {
      const isSelected = prev.some(t => t.id === tag.id);
      if (isSelected) {
        return prev.filter(t => t.id !== tag.id);
      } else {
        return [...prev, tag];
      }
    });
  };
  /**
   * @description 폼을 검증하고 프로젝트 업데이트를 요청합니다.
   * @returns {Promise<void>}
   */
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
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 p-6">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">기본 정보</h2>
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
          <div className="space-y-6">
            <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 p-6">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">공개 설정</h3>
              <div className="space-y-4">
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
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                      진행 중 프로젝트
                    </span>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                      현재 진행 중인 프로젝트인지 설정합니다.
                    </p>
                  </div>
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
                        meta_description: value 
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
/**
 * @description 프로젝트 수정 페이지를 렌더링합니다.
 * @returns {JSX.Element} 프로젝트 수정 페이지.
 */
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
