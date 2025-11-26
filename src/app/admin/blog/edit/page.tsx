"use client";
import Link from "next/link";
import { Suspense } from "react";
import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { useRouter, useSearchParams } from 'next/navigation';
import dynamic from 'next/dynamic';
import {
  ArrowLeft,
  Save,
  X,
  Search,
  Tag
} from 'lucide-react';
import { authApi } from '@/lib/api';
import { AdminBlogPostForm, AdminTagOption } from '@/types';
const MDEditor = dynamic(
  () => import('@uiw/react-md-editor'),
  { ssr: false }
);
/**
 * @description 기존 블로그 포스트를 수정하기 위한 폼 콘텐츠입니다.
 * @returns {JSX.Element} 블로그 수정 폼 컴포넌트.
 */
function EditBlogPostContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const postSlug = searchParams.get('slug');
  const [isDarkMode, setIsDarkMode] = useState(false);
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
  const [formData, setFormData] = useState<AdminBlogPostForm>({
    title: '',
    content: '',
    excerpt: '',
    slug: '',
    meta_description: '',
    meta_keywords: '',
    featured_image: '',
    is_published: false,
    is_featured: false,
    tags: []
  });
  const [availableTags, setAvailableTags] = useState<AdminTagOption[]>([]);
  const [selectedTags, setSelectedTags] = useState<AdminTagOption[]>([]);
  const [showTagDropdown, setShowTagDropdown] = useState(false);
  const [tagSearchQuery, setTagSearchQuery] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const preprocessContentForAI = (content: string): string => {
    return content.replace(/__([^_]+)__/g, (match, projectName) => {
      return `${projectName} 프로젝트`;
    });
  };
  /**
   * @description AI를 사용해 포스트 요약을 생성합니다.
   * @param {string} content 요약할 콘텐츠.
   * @returns {Promise<string>} 생성된 요약.
   */
  const generateAISummary = async (content: string) => {
    if (!content.trim()) {
      toast.error('요약할 내용이 없습니다. 먼저 포스트 내용을 작성해주세요.');
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
   * @description AI를 사용해 포스트 키워드를 추출합니다.
   * @param {string} content 키워드를 추출할 콘텐츠.
   * @returns {Promise<string>} 추출된 키워드.
   */
  const generateAIKeywords = async (content: string) => {
    if (!content.trim()) {
      toast.error('키워드를 추출할 내용이 없습니다. 먼저 포스트 내용을 작성해주세요.');
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
     * @description 슬러그를 기반으로 편집할 포스트를 불러옵니다.
     * @returns {Promise<void>}
     */
    const loadPost = async () => {
      if (!postSlug) {
        toast.error('포스트 슬러그가 필요합니다.');
        setIsLoading(false);
        return;
      }
      try {
        setIsLoading(true);
        const response = await authApi.get(`/admin/blog/posts/slug/${postSlug}`);
        if (response.success && response.data) {
          const post = response.data as {
            id: string;
            title: string;
            content: string;
            excerpt: string;
            slug: string;
            meta_description: string;
            meta_keywords: string;
            featured_image: string;
            is_published: boolean;
            featured: boolean;
            tags: { id: string; name: string; color?: string; type?: string }[];
          };
          setFormData({
            title: post.title || '',
            content: post.content || '',
            excerpt: post.excerpt || '',
            slug: post.slug || '',
            meta_description: post.meta_description || '',
            meta_keywords: post.meta_keywords || '',
            featured_image: post.featured_image || '',
            is_published: post.is_published || false,
            is_featured: Boolean(post.featured),
            tags: []
          });
          if (post.tags) {
            const postTags = Array.isArray(post.tags) ? post.tags : [];
            const formattedTags = postTags.map((tag: { id: string | number; name: string; color?: string }) => ({
              id: String(tag.id), 
              name: tag.name,
              color: tag.color || '#6B7280',
            }));
            const uniqueTags = formattedTags.filter((tag, index, self) =>
              index === self.findIndex(t => t.id === tag.id)
            );
            setSelectedTags(uniqueTags);
          } else {
            setSelectedTags([]);
          }
        }
      } catch {
        toast.error('포스트를 불러오는데 실패했습니다.');
        router.push('/admin/blog');
      } finally {
        setIsLoading(false);
      }
    };
    loadPost();
  }, [postSlug, router]);
  useEffect(() => {
    /**
     * @description 블로그 포스트에 사용할 수 있는 태그를 불러옵니다.
     * @returns {Promise<void>}
     */
    const fetchTags = async () => {
      try {
        const response = await authApi.get('/admin/tags');
        if (response.success && response.data) {
          const tagsData = response.data as Array<{ type?: string; id: string | number; name: string; color?: string }>;
          const filteredData = tagsData.filter(
            (t: { type?: string }) => t.type === 'blog' || t.type === 'general'
          );
          const mapped = filteredData.map((t: { id: string | number; name: string; color?: string }) => ({
            id: String(t.id),
            name: t.name,
            color: t.color || '#6B7280',
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
  useEffect(() => {
    if (showTagDropdown) {
      setTagSearchQuery('');
    }
  }, [showTagDropdown]);
  /**
   * @description 제목을 기반으로 슬러그를 생성합니다.
   * @param {string} title 포스트 제목.
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
   * @description 본문 내용 변경 시 상태를 업데이트합니다.
   * @param {string} content 새 본문 내용.
   * @returns {void}
   */
  const handleContentChange = (content: string) => {
    setFormData(prev => ({ ...prev, content }));
  };
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
  const handleImageUpload = async (file: File): Promise<string> => {
    try {
      if (file.size > 5 * 1024 * 1024) {
        throw new Error('파일 크기는 5MB 이하여야 합니다.');
      }
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
      if (!allowedTypes.includes(file.type)) {
        throw new Error('지원되지 않는 이미지 형식입니다.');
      }
      try {
        const response = await authApi.uploadImage(file);
        if (response.success && response.data?.url) {
          return response.data.url;
        } else {
          throw new Error(response.message || '서버에서 올바른 응답을 받지 못했습니다.');
        }
      } catch {
        const objectUrl = URL.createObjectURL(file);
        return objectUrl;
      }
    } catch {
      throw new Error('이미지 업로드에 실패했습니다.');
    }
  };
  /**
   * @description 폼을 검증하고 포스트 수정을 저장합니다.
   * @param {boolean} publish 저장 후 즉시 발행할지 여부.
   * @returns {Promise<void>}
   */
  const handleSubmit = async (publish: boolean) => {
    if (!formData.title.trim() || !formData.content.trim()) {
      toast.error('제목과 내용을 입력해주세요.');
      return;
    }
    if (!postSlug) {
      toast.error('포스트 슬러그가 필요합니다.');
      return;
    }
    setIsSubmitting(true);
    try {
      const postData = {
        title: formData.title || '',
        slug: formData.slug || '',
        content: formData.content || '',
        excerpt: formData.excerpt || '',
        featured_image: formData.featured_image || null,
        meta_title: formData.title || '', 
        meta_description: formData.meta_description || '',
        meta_keywords: formData.meta_keywords || '',
        is_published: publish,
        is_featured: formData.is_featured || false, 
        tags: selectedTags.map(tag => tag.name), 
        category_id: null, 
        reading_time: null, 
        author_id: null, 
        published_at: publish ? new Date().toISOString() : null
      };
      const response = await authApi.put(`/admin/blog/posts/slug/${postSlug}`, postData);
      if (response.success) {
        toast.success(publish ? '포스트가 발행되었습니다!' : '포스트가 저장되었습니다!');
        router.push('/admin/blog');
      }
    } catch {
      toast.error('포스트 수정에 실패했습니다.');
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
  if (!postSlug) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">포스트 ID가 필요합니다</h1>
            <p className="text-slate-600 dark:text-slate-400 mb-8">URL에 포스트 ID가 포함되어야 합니다.</p>
            <Link href="/admin/blog" className="inline-flex items-center space-x-2 text-blue-600 dark:text-blue-400 hover:underline font-medium">
              <ArrowLeft className="w-4 h-4" />
              <span>블로그 목록으로 돌아가기</span>
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
                  placeholder="포스트 제목을 입력하세요"
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  슬러그 (URL)
                </label>
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-slate-500 dark:text-slate-400">/blog/</span>
                  <input
                    type="text"
                    value={formData.slug}
                    onChange={(e) => setFormData(prev => ({ ...prev, slug: e.target.value }))}
                    className="flex-1 px-3 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-slate-900 dark:text-white"
                    placeholder="post-slug"
                  />
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  제목 입력 시 자동으로 생성됩니다. 필요시 수동으로 편집할 수 있습니다.
                </p>
              </div>
            </div>
            <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 p-6">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">내용 작성</h2>
              <div className="mb-4">
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  내용 *
                </label>
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">
                  마크다운 문법을 사용하여 포스트를 작성하세요. 이미지는 드래그앤드롭하거나 클립보드에서 붙여넣기(Ctrl+V)로 업로드할 수 있습니다.
                </p>
              </div>
              <div data-color-mode={isDarkMode ? 'dark' : 'light'}>
                <MDEditor
                  value={formData.content}
                  onChange={(val) => handleContentChange(val || '')}
                  height={500}
                  preview="edit"
                  hideToolbar={false}
                  visibleDragbar={false}
                  onDrop={async (event) => {
                    event.preventDefault();
                    const files = Array.from(event.dataTransfer.files);
                    const imageFiles = files.filter(file => file.type.startsWith('image/'));
                    if (imageFiles.length > 0) {
                      const loadingText = `\n\n업로드 중... (${imageFiles.length}개 파일)\n\n`;
                      const contentWithLoading = formData.content + loadingText;
                      handleContentChange(contentWithLoading);
                      try {
                        let uploadedImages = '';
                        for (const file of imageFiles) {
                          const url = await handleImageUpload(file);
                          let altText = 'image';
                          const baseName = file.name.replace(/\.[^/.]+$/, '');
                          if (baseName.length > 0 && baseName.length <= 30) {
                            altText = baseName;
                          }
                          const imageMarkdown = `![${altText}](${url})\n\n`;
                          uploadedImages += imageMarkdown;
                        }
                        const currentContent = contentWithLoading; 
                        const newContent = currentContent.replace(loadingText, '\n\n' + uploadedImages);
                        handleContentChange(newContent);
                      } catch {
                        const newContent = contentWithLoading.replace(loadingText, '');
                        handleContentChange(newContent);
                        toast.error('이미지 업로드에 실패했습니다.');
                      }
                    }
                  }}
                  onPaste={async (event) => {
                    const items = Array.from(event.clipboardData.items);
                    const imageItems = items.filter(item => item.type.startsWith('image/'));
                    if (imageItems.length > 0) {
                      event.preventDefault();
                      const loadingText = `\n\n이미지 업로드 중...\n\n`;
                      const contentWithLoading = formData.content + loadingText;
                      handleContentChange(contentWithLoading);
                      try {
                        let uploadedImages = '';
                        for (const item of imageItems) {
                          const file = item.getAsFile();
                          if (file) {
                            const url = await handleImageUpload(file);
                            const imageMarkdown = `![image](${url})\n\n`;
                            uploadedImages += imageMarkdown;
                          }
                        }
                        const currentContent = contentWithLoading; 
                        const newContent = currentContent.replace(loadingText, '\n\n' + uploadedImages);
                        handleContentChange(newContent);
                      } catch {
                        const newContent = contentWithLoading.replace(loadingText, '');
                        handleContentChange(newContent);
                        toast.error('이미지 업로드에 실패했습니다.');
                      }
                    }
                  }}
                />
              </div>
            </div>
          </div>
          <div className="space-y-6">
            <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 p-6">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">공개 설정</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                      {formData.is_published ? '공개' : '비공개'}
                    </span>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                      {formData.is_published
                        ? '포스트가 즉시 공개됩니다.'
                        : '비공개로 저장됩니다.'
                      }
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, is_published: !prev.is_published }))}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${formData.is_published
                        ? 'toggle-bg-on'
                        : 'toggle-bg-off'
                      }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${formData.is_published ? 'translate-x-6' : 'translate-x-1'
                        }`}
                    />
                  </button>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                      {formData.is_featured ? '추천' : '일반'}
                    </span>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                      {formData.is_featured
                        ? '메인 페이지에 표시됩니다.'
                        : '일반 포스트로 저장됩니다.'
                      }
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, is_featured: !prev.is_featured }))}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-offset-2 ${
                      formData.is_featured 
                        ? 'bg-yellow-500' 
                        : 'bg-slate-200 dark:bg-slate-600'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        formData.is_featured ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
              </div>
            </div>
            <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                  태그 선택
                </h3>
                <Link
                  href="/admin/tags?type=blog"
                  className="text-blue-600 dark:text-blue-400 hover:text-blue-900 dark:hover:text-blue-300 text-sm flex items-center space-x-1"
                >
                  <Tag className="w-4 h-4" />
                  <span>태그 관리</span>
                </Link>
              </div>
              <div className="tag-dropdown relative">
                <div
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg cursor-pointer bg-white dark:bg-slate-700 min-h-[42px] flex items-center"
                  onClick={() => setShowTagDropdown(!showTagDropdown)}
                >
                  <Search className="w-4 h-4 text-slate-400 mr-2" />
                  <span className="text-slate-500 dark:text-slate-400 text-sm">
                    태그 검색 및 선택...
                  </span>
                </div>
                {showTagDropdown && (
                  <div className="absolute z-50 w-full mt-1 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                    <div className="p-2 border-b border-slate-200 dark:border-slate-600">
                      <input
                        type="text"
                        value={tagSearchQuery}
                        onChange={(e) => setTagSearchQuery(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
                        placeholder="태그 검색..."
                        autoFocus
                      />
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
                              className={`w-full px-4 py-3 text-left hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors flex items-center justify-between ${isSelected ? 'bg-blue-50 dark:bg-blue-900/20' : ''
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
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">포스트 설정</h3>
                <button
                  type="button"
                  onClick={async () => {
                    try {
                      const preprocessedContent = preprocessContentForAI(formData.content);
                      const response = await authApi.generateSummary(preprocessedContent, true);
                      if (response.success && response.data) {
                        const data = response.data;
                        setFormData(prev => ({
                          ...prev,
                          excerpt: data.summary || '',
                          meta_description: data.summary || '',
                          meta_keywords: data.keywordsString || ''
                        }));
                      }
                    } catch {
                      toast.error('AI 요약 & 키워드 생성에 실패했습니다.');
                    }
                  }}
                  className="text-sm text-green-600 dark:text-green-400 hover:text-green-800 dark:hover:text-green-200 flex items-center space-x-2 px-3 py-2 border border-green-300 dark:border-green-600 rounded-lg hover:bg-green-50 dark:hover:bg-green-900/20 transition-colors"
                  disabled={!formData.content.trim()}
                >
                  <span>🚀</span>
                  <span>AI 요약 & 키워드 생성</span>
                </button>
              </div>
              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                      포스트 요약
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
                      disabled={!formData.content.trim()}
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
                    placeholder="포스트 요약을 입력하세요. (검색 엔진에도 사용됩니다)"
                  />
                  <div className="flex justify-between items-center mt-1">
                    <span className="text-xs text-slate-500 dark:text-slate-400">
                      블로그 목록과 검색 엔진에 표시됩니다.
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
                      disabled={!formData.content.trim()}
                    >
                      <span>🔍</span>
                      <span>AI 키워드</span>
                    </button>
                  </div>
                  <input
                    type="text"
                    value={formData.meta_keywords}
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
          </div>
        </div>
        <div className="mt-8 flex justify-end space-x-4">
          <Link
            href="/admin/blog"
            className="px-6 py-3 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
          >
            취소
          </Link>
          <button
            onClick={() => handleSubmit(formData.is_published)}
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
 * @description 블로그 포스트 수정 페이지를 렌더링합니다.
 * @returns {JSX.Element} 블로그 수정 페이지.
 */
export default function EditBlogPost() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-slate-600 dark:text-slate-400">블로그 포스트를 불러오는 중...</p>
          </div>
        </div>
      </div>
    }>
      <EditBlogPostContent />
    </Suspense>
  );
}
