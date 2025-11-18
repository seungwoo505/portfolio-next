"use client";

import Link from "next/link";

import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { useRouter } from 'next/navigation';

import dynamic from 'next/dynamic';
import { 
  Save,
  X,
  Plus,
  Search,
  Tag
} from 'lucide-react';
import { authApi } from '@/lib/api';

// 마크다운 에디터 동적 import
const MDEditor = dynamic(
  () => import('@uiw/react-md-editor'),
  { ssr: false }
);

interface PostForm {
  title: string;
  content: string;
  excerpt: string;
  slug: string;
  meta_description: string;
  meta_keywords: string;
  featured_image: string;
  is_published: boolean;
  is_featured: boolean;
  tags: string[];
}

interface AvailableTag {
  id: string;
  name: string;
  color: string;
}

export default function NewBlogPost() {
  // 다크 모드 상태 감지
  const [isDarkMode, setIsDarkMode] = useState(false);
  
  useEffect(() => {
    const checkDarkMode = () => {
      setIsDarkMode(document.documentElement.classList.contains('dark'));
    };
    
    checkDarkMode();
    
    // 다크 모드 변경 감지
    const observer = new MutationObserver(checkDarkMode);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class']
    });
    
    return () => observer.disconnect();
  }, []);

  const [formData, setFormData] = useState<PostForm>({
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
  const [availableTags, setAvailableTags] = useState<AvailableTag[]>([]);
  const [selectedTags, setSelectedTags] = useState<AvailableTag[]>([]);
  const [showTagDropdown, setShowTagDropdown] = useState(false);
  const [tagSearchQuery, setTagSearchQuery] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const router = useRouter();

  // 제목 기반 슬러그 생성
  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9가-힣\s-]/g, '') // 한글, 영문, 숫자, 공백, 하이픈만 허용
      .replace(/\s+/g, '-') // 공백을 하이픈으로 변환
      .replace(/-+/g, '-') // 연속된 하이픈을 하나로
      .replace(/^-+|-+$/g, ''); // 앞뒤 하이픈 제거
  };

  // AI 요약 전에 __projectName__ 형식을 실제 프로젝트명으로 변환
  const preprocessContentForAI = (content: string): string => {
    return content.replace(/__([^_]+)__/g, (match, projectName) => {
      return `${projectName} 프로젝트`;
    });
  };

  // 태그 선택/해제
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

  const filteredTags = availableTags.filter(tag =>
    tag.name.toLowerCase().includes(tagSearchQuery.toLowerCase())
  );

  // 드롭다운 외부 클릭 시 닫기
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (showTagDropdown && !target.closest('.tag-dropdown-container')) {
        setShowTagDropdown(false);
        setTagSearchQuery('');
      }
    };

    if (showTagDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showTagDropdown]);



  // Gemini AI 기반 요약 생성
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
      // console.error 제거됨
      toast.error('AI 요약 생성에 실패했습니다. 수동으로 입력해주세요.');
      return '';
    }
  };

  // Gemini AI 기반 키워드 생성
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
      // console.error 제거됨
      toast.error('AI 키워드 생성에 실패했습니다. 수동으로 입력해주세요.');
      return '';
    }
  };

  // SEO 메타 설명 자동 생성 (기존 방식)
  const generateMetaDescription = (excerpt: string, content: string) => {
    if (excerpt.trim()) {
      return excerpt.substring(0, 160);
    }
    // 내용에서 첫 번째 문단 추출
    const firstParagraph = content.split('\n').find(line => line.trim().length > 0)?.trim() || '';
    return firstParagraph.substring(0, 160);
  };

  // 제목 변경 시 슬러그 자동 업데이트
  const handleTitleChange = (title: string) => {
    setFormData(prev => ({
      ...prev,
      title,
      slug: generateSlug(title)
    }));
  };

  // 내용 변경 시 메타 설명 자동 생성
  const handleContentChange = (content: string) => {
    setFormData(prev => ({
      ...prev,
      content,
      meta_description: prev.meta_description || generateMetaDescription(prev.excerpt, content)
    }));
  };


  // 사용 가능한 태그 목록 불러오기 (통합 태그 API 사용)
  const fetchAvailableTags = async () => {
    try {
      const response = await authApi.get('/admin/tags');
      if (response.success && response.data) {
        // 블로그와 일반 타입 태그만 필터링
        const tagsData = response.data as Array<{ type?: string; id: string | number; name: string; color?: string }>;
        const filteredData = tagsData.filter((t: { type?: string }) => 
          t.type === 'blog' || t.type === 'general'
        );
        const mapped = filteredData.map((t: { id: string | number; name: string; color?: string }) => ({
          id: String(t.id),
          name: t.name,
          color: t.color || '#6B7280',
        }));
        setAvailableTags(mapped);
      }
    } catch {
      // console.error 제거됨
    }
  };

  // 드롭다운 열릴 때 검색어 초기화
  useEffect(() => {
    if (showTagDropdown) {
      setTagSearchQuery('');
    }
  }, [showTagDropdown]);

  // 이미지 업로드 핸들러
  const handleImageUpload = async (file: File): Promise<string> => {
    try {
      // 파일 크기 제한 (5MB)
      if (file.size > 5 * 1024 * 1024) {
        throw new Error('파일 크기는 5MB 이하여야 합니다.');
      }

      // 허용된 이미지 형식 체크
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
      if (!allowedTypes.includes(file.type)) {
        throw new Error('지원되지 않는 이미지 형식입니다.');
      }

      const formData = new FormData();
      formData.append('image', file);

      // 실제 서버에 이미지 업로드
      try {
        const response = await authApi.uploadImage(file);
        
        
        if (response.success && response.data?.url) {
          return response.data.url;
        } else {
          throw new Error(response.message || '서버에서 올바른 응답을 받지 못했습니다.');
        }
      } catch {
        // console.warn 제거됨
        
        // 서버 업로드가 실패하면 임시 Object URL 사용
        // const _fileName = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
        
        // Object URL 생성하고 나중에 해제되지 않도록 관리
        const objectUrl = URL.createObjectURL(file);
        
        // 임시 해결책: 일정 시간 후에 URL 해제 방지
        // 실제로는 서버 업로드가 우선이므로 이 코드는 fallback용
        
        return objectUrl;
      }
      
    } catch {
      // 이미지 업로드 실패
      throw new Error('이미지 업로드에 실패했습니다.');
    }
  };



  // 컴포넌트 마운트 시 태그 목록 불러오기
  useEffect(() => {
    fetchAvailableTags();
  }, []);

  // 저장 (초안 또는 발행)
  const handleSubmit = async (publish: boolean = false) => {
    if (!formData.title.trim() || !formData.content.trim()) {
      toast.error('제목과 내용은 필수입니다.');
      return;
    }

    setIsSubmitting(true);
    try {
      // undefined 값들을 null로 변환하거나 기본값 설정
      const postData = {
        title: formData.title || '',
        slug: formData.slug || '',
        content: formData.content || '',
        excerpt: formData.excerpt || '',
        featured_image: formData.featured_image || null,
        meta_title: formData.title || '', // meta_title이 없으면 title 사용
        meta_description: formData.meta_description || '',
        meta_keywords: formData.meta_keywords || '',
        is_published: publish,
        is_featured: formData.is_featured,
        tags: selectedTags.map(tag => tag.name), // 선택된 태그들을 배열로
        category_id: null, // 기본값
        reading_time: null, // 기본값
        author_id: null, // 기본값 (서버에서 JWT에서 추출할 수 있음)
        published_at: publish ? new Date().toISOString() : null
      };


      const response = await authApi.post('/blog/posts', postData);
      
      if (response.success) {
        toast.success(publish ? '포스트가 발행되었습니다!' : '포스트가 저장되었습니다!');
        router.push('/admin/blog');
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      toast.error('저장 중 오류가 발생했습니다: ' + message);
    } finally {
      setIsSubmitting(false);
    }
  };



  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">


      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* 메인 에디터 */}
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
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-slate-900 dark:text-white text-lg font-medium"
                  placeholder="포스트 제목을 입력하세요..."
                />
              </div>

              {/* 슬러그 */}
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

              {/* 요약 */}
            </div>

            {/* 내용 */}
            <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 p-6">
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
                    // 업로드 중 표시를 위한 로딩 텍스트 추가
                    const loadingText = `\n\n업로드 중... (${imageFiles.length}개 파일)\n\n`;
                    const contentWithLoading = formData.content + loadingText;
                    handleContentChange(contentWithLoading);
                    
                    try {
                      let uploadedImages = '';
                      for (const file of imageFiles) {
                        const url = await handleImageUpload(file);
                        
                        // GitHub 스타일 이미지 마크다운 생성
                        let altText = 'image';
                        
                        // 파일명에서 의미있는 설명 추출 (선택적)
                        const baseName = file.name.replace(/\.[^/.]+$/, ''); // 확장자 제거
                        if (baseName.length > 0 && baseName.length <= 30) {
                          // 파일명이 적당한 길이면 사용
                          altText = baseName;
                        }
                        
                        const imageMarkdown = `![${altText}](${url})\n\n`;
                        uploadedImages += imageMarkdown;
                      }
                      
                      // 로딩 텍스트를 실제 이미지 마크다운으로 교체
                      // 현재 상태를 다시 가져와서 최신 내용 반영
                      const currentContent = contentWithLoading; // 로딩 텍스트가 포함된 최신 내용
                      const newContent = currentContent.replace(loadingText, '\n\n' + uploadedImages);
                      
                      // 즉시 업데이트 (지연 제거)
                      handleContentChange(newContent);
                      
                    } catch {
                      // 로딩 텍스트 제거
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
                    
                    // 업로드 중 표시
                    const loadingText = `\n\n이미지 업로드 중...\n\n`;
                    const contentWithLoading = formData.content + loadingText;
                    handleContentChange(contentWithLoading);
                    
                    try {
                      let uploadedImages = '';
                      for (const item of imageItems) {
                        const file = item.getAsFile();
                        if (file) {
                          const url = await handleImageUpload(file);
                          
                          // GitHub 스타일 이미지 마크다운 (붙여넣기는 기본적으로 "image")
                          const imageMarkdown = `![image](${url})\n\n`;
                          uploadedImages += imageMarkdown;
                        }
                      }
                      
                      // 로딩 텍스트를 실제 이미지 마크다운으로 교체
                      // 현재 상태를 다시 가져와서 최신 내용 반영
                      const currentContent = contentWithLoading; // 로딩 텍스트가 포함된 최신 내용
                      const newContent = currentContent.replace(loadingText, '\n\n' + uploadedImages);
                      
                      // 즉시 업데이트 (지연 제거)
                      handleContentChange(newContent);
                      
                    } catch {
                      // 로딩 텍스트 제거
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

          {/* 사이드바 */}
          <div className="space-y-6">
            {/* 공개 설정 */}
            <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 p-6">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">공개 설정</h3>
              
              <div className="space-y-4">
                {/* 공개/비공개 */}
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
                  
                  {/* 토글 스위치 */}
                  <button
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, is_published: !prev.is_published }))}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                      formData.is_published 
                        ? 'toggle-bg-on' 
                        : 'toggle-bg-off'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        formData.is_published ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>

                {/* 추천 설정 */}
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
                  
                  {/* 토글 스위치 */}
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

            {/* 태그 */}
            <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white">태그 선택</h3>
                <Link 
                  href="/admin/tags?type=blog" 
                  className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-200 flex items-center space-x-1"
                >
                  <Tag className="w-3 h-3" />
                  <span>태그 관리</span>
                </Link>
              </div>
              
              <div className="space-y-4">
                {/* 선택된 태그들 */}
                {selectedTags.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {selectedTags.map((tag) => (
                      <span 
                        key={tag.id} 
                        className="inline-flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium text-white"
                        style={{ backgroundColor: tag.color || '#3b82f6' }}
                      >
                        <span>{tag.name}</span>
                        <button
                          onClick={() => toggleTag(tag)}
                          className="text-white/80 hover:text-white"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}

                {/* 태그 선택 드롭다운 */}
                <div className="relative tag-dropdown-container">
                  <button
                    type="button"
                    onClick={() => setShowTagDropdown(!showTagDropdown)}
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-slate-900 dark:text-white text-left flex items-center justify-between"
                  >
                    <span>블로그 태그 선택...</span>
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
                            placeholder="블로그 태그 검색..."
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
                                key={tag.id}
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
                                    style={{ backgroundColor: tag.color || '#3b82f6' }}
                                  ></div>
                                  <span className="text-slate-900 dark:text-white">{tag.name}</span>
                                </div>
                                {isSelected && (
                                  <span className="text-blue-600 dark:text-blue-400">✓</span>
                                )}
                              </button>
                            );
                          })
                        ) : (
                          <div className="px-4 py-8 text-center text-slate-500 dark:text-slate-400">
                            {tagSearchQuery ? (
                              <div>
                                <p>&apos;{tagSearchQuery}&apos;에 대한 검색 결과가 없습니다.</p>
                                <p className="text-sm mt-2">다른 검색어를 시도해보세요.</p>
                              </div>
                            ) : (
                              <div>
                                <p>사용 가능한 블로그 태그가 없습니다.</p>
                                <p className="text-sm mt-2">태그 관리에서 먼저 블로그 태그를 생성해주세요.</p>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>


              </div>
            </div>

            {/* 포스트 요약 및 설정 */}
            <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white">포스트 설정</h3>
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
                      // console.error 제거됨
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
                      disabled={formData.content.trim().length === 0}
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

        {/* 하단 저장 버튼 */}
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
