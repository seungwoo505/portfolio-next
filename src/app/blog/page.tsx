"use client";
import Link from "next/link";


import { useState, useEffect, useMemo, useCallback } from "react";
import Head from "next/head";
import toast from "react-hot-toast";
import { blogApi } from "@/lib/api";
import { BlogPost, BlogTag } from "@/types";
import DynamicHead from "@/components/DynamicHead";
import ScrollProgress from "../../components/ScrollProgress";
import { api } from "@/lib/api";
import Pagination from "@/components/Pagination";

const POST_CARD_REVEAL_INTERVAL = 120;
const POSTS_PAGE_SIZE = 6;

export default function Blog() {
  const [blogPosts, setBlogPosts] = useState<BlogPost[]>([]);
  const [tags, setTags] = useState<BlogTag[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [sortOrder, setSortOrder] = useState<'published_at' | 'created_at' | 'title' | 'view_count'>('published_at');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalPosts, setTotalPosts] = useState(0);
  const [postRevealCount, setPostRevealCount] = useState(0);
  type SiteSettings = {
    site_title?: string;
    site_description?: string;
    contact_email?: string;
    search_enabled?: boolean;
    github_url?: string;
    linkedin_url?: string;
    twitter_url?: string;
    instagram_url?: string;
  };
  const [settings, setSettings] = useState<Partial<SiteSettings>>({});

  // 필터링된 포스트 목록 생성 (서버 사이드에서 처리되므로 클라이언트 사이드 필터링 제거)
  const filteredPosts = useMemo(() => {
    return blogPosts || [];
  }, [blogPosts]);

  const postSkeletonCount = useMemo(() => {
    if (filteredPosts.length > 0) {
      return filteredPosts.length;
    }

    if (totalPosts > 0) {
      return Math.max(Math.min(totalPosts, POSTS_PAGE_SIZE), 1);
    }

    return 1;
  }, [filteredPosts, totalPosts]);

  // 사이트 설정 가져오기
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const response = await api.get<{ data: SiteSettings }>('/settings');
        setSettings(response.data?.data ?? {});
      } catch {
        // 설정 로딩 실패 시 기본값 사용
      }
    };

    fetchSettings();
  }, []);

  // 데이터 가져오기
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // 서버 사이드 필터링 파라미터 구성
        const params: Record<string, string | number | boolean | string[]> = { 
          limit: 6, 
          page: currentPage,
          sort: sortOrder,
          order: 'desc'
        };
        
        // 검색어가 있으면 추가
        if (searchQuery.trim()) {
          params.search = searchQuery.trim();
        }
        
        // 선택된 태그가 있으면 추가
        if (selectedTags.length > 0) {
          params.tags = selectedTags;
        }
        
        const [postsResponse, tagsResponse] = await Promise.all([
          blogApi.getPosts(params),
          blogApi.getTags(true)
        ]);

        if (postsResponse.success && postsResponse.data) {
          type RawPost = BlogPost & { tags?: Array<string | BlogTag> };
          const postsWithTags: BlogPost[] = (postsResponse.data as RawPost[]).map((post) => {
            if (post.tags && Array.isArray(post.tags)) {
              const mappedTags: BlogTag[] = post.tags.map((tagItem) => {
                if (typeof tagItem === 'string') {
                  const foundTag = (tagsResponse.data ?? []).find((tag: BlogTag) => tag.name === tagItem);
                  return foundTag || { id: tagItem, name: tagItem, slug: tagItem } as BlogTag;
                }
                return tagItem;
              });
              return { ...post, tags: mappedTags } as BlogPost;
            }
            return post as BlogPost;
          });
          
          setBlogPosts(postsWithTags);
          
          // 페이지네이션 정보 업데이트
          if (postsResponse.pagination) {
            setTotalPages(postsResponse.pagination.totalPages || Math.ceil(postsResponse.pagination.total / 6));
            setTotalPosts(postsResponse.pagination.total);
          }
          
          setError(null);
        } else {
          setError('블로그 포스트를 불러올 수 없습니다.');
        }
        
        if (tagsResponse.success && tagsResponse.data) {
          // 블로그와 일반 타입 태그만 필터링
          const blogTags = tagsResponse.data.filter((tag: BlogTag) => 
            tag.type === 'blog' || tag.type === 'general'
          );
          setTags(blogTags);
        }
      } catch {
        setError('서버와의 연결에 문제가 발생했습니다.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [currentPage, searchQuery, selectedTags, sortOrder]);

  useEffect(() => {
    if (loading || filteredPosts.length === 0) {
      setPostRevealCount(0);
      return;
    }

    setPostRevealCount(0);
    const interval = window.setInterval(() => {
      setPostRevealCount((prev) => {
        const next = Math.min(prev + 1, filteredPosts.length);
        if (next === filteredPosts.length) {
          window.clearInterval(interval);
        }
        return next;
      });
    }, POST_CARD_REVEAL_INTERVAL);

    return () => window.clearInterval(interval);
  }, [loading, filteredPosts]);
 
  // 페이지 변경 핸들러
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    // 페이지 상단으로 스크롤
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // 검색 처리
  // 검색 핸들러 (서버 사이드 검색으로 변경, 최적화: useCallback 사용)
  const handleSearch = useCallback((query: string) => {
    setSearchQuery(query);
    setCurrentPage(1); // 검색 시 첫 페이지로 이동
    
    // 검색어가 있을 때 피드백 제공
    if (query.trim()) {
      toast.success(`"${query}" 검색 결과를 불러오는 중...`, {
        duration: 1500,
        icon: '🔍',
      });
    } else if (query === '') {
      toast('검색을 초기화했습니다.', {
        duration: 1500,
        icon: '✨',
      });
    }
  }, []);

  // 태그 필터링 (다중 선택, 최적화: useCallback 사용)
  const handleTagToggle = useCallback((tagSlug: string) => {
    setSelectedTags(prev => {
      const isCurrentlySelected = prev.includes(tagSlug);
      const newTags = isCurrentlySelected 
        ? prev.filter(slug => slug !== tagSlug)
        : [...prev, tagSlug];
      
      // 태그 선택/해제 피드백
      const tagName = tags.find(tag => tag.slug === tagSlug)?.name || tagSlug;
      if (isCurrentlySelected) {
        toast(`"${tagName}" 태그를 해제했습니다.`, {
          duration: 1500,
          icon: '🏷️',
        });
      } else {
        toast(`"${tagName}" 태그를 선택했습니다.`, {
          duration: 1500,
          icon: '🏷️',
        });
      }
      
      return newTags;
    });
    setSearchQuery('');
    setCurrentPage(1); // 태그 필터 시 첫 페이지로 이동
  }, [tags]); // tags 의존성 추가

  // 모든 태그 선택 해제 (최적화: useCallback 사용)
  const clearAllTags = useCallback(() => {
    setSelectedTags([]);
    setCurrentPage(1);
    toast('모든 태그 필터를 해제했습니다.', {
      duration: 1500,
      icon: '🧹',
    });
  }, []);

  const PostSkeletonCard = () => (
    <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm overflow-hidden border border-slate-200 dark:border-slate-700">
      <div className="p-6 animate-pulse">
        <div className="flex items-center justify-between mb-3">
          <div className="h-4 bg-slate-300 dark:bg-slate-600 rounded w-20" />
          <div className="h-4 bg-slate-300 dark:bg-slate-600 rounded w-12" />
        </div>
        <div className="h-6 bg-slate-300 dark:bg-slate-600 rounded mb-3" />
        <div className="space-y-2 mb-4">
          <div className="h-4 bg-slate-300 dark:bg-slate-600 rounded w-full" />
          <div className="h-4 bg-slate-300 dark:bg-slate-600 rounded w-2/3" />
        </div>
        <div className="flex gap-1 mb-4">
          <div className="h-5 bg-slate-300 dark:bg-slate-600 rounded w-12" />
          <div className="h-5 bg-slate-300 dark:bg-slate-600 rounded w-16" />
        </div>
        <div className="h-4 bg-slate-300 dark:bg-slate-600 rounded w-16" />
      </div>
    </div>
  );

  // const featuredPosts = blogPosts.filter((_, index) => index < 2);
  // const recentPosts = blogPosts.filter((_, index) => index >= 2);

  return (
    <>
      <Head>
        <title>블로그 | 포트폴리오</title>
        <meta name="description" content="웹 개발 기술 블로그입니다." />
        <meta name="keywords" content="웹개발, 블로그, 기술블로그" />
        <meta name="author" content="승우" />
        
        {/* Open Graph */}
        <meta property="og:type" content="website" />
        <meta property="og:title" content="블로그 | 승우의 포트폴리오" />
        <meta property="og:description" content="웹 개발자 승우의 기술 블로그입니다. React, Next.js, Node.js 등 웹 개발 관련 글들을 확인해보세요." />
        <meta property="og:url" content="https://seungwoo.i234.me/blog" />
        <meta property="og:image" content="https://seungwoo.i234.me/og-image.jpg" />
        <meta property="og:image:alt" content="승우의 개발 블로그" />
        <meta property="og:site_name" content="승우의 포트폴리오" />
        <meta property="og:locale" content="ko_KR" />
        
        {/* Twitter Cards */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="블로그 | 승우의 포트폴리오" />
        <meta name="twitter:description" content="웹 개발자 승우의 기술 블로그입니다. React, Next.js, Node.js 등 웹 개발 관련 글들을 확인해보세요." />
        <meta name="twitter:image" content="https://seungwoo.i234.me/og-image.jpg" />
        <meta name="twitter:creator" content="@seungwoo" />
        
        {/* Canonical URL */}
        <link rel="canonical" href="https://seungwoo.i234.me/blog" />
      </Head>
      <DynamicHead pageTitle="블로그" />
      <ScrollProgress />
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">


      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* Hero Section */}
        <section className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold text-slate-900 dark:text-white mb-6">
            개발 블로그
          </h1>
          <p className="text-xl text-slate-600 dark:text-slate-300 max-w-3xl mx-auto mb-8">
            웹 개발 경험과 새로운 기술에 대한 인사이트를 공유합니다
          </p>
          
          {/* Search and Filter */}
          {settings?.search_enabled !== false && (
            <div 
              className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-8"
            >
              <div className="relative">
                <input 
                  type="text" 
                  placeholder="포스트 검색..." 
                  value={searchQuery}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="w-full sm:w-80 px-4 py-2 pl-10 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                  aria-label="블로그 포스트 검색"
                />
                <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>
          )}
          
          {/* Categories */}
          <div 
            className="flex flex-wrap justify-center gap-2 mb-4"
          >
            <button
              onClick={clearAllTags}
              className={`px-4 py-2 text-sm border rounded-lg transition-colors ${
                selectedTags.length === 0
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700'
              }`}
            >
              모든 포스트
            </button>
            {tags.map((tag) => (
              <button
                key={tag.id}
                onClick={() => handleTagToggle(tag.slug)}
                className={`px-4 py-2 text-sm border rounded-lg transition-colors ${
                  selectedTags.includes(tag.slug)
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700'
                }`}
              >
                {tag.name} {tag.post_count && `(${tag.post_count})`}
              </button>
            ))}
          </div>

          
        </section>

        {/* Featured Posts */}
        {/* 포스트 목록 */}
        {loading ? (
          <section className="mb-16">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-8">
              포스트
            </h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from({ length: postSkeletonCount }).map((_, index) => (
                <PostSkeletonCard key={`blog-loading-${index}`} />
              ))}
            </div>
          </section>
        ) : error ? (
          <section className="mb-16">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-8">
              포스트
            </h2>
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">데이터를 불러올 수 없습니다</h3>
              <p className="text-slate-600 dark:text-slate-400 mb-4">{error}</p>
              <button 
                onClick={() => window.location.reload()} 
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
              >
                다시 시도
              </button>
            </div>
          </section>
        ) : (
          <section>
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
                포스트 ({filteredPosts.length}개)
              </h2>
              <select
                value={sortOrder}
                onChange={(e) => {
                  const newSortOrder = e.target.value as 'published_at' | 'created_at' | 'title' | 'view_count';
                  setSortOrder(newSortOrder);
                  
                  // 정렬 변경 피드백
                  const sortLabels = {
                    'published_at': '발행일순',
                    'created_at': '생성일순',
                    'title': '제목순',
                    'view_count': '조회수순'
                  };
                  toast(`${sortLabels[newSortOrder]}으로 정렬합니다.`, {
                    duration: 1500,
                    icon: '🔄',
                  });
                }}
                className="px-3 py-2 text-sm font-medium bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 hover:border-slate-300 dark:hover:border-slate-500"
              >
                <option value="published_at">발행일순</option>
                <option value="created_at">생성일순</option>
                <option value="title">제목순</option>
                <option value="view_count">조회수순</option>
              </select>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredPosts.length > 0 ? (
                filteredPosts.map((post, index) => {
                  const isRevealed = index < postRevealCount;
                  const baseClass = "bg-white dark:bg-slate-800 rounded-lg shadow-sm transition-all duration-300 overflow-hidden border border-slate-200 dark:border-slate-700 group";
                  const stateClass = isRevealed
                    ? "cursor-pointer transform hover:-translate-y-1 hover:scale-[1.02]"
                    : "cursor-default pointer-events-none";

                  return (
                    <article
                      key={post.id}
                      className={`${baseClass} ${stateClass}`}
                      onClick={isRevealed ? () => (window.location.href = `/blog/post?slug=${encodeURIComponent(post.slug)}`) : undefined}
                    >
                      {isRevealed ? (
                        <div className="p-6">
                          <div className="flex items-center justify-between text-sm text-slate-500 dark:text-slate-400 mb-3">
                            <time>{new Date(post.created_at).toLocaleDateString('ko-KR')}</time>
                          </div>

                          <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-3 line-clamp-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                            <Link
                              href={`/blog/post?slug=${post.slug}`}
                              onClick={(e) => e.stopPropagation()}
                            >
                              {post.title}
                            </Link>
                          </h3>

                          <p className="text-slate-600 dark:text-slate-300 mb-4 text-sm line-clamp-3">
                            {post.excerpt || post.content.substring(0, 120) + '...'}
                          </p>

                          <div className="flex flex-wrap gap-1 mb-4">
                            {post.tags && post.tags.length > 0 ? (
                              post.tags.slice(0, 3).map((tag) => (
                                <span key={`${post.id}-${tag.id}`} className="px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-xs rounded-full">
                                  {tag.name}
                                </span>
                              ))
                            ) : (
                              <span className="px-2 py-1 bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 text-xs rounded-full">
                                태그 없음
                              </span>
                            )}
                          </div>

                          <div className="flex items-center justify-between">
                            <Link
                              href={`/blog/post?slug=${post.slug}`}
                              className="inline-flex items-center text-blue-600 dark:text-blue-400 hover:underline text-sm font-medium"
                              onClick={(e) => e.stopPropagation()}
                            >
                              자세히 보기 →
                            </Link>
                            <span className="text-xs text-slate-400">
                              조회 {post.view_count}
                            </span>
                          </div>
                        </div>
                      ) : (
                        <PostSkeletonCard />
                      )}
                    </article>
                  );
                })
              ) : (
                <div className="col-span-full text-center py-12">
                  <p className="text-slate-500 dark:text-slate-400 text-lg">
                    {searchQuery || selectedTags.length > 0 ? '검색 결과가 없습니다.' : '아직 포스트가 없습니다.'}
                  </p>
                </div>
              )}
            </div>

            {/* 페이지네이션 */}
            {!searchQuery && selectedTags.length === 0 && totalPages > 1 && (
              <div className="mt-12">
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={handlePageChange}
                />
                
                {/* 페이지 정보 */}
                <div className="text-center mt-4 text-sm text-slate-500 dark:text-slate-400">
                  총 {totalPosts}개의 포스트 중 {((currentPage - 1) * 6) + 1}-{Math.min(currentPage * 6, totalPosts)}번째 포스트
                </div>
              </div>
            )}
          </section>
        )}


      </main>


      </div>
    </>
  );
}